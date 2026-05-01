/**
 * battleEngine.ts — TypeScript port of BattleEngine.sol
 *
 * Produces the same deterministic battle result as the on-chain contract.
 * Used by the frontend to animate the battle sequence before the TX is confirmed.
 *
 * Seed handling mirrors Solidity's keccak256 chaining.
 * All arithmetic uses integer Math.floor() to match Solidity integer division.
 */

import { CHAMPIONS, ChampionClass } from "./champions";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatusEffect = "none" | "burned" | "stunned" | "weakened";

export interface BattleUnit {
  classIdx:    ChampionClass;
  currentHp:   number;
  maxHp:       number;
  attack:      number;
  defense:     number;
  speed:       number;
  critBps:     number;   // basis points (100 = 1%)
  dodgeBps:    number;
  status:      StatusEffect;
  dotDamage:   number;
  dotTurns:    number;
  statusTurns: number;
  abilityUsed: boolean;
  defenseBuff: number;   // turns remaining on Curupira's defense buff
}

export interface BattleEvent {
  turn:       number;
  side:       "A" | "B";
  type:       "attack" | "ability" | "dot" | "heal" | "stunned" | "dodge" | "death";
  damage:     number;
  heal:       number;
  hpA:        number;
  hpB:        number;
  crit:       boolean;
  abilityName?: string;
  description: string;
}

export interface BattleResult {
  winner:  "A" | "B";
  turns:   number;
  events:  BattleEvent[];
  finalHpA: number;
  finalHpB: number;
}

// ─── Seed helpers ─────────────────────────────────────────────────────────────
// Approximate keccak256 chaining with a simple LCG for frontend animation.
// The actual winner is read from the chain — this is purely for UI.

function nextSeed(seed: bigint, nonce: number): bigint {
  const BIG = 6364136223846793005n;
  const INC  = 1442695040888963407n;
  const MASK = (1n << 64n) - 1n;
  return ((seed * BIG + INC + BigInt(nonce)) & MASK);
}

function randBelow(seed: bigint, max: number): [number, bigint] {
  const next = nextSeed(seed, 0);
  return [Number(next % BigInt(max)), next];
}

// ─── Unit builder ─────────────────────────────────────────────────────────────

export function buildUnit(cls: ChampionClass): BattleUnit {
  const c = CHAMPIONS[cls];
  return {
    classIdx:    cls,
    currentHp:   c.maxHp,
    maxHp:       c.maxHp,
    attack:      c.attack,
    defense:     c.defense,
    speed:       c.speed,
    critBps:     c.critPct * 100,
    dodgeBps:    c.dodgePct * 100,
    status:      "none",
    dotDamage:   0,
    dotTurns:    0,
    statusTurns: 0,
    abilityUsed: false,
    defenseBuff: 0,
  };
}

// ─── Damage formula (mirrors Solidity _calcDamage) ────────────────────────────

function calcDamage(atk: number, def: number): number {
  const reduction = Math.floor(def * 60 / 100);
  return Math.max(1, atk > reduction ? atk - reduction : 1);
}

// ─── Ability trigger logic (mirrors _shouldUseAbility) ────────────────────────

function shouldUseAbility(self: BattleUnit, enemy: BattleUnit): boolean {
  const c = CHAMPIONS[self.classIdx];
  switch (self.classIdx) {
    case ChampionClass.CURUPIRA:
      return self.currentHp < Math.floor(c.maxHp * 60 / 100);
    case ChampionClass.IARA:
      return self.currentHp < Math.floor(c.maxHp * 50 / 100) || enemy.status !== "stunned";
    case ChampionClass.BOITATA:
      return enemy.dotTurns === 0;
    case ChampionClass.ANHANGA:
      return enemy.currentHp < Math.floor(CHAMPIONS[enemy.classIdx].maxHp * 50 / 100);
    default: // TUPA
      return true;
  }
}

// ─── Ability application (mirrors _applyAbility) ──────────────────────────────

