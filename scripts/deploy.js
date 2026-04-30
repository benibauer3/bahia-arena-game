/**
 * deploy.js – Deploy BahiaArenaCreature + ArenaManager to Celo (Alfajores or Mainnet)
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network alfajores
 *   npx hardhat run scripts/deploy.js --network celo
 */

const { ethers, network } = require("hardhat");

// ─── Network-specific addresses ───────────────────────────────────────────────
const CONFIG = {
  alfajores: {
    cUSD:          "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
    mintPrice:     ethers.parseUnits("0.5", 18),   // 0.5 cUSD (18 dec on Alfajores)
    minStake:      ethers.parseUnits("0.1", 18),
    maxStake:      ethers.parseUnits("10",  18),
    protocolFee:   200,                             // 2%
    baseTokenURI:  "ipfs://QmPlaceholderCID/",
  },
  celo: {
    cUSD:          "0x765DE816845861e75A25fCA122bb6898B8B1282a",
    mintPrice:     ethers.parseUnits("1",   18),   // 1 cUSD
    minStake:      ethers.parseUnits("0.5", 18),
    maxStake:      ethers.parseUnits("50",  18),
    protocolFee:   200,
    baseTokenURI:  "ipfs://QmBahiaArenaCreaturesCID/",
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

  // ── 1. Deploy BahiaArenaCreature ─────────────────────────────────────────
  console.log("\n[1/3] Deploying BahiaArenaCreature...");
  const Creature = await ethers.getContractFactory("BahiaArenaCreature");
  const creature = await Creature.deploy(cfg.cUSD, cfg.mintPrice, cfg.baseTokenURI);
  await creature.waitForDeployment();
  const creatureAddr = await creature.getAddress();
  console.log(`      ✓ BahiaArenaCreature: ${creatureAddr}`);

  // ── 2. Deploy ArenaManager ───────────────────────────────────────────────
  console.log("\n[2/3] Deploying ArenaManager...");
  const oracle = deployer.address; // replace with game server address in prod
  const Arena  = await ethers.getContractFactory("ArenaManager");
  const arena  = await Arena.deploy(
    creatureAddr,
    cfg.cUSD,
    oracle,
    cfg.protocolFee,
    cfg.minStake,
    cfg.maxStake,
  );
  await arena.waitForDeployment();
  const arenaAddr = await arena.getAddress();
  console.log(`      ✓ ArenaManager:       ${arenaAddr}`);

  // ── 3. Wire up: set ArenaManager in Creature contract ───────────────────
  console.log("\n[3/3] Setting ArenaManager on Creature contract...");
  const tx = await creature.setArenaManager(arenaAddr);
  await tx.wait();
  console.log("      ✓ ArenaManager wired");

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("─".repeat(60));
  const summary = {
    network:               network.name,
    BahiaArenaCreature:    creatureAddr,
    ArenaManager:          arenaAddr,
    paymentToken:          cfg.cUSD,
    oracle:                oracle,
    mintPrice:             ethers.formatUnits(cfg.mintPrice, 18) + " cUSD",
    protocolFee:           cfg.protocolFee / 100 + "%",
  };
  console.log(JSON.stringify(summary, null, 2));

  // ── Write addresses file for frontend ────────────────────────────────────
  const fs   = require("fs");
  const path = require("path");
  const outPath = path.join(__dirname, `../frontend/src/lib/contracts.${network.name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`\nAddresses written to: ${outPath}`);

  // ── Verify on Celoscan (optional) ────────────────────────────────────────
  if (process.env.CELOSCAN_API_KEY) {
    console.log("\nVerifying contracts on Celoscan...");
    const { run } = require("hardhat");
    await run("verify:verify", {
      address: creatureAddr,
      constructorArguments: [cfg.cUSD, cfg.mintPrice, cfg.baseTokenURI],
    });
    await run("verify:verify", {
      address: arenaAddr,
      constructorArguments: [creatureAddr, cfg.cUSD, oracle, cfg.protocolFee, cfg.minStake, cfg.maxStake],
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
