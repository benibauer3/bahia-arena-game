/**
 * championCards.ts — PvP Card System Configuration
 *
 * All champions share identical base stats for total equity.
 * Each champion has 4 cards: 3 Basic (free, +1 energy) + 1 Ultimate (costs 3 energy).
 *
 * Turn rules:
 *  • Player selects UP TO 2 cards per turn.
 *  • Basic cards generate +1 energy each (max 3).
 *  • Ultimate costs 3 energy and generates 0.
 *  • Shields absorb damage before HP (except shieldPierce attacks).
 *  • Resolution is simultaneous: both players' cards apply at once.
 */

import { ChampionClass } from "./champions";

// ─── Base Stats (identical for all champions — full equity) ───────────────────

export const BASE_HP     = 100;
export const BASE_SHIELD = 50;
export const MAX_ENERGY  = 3;
export const BURN_DAMAGE = 8; // per turn while burning

// ─── Effect Types ─────────────────────────────────────────────────────────────

export type EffectTarget = "self" | "enemy";
export type StatusType   = "none" | "stunned" | "halfTurn" | "burned" | "marked" | "blocked";

export interface CardEffect {
  /** What this effect does */
  type:
    | "damage"       // reduces enemy shield then HP
    | "shieldPierce" // bypasses shield, hits HP directly (Boitatá ult)
    | "shield"       // adds to self shield (capped at BASE_SHIELD)
    | "heal"         // restores HP (capped at BASE_HP)
    | "status"       // applies status to target
    | "stealShield"; // transfers enemy shield to self (Anhangá)

  value:   number;
  target:  EffectTarget;
  /** For status effects */
  status?: StatusType;
  /** Duration in turns (for burn, halfTurn, etc.) */
  duration?: number;
}

// ─── Card Definition ──────────────────────────────────────────────────────────

export interface Card {
  /** 0-2 = basic, 3 = ultimate */
  id:          number;
  name:        string;
  emoji:       string;
  /** One-liner shown on card */
  description: string;
  /** Extended tooltip */
  tooltip:     string;
  energyCost:  number;  // 0 for basics, 3 for ultimate
  energyGain:  number;  // +1 for basics, 0 for ultimate
  effects:     CardEffect[];
  /** Tailwind gradient classes */
  gradientFrom: string;
  gradientTo:   string;
  borderColor:  string;
  /** Card type label */
  type: "Attack" | "Defense" | "Heal" | "Ultimate";
}

// ─── Champion Card Config ─────────────────────────────────────────────────────