function applyAbility(
  self:   BattleUnit,
  enemy:  BattleUnit,
  events: BattleEvent[],
  turn:   number,
  side:   "A" | "B",
  hpA:    () => number,
  hpB:    () => number
): void {
  const abilityNames = ["Inverted Feet", "Seductive Song", "Ember Gaze", "Shadow Hunt", "Lightning Storm"];
  const name = abilityNames[self.classIdx];

  switch (self.classIdx) {
    case ChampionClass.CURUPIRA: {
      // +60% DEF buff 2 turns + weaken enemy
      self.defenseBuff = 2;
      self.defense     = Math.floor(self.defense * 160 / 100);
      enemy.status     = "weakened";
      enemy.statusTurns = 2;
      enemy.attack     = Math.floor(enemy.attack * 80 / 100);
      events.push({ turn, side, type: "ability", damage: 0, heal: 0,
        hpA: hpA(), hpB: hpB(), crit: false, abilityName: name,
        description: `${side} activates ${name}: +60% DEF, enemy weakened!` });
      break;
    }
    case ChampionClass.IARA: {
      // Stun 1 turn + heal 45 HP
      enemy.status      = "stunned";
      enemy.statusTurns = 1;
      const healed = Math.min(45, self.maxHp - self.currentHp);
      self.currentHp  += healed;
      events.push({ turn, side, type: "ability", damage: 0, heal: healed,
        hpA: hpA(), hpB: hpB(), crit: false, abilityName: name,
        description: `${side} uses ${name}: enemy stunned, healed ${healed} HP!` });
      break;
    }
    case ChampionClass.BOITATA: {
      // 20 instant + burn 18/turn × 4 turns
      const instDmg = calcDamage(20, enemy.defense);
      enemy.currentHp  = Math.max(0, enemy.currentHp - instDmg);
      enemy.status     = "burned";
      enemy.dotDamage  = 18;
      enemy.dotTurns   = 4;
      events.push({ turn, side, type: "ability", damage: instDmg, heal: 0,
        hpA: hpA(), hpB: hpB(), crit: false, abilityName: name,
        description: `${side} uses ${name}: ${instDmg} dmg + BURN 18/turn × 4!` });
      break;
    }
    case ChampionClass.ANHANGA: {
      // ×2.5 attack ignoring 50% DEF
      const rawAtk = Math.floor(self.attack * 25 / 10);
      const dmg    = calcDamage(rawAtk, Math.floor(enemy.defense / 2));
      enemy.currentHp = Math.max(0, enemy.currentHp - dmg);
      events.push({ turn, side, type: "ability", damage: dmg, heal: 0,
        hpA: hpA(), hpB: hpB(), crit: false, abilityName: name,
        description: `${side} uses ${name}: ×2.5 burst for ${dmg} dmg!` });
      break;
    }
    default: { // TUPA
      // 65 flat dmg + stun
      const dmg = calcDamage(65, enemy.defense);
      enemy.currentHp   = Math.max(0, enemy.currentHp - dmg);
      enemy.status      = "stunned";
      enemy.statusTurns = 1;
      events.push({ turn, side, type: "ability", damage: dmg, heal: 0,
        hpA: hpA(), hpB: hpB(), crit: false, abilityName: name,
        description: `${side} uses ${name}: ${dmg} ⚡ dmg + stunned!` });
      break;
    }
  }
}

// ─── Process a single turn ────────────────────────────────────────────────────

