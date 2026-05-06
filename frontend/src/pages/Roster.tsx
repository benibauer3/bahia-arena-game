import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { Link } from "react-router-dom";
import { CHAMPIONS, type ChampionDef } from "@/lib/champions";
import { ACTIVE_CONTRACTS, ARENA_ABI, CHAMPION_ABI, ERC20_ABI } from "@/lib/contracts";
import ChampionCard from "@/components/ChampionCard";
import { ChampionArt } from "@/components/ChampionArt";
import { useRequireCelo } from "@/hooks/useRequireCelo";

// ─── Deposit Widget (3-state) ─────────────────────────────────────────────────
function DepositWidget() {
  const { address, isConnected } = useAccount();
  const { isCorrectChain, switchToCelo, isSwitching } = useRequireCelo();
  const [status, setStatus] = useState<
    "idle" | "approving" | "approved" | "depositing" | "done" | "withdrawing" | "error"
  >("idle");
  const [errMsg, setErrMsg] = useState("");

  const { data: entryFee } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi: ARENA_ABI,
    functionName: "ENTRY_FEE",
  });

  const { data: usdtBalance } = useReadContract({
    address: ACTIVE_CONTRACTS.usdt,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: hasDeposit, refetch: refetchDeposit } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi: ARENA_ABI,
    functionName: "hasDeposit",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 8_000 },
  });

  const { writeContractAsync } = useWriteContract();

  // Format fee: USDT is 6 decimals on mainnet
  const fee = (entryFee as bigint | undefined) ?? 1_000_000n;
  const fmtFee = fee ? (Number(fee) / 1e6).toFixed(2) : "1.00";
  const fmtBalance = usdtBalance !== undefined
    ? (Number(usdtBalance as bigint) / 1e6).toFixed(2)
    : "—";

  const isLoading = ["approving", "depositing", "withdrawing"].includes(status);

  const handleDeposit = async () => {
    setStatus("approving");
    setErrMsg("");
    try {
      // Guarantee we're on Celo before any tx
      await switchToCelo();

      await writeContractAsync({
        address: ACTIVE_CONTRACTS.usdt,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [ACTIVE_CONTRACTS.ArenaManager, fee],
      });
      setStatus("approved");
      setStatus("depositing");
      await writeContractAsync({
        address: ACTIVE_CONTRACTS.ArenaManager,
        abi: ARENA_ABI,
        functionName: "deposit",
        args: [],
      });
      setStatus("done");
      refetchDeposit();
    } catch (e: unknown) {
      const err = e as { shortMessage?: string; message?: string };
      setErrMsg(err.shortMessage ?? err.message ?? "Unknown error");
      setStatus("error");
    }
  };

  const handleWithdraw = async () => {
    setStatus("withdrawing");
    setErrMsg("");
    try {
      // Guarantee we're on Celo before withdraw
      await switchToCelo();

      await writeContractAsync({
        address: ACTIVE_CONTRACTS.ArenaManager,
        abi: ARENA_ABI,
        functionName: "withdraw",
        args: [],
      });
      setStatus("idle");
      refetchDeposit();
    } catch (e: unknown) {
      const err = e as { shortMessage?: string; message?: string };
      setErrMsg(err.shortMessage ?? err.message ?? "Unknown error");
      setStatus("error");
    }
  };

  // ── State C: not connected ─────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="rounded-2xl bg-arena-surface border border-arena-border p-5 mb-6 text-center">
        <p className="text-sm font-semibold mb-3">Connect Wallet to Enter</p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm active:scale-95 transition-transform"
        >
          Connect Wallet
        </Link>
      </div>
    );
  }

  // ── Wrong network banner ───────────────────────────────────────────────────
  if (!isCorrectChain) {
    return (
      <div className="rounded-2xl bg-orange-950/40 border border-orange-500/50 p-5 mb-6 text-center">
        <p className="text-xl mb-2">⚠️</p>
        <p className="text-sm font-bold text-orange-400 mb-1">Wrong Network</p>
        <p className="text-xs text-arena-muted mb-4">
          Switch to Celo to deposit and play
        </p>
        <button
          onClick={switchToCelo}
          disabled={isSwitching}
          className="px-5 py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-sm disabled:opacity-60 active:scale-95 transition-transform flex items-center gap-2 mx-auto"
        >
          {isSwitching
            ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Switching…</>
            : "🔀 Switch to Celo"
          }
        </button>
      </div>
    );
  }

  // ── State B: has deposit ───────────────────────────────────────────────────
  if (hasDeposit || status === "done") {
    return (
      <div className="rounded-2xl bg-green-900/25 border border-green-600/40 p-5 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🏦</span>
          <div>
            <p className="text-sm font-bold text-green-400">
              {fmtFee} USDT earning in Aave V3
            </p>
            <p className="text-xs text-arena-muted">Your funds are working while you play</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-3 text-xs text-green-300/80">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
          Earning yield automatically
        </div>
        <button
          onClick={handleWithdraw}
          disabled={isLoading}
          className="text-xs text-arena-muted underline underline-offset-2 disabled:opacity-50"
        >
          {status === "withdrawing" ? "Withdrawing…" : `Withdraw ${fmtFee} USDT`}
        </button>
        {status === "error" && (
          <p className="mt-2 text-xs text-arena-danger">{errMsg}</p>
        )}
      </div>
    );
  }

  // ── State A: no deposit ────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl bg-arena-surface border border-arena-border p-5 mb-6">
      <p className="text-sm font-bold mb-1">🎮 Enter the Arena</p>
      <p className="text-xs text-arena-muted mb-1">
        Your {fmtFee} USDT goes into Aave V3 — earning yield while you play
      </p>
      <div className="flex items-center gap-2 mb-4 text-xs text-arena-muted">
        <span>🏦</span>
        <span>Earning yield automatically</span>
      </div>

      {/* USDT balance hint */}
      <p className="text-[10px] text-arena-muted mb-3">
        Wallet USDT: {fmtBalance}
      </p>

      {/* Step progress */}
      {/* Step progress indicators — read via a stable ref to avoid TS narrowing */}
      {(() => {
        const s = status as string;
        const approvedDone = s === "approved" || s === "depositing" || s === "done";
        const depositDone  = s === "done";
        return (
          <div className="flex items-center gap-2 mb-3 text-[10px]">
            <div className={`flex items-center gap-1 font-semibold ${
              s === "approving" ? "text-arena-primary" :
              approvedDone      ? "text-arena-success" :
              "text-arena-muted"
            }`}>
              {approvedDone ? "✓" :
               s === "approving" ? (
                 <span className="inline-block w-3 h-3 border-2 border-arena-primary border-t-transparent rounded-full animate-spin" />
               ) : "1"}
              {" "}Approve USDT
            </div>
            <span className="text-arena-border">→</span>
            <div className={`flex items-center gap-1 font-semibold ${
              s === "depositing" ? "text-arena-primary" :
              depositDone        ? "text-arena-success" :
              "text-arena-muted"
            }`}>
              {depositDone ? "✓" :
               s === "depositing" ? (
                 <span className="inline-block w-3 h-3 border-2 border-arena-primary border-t-transparent rounded-full animate-spin" />
               ) : "2"}
              {" "}Deposit to Arena
            </div>
          </div>
        );
      })()}

      <button
        onClick={handleDeposit}
        disabled={isLoading}
        className="w-full py-3 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm disabled:opacity-50 active:scale-95 transition-transform shadow-lg shadow-arena-primary/20"
      >
        {status === "approving"  ? "Approving USDT…"
        : status === "approved"  ? "Approved ✓"
        : status === "depositing" ? "Depositing to Aave…"
        : `Deposit ${fmtFee} USDT`}
      </button>

      {status === "error" && (
        <p className="mt-2 text-xs text-arena-danger text-center">{errMsg}</p>
      )}
    </div>
  );
}

