/**
 * playerStore.ts — MVP Season (AI battles)
 *
 * Point system — scales with difficulty so hard matches matter most:
 *
 *  Difficulty | Win | Draw | Loss | Streak ×3 | Streak ×5 | Streak ×10
 *  -----------|-----|------|------|-----------|-----------|----------
 *  Easy       |   5 |    2 |    1 |        +3 |        +6 |       +12
 *  Medium     |  15 |    5 |    2 |        +8 |       +15 |       +30
 *  Hard       |  30 |   10 |    3 |       +15 |       +30 |       +60
 *  Legendary  |  60 |   20 |    5 |       +30 |       +60 |      +120
 *
 * Top 10 players share the monthly pool on the 30th of each month.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type Difficulty = "easy" | "medium" | "hard" | "legendary";

export interface DifficultyBreakdown {
  easy:      number;
  medium:    number;
  hard:      number;
  legendary: number;
}

export interface PlayerProfile {
  address:    string;
  username:   string;
  // ── X / Twitter identity (OAuth-verified) ─────────────────────────────────
  xHandle?:   string;       // @handle without @
  xAvatar?:   string;       // profile_image_url from X API
  xId?:       string;       // X user ID (for deduplication)
  xName?:     string;       // Display name from X (e.g. "Benjamin Bauer")
  // ─────────────────────────────────────────────────────────────────────────
  points:     number;
  wins:       number;
  losses:     number;
  draws:      number;
  streak:     number;
  bestStreak: number;
  lastActive: number;
  joinedAt:   number;
  // Per-difficulty win breakdown (MVP season)
  winsByDiff: DifficultyBreakdown;
}

export interface MatchRecord {
  id:               string;
  address:          string;
  result:           "win" | "loss" | "draw";
  myChampion:       string;
  opponentChampion: string;
  arena:            string;
  difficulty:       Difficulty;
  pointsEarned:     number;
  timestamp:        number;
}

// ─── Point tables ─────────────────────────────────────────────────────────────

export const DIFF_PTS: Record<Difficulty, { win: number; draw: number; loss: number }> = {
  easy:      { win:  5, draw:  2, loss: 1 },
  medium:    { win: 15, draw:  5, loss: 2 },
  hard:      { win: 30, draw: 10, loss: 3 },
  legendary: { win: 60, draw: 20, loss: 5 },
};

export const STREAK_BONUS: Record<Difficulty, { s3: number; s5: number; s10: number }> = {
  easy:      { s3:  3, s5:  6, s10:  12 },
  medium:    { s3:  8, s5: 15, s10:  30 },
  hard:      { s3: 15, s5: 30, s10:  60 },
  legendary: { s3: 30, s5: 60, s10: 120 },
};

/** Legacy export — kept for Leaderboard PointsGuide backward compat */
export const PTS = {
  win:       DIFF_PTS.medium.win,
  draw:      DIFF_PTS.medium.draw,
  loss:      DIFF_PTS.medium.loss,
  streak3:   STREAK_BONUS.medium.s3,
  streak5:   STREAK_BONUS.medium.s5,
  hardBonus: DIFF_PTS.hard.win - DIFF_PTS.medium.win,
};

// ─── Storage keys ─────────────────────────────────────────────────────────────

const PK = "bha-profiles-v2";
const MK = "bha-matches-v2";

// ─── v1 → v2 migration (runs once on module load) ────────────────────────────
// Previous schema didn't have winsByDiff. We lift all v1 profiles into v2 so
// no one loses their username / points after the schema bump.
(function migrateV1() {
  if (localStorage.getItem(PK)) return;          // v2 already exists
  const raw = localStorage.getItem("bha-profiles-v1");
  if (!raw) return;
  try {
    const old = JSON.parse(raw) as Record<string, unknown>[];
    const migrated = old.map(p => ({
      ...p,
      winsByDiff: (p.winsByDiff as DifficultyBreakdown | undefined)
        ?? { easy: 0, medium: 0, hard: 0, legendary: 0 },
    }));
    localStorage.setItem(PK, JSON.stringify(migrated));
  } catch { /* ignore corrupt data */ }
  // Also migrate matches
  const rawM = localStorage.getItem("bha-matches-v1");
  if (rawM && !localStorage.getItem(MK)) localStorage.setItem(MK, rawM);
})();

// ─── Profile CRUD ─────────────────────────────────────────────────────────────

function defaultWinsByDiff(): DifficultyBreakdown {
  return { easy: 0, medium: 0, hard: 0, legendary: 0 };
}

export function getAllProfiles(): PlayerProfile[] {
  try {
    const raw = JSON.parse(localStorage.getItem(PK) ?? "[]") as PlayerProfile[];
    // Ensure winsByDiff exists on every profile (migration guard)
    return raw.map(p => ({ ...p, winsByDiff: p.winsByDiff ?? defaultWinsByDiff() }));
  } catch {
    return [];
  }
}

