import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Link } from "react-router-dom";
import { CHAMPIONS, type ChampionDef, ChampionClass } from "@/lib/champions";
import { ACTIVE_CONTRACTS, ARENA_ABI, CHAMPION_ABI, ERC20_ABI } from "@/lib/contracts";
import ChampionCard from "@/components/ChampionCard";
import { ChampionArt } from "@/components/ChampionArt";

// ─── Deposit / Withdraw panel ────────────────────────────────────────────────
function DepositPanel({ hasSet, entryFee }: { hasSet: boolean; entryFee: bigint }) {
  const [status, setStatus] = useState<"idle"|"approving"|"depositing"|"withdrawing"|"done"|"error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const approve = useWriteContract();
  const action  = useWriteContract();

  const handleDeposit = async () => {
    setStatus("approving"); setErrMsg("");
    try {
      await approve.writeContractAsync({
        address: ACTIVE_CONTRACTS.usdt, abi: ERC20_ABI,
        functionName: "approve", args: [ACTIVE_CONTRACTS.ArenaManager, entryFee],
      });
      setStatus("depositing");
      await action.writeContractAsync({
        address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI, functionName: "deposit", args: [],
      });
      setStatus("done");
    } catch (e: any) { setErrMsg(e.shortMessage ?? e.message); setStatus("error"); }
  };

  const handleWithdraw = async () => {
    setStatus("withdrawing"); setErrMsg("");
    try {
      await action.writeContractAsync({
        address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI, functionName: "withdraw", args: [],
      });
      setStatus("done");
    } catch (e: any) { setErrMsg(e.shortMessage ?? e.message); setStatus("error"); }
  };

  const isLoading = ["approving","depositing","withdrawing"].includes(status);
  const fmtFee    = entryFee ? (Number(entryFee) / 1e18).toFixed(2) : "1.00";

  return (
    <div className="rounded-2xl bg-arena-surface border border-arena-border p-4 mb-6">
      {hasSet ? (
        <>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-arena-success/20 flex items-center justify-center">
              <span className="text-arena-success text-sm">✓</span>
            </div>
            <div>
              <p className="text-sm font-semibold">Champions Active</p>
              <p className="text-xs text-arena-muted">5 soulbound champions in your wallet</p>
            </div>
          </div>
          <button onClick={handleWithdraw} disabled={isLoading}
            className="w-full py-2.5 rounded-xl border border-arena-danger/50 text-arena-danger text-sm font-semibold disabled:opacity-50 active:scale-95 transition-transform">
            {status === "withdrawing" ? "Withdrawing…" : `Return champions & get ${fmtFee} USDT back`}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold mb-1">🎮 Enter the Arena</p>
          <p className="text-xs text-arena-muted mb-3">
            Deposit {fmtFee} USDT to receive all 5 soulbound champions and start battling.
          </p>
          <button onClick={handleDeposit} disabled={isLoading}
            className="w-full py-3 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm disabled:opacity-50 active:scale-95 transition-transform shadow-lg shadow-arena-primary/20">
            {status === "approving"  ? "Approving USDT…"
             : status === "depositing" ? "Depositing…"
             : `Deposit ${fmtFee} USDT`}
          </button>
        </>
      )}
      {status === "error" && <p className="mt-2 text-xs text-arena-danger text-center">{errMsg}</p>}
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

  const { data: entryFee } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI, functionName: "entryFee",
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

      <DepositPanel hasSet={!!hasSet} entryFee={(entryFee as bigint) ?? 0n} />

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
