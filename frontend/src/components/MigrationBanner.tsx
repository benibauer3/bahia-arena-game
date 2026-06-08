/**
 * MigrationBanner.tsx
 *
 * Detecta automaticamente se a wallet conectada tem depósito no contrato v5
 * e ainda não migrou para o v6. Guia o usuário pelos 3 passos:
 *
 *   1. Sacar do v5 (withdraw)
 *   2. Aprovar USDT para o v6
 *   3. Depositar no v6 (Tier 4 — 1 USDT → Aave V3)
 */

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import {
  ACTIVE_CONTRACTS, ARENA_ABI,
  ARENA_V5_ADDRESS, ARENA_V5_ABI,
  ERC20_ABI,
} from "@/lib/contracts";

type Step = "idle" | "withdrawing" | "approving" | "depositing" | "done" | "error" | string;

export default function MigrationBanner() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [step,    setStep]    = useState<Step>("idle");
  const [errMsg,  setErrMsg]  = useState("");
  const [dismissed, setDismissed] = useState(false);

  // ── Check v5 deposit ────────────────────────────────────────────────────────
  const { data: v5Deposit, isLoading: loadingV5, refetch: refetchV5 } = useReadContract({
    address: ARENA_V5_ADDRESS,
    abi:     ARENA_V5_ABI,
    functionName: "deposits",
    args:    address ? [address] : undefined,
    query:   { enabled: !!address },
  });

  // ── Check v6 deposit ────────────────────────────────────────────────────────
  const { data: v6HasDeposit, isLoading: loadingV6, refetch: refetchV6 } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi:     ARENA_ABI,
    functionName: "hasDeposit",
    args:    address ? [address] : undefined,
    query:   { enabled: !!address },
  });

  // ── USDT allowance for v6 ───────────────────────────────────────────────────
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: ACTIVE_CONTRACTS.usdt,
    abi:     ERC20_ABI,
    functionName: "allowance",
    args:    address ? [address, ACTIVE_CONTRACTS.ArenaManager] : undefined,
    query:   { enabled: !!address },
  });

  // Not ready yet
  if (!address || loadingV5 || loadingV6) return null;

  const v5Amount = (v5Deposit as bigint | undefined) ?? 0n;
  const hasV5    = v5Amount > 0n;
  const hasV6    = !!v6HasDeposit;

  // Nothing to show
  if (!hasV5 || hasV6 || dismissed || step === "done") return null;

  const TIER4 = BigInt(1_000_000); // 1 USDT — v6 Tier 4
  const needsApproval = ((allowance as bigint | undefined) ?? 0n) < TIER4;

  const handleMigrate = async () => {
    if (!address) return;
    setErrMsg("");

    try {
      // ── Step 1: withdraw from v5 ─────────────────────────────────────────
      setStep("withdrawing");
      await writeContractAsync({
        address:      ARENA_V5_ADDRESS,
        abi:          ARENA_V5_ABI,
        functionName: "withdraw",
        args:         [],
      });
      await refetchV5();

      // ── Step 2: approve USDT for v6 ─────────────────────────────────────
      if (needsApproval) {
        setStep("approving");
        await writeContractAsync({
          address:      ACTIVE_CONTRACTS.usdt,
          abi:          ERC20_ABI,
          functionName: "approve",
          args:         [ACTIVE_CONTRACTS.ArenaManager, TIER4],
        });
        await refetchAllowance();
      }

      // ── Step 3: deposit to v6 ───────────────────────────────────────────
      setStep("depositing");
      await writeContractAsync({
        address:      ACTIVE_CONTRACTS.ArenaManager,
        abi:          ARENA_ABI,
        functionName: "deposit",
        args:         [TIER4],
      });
      await refetchV6();

      setStep("done");
    } catch (e: any) {
      setStep("error");
      setErrMsg(e.shortMessage ?? e.message ?? "Transaction failed");
    }
  };

  // ── Step labels ──────────────────────────────────────────────────────────────
  const STEPS = [
    { id: "withdrawing", label: "Saque do v5",     icon: "1️⃣" },
    { id: "approving",   label: "Aprovar USDT",    icon: "2️⃣" },
    { id: "depositing",  label: "Depositar no v6", icon: "3️⃣" },
  ];

  const activeIdx = STEPS.findIndex(s => s.id === step);
  const busy      = ["withdrawing", "approving", "depositing"].includes(step);

  return (
    <div className="mx-4 mb-4 rounded-2xl border border-amber-500/40 bg-amber-950/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-3.5 pb-2.5">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">⚡</span>
          <div>
            <p className="text-amber-300 font-bold text-sm leading-tight">
              Migração disponível
            </p>
            <p className="text-amber-300/60 text-xs mt-0.5">
              Você tem <span className="font-bold text-amber-300">1 USDT</span> no contrato antigo.
              Mova para o v6 e continue ganhando yield no Aave V3.
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-500/50 hover:text-amber-300 transition-colors text-lg leading-none ml-2 mt-0.5 shrink-0"
        >
          ×
        </button>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-0 px-4 pb-3">
        {STEPS.map((s, i) => {
          const done    = activeIdx > i || step === "done";
          const active  = activeIdx === i;
          const pending = activeIdx < i && step !== "done";
          return (
            <div key={s.id} className="flex items-center flex-1 min-w-0">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all
                ${done   ? "bg-amber-500/20 text-amber-300"  : ""}
                ${active ? "bg-amber-500/30 text-amber-200 animate-pulse" : ""}
                ${pending ? "text-amber-500/30" : ""}
              `}>
                {done
                  ? <span className="text-xs">✓</span>
                  : active
                    ? <span className="w-3 h-3 rounded-full border border-amber-300 border-t-transparent animate-spin inline-block" />
                    : <span>{s.icon}</span>
                }
                <span className="truncate">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-1 ${done ? "bg-amber-500/40" : "bg-amber-500/15"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {step === "error" && errMsg && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-red-950/40 border border-red-500/30">
          <p className="text-red-400 text-xs">{errMsg}</p>
          <button
            onClick={() => setStep("idle")}
            className="text-[10px] text-red-400 underline mt-1"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* CTA */}
      <div className="px-4 pb-4">
        <button
          onClick={handleMigrate}
          disabled={busy}
          className="w-full py-3 rounded-xl font-bold text-sm active:scale-95 transition-all disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "#000",
            boxShadow: busy ? "none" : "0 4px 16px rgba(245,158,11,0.3)",
          }}
        >
          {step === "idle"        && "⚡ Migrar 1 USDT para o v6"}
          {step === "withdrawing" && "⏳ Sacando do v5…"}
          {step === "approving"   && "⏳ Aprovando USDT…"}
          {step === "depositing"  && "⏳ Depositando no v6…"}
          {step === "error"       && "⚡ Tentar novamente"}
        </button>
        <p className="text-[10px] text-amber-500/40 text-center mt-2">
          3 transações · Seu 1 USDT vai direto para o Aave V3 pelo novo contrato
        </p>
      </div>
    </div>
  );
}
