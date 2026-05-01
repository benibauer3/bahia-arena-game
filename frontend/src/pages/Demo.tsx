/**
 * Demo.tsx — Fully playable card battle demo, no wallet required.
 *
 * Any visitor can:
 *  1. Pick their champion (Player A)
 *  2. AI auto-picks opponent (Player B)
 *  3. Play the full card battle
 *  4. See win/loss result + CTA to the real arena
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { CHAMPIONS, ChampionClass } from "@/lib/champions";
import { ChampionArt } from "@/components/ChampionArt";
import CardHand from "@/components/CardHand";
import { BattleArenaBackground } from "@/components/BattleArena";
import { useBattleCards } from "@/hooks/useBattleCards";
import { CHAMPION_CARDS, BASE_HP, BASE_SHIELD, TurnLog } from "@/lib/championCards";

// ─── Stat bars ────────────────────────────────────────────────────────────────

function StatBars({ hp, shield, side }: { hp: number; shield: number; side: "A" | "B" }) {
  const hpPct = Math.max(0, Math.min(100, (hp     / BASE_HP)     * 100));
  const shPct = Math.max(0, Math.min(100, (shield / BASE_SHIELD) * 100));
  const hpColor = hpPct > 50 ? "bg-emerald-500" : hpPct > 25 ? "bg-amber-400" : "bg-red-500";

  return (
    <div className={`flex flex-col gap-0.5 ${side === "B" ? "items-end" : ""}`}>
      <div className="flex items-center gap-1">
        <span className="text-[9px]">❤️</span>
        <span className="text-xs font-bold tabular-nums">{hp}</span>
      </div>
      <div className="w-24 h-2 rounded-full bg-arena-bg overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${hpColor}`} style={{ width: `${hpPct}%` }}/>
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-[9px]">🛡️</span>
        <span className="text-xs font-bold tabular-nums text-cyan-400">{shield}</span>
      </div>
      <div className="w-24 h-1.5 rounded-full bg-arena-bg overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500 bg-cyan-500" style={{ width: `${shPct}%` }}/>
      </div>
    </div>
  );
}

// ─── Log row ─────────────────────────────────────────────────────────────────

function LogRow({ log }: { log: TurnLog }) {
  const icon: Record<TurnLog["type"], string> = {
    damage:"⚔️", shield:"🛡️", heal:"💚", status:"💫", ultimate:"✨", death:"💀", info:"ℹ️",
  };
  const color: Record<TurnLog["type"], string> = {
    damage:"text-red-400", shield:"text-cyan-400", heal:"text-emerald-400",
    status:"text-yellow-400", ultimate:"text-arena-primary", death:"text-red-500 font-bold", info:"text-arena-muted",
  };
  return (
    <div className={`flex items-start gap-1.5 py-0.5 text-[10px] leading-tight ${color[log.type]}`}>
      <span className="shrink-0 w-3.5 text-center">{icon[log.type]}</span>
      <span>{log.text}</span>
    </div>
  );
}

// ─── Champion Picker ──────────────────────────────────────────────────────────

function ChampionPicker({ onPick }: { onPick: (c: ChampionClass) => void }) {
  return (
    <div className="flex flex-col min-h-screen bg-arena-bg">
      {/* Header */}
      <div className="px-4 pt-10 pb-4 text-center"
        style={{ background: "radial-gradient(ellipse at 50% 0%, #F6C90E20 0%, transparent 60%)" }}>
        <p className="font-display text-arena-primary text-xs mb-2 tracking-widest">DEMO BATTLE</p>
        <h1 className="text-xl font-bold text-white mb-1">Choose Your Champion</h1>
        <p className="text-xs text-arena-muted">No wallet needed — play immediately</p>
      </div>

      {/* Champion grid */}
      <div className="flex-1 px-4 pt-4 pb-24">
        <div className="grid grid-cols-1 gap-3">
          {CHAMPIONS.map((c) => (
            <button
              key={c.class}
              onClick={() => onPick(c.class)}
              className={`
                flex items-center gap-4 p-4 rounded-2xl border active:scale-[0.98] transition-all
                bg-gradient-to-r ${c.color} ${c.borderColor}
                hover:ring-1 hover:ring-white/20
              `}
            >
              <div className="shrink-0">
                <ChampionArt class_={c.class} size={60} animated={true}/>
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-white text-sm">{c.name}</p>
                <p className="text-xs text-white/60 mb-1">{c.role}</p>
                <p className="text-[10px] text-white/50 leading-relaxed line-clamp-2">{c.lore}</p>
              </div>
              <div className="shrink-0 text-right space-y-1">
                <p className="text-[10px] text-white/50">ATK <span className="text-white font-bold">{c.attack}</span></p>
                <p className="text-[10px] text-white/50">DEF <span className="text-white font-bold">{c.defense}</span></p>
                <p className="text-[10px] text-white/50">SPD <span className="text-white font-bold">{c.speed}</span></p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Back */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-gradient-to-t from-arena-bg">
        <Link to="/" className="block w-full text-center py-3 rounded-xl bg-arena-surface border border-arena-border text-sm font-semibold text-arena-muted">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

// ─── Battle Screen ────────────────────────────────────────────────────────────

function BattleScreen({ myClass, opponentClass }: { myClass: ChampionClass; opponentClass: ChampionClass }) {
  const champA = CHAMPIONS[myClass];
  const champB = CHAMPIONS[opponentClass];
  const myCardConfig = CHAMPION_CARDS[myClass];

  const {
    phase, battleState, playerA, playerB,
    selectedCards, canConfirm, selectCard, confirmTurn,
    winner, resetBattle,
  } = useBattleCards(myClass, opponentClass, true);

  return (
    <div className="flex flex-col min-h-screen bg-arena-bg pb-2">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-2 border-b border-arena-border shrink-0">
        <Link to="/demo" className="text-arena-muted text-xl leading-none">←</Link>
        <div className="flex-1">
          <p className="font-display text-arena-primary text-[10px] tracking-widest">DEMO BATTLE</p>
          <p className="text-[11px] text-arena-muted">{champA.name} vs {champB.name}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
          phase === "result" ? "bg-purple-500/20 text-purple-400" :
          phase === "resolving" ? "bg-arena-primary/20 text-arena-primary" :
          "bg-arena-success/20 text-arena-success"
        }`}>
          {phase === "result" ? "DONE" : phase === "resolving" ? "ACTIVE" : `TURN ${battleState.turn}`}
        </span>
      </div>

      {/* VS Arena */}
      <div className="relative shrink-0 overflow-hidden" style={{ height: 210 }}>
        {/* Battlefield background */}
        <BattleArenaBackground classA={myClass} classB={opponentClass}/>

        {/* Champions overlay */}
        <div className="absolute inset-0 grid grid-cols-2 gap-2 px-3 pt-4 pb-2">
          {/* Player A — YOU */}
          <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${
            phase === "result" && winner === "B" ? "opacity-40 grayscale" : ""
          }`}>
            <div className={`relative rounded-2xl p-2.5 border ${champA.borderColor} bg-black/40 backdrop-blur-sm ${
              phase === "result" && winner === "A" ? "ring-2 ring-arena-primary ring-offset-1 ring-offset-transparent" : ""
            }`}>
              <ChampionArt class_={myClass} size={64} animated={phase === "resolving"}/>
              {phase === "result" && winner === "A" && (
                <div className="absolute -top-2 -right-2 text-lg animate-bounce">👑</div>
              )}
            </div>
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 space-y-0.5">
              <p className="text-[10px] font-bold text-white text-center">{champA.name}</p>
              <p className="text-[9px] text-arena-primary text-center font-bold">YOU</p>
              <StatBars hp={playerA.displayHp} shield={playerA.displayShield} side="A"/>
            </div>
          </div>

          {/* Player B — AI */}
          <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${
            phase === "result" && winner === "A" ? "opacity-40 grayscale" : ""
          }`}>
            <div className={`relative rounded-2xl p-2.5 border ${champB.borderColor} bg-black/40 backdrop-blur-sm ${
              phase === "result" && winner === "B" ? "ring-2 ring-arena-primary ring-offset-1 ring-offset-transparent" : ""
            }`}>
              <ChampionArt class_={opponentClass} size={64} animated={phase === "resolving"}/>
              {phase === "result" && winner === "B" && (
                <div className="absolute -top-2 -right-2 text-lg animate-bounce">👑</div>
              )}
            </div>
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 space-y-0.5">
              <p className="text-[10px] font-bold text-white text-center">{champB.name}</p>
              <p className="text-[9px] text-arena-muted text-center">AI</p>
              <StatBars hp={playerB.displayHp} shield={playerB.displayShield} side="B"/>
            </div>
          </div>
        </div>

        {/* VS pill */}
        <div className="absolute inset-x-0 top-8 flex justify-center pointer-events-none">
          <div className="px-2.5 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-sm">
            <span className="text-[10px] font-display text-arena-primary">VS</span>
          </div>
        </div>
      </div>

      {/* Winner banner */}
      {phase === "result" && (
        <div className="mx-3 my-2 p-3 rounded-2xl bg-arena-primary/10 border border-arena-primary/30 text-center">
          <p className="text-xl mb-0.5">{winner === "A" ? "🏆" : "💀"}</p>
          <p className="font-display text-arena-primary text-sm">
            {winner === "A" ? "VOCÊ VENCEU!" : winner === "B" ? "DERROTA..." : "EMPATE!"}
          </p>
          <p className="text-[11px] text-arena-muted mt-1">
            {winner === "A" ? "+3 ranking points (real arena)" : "+1 ranking point (real arena)"}
          </p>
        </div>
      )}

      {/* Phase indicator */}
      {phase === "resolving" && (
        <p className="text-center text-xs text-arena-primary animate-pulse px-4 py-1">⚔️ Resolving turn…</p>
      )}
      {phase === "choose" && (
        <p className="text-center text-[11px] text-white/50 px-4 py-1">Turn {battleState.turn} — Select your cards</p>
      )}

      {/* Card hand */}
      {(phase === "choose" || phase === "resolving") && (
        <div className="px-3 shrink-0">
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
          <button
            onClick={confirmTurn}
            disabled={!canConfirm || phase === "resolving"}
            className="mt-2 w-full py-3.5 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm active:scale-95 transition-transform shadow-lg shadow-arena-primary/30 disabled:opacity-40"
          >
            {phase === "resolving" ? "⚔️ Resolving…" :
             battleState.statusA === "stunned" ? "💫 End Turn (Stunned)" :
             selectedCards.length === 0 ? "Select a card to play" :
             `⚔️ Play ${selectedCards.length} Card${selectedCards.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {/* Battle log */}
      <div className="flex-1 mx-3 mt-2 min-h-0">
        <p className="text-[9px] text-arena-muted uppercase tracking-wider mb-1 font-semibold">Battle Log</p>
        <div className="h-24 overflow-y-auto bg-arena-surface rounded-xl border border-arena-border p-2 scrollbar-hide">
          {battleState.log.length === 0 && (
            <p className="text-[10px] text-arena-muted text-center py-4">Select cards and press Play to begin!</p>
          )}
          {battleState.log.map((entry, i) => <LogRow key={i} log={entry}/>)}
          {phase === "resolving" && (
            <div className="flex items-center gap-1 py-0.5 text-[10px] text-arena-primary animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-arena-primary animate-ping"/>
              Processing…
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-3 pt-2 flex flex-col gap-2 shrink-0">
        {phase === "result" && (
          <>
            <button
              onClick={() => resetBattle(myClass, opponentClass)}
              className="w-full py-3 rounded-xl bg-arena-surface border border-arena-border text-sm font-semibold text-white active:scale-95 transition-transform"
            >
              🔄 Play Again
            </button>
            <Link
              to="/arena"
              className="block w-full py-3.5 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm text-center active:scale-95 transition-transform shadow-lg shadow-arena-primary/30"
            >
              ⚔️ Enter Real Arena
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [myClass,       setMyClass]       = useState<ChampionClass | null>(null);
  const [opponentClass, setOpponentClass] = useState<ChampionClass | null>(null);

  const handlePick = (c: ChampionClass) => {
    // AI always picks a different champion
    const others = [0, 1, 2, 3, 4].filter((v) => v !== c) as ChampionClass[];
    const ai = others[Math.floor(Math.random() * others.length)];
    setMyClass(c);
    setOpponentClass(ai);
  };

  if (myClass === null || opponentClass === null) {
    return <ChampionPicker onPick={handlePick}/>;
  }

  return <BattleScreen myClass={myClass} opponentClass={opponentClass}/>;
}
