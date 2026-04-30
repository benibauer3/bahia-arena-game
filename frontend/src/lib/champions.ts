/**
 * Client-side champion definitions mirroring ChampionTypes.sol.
 * Stats are informational only — the contract is the source of truth.
 */

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
  // base stats (mirrors ChampionTypes.getBaseStats)
  maxHp:       number;
  attack:      number;
  defense:     number;
  speed:       number;
  critPct:     number;  // %
  dodgePct:    number;  // %
  color:       string;  // Tailwind gradient class
  borderColor: string;
}

export const CHAMPIONS: ChampionDef[] = [
  {
    class:       ChampionClass.CURUPIRA,
    name:        "Curupira",
    role:        "Tank",
    emoji:       "🦶",
    lore:        "Guardião da floresta com pés ao contrário que confunde inimigos.",
    abilityName: "Pés Invertidos",
    abilityDesc: "+60% de defesa por 2 turnos e enfraquece o ataque do inimigo em 20%.",
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
    lore:        "Sereia dos rios amazônicos cujo canto encanta e paralisa.",
    abilityName: "Canto Sedutor",
    abilityDesc: "Atordoa o inimigo por 1 turno e recupera 45 HP.",
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
    lore:        "Serpente de fogo que protege os campos e queima tudo que ameaça.",
    abilityName: "Olhar de Brasa",
    abilityDesc: "Aplica queimadura: 18 de dano por turno durante 4 turnos (+20 instantâneo).",
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
    lore:        "Espírito errante e vingativo que persegue alvos frágeis nas sombras.",
    abilityName: "Caçada Sombria",
    abilityDesc: "Ataque ×2.5 ignorando 50% da defesa do inimigo.",
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
    lore:        "Deus do trovão tupi-guarani, senhor dos raios e das tempestades.",
    abilityName: "Tempestade Elétrica",
    abilityDesc: "65 de dano elétrico + atordoa o inimigo por 1 turno.",
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

/** Stat bar width percentage (0-100) relative to max in class */
export function statPct(value: number, max: number): number {
  return Math.min(100, Math.round((value / max) * 100));
}