export function getProfile(address: string): PlayerProfile | null {
  return getAllProfiles().find(
    p => p.address.toLowerCase() === address.toLowerCase()
  ) ?? null;
}

export function saveProfile(p: PlayerProfile): void {
  const all = getAllProfiles().filter(
    x => x.address.toLowerCase() !== p.address.toLowerCase()
  );
  localStorage.setItem(PK, JSON.stringify([...all, p]));
}

export function createProfile(
  address:  string,
  username: string,
  xHandle?: string,
): PlayerProfile {
  const now = Date.now();
  const p: PlayerProfile = {
    address,
    username:   username.trim(),
    xHandle:    xHandle?.replace(/^@/, "").trim() || undefined,
    points:     0,
    wins:       0,
    losses:     0,
    draws:      0,
    streak:     0,
    bestStreak: 0,
    lastActive: now,
    joinedAt:   now,
    winsByDiff: defaultWinsByDiff(),
  };
  saveProfile(p);
  return p;
}

/**
 * Returns true if the username is free to use.
 * Pass `excludeAddress` to allow a player to "keep" their own username
 * (so the modal doesn't falsely block them with "already taken").
 */
export function usernameAvailable(username: string, excludeAddress?: string): boolean {
  return !getAllProfiles().some(p => {
    if (excludeAddress && p.address.toLowerCase() === excludeAddress.toLowerCase()) return false;
    return p.username.toLowerCase() === username.trim().toLowerCase();
  });
}

/** Find a profile by username (any address). Used for claim/transfer flow. */
export function getProfileByUsername(username: string): PlayerProfile | null {
  return getAllProfiles().find(
    p => p.username.toLowerCase() === username.trim().toLowerCase()
  ) ?? null;
}

/**
 * Transfer an existing profile to a new wallet address.
 * Keeps all points, wins, streak, etc. — only the address changes.
 * Used when the same person connects with a different wallet and wants to
 * claim a username they created on this device previously.
 */
export function claimProfile(username: string, newAddress: string): PlayerProfile | null {
  const existing = getProfileByUsername(username);
  if (!existing) return null;
  // Remove old entry, save under new address
  const all = getAllProfiles().filter(
    p => p.address.toLowerCase() !== existing.address.toLowerCase()
  );
  const claimed: PlayerProfile = { ...existing, address: newAddress };
  localStorage.setItem(PK, JSON.stringify([...all, claimed]));
  return claimed;
}

// ─── Record a match ───────────────────────────────────────────────────────────

