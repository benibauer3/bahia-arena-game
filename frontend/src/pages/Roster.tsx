import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Link } from "react-router-dom";
import { CHAMPIONS, type ChampionDef, ChampionClass } from "@/lib/champions";
import { ACTIVE_CONTRACTS, ARENA_ABI, CHAMPION_ABI, ERC20_ABI } from "@/lib/contracts";
import ChampionCard from "@/components/ChampionCard";

// ─── Deposit / Withdraw button ────────────────────────────────────────────────
function DepositPanel({ hasSet, entryFee }: { hasSet: boolean; entryFee: bigint }) {
  const [status, setStatus] = useState<"idle"|"approving"|"depositing"|"withdrawing"|"done"|"error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const approve   = useWriteContract();
  const action    = useWriteContract();
  const actionRct = useWaitForTransactionReceipt({ hash: action.data });

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

  const isLoading = status === "approving" || status === "depositing" || status === "withdrawing";
  const fmtFee = entryFee ? (Number(entryFee) / 1e18).toFixed(2) : "1.00";

  return (
    <div className="rounded-2xl bg-arena-surface border border-arena-border p-4 mb-6">
      {hasSet ? (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-arena-success text-lg">✓</span>
            <div>
              <p className="text-sm font-semibold">Campeões Ativos</p>
              <p className="text-xs text-arena-muted">5 campeões soulbound em sua posse</p>
            </div>
          </div>
          <button
            onClick={handleWithdraw}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl border border-arena-danger/50 text-arena-danger text-sm font-semibold disabled:opacity-50 active:scale-95 transition-transform"
          >
            {status === "withdrawing" ? "Devolvendo…" : `Devolver & Resgatar ${fmtFee} USDT`}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold mb-1">🎮 Entrar na Arena</p>
          <p className="text-xs text-arena-muted mb-3">
            Deposite {fmtFee} USDT para receber todos os 5 campeões soulbound e batalhar.
          </p>
          <button
            onClick={handleDeposit}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm disabled:opacity-50 active:scale-95 transition-transform"
          >
            {status === "approving"  ? "Aprovando USDT…"
             : status === "depositing" ? "Depositando…"
             : `Depositar ${fmtFee} USDT`}
          </button>
        </>
      )}
      {status === "error" && <p className="mt-2 text-xs text-arena-danger text-center">{errMsg}</p>}
    </div>
  );
}

// ─── Champion detail modal ────────────────────────────────────────────────────
function ChampionModal({ c, onClose }: { c: ChampionDef; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={onClose}>
      <div className="w-full bg-arena-surface rounded-t-3xl p-5 pb-8" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-arena-border rounded-full mx-auto mb-4" />
        <ChampionCard champion={c} size="lg" />
        <p className="mt-4 text-xs text-arena-muted text-center leading-relaxed px-2">{c.lore}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
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
        <p className="text-arena-muted">Conecte sua carteira para ver seus campeões.</p>
        <Link to="/" className="text-arena-primary underline text-sm">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-arena-bg px-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 pt-6 pb-4">
        <Link to="/" className="text-arena-muted text-xl">←</Link>
        <h1 className="font-display text-arena-primary text-sm">CAMPEÕES</h1>
      </div>

      {/* Deposit panel */}
      <DepositPanel hasSet={!!hasSet} entryFee={(entryFee as bigint) ?? 0n} />

      {/* Champion roster */}
      <p className="text-xs text-arena-muted uppercase tracking-wider mb-3 font-semibold">
        Lendas do Brasil
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
        Toque num campeão para ver detalhes
      </p>

      {/* Detail modal */}
      {detail && <ChampionModal c={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
