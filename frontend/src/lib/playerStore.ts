export interface PlayerProfile {
  address: string;
  username: string;
  xHandle?: string;        // without @
  points: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  bestStreak: number;
  lastActive: number;
  joinedAt: number;
}

export interface MatchRecord {
  id: string;
  address: string;
  result: "win" | "loss" | "draw";
  myChampion: string;
  opponentChampion: string;
  arena: string;
  difficulty: string;
  pointsEarned: number;
  timestamp: number;
}

export const PTS = { win: 10, draw: 5, loss: 2, streak3: 3, streak5: 8, hardBonus: 3 };

const PK = "bha-profiles-v1";
const MK = "bha-matches-v1";

export function getAllProfiles(): PlayerProfile[] {
  try {
    return JSON.parse(localStorage.getItem(PK) ?? "[]") as PlayerProfile[];
  } catch {
    return [];
  }
}

export function getProfile(address: string): PlayerProfile | null {
  return getAllProfiles().find(p => p.address.toLowerCase() === address.toLowerCase()) ?? null;
}

export function saveProfile(p: PlayerProfile): void {
  const all = getAllProfiles().filter(x => x.address.toLowerCase() !== p.address.toLowerCase());
  localStorage.setItem(PK, JSON.stringify([...all, p]));
}

export function createProfile(address: string, username: string, xHandle?: string): PlayerProfile {
  const now = Date.now();
  const p: PlayerProfile = {
    address,
    username: username.trim(),
    xHandle: xHandle?.replace(/^@/, "").trim() || undefined,
    points: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    streak: 0,
    bestStreak: 0,
    lastActive: now,
    joinedAt: now,
  };
  saveProfile(p);
  return p;
}

export function usernameAvailable(username: string): boolean {
  return !getAllProfiles().some(p => p.username.toLowerCase() === username.trim().toLowerCase());
}

export function recordMatch(
  address: string,
  result: "win" | "loss" | "draw",
  myChampion: string,
  opponentChampion: string,
  arena: string,
  difficulty: string,
): { pointsEarned: number; newProfile: PlayerProfile } | null {
  const profile = getProfile(address);
  if (!profile) return null;

  let pointsEarned = PTS[result];
  let newStreak = profile.streak;

  if (result === "win") {
    newStreak = profile.streak + 1;
    if (newStreak >= 5) {
      pointsEarned += PTS.streak5;
    } else if (newStreak >= 3) {
      pointsEarned += PTS.streak3;
    }
    if (difficulty === "hard") {
      pointsEarned += PTS.hardBonus;
    }
  } else {
    newStreak = 0;
  }

  const newProfile: PlayerProfile = {
    ...profile,
    points: profile.points + pointsEarned,
    wins: result === "win" ? profile.wins + 1 : profile.wins,
    losses: result === "loss" ? profile.losses + 1 : profile.losses,
    draws: result === "draw" ? profile.draws + 1 : profile.draws,
    streak: newStreak,
    bestStreak: Math.max(profile.bestStreak, newStreak),
    lastActive: Date.now(),
  };

  saveProfile(newProfile);

  const match: MatchRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    address,
    result,
    myChampion,
    opponentChampion,
    arena,
    difficulty,
    pointsEarned,
    timestamp: Date.now(),
  };

  const matches = getAllMatches();
  localStorage.setItem(MK, JSON.stringify([...matches, match]));

  return { pointsEarned, newProfile };
}

export function getAllMatches(): MatchRecord[] {
  try {
    return JSON.parse(localStorage.getItem(MK) ?? "[]") as MatchRecord[];
  } catch {
    return [];
  }
}

export function getPlayerMatches(address: string, limit = 5): MatchRecord[] {
  const all = getAllMatches();
  return all
    .filter(m => m.address.toLowerCase() === address.toLowerCase())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export function getLeaderboard(): PlayerProfile[] {
  return getAllProfiles().sort((a, b) => b.points - a.points || b.wins - a.wins);
}

const SEED_KEY = "bha-seeds-v1";

export function ensureSeedData(): void {
  const all = getAllProfiles();
  if (all.some(p => p.address.startsWith("0xSEED"))) return;

  const seeds: PlayerProfile[] = [
    { address: "0xSEED01", username: "CurupiraKing",  xHandle: "curupirabtc",  points: 247, wins: 24, losses: 8,  draws: 2, streak: 3, bestStreak: 7, lastActive: Date.now(), joinedAt: Date.now() },
    { address: "0xSEED02", username: "IaraMystic",    xHandle: "iaramystic",   points: 198, wins: 19, losses: 9,  draws: 4, streak: 1, bestStreak: 5, lastActive: Date.now(), joinedAt: Date.now() },
    { address: "0xSEED03", username: "BoltMaster",    xHandle: undefined,      points: 174, wins: 17, losses: 11, draws: 1, streak: 0, bestStreak: 4, lastActive: Date.now(), joinedAt: Date.now() },
    { address: "0xSEED04", username: "BoitatáFire",   xHandle: "boitataweb3",  points: 143, wins: 14, losses: 12, draws: 3, streak: 2, bestStreak: 3, lastActive: Date.now(), joinedAt: Date.now() },
    { address: "0xSEED05", username: "AnhangaShadow", xHandle: undefined,      points: 121, wins: 11, losses: 8,  draws: 5, streak: 0, bestStreak: 4, lastActive: Date.now(), joinedAt: Date.now() },
    { address: "0xSEED06", username: "TupãStorm",     xHandle: "tupastorm",    points: 98,  wins: 9,  losses: 10, draws: 2, streak: 1, bestStreak: 2, lastActive: Date.now(), joinedAt: Date.now() },
    { address: "0xSEED07", username: "web3warrior",   xHandle: undefined,      points: 76,  wins: 7,  losses: 9,  draws: 1, streak: 0, bestStreak: 2, lastActive: Date.now(), joinedAt: Date.now() },
    { address: "0xSEED08", username: "celonaut",      xHandle: "celonaut",     points: 54,  wins: 5,  losses: 8,  draws: 2, streak: 0, bestStreak: 1, lastActive: Date.now(), joinedAt: Date.now() },
    { address: "0xSEED09", username: "chainbrawler",  xHandle: undefined,      points: 38,  wins: 3,  losses: 7,  draws: 3, streak: 0, bestStreak: 1, lastActive: Date.now(), joinedAt: Date.now() },
    { address: "0xSEED10", username: "bahiadegen",    xHandle: "bahiadegen",   points: 22,  wins: 2,  losses: 9,  draws: 1, streak: 0, bestStreak: 1, lastActive: Date.now(), joinedAt: Date.now() },
  ];

  const existing = getAllProfiles();
  localStorage.setItem(PK, JSON.stringify([...existing, ...seeds]));
}
