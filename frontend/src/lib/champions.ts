// ─── Champion Classes ────────────────────────────────────────────────────────

export enum ChampionClass {
  CURUPIRA   = 0,
  IARA       = 1,
  BOITATA    = 2,
  ANHANGA    = 3,
  TUPA       = 4,
}

// Convenience alias used throughout the codebase
export type ChampionClass_ = ChampionClass;

// ─── Card System ─────────────────────────────────────────────────────────────

/**
 * A card that a champion can play during battle.
 *
 * Basic cards (type:"basic"):
 *   - energyCost: 0   — free to play
 *   - energyGain: 1   — generates +1 energy
 *
 * Ultimate cards (type:"ultimate"):
 *   - energyCost: 3   — requires 3 energy
 *   - energyGain: 0   — generates no energy
 */
export interface Card {
  id:          string;
  name:        string;
  type:        "basic" | "ultimate";
  energyCost:  number;   // basic: 0,  ultimate: 3
  energyGain:  number;   // basic: 1,  ultimate: 0
  damage:      number;
  shield:      number;   // shield added to self
  heal:        number;
  description: string;
  emoji:       string;
}

// ─── Shared Base Stats ────────────────────────────────────────────────────────

/** All champions start with these stats — total equity. */
export const BASE_STATS = {
  hp:        100,
  shield:    50,
  maxEnergy: 5,
} as const;

// ─── Champion Definition (display + battle metadata) ─────────────────────────

export interface ChampionDef {
  class:       ChampionClass;
  name:        string;
  role:        string;
  emoji:       string;
  lore:        string;
  abilityName: string;
  abilityDesc: string;
  maxHp:       number;
  attack:      number;
  defense:     number;
  speed:       number;
  critPct:     number;
  dodgePct:    number;
  color:       string;
  borderColor: string;
  /** 4 cards: 3 basic + 1 ultimate */
  cards:       [Card, Card, Card, Card];
}

// ─── Champion Definitions ────────────────────────────────────────────────────

