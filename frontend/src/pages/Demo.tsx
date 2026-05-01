/**
 * Demo.tsx — Batalha demo completa, sem carteira.
 *
 * Fluxo:
 *  1. Seletor de campeão (com arte + arena de fundo em cada card)
 *  2. Batalha de cartas completa contra IA
 *  3. Resultado + CTAs para Arena real
 */

import { useState, useRef, useEffect } from "react";
import { Link }                        from "react-router-dom";
import { CHAMPIONS, ChampionClass }    from "@/lib/champions";
import { ChampionArt }                 from "@/components/ChampionArt";
import CardHand                        from "@/components/CardHand";
import { BattleArenaBackground }       from "@/components/BattleArena";
import { useBattleCards }              from "@/hooks/useBattleCards";
import { CHAMPION_CARDS, BASE_HP, BASE_SHIELD, type TurnLog } from "@/lib/championCards";

// ─── HP + Shield bars ─────────────────────────────────────────────────────────

function StatBars({ hp, shield, side }: { hp: number; shield: number; side: "A" | "B" }) {
  const hpPct = Math.max(0, Math.min(100, (hp     / BASE_HP)     * 100));
  const shPct = Math.max(0, Math.min(100, (shield / BASE_SHIELD) * 100));
  const hpColor = hpPct > 50 ? "bg-emerald-500" : hpPct > 25 ? "bg-amber-400" : "bg-red-500";
  const align   = side === "B" ? "items-end" : "items-start";

  return (
    <div className={`flex flex-col gap-0.5 ${align}`}>
      <div className="flex items-center gap-1">
        <span className="text-[9px]">❤️</span>
        <span className="text-xs font-bold tabular-nums text-white">{hp}</span>
      </div>
      <div className="w-24 h-2 rounded-full bg-black/50 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${hpColor}`} style={{ width: `${hpPct}%` }} />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[9px]">🛡️</span>
        <span className="text-xs font-bold tabular-nums text-cyan-300">{shield}</span>
      </div>
      <div className="w-24 h-1.5 rounded-full bg-black/50 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500 bg-cyan-500" style={{ width: `${shPct}%` }} />
      </div>
    </div>
  );
}

// ─── Linha do log ─────────────────────────────────────────────────────────────

