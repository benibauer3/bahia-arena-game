/**
 * useBattle.ts — Stub for classic on-chain PvP (coming in v7).
 * Classic battle functions were removed from ArenaManager v6.
 */

export interface Battle {
  playerA:   `0x${string}`;
  playerB:   `0x${string}`;
  classA:    number;
  classB:    number;
  status:    number;
  winner:    `0x${string}`;
  createdAt: bigint;
  startedAt: bigint;
  stake?:    bigint;
  [key: string]: unknown;
}

export const STATUS_LABEL: Record<number, string> = {
  0: "Open", 1: "Active", 2: "Resolved", 3: "Cancelled",
};

export function useOpenBattles() {
  return { battles: [] as Battle[], ids: [] as bigint[], isLoading: false };
}

export function useUSDTBalance() {
  return { balance: 0n, formatted: "0.00" };
}

export default function useBattle() {
  return null;
}
