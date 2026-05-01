import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CHAMPIONS, ChampionClass } from "@/lib/champions";
import { ACTIVE_CONTRACTS, ARENA_ABI } from "@/lib/contracts";
import { ChampionArt } from "@/components/ChampionArt";
import { simulateBattle, BattleEvent } from "@/lib/battleEngine";

// ─── HP Bar ───────────────────────────────────────────────────────────────────

function HpBar({ current, max, side }: { current: number; max: number; side: "A" | "B" }) {
  const pct   = Math.max(0, Math.min(100, Math.round((current / max) * 100)));
  const color = pct > 50 ? "bg-arena-success" : pct > 25 ? "bg-amber-400" : "bg-arena-danger";
  return (
    <div className={`flex flex-col gap-1 ${side === "B" ? "items-end" : ""}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold text-white tabular-nums">{current}</span>
        <span className="text-xs text-arena-muted">/ {max}</span>
      </div>
      <div className={`h-3 rounded-full bg-arena-bg overflow-hidden ${side === "A" ? "w-28" : "w-28"}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Battle Event Log item ────────────────────────────────────────────────────

function EventRow({ ev, champA, champB }: { ev: BattleEvent; champA: string; champB: string }) {
  const icons: Record<BattleEvent["type"], string> = {
    attack:  "⚔️",
    ability: "✨",
    dot:     "🔥",
    heal:    "💚",
    stunned: "💫",
    dodge:   "🌀",
    death:   "💀",
  };
  const colors: Record<BattleEvent["type"], string> = {
    attack:  "text-white",
    ability: "text-arena-primary",
    dot:     "text-orange-400",
    heal:    "text-arena-success",
    stunned: "text-cyan-400",
    dodge:   "text-arena-muted",
    death:   "text-arena-danger",
  };
  return (
    <div className={`flex items-start gap-2 py-1 text-xs ${colors[ev.type]}`}>
      <span className="shrink-0 w-5">{icons[ev.type]}</span>
      <span className="flex-1">{ev.description}</span>
      {ev.damage > 0 && (
        <span className={`font-bold shrink-0 ${ev.crit ? "text-orange-400" : "text-arena-danger"}`}>
          -{ev.damage}
        </span>
      )}
      {ev.heal > 0 && (
        <span className="font-bold shrink-0 text-arena-success">+{ev.heal}</span>
      )}
    </div>
  );
}

// ─── Battle Interface ─────────────────────────────────────────────────────────

interface BattleData {
  playerA: `0x${string}`;
  playerB: `0x${string}`;
  classA: number;
  classB: number;
  status: number;
  winner: `0x${string}`;
  createdAt: bigint;
  startedAt: bigint;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BattlePage() {
  const { id } = useParams<{ id: string }>();
  const { address } = useAccount();
  const navigate    = useNavigate();
  const battleId    = BigInt(id ?? "0");
  const logRef      = useRef<HTMLDivElement>(null);

  // Chain data
  const { data: rawBattle, refetch } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi: ARENA_ABI,
    functionName: "getBattle",
    args: [battleId],
    query: { refetchInterval: 4_000 },
  });
  const battle = rawBattle as BattleData | undefined;

  // Resolve on-chain TX
  const { writeContractAsync, data: txHash, isPending: txPending } = useWriteContract();
  const { isLoading: txWaiting, isSuccess: txDone } = useWaitForTransactionReceipt({ hash: txHash });

  // Animation state
  const [phase, setPhase]         = useState<"idle" | "fighting" | "done">("idle");
  const [hpA, setHpA]             = useState(0);
  const [hpB, setHpB]             = useState(0);
  const [events, setEvents]       = useState<BattleEvent[]>([]);
  const [shownIdx, setShownIdx]   = useState(0);
  const [winner, setWinner]       = useState<"A" | "B" | null>(null);

  const champA = battle ? CHAMPIONS[battle.classA as ChampionClass] : null;
  const champB = battle ? CHAMPIONS[battle.classB as ChampionClass] : null;

  const isMine    = address &&
    (address.toLowerCase() === battle?.playerA.toLowerCase() ||
     address.toLowerCase() === battle?.playerB.toLowerCase());
  const isActive  = battle?.status === 1;
  const isResolved = battle?.status === 2;

  // Init HP from champion stats
  useEffect(() => {
    if (champA && champB) {
      setHpA(champA.maxHp);
      setHpB(champB.maxHp);
    }
  }, [champA?.class, champB?.class]);

  // Scroll log to bottom
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [shownIdx]);

  // Animate events one by one
  useEffect(() => {
    if (phase !== "fighting" || events.length === 0) return;
    if (shownIdx >= events.length) {
      setPhase("done");
      return;
    }
    const ev = events[shownIdx];
    const delay = ev.type === "death" ? 800 : ev.type === "ability" ? 500 : 280;

    const t = setTimeout(() => {
      setHpA(ev.hpA);
      setHpB(ev.hpB);
      setShownIdx(i => i + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [phase, shownIdx, events]);

  // After TX confirmed → refetch and play animation
  useEffect(() => {
    if (!txDone) return;
    refetch().then(r => {
      const b = r.data as BattleData | undefined;
      if (!b || b.status !== 2) return;
      startAnimation(b);
    });
  }, [txDone]);

  const startAnimation = useCallback((b: BattleData) => {
    const seed = BigInt(Date.now()); // approximate seed for animation (real result from chain)
    const result = simulateBattle(b.classA as ChampionClass, b.classB as ChampionClass, seed);

    // Force final HP to match on-chain winner
    const chainWinner = b.winner.toLowerCase() === b.playerA.toLowerCase() ? "A" : "B";
    // Patch last event if simulation disagrees with chain (chain always wins)
    if (result.winner !== chainWinner) {
      // Flip the death event
      if (result.events.length > 0) {
        result.events[result.events.length - 1].side = chainWinner === "A" ? "B" : "A";
        result.events[result.events.length - 1].description =
          `${chainWinner === "A" ? "B" : "A"} has been defeated!`;
      }
    }

    setWinner(chainWinner);
    setEvents(result.events);
    setShownIdx(0);
    setPhase("fighting");
  }, []);

  const handleResolve = async () => {
    try {
      await writeContractAsync({
        address: ACTIVE_CONTRACTS.ArenaManager,
        abi: ARENA_ABI,
        functionName: "resolveOnChain",
        args: [battleId],
      });
    } catch (e: any) {
      console.error(e);
    }
  };

  // Auto-animate already-resolved battles
  useEffect(() => {
    if (isResolved && battle && phase === "idle") {
      const chainWinner = battle.winner.toLowerCase() === battle.playerA.toLowerCase() ? "A" : "B";
      setWinner(chainWinner);
      const seed = BigInt(Number(battle.startedAt));
      const result = simulateBattle(battle.classA as ChampionClass, battle.classB as ChampionClass, seed);
      setEvents(result.events);
      setShownIdx(0);
      setPhase("fighting");
    }
  }, [isResolved, battle]);

  if (!battle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-arena-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

  return (
    <div className="flex flex-col min-h-screen bg-arena-bg">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-3 border-b border-arena-border">
        <button onClick={() => navigate(-1)} className="text-arena-muted text-xl">←</button>
        <div className="flex-1">
          <h1 className="font-display text-arena-primary text-sm">ARENA BATTLE</h1>
          <p className="text-xs text-arena-muted">Battle #{id}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          battle.status === 0 ? "bg-arena-success/20 text-arena-success" :
          battle.status === 1 ? "bg-arena-primary/20 text-arena-primary" :
          battle.status === 2 ? "bg-purple-500/20 text-purple-400" :
          "bg-arena-muted/20 text-arena-muted"
        }`}>
          {["Open", "Active", "Resolved", "Cancelled"][battle.status]}
        </span>
      </div>

      {/* ── Battle Arena ──────────────────────────────────────────────────── */}
      <div
        className="relative px-4 py-6"
        style={{ background: "radial-gradient(ellipse at 50% 0%, #F6C90E15 0%, transparent 70%)" }}
      >
        {/* VS divider */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center z-10 pointer-events-none">
          <div className="px-3 py-1 rounded-full bg-arena-surface border border-arena-border">
            <span className="text-xs font-display text-arena-primary">VS</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Champion A */}
          <div className={`flex flex-col items-center gap-2 transition-all duration-300 ${
            phase === "done" && winner === "B" ? "opacity-40 grayscale" : ""
          }`}>
            {champA && (
              <>
                <div className={`relative rounded-2xl p-3 border ${champA.borderColor} bg-gradient-to-b ${champA.color}
                  ${phase === "fighting" ? "animate-pulse" : ""}
                  ${phase === "done" && winner === "A" ? "ring-2 ring-arena-primary ring-offset-1 ring-offset-arena-bg" : ""}`}>
                  <ChampionArt class_={battle.classA as ChampionClass} size={72} animated={phase === "fighting"} />
                  {phase === "done" && winner === "A" && (
                    <div className="absolute -top-2 -right-2 text-lg animate-bounce">👑</div>
                  )}
                </div>
                <p className="text-xs font-semibold text-center">{champA.name}</p>
                <p className="text-xs text-arena-muted text-center">{champA.role}</p>
                <HpBar current={hpA} max={champA.maxHp} side="A" />
                <p className="text-xs text-arena-muted">{short(battle.playerA)}</p>
                {address?.toLowerCase() === battle.playerA.toLowerCase() && (
                  <span className="text-xs bg-arena-primary/20 text-arena-primary px-2 py-0.5 rounded-full">You</span>
                )}
              </>
            )}
          </div>

          {/* Champion B */}
          <div className={`flex flex-col items-center gap-2 transition-all duration-300 ${
            phase === "done" && winner === "A" ? "opacity-40 grayscale" : ""
          }`}>
            {champB && battle.playerB !== "0x0000000000000000000000000000000000000000" ? (
              <>
                <div className={`relative rounded-2xl p-3 border ${champB.borderColor} bg-gradient-to-b ${champB.color}
                  ${phase === "fighting" ? "animate-pulse" : ""}
                  ${phase === "done" && winner === "B" ? "ring-2 ring-arena-primary ring-offset-1 ring-offset-arena-bg" : ""}`}>
                  <ChampionArt class_={battle.classB as ChampionClass} size={72} animated={phase === "fighting"} />
                  {phase === "done" && winner === "B" && (
                    <div className="absolute -top-2 -right-2 text-lg animate-bounce">👑</div>
                  )}
                </div>
                <p className="text-xs font-semibold text-center">{champB.name}</p>
                <p className="text-xs text-arena-muted text-center">{champB.role}</p>
                <HpBar current={hpB} max={champB.maxHp} side="B" />
                <p className="text-xs text-arena-muted">{short(battle.playerB)}</p>
                {address?.toLowerCase() === battle.playerB.toLowerCase() && (
                  <span className="text-xs bg-arena-primary/20 text-arena-primary px-2 py-0.5 rounded-full">You</span>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 p-4 rounded-2xl border border-dashed border-arena-border">
                <span className="text-3xl">⚔️</span>
                <p className="text-xs text-arena-muted text-center">Waiting for challenger…</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Winner Banner ─────────────────────────────────────────────────── */}
      {phase === "done" && winner && (
        <div className="mx-4 mb-3 p-4 rounded-2xl bg-arena-primary/10 border border-arena-primary/30 text-center animate-pulse">
          <p className="text-2xl mb-1">🏆</p>
          <p className="font-display text-arena-primary text-sm">
            {winner === "A"
              ? (address?.toLowerCase() === battle.playerA.toLowerCase() ? "YOU WIN!" : `${champA?.name} wins!`)
              : (address?.toLowerCase() === battle.playerB.toLowerCase() ? "YOU WIN!" : `${champB?.name} wins!`)}
          </p>
          <p className="text-xs text-arena-muted mt-1">
            +{winner === "A"
              ? (address?.toLowerCase() === battle.playerA.toLowerCase() ? 3 : 1)
              : (address?.toLowerCase() === battle.playerB.toLowerCase() ? 3 : 1)
            } ranking points earned
          </p>
        </div>
      )}

      {/* ── Battle Log ────────────────────────────────────────────────────── */}
      <div className="flex-1 mx-4 mb-4">
        <p className="text-xs text-arena-muted uppercase tracking-wider mb-2 font-semibold">
          Battle Log
        </p>
        <div
          ref={logRef}
          className="h-52 overflow-y-auto bg-arena-surface rounded-2xl border border-arena-border p-3 space-y-0.5 scrollbar-hide"
        >
          {phase === "idle" && isActive && isMine && (
            <p className="text-xs text-arena-muted text-center py-8">
              Press "Start Battle" to resolve on-chain ⚔️
            </p>
          )}
          {phase === "idle" && !isActive && (
            <p className="text-xs text-arena-muted text-center py-8">
              {battle.status === 0 ? "Waiting for an opponent to join…" : "Battle not started yet."}
            </p>
          )}
          {events.slice(0, shownIdx).map((ev, i) => (
            <EventRow key={i} ev={ev} champA={champA?.name ?? "A"} champB={champB?.name ?? "B"} />
          ))}
          {phase === "fighting" && shownIdx < events.length && (
            <div className="flex items-center gap-2 py-1 text-xs text-arena-muted animate-pulse">
              <div className="w-3 h-3 rounded-full bg-arena-primary animate-ping" />
              Simulating…
            </div>
          )}
        </div>
      </div>

      {/* ── Action Buttons ─────────────────────────────────────────────────── */}
      <div className="px-4 pb-8 flex flex-col gap-2">
        {/* Resolve button */}
        {isActive && isMine && phase === "idle" && (
          <button
            onClick={handleResolve}
            disabled={txPending || txWaiting}
            className="w-full py-3.5 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm
              disabled:opacity-50 active:scale-95 transition-transform shadow-lg shadow-arena-primary/30"
          >
            {txPending ? "Confirm in wallet…" :
             txWaiting ? "Resolving on-chain…" :
             "⚔️ Start Battle"}
          </button>
        )}

        {phase === "fighting" && (
          <div className="flex items-center justify-center gap-2 py-3">
            <div className="w-2 h-2 rounded-full bg-arena-primary animate-ping" />
            <p className="text-sm text-arena-primary font-semibold">Battle in progress…</p>
            <div className="w-2 h-2 rounded-full bg-arena-primary animate-ping" />
          </div>
        )}

        {(phase === "done" || (isResolved && phase === "idle")) && (
          <div className="flex gap-2">
            <Link
              to="/arena"
              className="flex-1 py-3 rounded-xl bg-arena-surface border border-arena-border text-sm font-semibold text-center active:scale-95 transition-transform"
            >
              ← Back to Arena
            </Link>
            <Link
              to="/leaderboard"
              className="flex-1 py-3 rounded-xl bg-arena-accent text-white text-sm font-semibold text-center active:scale-95 transition-transform"
            >
              🏆 Leaderboard
            </Link>
          </div>
        )}

        {battle.status === 0 && (
          <Link
            to="/arena"
            className="w-full py-3 rounded-xl bg-arena-surface border border-arena-border text-sm font-semibold text-center active:scale-95 transition-transform"
          >
            ← Back to Arena
          </Link>
        )}
      </div>
    </div>
  );
}
