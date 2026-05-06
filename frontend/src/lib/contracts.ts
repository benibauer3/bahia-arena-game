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
    ArenaManager:  "0x0000000000000000000000000000000000000000" as `0x${string}`,
    usdt:          "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as `0x${string}`, // USDT mainnet (6 dec)
    aavePool:      "0x3E59A31363E2aD014A3A97703feB7fF8bD3b5b0c" as `0x${string}`, // Aave V3 Pool on Celo
    aUsdt:         "0x4d4b4A13B5A57a2bAF3A89d00B78f6c58c2E2B35" as `0x${string}`, // aUSDT on Celo Aave V3
  },
} as const;

const network = (import.meta.env.VITE_NETWORK as keyof typeof CONTRACTS) ?? "alfajores";
export const ACTIVE_CONTRACTS = CONTRACTS[network] ?? CONTRACTS.alfajores;

// ─── GoodDollar Constants ─────────────────────────────────────────────────────
export const GOODDOLLAR_IDENTITY = "0xC361A6E67822a0EDc17D899227dd9FC50BD62F42" as `0x${string}`;
export const GOODDOLLAR_TOKEN    = "0x62B8B11039FcfE5aB0C56E502b1C372A3d462a4D" as `0x${string}`;

// ─── ERC-20 ABI ───────────────────────────────────────────────────────────────
export const ERC20_ABI = [
  { name: "balanceOf",  type: "function", stateMutability: "view",       inputs: [{ name: "owner",   type: "address" }],                                                outputs: [{ type: "uint256" }] },
  { name: "allowance",  type: "function", stateMutability: "view",       inputs: [{ name: "owner",   type: "address" }, { name: "spender", type: "address" }],          outputs: [{ type: "uint256" }] },
  { name: "approve",    type: "function", stateMutability: "nonpayable",  inputs: [{ name: "spender", type: "address" }, { name: "amount",  type: "uint256" }],          outputs: [{ type: "bool"    }] },
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

// ─── ArenaManager ABI (v5 — dailyCheckIn + challenges + recordBattle + Pausable) ─
export const ARENA_ABI = [
  // ── Constants / immutable reads ──────────────────────────────────────────
  { name: "ENTRY_FEE",          type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "WIN_POINTS",         type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "LOSS_POINTS",        type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "CHECKIN_POINTS",     type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "CHECKIN_COOLDOWN",   type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },

  // ── State reads ──────────────────────────────────────────────────────────
  { name: "deposits",           type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "totalDeposits",      type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "totalPoolBalance",   type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "totalYield",         type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "hasDeposit",         type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "bool" }] },
  { name: "currentMonth",       type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "monthStart",         type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "secondsToMonthEnd",  type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "yieldToPlayersBps",  type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "topRankCount",       type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "nextBattleId",       type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "challengeCount",     type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "playerActiveBattle", type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "rankingPoints",      type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "wins",               type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "losses",             type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "lastCheckIn",        type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "monthlyPoints",      type: "function", stateMutability: "view", inputs: [{ name: "month", type: "uint256" }, { name: "player", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "playerPoints",       type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "monthPlayers",       type: "function", stateMutability: "view", inputs: [{ name: "month", type: "uint256" }], outputs: [{ type: "address[]" }] },
  { name: "paused",             type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { name: "monthSnapshots",     type: "function", stateMutability: "view",
    inputs: [{ name: "month", type: "uint256" }],
    outputs: [{ name: "snap", type: "tuple", components: [
      { name: "totalPool",      type: "uint256" },
      { name: "totalPrincipal", type: "uint256" },
      { name: "yield",          type: "uint256" },
      { name: "toPlayers",      type: "uint256" },
      { name: "toTreasury",     type: "uint256" },
      { name: "activePlayers",  type: "uint256" },
      { name: "closed",         type: "bool"    },
    ]}],
  },
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

  // ── Writes ───────────────────────────────────────────────────────────────
  // Deposit / Withdraw
  { name: "deposit",            type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "withdraw",           type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },

  // Daily check-in
  { name: "dailyCheckIn",       type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },

  // Named-champion battle recording (keeper/owner)
  {
    name: "recordBattle",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "winner",     type: "address" },
      { name: "loser",      type: "address" },
      { name: "champWinner", type: "string" },
      { name: "champLoser",  type: "string" },
    ],
    outputs: [],
  },

  // Named-champion PvP challenges
  { name: "createChallenge",    type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "opponent", type: "address" }, { name: "myChamp", type: "string" }],
    outputs: [] },
  { name: "acceptChallenge",    type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "challengeId", type: "uint256" }, { name: "myChamp", type: "string" }],
    outputs: [] },
  { name: "resolveChallenge",   type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "challengeId", type: "uint256" }, { name: "winner", type: "address" }],
    outputs: [] },

  // Classic on-chain battles
  { name: "createBattle",       type: "function", stateMutability: "nonpayable", inputs: [{ name: "class_", type: "uint8" }], outputs: [{ name: "battleId", type: "uint256" }] },
  { name: "joinBattle",         type: "function", stateMutability: "nonpayable", inputs: [{ name: "battleId", type: "uint256" }, { name: "class_", type: "uint8" }], outputs: [] },
  { name: "resolveOnChain",     type: "function", stateMutability: "nonpayable", inputs: [{ name: "battleId", type: "uint256" }], outputs: [] },
  { name: "resolveBattle",      type: "function", stateMutability: "nonpayable", inputs: [{ name: "battleId", type: "uint256" }, { name: "winner", type: "address" }, { name: "sig", type: "bytes" }], outputs: [] },
  { name: "cancelBattle",       type: "function", stateMutability: "nonpayable", inputs: [{ name: "battleId", type: "uint256" }], outputs: [] },

  // Legacy (no champion strings)
  { name: "recordMatch",        type: "function", stateMutability: "nonpayable", inputs: [{ name: "winner", type: "address" }, { name: "loser", type: "address" }], outputs: [] },

  // Monthly rewards
  {
    name: "distributeMonthlyRewards",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "topPlayers",  type: "address[]" },
      { name: "basisPoints", type: "uint256[]" },
    ],
    outputs: [],
  },

  // Admin
  { name: "emergencyWithdrawFromAave", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "pause",                     type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "unpause",                   type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },

  // ── Views ─────────────────────────────────────────────────────────────────
  {
    name: "getBattle", type: "function", stateMutability: "view",
    inputs: [{ name: "battleId", type: "uint256" }],
    outputs: [{ name: "battle", type: "tuple", components: BATTLE_COMPONENTS }],
  },
  {
    name: "getOpenBattles", type: "function", stateMutability: "view",
    inputs: [{ name: "fromId", type: "uint256" }, { name: "limit", type: "uint256" }],
    outputs: [
      { name: "result", type: "tuple[]", components: BATTLE_COMPONENTS },
      { name: "ids",    type: "uint256[]" },
    ],
  },
  {
    name: "getTopPlayers", type: "function", stateMutability: "view",
    inputs: [{ name: "n", type: "uint256" }],
    outputs: [
      { name: "topAddrs", type: "address[]" },
      { name: "topPts",   type: "uint256[]" },
    ],
  },
  {
    name: "simulateBattle", type: "function", stateMutability: "pure",
    inputs: [
      { name: "classA",  type: "uint8"   }, { name: "playerA", type: "address" },
      { name: "classB",  type: "uint8"   }, { name: "playerB", type: "address" },
      { name: "seed",    type: "uint256" },
    ],
    outputs: [{ name: "winner", type: "uint8" }, { name: "turns", type: "uint8" }],
  },
  {
    name: "getChampionStats", type: "function", stateMutability: "pure",
    inputs: [{ name: "class_", type: "uint8" }],
    outputs: [{ name: "stats", type: "tuple", components: [
      { name: "maxHp",             type: "uint16" }, { name: "attack",           type: "uint16" },
      { name: "defense",           type: "uint16" }, { name: "speed",            type: "uint16" },
      { name: "critBps",           type: "uint16" }, { name: "dodgeBps",         type: "uint16" },
      { name: "abilityDamage",     type: "uint16" }, { name: "abilityHeal",      type: "uint16" },
      { name: "dotDamagePerTurn",  type: "uint16" }, { name: "dotDurationTurns", type: "uint8"  },
      { name: "stunDurationTurns", type: "uint8"  }, { name: "defenseBuffBps",   type: "uint16" },
    ]}],
  },

  // ── Events ────────────────────────────────────────────────────────────────
  { name: "Deposited",         type: "event", inputs: [{ name: "player",     type: "address", indexed: true }, { name: "amount",      type: "uint256" }] },
  { name: "Withdrawn",         type: "event", inputs: [{ name: "player",     type: "address", indexed: true }, { name: "amount",      type: "uint256" }] },
  { name: "CheckedIn",         type: "event", inputs: [{ name: "player",     type: "address", indexed: true }, { name: "timestamp",   type: "uint256" }] },
  { name: "BattleRecorded",    type: "event", inputs: [
    { name: "winner",      type: "address", indexed: true },
    { name: "loser",       type: "address", indexed: true },
    { name: "champWinner", type: "string" },
    { name: "champLoser",  type: "string" },
    { name: "timestamp",   type: "uint256" },
  ]},
  { name: "ChallengeCreated",  type: "event", inputs: [{ name: "id", type: "uint256", indexed: true }, { name: "challenger", type: "address", indexed: true }, { name: "opponent", type: "address", indexed: true }] },
  { name: "ChallengeAccepted", type: "event", inputs: [{ name: "id", type: "uint256", indexed: true }, { name: "opponent",   type: "address", indexed: true }] },
  { name: "ChallengeResolved", type: "event", inputs: [{ name: "id", type: "uint256", indexed: true }, { name: "winner",     type: "address", indexed: true }] },
  { name: "BattleCreated",     type: "event", inputs: [{ name: "battleId", type: "uint256", indexed: true }, { name: "playerA", type: "address", indexed: true }, { name: "classA", type: "uint8" }] },
  { name: "BattleResolved",    type: "event", inputs: [{ name: "battleId", type: "uint256", indexed: true }, { name: "winner",  type: "address", indexed: true }, { name: "onChain", type: "bool" }] },
  { name: "MatchRecorded",     type: "event", inputs: [{ name: "winner",  type: "address", indexed: true }, { name: "loser",   type: "address", indexed: true }, { name: "winnerPts", type: "uint256" }, { name: "loserPts", type: "uint256" }] },
  { name: "PointsAwarded",     type: "event", inputs: [{ name: "player",  type: "address", indexed: true }, { name: "pts", type: "uint256" }, { name: "isWinner", type: "bool" }] },
  { name: "RewardsDistributed",type: "event", inputs: [{ name: "totalYield", type: "uint256" }, { name: "toPlayers", type: "uint256" }, { name: "toTreasury", type: "uint256" }] },
  { name: "MonthClosed",       type: "event", inputs: [{ name: "month",   type: "uint256", indexed: true }, { name: "yield",     type: "uint256" }, { name: "toPlayers", type: "uint256" }, { name: "toTreasury", type: "uint256" }] },
  { name: "PlayerRewarded",    type: "event", inputs: [{ name: "month",   type: "uint256", indexed: true }, { name: "player",    type: "address", indexed: true }, { name: "amount", type: "uint256" }, { name: "rank", type: "uint256" }] },
] as const;
