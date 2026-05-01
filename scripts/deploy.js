/**
 * deploy.js — Bahia Arena v3
 * Deploys BahiaChampion + ArenaManager (Aave V3 + Monthly Ranking).
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network alfajores
 *   npx hardhat run scripts/deploy.js --network celo
 */

const { ethers, network } = require("hardhat");

// ─── Network Config ───────────────────────────────────────────────────────────
const CONFIG = {
  alfajores: {
    // cUSD on Alfajores (18 dec) — used as USDT proxy for testing
    usdt:        "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
    entryFee:    ethers.parseUnits("1", 18),   // 1 cUSD
    // Aave V3 is NOT available on Alfajores testnet → pass zero addresses
    // ArenaManager will hold funds locally (no Aave) in this mode
    aavePool:    ethers.ZeroAddress,
    aUsdt:       ethers.ZeroAddress,
    baseURI:     "ipfs://QmBahiaChampionsCID/",
  },
  celo: {
    // USDT on Celo Mainnet (6 dec)
    usdt:        "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e",
    entryFee:    ethers.parseUnits("1", 6),    // 1 USDT
    // Aave V3 on Celo Mainnet
    // Pool Proxy: https://app.aave.com/markets/?marketName=proto_celo_v3
    aavePool:    "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
    // aUSDT — obtained via pool.getReserveData(USDT).aTokenAddress
    // Set to address(0) to auto-resolve at deploy time (see step 2b below)
    aUsdt:       "", // resolved from Aave pool at deploy time
    baseURI:     "ipfs://QmBahiaChampionsCID/",
  },
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const cfg = CONFIG[network.name];
  if (!cfg) throw new Error(`No config for network: ${network.name}`);

  const isCelo = network.name === "celo";
  const bal = await ethers.provider.getBalance(deployer.address);

  console.log("─".repeat(60));
  console.log(`Network   : ${network.name}`);
  console.log(`Deployer  : ${deployer.address}`);
  console.log(`Balance   : ${ethers.formatEther(bal)} CELO`);
  console.log(`Aave      : ${cfg.aavePool === ethers.ZeroAddress ? "DISABLED (testnet)" : "ENABLED"}`);
  console.log("─".repeat(60));

  // ── 1. Deploy BahiaChampion ───────────────────────────────────────────────
  console.log("\n[1/5] Deploying BahiaChampion (Soulbound ERC-721)…");
  const Champion = await ethers.getContractFactory("BahiaChampion");
  const champion = await Champion.deploy(cfg.baseURI);
  await champion.waitForDeployment();
  const championAddr = await champion.getAddress();
  console.log(`      ✓ BahiaChampion: ${championAddr}`);

  // ── 2a. Resolve aUSDT address from Aave (mainnet only) ───────────────────
  let aUsdtAddr = ethers.ZeroAddress;
  if (isCelo && cfg.aavePool !== ethers.ZeroAddress) {
    console.log("\n[2/5] Resolving aUSDT address from Aave V3 Pool…");
    const poolAbi = ["function getReserveData(address asset) view returns (uint256,uint128,uint128,uint128,uint128,uint128,uint40,uint16,address,address,address,address,uint128,uint128,uint128)"];
    const pool = new ethers.Contract(cfg.aavePool, poolAbi, deployer);
    const data = await pool.getReserveData(cfg.usdt);
    // data[8] = aTokenAddress (index 8 in the struct tuple)
    aUsdtAddr = data[8];
    console.log(`      ✓ aUSDT resolved: ${aUsdtAddr}`);
  } else {
    console.log("\n[2/5] Skipping aUSDT resolution (Aave disabled)");
  }

  // ── 2b. Deploy ArenaManager ───────────────────────────────────────────────
  console.log("\n[3/5] Deploying ArenaManager (Aave V3 + Monthly Ranking)…");
  const oracle    = deployer.address; // replace with dedicated game server key in prod
  const treasury  = deployer.address; // replace with NIDO multisig in prod

  const Arena = await ethers.getContractFactory("ArenaManager");
  const arena = await Arena.deploy(
    cfg.usdt,
    championAddr,
    oracle,
    treasury,
    cfg.entryFee,
    cfg.aavePool === ethers.ZeroAddress ? ethers.ZeroAddress : cfg.aavePool,
    aUsdtAddr,
  );
  await arena.waitForDeployment();
  const arenaAddr = await arena.getAddress();
  console.log(`      ✓ ArenaManager: ${arenaAddr}`);

  // ── 3. Wire ArenaManager into BahiaChampion ───────────────────────────────
  console.log("\n[4/5] Wiring ArenaManager into BahiaChampion…");
  await (await champion.setArenaManager(arenaAddr)).wait();
  console.log("      ✓ Done");

  // ── 4. Write addresses for frontend ──────────────────────────────────────
  console.log("\n[5/5] Writing address file for frontend…");
  const fs   = require("fs");
  const path = require("path");

  const summary = {
    network:        network.name,
    BahiaChampion:  championAddr,
    ArenaManager:   arenaAddr,
    usdt:           cfg.usdt,
    aavePool:       cfg.aavePool === ethers.ZeroAddress ? null : cfg.aavePool,
    aUsdt:          aUsdtAddr === ethers.ZeroAddress ? null : aUsdtAddr,
    oracle:         oracle,
    treasury:       treasury,
    entryFee:       ethers.formatUnits(cfg.entryFee, isCelo ? 6 : 18) + " USDT",
    aaveEnabled:    cfg.aavePool !== ethers.ZeroAddress,
    yieldSplit:     "60% players / 40% treasury",
    monthDuration:  "30 days",
  };

  const outPath = path.join(__dirname, `../frontend/src/lib/contracts.${network.name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`      ✓ Written: ${outPath}`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("  DEPLOYMENT COMPLETE");
  console.log("═".repeat(60));
  console.log(JSON.stringify(summary, null, 2));

  // Update frontend/src/lib/contracts.ts placeholders
  const contractsTs = path.join(__dirname, "../frontend/src/lib/contracts.ts");
  let src = fs.readFileSync(contractsTs, "utf8");
  // Replace zero-address placeholders for this network
  if (network.name === "alfajores") {
    src = src.replace(
      /alfajores:\s*\{[^}]*BahiaChampion:[^"]*"[^"]*"/,
      `alfajores: {\n    BahiaChampion: "${championAddr}"`
    );
    src = src.replace(
      /alfajores:\s*\{[^}]*ArenaManager:[^"]*"[^"]*"/,
      `alfajores: {\n    ArenaManager:  "${arenaAddr}"`
    );
  } else {
    src = src.replace(
      /celo:\s*\{[^}]*BahiaChampion:[^"]*"[^"]*"/,
      `celo: {\n    BahiaChampion: "${championAddr}"`
    );
  }

  // ── Optional Celoscan verify ──────────────────────────────────────────────
  if (process.env.CELOSCAN_API_KEY) {
    const { run } = require("hardhat");
    console.log("\nVerifying on Celoscan…");
    await run("verify:verify", { address: championAddr, constructorArguments: [cfg.baseURI] });
    await run("verify:verify", {
      address: arenaAddr,
      constructorArguments: [
        cfg.usdt, championAddr, oracle, treasury,
        cfg.entryFee,
        cfg.aavePool === ethers.ZeroAddress ? ethers.ZeroAddress : cfg.aavePool,
        aUsdtAddr,
      ],
    });
  }
}

main().catch(err => { console.error(err); process.exitCode = 1; });
