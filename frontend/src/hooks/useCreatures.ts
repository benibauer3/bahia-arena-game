import { useReadContract } from "wagmi";
import { useAccount } from "wagmi";
import { ACTIVE_CONTRACTS, CREATURE_ABI } from "@/lib/contracts";

export const ELEMENT_NAMES = ["Fogo", "Água", "Terra", "Vento", "Raio"] as const;
export const ELEMENT_EMOJIS = ["🔥", "💧", "🌍", "🌀", "⚡"] as const;
export const ELEMENT_COLORS = [
  "text-element-fire",
  "text-element-water",
  "text-element-earth",
  "text-element-wind",
  "text-element-lightning",
] as const;

export interface CreatureStats {
  hp:       number;
  attack:   number;
  defense:  number;
  speed:    number;
  level:    number;
  element:  number;
  inBattle: boolean;
}

export interface Creature {
  tokenId:  bigint;
  stats:    CreatureStats;
  imageUrl: string;
}

// Returns all token IDs owned by the connected wallet
export function useOwnedTokenIds() {
  const { address } = useAccount();
  return useReadContract({
    address:      ACTIVE_CONTRACTS.BahiaArenaCreature,
    abi:          CREATURE_ABI,
    functionName: "tokensOfOwner",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  });
}

// Returns stats for a single creature
export function useCreatureStats(tokenId: bigint | undefined) {
  return useReadContract({
    address:      ACTIVE_CONTRACTS.BahiaArenaCreature,
    abi:          CREATURE_ABI,
    functionName: "getStats",
    args:         tokenId !== undefined ? [tokenId] : undefined,
    query:        { enabled: tokenId !== undefined },
  });
}

// Returns current mint price in cUSD
export function useMintPrice() {
  return useReadContract({
    address:      ACTIVE_CONTRACTS.BahiaArenaCreature,
    abi:          CREATURE_ABI,
    functionName: "mintPrice",
  });
}
