/**
 * useBattle.ts — Two separate exports in one file:
 *
 *  1. Wagmi contract hooks (useOpenBattles, useUSDTBalance, etc.)
 *     — kept for Arena.tsx, BattleCard.tsx, WalletConnect.tsx
 *
 *  2. useGameBattle() — pure local game-state hook (no blockchain)
 *     — used by Demo.tsx and any future PvP UI
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { ACTIVE_CONTRACTS, ARENA_ABI, ERC20_ABI } from "@/lib/contracts";
import { useAccount } from "wagmi";
import { useState, useCallback, useRef, useEffect } from "react";
import { BASE_STATS, CHAMPIONS, type Card, type ChampionDef, ChampionClass } from "@/lib/champions";

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION A — CONTRACT TYPES & WAGMI HOOKS (kept for existing consumers)
// ═══════════════════════════════════════════════════════════════════════════════

export type BattleStatus = 0 | 1 | 2 | 3; // OPEN | ACTIVE | RESOLVED | CANCELLED

export interface Battle {
  playerA:   `0x${string}`;
  playerB:   `0x${string}`;
  classA:    number;
  classB:    number;
  stake:     bigint;
  status:    BattleStatus;
  winner:    `0x${string}`;
  createdAt: bigint;
  startedAt: bigint;
}

export const STATUS_LABEL: Record<BattleStatus, string> = {
  0: "Open",
  1: "In Battle",
  2: "Resolved",
  3: "Cancelled",
};

export function useOpenBattles() {
  return useReadContract({
    address:      ACTIVE_CONTRACTS.ArenaManager,
    abi:          ARENA_ABI,
    functionName: "getOpenBattles",
    args:         [0n, 20n],
  });
}

export function useOnChainBattle(battleId: bigint | undefined) {
  return useReadContract({
    address:      ACTIVE_CONTRACTS.ArenaManager,
    abi:          ARENA_ABI,
    functionName: "getBattle",
    args:         battleId !== undefined ? [battleId] : undefined,
    query:        { enabled: battleId !== undefined, refetchInterval: 5_000 },
  });
}

export function useUSDTBalance() {
  const { address } = useAccount();
  return useReadContract({
    address:      ACTIVE_CONTRACTS.usdt,
    abi:          ERC20_ABI,
    functionName: "balanceOf",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address, refetchInterval: 10_000 },
  });
}

export function useUSDTAllowance(spender: `0x${string}`) {
  const { address } = useAccount();
  return useReadContract({
    address:      ACTIVE_CONTRACTS.usdt,
    abi:          ERC20_ABI,
    functionName: "allowance",
    args:         address ? [address, spender] : undefined,
    query:        { enabled: !!address },
  });
}

export function useCreateBattle() {
  const approve    = useWriteContract();
  const create     = useWriteContract();
  const approveRct = useWaitForTransactionReceipt({ hash: approve.data });
  const createRct  = useWaitForTransactionReceipt({ hash: create.data });

  async function submit(classIndex: number, stakeUSD: string) {
    const stakeWei = parseUnits(stakeUSD, 18);
    const approveTx = await approve.writeContractAsync({
      address:      ACTIVE_CONTRACTS.usdt,
      abi:          ERC20_ABI,
      functionName: "approve",
      args:         [ACTIVE_CONTRACTS.ArenaManager, stakeWei],
    });
    return { approveTx, stakeWei };
  }

  async function createAfterApproval(classIndex: number) {
    return create.writeContractAsync({
      address:      ACTIVE_CONTRACTS.ArenaManager,
      abi:          ARENA_ABI,
      functionName: "createBattle",
      args:         [classIndex],
    });
  }

  return {
    submit,
    createAfterApproval,
    approveStatus:  approveRct.status,
    createStatus:   createRct.status,
    isApproving:    approve.isPending || approveRct.isLoading,
    isCreating:     create.isPending  || createRct.isLoading,
    error:          approve.error ?? create.error,
  };
}

export function useJoinBattle() {
  const approve  = useWriteContract();
  const join     = useWriteContract();
  const joinRct  = useWaitForTransactionReceipt({ hash: join.data });

  async function submit(battleId: bigint, classIndex: number, stake: bigint) {
    await approve.writeContractAsync({
      address:      ACTIVE_CONTRACTS.usdt,
      abi:          ERC20_ABI,
      functionName: "approve",
      args:         [ACTIVE_CONTRACTS.ArenaManager, stake],
    });
    return join.writeContractAsync({
      address:      ACTIVE_CONTRACTS.ArenaManager,
      abi:          ARENA_ABI,
      functionName: "joinBattle",
      args:         [battleId, classIndex],
    });
  }

  return {
    submit,
    isLoading: approve.isPending || join.isPending || joinRct.isLoading,
    isSuccess: joinRct.isSuccess,
    error:     approve.error ?? join.error,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION B — LOCAL GAME BATTLE HOOK (pure TypeScript, no blockchain)
// ═══════════════════════════════════════════════════════════════════════════════

export type BattlePhase = "select" | "playing" | "result";
export type Turn = "player" | "enemy";

export interface CombatantState {
  championClass: ChampionClass;
  hp:            number;
  maxHp:         number;
  shield:        number;
  maxShield:     number;
  energy:        number;
  maxEnergy:     number;
}

export interface BattleLog {
  turn:         number;
  actor:        "player" | "enemy";
  cardName:     string;
  damage:       number;
  shieldGain:   number;
  heal:         number;
  energyChange: number;
  text:         string;
}

interface GameBattleState {
  phase:   BattlePhase;
  player:  CombatantState;
  enemy:   CombatantState;
  turn:    "player" | "enemy";
  log:     BattleLog[];
  turnCount: number;
  winner:  "player" | "enemy" | null;
}

function makeCombatant(cls: ChampionClass): CombatantState {
  return {
    championClass: cls,
    hp:        BASE_STATS.hp,
    maxHp:     BASE_STATS.hp,
    shield:    BASE_STATS.shield,
    maxShield: BASE_STATS.shield,
    energy:    0,
    maxEnergy: BASE_STATS.maxEnergy,
  };
}

/**
 * Apply a card's damage/shield/heal to combatants.
 * Damage hits shield first, then HP.
 * Returns a log entry describing what happened.
 */
