import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  getProfile,
  createProfile,
  recordMatch,
  usernameAvailable,
  type PlayerProfile,
  type Difficulty,
} from "@/lib/playerStore";

export function usePlayerProfile() {
  const { address, isConnected, status } = useAccount();

  // Load profile synchronously from localStorage when address is available.
  // Using a lazy initializer means no flicker — profile is ready on first render
  // IF the address was already in localStorage (reconnect case).
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  const refresh = useCallback(() => {
    setProfile(address ? (getProfile(address) ?? null) : null);
  }, [address]);

  // Re-read from storage whenever address changes (login / disconnect)
  useEffect(() => { refresh(); }, [refresh]);

  // ── Derived state ────────────────────────────────────────────────────────────
  // Only mark as "needsSetup" when wagmi has fully resolved its reconnection.
  // During 'connecting' or 'reconnecting' we don't yet know if a profile exists —
  // avoid flashing the modal for users who already have a profile.
  const isSettled    = status === "connected" || status === "disconnected";
  const hasProfile   = !!profile;
  const needsSetup   = isSettled && isConnected && !!address && !hasProfile;

  // ── Actions ──────────────────────────────────────────────────────────────────

  const setupProfile = useCallback((username: string, xHandle?: string) => {
    if (!address) throw new Error("No wallet connected");
    const p = createProfile(address, username, xHandle);
    setProfile(p);
    return p;
  }, [address]);

  const addMatchResult = useCallback((
    result:           "win" | "loss" | "draw",
    myChampion:       string,
    opponentChampion: string,
    arena:            string,
    difficulty:       Difficulty,
  ) => {
    if (!address) return null;
    const res = recordMatch(address, result, myChampion, opponentChampion, arena, difficulty);
    if (res) setProfile(res.newProfile);
    return res;
  }, [address]);

  // Pass the current address so the user's own name is never "taken" for them
  const checkUsername = useCallback(
    (username: string) => usernameAvailable(username, address),
    [address],
  );

  return {
    profile,
    hasProfile,
    isConnected,
    status,
    needsSetup,
    setupProfile,
    addMatchResult,
    checkUsername,
    refresh,
  };
}
