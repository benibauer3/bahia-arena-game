/**
 * useBattleCards.ts — Client-side card battle state manager.
 *
 * Responsibilities:
 *  • Tracks HP, Shield, Energy, Status for both players.
 *  • Manages card selection (max 2 per turn; 1 if halfTurn).
 *  • Drives the Choose → Resolving → Result phase cycle.
 *  • Animates HP / Shield changes via CSS-driven display values.
 *  • Uses processTurn() from championCards.ts for all game logic.
 *
 * NOTE: On-chain contract interaction is handled separately in useBattle.ts.
 * This hook is purely for the visual/local state of an in-progress battle.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  BattleState,
  TurnInput,
  TurnResult,
  processTurn,
  createInitialBattleState,
  CHAMPION_CARDS,
  BASE_HP,
  BASE_SHIELD,
} from "@/lib/championCards";
import { ChampionClass } from "@/lib/champions";

export type Difficulty = "easy" | "medium" | "hard";

// ─── Phase Types ──────────────────────────────────────────────────────────────

export type BattlePhase =
  | "choose"      // player is picking cards
  | "waiting"     // waiting for opponent's selection
  | "resolving"   // animations playing
  | "result"      // winner known, battle over
  | "idle";       // not started yet

// ─── Animated Display State ───────────────────────────────────────────────────

export interface PlayerDisplayState {
  hp:            number; // stable resolved value
  shield:        number;
  energy:        number;
  displayHp:     number; // animates toward hp
  displayShield: number; // animates toward shield
  isAnimating:   boolean;
}

// ─── Public Hook Shape ────────────────────────────────────────────────────────

export interface UseBattleCardsReturn {
  phase:        BattlePhase;
  battleState:  BattleState;
  playerA:      PlayerDisplayState;
  playerB:      PlayerDisplayState;
  selectedCards: number[];
  canConfirm:   boolean;
  selectCard:   (cardId: number) => void;
  confirmTurn:  () => void;
  resetBattle:  (classA: ChampionClass, classB: ChampionClass) => void;
  lastResult:   TurnResult | null;
  winner:       "A" | "B" | "draw" | null;
}

// ─── Lerp helper ─────────────────────────────────────────────────────────────

function lerp(from: number, to: number, t: number) {
  return Math.round(from + (to - from) * t);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBattleCards(
  classA: ChampionClass,
  classB: ChampionClass,
  autoOpponent: boolean = true,
  difficulty: Difficulty = "medium",
): UseBattleCardsReturn {
  const configA = CHAMPION_CARDS[classA];
  const configB = CHAMPION_CARDS[classB];

  // ── Core state ──────────────────────────────────────────────────────────────
  const [battleState, setBattleState] = useState<BattleState>(() =>
    createInitialBattleState(),
  );
  const [phase, setPhase]             = useState<BattlePhase>("idle");
  const [selectedCards, setSelected]  = useState<number[]>([]);
  const [lastResult, setLastResult]   = useState<TurnResult | null>(null);
  const [winner, setWinner]           = useState<"A" | "B" | "draw" | null>(null);

  // ── Display/animation values ─────────────────────────────────────────────────
  const [dispA, setDispA] = useState({ hp: BASE_HP, shield: BASE_SHIELD, energy: 0, displayHp: BASE_HP, displayShield: BASE_SHIELD });
  const [dispB, setDispB] = useState({ hp: BASE_HP, shield: BASE_SHIELD, energy: 0, displayHp: BASE_HP, displayShield: BASE_SHIELD });
  const [isAnimating, setIsAnimating] = useState(false);
  const rafRef = useRef<number | null>(null);

  // ── Reset ────────────────────────────────────────────────────────────────────
  const resetBattle = useCallback((_cA: ChampionClass, _cB: ChampionClass) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    const init = createInitialBattleState();
    setBattleState(init);
    setPhase("choose");
    setSelected([]);
    setLastResult(null);
    setWinner(null);
    setIsAnimating(false);
    setDispA({ hp: BASE_HP, shield: BASE_SHIELD, energy: 0, displayHp: BASE_HP, displayShield: BASE_SHIELD });
    setDispB({ hp: BASE_HP, shield: BASE_SHIELD, energy: 0, displayHp: BASE_HP, displayShield: BASE_SHIELD });
  }, []);

  useEffect(() => {
    resetBattle(classA, classB);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // ── Card selection ───────────────────────────────────────────────────────────
  const selectCard = useCallback(
    (cardId: number) => {
      if (phase !== "choose") return;
      const isStunned  = battleState.statusA === "stunned";
      const isHalfTurn = battleState.statusA === "halfTurn";
      if (isStunned) return;
      const maxCards = isHalfTurn ? 1 : 2;

      setSelected((prev) => {
        if (prev.includes(cardId)) return prev.filter((id) => id !== cardId);
        if (prev.length >= maxCards) return prev;
        const card = configA.cards[cardId];
        if (card.energyCost > 0 && battleState.energyA < card.energyCost) return prev;
        return [...prev, cardId];
      });
    },
    [phase, battleState, configA],
  );

  // ── AI card picker (difficulty-aware) ────────────────────────────────────────
  function pickOpponentCards(state: BattleState): number[] {
    if (state.statusB === "stunned") return [];

    const statusMax = state.statusB === "halfTurn" ? 1 : 2;
    // Easy: AI limited to 1 card; Hard: always uses max allowed
    const maxCards = difficulty === "easy" ? 1 : statusMax;

    const available = configB.cards.filter(
      (c) => c.energyCost === 0 || state.energyB >= c.energyCost,
    );
    const ultimates = available.filter((c) => c.energyCost > 0);
    const basics    = available.filter((c) => c.energyCost === 0);

    // Easy: never uses ultimates, random basic selection
    if (difficulty === "easy") {
      const shuffled = [...basics].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 1).map(c => c.id);
    }

    const picks: number[] = [];
    const energyThreshold = difficulty === "hard" ? 2 : 3; // Hard uses ult earlier

    if (ultimates.length > 0 && state.energyB >= energyThreshold) {
      picks.push(ultimates[0].id);
    } else if (difficulty === "hard") {
      // Hard AI — tactical prioritisation
      const sumFn = (c: typeof basics[0]) =>
        c.effects.reduce((s, e) => s + Math.max(0, e.value), 0);
      const dmgFn = (c: typeof basics[0]) =>
        c.effects.filter(e => e.type === "damage" || e.type === "shieldPierce")
          .reduce((s, e) => s + e.value, 0);
      const healFn = (c: typeof basics[0]) =>
        c.effects.filter(e => e.type === "heal").reduce((s, e) => s + e.value, 0);
      const shieldFn = (c: typeof basics[0]) =>
        c.effects.filter(e => e.type === "shield").reduce((s, e) => s + e.value, 0);

      // Priority: heal if critically low, shield if unprotected, else max damage
      const healer  = [...basics].filter(c => healFn(c) > 0).sort((a,b) => healFn(b)-healFn(a))[0];
      const shielder = [...basics].filter(c => shieldFn(c) > 0).sort((a,b) => shieldFn(b)-shieldFn(a))[0];
      const attacker = [...basics].sort((a,b) => dmgFn(b)-dmgFn(a));

      if (healer && state.hpB < 35) {
        picks.push(healer.id);
      } else if (shielder && state.shieldB < 15) {
        picks.push(shielder.id);
      } else {
        for (const c of attacker) {
          if (picks.length >= maxCards) break;
          if (!picks.includes(c.id)) picks.push(c.id);
        }
      }
      // Fill remaining slots with best remaining cards
      const sorted = [...basics].sort((a,b) => sumFn(b)-sumFn(a));
      for (const c of sorted) {
        if (picks.length >= maxCards) break;
        if (!picks.includes(c.id)) picks.push(c.id);
      }
    } else {
      // Medium (current): sort by total effect value
      const sorted = [...basics].sort((a, b) => {
        const sumFn = (c: typeof a) =>
          c.effects.reduce((s, e) => s + Math.max(0, e.value), 0);
        return sumFn(b) - sumFn(a);
      });
      for (const c of sorted) {
        if (picks.length >= maxCards) break;
        picks.push(c.id);
      }
    }
    return picks;
  }

  // ── Animate bars ─────────────────────────────────────────────────────────────
  function animateBars(
    fromA: { hp: number; shield: number },
    fromB: { hp: number; shield: number },
    toA:   { hp: number; shield: number },
    toB:   { hp: number; shield: number },
    onDone: () => void,
  ) {
    const DURATION = 600;
    const start    = performance.now();

    const tick = (now: number) => {
      const raw  = Math.min((now - start) / DURATION, 1);
      const ease = 1 - Math.pow(1 - raw, 3);

      setDispA((p) => ({ ...p, displayHp: lerp(fromA.hp, toA.hp, ease), displayShield: lerp(fromA.shield, toA.shield, ease) }));
      setDispB((p) => ({ ...p, displayHp: lerp(fromB.hp, toB.hp, ease), displayShield: lerp(fromB.shield, toB.shield, ease) }));

      if (raw < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDispA((p) => ({ ...p, displayHp: toA.hp, displayShield: toA.shield }));
        setDispB((p) => ({ ...p, displayHp: toB.hp, displayShield: toB.shield }));
        onDone();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  // ── Confirm turn ─────────────────────────────────────────────────────────────
  const confirmTurn = useCallback(() => {
    if (phase !== "choose") return;

    setPhase("resolving");
    setIsAnimating(true);

    const opponentCards = autoOpponent ? pickOpponentCards(battleState) : [];

    const input: TurnInput = {
      cardsA: selectedCards,
      cardsB: opponentCards,
      classA,
      classB,
    };

    const result = processTurn(battleState, input);
    setLastResult(result);

    const fromA = { hp: battleState.hpA, shield: battleState.shieldA };
    const fromB = { hp: battleState.hpB, shield: battleState.shieldB };
    const toA   = { hp: result.newState.hpA, shield: result.newState.shieldA };
    const toB   = { hp: result.newState.hpB, shield: result.newState.shieldB };

    setTimeout(() => {
      animateBars(fromA, fromB, toA, toB, () => {
        setIsAnimating(false);
        setBattleState(result.newState);

        setDispA((p) => ({ ...p, hp: result.newState.hpA, shield: result.newState.shieldA, energy: result.newState.energyA }));
        setDispB((p) => ({ ...p, hp: result.newState.hpB, shield: result.newState.shieldB, energy: result.newState.energyB }));

        if (result.battleOver) {
          setWinner(result.winner ?? "draw");
          setPhase("result");
        } else {
          setSelected([]);
          setPhase("choose");
        }
      });
    }, 300);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, battleState, selectedCards, classA, classB, autoOpponent]);

  // ── canConfirm ───────────────────────────────────────────────────────────────
  const isStunned = battleState.statusA === "stunned";
  const canConfirm = phase === "choose" && (isStunned || selectedCards.length > 0);

  return {
    phase,
    battleState,
    playerA: { ...dispA, isAnimating },
    playerB: { ...dispB, isAnimating },
    selectedCards,
    canConfirm,
    selectCard,
    confirmTurn,
    resetBattle,
    lastResult,
    winner,
  };
}
