/**
 * Contract addresses per network.
 * After running deploy.js, the JSON files are auto-written here.
 * For local dev, fill in the placeholders below.
 */

export const CONTRACTS = {
  alfajores: {
    BahiaArenaCreature: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    ArenaManager:       "0x0000000000000000000000000000000000000000" as `0x${string}`,
    cUSD:               "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1" as `0x${string}`,
  },
  celo: {
    BahiaArenaCreature: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    ArenaManager:       "0x0000000000000000000000000000000000000000" as `0x${string}`,
    cUSD:               "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`,
  },
} as const;

const network = (import.meta.env.VITE_NETWORK as keyof typeof CONTRACTS) ?? "alfajores";
export const ACTIVE_CONTRACTS = CONTRACTS[network] ?? CONTRACTS.alfajores;

// ─── ERC-20 minimal ABI ───────────────────────────────────────────────────────
export const ERC20_ABI = [
  { name: "balanceOf",  type: "function", stateMutability: "view",       inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "allowance",  type: "function", stateMutability: "view",       inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "approve",    type: "function", stateMutability: "nonpayable",  inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { name: "decimals",   type: "function", stateMutability: "view",       inputs: [], outputs: [{ type: "uint8" }] },
] as const;

// ─── BahiaArenaCreature ABI (subset used by frontend) ────────────────────────
export const CREATURE_ABI = [
  { name: "mintCreature",   type: "function", stateMutability: "nonpayable", inputs: [{ name: "element", type: "uint8" }, { name: "uri", type: "string" }], outputs: [{ name: "tokenId", type: "uint256" }] },
  { name: "tokensOfOwner",  type: "function", stateMutability: "view",       inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256[]" }] },
  { name: "getStats",       type: "function", stateMutability: "view",       inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "stats", type: "tuple", components: [{ name: "hp", type: "uint16" }, { name: "attack", type: "uint16" }, { name: "defense", type: "uint16" }, { name: "speed", type: "uint16" }, { name: "level", type: "uint8" }, { name: "element", type: "uint8" }, { name: "inBattle", type: "bool" }] }] },
  { name: "mintPrice",      type: "function", stateMutability: "view",       inputs: [], outputs: [{ type: "uint256" }] },
  { name: "tokenURI",       type: "function", stateMutability: "view",       inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "string" }] },
  { name: "ownerOf",        type: "function", stateMutability: "view",       inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "address" }] },
] as const;

// ─── ArenaManager ABI (subset used by frontend) ───────────────────────────────
export const ARENA_ABI = [
  { name: "createBattle",   type: "function", stateMutability: "nonpayable", inputs: [{ name: "creatureId", type: "uint256" }, { name: "stake", type: "uint256" }], outputs: [{ name: "battleId", type: "uint256" }] },
  { name: "joinBattle",     type: "function", stateMutability: "nonpayable", inputs: [{ name: "battleId", type: "uint256" }, { name: "creatureId", type: "uint256" }], outputs: [] },
  { name: "resolveBattle",  type: "function", stateMutability: "nonpayable", inputs: [{ name: "battleId", type: "uint256" }, { name: "winner", type: "address" }, { name: "sig", type: "bytes" }], outputs: [] },
  { name: "cancelBattle",   type: "function", stateMutability: "nonpayable", inputs: [{ name: "battleId", type: "uint256" }], outputs: [] },
  { name: "getBattle",      type: "function", stateMutability: "view",       inputs: [{ name: "battleId", type: "uint256" }], outputs: [{ name: "battle", type: "tuple", components: [{ name: "playerA", type: "address" }, { name: "playerB", type: "address" }, { name: "creatureA", type: "uint256" }, { name: "creatureB", type: "uint256" }, { name: "stake", type: "uint256" }, { name: "status", type: "uint8" }, { name: "winner", type: "address" }, { name: "createdAt", type: "uint64" }, { name: "startedAt", type: "uint64" }] }] },
  { name: "getOpenBattles", type: "function", stateMutability: "view",       inputs: [{ name: "fromId", type: "uint256" }, { name: "limit", type: "uint256" }], outputs: [{ name: "result", type: "tuple[]", components: [{ name: "playerA", type: "address" }, { name: "playerB", type: "address" }, { name: "creatureA", type: "uint256" }, { name: "creatureB", type: "uint256" }, { name: "stake", type: "uint256" }, { name: "status", type: "uint8" }, { name: "winner", type: "address" }, { name: "createdAt", type: "uint64" }, { name: "startedAt", type: "uint64" }] }, { name: "ids", type: "uint256[]" }] },
  { name: "nextBattleId",   type: "function", stateMutability: "view",       inputs: [], outputs: [{ type: "uint256" }] },
  { name: "minStake",       type: "function", stateMutability: "view",       inputs: [], outputs: [{ type: "uint256" }] },
  { name: "maxStake",       type: "function", stateMutability: "view",       inputs: [], outputs: [{ type: "uint256" }] },
  {
    name: "BattleCreated", type: "event",
    inputs: [{ name: "battleId", type: "uint256", indexed: true }, { name: "playerA", type: "address", indexed: true }, { name: "creatureA", type: "uint256", indexed: false }, { name: "stake", type: "uint256", indexed: false }],
  },
  {
    name: "BattleResolved", type: "event",
    inputs: [{ name: "battleId", type: "uint256", indexed: true }, { name: "winner", type: "address", indexed: true }, { name: "payout", type: "uint256", indexed: false }],
  },
] as const;