export function recordMatch(
  address:          string,
  result:           "win" | "loss" | "draw",
  myChampion:       string,
  opponentChampion: string,
  arena:            string,
  difficulty:       Difficulty,
): { pointsEarned: number; newProfile: PlayerProfile } | null {

  const profile = getProfile(address);
  if (!profile) return null;

  const pts    = DIFF_PTS[difficulty];
  const streak = STREAK_BONUS[difficulty];

  let pointsEarned = pts[result];
  let newStreak    = profile.streak;

  if (result === "win") {
    newStreak += 1;
    // Streak bonus — only the highest tier applies
    if (newStreak >= 10) pointsEarned += streak.s10;
    else if (newStreak >= 5) pointsEarned += streak.s5;
    else if (newStreak >= 3) pointsEarned += streak.s3;
  } else {
    newStreak = 0;
  }

  const updatedWinsByDiff: DifficultyBreakdown = { ...profile.winsByDiff };
  if (result === "win") updatedWinsByDiff[difficulty] += 1;

  const newProfile: PlayerProfile = {
    ...profile,
    points:     profile.points + pointsEarned,
    wins:       result === "win"  ? profile.wins  + 1 : profile.wins,
    losses:     result === "loss" ? profile.losses + 1 : profile.losses,
    draws:      result === "draw" ? profile.draws  + 1 : profile.draws,
    streak:     newStreak,
    bestStreak: Math.max(profile.bestStreak, newStreak),
    lastActive: Date.now(),
    winsByDiff: updatedWinsByDiff,
  };

  saveProfile(newProfile);

  const match: MatchRecord = {
    id:               `${Date.now()}-${Math.random().toString(36).slice(2)}`,
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

// ─── Match history ────────────────────────────────────────────────────────────

export function getAllMatches(): MatchRecord[] {
  try {
    return JSON.parse(localStorage.getItem(MK) ?? "[]") as MatchRecord[];
  } catch {
    return [];
  }
}

export function getPlayerMatches(address: string, limit = 5): MatchRecord[] {
  return getAllMatches()
    .filter(m => m.address.toLowerCase() === address.toLowerCase())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export function getLeaderboard(): PlayerProfile[] {
  return getAllProfiles()
    .sort((a, b) =>
      b.points - a.points ||
      b.wins   - a.wins   ||
      // Tiebreak: favor higher-difficulty wins
      (b.winsByDiff.legendary + b.winsByDiff.hard) -
      (a.winsByDiff.legendary + a.winsByDiff.hard)
    );
}

// ─── Seed data (MVP showcase) ────────────────────────────────────────────────

const SEED_KEY = "bha-seeds-v2";

export function ensureSeedData(): void {
  if (localStorage.getItem(SEED_KEY)) return;

  const seeds: PlayerProfile[] = [
    {
      address: "0xSEED01", username: "CurupiraKing",  xHandle: "curupirabtc",
      points: 1240, wins: 42, losses:  8, draws: 2, streak: 5, bestStreak: 8,
      lastActive: Date.now(), joinedAt: Date.now(),
      winsByDiff: { easy: 10, medium: 18, hard: 11, legendary: 3 },
    },
    {
      address: "0xSEED02", username: "IaraMystic",    xHandle: "iaramystic",
      points: 980,  wins: 35, losses: 10, draws: 4, streak: 3, bestStreak: 6,
      lastActive: Date.now(), joinedAt: Date.now(),
      winsByDiff: { easy: 8, medium: 16, hard: 9, legendary: 2 },
    },
    {
      address: "0xSEED03", username: "LegendSlayer",  xHandle: undefined,
      points: 820,  wins: 28, losses: 12, draws: 1, streak: 2, bestStreak: 5,
      lastActive: Date.now(), joinedAt: Date.now(),
      winsByDiff: { easy: 5, medium: 12, hard: 8, legendary: 3 },
    },
    {
      address: "0xSEED04", username: "BoitatáFire",   xHandle: "boitataweb3",
      points: 670,  wins: 24, losses: 13, draws: 3, streak: 1, bestStreak: 4,
      lastActive: Date.now(), joinedAt: Date.now(),
      winsByDiff: { easy: 7, medium: 10, hard: 6, legendary: 1 },
    },
    {
      address: "0xSEED05", username: "AnhangaShadow", xHandle: undefined,
      points: 510,  wins: 20, losses:  9, draws: 5, streak: 0, bestStreak: 4,
      lastActive: Date.now(), joinedAt: Date.now(),
      winsByDiff: { easy: 6, medium: 9, hard: 5, legendary: 0 },
    },
    {
      address: "0xSEED06", username: "TupãStorm",     xHandle: "tupastorm",
      points: 380,  wins: 16, losses: 11, draws: 2, streak: 2, bestStreak: 3,
      lastActive: Date.now(), joinedAt: Date.now(),
      winsByDiff: { easy: 5, medium: 7, hard: 4, legendary: 0 },
    },
    {
      address: "0xSEED07", username: "web3warrior",   xHandle: undefined,
      points: 270,  wins: 12, losses: 10, draws: 1, streak: 0, bestStreak: 3,
      lastActive: Date.now(), joinedAt: Date.now(),
      winsByDiff: { easy: 4, medium: 6, hard: 2, legendary: 0 },
    },
    {
      address: "0xSEED08", username: "celonaut",      xHandle: "celonaut",
      points: 175,  wins:  9, losses:  9, draws: 2, streak: 0, bestStreak: 2,
      lastActive: Date.now(), joinedAt: Date.now(),
      winsByDiff: { easy: 3, medium: 5, hard: 1, legendary: 0 },
    },
    {
      address: "0xSEED09", username: "chainbrawler",  xHandle: undefined,
      points: 95,   wins:  6, losses:  8, draws: 3, streak: 0, bestStreak: 2,
      lastActive: Date.now(), joinedAt: Date.now(),
      winsByDiff: { easy: 3, medium: 3, hard: 0, legendary: 0 },
    },
    {
      address: "0xSEED10", username: "bahiadegen",    xHandle: "bahiadegen",
      points: 45,   wins:  3, losses: 10, draws: 1, streak: 0, bestStreak: 1,
      lastActive: Date.now(), joinedAt: Date.now(),
      winsByDiff: { easy: 2, medium: 1, hard: 0, legendary: 0 },
    },
  ];

  const existing = getAllProfiles();
  localStorage.setItem(PK,       JSON.stringify([...existing, ...seeds]));
  localStorage.setItem(SEED_KEY, "1");
}

// ─── Sync X identity into a profile ──────────────────────────────────────────

export interface XIdentity {
  id:                string;
  username:          string;
  name:              string;
  profile_image_url?: string;
}

/**
 * Writes X OAuth data into the player profile.
 * Returns the updated profile, or null if the profile doesn't exist yet.
 */
export function syncXToProfile(address: string, x: XIdentity): PlayerProfile | null {
  const profile = getProfile(address);
  if (!profile) return null;

  const updated: PlayerProfile = {
    ...profile,
    xHandle: x.username,
    xAvatar: x.profile_image_url
      ? x.profile_image_url.replace("_normal", "_bigger")
      : profile.xAvatar,
    xId:    x.id,
    xName:  x.name,
  };
  saveProfile(updated);
  return updated;
}