export const CHAMPIONS: ChampionDef[] = [

  // ── 0. CURUPIRA — Tank ───────────────────────────────────────────────────────
  {
    class:       ChampionClass.CURUPIRA,
    name:        "Curupira",
    role:        "Tank",
    emoji:       "🦶",
    lore:        "Guardian of the Amazon forest with backwards feet that confuse and trap all who dare enter his domain.",
    abilityName: "Inverted Feet",
    abilityDesc: "+60% defense for 2 turns and weakens enemy attack by 20%.",
    maxHp:       200,
    attack:      22,
    defense:     45,
    speed:       12,
    critPct:     5,
    dodgePct:    20,
    color:       "from-green-900/60 to-green-700/20",
    borderColor: "border-green-600/50",
    cards: [
      {
        id:          "curupira-0",
        name:        "Raiz Protetora",
        type:        "basic",
        energyCost:  0,
        energyGain:  1,
        damage:      8,
        shield:      5,
        heal:        0,
        description: "8 dmg · +5 shield",
        emoji:       "🌿",
      },
      {
        id:          "curupira-1",
        name:        "Pisada da Floresta",
        type:        "basic",
        energyCost:  0,
        energyGain:  1,
        damage:      12,
        shield:      0,
        heal:        0,
        description: "12 dmg",
        emoji:       "🦶",
      },
      {
        id:          "curupira-2",
        name:        "Regeneração",
        type:        "basic",
        energyCost:  0,
        energyGain:  1,
        damage:      0,
        shield:      0,
        heal:        15,
        description: "+15 HP",
        emoji:       "💚",
      },
      {
        id:          "curupira-ult",
        name:        "Fúria da Floresta",
        type:        "ultimate",
        energyCost:  3,
        energyGain:  0,
        damage:      35,
        shield:      20,
        heal:        10,
        description: "35 dmg · +20 shield · +10 HP",
        emoji:       "🌾",
      },
    ],
  },

  // ── 1. IARA — Support ────────────────────────────────────────────────────────
  {
    class:       ChampionClass.IARA,
    name:        "Iara",
    role:        "Support",
    emoji:       "🧜‍♀️",
    lore:        "River mermaid of the Amazon whose enchanting song lures warriors to their doom — or saves her allies.",
    abilityName: "Seductive Song",
    abilityDesc: "Stuns the enemy for 1 turn and restores 45 HP.",
    maxHp:       160,
    attack:      25,
    defense:     30,
    speed:       18,
    critPct:     10,
    dodgePct:    10,
    color:       "from-blue-900/60 to-cyan-700/20",
    borderColor: "border-cyan-500/50",
    cards: [
      {
        id:          "iara-0",
        name:        "Canto Sereio",
        type:        "basic",
        energyCost:  0,
        energyGain:  1,
        damage:      10,
        shield:      0,
        heal:        0,
        description: "10 dmg",
        emoji:       "🎵",
      },
      {
        id:          "iara-1",
        name:        "Névoa do Rio",
        type:        "basic",
        energyCost:  0,
        energyGain:  1,
        damage:      6,
        shield:      10,
        heal:        0,
        description: "6 dmg · +10 shield",
        emoji:       "🌊",
      },
      {
        id:          "iara-2",
        name:        "Águas Sagradas",
        type:        "basic",
        energyCost:  0,
        energyGain:  1,
        damage:      0,
        shield:      0,
        heal:        20,
        description: "+20 HP",
        emoji:       "💧",
      },
      {
        id:          "iara-ult",
        name:        "Canção Abissal",
        type:        "ultimate",
        energyCost:  3,
        energyGain:  0,
        damage:      15,
        shield:      10,
        heal:        30,
        description: "15 dmg · +10 shield · +30 HP",
        emoji:       "🧜‍♀️",
      },
    ],
  },

  // ── 2. BOITATÁ — DPS / DoT ──────────────────────────────────────────────────
  {
    class:       ChampionClass.BOITATA,
    name:        "Boitatá",
    role:        "DPS / DoT",
    emoji:       "🐍",
    lore:        "A great fire serpent that protects the fields, burning with the eyes of a thousand souls it has consumed.",
    abilityName: "Ember Gaze",
    abilityDesc: "Applies burn: 18 fire damage per turn for 4 turns (+20 instant damage).",
    maxHp:       150,
    attack:      40,
    defense:     20,
    speed:       22,
    critPct:     15,
    dodgePct:    5,
    color:       "from-orange-900/60 to-red-700/20",
    borderColor: "border-orange-500/50",
    cards: [
      {
        id:          "boitata-0",
        name:        "Sopro de Fogo",
        type:        "basic",
        energyCost:  0,
        energyGain:  1,
        damage:      14,
        shield:      0,
        heal:        0,
        description: "14 dmg",
        emoji:       "🔥",
      },
      {
        id:          "boitata-1",
        name:        "Rastro de Brasa",
        type:        "basic",
        energyCost:  0,
        energyGain:  1,
        damage:      8,
        shield:      8,
        heal:        0,
        description: "8 dmg · +8 shield",
        emoji:       "🐍",
      },
      {
        id:          "boitata-2",
        name:        "Aura Flamejante",
        type:        "basic",
        energyCost:  0,
        energyGain:  1,
        damage:      6,
        shield:      12,
        heal:        0,
        description: "6 dmg · +12 shield",
        emoji:       "✨",
      },
      {
        id:          "boitata-ult",
        name:        "Fogo Ancestral",
        type:        "ultimate",
        energyCost:  3,
        energyGain:  0,
        damage:      45,
        shield:      0,
        heal:        0,
        description: "45 dmg — ignores shield",
        emoji:       "💀",
      },
    ],
  },

  // ── 3. ANHANGÁ — Assassin ────────────────────────────────────────────────────
  {
    class:       ChampionClass.ANHANGA,
    name:        "Anhangá",
    role:        "Assassin",
    emoji:       "💀",
    lore:        "A vengeful wandering spirit that stalks weak prey in the shadows, striking with terrifying precision.",
    abilityName: "Shadow Hunt",
    abilityDesc: "Deals ×2.5 damage ignoring 50% of the enemy's defense.",
    maxHp:       120,
    attack:      55,
    defense:     15,
    speed:       35,
    critPct:     25,
    dodgePct:    15,
    color:       "from-purple-900/60 to-indigo-700/20",
    borderColor: "border-purple-500/50",
    cards: [
      {
        id:          "anhanga-0",
        name:        "Golpe das Sombras",
        type:        "basic",
        energyCost:  0,
        energyGain:  1,
        damage:      16,
        shield:      0,
        heal:        0,
        description: "16 dmg",
        emoji:       "⚔️",
      },
      {
        id:          "anhanga-1",
        name:        "Dreno da Alma",
        type:        "basic",
        energyCost:  0,
        energyGain:  1,
        damage:      10,
        shield:      8,
        heal:        0,
        description: "10 dmg · +8 shield stolen",
        emoji:       "💀",
      },
      {
        id:          "anhanga-2",
        name:        "Véu Fantasma",
        type:        "basic",
        energyCost:  0,
        energyGain:  1,
        damage:      5,
        shield:      15,
        heal:        0,
        description: "5 dmg · +15 shield",
        emoji:       "👻",
      },
      {
        id:          "anhanga-ult",
        name:        "Caçada Sombria",
        type:        "ultimate",
        energyCost:  3,
        energyGain:  0,
        damage:      50,
        shield:      0,
        heal:        0,
        description: "50 dmg — bypasses 50% shield",
        emoji:       "🎯",
      },
    ],
  },

  // ── 4. TUPÃ — Mage ───────────────────────────────────────────────────────────
  {
    class:       ChampionClass.TUPA,
    name:        "Tupã",
    role:        "Mage",
    emoji:       "⚡",
    lore:        "The supreme god of thunder in Tupi-Guarani mythology. Master of storms and lightning that shakes the heavens.",
    abilityName: "Lightning Storm",
    abilityDesc: "Deals 65 electric damage and stuns the enemy for 1 turn.",
    maxHp:       140,
    attack:      45,
    defense:     18,
    speed:       28,
    critPct:     20,
    dodgePct:    8,
    color:       "from-yellow-900/60 to-amber-600/20",
    borderColor: "border-yellow-400/50",
    cards: [
      {
        id:          "tupa-0",
        name:        "Raio Divino",
        type:        "basic",
        energyCost:  0,
        energyGain:  1,
        damage:      13,
        shield:      0,
        heal:        0,
        description: "13 dmg",
        emoji:       "⚡",
      },
      {
        id:          "tupa-1",
        name:        "Escudo Trovão",
        type:        "basic",
        energyCost:  0,
        energyGain:  1,
        damage:      5,
        shield:      14,
        heal:        0,
        description: "5 dmg · +14 shield",
        emoji:       "🛡️",
      },
      {
        id:          "tupa-2",
        name:        "Onda Tempestuosa",
        type:        "basic",
        energyCost:  0,
        energyGain:  1,
        damage:      10,
        shield:      0,
        heal:        5,
        description: "10 dmg · +5 HP",
        emoji:       "🌩️",
      },
      {
        id:          "tupa-ult",
        name:        "Tempestade Divina",
        type:        "ultimate",
        energyCost:  3,
        energyGain:  0,
        damage:      38,
        shield:      10,
        heal:        0,
        description: "38 dmg · +10 shield · stun",
        emoji:       "⚡",
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getChampion(class_: ChampionClass): ChampionDef {
  return CHAMPIONS[class_];
}

export function statPct(value: number, max: number): number {
  return Math.min(100, Math.round((value / max) * 100));
}
