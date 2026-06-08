/**
 * migrate-v5-to-v6.js — Migrar depósitos do ArenaManager v5 → v6
 *
 * Pré-requisitos:
 *  1. .env com PRIVATE_KEY da wallet owner (0x23bc4C…)
 *  2. V6_ADDRESS definido abaixo após o deploy
 *  3. Wallet owner precisa ter USDT suficiente para cobrir os depósitos
 *     a migrar (ou os depositantes sacam do v5 e o owner recebe de volta)
 *
 * Uso:
 *   node scripts/migrate-v5-to-v6.js
 */

require("dotenv").config();
const { ethers } = require("hardhat");

// ─── Configurar aqui ──────────────────────────────────────────────────────────

const V5_ADDRESS = "0x3e625cdF5E7A0d7Fb7eA4424323936d27C19ea58";
const V6_ADDRESS = ""; // ← PREENCHER após deploy do v6

// Wallets a migrar: endereço → tier desejado (1–4)
// Tier 4 = 1 USDT → Aave V3 + reward mensal
const PLAYERS_TO_MIGRATE = [
  // { address: "0xABC...", tier: 4 },
  // { address: "0xDEF...", tier: 4 },
  // { address: "0xGHI...", tier: 4 },
];

const USDT = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";

const TIER_AMOUNTS = {
  1: 250_000n,    // 0.25 USDT
  2: 500_000n,    // 0.50 USDT
  3: 750_000n,    // 0.75 USDT
  4: 1_000_000n,  // 1.00 USDT
};

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  if (!V6_ADDRESS) {
    console.error("❌ V6_ADDRESS não definido. Faça o deploy do v6 primeiro.");
    process.exit(1);
  }
  if (PLAYERS_TO_MIGRATE.length === 0) {
    console.error("❌ PLAYERS_TO_MIGRATE está vazio. Adicione os endereços a migrar.");
    process.exit(1);
  }

  const [owner] = await ethers.getSigners();
  console.log("Owner:", owner.address);

  const usdtAbi = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
  ];

  const v5Abi = [
    "function deposits(address) view returns (uint256)",
    "function emergencyWithdrawFromAave() external",
    "function pause() external",
  ];

  const v6Abi = [
    "function adminCredit(address player, uint256 tierAmount) external",
    "function deposits(address) view returns (uint256)",
    "function depositTier(address) view returns (uint8)",
    "function totalDeposits() view returns (uint256)",
  ];

  const usdt = new ethers.Contract(USDT, usdtAbi, owner);
  const v5   = new ethers.Contract(V5_ADDRESS, v5Abi, owner);
  const v6   = new ethers.Contract(V6_ADDRESS, v6Abi, owner);

  // ── Passo 1: Verificar saldos ──────────────────────────────────────────────
  console.log("\n── Passo 1: Verificar estado ────────────────────────────────");

  const ownerUsdt = await usdt.balanceOf(owner.address);
  console.log(`USDT do owner: ${Number(ownerUsdt) / 1e6} USDT`);

  let totalNeeded = 0n;
  for (const p of PLAYERS_TO_MIGRATE) {
    const already = await v6.deposits(p.address).catch(() => 0n);
    const tierAmt = TIER_AMOUNTS[p.tier];
    const topUp   = tierAmt - (already ?? 0n);
    totalNeeded  += topUp;
    const v5Dep   = await v5.deposits(p.address).catch(() => 0n);
    console.log(`  ${p.address} — v5 deposit: ${Number(v5Dep)/1e6} USDT, v6 topup needed: ${Number(topUp)/1e6} USDT, tier: ${p.tier}`);
  }

  console.log(`\nTotal USDT necessário: ${Number(totalNeeded) / 1e6} USDT`);

  if (ownerUsdt < totalNeeded) {
    console.error(`\n❌ Owner não tem USDT suficiente.`);
    console.error(`   Tem: ${Number(ownerUsdt)/1e6} USDT | Precisa: ${Number(totalNeeded)/1e6} USDT`);
    console.error(`   Saque os depósitos do v5 primeiro para ter o USDT.`);
    process.exit(1);
  }

  // ── Passo 2: Aprovar USDT para o v6 ───────────────────────────────────────
  console.log("\n── Passo 2: Aprovar USDT para v6 ────────────────────────────");
  const allowance = await usdt.allowance(owner.address, V6_ADDRESS);
  if (allowance < totalNeeded) {
    console.log("Aprovando USDT...");
    const tx = await usdt.approve(V6_ADDRESS, totalNeeded);
    await tx.wait();
    console.log("✓ Aprovado:", tx.hash);
  } else {
    console.log("✓ Allowance já suficiente");
  }

  // ── Passo 3: adminCredit para cada player ─────────────────────────────────
  console.log("\n── Passo 3: Migrar players ──────────────────────────────────");

  for (const p of PLAYERS_TO_MIGRATE) {
    const already = await v6.deposits(p.address).catch(() => 0n);
    const tierAmt = TIER_AMOUNTS[p.tier];

    if ((already ?? 0n) >= tierAmt) {
      console.log(`  ✓ ${p.address} já no v6 (tier ${p.tier}), skipping`);
      continue;
    }

    console.log(`  Migrando ${p.address} → Tier ${p.tier} (${Number(tierAmt)/1e6} USDT)...`);
    const tx = await v6.adminCredit(p.address, tierAmt);
    await tx.wait();
    console.log(`  ✓ Migrado! tx: ${tx.hash}`);
  }

  // ── Passo 4: Verificar resultado ──────────────────────────────────────────
  console.log("\n── Passo 4: Verificar v6 ─────────────────────────────────────");
  const v6Total = await v6.totalDeposits();
  console.log(`totalDeposits no v6: ${Number(v6Total)/1e6} USDT`);

  for (const p of PLAYERS_TO_MIGRATE) {
    const dep  = await v6.deposits(p.address);
    const tier = await v6.depositTier(p.address);
    console.log(`  ${p.address}: ${Number(dep)/1e6} USDT, tier ${tier}`);
  }

  console.log("\n✅ Migração completa!");
  console.log("\nPróximos passos:");
  console.log("1. Pause o v5: npx hardhat run scripts/pause-v5.js --network celo");
  console.log("2. Avise os depositantes que o v5 foi encerrado e podem sacar com withdraw()");
  console.log("3. Atualize o frontend com o novo endereço do v6");
}

main().catch(err => { console.error(err); process.exitCode = 1; });