function applyCard(
  card:       Card,
  attacker:   CombatantState,
  defender:   CombatantState,
  actor:      "player" | "enemy",
  turnCount:  number,
): { nextAttacker: CombatantState; nextDefender: CombatantState; log: BattleLog } {
  let nextAtk = { ...attacker };
  let nextDef = { ...defender };

  // Energy
  if (card.type === "ultimate") {
    nextAtk = { ...nextAtk, energy: nextAtk.energy - card.energyCost };
  } else {
    nextAtk = { ...nextAtk, energy: Math.min(nextAtk.maxEnergy, nextAtk.energy + card.energyGain) };
  }

  // Damage
  let dmg = card.damage;
  let shieldAbsorbed = 0;
  if (dmg > 0) {
    shieldAbsorbed = Math.min(nextDef.shield, dmg);
    const hpDmg = dmg - shieldAbsorbed;
    nextDef = {
      ...nextDef,
      shield: nextDef.shield - shieldAbsorbed,
      hp:     Math.max(0, nextDef.hp - hpDmg),
    };
  }

  // Shield gain (self)
  const shieldGain = card.shield;
  if (shieldGain > 0) {
    nextAtk = {
      ...nextAtk,
      shield: Math.min(nextAtk.maxShield, nextAtk.shield + shieldGain),
    };
  }

  // Heal (self)
  const healAmt = card.heal;
  if (healAmt > 0) {
    nextAtk = {
      ...nextAtk,
      hp: Math.min(nextAtk.maxHp, nextAtk.hp + healAmt),
    };
  }

  const parts: string[] = [`${card.emoji} ${card.name}`];
  if (dmg > 0)       parts.push(`${dmg} dmg`);
  if (shieldGain > 0) parts.push(`+${shieldGain} shield`);
  if (healAmt > 0)   parts.push(`+${healAmt} HP`);

  const log: BattleLog = {
    turn:         turnCount,
    actor,
    cardName:     card.name,
    damage:       dmg,
    shieldGain,
    heal:         healAmt,
    energyChange: card.type === "ultimate" ? -card.energyCost : card.energyGain,
    text:         parts.join(" · "),
  };

  return { nextAttacker: nextAtk, nextDefender: nextDef, log };
}

