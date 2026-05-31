/**
 * deploy.ts — Bahia Arena v5
 * Deploys BahiaChampion + ArenaManager (Aave V3 + Monthly Ranking + Daily Check-in + Challenges).
 *
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network alfajores
 *   npx hardhat run scripts/deploy.ts --network celo
 */

import { ethers, network } from "hardhat";

// ─── Celo Mainnet Addresses ───────────────────────────────────────────────────
// USDT on Celo Mainnet (6 decimals)
const CELO_USDT  = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";
// Aave V3 Pool Proxy on Celo Mainnet
const AAVE_POOL  = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
// aUSDT on Celo Aave V3 (resolved dynamically below, but kept as fallback)
const A_USDT_FALLBACK = "0x4d4b4A13B5A57a2bAF3A89d00B78f6c58c2E2B35";

// ─── Alfajores Testnet Addresses ──────────────────────────────────────────────
const ALFAJORES_USDT = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // cUSD (18 dec)

interface NetworkConfig {
  usdt:     string;
  aavePool: string;
  aUsdt:    string;
  baseURI:  string;
}

const CONFIG: Record<string, NetworkConfig> = {
  alfajores: {
    usdt:     ALFAJORES_USDT,
    aavePool: ethers.ZeroAddress,  // Aave V3 not on Alfajores
    aUsdt:    ethers.ZeroAddress,
    baseURI:  "ipfs://QmBahiaChampionsCID/",
  },
  celo: {
    usdt:     CELO_USDT,
    aavePool: AAVE_POOL,
    aUsdt:    "",  // resolved from Aave at deploy time
    baseURI:  "ipfs://QmBahiaChampionsCID/",
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

  // ── 1. Deploy BahiaChampion ──────────────────────────────────────────────
  console.log("\n[1/4] Deploying BahiaChampion (Soulbound ERC-721)…");
  const Champion = await ethers.getContractFactory("BahiaChampion");
  const champion = await Champion.deploy(cfg.baseURI);
  await champion.waitForDeployment();
  const championAddr = await champion.getAddress();
  console.log(`      ✓ BahiaChampion: ${championAddr}`);

  // ── 2. Resolve aUSDT from Aave (mainnet only) ────────────────────────────
  let aUsdtAddr = ethers.ZeroAddress;
  if (isCelo && cfg.aavePool !== ethers.ZeroAddress) {
    console.log("\n[2/4] Resolving aUSDT address from Aave V3 Pool…");
    const poolAbi = [
      "function getReserveData(address asset) view returns (uint256,uint128,uint128,uint128,uint128,uint128,uint40,uint16,address,address,address,address,uint128,uint128,uint128)"
    ];
    const pool = new ethers.Contract(cfg.aavePool, poolAbi, deployer);
    const data = await pool.getReserveData(cfg.usdt);
    aUsdtAddr = data[8]; // aTokenAddress is index 8
    console.log(`      ✓ aUSDT resolved: ${aUsdtAddr}`);
    if (aUsdtAddr === ethers.ZeroAddress) {
      console.log(`      ⚠ Fallback to hardcoded: ${A_USDT_FALLBACK}`);
      aUsdtAddr = A_USDT_FALLBACK;
    }
  } else {
    console.log("\n[2/4] Skipping aUSDT resolution (Aave disabled on testnet)");
  }

  // ── 3. Deploy ArenaManager ───────────────────────────────────────────────
  console.log("\n[3/4] Deploying ArenaManager v6 (tiered deposits)…");
  const treasury = deployer.address; // TODO: update to NIDO multisig after deploy

  const ArenaManager = await ethers.getContractFactory("ArenaManager");
  const arena = await ArenaManager.deploy(
    cfg.usdt,
    cfg.aavePool,
    aUsdtAddr,
    treasury,
  );
  await arena.waitForDeployment();
  const arenaAddr = await arena.getAddress();
  console.log(`      ✓ ArenaManager: ${arenaAddr}`);

  // ── 4. Wire ArenaManager into BahiaChampion ──────────────────────────────
  console.log("\n[4/4] Wiring ArenaManager into BahiaChampion…");
  await (await champion.setArenaManager(arenaAddr)).wait();
  console.log("      ✓ Done");

  // ── Summary ───────────────────────────────────────────────────────────────
  const summary = {
    network:       network.name,
    BahiaChampion: championAddr,
    ArenaManager:  arenaAddr,
    usdt:          cfg.usdt,
    aavePool:      cfg.aavePool === ethers.ZeroAddress ? null : cfg.aavePool,
    aUsdt:         aUsdtAddr === ethers.ZeroAddress ? null : aUsdtAddr,
    treasury:      treasury,
    aaveEnabled:   cfg.aavePool !== ethers.ZeroAddress,
    entryFee:      "1 USDT (hardcoded in contract)",
    yieldSplit:    "60% players / 40% treasury",
    monthDuration: "30 days",
    newFeatures:   ["dailyCheckIn", "createChallenge", "acceptChallenge", "resolveChallenge", "recordBattle", "Pausable", "Ownable2Step"],
  };

  console.log("\n" + "═".repeat(60));
  console.log("  DEPLOYMENT COMPLETE — ArenaManager v5");
  console.log("═".repeat(60));
  console.log(JSON.stringify(summary, null, 2));

  console.log("\nUpdate frontend/src/lib/contracts.ts with:");
  console.log(`  ${network.name}.ArenaManager: "${arenaAddr}"`);
  console.log(`  ${network.name}.BahiaChampion: "${championAddr}"`);

  // ── Optional Celoscan verify ──────────────────────────────────────────────
  if (process.env.CELOSCAN_API_KEY) {
    const { run } = await import("hardhat");
    console.log("\nVerifying on Celoscan…");
    try {
      await run("verify:verify", { address: championAddr, constructorArguments: [cfg.baseURI] });
    } catch (e) { console.error("Champion verify failed:", e); }
    try {
      await run("verify:verify", {
        address: arenaAddr,
        constructorArguments: [cfg.usdt, cfg.aavePool, aUsdtAddr, treasury],
      });
    } catch (e) { console.error("Arena verify failed:", e); }
  }
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
