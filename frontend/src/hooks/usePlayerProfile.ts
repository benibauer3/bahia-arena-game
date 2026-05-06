import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { getProfile, createProfile, recordMatch, usernameAvailable, type PlayerProfile, type Difficulty } from "@/lib/playerStore";

export function usePlayerProfile() {
  const { address, isConnected } = useAccount();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  const refresh = useCallback(() => {
    setProfile(address ? (getProfile(address) ?? null) : null);
  }, [address]);

  useEffect(() => { refresh(); }, [refresh]);

  const setupProfile = useCallback((username: string, xHandle?: string) => {
    if (!address) throw new Error("No wallet");
    const p = createProfile(address, username, xHandle);
    setProfile(p);
    return p;
  }, [address]);

  const addMatchResult = useCallback((
    result: "win" | "loss" | "draw",
    myChampion: string,
    opponentChampion: string,
    arena: string,
    difficulty: Difficulty,
  ) => {
    if (!address) return null;
    const res = recordMatch(address, result, myChampion, opponentChampion, arena, difficulty);
    if (res) setProfile(res.newProfile);
    return res;
  }, [address]);

  return {
    profile,
    hasProfile: !!profile,
    isConnected,
    needsSetup: isConnected && !!address && !profile,
    setupProfile,
    addMatchResult,
    checkUsername: usernameAvailable,
    refresh,
  };
}
