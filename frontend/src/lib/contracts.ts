// ─── Deployed Addresses ───────────────────────────────────────────────────────
export const CONTRACTS = {
  alfajores: {
    BahiaChampion: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    ArenaManager:  "0x0000000000000000000000000000000000000000" as `0x${string}`,
    usdt:          "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1" as `0x${string}`, // cUSD testnet
    aavePool:      "0x0000000000000000000000000000000000000000" as `0x${string}`, // not on testnet
    aUsdt:         "0x0000000000000000000000000000000000000000" as `0x${string}`,
  },
  celo: {
    BahiaChampion: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    ArenaManager:  "0x43797606e23188B12F8c2DCd22B3A7a5E25f0785" as `0x${string}`, // v6 deployed 2026-06-08
    usdt:          "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as `0x${string}`, // USDT mainnet (6 dec)
    aavePool:      "0x3E59A31363E2ad014dcbc521c4a0d5757d9f3402" as `0x${string}`, // Aave V3 Pool on Celo
    aUsdt:         "0xdee98402a302e4d707fb9bf2bac66faeec31e8df" as `0x${string}`, // aUSDT on Celo Aave V3
  },
} as const;

// Default to "celo" (mainnet) — set VITE_NETWORK=alfajores only for testnet builds
const network = (import.meta.env.VITE_NETWORK as keyof typeof CONTRACTS) ?? "celo";
export const ACTIVE_CONTRACTS = CONTRACTS[network] ?? CONTRACTS.celo;

// ─── Legacy v5 contract (for migration detection only) ───────────────────────
export const ARENA_V5_ADDRESS = "0x3e625cdF5E7A0d7Fb7eA4424323936d27C19ea58" as `0x${string}`;

