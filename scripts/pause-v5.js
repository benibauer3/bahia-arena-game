/**
 * pause-v5.js — Pausa o ArenaManager v5 após migração completa.
 * Chame SOMENTE depois que todos os players foram migrados para o v6.
 *
 * Uso:
 *   node scripts/pause-v5.js
 */

require("dotenv").config();
const { ethers } = require("hardhat");

const V5_ADDRESS = "0x3e625cdF5E7A0d7Fb7eA4424323936d27C19ea58";

async function main() {
  const [owner] = await ethers.getSigners();
  const v5 = new ethers.Contract(V5_ADDRESS, [
    "function pause() external",
    "function paused() view returns (bool)",
  ], owner);

  const isPaused = await v5.paused();
  if (isPaused) {
    console.log("✓ v5 já está pausado.");
    return;
  }

  console.log("Pausando v5...");
  const tx = await v5.pause();
  await tx.wait();
  console.log("✓ v5 pausado! tx:", tx.hash);
  console.log("\nOs depositantes ainda podem chamar withdraw() mesmo com o contrato pausado.");
}

main().catch(err => { console.error(err); process.exitCode = 1; });