export interface ChampionCardConfig {
  class:       ChampionClass;
  baseHp:      number;
  baseShield:  number;
  cards:       [Card, Card, Card, Card];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHAMPION CARD DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const CHAMPION_CARDS: Record<ChampionClass, ChampionCardConfig> = {

  // ─── 0. CURUPIRA — Tank ────────────────────────────────────────────────────
  [ChampionClass.CURUPIRA]: {
    class:      ChampionClass.CURUPIRA,
    baseHp:     BASE_HP,
    baseShield: BASE_SHIELD,
    cards: [
      {
        id: 0, name: "Forest Stomp", emoji: "🦶",
        type: "Attack",
        description: "12 dmg + 8 shield",
        tooltip: "Stomps the ground, damaging the enemy and regaining footing.",
        energyCost: 0, energyGain: 1,
        gradientFrom: "from-green-900/80", gradientTo: "to-green-700/40",
        borderColor: "border-green-500/60",
        effects: [
          { type: "damage", value: 12, target: "enemy" },
          { type: "shield", value: 8,  target: "self"  },
        ],
      },
      {
        id: 1, name: "Root Cage", emoji: "🌿",
        type: "Defense",
        description: "8 dmg + halfTurn status",
        tooltip: "Entangles enemy roots — opponent may only use 1 card next turn.",
        energyCost: 0, energyGain: 1,
        gradientFrom: "from-green-800/80", gradientTo: "to-emerald-700/40",
        borderColor: "border-emerald-500/60",
        effects: [
          { type: "damage", value: 8,         target: "enemy"                              },
          { type: "status", value: 0,          target: "enemy", status: "halfTurn", duration: 1 },
        ],
      },
      {
        id: 2, name: "Forest Shield", emoji: "🛡️",
        type: "Defense",
        description: "+30 shield",
        tooltip: "Channels the forest's essence, creating a thick bark shield.",
        energyCost: 0, energyGain: 1,
        gradientFrom: "from-green-900/80", gradientTo: "to-teal-700/40",
        borderColor: "border-teal-500/60",
        effects: [
          { type: "shield", value: 30, target: "self" },
        ],
      },
      {
        id: 3, name: "Vine Labyrinth", emoji: "🌾",
        type: "Ultimate",
        description: "Enemy skips next turn",
        tooltip: "Wraps the enemy in an inescapable maze of vines. They are fully stunned for 1 turn.",
        energyCost: 3, energyGain: 0,
        gradientFrom: "from-green-600/90", gradientTo: "to-lime-500/60",
        borderColor: "border-lime-400/80",
        effects: [
          { type: "status", value: 0, target: "enemy", status: "stunned", duration: 1 },
          { type: "shield", value: 15, target: "self" },
        ],
      },
    ],
  },

  // ─── 1. IARA — Support ────────────────────────────────────────────────────
  [ChampionClass.IARA]: {
    class:      ChampionClass.IARA,
    baseHp:     BASE_HP,
    baseShield: BASE_SHIELD,
    cards: [
      {
        id: 0, name: "Siren Call", emoji: "🎵",
        type: "Attack",
        description: "20 dmg",
        tooltip: "An enchanting melody that disorients and wounds the enemy.",
        energyCost: 0, energyGain: 1,
        gradientFrom: "from-blue-900/80", gradientTo: "to-cyan-700/40",
        borderColor: "border-cyan-500/60",
        effects: [
          { type: "damage", value: 20, target: "enemy" },
        ],
      },
      {
        id: 1, name: "River Mist", emoji: "🌊",
        type: "Defense",
        description: "12 dmg + 12 shield",
        tooltip: "Summons a mystic mist that harms and deflects attacks.",
        energyCost: 0, energyGain: 1,
        gradientFrom: "from-cyan-900/80", gradientTo: "to-blue-700/40",
        borderColor: "border-blue-500/60",
        effects: [
          { type: "damage", value: 12, target: "enemy" },
          { type: "shield", value: 12, target: "self"  },
        ],
      },
      {
        id: 2, name: "Healing Waters", emoji: "💧",
        type: "Heal",
        description: "+22 HP restored",
        tooltip: "Sacred river water washes wounds, restoring vitality.",
        energyCost: 0, energyGain: 1,
        gradientFrom: "from-blue-900/80", gradientTo: "to-indigo-700/40",
        borderColor: "border-indigo-500/60",
        effects: [
          { type: "heal",   value: 22, target: "self" },
        ],
      },
      {
        id: 3, name: "Abyssal Song", emoji: "🧜‍♀️",
        type: "Ultimate",
        description: "Heal 50% of lost HP",
        tooltip: "Iara's most powerful song echoes from the abyss, recovering half of all damage taken this battle.",
        energyCost: 3, energyGain: 0,
        gradientFrom: "from-cyan-600/90", gradientTo: "to-blue-500/60",
        borderColor: "border-cyan-400/80",
        effects: [
          { type: "heal",   value: -1, target: "self"  }, // -1 = special: heal 50% lost HP
          { type: "damage", value: 10, target: "enemy" },
        ],
      },
    ],
  },

  // ─── 2. BOITATÁ — DPS / DoT ───────────────────────────────────────────────
  [ChampionClass.BOITATA]: {
    class:      ChampionClass.BOITATA,
    baseHp:     BASE_HP,
    baseShield: BASE_SHIELD,
    cards: [
      {
        id: 0, name: "Fire Breath", emoji: "🔥",
        type: "Attack",
        description: "24 dmg",
        tooltip: "A blast of ancestral fire that scorches the enemy.",
        energyCost: 0, energyGain: 1,
        gradientFrom: "from-orange-900/80", gradientTo: "to-red-700/40",
        borderColor: "border-orange-500/60",
        effects: [
          { type: "damage", value: 24, target: "enemy" },
        ],
      },
      {
        id: 1, name: "Ember Trail", emoji: "🐍",
        type: "Attack",
        description: "14 dmg + BURN 8/turn × 2",
        tooltip: "Leaves a trail of embers — enemy burns for 8 damage per turn for 2 turns.",
        energyCost: 0, energyGain: 1,
        gradientFrom: "from-red-900/80", gradientTo: "to-orange-700/40",
        borderColor: "border-red-500/60",
        effects: [
          { type: "damage", value: 14, target: "enemy"                                   },
          { type: "status", value: 0,  target: "enemy", status: "burned", duration: 2   },
        ],
      },
      {
        id: 2, name: "Blaze Aura", emoji: "✨",
        type: "Defense",
        description: "12 dmg + 14 self shield",
        tooltip: "Wraps in protective flames that burn attackers and boost defense.",
        energyCost: 0, energyGain: 1,
        gradientFrom: "from-orange-800/80", gradientTo: "to-amber-700/40",
        borderColor: "border-amber-500/60",
        effects: [
          { type: "damage", value: 12, target: "enemy" },
          { type: "shield", value: 14, target: "self"  },
        ],
      },
      {
        id: 3, name: "Ancestral Fire", emoji: "💀",
        type: "Ultimate",
        description: "45 dmg — IGNORES SHIELD",
        tooltip: "The divine fire of the serpent god. Melts through any defense, dealing direct HP damage.",
        energyCost: 3, energyGain: 0,
        gradientFrom: "from-red-600/90", gradientTo: "to-orange-500/60",
        borderColor: "border-red-400/80",
        effects: [
          { type: "shieldPierce", value: 45, target: "enemy" },
        ],
      },
    ],
  },

  // ─── 3. ANHANGÁ — Assassin ────────────────────────────────────────────────
  [ChampionClass.ANHANGA]: {
    class:      ChampionClass.ANHANGA,
    baseHp:     BASE_HP,
    baseShield: BASE_SHIELD,
    cards: [
      {
        id: 0, name: "Shadow Slash", emoji: "⚔️",
        type: "Attack",
        description: "28 dmg",
        tooltip: "A swift strike from the shadows, dealing heavy damage.",
        energyCost: 0, energyGain: 1,
        gradientFrom: "from-purple-900/80", gradientTo: "to-indigo-700/40",
        borderColor: "border-purple-500/60",
        effects: [
          { type: "damage", value: 28, target: "enemy" },
        ],
      },
      {
        id: 1, name: "Soul Drain", emoji: "💀",
        type: "Attack",
        description: "16 dmg + steal 14 shield",
        tooltip: "Drains the enemy's spiritual defense, transferring their shield to you.",
        energyCost: 0, energyGain: 1,
        gradientFrom: "from-violet-900/80", gradientTo: "to-purple-700/40",
        borderColor: "border-violet-500/60",
        effects: [
          { type: "damage",      value: 16, target: "enemy" },
          { type: "stealShield", value: 14, target: "enemy" },
        ],
      },
      {
        id: 2, name: "Phantom Veil", emoji: "👻",
        type: "Defense",
        description: "10 dmg + 20 dodge shield",
        tooltip: "Phases into shadow, gaining a spectral barrier and striking while hidden.",
        energyCost: 0, energyGain: 1,
        gradientFrom: "from-purple-800/80", gradientTo: "to-pink-700/40",
        borderColor: "border-pink-500/60",
        effects: [
          { type: "damage", value: 10, target: "enemy" },
          { type: "shield", value: 20, target: "self"  },
        ],
      },
      {
        id: 3, name: "Shadow Hunt", emoji: "🎯",
        type: "Ultimate",
        description: "50 dmg — bypasses 50% shield",
        tooltip: "Anhangá hunts the target's soul directly, piercing half of their defensive barrier.",
        energyCost: 3, energyGain: 0,
        gradientFrom: "from-purple-600/90", gradientTo: "to-indigo-500/60",
        borderColor: "border-purple-400/80",
        effects: [
          { type: "damage", value: 50, target: "enemy" }, // handled specially: 50% shield bypass
          { type: "status", value: 0,  target: "self", status: "marked" }, // internal flag for half-shield bypass
        ],
      },
    ],
  },

  // ─── 4. TUPÃ — Mage ───────────────────────────────────────────────────────
  [ChampionClass.TUPA]: {
    class:      ChampionClass.TUPA,
    baseHp:     BASE_HP,
    baseShield: BASE_SHIELD,
    cards: [
      {
        id: 0, name: "Lightning Bolt", emoji: "⚡",
        type: "Attack",
        description: "22 dmg",
        tooltip: "A focused bolt of divine electricity strikes the enemy.",
        energyCost: 0, energyGain: 1,
        gradientFrom: "from-yellow-900/80", gradientTo: "to-amber-700/40",
        borderColor: "border-yellow-500/60",
        effects: [
          { type: "damage", value: 22, target: "enemy" },
        ],
      },
      {
        id: 1, name: "Thunder Shield", emoji: "🛡️",
        type: "Defense",
        description: "8 dmg + 24 shield",
        tooltip: "An electrified barrier that shocks attackers and absorbs damage.",
        energyCost: 0, energyGain: 1,
        gradientFrom: "from-yellow-800/80", gradientTo: "to-amber-600/40",
        borderColor: "border-amber-500/60",
        effects: [
          { type: "damage", value: 8,  target: "enemy" },
          { type: "shield", value: 24, target: "self"  },
        ],
      },
      {
        id: 2, name: "Storm Wave", emoji: "🌩️",
        type: "Attack",
        description: "16 dmg + STUN 1 turn",
        tooltip: "A wave of thunder stuns the enemy — they can only play 1 card next turn.",
        energyCost: 0, energyGain: 1,
        gradientFrom: "from-amber-900/80", gradientTo: "to-yellow-700/40",
        borderColor: "border-yellow-500/60",
        effects: [
          { type: "damage", value: 16, target: "enemy"                                   },
          { type: "status", value: 0,  target: "enemy", status: "halfTurn", duration: 1 },
        ],
      },
      {
        id: 3, name: "Divine Storm", emoji: "⚡",
        type: "Ultimate",
        description: "38 dmg + stun + 10 shield",
        tooltip: "Tupã unleashes divine wrath — massive electric damage, stuns the enemy, and channels power into a barrier.",
        energyCost: 3, energyGain: 0,
        gradientFrom: "from-yellow-600/90", gradientTo: "to-orange-500/60",
        borderColor: "border-yellow-400/80",
        effects: [
          { type: "damage", value: 38, target: "enemy"                                   },
          { type: "status", value: 0,  target: "enemy", status: "stunned",  duration: 1 },
          { type: "shield", value: 10, target: "self"                                    },
        ],
      },
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getChampionCards(cls: ChampionClass): ChampionCardConfig {
  return CHAMPION_CARDS[cls];
}

export function getCard(cls: ChampionClass, cardId: number): Card {
  return CHAMPION_CARDS[cls].cards[cardId];
}

/** Compute total damage a card deals (for preview / UI) */
export function cardDamagePreview(card: Card): number {
  return card.effects
    .filter(e => e.type === "damage" || e.type === "shieldPierce")
    .reduce((sum, e) => sum + e.value, 0);
}

/** Compute total shield a card provides (for preview / UI) */
export function cardShieldPreview(card: Card): number {
  return card.effects
    .filter(e => e.type === "shield")
    .reduce((sum, e) => sum + e.value, 0);
}

// ─── Turn Processor (pure TypeScript — mirrors on-chain CardBattleEngine) ─────

export interface BattleState {
  hpA:       number;   // 0–100
  hpB:       number;
  shieldA:   number;   // 0–50
  shieldB:   number;
  energyA:   number;   // 0–3
  energyB:   number;
  statusA:   StatusType;
  statusB:   StatusType;
  statusTurnsA: number;
  statusTurnsB: number;
  burnTurnsA:   number;
  burnTurnsB:   number;
  turn:      number;
  log:       TurnLog[];
}

export interface TurnLog {
  turn:    number;
  side:    "A" | "B" | "system";
  text:    string;
  damage?: number;
  heal?:   number;
  shield?: number;
  type:    "damage" | "shield" | "heal" | "status" | "ultimate" | "death" | "info";
}

export interface TurnInput {
  cardsA: number[]; // up to 2 card indices (0-3), empty = skip
  cardsB: number[];
  classA: ChampionClass;
  classB: ChampionClass;
}

export interface TurnResult {
  newState:   BattleState;
  battleOver: boolean;
  winner:     "A" | "B" | null;
}

export function processTurn(state: BattleState, input: TurnInput): TurnResult {
  // Deep clone to avoid mutation
  const s: BattleState = {
    ...state,
    log: [],
  };
  const { classA, classB, cardsA, cardsB } = input;

  // ── 0. Burn tick ─────────────────────────────────────────────────────────────
  if (s.burnTurnsA > 0) {
    s.hpA = Math.max(0, s.hpA - BURN_DAMAGE);
    s.burnTurnsA--;
    s.log.push({ turn: s.turn, side: "A", text: `A takes ${BURN_DAMAGE} burn damage`, damage: BURN_DAMAGE, type: "damage" });
  }
  if (s.burnTurnsB > 0) {
    s.hpB = Math.max(0, s.hpB - BURN_DAMAGE);
    s.burnTurnsB--;
    s.log.push({ turn: s.turn, side: "B", text: `B takes ${BURN_DAMAGE} burn damage`, damage: BURN_DAMAGE, type: "damage" });
  }

  // ── 1. Apply status limits on card count ─────────────────────────────────────
  const effectiveCardsA = s.statusA === "stunned"  ? [] :
                          s.statusA === "halfTurn" ? cardsA.slice(0, 1) : cardsA;
  const effectiveCardsB = s.statusB === "stunned"  ? [] :
                          s.statusB === "halfTurn" ? cardsB.slice(0, 1) : cardsB;

  if (s.statusA === "stunned") s.log.push({ turn: s.turn, side: "A", text: "A is stunned — skips turn!", type: "status" });
  if (s.statusB === "stunned") s.log.push({ turn: s.turn, side: "B", text: "B is stunned — skips turn!", type: "status" });
  if (s.statusA === "halfTurn") s.log.push({ turn: s.turn, side: "A", text: "A is entangled — only 1 card!", type: "status" });
  if (s.statusB === "halfTurn") s.log.push({ turn: s.turn, side: "B", text: "B is entangled — only 1 card!", type: "status" });

  // ── 2. Tick status durations ──────────────────────────────────────────────────
  if (s.statusTurnsA > 0) {
    s.statusTurnsA--;
    if (s.statusTurnsA === 0 && s.statusA !== "burned") s.statusA = "none";
  }
  if (s.statusTurnsB > 0) {
    s.statusTurnsB--;
    if (s.statusTurnsB === 0 && s.statusB !== "burned") s.statusB = "none";
  }

  // ── 3. Collect all effects from both sides ────────────────────────────────────
  let dmgToB = 0, dmgToA = 0;
  let shieldA_delta = 0, shieldB_delta = 0;
  let healA = 0, healB = 0;
  let energyA_delta = 0, energyB_delta = 0;
  let stealA = 0; // Anhangá soul drain

  // Process A's cards
  for (const cardId of effectiveCardsA) {
    if (cardId < 0 || cardId > 3) continue;
    const card = getCard(classA, cardId);

    // Energy check for ultimate
    if (card.energyCost > 0 && s.energyA < card.energyCost) {
      s.log.push({ turn: s.turn, side: "A", text: `A can't afford ${card.name} (needs ${card.energyCost} energy)`, type: "info" });
      continue;
    }

    energyA_delta -= card.energyCost;
    energyA_delta += card.energyGain;

    for (const fx of card.effects) {
      if (fx.target === "enemy") {
        if (fx.type === "damage")       dmgToB += fx.value;
        if (fx.type === "shieldPierce") dmgToB += fx.value;  // flagged separately
        if (fx.type === "stealShield")  stealA  += fx.value;
        if (fx.type === "status" && fx.status) {
          if (fx.status === "stunned" || fx.status === "halfTurn" || fx.status === "burned") {
            s.statusB     = fx.status;
            s.statusTurnsB = fx.duration ?? 1;
            if (fx.status === "burned") s.burnTurnsB = fx.duration ?? 2;
            s.log.push({ turn: s.turn, side: "A", text: `${card.name}: B is ${fx.status}!`, type: "status" });
          }
        }
      } else {
        if (fx.type === "shield") shieldA_delta += fx.value;
        if (fx.type === "heal") {
          if (fx.value === -1) {
            // Iara ult: heal 50% of lost HP
            healA += Math.floor((BASE_HP - s.hpA) / 2);
          } else {
            healA += fx.value;
          }
        }
      }
    }

    const isUlt = card.energyCost >= 3;
    s.log.push({
      turn: s.turn, side: "A",
      text: `A uses ${card.emoji} ${card.name}`,
      type: isUlt ? "ultimate" : "damage",
    });
  }

  // Process B's cards (same logic)
  for (const cardId of effectiveCardsB) {
    if (cardId < 0 || cardId > 3) continue;
    const card = getCard(classB, cardId);

    if (card.energyCost > 0 && s.energyB < card.energyCost) {
      s.log.push({ turn: s.turn, side: "B", text: `B can't afford ${card.name}`, type: "info" });
      continue;
    }

    energyB_delta -= card.energyCost;
    energyB_delta += card.energyGain;

    for (const fx of card.effects) {
      if (fx.target === "enemy") {
        if (fx.type === "damage" || fx.type === "shieldPierce") dmgToA += fx.value;
        if (fx.type === "status" && fx.status) {
          if (fx.status === "stunned" || fx.status === "halfTurn" || fx.status === "burned") {
            s.statusA     = fx.status;
            s.statusTurnsA = fx.duration ?? 1;
            if (fx.status === "burned") s.burnTurnsA = fx.duration ?? 2;
            s.log.push({ turn: s.turn, side: "B", text: `${card.name}: A is ${fx.status}!`, type: "status" });
          }
        }
      } else {
        if (fx.type === "shield") shieldB_delta += fx.value;
        if (fx.type === "heal") {
          if (fx.value === -1) {
            healB += Math.floor((BASE_HP - s.hpB) / 2);
          } else {
            healB += fx.value;
          }
        }
      }
    }
    const isUlt = card.energyCost >= 3;
    s.log.push({
      turn: s.turn, side: "B",
      text: `B uses ${card.emoji} ${card.name}`,
      type: isUlt ? "ultimate" : "damage",
    });
  }

  // ── 4. Shield steal (Anhangá Soul Drain) ─────────────────────────────────────
  if (stealA > 0) {
    const stolen = Math.min(stealA, s.shieldB);
    s.shieldB = Math.max(0, s.shieldB - stolen);
    shieldA_delta += stolen;
    s.log.push({ turn: s.turn, side: "A", text: `Soul Drain steals ${stolen} shield!`, shield: stolen, type: "shield" });
  }

  // ── 5. Apply shields (before taking damage) ───────────────────────────────────
  s.shieldA = Math.min(BASE_SHIELD, Math.max(0, s.shieldA + shieldA_delta));
  s.shieldB = Math.min(BASE_SHIELD, Math.max(0, s.shieldB + shieldB_delta));
  if (shieldA_delta > 0) s.log.push({ turn: s.turn, side: "A", text: `A shields +${shieldA_delta}`, shield: shieldA_delta, type: "shield" });
  if (shieldB_delta > 0) s.log.push({ turn: s.turn, side: "B", text: `B shields +${shieldB_delta}`, shield: shieldB_delta, type: "shield" });

  // ── 6. Apply damage simultaneously ───────────────────────────────────────────

  // Damage to B
  if (dmgToB > 0) {
    const shieldAbsorb = Math.min(dmgToB, s.shieldB);
    const hpDmg = dmgToB - shieldAbsorb;
    s.shieldB = Math.max(0, s.shieldB - shieldAbsorb);
    s.hpB     = Math.max(0, s.hpB - hpDmg);
    s.log.push({ turn: s.turn, side: "B", text: `B takes ${dmgToB} dmg (shield: ${shieldAbsorb}, hp: ${hpDmg})`, damage: dmgToB, type: "damage" });
  }

  // Damage to A
  if (dmgToA > 0) {
    const shieldAbsorb = Math.min(dmgToA, s.shieldA);
    const hpDmg = dmgToA - shieldAbsorb;
    s.shieldA = Math.max(0, s.shieldA - shieldAbsorb);
    s.hpA     = Math.max(0, s.hpA - hpDmg);
    s.log.push({ turn: s.turn, side: "A", text: `A takes ${dmgToA} dmg (shield: ${shieldAbsorb}, hp: ${hpDmg})`, damage: dmgToA, type: "damage" });
  }

  // ── 7. Apply heals ─────────────────────────────────────────────────────────────
  if (healA > 0) {
    s.hpA = Math.min(BASE_HP, s.hpA + healA);
    s.log.push({ turn: s.turn, side: "A", text: `A heals +${healA} HP`, heal: healA, type: "heal" });
  }
  if (healB > 0) {
    s.hpB = Math.min(BASE_HP, s.hpB + healB);
    s.log.push({ turn: s.turn, side: "B", text: `B heals +${healB} HP`, heal: healB, type: "heal" });
  }

  // ── 8. Update energy ──────────────────────────────────────────────────────────
  s.energyA = Math.min(MAX_ENERGY, Math.max(0, s.energyA + energyA_delta));
  s.energyB = Math.min(MAX_ENERGY, Math.max(0, s.energyB + energyB_delta));

  // ── 9. Check victory ─────────────────────────────────────────────────────────
  s.turn++;

  let battleOver = false;
  let winner: "A" | "B" | null = null;

  if (s.hpA <= 0 && s.hpB <= 0) {
    winner = s.energyA >= s.energyB ? "A" : "B"; // tiebreak by energy
    battleOver = true;
  } else if (s.hpB <= 0) {
    winner = "A"; battleOver = true;
    s.log.push({ turn: s.turn, side: "B", text: "B has been defeated! ☠️", type: "death" });
  } else if (s.hpA <= 0) {
    winner = "B"; battleOver = true;
    s.log.push({ turn: s.turn, side: "A", text: "A has been defeated! ☠️", type: "death" });
  }

  return { newState: s, battleOver, winner };
}

/** Check if a card is playable given current energy */
export function isCardPlayable(card: Card, energy: number): boolean {
  return card.energyCost <= energy;
}

/** Create fresh battle state */
export function createInitialBattleState(): BattleState {
  return {
    hpA: BASE_HP, hpB: BASE_HP,
    shieldA: BASE_SHIELD, shieldB: BASE_SHIELD,
    energyA: 0,  energyB: 0,
    statusA: "none", statusB: "none",
    statusTurnsA: 0, statusTurnsB: 0,
    burnTurnsA: 0,   burnTurnsB: 0,
    turn: 1,
    log: [],
  };
}