/**
 * useGameBattle — manages the full battle state for the Demo screen.
 *
 * Usage:
 *   const battle = useGameBattle();
 *   battle.selectChampion(ChampionClass.CURUPIRA);   // phase: select → playing
 *   battle.playCard(card);                           // player plays, then enemy AI plays
 *   battle.resetBattle();
 */
export function useGameBattle() {
  const [state, setState] = useState<GameBattleState>({
    phase:     "select",
    player:    makeCombatant(ChampionClass.CURUPIRA),
    enemy:     makeCombatant(ChampionClass.IARA),
    turn:      "player",
    log:       [],
    turnCount: 1,
    winner:    null,
  });

  const selectChampion = useCallback((cls: ChampionClass) => {
    // Pick a random enemy champion (different from player)
    const others = ([0, 1, 2, 3, 4] as ChampionClass[]).filter(c => c !== cls);
    const enemyCls = others[Math.floor(Math.random() * others.length)];

    setState({
      phase:     "playing",
      player:    makeCombatant(cls),
      enemy:     makeCombatant(enemyCls),
      turn:      "player",
      log:       [],
      turnCount: 1,
      winner:    null,
    });
  }, []);

  const playCard = useCallback((card: Card) => {
    setState(prev => {
      if (prev.phase !== "playing") return prev;
      if (prev.turn !== "player")   return prev;

      // Validate energy
      if (card.type === "ultimate" && prev.player.energy < card.energyCost) return prev;

      // Player plays
      const { nextAttacker: newPlayer, nextDefender: newEnemy, log: playerLog } =
        applyCard(card, prev.player, prev.enemy, "player", prev.turnCount);

      const newLog = [...prev.log, playerLog];

      // Check if enemy is defeated after player's action
      if (newEnemy.hp <= 0) {
        return {
          ...prev,
          player:  newPlayer,
          enemy:   { ...newEnemy, hp: 0 },
          log:     newLog,
          phase:   "result",
          winner:  "player",
        };
      }

      // Enemy AI: picks a random affordable card
      const enemyChampion = CHAMPIONS[newEnemy.championClass];
      const affordableCards = enemyChampion.cards.filter(c =>
        c.type === "basic" || (c.type === "ultimate" && newEnemy.energy >= c.energyCost)
      );
      const enemyCard = affordableCards.length > 0
        ? affordableCards[Math.floor(Math.random() * affordableCards.length)]
        : enemyChampion.cards[0]; // fallback: first basic

      const { nextAttacker: newEnemy2, nextDefender: newPlayer2, log: enemyLog } =
        applyCard(enemyCard, newEnemy, newPlayer, "enemy", prev.turnCount);

      const finalLog = [...newLog, enemyLog];

      // Check if player is defeated
      if (newPlayer2.hp <= 0) {
        return {
          ...prev,
          player:  { ...newPlayer2, hp: 0 },
          enemy:   newEnemy2,
          log:     finalLog,
          phase:   "result",
          winner:  "enemy",
        };
      }

      return {
        ...prev,
        player:    newPlayer2,
        enemy:     newEnemy2,
        turn:      "player",
        log:       finalLog,
        turnCount: prev.turnCount + 1,
      };
    });
  }, []);

  const resetBattle = useCallback(() => {
    setState({
      phase:     "select",
      player:    makeCombatant(ChampionClass.CURUPIRA),
      enemy:     makeCombatant(ChampionClass.IARA),
      turn:      "player",
      log:       [],
      turnCount: 1,
      winner:    null,
    });
  }, []);

  return {
    phase:      state.phase,
    player:     state.player,
    enemy:      state.enemy,
    turn:       state.turn,
    log:        state.log,
    turnCount:  state.turnCount,
    winner:     state.winner,
    selectChampion,
    playCard,
    resetBattle,
  };
}
