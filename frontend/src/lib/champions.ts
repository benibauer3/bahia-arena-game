export enum ChampionClass {
  CURUPIRA   = 0,
  IARA       = 1,
  BOITATA    = 2,
  ANHANGA    = 3,
  TUPA       = 4,
}

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
}

export const CHAMPIONS: ChampionDef[] = [
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
  },
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
  },
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
  },
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
  },
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
  },
];

export function getChampion(class_: ChampionClass): ChampionDef {
  return CHAMPIONS[class_];
}

export function statPct(value: number, max: number): number {
  return Math.min(100, Math.round((value / max) * 100));
}
