/**
 * deploy.js – Deploy BahiaChampion + ArenaManager (v2) to Celo Alfajores or Mainnet
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network alfajores
 *   npx hardhat run scripts/deploy.js --network celo
 */

const { ethers, network } = require("hardhat");

// ─── Network config ───────────────────────────────────────────────────────────
const CONFIG = {
  alfajores: {
    usdt:          "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // cUSD as USDT proxy on testnet
    entryFee:      ethers.parseUnits("1",   18),   // 1 cUSD (18 dec on Alfajores)
    minStake:      ethers.parseUnits("0.5", 18),
    maxStake:      ethers.parseUnits("10",  18),
    protocolFee:   200,                            // 2%
    baseURI:       "ipfs://QmBahiaChampionsCID/",
  },
  celo: {
    // USDT on Celo Mainnet (6 decimals)
    usdt:          "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
    entryFee:      ethers.parseUnits("1",   6),   // 1 USDT (6 dec)
    minStake:      ethers.parseUnits("0.5", 6),
    maxStake:      ethers.parseUnits("50",  6),
    protocolFee:   200,
    baseURI:       "ipfs://QmBahiaChampionsCID/",
  },
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const cfg        = CONFIG[network.name];

  if (!cfg) throw new Error(`No config for network: ${network.name}`);

  console.log("─".repeat(60));
  console.log(`Network  : ${network.name}`);
  console.log(`Deployer : ${deployer.address}`);
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance  : ${ethers.formatEther(bal)} CELO`);
  console.log("─".repeat(60));

  // ── 1. Deploy BahiaChampion ───────────────────────────────────────────────
  console.log("\n[1/4] Deploying BahiaChampion (Soulbound)...");
  const Champion = await ethers.getContractFactory("BahiaChampion");
  const champion = await Champion.deploy(cfg.baseURI);
  await champion.waitForDeployment();
  const championAddr = await champion.getAddress();
  console.log(`      ✓ BahiaChampion: ${championAddr}`);

  // ── 2. Deploy ArenaManager ────────────────────────────────────────────────
  console.log("\n[2/4] Deploying ArenaManager...");
  const oracle = deployer.address; // replace with dedicated game server key in prod
  const Arena  = await ethers.getContractFactory("ArenaManager");
  const arena  = await Arena.deploy(
    cfg.usdt,
    championAddr,
    oracle,
    cfg.entryFee,
    cfg.minStake,
    cfg.maxStake,
    cfg.protocolFee,
  );
  await arena.waitForDeployment();
  const arenaAddr = await arena.getAddress();
  console.log(`      ✓ ArenaManager: ${arenaAddr}`);

  // ── 3. Wire ArenaManager into BahiaChampion ───────────────────────────────
  console.log("\n[3/4] Wiring ArenaManager into BahiaChampion...");
  await (await champion.setArenaManager(arenaAddr)).wait();
  console.log("      ✓ Done");

  // ── 4. Write addresses for frontend ──────────────────────────────────────
  console.log("\n[4/4] Writing address file for frontend...");
  const fs   = require("fs");
  const path = require("path");

  const summary = {
    network:        network.name,
    BahiaChampion:  championAddr,
    ArenaManager:   arenaAddr,
    usdt:           cfg.usdt,
    oracle:         oracle,
    entryFee:       ethers.formatUnits(cfg.entryFee, network.name === "celo" ? 6 : 18) + " USDT",
    protocolFee:    cfg.protocolFee / 100 + "%",
  };

  const outPath = path.join(__dirname, `../frontend/src/lib/contracts.${network.name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`      ✓ Written to: ${outPath}`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("─".repeat(60));
  console.log(JSON.stringify(summary, null, 2));

  // ── Optional Celoscan verify ──────────────────────────────────────────────
  if (process.env.CELOSCAN_API_KEY) {
    const { run } = require("hardhat");
    console.log("\nVerifying on Celoscan...");
    await run("verify:verify", { address: championAddr, constructorArguments: [cfg.baseURI] });
    await run("verify:verify", {
      address: arenaAddr,
      constructorArguments: [cfg.usdt, championAddr, oracle, cfg.entryFee, cfg.minStake, cfg.maxStake, cfg.protocolFee],
    });
  }
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
