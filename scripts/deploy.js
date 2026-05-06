/**
 * deploy.js — Bahia Arena v5
 *
 * Deploys ArenaManager only (no NFTs — champions are pure game logic).
 * Constructor: (address _usdt, address _aavePool, address _aUSDT, address _treasury)
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network alfajores
 *   npx hardhat run scripts/deploy.js --network celo
 */

const { ethers, network } = require("hardhat");
const fs   = require("fs");
const path = require("path");

// ─── Network Config ───────────────────────────────────────────────────────────
const CONFIG = {
  alfajores: {
    usdt:     "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // cUSD testnet (18 dec)
    aavePool: ethers.ZeroAddress,                            // Aave not on testnet
    aUsdt:    ethers.ZeroAddress,
  },
  celo: {
    usdt:     "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", // USDT mainnet (6 dec)
    aavePool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD", // Aave V3 Pool Proxy
    aUsdt:    "",                                            // resolved from pool below
  },
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const cfg = CONFIG[network.name];
  if (!cfg) throw new Error(`No config for network: ${network.name}`);

  const isCelo = network.name === "celo";
  const bal    = await ethers.provider.getBalance(deployer.address);

  console.log("─".repeat(60));
  console.log(`Network   : ${network.name}`);
  console.log(`Deployer  : ${deployer.address}`);
  console.log(`Balance   : ${ethers.formatEther(bal)} CELO`);
  console.log(`Aave      : ${cfg.aavePool === ethers.ZeroAddress ? "DISABLED (testnet)" : "ENABLED ✓"}`);
  console.log("─".repeat(60));

  if (isCelo && parseFloat(ethers.formatEther(bal)) < 0.05) {
    throw new Error("Insufficient CELO for gas. Fund deployer with at least 0.05 CELO.");
  }

  // ── 1. Resolve aUSDT address from Aave pool ───────────────────────────────
  let aUsdtAddr = ethers.ZeroAddress;
  if (isCelo && cfg.aavePool !== ethers.ZeroAddress) {
    console.log("\n[1/3] Resolving aUSDT from Aave V3 Pool...");
    const poolAbi = [
      "function getReserveData(address asset) view returns (uint256,uint128,uint128,uint128,uint128,uint128,uint40,uint16,address,address,address,address,uint128,uint128,uint128)"
    ];
    const pool = new ethers.Contract(cfg.aavePool, poolAbi, deployer);
    try {
      const data = await pool.getReserveData(cfg.usdt);
      aUsdtAddr  = data[8]; // index 8 = aTokenAddress in ReserveData struct
      console.log(`      ✓ aUSDT resolved: ${aUsdtAddr}`);
    } catch (e) {
      console.warn(`      ⚠ Could not resolve aUSDT (${e.message}). Deploying without Aave.`);
      aUsdtAddr = ethers.ZeroAddress;
    }
  } else {
    console.log("\n[1/3] Skipping aUSDT resolution (Aave disabled on testnet)");
  }

  // ── 2. Deploy ArenaManager ────────────────────────────────────────────────
  const treasury = process.env.TREASURY_ADDRESS || deployer.address;
  if (treasury === deployer.address) {
    console.log("\n      ⚠  TREASURY = deployer. Set TREASURY_ADDRESS in .env for production.");
  }

  console.log("\n[2/3] Deploying ArenaManager...");
  const Arena = await ethers.getContractFactory("ArenaManager");
  const arena = await Arena.deploy(
    cfg.usdt,
    cfg.aavePool === ethers.ZeroAddress ? ethers.ZeroAddress : cfg.aavePool,
    aUsdtAddr,
    treasury
  );
  await arena.waitForDeployment();
  const arenaAddr = await arena.getAddress();
  console.log(`      ✓ ArenaManager: ${arenaAddr}`);
  console.log(`      ✓ Tx hash:      ${arena.deploymentTransaction()?.hash}`);

  // ── 3. Write results ──────────────────────────────────────────────────────
  console.log("\n[3/3] Writing artifacts...");

  const summary = {
    network:       network.name,
    ArenaManager:  arenaAddr,
    usdt:          cfg.usdt,
    aavePool:      cfg.aavePool === ethers.ZeroAddress ? null : cfg.aavePool,
    aUsdt:         aUsdtAddr === ethers.ZeroAddress ? null : aUsdtAddr,
    treasury,
    aaveEnabled:   aUsdtAddr !== ethers.ZeroAddress,
    entryFee:      isCelo ? "1 USDT (6 decimals)" : "1 cUSD (18 decimals)",
    yieldSplit:    "60% players / 40% treasury",
    monthDuration: "30 days",
    deployedAt:    new Date().toISOString(),
    txHash:        arena.deploymentTransaction()?.hash ?? "n/a",
  };

  // Save JSON artifact
  const artifactDir = path.join(__dirname, "../artifacts");
  fs.mkdirSync(artifactDir, { recursive: true });
  const outJson = path.join(artifactDir, `deploy.${network.name}.json`);
  fs.writeFileSync(outJson, JSON.stringify(summary, null, 2));
  console.log(`      ✓ Saved: ${outJson}`);

  // Patch frontend/src/lib/contracts.ts
  const contractsTsPath = path.join(__dirname, "../frontend/src/lib/contracts.ts");
  if (fs.existsSync(contractsTsPath)) {
    let src = fs.readFileSync(contractsTsPath, "utf8");
    // Replace ArenaManager address for this network using a targeted regex
    const netRe = new RegExp(
      `(${network.name}[\\s\\S]*?ArenaManager:\\s*)"0x[0-9a-fA-F]{40}"`
    );
    if (netRe.test(src)) {
      src = src.replace(netRe, `$1"${arenaAddr}"`);
      fs.writeFileSync(contractsTsPath, src);
      console.log("      ✓ Patched frontend/src/lib/contracts.ts");
    } else {
      console.log("      ⚠ Could not auto-patch contracts.ts — update manually.");
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("  ✅  DEPLOY COMPLETE");
  console.log("═".repeat(60));
  console.log(JSON.stringify(summary, null, 2));

  if (isCelo) {
    console.log(`\n🔍 View on Celoscan:`);
    console.log(`   https://celoscan.io/address/${arenaAddr}`);
    console.log(`\n📋 Manual verify command:`);
    console.log(`   npx hardhat verify --network celo ${arenaAddr} "${cfg.usdt}" "${cfg.aavePool === ethers.ZeroAddress ? ethers.ZeroAddress : cfg.aavePool}" "${aUsdtAddr}" "${treasury}"`);
  }
}

main().catch(err => { console.error(err); process.exitCode = 1; });