// ─── Full detail modal ────────────────────────────────────────────────────────
function ChampionDetailModal({ c, onClose }: { c: ChampionDef; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full bg-arena-surface rounded-t-3xl p-5 pb-8 max-w-md mx-auto border-t-2 ${c.borderColor}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-arena-border rounded-full mx-auto mb-4" />

        {/* Hero art */}
        <div className="flex items-center gap-4 mb-4">
          <div className={`rounded-2xl p-2 bg-gradient-to-b ${c.color} border ${c.borderColor}`}>
            <ChampionArt class_={c.class} size={90} animated={true} />
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold">{c.name}</p>
            <p className={`text-sm font-semibold mb-1 ${c.borderColor.replace("border-","text-")}`}>{c.role}</p>
            <div className="px-2 py-1 rounded-lg bg-arena-bg/60 border border-arena-border inline-block">
              <p className="text-xs text-arena-primary font-semibold">✦ {c.abilityName}</p>
            </div>
          </div>
        </div>

        {/* Ability description */}
        <div className={`p-3 rounded-xl bg-gradient-to-r ${c.color} border ${c.borderColor} mb-4`}>
          <p className="text-xs font-semibold mb-0.5">Ability: {c.abilityName}</p>
          <p className="text-xs text-arena-muted">{c.abilityDesc}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          {[
            { label: "HP",      value: c.maxHp,    icon: "❤️",  color: "text-arena-success" },
            { label: "Attack",  value: c.attack,   icon: "⚔️",  color: "text-arena-danger"  },
            { label: "Defense", value: c.defense,  icon: "🛡️",  color: "text-arena-info"    },
            { label: "Speed",   value: c.speed,    icon: "💨",  color: "text-arena-primary" },
            { label: "Crit",    value: `${c.critPct}%`, icon: "🎯", color: "text-orange-400" },
            { label: "Dodge",   value: `${c.dodgePct}%`, icon: "💫", color: "text-cyan-400" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 p-2 rounded-lg bg-arena-bg/50 border border-arena-border">
              <span>{s.icon}</span>
              <span className="text-arena-muted">{s.label}</span>
              <span className={`ml-auto font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Lore */}
        <p className="text-xs text-arena-muted text-center leading-relaxed italic px-2">
          "{c.lore}"
        </p>
      </div>
    </div>
  );
}

// ─── Roster Page ──────────────────────────────────────────────────────────────
export default function Roster() {
  const { address, isConnected } = useAccount();
  const [detail, setDetail]      = useState<ChampionDef | null>(null);

  const { data: hasSet } = useReadContract({
    address: ACTIVE_CONTRACTS.BahiaChampion, abi: CHAMPION_ABI,
    functionName: "hasChampionSet", args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 8_000 },
  });

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-4">
        <span className="text-5xl">🐉</span>
        <p className="text-lg font-semibold">Connect your wallet</p>
        <p className="text-arena-muted text-sm">Connect a wallet to view your champions.</p>
        <Link to="/" className="mt-2 px-6 py-3 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm active:scale-95 transition-transform">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-arena-bg px-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 pt-6 pb-4">
        <Link to="/" className="text-arena-muted text-xl">←</Link>
        <h1 className="font-display text-arena-primary text-sm">CHAMPIONS</h1>
      </div>

      <DepositWidget />

      {/* Champion grid */}
      <p className="text-xs text-arena-muted uppercase tracking-wider mb-3 font-semibold">
        Legends of Brazil
      </p>
      <div className="grid grid-cols-2 gap-3">
        {CHAMPIONS.map((c) => (
          <ChampionCard
            key={c.class}
            champion={c}
            locked={!hasSet}
            onClick={() => setDetail(c)}
          />
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-arena-muted">
        Tap a champion for full details
      </p>

      {detail && <ChampionDetailModal c={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