function LogRow({ log }: { log: TurnLog }) {
  const icon:  Record<TurnLog["type"], string> = { damage:"⚔️", shield:"🛡️", heal:"💚", status:"💫", ultimate:"✨", death:"💀", info:"ℹ️" };
  const color: Record<TurnLog["type"], string> = {
    damage:"text-red-400", shield:"text-cyan-400", heal:"text-emerald-400",
    status:"text-yellow-400", ultimate:"text-arena-primary", death:"text-red-400 font-bold", info:"text-arena-muted",
  };
  return (
    <div className={`flex items-start gap-1.5 py-0.5 text-[10px] leading-tight ${color[log.type]}`}>
      <span className="shrink-0 w-4 text-center">{icon[log.type]}</span>
      <span>{log.text}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SELETOR DE CAMPEÃO
// ─────────────────────────────────────────────────────────────────────────────

function ChampionPicker({ onPick }: { onPick: (c: ChampionClass) => void }) {
  return (
    <div className="flex flex-col min-h-screen bg-arena-bg">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-3 border-b border-arena-border">
        <Link to="/" className="text-arena-muted text-xl leading-none">←</Link>
        <div>
          <p className="font-display text-arena-primary text-[10px] tracking-widest">DEMO BATTLE</p>
          <p className="text-xs text-arena-muted">Escolha seu campeão</p>
        </div>
      </div>

      {/* Grade de campeões — cada card mostra arte + arena + stats */}
      <div className="flex-1 p-4 pb-6">
        <p className="text-[11px] text-arena-muted text-center mb-4">
          Sem carteira necessária · IA como adversário
        </p>

        <div className="grid grid-cols-2 gap-3">
          {CHAMPIONS.map(c => (
            <button
              key={c.class}
              onClick={() => onPick(c.class)}
              className="relative overflow-hidden rounded-2xl active:scale-95 transition-transform text-left"
              style={{ height: 200 }}
            >
              {/* Arena de fundo */}
              <BattleArenaBackground classA={c.class} />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              {/* Arte do campeão */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: 48 }}>
                <ChampionArt class_={c.class} size={80} animated={true} />
              </div>

              {/* Borda colorida */}
              <div className={`absolute inset-0 rounded-2xl border-2 ${c.borderColor} pointer-events-none`} />

              {/* Info na base */}
              <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                <p className="text-white text-sm font-bold">{c.name}</p>
                <p className="text-white/60 text-[10px]">{c.role}</p>
                {/* Mini stats */}
                <div className="flex gap-2 mt-1">
                  <span className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded">⚔️ {c.attack}</span>
                  <span className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded">🛡️ {c.defense}</span>
                  <span className="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.5 rounded">⚡ {c.speed}</span>
                </div>
              </div>

              {/* Badge de ultimate */}
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5">
                <span className="text-[9px] text-arena-primary font-bold">
                  {CHAMPION_CARDS[c.class].cards[3].name}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Tupã — card extra no centro (5 é ímpar) */}
        {/* Já coberto pela grid — o 5º item ocupa metade da última linha */}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TELA DE BATALHA
// ─────────────────────────────────────────────────────────────────────────────

function BattleScreen({
  myClass,
  opponentClass,
  onReset,
}: {
  myClass:       ChampionClass;
  opponentClass: ChampionClass;
  onReset:       () => void;
}) {
  const logRef       = useRef<HTMLDivElement>(null);
  const champA       = CHAMPIONS[myClass];
  const champB       = CHAMPIONS[opponentClass];
  const myCardConfig = CHAMPION_CARDS[myClass];

  const {
    phase, battleState, playerA, playerB,
    selectedCards, canConfirm, selectCard, confirmTurn,
    winner,
  } = useBattleCards(myClass, opponentClass, true);

  // Auto-scroll do log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [battleState.log.length]);

  return (
    <div className="flex flex-col min-h-screen bg-arena-bg pb-2">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-2 border-b border-arena-border shrink-0">
        <button onClick={onReset} className="text-arena-muted text-xl leading-none">←</button>
        <div className="flex-1">
          <p className="font-display text-arena-primary text-[10px] tracking-widest">DEMO BATTLE</p>
          <p className="text-[11px] text-arena-muted">{champA.name} vs {champB.name}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
          phase === "result"    ? "bg-purple-500/20 text-purple-400"     :
          phase === "resolving" ? "bg-orange-500/20 text-orange-400 animate-pulse" :
          "bg-arena-success/20 text-arena-success"
        }`}>
          {phase === "result" ? "FIM" : phase === "resolving" ? "RESOLVENDO" : `TURNO ${battleState.turn}`}
        </span>
      </div>

      {/* ── ARENA ── */}
      <div className="relative shrink-0 overflow-hidden" style={{ height: 216 }}>
        <BattleArenaBackground classA={myClass} classB={opponentClass} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-arena-bg/60" />

        {/* VS pill */}
        <div className="absolute top-3 inset-x-0 flex justify-center z-10 pointer-events-none">
          <div className="px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-sm">
            <span className="text-[10px] font-display text-arena-primary">VS</span>
          </div>
        </div>

        {/* Campeões */}
        <div className="absolute inset-0 z-10 grid grid-cols-2 gap-2 px-3 pt-8 pb-2">
          {/* VOCÊ */}
          <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${
            phase === "result" && winner === "B" ? "opacity-40 grayscale" : ""
          }`}>
            <div className={`relative rounded-2xl p-2 border ${champA.borderColor} bg-black/50 backdrop-blur-sm ${
              phase === "result" && winner === "A" ? "ring-2 ring-arena-primary ring-offset-1 ring-offset-transparent shadow-[0_0_20px_rgba(246,201,14,0.5)]" : ""
            }`}>
              <ChampionArt class_={myClass} size={60} animated={phase === "resolving"} />
              {phase === "result" && winner === "A" && (
                <div className="absolute -top-2 -right-2 text-lg animate-bounce">👑</div>
              )}
            </div>
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 space-y-0.5 w-full">
              <p className="text-[10px] font-bold text-white text-center">{champA.name}</p>
              <p className="text-[9px] text-arena-primary text-center font-bold">VOCÊ</p>
              <StatBars hp={playerA.displayHp} shield={playerA.displayShield} side="A" />
            </div>
          </div>

          {/* IA */}
          <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${
            phase === "result" && winner === "A" ? "opacity-40 grayscale" : ""
          }`}>
            <div className={`relative rounded-2xl p-2 border ${champB.borderColor} bg-black/50 backdrop-blur-sm ${
              phase === "result" && winner === "B" ? "ring-2 ring-arena-primary ring-offset-1 ring-offset-transparent shadow-[0_0_20px_rgba(246,201,14,0.5)]" : ""
            }`}>
              <ChampionArt class_={opponentClass} size={60} animated={phase === "resolving"} />
              {phase === "result" && winner === "B" && (
                <div className="absolute -top-2 -right-2 text-lg animate-bounce">👑</div>
              )}
            </div>
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 space-y-0.5 w-full">
              <p className="text-[10px] font-bold text-white text-center">{champB.name}</p>
              <p className="text-[9px] text-arena-muted text-center">IA</p>
              <StatBars hp={playerB.displayHp} shield={playerB.displayShield} side="B" />
            </div>
          </div>
        </div>
      </div>

      {/* ── BANNER DE RESULTADO ── */}
      {phase === "result" && (
        <div className="mx-3 mt-2 p-3 rounded-2xl bg-arena-primary/10 border border-arena-primary/40 text-center">
          <p className="text-2xl">{winner === "A" ? "🏆" : winner === "B" ? "💀" : "🤝"}</p>
          <p className="font-display text-arena-primary text-sm mt-1">
            {winner === "A" ? "VOCÊ VENCEU!" : winner === "B" ? "DERROTA!" : "EMPATE!"}
          </p>
          <p className="text-[11px] text-arena-muted mt-1">
            {winner === "A" ? "+3 pts ranking (arena real)" : "+1 pt ranking (arena real)"}
          </p>
        </div>
      )}

      {/* ── FASE ── */}
      {phase === "resolving" && (
        <p className="text-center text-xs text-arena-primary animate-pulse px-4 py-1.5">⚔️ Resolvendo turno…</p>
      )}
      {phase === "choose" && (
        <p className="text-center text-[11px] text-white/50 px-4 py-1.5">
          Turno {battleState.turn} — Escolha suas cartas
        </p>
      )}

      {/* ── CARTAS ── */}
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
            className="mt-2 w-full py-3.5 rounded-xl bg-arena-primary text-arena-bg font-bold text-sm active:scale-95 transition-transform shadow-lg shadow-arena-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {phase === "resolving"
              ? "⚔️ Resolvendo…"
              : battleState.statusA === "stunned"
              ? "💫 Fim de Turno (Stunned)"
              : selectedCards.length === 0
              ? "Selecione uma carta"
              : `⚔️ Jogar ${selectedCards.length} Carta${selectedCards.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {/* ── LOG ── */}
      <div className="flex-1 mx-3 mt-2 min-h-0">
        <p className="text-[9px] text-arena-muted uppercase tracking-wider mb-1 font-semibold">Log da Batalha</p>
        <div
          ref={logRef}
          className="h-24 overflow-y-auto bg-arena-surface rounded-xl border border-arena-border p-2 scrollbar-hide"
        >
          {battleState.log.length === 0 && (
            <p className="text-[10px] text-arena-muted text-center py-3">Selecione cartas e confirme para começar!</p>
          )}
          {battleState.log.map((entry, i) => <LogRow key={i} log={entry} />)}
          {phase === "resolving" && (
            <div className="flex items-center gap-1.5 py-0.5 text-[10px] text-arena-primary animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-arena-primary animate-ping" />
              Processando…
            </div>
          )}
        </div>
      </div>

      {/* ── CTAs DE RESULTADO ── */}
      {phase === "result" && (
        <div className="px-3 pt-2 flex flex-col gap-2 shrink-0">
          <button
            onClick={onReset}
            className="w-full py-3 rounded-xl bg-arena-surface border border-arena-border text-sm font-semibold text-white active:scale-95 transition-transform"
          >
            🔄 Jogar Novamente
          </button>
          <Link
            to="/arena"
            className="block w-full py-3.5 rounded-xl bg-arena-primary text-arena-bg font-bold text-sm text-center active:scale-95 transition-transform shadow-lg shadow-arena-primary/30"
          >
            ⚔️ Entrar na Arena Real
          </Link>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RAIZ DA PÁGINA
// ─────────────────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [myClass,       setMyClass]       = useState<ChampionClass | null>(null);
  const [opponentClass, setOpponentClass] = useState<ChampionClass | null>(null);

  const handlePick = (c: ChampionClass) => {
    const others = ([0, 1, 2, 3, 4] as ChampionClass[]).filter(v => v !== c);
    const ai     = others[Math.floor(Math.random() * others.length)];
    setMyClass(c);
    setOpponentClass(ai);
  };

  const handleReset = () => {
    setMyClass(null);
    setOpponentClass(null);
  };

  if (myClass === null || opponentClass === null) {
    return <ChampionPicker onPick={handlePick} />;
  }

  return (
    <BattleScreen
      myClass={myClass}
      opponentClass={opponentClass}
      onReset={handleReset}
    />
  );
}
