/**
 * Battle.tsx — Card PvP battle page.
 *
 * Phases:
 *  1. Battle OPEN   → waiting for second player to join.
 *  2. Battle ACTIVE → card game UI; player picks & confirms turns vs AI opponent.
 *  3. Battle RESOLVED → result screen with winner + leaderboard CTA.
 *  4. Battle CANCELLED → cancelled state.
 *
 * The card game itself runs entirely on the client (useBattleCards).
 * When the local game ends the player can call resolveOnChain() to record
 * the winner on the contract and credit ranking points.
 */

import { useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";

import { CHAMPIONS, ChampionClass } from "@/lib/champions";
import { ACTIVE_CONTRACTS, ARENA_ABI } from "@/lib/contracts";
import { ChampionArt } from "@/components/ChampionArt";
import CardHand from "@/components/CardHand";
import { BattleArenaBackground } from "@/components/BattleArena";
import { useBattleCards, BattlePhase } from "@/hooks/useBattleCards";
import { BASE_HP, BASE_SHIELD, TurnLog, CHAMPION_CARDS } from "@/lib/championCards";

// ─── HP + Shield bar ──────────────────────────────────────────────────────────

function StatBars({
  hp,
  shield,
  side,
}: {
  hp: number;
  shield: number;
  side: "A" | "B";
}) {
  const hpPct  = Math.max(0, Math.min(100, (hp     / BASE_HP)     * 100));
  const shPct  = Math.max(0, Math.min(100, (shield / BASE_SHIELD) * 100));
  const hpColor =
    hpPct > 50 ? "bg-emerald-500" :
    hpPct > 25 ? "bg-amber-400"   : "bg-red-500";

  return (
    <div className={`flex flex-col gap-1 ${side === "B" ? "items-end" : ""}`}>
      {/* HP */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-arena-muted">❤️</span>
        <span className="text-xs font-bold tabular-nums">{hp}</span>
      </div>
      <div className="w-28 h-2.5 rounded-full bg-arena-bg overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${hpColor}`}
          style={{ width: `${hpPct}%` }}
        />
      </div>

      {/* Shield */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-arena-muted">🛡️</span>
        <span className="text-xs font-bold tabular-nums text-cyan-400">{shield}</span>
      </div>
      <div className="w-28 h-1.5 rounded-full bg-arena-bg overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 bg-cyan-500"
          style={{ width: `${shPct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Turn log row ─────────────────────────────────────────────────────────────

function LogRow({ log }: { log: TurnLog }) {
  const icon: Record<TurnLog["type"], string> = {
    damage:   "⚔️",
    shield:   "🛡️",
    heal:     "💚",
    status:   "💫",
    ultimate: "✨",
    death:    "💀",
    info:     "ℹ️",
  };
  const color: Record<TurnLog["type"], string> = {
    damage:   "text-red-400",
    shield:   "text-cyan-400",
    heal:     "text-emerald-400",
    status:   "text-yellow-400",
    ultimate: "text-arena-primary",
    death:    "text-red-500 font-bold",
    info:     "text-arena-muted",
  };
  return (
    <div className={`flex items-start gap-1.5 py-0.5 text-[11px] leading-tight ${color[log.type]}`}>
      <span className="shrink-0 w-4 text-center">{icon[log.type]}</span>
      <span className="flex-1">{log.text}</span>
    </div>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  if (status === "none") return null;
  const map: Record<string, { label: string; cls: string }> = {
    stunned:  { label: "💫 Stunned",   cls: "bg-yellow-900/60 text-yellow-300 border-yellow-600/40" },
    halfTurn: { label: "🌿 Entangled", cls: "bg-green-900/60  text-green-300  border-green-600/40"  },
    burned:   { label: "🔥 Burning",   cls: "bg-orange-900/60 text-orange-300 border-orange-600/40" },
    marked:   { label: "🎯 Marked",    cls: "bg-purple-900/60 text-purple-300 border-purple-600/40" },
  };
  const info = map[status] ?? { label: status, cls: "bg-arena-surface text-white border-arena-border" };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${info.cls}`}>
      {info.label}
    </span>
  );
}

// ─── Phase banner ─────────────────────────────────────────────────────────────

function PhaseBanner({ phase }: { phase: BattlePhase }) {
  if (phase === "choose")    return null;
  if (phase === "idle")      return null;
  if (phase === "result")    return null;
  return (
    <div className="text-center py-1.5 text-xs font-semibold text-arena-primary animate-pulse">
      {phase === "resolving" ? "⚔️ Resolving turn…" : "⏳ Waiting for opponent…"}
    </div>
  );
}

// ─── Battle data interface ────────────────────────────────────────────────────

interface ChainBattle {
  playerA:   `0x${string}`;
  playerB:   `0x${string}`;
  classA:    number;
  classB:    number;
  status:    number;
  winner:    `0x${string}`;
  createdAt: bigint;
  startedAt: bigint;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BattlePage() {
  const { id }      = useParams<{ id: string }>();
  const { address } = useAccount();
  const navigate    = useNavigate();
  const battleId    = BigInt(id ?? "0");
  const logRef      = useRef<HTMLDivElement>(null);

  // ── Chain data ───────────────────────────────────────────────────────────────
  const { data: rawBattle, refetch } = useReadContract({
    address:      ACTIVE_CONTRACTS.ArenaManager,
    abi:          ARENA_ABI,
    functionName: "getBattle",
    args:         [battleId],
    query:        { refetchInterval: 5_000 },
  });
  const battle = rawBattle as ChainBattle | undefined;

  // ── Resolve on-chain TX ──────────────────────────────────────────────────────
  const {
    writeContractAsync,
    data:       txHash,
    isPending:  txPending,
  } = useWriteContract();
  const { isLoading: txWaiting, isSuccess: txDone } =
    useWaitForTransactionReceipt({ hash: txHash });

  // Refetch after TX
  useEffect(() => { if (txDone) refetch(); }, [txDone]);

  // ── Card battle local state ──────────────────────────────────────────────────
  const classA = (battle?.classA ?? 0) as ChampionClass;
  const classB = (battle?.classB ?? 0) as ChampionClass;

  const {
    phase,
    battleState,
    playerA,
    playerB,
    selectedCards,
    canConfirm,
    selectCard,
    confirmTurn,
    resetBattle,
    winner,
    lastResult,
  } = useBattleCards(classA, classB, /* autoOpponent */ true);

  // Reset card battle when chain battle becomes ACTIVE
  useEffect(() => {
    if (battle?.status === 1) resetBattle(classA, classB);
  }, [battle?.status, classA, classB]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [battleState.log.length]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const champA   = CHAMPIONS[classA];
  const champB   = CHAMPIONS[classB];
  const short    = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
  const isMyTurn = address &&
    (address.toLowerCase() === battle?.playerA.toLowerCase() ||
     address.toLowerCase() === battle?.playerB.toLowerCase());
  const iAmA = address?.toLowerCase() === battle?.playerA.toLowerCase();

  // We always show the "You" side as Player A in card hand (AI is opponent)
  // In a real multiplayer scenario the side logic would be more complex
  const myCardConfig = CHAMPION_CARDS[classA];
  const myPhaseA     = playerA;
  const oppPhaseB = playerB;

  // Chain status
  const chainStatus = battle?.status ?? -1;
  const isOpen      = chainStatus === 0;
  const isActive    = chainStatus === 1;
  const isResolved  = chainStatus === 2;
  const isCancelled = chainStatus === 3;

  const chainWinner: "A" | "B" | null = isResolved
    ? (battle!.winner.toLowerCase() === battle!.playerA.toLowerCase() ? "A" : "B")
    : null;

  // ── Resolve on-chain ─────────────────────────────────────────────────────────
  const handleResolve = async () => {
    try {
      await writeContractAsync({
        address:      ACTIVE_CONTRACTS.ArenaManager,
        abi:          ARENA_ABI,
        functionName: "resolveOnChain",
        args:         [battleId],
      });
    } catch (e) {
      console.error(e);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (!battle) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-arena-bg">
        <div className="w-8 h-8 rounded-full border-2 border-arena-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-arena-bg pb-4">

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-3 border-b border-arena-border shrink-0">
        <button onClick={() => navigate(-1)} className="text-arena-muted text-xl leading-none">←</button>
        <div className="flex-1">
          <h1 className="font-display text-arena-primary text-sm tracking-widest">CARD BATTLE</h1>
          <p className="text-[11px] text-arena-muted">Battle #{id}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
          isOpen      ? "bg-arena-success/20 text-arena-success" :
          isActive    ? "bg-arena-primary/20 text-arena-primary" :
          isResolved  ? "bg-purple-500/20    text-purple-400"    :
          isCancelled ? "bg-red-500/20       text-red-400"       :
                        "bg-arena-muted/20  text-arena-muted"
        }`}>
          {isOpen ? "OPEN" : isActive ? "ACTIVE" : isResolved ? "RESOLVED" : "CANCELLED"}
        </span>
      </div>

      {/* ── VS + Champion art ─────────────────────────────────────────────────── */}
      <div className="relative px-3 py-4 shrink-0 overflow-hidden" style={{ minHeight: 220 }}>
        {/* Battlefield background */}
        <BattleArenaBackground classA={classA} classB={classB}/>

        {/* VS pill */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center z-10 pointer-events-none">
          <div className="px-3 py-1 rounded-full bg-arena-surface border border-arena-border">
            <span className="text-[11px] font-display text-arena-primary">VS</span>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-2 pt-2">
          {/* Player A */}
          <div className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${
            (phase === "result" && winner === "B") || (isResolved && chainWinner === "B") ? "opacity-40 grayscale" : ""
          }`}>
            <div className={`relative rounded-2xl p-2.5 border ${champA.borderColor}
              bg-black/50 backdrop-blur-sm
              ${(phase === "result" && winner === "A") || (isResolved && chainWinner === "A") ? "ring-2 ring-arena-primary ring-offset-1 ring-offset-arena-bg" : ""}
            `}>
              <ChampionArt class_={classA} size={68} animated={phase === "resolving"} />
              {((phase === "result" && winner === "A") || (isResolved && chainWinner === "A")) && (
                <div className="absolute -top-2 -right-2 text-lg animate-bounce">👑</div>
              )}
            </div>
            <p className="text-[11px] font-bold text-center">{champA.name}</p>
            <p className="text-[10px] text-arena-muted text-center">{champA.role}</p>
            <StatBars hp={myPhaseA.displayHp} shield={myPhaseA.displayShield} side="A" />
            {isActive && <StatusPill status={battleState.statusA} />}
            <p className="text-[10px] text-arena-muted">{short(battle.playerA)}</p>
            {iAmA && (
              <span className="text-[10px] bg-arena-primary/20 text-arena-primary px-1.5 py-0.5 rounded-full">You</span>
            )}
          </div>

          {/* Player B */}
          <div className={`flex flex-col items-center gap-1.5 transition-all duration-500 ${
            (phase === "result" && winner === "A") || (isResolved && chainWinner === "A") ? "opacity-40 grayscale" : ""
          }`}>
            {champB && battle.playerB !== "0x0000000000000000000000000000000000000000" ? (
              <>
                <div className={`relative rounded-2xl p-2.5 border ${champB.borderColor}
                  bg-black/50 backdrop-blur-sm
                  ${(phase === "result" && winner === "B") || (isResolved && chainWinner === "B") ? "ring-2 ring-arena-primary ring-offset-1 ring-offset-arena-bg" : ""}
                `}>
                  <ChampionArt class_={classB} size={68} animated={phase === "resolving"} />
                  {((phase === "result" && winner === "B") || (isResolved && chainWinner === "B")) && (
                    <div className="absolute -top-2 -right-2 text-lg animate-bounce">👑</div>
                  )}
                </div>
                <p className="text-[11px] font-bold text-center">{champB.name}</p>
                <p className="text-[10px] text-arena-muted text-center">{champB.role}</p>
                <StatBars hp={oppPhaseB.displayHp} shield={oppPhaseB.displayShield} side="B" />
                {isActive && <StatusPill status={battleState.statusB} />}
                <p className="text-[10px] text-arena-muted">{short(battle.playerB)}</p>
                {!iAmA && address?.toLowerCase() === battle.playerB.toLowerCase() && (
                  <span className="text-[10px] bg-arena-primary/20 text-arena-primary px-1.5 py-0.5 rounded-full">You</span>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 p-4 rounded-2xl border border-dashed border-arena-border">
                <span className="text-3xl">⚔️</span>
                <p className="text-[11px] text-arena-muted text-center">Waiting for challenger…</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Winner Banner ─────────────────────────────────────────────────────── */}
      {(phase === "result" || isResolved) && (
        <div className="mx-3 mb-3 p-4 rounded-2xl bg-arena-primary/10 border border-arena-primary/30 text-center">
          <p className="text-2xl mb-1">{isResolved ? "🏆" : winner ? "🏆" : "🤝"}</p>
          <p className="font-display text-arena-primary text-base">
            {isResolved
              ? (chainWinner === "A"
                  ? (iAmA ? "YOU WIN!" : `${champA.name} wins!`)
                  : (!iAmA ? "YOU WIN!" : `${champB.name} wins!`))
              : winner === "A"
              ? (iAmA ? "YOU WIN!" : `${champA.name} wins!`)
              : winner === "B"
              ? (!iAmA ? "YOU WIN!" : `${champB.name} wins!`)
              : "DRAW!"}
          </p>
          <p className="text-[11px] text-arena-muted mt-1">
            +{winner === "A" ? (iAmA ? 3 : 1) : winner === "B" ? (!iAmA ? 3 : 1) : 1} ranking points
          </p>
        </div>
      )}

      {/* ── Phase banner ──────────────────────────────────────────────────────── */}
      {isActive && <PhaseBanner phase={phase} />}

      {/* ── Turn indicator ────────────────────────────────────────────────────── */}
      {isActive && phase === "choose" && (
        <p className="text-center text-xs font-semibold text-white px-4 pb-1">
          Turn {battleState.turn} — Choose your cards
        </p>
      )}

      {/* ── Card Hand (only when battle ACTIVE + local phase = choose/resolving) */}
      {isActive && (phase === "choose" || phase === "resolving") && (
        <div className="px-3 pb-2 shrink-0">
          <CardHand
            cards={myCardConfig.cards}
            selected={selectedCards}
            energy={battleState.energyA}
            maxSelect={battleState.statusA === "halfTurn" ? 1 : 2}
            isStunned={battleState.statusA === "stunned"}
            isHalfTurn={battleState.statusA === "halfTurn"}
            onSelect={selectCard}
            disabled={phase === "resolving"}
          />

          {/* Confirm button */}
          <button
            onClick={confirmTurn}
            disabled={!canConfirm || phase === "resolving"}
            className="
              mt-2 w-full py-3.5 rounded-xl bg-arena-primary text-arena-bg
              font-semibold text-sm active:scale-95 transition-transform
              shadow-lg shadow-arena-primary/30
              disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
            "
          >
            {phase === "resolving"
              ? "⚔️ Resolving…"
              : battleState.statusA === "stunned"
              ? "💫 Stunned — End Turn"
              : selectedCards.length === 0
              ? "Select a card…"
              : `⚔️ Confirm ${selectedCards.length} Card${selectedCards.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {/* ── Turn Log ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 mx-3 min-h-0">
        <p className="text-[10px] text-arena-muted uppercase tracking-wider mb-1.5 font-semibold">
          {isActive ? `Battle Log — Turn ${battleState.turn}` : "Battle Log"}
        </p>
        <div
          ref={logRef}
          className="h-36 overflow-y-auto bg-arena-surface rounded-xl border border-arena-border p-2.5 space-y-0.5 scrollbar-hide"
        >
          {battleState.log.length === 0 && (
            <p className="text-[11px] text-arena-muted text-center py-4">
              {isOpen
                ? "Waiting for a second player to join…"
                : isActive
                ? "Select cards and confirm your turn to begin!"
                : isResolved
                ? "Battle complete."
                : "Battle cancelled."}
            </p>
          )}
          {battleState.log.map((entry, i) => (
            <LogRow key={i} log={entry} />
          ))}
          {phase === "resolving" && (
            <div className="flex items-center gap-1.5 py-1 text-[11px] text-arena-primary animate-pulse">
              <div className="w-2 h-2 rounded-full bg-arena-primary animate-ping" />
              Processing cards…
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Actions ────────────────────────────────────────────────────── */}
      <div className="px-3 pt-3 flex flex-col gap-2 shrink-0">

        {/* Resolve on-chain — only after local battle ends and chain battle is ACTIVE */}
        {phase === "result" && isActive && isMyTurn && (
          <button
            onClick={handleResolve}
            disabled={txPending || txWaiting}
            className="
              w-full py-3.5 rounded-xl bg-arena-success text-white
              font-semibold text-sm active:scale-95 transition-transform
              shadow-lg shadow-emerald-500/20
              disabled:opacity-50
            "
          >
            {txPending ? "Confirm in wallet…" :
             txWaiting ? "Recording on-chain…" :
             "🔗 Record Result On-Chain"}
          </button>
        )}

        {/* Open battle — waiting for opponent */}
        {isOpen && (
          <Link
            to="/arena"
            className="w-full py-3 rounded-xl bg-arena-surface border border-arena-border text-sm font-semibold text-center active:scale-95 transition-transform text-white"
          >
            ← Share & wait for opponent
          </Link>
        )}

        {/* Post-battle navigation */}
        {(phase === "result" || isResolved) && (
          <div className="flex gap-2">
            <Link
              to="/arena"
              className="flex-1 py-3 rounded-xl bg-arena-surface border border-arena-border text-sm font-semibold text-center active:scale-95 transition-transform text-white"
            >
              ← Arena
            </Link>
            <Link
              to="/leaderboard"
              className="flex-1 py-3 rounded-xl bg-arena-accent text-white text-sm font-semibold text-center active:scale-95 transition-transform"
            >
              🏆 Ranking
            </Link>
          </div>
        )}

        {isCancelled && (
          <Link
            to="/arena"
            className="w-full py-3 rounded-xl bg-arena-surface border border-arena-border text-sm font-semibold text-center active:scale-95 transition-transform text-white"
          >
            ← Back to Arena
          </Link>
        )}
      </div>
    </div>
  );
}