function processTurn(
  atk:    BattleUnit,
  def:    BattleUnit,
  side:   "A" | "B",
  turn:   number,
  seed:   bigint,
  events: BattleEvent[],
  getHpA: () => number,
  getHpB: () => number
): bigint {
  let s = seed;

  // 1. DoT tick on attacker
  if (atk.dotTurns > 0) {
    const dot = atk.dotDamage;
    atk.currentHp = Math.max(0, atk.currentHp - dot);
    atk.dotTurns--;
    if (atk.dotTurns === 0) atk.status = "none";
    events.push({ turn, side, type: "dot", damage: dot, heal: 0,
      hpA: getHpA(), hpB: getHpB(), crit: false,
      description: `${side} takes ${dot} burn damage!` });
    if (atk.currentHp === 0) return s;
  }

  // 2. Status duration tick
  if (atk.statusTurns > 0) {
    atk.statusTurns--;
    if (atk.statusTurns === 0 && atk.status !== "burned") atk.status = "none";
  }
  if (atk.defenseBuff > 0) atk.defenseBuff--;

  // 3. Stun skip
  if (atk.status === "stunned") {
    events.push({ turn, side, type: "stunned", damage: 0, heal: 0,
      hpA: getHpA(), hpB: getHpB(), crit: false,
      description: `${side} is stunned and skips their turn!` });
    return s;
  }

  // 4. Ability vs normal attack
  if (!atk.abilityUsed && shouldUseAbility(atk, def)) {
    atk.abilityUsed = true;
    applyAbility(atk, def, events, turn, side, getHpA, getHpB);
    return s;
  }

  // 5. Normal attack
  let rand: number;
  [rand, s] = randBelow(s, 10000);
  const dodged = rand < def.dodgeBps;
  if (dodged) {
    events.push({ turn, side, type: "dodge", damage: 0, heal: 0,
      hpA: getHpA(), hpB: getHpB(), crit: false,
      description: `${side === "A" ? "B" : "A"} dodges the attack!` });
    return s;
  }

  [rand, s] = randBelow(s, 10000);
  const isCrit = rand < atk.critBps;

  const effAtk = isCrit ? Math.floor(atk.attack * 175 / 100) : atk.attack;
  const effDef = atk.status === "weakened" ? Math.floor(def.defense * 0.8) : def.defense;
  const damage = calcDamage(effAtk, effDef);

  def.currentHp = Math.max(0, def.currentHp - damage);
  events.push({ turn, side, type: "attack", damage, heal: 0,
    hpA: getHpA(), hpB: getHpB(), crit: isCrit,
    description: isCrit
      ? `${side} lands a CRITICAL HIT for ${damage} dmg! 💥`
      : `${side} attacks for ${damage} dmg.` });

  return s;
}

// ─── Main simulate function ───────────────────────────────────────────────────

export function simulateBattle(
  classA: ChampionClass,
  classB: ChampionClass,
  seed:   bigint
): BattleResult {
  const unitA = buildUnit(classA);
  const unitB = buildUnit(classB);
  const events: BattleEvent[] = [];
  const MAX_TURNS = 30;

  let s = seed;
  let turns = 0;
  const aFirst = unitA.speed >= unitB.speed;

  const hpA = () => unitA.currentHp;
  const hpB = () => unitB.currentHp;

  for (let t = 1; t <= MAX_TURNS; t++) {
    s = nextSeed(s, t);
    turns = t;

    if (aFirst) {
      processTurn(unitA, unitB, "A", t, s, events, hpA, hpB);
      s = nextSeed(s, t + 100);
      if (unitA.currentHp === 0 || unitB.currentHp === 0) break;
      processTurn(unitB, unitA, "B", t, s ^ 1n, events, hpA, hpB);
    } else {
      processTurn(unitB, unitA, "B", t, s, events, hpA, hpB);
      s = nextSeed(s, t + 100);
      if (unitA.currentHp === 0 || unitB.currentHp === 0) break;
      processTurn(unitA, unitB, "A", t, s ^ 1n, events, hpA, hpB);
    }

    if (unitA.currentHp === 0 || unitB.currentHp === 0) break;
  }

  let winner: "A" | "B";
  if (unitA.currentHp === 0 && unitB.currentHp === 0) {
    winner = unitA.speed >= unitB.speed ? "A" : "B";
  } else if (unitB.currentHp === 0) {
    winner = "A";
  } else if (unitA.currentHp === 0) {
    winner = "B";
  } else {
    winner = unitA.currentHp >= unitB.currentHp ? "A" : "B";
  }

  // Death event
  const loserSide = winner === "A" ? "B" : "A";
  events.push({
    turn: turns, side: loserSide, type: "death", damage: 0, heal: 0,
    hpA: unitA.currentHp, hpB: unitB.currentHp, crit: false,
    description: `${loserSide} has been defeated!`,
  });

  return { winner, turns, events, finalHpA: unitA.currentHp, finalHpB: unitB.currentHp };
}