export const ARENA_V5_ABI = [
  { name: "deposits",  type: "function", stateMutability: "view",       inputs: [{ name: "player", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "withdraw",  type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
] as const;

// ─── Tier vault — receives 0.25/0.50/0.75 USDT direct transfers (tiers 1–3) ──
// This is the ArenaManager treasury wallet.
export const TIER_VAULT = "0x23bc4caab6a4d939c065c92022cd49d2b2bd5b36" as `0x${string}`;

// ─── GoodDollar Constants ─────────────────────────────────────────────────────
export const GOODDOLLAR_IDENTITY = "0xC361A6E67822a0EDc17D899227dd9FC50BD62F42" as `0x${string}`;
export const GOODDOLLAR_TOKEN    = "0x62B8B11039FcfE5aB0C56E502b1C372A3d462a4D" as `0x${string}`;

// ─── ERC-20 ABI ───────────────────────────────────────────────────────────────
export const ERC20_ABI = [
  { name: "balanceOf",  type: "function", stateMutability: "view",       inputs: [{ name: "owner",   type: "address" }],                                                outputs: [{ type: "uint256" }] },
  { name: "allowance",  type: "function", stateMutability: "view",       inputs: [{ name: "owner",   type: "address" }, { name: "spender", type: "address" }],          outputs: [{ type: "uint256" }] },
  { name: "approve",    type: "function", stateMutability: "nonpayable",  inputs: [{ name: "spender", type: "address" }, { name: "amount",  type: "uint256" }],          outputs: [{ type: "bool"    }] },
  { name: "transfer",   type: "function", stateMutability: "nonpayable",  inputs: [{ name: "to",      type: "address" }, { name: "amount",  type: "uint256" }],          outputs: [{ type: "bool"    }] },
  { name: "decimals",   type: "function", stateMutability: "view",       inputs: [],                                                                                    outputs: [{ type: "uint8"   }] },
  { name: "symbol",     type: "function", stateMutability: "view",       inputs: [],                                                                                    outputs: [{ type: "string"  }] },
] as const;

// ─── BahiaChampion ABI ────────────────────────────────────────────────────────
export const CHAMPION_ABI = [
  { name: "hasChampionSet", type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "bool" }] },
  { name: "balanceOf",      type: "function", stateMutability: "view", inputs: [{ name: "owner",  type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "locked",         type: "function", stateMutability: "pure", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;

// ─── Battle struct tuple (shared across read functions) ───────────────────────
const BATTLE_COMPONENTS = [
  { name: "playerA",   type: "address" },
  { name: "playerB",   type: "address" },
  { name: "classA",    type: "uint8"   },
  { name: "classB",    type: "uint8"   },
  { name: "status",    type: "uint8"   },   // 0=OPEN 1=ACTIVE 2=RESOLVED 3=CANCELLED
  { name: "winner",    type: "address" },
  { name: "createdAt", type: "uint64"  },
  { name: "startedAt", type: "uint64"  },
] as const;

// ─── ArenaManager ABI (v6 — 0x43797606e23188B12F8c2DCd22B3A7a5E25f0785) ──────
export const ARENA_ABI = [
  // ── Tier + game constants ─────────────────────────────────────────────────
  { name: "TIER1_AMOUNT",       type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "TIER2_AMOUNT",       type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "TIER3_AMOUNT",       type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "TIER4_AMOUNT",       type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "WIN_POINTS_BASE",    type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "CHECKIN_POINTS",     type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "CHECKIN_COOLDOWN",   type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },

  // ── State reads ──────────────────────────────────────────────────────────
  { name: "deposits",           type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "depositTier",        type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "uint8"   }] },
  { name: "hasDeposit",         type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "bool"    }] },
  { name: "rewardEligible",     type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "bool"    }] },
  { name: "winPointsForPlayer", type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "totalDeposits",      type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "totalYield",         type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "totalPoolBalance",   type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "currentMonth",       type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "monthStart",         type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "secondsToMonthEnd",  type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "challengeCount",     type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "rankingPoints",      type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "wins",               type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "losses",             type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "lastCheckIn",        type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "monthlyPoints",      type: "function", stateMutability: "view", inputs: [{ name: "month", type: "uint256" }, { name: "player", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "playerPoints",       type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "paused",             type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { name: "challenges", type: "function", stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ name: "c", type: "tuple", components: [
      { name: "challenger",      type: "address" },
      { name: "opponent",        type: "address" },
      { name: "champChallenger", type: "string"  },
      { name: "champOpponent",   type: "string"  },
      { name: "accepted",        type: "bool"    },
      { name: "resolved",        type: "bool"    },
      { name: "createdAt",       type: "uint256" },
    ]}],
  },
  {
    name: "getTopPlayers", type: "function", stateMutability: "view",
    inputs: [{ name: "n", type: "uint256" }],
    outputs: [
      { name: "topAddrs", type: "address[]" },
      { name: "topPts",   type: "uint256[]" },
    ],
  },
  { name: "monthSnapshots", type: "function", stateMutability: "view",
    inputs: [{ name: "month", type: "uint256" }],
    outputs: [{ name: "snap", type: "tuple", components: [
      { name: "totalPool",     type: "uint256" },
      { name: "totalPrincipal",type: "uint256" },
      { name: "yield",         type: "uint256" },
      { name: "toPlayers",     type: "uint256" },
      { name: "toTreasury",    type: "uint256" },
      { name: "activePlayers", type: "uint256" },
      { name: "closed",        type: "bool"    },
    ]}],
  },

  // ── Writes ───────────────────────────────────────────────────────────────
  { name: "deposit",  type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "tierAmount", type: "uint256" }], outputs: [] },
  { name: "withdraw", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "adminCredit", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "player", type: "address" }, { name: "tierAmount", type: "uint256" }], outputs: [] },
  { name: "dailyCheckIn", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "recordBattle", type: "function", stateMutability: "nonpayable",
    inputs: [
      { name: "winner",      type: "address" },
      { name: "loser",       type: "address" },
      { name: "champWinner", type: "string"  },
      { name: "champLoser",  type: "string"  },
    ], outputs: [] },
  { name: "recordMatch", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "winner", type: "address" }, { name: "loser", type: "address" }], outputs: [] },
  { name: "createChallenge", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "opponent", type: "address" }, { name: "myChamp", type: "string" }], outputs: [] },
  { name: "acceptChallenge", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "challengeId", type: "uint256" }, { name: "myChamp", type: "string" }], outputs: [] },
  { name: "resolveChallenge", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "challengeId", type: "uint256" }, { name: "winner", type: "address" }], outputs: [] },
  { name: "distributeMonthlyRewards", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "topPlayers", type: "address[]" }, { name: "basisPoints", type: "uint256[]" }], outputs: [] },

  // ── Admin ─────────────────────────────────────────────────────────────────
  { name: "emergencyWithdrawFromAave", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "pause",   type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "unpause", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },

  // ── Events ────────────────────────────────────────────────────────────────
  { name: "Deposited",    type: "event", inputs: [{ name: "player", type: "address", indexed: true }, { name: "totalAmount", type: "uint256" }, { name: "tier", type: "uint8" }] },
  { name: "TierUpgraded", type: "event", inputs: [{ name: "player", type: "address", indexed: true }, { name: "oldTier", type: "uint8" }, { name: "newTier", type: "uint8" }, { name: "topUp", type: "uint256" }] },
  { name: "Withdrawn",    type: "event", inputs: [{ name: "player", type: "address", indexed: true }, { name: "amount", type: "uint256" }] },
  { name: "CheckedIn",    type: "event", inputs: [{ name: "player", type: "address", indexed: true }, { name: "timestamp", type: "uint256" }] },
  { name: "BattleRecorded", type: "event", inputs: [
    { name: "winner", type: "address", indexed: true }, { name: "loser", type: "address", indexed: true },
    { name: "champWinner", type: "string" }, { name: "champLoser", type: "string" }, { name: "timestamp", type: "uint256" },
  ]},
  { name: "ChallengeCreated",  type: "event", inputs: [{ name: "id", type: "uint256", indexed: true }, { name: "challenger", type: "address", indexed: true }, { name: "opponent", type: "address", indexed: true }] },
  { name: "ChallengeAccepted", type: "event", inputs: [{ name: "id", type: "uint256", indexed: true }, { name: "opponent", type: "address", indexed: true }] },
  { name: "ChallengeResolved", type: "event", inputs: [{ name: "id", type: "uint256", indexed: true }, { name: "winner",   type: "address", indexed: true }] },
  { name: "PointsAwarded",     type: "event", inputs: [{ name: "player", type: "address", indexed: true }, { name: "pts", type: "uint256" }, { name: "isWinner", type: "bool" }] },
  { name: "RewardsDistributed",type: "event", inputs: [{ name: "totalYield", type: "uint256" }, { name: "toPlayers", type: "uint256" }, { name: "toTreasury", type: "uint256" }] },
  { name: "MonthClosed",       type: "event", inputs: [{ name: "month", type: "uint256", indexed: true }, { name: "yield", type: "uint256" }, { name: "toPlayers", type: "uint256" }, { name: "toTreasury", type: "uint256" }] },
  { name: "PlayerRewarded",    type: "event", inputs: [{ name: "month", type: "uint256", indexed: true }, { name: "player", type: "address", indexed: true }, { name: "amount", type: "uint256" }, { name: "rank", type: "uint256" }] },
] as const;
