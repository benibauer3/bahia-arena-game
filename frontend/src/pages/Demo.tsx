/**
 * Demo.tsx — Batalha vs IA. Requer carteira conectada + depósito de 1 USDT.
 *
 * Fluxo:
 *  0. PlayGate        — verifica carteira + depósito
 *  1. ChampionPicker  — escolha seu campeão
 *  2. SetupScreen     — escolha dificuldade + arena
 *  3. BattleScreen    — batalha contra IA
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Link }                         from "react-router-dom";
import { useAccount, useReadContract, useWriteContract, useConnect } from "wagmi";
import { injected }                     from "wagmi/connectors";
import { CHAMPIONS, ChampionClass }     from "@/lib/champions";
import { ChampionArt }                  from "@/components/ChampionArt";
import CardHand                         from "@/components/CardHand";
import { BattleArenaBackground, ArenaTheme } from "@/components/BattleArena";
import FloatingCombatText, { FloatItem } from "@/components/FloatingCombatText";
import { useBattleCards, Difficulty }   from "@/hooks/useBattleCards";
import { CHAMPION_CARDS, BASE_HP, BASE_SHIELD, type TurnLog } from "@/lib/championCards";
import BahiaArenaLogo                   from "@/components/BahiaArenaLogo";
import BattleAbilityFX                  from "@/components/BattleAbilityFX";
import { usePlayerProfile }             from "@/hooks/usePlayerProfile";
import { DIFF_PTS, STREAK_BONUS }       from "@/lib/playerStore";
import { ACTIVE_CONTRACTS, ARENA_ABI, ERC20_ABI } from "@/lib/contracts";

// ─── Types ────────────────────────────────────────────────────────────────────

type FlashType = "hit" | "heal" | "shield" | "ultimate" | null;

// ── Per-champion attack animation class (CSS) ─────────────────────────────────
const CHAMP_ATTACK_ANIM: Record<ChampionClass, string> = {
  [ChampionClass.CURUPIRA]: "animate-champ-stomp",  // ground slam
  [ChampionClass.IARA]:     "animate-champ-rise",   // float & wave
  [ChampionClass.BOITATA]:  "animate-champ-coil",   // coil-and-strike
  [ChampionClass.ANHANGA]:  "animate-champ-blink",  // shadow blink
  [ChampionClass.TUPA]:     "animate-champ-bolt",   // lightning leap
};

// Per-champion FX color (matches BattleAbilityFX theme)
const CHAMP_FX_COLOR: Record<ChampionClass, string> = {
  [ChampionClass.CURUPIRA]: "#22c55e",
  [ChampionClass.IARA]:     "#22d3ee",
  [ChampionClass.BOITATA]:  "#f97316",
  [ChampionClass.ANHANGA]:  "#7c3aed",
  [ChampionClass.TUPA]:     "#fbbf24",
};

function flashClass(f: FlashType): string {
  if (!f) return "";
  return f === "hit"    ? "animate-flash-red"  :
         f === "heal"   ? "animate-flash-green" :
         f === "shield" ? "animate-flash-cyan"  :
                          "animate-flash-gold";
}

// ─── Champion HUD ─────────────────────────────────────────────────────────────

function ChampionHud({
  label, labelColor, name, hp, shield,
}: { label: string; labelColor: string; name: string; hp: number; shield: number }) {
  const hpPct = Math.max(0, Math.min(100, (hp     / BASE_HP)     * 100));
  const shPct = Math.max(0, Math.min(100, (shield / BASE_SHIELD) * 100));
  const hpCol = hpPct > 50 ? "bg-emerald-500" : hpPct > 25 ? "bg-amber-400" : "bg-red-500";

  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-xl px-2.5 py-1.5 min-w-[112px] max-w-[132px]">
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className={`text-[8px] font-bold uppercase tracking-wide ${labelColor}`}>{label}</span>
        <span className="text-[9px] font-semibold text-white truncate">{name}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[8px]">❤️</span>
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${hpCol}`} style={{ width: `${hpPct}%` }} />
        </div>
        <span className="text-[8px] tabular-nums text-white/80 w-6 text-right">{hp}</span>
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-[8px]">🛡️</span>
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500 bg-cyan-400" style={{ width: `${shPct}%` }} />
        </div>
        <span className="text-[8px] tabular-nums text-cyan-300 w-6 text-right">{shield}</span>
      </div>
    </div>
  );
}

// ─── Log row ──────────────────────────────────────────────────────────────────

function LogRow({ log }: { log: TurnLog }) {
  const ICON:  Record<TurnLog["type"], string> = { damage:"⚔️", shield:"🛡️", heal:"💚", status:"💫", ultimate:"✨", death:"💀", info:"ℹ️" };
  const COLOR: Record<TurnLog["type"], string> = {
    damage:"text-red-400", shield:"text-cyan-400", heal:"text-emerald-400",
    status:"text-yellow-400", ultimate:"text-arena-primary", death:"text-red-400 font-bold", info:"text-arena-muted",
  };
  return (
    <div className={`flex items-start gap-1.5 py-0.5 text-[10px] leading-tight ${COLOR[log.type]}`}>
      <span className="shrink-0 w-4 text-center">{ICON[log.type]}</span>
      <span>{log.text}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CHAMPION PICKER
// ─────────────────────────────────────────────────────────────────────────────

function ChampionPicker({ onPick }: { onPick: (c: ChampionClass) => void }) {
  return (
    <div className="flex flex-col min-h-screen bg-arena-bg">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-arena-border">
        <Link to="/" className="text-arena-muted text-xl shrink-0">←</Link>
        <BahiaArenaLogo size={38} showWordmark={false} />
        <div>
          <p className="font-display text-arena-primary text-[10px] tracking-widest">BATTLE</p>
          <p className="text-xs text-arena-muted">Pick your champion</p>
        </div>
      </div>

      <div className="flex-1 p-4 pb-6">
        <p className="text-[11px] text-arena-muted text-center mb-4">VS AI · Wallet connected</p>
        <div className="grid grid-cols-2 gap-3">
          {CHAMPIONS.map(c => (
            <button
              key={c.class}
              onClick={() => onPick(c.class)}
              className="relative overflow-hidden rounded-2xl active:scale-95 transition-transform"
              style={{ height: 200 }}
            >
              <BattleArenaBackground classA={c.class} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center pb-10">
                <ChampionArt class_={c.class} size={80} animated={true} />
              </div>
              <div className={`absolute inset-0 rounded-2xl border-2 ${c.borderColor} pointer-events-none`} />
              <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                <p className="text-white text-sm font-bold leading-tight">{c.name}</p>
                <p className="text-white/60 text-[9px] mb-1.5">{c.role}</p>
                {/* Stat bars */}
                <div className="space-y-0.5">
                  {[
                    { label:"ATK", value: c.attack,  max: 60, color:"bg-red-400"    },
                    { label:"DEF", value: c.defense, max: 50, color:"bg-blue-400"   },
                    { label:"SPD", value: c.speed,   max: 40, color:"bg-yellow-400" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1">
                      <span className="text-[7px] text-white/50 w-5 shrink-0">{s.label}</span>
                      <div className="flex-1 h-1 rounded-full bg-black/40">
                        <div
                          className={`h-1 rounded-full ${s.color}`}
                          style={{ width: `${Math.round((s.value / s.max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                <span className="text-[9px] text-arena-primary font-bold">{CHAMPION_CARDS[c.class].cards[3].name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SETUP SCREEN — dificuldade + arena
// ─────────────────────────────────────────────────────────────────────────────

interface SetupConfig {
  difficulty: Difficulty;
  arena:      ArenaTheme;
}

const DIFFICULTIES: {
  id:    Difficulty;
  label: string;
  emoji: string;
  desc:  string;
  color: string;
}[] = [
  {
    id: "easy",   label: "Easy",      emoji: "🟢",
    desc:  "AI plays 1 card · no ultimate",
    color: "border-emerald-500 bg-emerald-500/10 text-emerald-400",
  },
  {
    id: "medium", label: "Medium",    emoji: "🟡",
    desc:  "AI plays 2 cards · uses ultimate",
    color: "border-amber-400  bg-amber-400/10  text-amber-300",
  },
  {
    id: "hard",   label: "Hard",      emoji: "🔴",
    desc:  "Tactical AI · aggressive ultimate",
    color: "border-red-500   bg-red-500/10   text-red-400",
  },
  {
    id: "legendary", label: "Legendary", emoji: "⭐",
    desc:  "Perfect AI · no mercy",
    color: "border-arena-primary bg-arena-primary/10 text-arena-primary",
  },
];

const ARENAS: { id: ArenaTheme; label: string; emoji: string }[] = [
  { id: "amazon",  label: "Amazon Rainforest",        emoji: "🌿" },
  { id: "stadium", label: "Maracanã",                 emoji: "⚽" },
  { id: "sea",     label: "Bay of All Saints",        emoji: "⛵" },
];

function SetupScreen({
  myClass,
  onStart,
  onBack,
}: {
  myClass:  ChampionClass;
  onStart:  (cfg: SetupConfig) => void;
  onBack:   () => void;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [arena,      setArena]      = useState<ArenaTheme>("amazon");
  const champ = CHAMPIONS[myClass];

  return (
    <div className="flex flex-col min-h-screen bg-arena-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-arena-border shrink-0">
        <button onClick={onBack} className="text-arena-muted text-xl shrink-0">←</button>
        <BahiaArenaLogo size={38} showWordmark={false} />
        <div>
          <p className="font-display text-arena-primary text-[10px] tracking-widest">BATTLE SETUP</p>
          <p className="text-xs text-arena-muted">Selected: {champ.name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5 pt-4">

        {/* Chosen champion preview */}
        <div className="relative overflow-hidden rounded-2xl" style={{ height: 120 }}>
          <BattleArenaBackground classA={myClass} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/70" />
          <div className="absolute inset-0 flex items-center gap-4 px-5">
            <ChampionArt class_={myClass} size={80} animated={true} />
            <div>
              <p className="text-white font-bold text-lg leading-tight">{champ.name}</p>
              <p className="text-white/70 text-xs">{champ.role}</p>
              <div className="flex gap-2 mt-1.5">
                <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full">⚔️ {champ.attack}</span>
                <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full">🛡️ {champ.defense}</span>
              </div>
              <p className="text-arena-primary text-[10px] mt-1 font-semibold">
                ✨ Ultimate: {CHAMPION_CARDS[myClass].cards[3].name}
              </p>
            </div>
          </div>
          <div className={`absolute inset-0 rounded-2xl border-2 ${champ.borderColor} pointer-events-none`} />
        </div>

        {/* Difficulty */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-white uppercase tracking-wider">⚙️ Difficulty</p>
            <p className="text-[10px] text-arena-muted">Harder = more points</p>
          </div>
          <div className="space-y-2">
            {DIFFICULTIES.map(d => {
              const pts   = DIFF_PTS[d.id];
              const strk  = STREAK_BONUS[d.id];
              const isSelected = difficulty === d.id;
              return (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all active:scale-[0.98]
                  ${isSelected ? d.color : "border-arena-border bg-arena-surface text-arena-muted"}`}
              >
                <span className="text-xl shrink-0">{d.emoji}</span>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight">{d.label}</p>
                  <p className="text-[10px] opacity-80">{d.desc}</p>
                </div>
                {/* Point preview */}
                <div className="text-right shrink-0 text-[10px] leading-snug">
                  <p className={`font-bold ${isSelected ? "opacity-100" : "opacity-50"}`}>
                    V +{pts.win}pts
                  </p>
                  <p className={`${isSelected ? "opacity-70" : "opacity-40"}`}>
                    🔥×3 +{strk.s3}
                  </p>
                </div>
                {isSelected && (
                  <span className="text-xs font-bold">✓</span>
                )}
              </button>
              );
            })}
          </div>
        </div>

        {/* Arena */}
        <div>
          <p className="text-xs font-semibold text-white uppercase tracking-wider mb-2">🗺️ Battlefield</p>
          <div className="space-y-2">
            {ARENAS.map(a => (
              <button
                key={a.id}
                onClick={() => setArena(a.id)}
                className={`w-full relative overflow-hidden rounded-xl border-2 transition-all active:scale-[0.98]
                  ${arena === a.id ? "border-arena-primary" : "border-arena-border"}`}
                style={{ height: 72 }}
              >
                <BattleArenaBackground theme={a.id} />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
                <div className="absolute inset-0 flex items-center gap-3 px-4">
                  <span className="text-2xl">{a.emoji}</span>
                  <p className="text-white font-bold text-sm">{a.label}</p>
                </div>
                {arena === a.id && (
                  <div className="absolute top-2 right-2 text-arena-primary text-sm font-bold">✓</div>
                )}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* CTA */}
      <div className="px-4 pb-6 pt-2 shrink-0">
        <button
          onClick={() => onStart({ difficulty, arena })}
          className="w-full py-4 rounded-2xl bg-arena-primary text-arena-bg font-bold text-base active:scale-[0.98] transition-transform shadow-lg shadow-arena-primary/40"
          style={{ boxShadow: "0 4px 24px rgba(246,201,14,0.35)" }}
        >
          ⚔️ BATTLE!
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BATTLE SCREEN
// ─────────────────────────────────────────────────────────────────────────────

function BattleScreen({
  myClass, opponentClass, difficulty, arena, onReset, trialMode,
}: {
  myClass:       ChampionClass;
  opponentClass: ChampionClass;
  difficulty:    Difficulty;
  arena:         ArenaTheme;
  onReset:       () => void;
  trialMode?:    boolean;
}) {
  const logRef       = useRef<HTMLDivElement>(null);
  const champA       = CHAMPIONS[myClass];
  const champB       = CHAMPIONS[opponentClass];
  const myCardConfig = CHAMPION_CARDS[myClass];

  const {
    phase, battleState, playerA, playerB,
    selectedCards, canConfirm, selectCard, confirmTurn,
    lastResult, winner,
  } = useBattleCards(myClass, opponentClass, true, difficulty);

  // ── Animation state ──────────────────────────────────────────────────────────
  const [floatA,         setFloatA]         = useState<FloatItem[]>([]);
  const [floatB,         setFloatB]         = useState<FloatItem[]>([]);
  const [animKeyA,       setAnimKeyA]       = useState(0);
  const [animKeyB,       setAnimKeyB]       = useState(0);
  const [shakeA,         setShakeA]         = useState(false);
  const [shakeB,         setShakeB]         = useState(false);
  const [flashA,         setFlashA]         = useState<FlashType>(null);
  const [flashB,         setFlashB]         = useState<FlashType>(null);
  const [flashKeyA,      setFlashKeyA]      = useState(0);
  const [flashKeyB,      setFlashKeyB]      = useState(0);
  const [abilityFX,      setAbilityFX]      = useState({ attackA: false, attackB: false, selfA: false, selfB: false, ultA: false, ultB: false, key: 0 });
  const [screenFlash,    setScreenFlash]    = useState(false);
  // ── SF3/SF6/DBFZ extra states ────────────────────────────────────────────
  const [afterimageA,    setAfterimageA]    = useState(false);
  const [afterimageB,    setAfterimageB]    = useState(false);
  const [showCounterHit, setShowCounterHit] = useState(false);
  const [counterHitKey,  setCounterHitKey]  = useState(0);
  const [counterHitText, setCounterHitText] = useState("COUNTER HIT!");
  const [counterHitSide, setCounterHitSide] = useState<"A"|"B">("B");
  const [showParry,      setShowParry]      = useState(false);
  const [parryKey,       setParryKey]       = useState(0);
  const [lungeA,         setLungeA]         = useState(0);   // px offset toward B
  const [lungeB,         setLungeB]         = useState(0);   // px offset toward A
  const [attackingA,     setAttackingA]     = useState(false); // triggers per-class attack anim
  const [attackingB,     setAttackingB]     = useState(false);
  const [screenFlashKey, setScreenFlashKey] = useState(0);
  const lastTurnRef = useRef(-1);
  const { addMatchResult, profile: playerProfile, isConnected } = usePlayerProfile();
  const [matchPoints, setMatchPoints] = useState<number | null>(null);
  const matchRecordedRef = useRef(false);

  // ── On-chain battle recording ────────────────────────────────────────────────
  const { address: playerAddr } = useAccount();
  const { writeContractAsync: writeArena } = useWriteContract();
  const [chainStatus,  setChainStatus]  = useState<"idle"|"recording"|"success"|"error">("idle");
  const [chainTxHash,  setChainTxHash]  = useState("");
  const chainRecordedRef = useRef(false);

  const { data: lastCheckIn }    = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi:     ARENA_ABI,
    functionName: "lastCheckIn",
    args:    playerAddr ? [playerAddr] : undefined,
    query:   { enabled: !!playerAddr },
  });
  const { data: checkInCooldown } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi:     ARENA_ABI,
    functionName: "CHECKIN_COOLDOWN",
  });
  const canCheckIn = !!playerAddr
    && lastCheckIn    !== undefined
    && checkInCooldown !== undefined
    && BigInt(Math.floor(Date.now() / 1000)) >= (lastCheckIn as bigint) + (checkInCooldown as bigint);

  // ── SF cinematic state ──────────────────────────────────────────────────────
  const [fightBanner,     setFightBanner]     = useState<string>("FIGHT!");
  const [fightBannerKey,  setFightBannerKey]  = useState(0);
  const [showFightBanner, setShowFightBanner] = useState(true);
  const [moveText,        setMoveText]        = useState<string | null>(null);
  const [moveTextKey,     setMoveTextKey]     = useState(0);
  const [showResultCTAs,  setShowResultCTAs]  = useState(false);

  const champFxColor    = CHAMP_FX_COLOR[myClass];
  const opponentFxColor = CHAMP_FX_COLOR[opponentClass];

  useEffect(() => {
    if (!lastResult) return;
    const turn = lastResult.newState.turn;
    if (turn === lastTurnRef.current) return;
    lastTurnRef.current = turn;

    const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // ── Parse log: FX flags + impact data ────────────────────────────────
    let atA = false, atB = false, sA = false, sB = false, uA = false, uB = false;
    const nFA: FloatItem[] = [], nFB: FloatItem[] = [];
    let hitA = false, hitB = false;
    let fA: FlashType = null, fB: FlashType = null;
    let doFlash = false;

    for (const e of lastResult.newState.log) {
      if (e.type === "damage") {
        if (e.side === "A") atA = true;
        if (e.side === "B") atB = true;
        if (e.side === "A" && typeof e.damage === "number") { hitA = true; fA = "hit"; nFA.push({ id: uid(), label: `-${e.damage}`, type: "damage" }); }
        if (e.side === "B" && typeof e.damage === "number") { hitB = true; fB = "hit"; nFB.push({ id: uid(), label: `-${e.damage}`, type: "damage" }); }
      }
      if (e.type === "ultimate") {
        if (e.side === "A") { atA = true; uA = true; fA = "ultimate"; nFA.push({ id: uid(), label: "✨ ULTIMATE!", type: "ultimate" }); }
        if (e.side === "B") { atB = true; uB = true; fB = "ultimate"; nFB.push({ id: uid(), label: "✨ ULTIMATE!", type: "ultimate" }); }
        doFlash = true;
      }
      if (e.type === "shield" && typeof e.shield === "number") {
        if (e.side === "A") { sA = true; if (!fA || fA === "hit") fA = "shield"; nFA.push({ id: uid(), label: `+${e.shield}🛡️`, type: "shield" }); }
        if (e.side === "B") { sB = true; if (!fB || fB === "hit") fB = "shield"; nFB.push({ id: uid(), label: `+${e.shield}🛡️`, type: "shield" }); }
      }
      if (e.type === "heal" && typeof e.heal === "number") {
        if (e.side === "A") { sA = true; if (!fA) fA = "heal"; nFA.push({ id: uid(), label: `+${e.heal}💚`, type: "heal" }); }
        if (e.side === "B") { sB = true; if (!fB) fB = "heal"; nFB.push({ id: uid(), label: `+${e.heal}💚`, type: "heal" }); }
      }
      if (e.type === "status") {
        if (e.text.includes("A is")) nFA.push({ id: uid(), label: "💫", type: "status" });
        if (e.text.includes("B is")) nFB.push({ id: uid(), label: "💫", type: "status" });
      }
    }

    // ── Launch projectile / aura immediately (t = 0) ─────────────────────
    setAbilityFX({ attackA: atA, attackB: atB, selfA: sA, selfB: sB, ultA: uA, ultB: uB, key: turn });

    // ── DBFZ afterimage trail ─────────────────────────────────────────────
    if (atA) { setAfterimageA(true); setTimeout(() => setAfterimageA(false), 290); }
    if (atB) { setAfterimageB(true); setTimeout(() => setAfterimageB(false), 290); }

    // ── SF3 Parry detection: shield gained while opponent attacks ─────────
    const parryA = sA && atB;
    const parryB = sB && atA;
    if (parryA || parryB) {
      setShowParry(true);
      setParryKey(k => k + 1);
      setTimeout(() => setShowParry(false), 750);
    }

    // ── Track max damage per side for counter hit ─────────────────────────
    let maxDmgToA = 0, maxDmgToB = 0;
    for (const e of lastResult.newState.log) {
      if (e.type === "damage" && typeof e.damage === "number") {
        if (e.side === "A") maxDmgToA = Math.max(maxDmgToA, e.damage);
        if (e.side === "B") maxDmgToB = Math.max(maxDmgToB, e.damage);
      }
    }

    // ── Delay impact effects until projectile/beam lands ─────────────────
    const IMPACT_DELAY = (atA || atB) ? (uA || uB ? 420 : 350) : 0;

    // ── Champion lunge + per-class attack animation ───────────────────────────
    if (atA) {
      setLungeA(62);
      setAttackingA(true);
      setTimeout(() => { setLungeA(0); setAttackingA(false); }, IMPACT_DELAY + 40);
    } else { setLungeA(0); }
    if (atB) {
      setLungeB(62);
      setAttackingB(true);
      setTimeout(() => { setLungeB(0); setAttackingB(false); }, IMPACT_DELAY + 40);
    } else { setLungeB(0); }
    const capturedFA = fA, capturedFB = fB;
    setTimeout(() => {
    if (nFA.length) setFloatA(p => [...p, ...nFA]);
    if (nFB.length) setFloatB(p => [...p, ...nFB]);

    if (hitA) { setAnimKeyA(k=>k+1); requestAnimationFrame(() => { setShakeA(true); setTimeout(() => setShakeA(false), 500); }); }
    if (hitB) { setAnimKeyB(k=>k+1); requestAnimationFrame(() => { setShakeB(true); setTimeout(() => setShakeB(false), 500); }); }
    if (capturedFA) { setFlashA(capturedFA); setFlashKeyA(k=>k+1); setTimeout(() => setFlashA(null), capturedFA === "ultimate" ? 700 : 450); }
    if (capturedFB) { setFlashB(capturedFB); setFlashKeyB(k=>k+1); setTimeout(() => setFlashB(null), capturedFB === "ultimate" ? 700 : 450); }
    if (doFlash) { setScreenFlash(true); setScreenFlashKey(k=>k+1); setTimeout(() => setScreenFlash(false), 600); }

    // ── SF6 Counter Hit / Punish Counter text ──────────────────────────────
    {
      // Show only for non-ultimate heavy damage
      let info: { text: string; side: "A"|"B" } | null = null;
      if (!uA && maxDmgToB >= 40)      info = { text: "PUNISH COUNTER!", side: "B" };
      else if (!uA && maxDmgToB >= 25) info = { text: "COUNTER HIT!",    side: "B" };
      else if (!uB && maxDmgToA >= 40) info = { text: "PUNISH COUNTER!", side: "A" };
      else if (!uB && maxDmgToA >= 25) info = { text: "COUNTER HIT!",    side: "A" };
      if (info) {
        setCounterHitText(info.text);
        setCounterHitSide(info.side);
        setShowCounterHit(true);
        setCounterHitKey(k => k + 1);
        setTimeout(() => setShowCounterHit(false), 950);
      }
    }

    // ── Centre cinematic text ──────────────────────────────────────────────────
    {
      let maxDmg = 0, hasUlt = false;
      for (const e of lastResult.newState.log) {
        if (e.type === "damage" && typeof e.damage === "number" && e.damage > maxDmg) maxDmg = e.damage;
        if (e.type === "ultimate") hasUlt = true;
      }
      const center = hasUlt ? "✨ SUPER ART!" : maxDmg >= 30 ? "💥 CRITICAL!" : maxDmg > 0 ? `${maxDmg} DMG` : null;
      if (center) {
        setMoveText(center);
        setMoveTextKey(k => k + 1);
        setTimeout(() => setMoveText(null), 1_600);
      }
    }
    }, IMPACT_DELAY);
  }, [lastResult]);

  // Reset lunge + attack anim when phase changes away from resolving
  useEffect(() => {
    if (phase !== "resolving") {
      setLungeA(0); setLungeB(0);
      setAttackingA(false); setAttackingB(false);
    }
  }, [phase]);

  const removeFA = useCallback((id: string) => setFloatA(p => p.filter(f => f.id !== id)), []);
  const removeFB = useCallback((id: string) => setFloatB(p => p.filter(f => f.id !== id)), []);

  // "FIGHT!" intro — hide after 1.3 s
  useEffect(() => {
    const t = setTimeout(() => setShowFightBanner(false), 1_300);
    return () => clearTimeout(t);
  }, []);

  // K.O. / YOU WIN! / DRAW on result
  useEffect(() => {
    if (phase !== "result") return;
    const text = winner === "A" ? "YOU WIN!" : winner === "B" ? "K.O." : "DRAW!";
    setFightBanner(text);
    setFightBannerKey(k => k + 1);
    setShowFightBanner(true);
    const t = setTimeout(() => setShowResultCTAs(true), 1_700);
    return () => clearTimeout(t);
  }, [phase, winner]);

  useEffect(() => {
    if (phase !== "result" || matchRecordedRef.current) return;
    if (trialMode) return; // Free trial — no local stats recorded
    matchRecordedRef.current = true;
    const outcome = winner === "A" ? "win" : winner === "B" ? "loss" : "draw";
    const res = addMatchResult(outcome, champA.name, champB.name, arena, difficulty);
    if (res) setMatchPoints(res.pointsEarned);
  }, [phase, winner]);

  // ── On-chain recording: recordBattle → fallback dailyCheckIn ────────────────
  useEffect(() => {
    if (phase !== "result" || chainRecordedRef.current || !playerAddr) return;
    if (trialMode) return; // Free trial — no on-chain recording
    chainRecordedRef.current = true;
    setChainStatus("recording");

    const record = async () => {
      // ── Try 1: recordBattle ──────────────────────────────────────────────
      try {
        const isWin          = winner === "A";
        const champWinName   = isWin ? champA.name : champB.name;
        const champLoseName  = isWin ? champB.name : champA.name;
        const winnerAddr     = isWin ? playerAddr : ACTIVE_CONTRACTS.ArenaManager;
        const loserAddr      = isWin ? ACTIVE_CONTRACTS.ArenaManager : playerAddr;
        const hash = await writeArena({
          address:      ACTIVE_CONTRACTS.ArenaManager,
          abi:          ARENA_ABI,
          functionName: "recordBattle",
          args:         [winnerAddr, loserAddr, champWinName, champLoseName],
        });
        setChainTxHash(hash);
        setChainStatus("success");
        return;
      } catch { /* likely owner-only — fall through */ }

      // ── Try 2: dailyCheckIn (se cooldown passou) ─────────────────────────
      if (canCheckIn) {
        try {
          const hash = await writeArena({
            address:      ACTIVE_CONTRACTS.ArenaManager,
            abi:          ARENA_ABI,
            functionName: "dailyCheckIn",
            args:         [],
          });
          setChainTxHash(hash);
          setChainStatus("success");
          return;
        } catch { /* cooldown still active or other error */ }
      }

      setChainStatus("idle"); // nothing submitted — silently ignore
    };

    record();
  }, [phase, winner, playerAddr]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [battleState.log.length]);

  const isVictoryA = phase === "result" && winner === "A";
  const isDefeatA  = phase === "result" && winner === "B";
  const isVictoryB = phase === "result" && winner === "B";
  const isDefeatB  = phase === "result" && winner === "A";

  const DIFF_BADGE: Record<Difficulty, string> = {
    easy:      "text-emerald-400 bg-emerald-400/10",
    medium:    "text-amber-300  bg-amber-400/10",
    hard:      "text-red-400    bg-red-500/10",
    legendary: "text-arena-primary bg-arena-primary/10",
  };
  const DIFF_LABEL: Record<Difficulty, string> = {
    easy: "Easy", medium: "Medium", hard: "Hard", legendary: "⭐ Legendary",
  };

  // HP / shield % for SF top bars
  const hpAPct = Math.max(0, Math.min(100, (playerA.displayHp  / BASE_HP)     * 100));
  const hpBPct = Math.max(0, Math.min(100, (playerB.displayHp  / BASE_HP)     * 100));
  const shAPct = Math.max(0, Math.min(100, (playerA.displayShield / BASE_SHIELD) * 100));
  const shBPct = Math.max(0, Math.min(100, (playerB.displayShield / BASE_SHIELD) * 100));
  const hpACol = hpAPct > 50 ? "#22c55e" : hpAPct > 25 ? "#f59e0b" : "#ef4444";
  const hpBCol = hpBPct > 50 ? "#22c55e" : hpBPct > 25 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col bg-black min-h-screen overflow-hidden">

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN ARENA — flex-1 so it fills all available space.
          HUD is overlaid inside so no space is wasted.
      ════════════════════════════════════════════════════════════════════ */}
      <div className="relative flex-1 min-h-[300px] overflow-hidden">
        <BattleArenaBackground theme={arena} />
        {/* gradient: darken top (for HUD readability) + bottom (for character footing) */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80" />

        {/* ── OVERLAID TOP HUD ─────────────────────────────────────────── */}
        <div className="absolute top-0 left-0 right-0 z-30 px-2 pt-2">
          {/* Row 1: back · title · difficulty */}
          <div className="flex items-center justify-between mb-1.5">
            <button
              onClick={onReset}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white text-sm active:scale-90 transition-transform"
            >←</button>
            <span className="font-display text-[9px] text-white/35 tracking-[0.2em]">BATTLE ARENA</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm ${DIFF_BADGE[difficulty]}`}>
              {DIFF_LABEL[difficulty].toUpperCase()}
            </span>
          </div>

          {/* Row 2: HP bars */}
          <div className="flex items-start gap-2">

            {/* Player A */}
            <div className="flex-1 min-w-0 bg-black/55 backdrop-blur-sm rounded-lg px-2 py-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] font-bold text-arena-primary truncate tracking-wide">{champA.name.toUpperCase()}</span>
                <span className="text-[7px] text-arena-primary/40">YOU</span>
              </div>
              {/* HP — drains left→right */}
              <div className="relative h-3 rounded-sm overflow-hidden bg-black/60">
                <div className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out rounded-sm ${hpAPct<=20?"animate-low-hp-pulse":""}`}
                  style={{ width:`${hpAPct}%`, background:`linear-gradient(90deg,${hpACol}bb,${hpACol})`, boxShadow:`0 0 8px ${hpACol}99` }}/>
                {[25,50,75].map(p=><div key={p} className="absolute inset-y-0 w-px bg-black/50" style={{left:`${p}%`}}/>)}
              </div>
              {/* Shield */}
              <div className="mt-0.5 h-1 rounded-sm overflow-hidden bg-black/40">
                <div className="h-full rounded-sm transition-all duration-500"
                  style={{width:`${shAPct}%`, background:"#22d3ee", boxShadow:shAPct>0?"0 0 4px #22d3ee":"none"}}/>
              </div>
              <div className="mt-0.5 text-[7px] text-white/25 tabular-nums">❤️ {playerA.displayHp} · 🛡️ {playerA.displayShield}</div>
            </div>

            {/* Turn counter */}
            <div className="shrink-0 text-center w-10 pt-1">
              <div className="text-[7px] text-white/20 font-mono uppercase tracking-widest">TURN</div>
              <div className={`text-xl font-display font-black leading-none tabular-nums
                ${phase==="resolving"?"text-arena-primary animate-pulse":phase==="result"?"text-purple-400":"text-white"}`}>
                {battleState.turn}
              </div>
            </div>

            {/* Player B */}
            <div className="flex-1 min-w-0 bg-black/55 backdrop-blur-sm rounded-lg px-2 py-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[7px] text-arena-muted/40">AI</span>
                <span className="text-[8px] font-bold text-arena-muted truncate text-right tracking-wide">{champB.name.toUpperCase()}</span>
              </div>
              {/* HP — drains right→left */}
              <div className="relative h-3 rounded-sm overflow-hidden bg-black/60">
                <div className={`absolute inset-y-0 right-0 transition-all duration-500 ease-out rounded-sm ${hpBPct<=20?"animate-low-hp-pulse":""}`}
                  style={{width:`${hpBPct}%`, background:`linear-gradient(270deg,${hpBCol}bb,${hpBCol})`, boxShadow:`0 0 8px ${hpBCol}99`}}/>
                {[25,50,75].map(p=><div key={p} className="absolute inset-y-0 w-px bg-black/50" style={{left:`${p}%`}}/>)}
              </div>
              {/* Shield */}
              <div className="mt-0.5 h-1 rounded-sm overflow-hidden flex justify-end bg-black/40">
                <div className="h-full rounded-sm transition-all duration-500"
                  style={{width:`${shBPct}%`, background:"#22d3ee", boxShadow:shBPct>0?"0 0 4px #22d3ee":"none"}}/>
              </div>
              <div className="mt-0.5 flex justify-end text-[7px] text-white/25 tabular-nums">{playerB.displayHp} ❤️ · {playerB.displayShield} 🛡️</div>
            </div>

          </div>
        </div>
        {/* ── END OVERLAID HUD ─────────────────────────────────────────── */}

        {/* Screen flash (ultimate) */}
        {screenFlash && (
          <div key={screenFlashKey} className="absolute inset-0 z-20 pointer-events-none animate-screen-flash"
            style={{background:"rgba(255,255,255,0.55)"}}/>
        )}

        {/* VS label — shows in middle of arena when fighting */}
        {phase !== "result" && (
          <div className="absolute inset-x-0 z-10 pointer-events-none flex justify-center" style={{top:"44%"}}>
            <span className="px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-[9px] font-display text-arena-primary/40 backdrop-blur-sm tracking-widest">VS</span>
          </div>
        )}

        {/* Float combat text — left side (player) */}
        <div className="absolute left-0 w-5/12 top-0 bottom-0 pointer-events-none z-30">
          <FloatingCombatText items={floatA} onRemove={removeFA} />
        </div>
        {/* Float combat text — right side (AI) */}
        <div className="absolute right-0 w-5/12 top-0 bottom-0 pointer-events-none z-30">
          <FloatingCombatText items={floatB} onRemove={removeFB} />
        </div>

        {/* ── SF3 PARRY text ─────────────────────────────────────────── */}
        {showParry && (
          <div key={parryKey}
            className="absolute inset-x-0 z-30 flex justify-center pointer-events-none animate-parry-text"
            style={{ top: "56%" }}>
            <span className="font-display font-black text-sm tracking-[0.2em] text-cyan-300"
              style={{ textShadow: "0 0 16px #22d3ee, 0 0 32px #22d3ee88, 0 1px 0 rgba(0,0,0,0.95)" }}>
              ✦ PARRY ✦
            </span>
          </div>
        )}

        {/* ── SF6 COUNTER HIT text ───────────────────────────────────── */}
        {showCounterHit && (
          <div key={counterHitKey}
            className="absolute pointer-events-none animate-counter-text z-30"
            style={{
              top:    "50%",
              right:  counterHitSide === "B" ? "4%" : "auto",
              left:   counterHitSide === "A" ? "4%" : "auto",
            }}>
            <span
              className="font-display font-black tracking-tight"
              style={{
                fontSize: 10,
                color: counterHitText.includes("PUNISH") ? "#ef4444" : "#f97316",
                textShadow: counterHitText.includes("PUNISH")
                  ? "0 0 10px #ef4444, 0 0 20px #ef444466, 0 1px 0 rgba(0,0,0,0.9)"
                  : "0 0 10px #f97316, 0 0 20px #f9731666, 0 1px 0 rgba(0,0,0,0.9)",
                letterSpacing: "0.08em",
                display: "block",
                whiteSpace: "nowrap",
              }}>
              {counterHitText}
            </span>
          </div>
        )}

        {/* Centre cinematic move text */}
        {moveText && (
          <div key={moveTextKey} className="absolute inset-x-0 z-20 flex justify-center pointer-events-none" style={{top:"38%"}}>
            <span className={`font-display font-black tracking-widest animate-pop-in drop-shadow-xl
              ${moveText.includes("SUPER")?"text-4xl text-arena-primary [text-shadow:0_0_30px_#F6C90E,0_0_60px_#F6C90E]":
                moveText.includes("CRITICAL")?"text-3xl text-red-400 [text-shadow:0_0_20px_#ef4444]":
                "text-2xl text-white/90"}`}>
              {moveText}
            </span>
          </div>
        )}

        {/* FIGHT! / K.O. / YOU WIN! / DRAW! banner */}
        {showFightBanner && (
          <div key={fightBannerKey} className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <span className={`font-display font-black leading-none animate-pop-in
              ${fightBanner==="FIGHT!"
                ?"text-6xl text-arena-primary [text-shadow:0_0_40px_#F6C90E,0_0_80px_#F6C90E,0_3px_0_rgba(0,0,0,0.9)]"
                :fightBanner==="K.O."
                ?"text-8xl text-red-500 [text-shadow:0_0_60px_#ef4444,0_0_120px_#ef4444,0_4px_0_rgba(0,0,0,0.9)]"
                :fightBanner==="YOU WIN!"
                ?"text-5xl text-green-400 [text-shadow:0_0_40px_#4ade80,0_0_80px_#4ade80,0_3px_0_rgba(0,0,0,0.9)]"
                :"text-5xl text-white [text-shadow:0_3px_0_rgba(0,0,0,0.9)]"}`}>
              {fightBanner}
            </span>
          </div>
        )}

        {/* ── DBFZ AFTERIMAGE — Champion A ghost trail ─────────────────── */}
        {afterimageA && [28, 54].map((offset, i) => (
          <div key={i}
            className="absolute bottom-2 left-4 pointer-events-none"
            style={{
              transform: `translateX(${offset}px)`,
              opacity: i === 0 ? 0.28 : 0.14,
              filter: `blur(${i * 1.5 + 0.5}px) drop-shadow(0 0 12px ${champFxColor})`,
              zIndex: 9 - i,
              animation: `afterimage 0.42s ease-out ${i * 65}ms forwards`,
            }}>
            <ChampionArt class_={myClass} size={150} animated={false} />
          </div>
        ))}

        {/* ── DBFZ AFTERIMAGE — Champion B ghost trail ─────────────────── */}
        {afterimageB && [28, 54].map((offset, i) => (
          <div key={i}
            className="absolute bottom-2 right-4 pointer-events-none"
            style={{
              transform: `translateX(-${offset}px) scaleX(-1)`,
              opacity: i === 0 ? 0.28 : 0.14,
              filter: `blur(${i * 1.5 + 0.5}px) drop-shadow(0 0 12px ${opponentFxColor})`,
              zIndex: 9 - i,
              animation: `afterimage 0.42s ease-out ${i * 65}ms forwards`,
            }}>
            <ChampionArt class_={opponentClass} size={150} animated={false} />
          </div>
        ))}

        {/* ── CHAMPION A — left, facing right, large ───────────────────── */}
        <div
          className={`absolute bottom-2 left-4 z-10 flex flex-col items-center ${isDefeatA?"opacity-40 grayscale":""}
            ${phase==="choose" && !attackingA ? "animate-champ-idle" : ""}`}
          style={{
            transform:  `translateX(${lungeA}px) scale(${lungeA > 0 ? 1.06 : 1})`,
            transition: lungeA > 0
              ? "transform 110ms ease-out"
              : "transform 300ms cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <div key={`cA-${animKeyA}-${flashKeyA}`}
            className={`relative ${shakeA?"animate-shake-hit":""} ${flashClass(flashA)}
              ${isVictoryA?"animate-victory-pulse":""} ${isDefeatA?"animate-defeat-shake":""}
              ${attackingA ? CHAMP_ATTACK_ANIM[myClass] : ""}
              ${phase==="resolving" && abilityFX.attackA && !attackingA ? "animate-champ-charge" : ""}`}
          >
            <ChampionArt class_={myClass} size={150} animated={true} />
            {/* DB Sparking! low-HP danger aura */}
            {hpAPct <= 20 && !isDefeatA && (
              <div className="absolute inset-0 rounded-full pointer-events-none animate-sparking-aura"
                style={{ boxShadow:`0 0 24px ${champFxColor}, 0 0 48px ${champFxColor}66`, zIndex: -1 }}/>
            )}
            {isVictoryA && <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-3xl animate-bounce z-10">👑</div>}
          </div>
        </div>

        {/* ── CHAMPION B — right, mirrored, large ──────────────────────── */}
        <div
          className={`absolute bottom-2 right-4 z-10 flex flex-col items-center ${isDefeatB?"opacity-40 grayscale":""}
            ${phase==="choose" && !attackingB ? "animate-champ-idle" : ""}`}
          style={{
            transform:  `translateX(-${lungeB}px) scale(${lungeB > 0 ? 1.06 : 1})`,
            transition: lungeB > 0
              ? "transform 110ms ease-out"
              : "transform 300ms cubic-bezier(0.34,1.56,0.64,1)",
            animationDelay: "0.5s",
          }}
        >
          <div key={`cB-${animKeyB}-${flashKeyB}`}
            className={`relative ${shakeB?"animate-shake-hit":""} ${flashClass(flashB)}
              ${isVictoryB?"animate-victory-pulse":""} ${isDefeatB?"animate-defeat-shake":""}
              ${attackingB ? CHAMP_ATTACK_ANIM[opponentClass] : ""}
              ${phase==="resolving" && abilityFX.attackB && !attackingB ? "animate-champ-charge" : ""}`}
            style={{transform:"scaleX(-1)"}}
          >
            <ChampionArt class_={opponentClass} size={150} animated={true} />
            {/* DB Sparking! low-HP danger aura */}
            {hpBPct <= 20 && !isDefeatB && (
              <div className="absolute inset-0 rounded-full pointer-events-none animate-sparking-aura"
                style={{ boxShadow:`0 0 24px ${opponentFxColor}, 0 0 48px ${opponentFxColor}66`, zIndex: -1 }}/>
            )}
            {isVictoryB && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-3xl animate-bounce z-10"
                style={{transform:"scaleX(-1)"}}>👑</div>
            )}
          </div>
        </div>

        {/* ── ABILITY FX OVERLAY ───────────────────────────────────────── */}
        <BattleAbilityFX
          animKey={abilityFX.key}
          classA={myClass}
          classB={opponentClass}
          attackA={abilityFX.attackA}
          attackB={abilityFX.attackB}
          selfA={abilityFX.selfA}
          selfB={abilityFX.selfB}
          ultA={abilityFX.ultA}
          ultB={abilityFX.ultB}
          statusA={battleState.statusA}
          statusB={battleState.statusB}
          charging={phase === "resolving"}
        />

      </div>
      {/* ═══════════════════════ END ARENA ══════════════════════════════ */}

      {/* ─── SF6 DRIVE GAUGE ───────────────────────────────────────────── */}
      <div className="shrink-0 px-3 pt-1.5 pb-1 bg-black">
        <div className="flex items-center gap-2">

          {/* Player side */}
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[7px] font-bold tracking-[0.15em] text-amber-400/60 uppercase">Drive</span>
              <span className="text-[7px] tabular-nums text-white/25">{battleState.energyA}/6</span>
            </div>
            <div className="flex gap-[2px]">
              {Array.from({length:6}).map((_,i)=>{
                const filled = i < battleState.energyA;
                const isUltReady = battleState.energyA >= 3;
                return (
                  <div key={i}
                    className={`flex-1 h-2.5 rounded-[2px] transition-all duration-300 ${filled && isUltReady && i>=2?"animate-drive-flash":""}`}
                    style={{
                      background: filled
                        ? i >= 4
                          ? "linear-gradient(90deg,#f97316,#fbbf24)"
                          : i >= 2
                            ? "linear-gradient(90deg,#fb923c,#f97316)"
                            : "linear-gradient(90deg,#c2410c,#ea580c)"
                        : "rgba(255,255,255,0.04)",
                      boxShadow: filled
                        ? isUltReady
                          ? "0 0 6px #f9731688, inset 0 1px 0 rgba(255,255,255,0.25)"
                          : "0 0 3px #f9731644, inset 0 1px 0 rgba(255,255,255,0.15)"
                        : "inset 0 0 0 1px rgba(255,255,255,0.04)",
                    }}/>
                );
              })}
            </div>
          </div>

          {/* Centre indicator */}
          <div className="shrink-0 text-center w-10">
            <div className="text-[7px] text-white/15 font-mono uppercase tracking-widest mb-0.5">TURN</div>
            <div className={`text-xl font-display font-black leading-none tabular-nums
              ${phase==="resolving"?"text-arena-primary animate-pulse":phase==="result"?"text-purple-400":"text-white/70"}`}>
              {battleState.turn}
            </div>
          </div>

          {/* AI side — dimmed */}
          <div className="flex-1 opacity-20">
            <div className="flex items-center justify-end gap-1 mb-0.5">
              <span className="text-[7px] tabular-nums text-white/40">{battleState.energyB ?? 0}/6</span>
              <span className="text-[7px] font-bold tracking-[0.15em] text-white/40 uppercase">Drive</span>
            </div>
            <div className="flex gap-[2px]">
              {Array.from({length:6}).map((_,i)=>(
                <div key={i} className="flex-1 h-2.5 rounded-[2px]"
                  style={{ background: "rgba(255,255,255,0.06)" }}/>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ─── PHASE TEXT ────────────────────────────────────────────────── */}
      {phase==="resolving" && (
        <p className="shrink-0 text-center text-xs text-arena-primary animate-pulse px-4 py-1">⚔️ Resolving turn…</p>
      )}
      {phase==="choose" && (
        <p className="shrink-0 text-center text-[11px] text-white/30 px-4 py-0.5">
          Turn {battleState.turn} · Choose up to {battleState.statusA==="halfTurn"?"1":"2"} card{battleState.statusA!=="halfTurn"?"s":""}
        </p>
      )}

      {/* ─── CARDS + CONFIRM ───────────────────────────────────────────── */}
      {(phase==="choose"||phase==="resolving") && (
        <div className="shrink-0 px-3">
          <CardHand
            cards={myCardConfig.cards}
            selected={selectedCards}
            energy={battleState.energyA}
            maxSelect={battleState.statusA==="halfTurn"?1:2}
            isStunned={battleState.statusA==="stunned"}
            isHalfTurn={battleState.statusA==="halfTurn"}
            onSelect={selectCard}
            disabled={phase==="resolving"}
          />
          <button
            onClick={confirmTurn}
            disabled={!canConfirm||phase==="resolving"}
            className="mt-2 w-full py-3.5 rounded-xl bg-arena-primary text-arena-bg font-bold text-sm active:scale-95 transition-transform shadow-lg shadow-arena-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {phase==="resolving"?"⚔️ Resolving…"
              :battleState.statusA==="stunned"?"💫 End Turn (Stunned)"
              :selectedCards.length===0?"Select a card"
              :`⚔️ Play ${selectedCards.length} Card${selectedCards.length>1?"s":""}`}
          </button>
        </div>
      )}

      {/* ─── MINI BATTLE LOG ───────────────────────────────────────────── */}
      <div className="shrink-0 mx-3 mt-1.5">
        <div ref={logRef}
          className="h-14 overflow-y-auto rounded-xl px-2 py-1.5 scrollbar-hide"
          style={{background:"rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.05)"}}>
          {battleState.log.length===0 && (
            <p className="text-[10px] text-arena-muted text-center py-1">Select cards and confirm!</p>
          )}
          {battleState.log.map((e,i)=><LogRow key={i} log={e}/>)}
          {phase==="resolving" && (
            <div className="flex items-center gap-1.5 py-0.5 text-[10px] text-arena-primary animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-arena-primary animate-ping"/>Processing…
            </div>
          )}
        </div>
      </div>

      {/* ─── RESULT CTAs — delayed so K.O. banner plays first ──────────── */}
      {phase==="result" && showResultCTAs && (
        <div className="shrink-0 px-3 pt-2 pb-5 flex flex-col gap-2 animate-pop-in">

          {/* Trial mode: join ranked CTA instead of points */}
          {trialMode && (
            <div className="px-4 py-3 rounded-xl bg-arena-primary/10 border border-arena-primary/30">
              <p className="text-arena-primary font-bold text-sm mb-0.5">
                {winner === "A" ? "🏆 Nice win!" : winner === "B" ? "💀 Keep training!" : "🤝 Close match!"}
              </p>
              <p className="text-arena-muted text-xs">
                Join Ranked to save your progress, earn points, and compete for monthly rewards.
              </p>
              <Link
                to="/ranked"
                className="mt-2.5 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-arena-primary text-arena-bg text-xs font-bold active:scale-95 transition-transform"
              >
                ⚔️ Join Ranked (deposit 1 USDT)
              </Link>
            </div>
          )}

          {/* Points earned banner (ranked mode only) */}
          {!trialMode && matchPoints !== null && (
            <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${
              winner === "A"
                ? "bg-arena-primary/10 border-arena-primary/30"
                : winner === "B"
                  ? "bg-white/5 border-white/10"
                  : "bg-cyan-500/10 border-cyan-500/20"
            }`}>
              <div>
                <span className={`font-bold text-base ${
                  winner === "A" ? "text-arena-primary" :
                  winner === "B" ? "text-arena-muted"   : "text-cyan-400"
                }`}>
                  {winner === "A" ? "🏆" : winner === "B" ? "💀" : "🤝"}{" "}
                  +{matchPoints} pts
                </span>
                <p className="text-[10px] text-arena-muted mt-0.5">
                  {DIFF_PTS[difficulty].win === matchPoints && winner === "A"
                    ? `${difficulty} win — no bonus`
                    : winner === "A" && matchPoints > DIFF_PTS[difficulty].win
                      ? `+${matchPoints - DIFF_PTS[difficulty].win} streak pts!`
                      : "Points added"}
                </p>
              </div>
              <Link
                to="/leaderboard"
                className="text-[10px] text-arena-primary font-semibold underline underline-offset-2 shrink-0"
              >
                View ranking →
              </Link>
            </div>
          )}

          {/* On-chain recording status (ranked mode only) */}
          {!trialMode && chainStatus === "recording" && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-arena-info/10 border border-arena-info/20">
              <div className="w-3.5 h-3.5 border-2 border-arena-info border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-arena-info text-xs font-medium">Recording on Celo…</span>
            </div>
          )}
          {!trialMode && chainStatus === "success" && chainTxHash && (
            <a
              href={`https://celoscan.io/tx/${chainTxHash}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-arena-success/10 border border-arena-success/20 active:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2">
                <span className="text-arena-success text-base">⛓️</span>
                <div>
                  <p className="text-arena-success text-xs font-semibold">Recorded on Celo</p>
                  <p className="text-arena-muted text-[9px]">{chainTxHash.slice(0,10)}…{chainTxHash.slice(-6)}</p>
                </div>
              </div>
              <span className="text-arena-muted text-[10px]">View →</span>
            </a>
          )}

          {/* X share */}
          {winner === "A" && (
            <button
              onClick={() => {
                const profile = playerProfile;
                const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
                const text = trialMode
                  ? `🏆 I beat the AI at level ${diffLabel} with ${champA.name} on @BahiaArena! Try for free → bahia-arena.vercel.app #BahiaArena #Celo`
                  : profile
                    ? `🏆 I won at level ${diffLabel} with ${champA.name} on @BahiaArena! +${matchPoints ?? DIFF_PTS[difficulty].win} pts${profile.streak > 1 ? ` 🔥 ${profile.streak}x streak` : ""} #BahiaArena #Celo`
                    : `🏆 I beat the AI at level ${diffLabel} with ${champA.name} on @BahiaArena! #BahiaArena #Web3Gaming #Celo`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
              }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ background: "#000", border: "1px solid #333" }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share victory
            </button>
          )}

          {!trialMode && !isConnected && (
            <p className="text-center text-[10px] text-arena-muted px-2">
              Connect your wallet to save points to the permanent ranking
            </p>
          )}

          <button onClick={onReset}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform"
            style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)"}}>
            🔄 Play Again
          </button>

          {!trialMode && (
            <Link to="/leaderboard"
              className="block w-full py-3 rounded-xl font-bold text-sm text-center active:scale-95 transition-transform border border-arena-primary/40 text-arena-primary">
              🏆 View Ranking
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEPOSIT TIERS — config shared between PlayGate and Home
// ─────────────────────────────────────────────────────────────────────────────

export const DEPOSIT_TIERS = [
  {
    tier:       1,
    amount:     BigInt(250_000),   // 0.25 USDT (6 dec)
    label:      "0.25 USDT",
    multiplier: "1×",
    badge:      "",
    tagLine:    "Starter",
    color:      "border-white/20",
    highlight:  false,
    benefits:   ["Ranked mode unlocked", "1× points per win", "Yield on Aave V3"],
  },
  {
    tier:       2,
    amount:     BigInt(500_000),
    label:      "0.50 USDT",
    multiplier: "1.5×",
    badge:      "",
    tagLine:    "Challenger",
    color:      "border-blue-400/40",
    highlight:  false,
    benefits:   ["1.5× points per win", "Faster ranking climb", "Yield on Aave V3"],
  },
  {
    tier:       3,
    amount:     BigInt(750_000),
    label:      "0.75 USDT",
    multiplier: "2×",
    badge:      "🏅 Pioneer",
    tagLine:    "Pioneer",
    color:      "border-purple-400/50",
    highlight:  false,
    benefits:   ["2× points per win", "🏅 Pioneer badge", "Yield on Aave V3"],
  },
  {
    tier:       4,
    amount:     BigInt(1_000_000),
    label:      "1.00 USDT",
    multiplier: "2.5×",
    badge:      "⭐ Elite",
    tagLine:    "Elite",
    color:      "border-arena-primary/60",
    highlight:  true,
    benefits:   ["2.5× points per win", "⭐ Monthly reward eligibility", "Yield on Aave V3"],
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// PLAY GATE — wallet + tiered deposit check
// ─────────────────────────────────────────────────────────────────────────────

function PlayGate({ children }: { children: React.ReactNode }) {
  const { address, status } = useAccount();
  const { connect, isPending: connecting } = useConnect();
  const { writeContractAsync, isPending: depositing } = useWriteContract();
  const [approving,   setApproving]   = useState(false);
  const [depositErr,  setDepositErr]  = useState("");
  const [selectedTier, setSelectedTier] = useState(4); // default: Elite

  // Current deposit + tier
  const { data: currentDeposit, isLoading: checkingDeposit, refetch } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi: ARENA_ABI,
    functionName: "deposits",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const { data: currentTierRaw } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi: ARENA_ABI,
    functionName: "depositTier",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const currentTier    = Number(currentTierRaw ?? 0);
  const hasDeposit     = !!currentDeposit && (currentDeposit as bigint) > 0n;
  const tierConfig     = DEPOSIT_TIERS[selectedTier - 1];
  const topUp          = tierConfig.amount - ((currentDeposit as bigint) ?? 0n);
  const isUpgrade      = hasDeposit && selectedTier > currentTier;
  const alreadyAtTier  = hasDeposit && selectedTier === currentTier;
  const downgrade      = selectedTier < currentTier;

  // USDT allowance for ArenaManager
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: ACTIVE_CONTRACTS.usdt,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, ACTIVE_CONTRACTS.ArenaManager] : undefined,
    query: { enabled: !!address },
  });

  const needsApproval = (allowance ?? 0n) < topUp;

  const handleDeposit = async () => {
    if (alreadyAtTier || downgrade || topUp <= 0n) return;
    setDepositErr("");
    try {
      if (needsApproval) {
        setApproving(true);
        await writeContractAsync({
          address: ACTIVE_CONTRACTS.usdt,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [ACTIVE_CONTRACTS.ArenaManager, topUp],
        });
        await refetchAllowance();
        setApproving(false);
      }
      await writeContractAsync({
        address: ACTIVE_CONTRACTS.ArenaManager,
        abi: ARENA_ABI,
        functionName: "deposit",
        args: [tierConfig.amount],
      });
      await refetch();
    } catch (e: any) {
      setApproving(false);
      setDepositErr(e.shortMessage ?? e.message ?? "Transaction failed");
    }
  };

  // ── Still loading wallet status ──────────────────────────────────────────
  if (status === "connecting" || status === "reconnecting") {
    return (
      <div className="min-h-screen bg-arena-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-arena-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Not connected ────────────────────────────────────────────────────────
  if (status !== "connected" || !address) {
    return (
      <div className="min-h-screen bg-arena-bg flex flex-col items-center justify-center px-5 text-center gap-5 pb-8">
        <BahiaArenaLogo size={72} showWordmark={true} />
        <div>
          <h1 className="text-white text-xl font-bold mb-1">⚔️ Ranked Mode</h1>
          <p className="text-arena-muted text-sm">Connect your wallet to choose your tier and enter the arena</p>
        </div>
        <button
          onClick={() => connect({ connector: injected() })}
          disabled={connecting}
          className="w-full max-w-xs py-4 rounded-2xl bg-arena-primary text-arena-bg font-bold text-base disabled:opacity-60 active:scale-95 transition-transform"
          style={{ boxShadow: "0 4px 20px rgba(246,201,14,0.35)" }}
        >
          {connecting ? "Connecting…" : "🔗 Connect Wallet"}
        </button>
        <div className="w-full max-w-xs grid grid-cols-2 gap-2 text-left">
          {DEPOSIT_TIERS.map(t => (
            <div key={t.tier} className={`p-3 rounded-xl bg-arena-surface border ${t.color}`}>
              <p className="text-arena-primary font-bold text-sm">{t.label}</p>
              <p className="text-white font-semibold text-xs mt-0.5">{t.multiplier} pts {t.badge}</p>
              <p className="text-arena-muted text-[10px] mt-1">{t.tagLine}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Checking deposit ─────────────────────────────────────────────────────
  if (checkingDeposit) {
    return (
      <div className="min-h-screen bg-arena-bg flex items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-arena-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-arena-muted text-sm">Checking deposit…</span>
      </div>
    );
  }

  // ── No deposit yet / tier selection screen ───────────────────────────────
  if (!hasDeposit || isUpgrade) {
    const busy = approving || depositing;
    const TIER_COLORS: Record<number, string> = {
      1: "border-white/20   bg-white/5",
      2: "border-blue-400/40 bg-blue-400/5",
      3: "border-purple-400/50 bg-purple-400/5",
      4: "border-arena-primary/60 bg-arena-primary/10",
    };
    const TIER_RING: Record<number, string> = {
      1: "ring-white/30",
      2: "ring-blue-400/50",
      3: "ring-purple-400/50",
      4: "ring-arena-primary/60",
    };

    return (
      <div className="min-h-screen bg-arena-bg flex flex-col px-4 pt-6 pb-8 gap-4">
        <div className="flex items-center gap-3">
          <BahiaArenaLogo size={36} showWordmark={false} />
          <div>
            <h1 className="text-white font-bold text-base leading-tight">
              {isUpgrade ? "Upgrade Your Tier" : "Choose Your Tier"}
            </h1>
            <p className="text-arena-muted text-xs">
              {isUpgrade
                ? `Currently Tier ${currentTier} · Pay only the difference`
                : "Deposit earns Aave V3 yield while you play"}
            </p>
          </div>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-2 gap-2">
          {DEPOSIT_TIERS.map(t => {
            const isSelected = selectedTier === t.tier;
            const isCurrent  = currentTier === t.tier && hasDeposit;
            const isLocked   = t.tier < currentTier; // can't downgrade

            return (
              <button
                key={t.tier}
                onClick={() => !isLocked && setSelectedTier(t.tier)}
                disabled={isLocked}
                className={`relative text-left p-3 rounded-2xl border-2 transition-all active:scale-[0.97]
                  ${isSelected ? `${TIER_COLORS[t.tier]} ring-2 ${TIER_RING[t.tier]}` : "border-arena-border bg-arena-surface"}
                  ${isLocked ? "opacity-30 cursor-not-allowed" : ""}
                `}
              >
                {/* Current badge */}
                {isCurrent && (
                  <span className="absolute top-1.5 right-1.5 text-[8px] font-bold bg-arena-success/20 text-arena-success border border-arena-success/30 px-1.5 py-0.5 rounded-full">
                    ACTIVE
                  </span>
                )}

                <p className={`font-bold text-sm ${isSelected ? "text-white" : "text-arena-muted"}`}>
                  {t.label}
                </p>

                {/* Big multiplier */}
                <p className={`font-display font-black text-2xl leading-tight mt-0.5
                  ${t.tier === 4 ? "text-arena-primary"
                    : t.tier === 3 ? "text-purple-400"
                    : t.tier === 2 ? "text-blue-400"
                    : "text-white/60"}`}>
                  {t.multiplier}
                </p>
                <p className={`text-[9px] font-semibold uppercase tracking-wider mt-0.5
                  ${isSelected ? "text-white/60" : "text-arena-muted/50"}`}>
                  points/win
                </p>

                {/* Badge */}
                {t.badge && (
                  <p className="text-[10px] font-bold mt-1.5">{t.badge}</p>
                )}

                {/* Tag */}
                <p className={`text-[10px] mt-1 ${isSelected ? "text-white/50" : "text-arena-muted/40"}`}>
                  {t.tagLine}
                </p>

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-arena-primary flex items-center justify-center">
                    <span className="text-[9px] font-black text-arena-bg">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Tier detail benefits */}
        <div className={`p-3.5 rounded-2xl border ${TIER_COLORS[selectedTier]} transition-all`}>
          <p className="text-white font-semibold text-sm mb-2">
            {tierConfig.tagLine} tier benefits
          </p>
          <div className="space-y-1">
            {tierConfig.benefits.map(b => (
              <p key={b} className="text-xs text-arena-muted flex items-center gap-1.5">
                <span className="text-arena-success text-[10px]">✓</span> {b}
              </p>
            ))}
          </div>
          {isUpgrade && topUp > 0n && (
            <div className="mt-2.5 pt-2.5 border-t border-white/10">
              <p className="text-xs text-arena-muted">
                Top-up cost: <span className="text-white font-bold">{Number(topUp) / 1e6} USDT</span>
                {" "}(you already deposited {Number(currentDeposit as bigint) / 1e6} USDT)
              </p>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 text-xs">
          <div className={`flex-1 flex items-center gap-1.5 p-2 rounded-xl border
            ${!needsApproval ? "border-arena-success/40 bg-arena-success/5 text-arena-success"
              : "border-arena-border bg-arena-surface text-arena-muted"}`}>
            <span>{!needsApproval ? "✅" : "1️⃣"}</span>
            <span>Approve USDT</span>
          </div>
          <span className="text-arena-border shrink-0">→</span>
          <div className="flex-1 flex items-center gap-1.5 p-2 rounded-xl border border-arena-border bg-arena-surface text-arena-muted">
            <span>2️⃣</span>
            <span>{isUpgrade ? "Upgrade" : "Deposit"}</span>
          </div>
        </div>

        <button
          onClick={handleDeposit}
          disabled={busy || alreadyAtTier || downgrade || topUp <= 0n}
          className="w-full py-4 rounded-2xl bg-arena-primary text-arena-bg font-bold text-base disabled:opacity-50 active:scale-95 transition-transform"
          style={{ boxShadow: "0 4px 20px rgba(246,201,14,0.35)" }}
        >
          {approving  ? "⏳ Approving USDT…"
           : depositing ? "⏳ Depositing…"
           : alreadyAtTier ? `✓ Already at Tier ${currentTier}`
           : needsApproval ? `💰 Approve + Deposit ${Number(topUp) / 1e6} USDT`
           : `💰 Deposit ${Number(topUp) / 1e6} USDT`}
        </button>

        {depositErr && (
          <p className="text-arena-danger text-xs text-center px-2">{depositErr}</p>
        )}
      </div>
    );
  }

  // ── All good — render the battle UI ─────────────────────────────────────
  return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE ROOT
// ─────────────────────────────────────────────────────────────────────────────

type Stage = "pick" | "setup" | "battle";

function ArenaPage({ trialMode = false }: { trialMode?: boolean }) {
  const [stage,         setStage]         = useState<Stage>("pick");
  const [myClass,       setMyClass]       = useState<ChampionClass | null>(null);
  const [opponentClass, setOpponentClass] = useState<ChampionClass | null>(null);
  const [config,        setConfig]        = useState<{ difficulty: Difficulty; arena: ArenaTheme } | null>(null);

  const handlePick = (c: ChampionClass) => {
    const others = ([0, 1, 2, 3, 4] as ChampionClass[]).filter(v => v !== c);
    setMyClass(c);
    setOpponentClass(others[Math.floor(Math.random() * others.length)]);
    setStage("setup");
  };

  const handleStart = (cfg: { difficulty: Difficulty; arena: ArenaTheme }) => {
    setConfig(cfg);
    setStage("battle");
  };

  const handleReset = () => {
    setMyClass(null);
    setOpponentClass(null);
    setConfig(null);
    setStage("pick");
  };

  const inner =
    stage === "pick" ? (
      <ChampionPicker onPick={handlePick} />
    ) : stage === "setup" && myClass !== null ? (
      <SetupScreen myClass={myClass} onStart={handleStart} onBack={() => setStage("pick")} />
    ) : stage === "battle" && myClass !== null && opponentClass !== null && config !== null ? (
      <BattleScreen
        myClass={myClass}
        opponentClass={opponentClass}
        difficulty={config.difficulty}
        arena={config.arena}
        onReset={handleReset}
        trialMode={trialMode}
      />
    ) : null;

  if (trialMode) {
    // Free trial — no gate, anyone can play
    return <>{inner}</>;
  }

  return <PlayGate>{inner}</PlayGate>;
}

// /play  — free trial, no wallet required
export default function DemoPage() {
  return <ArenaPage trialMode={true} />;
}

// /ranked — full ranked mode, wallet + deposit required
export function RankedPage() {
  return <ArenaPage trialMode={false} />;
}
