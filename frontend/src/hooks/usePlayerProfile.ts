import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  getProfile,
  createProfile,
  recordMatch,
  usernameAvailable,
  syncXToProfile,
  claimProfile,
  type PlayerProfile,
  type Difficulty,
  type XIdentity,
} from "@/lib/playerStore";

export function usePlayerProfile() {
  const { address, isConnected, status } = useAccount();

  /**
   * Load profile synchronously on the very first render using a lazy initializer.
   *
   * Why this matters:
   *  - wagmi persists wallet connections across page reloads.
   *  - On mount, `address` is already available from wagmi's zustand store.
   *  - `useState(() => ...)` runs synchronously before the first paint.
   *  - Result: returning users have `hasProfile = true` on frame 1, so the
   *    "create profile" modal is NEVER shown to them — not even for one frame.
   *
   * Without this (plain `useState(null)`), the profile was always null on the
   * first render, needsSetup was briefly true, and the modal flashed open.
   * Users who typed their username quickly got "already taken" because the
   * profile existed in localStorage but hadn't been loaded into state yet.
   */
  const [profile, setProfile] = useState<PlayerProfile | null>(
    () => address ? (getProfile(address) ?? null) : null,
  );

  /**
   * profileSettled: true once we have definitively checked localStorage for
   * the current address.  Starts true if the lazy initializer found an address
   * (reconnect case). Becomes true after the first effect run for new connections
   * where address wasn't available on mount (first-ever wallet connect).
   */
  const [profileSettled, setProfileSettled] = useState<boolean>(() => !!address);

  const refresh = useCallback(() => {
    setProfile(address ? (getProfile(address) ?? null) : null);
    setProfileSettled(true);
  }, [address]);

  // Re-read from storage whenever address changes (login / wallet switch / disconnect)
  useEffect(() => { refresh(); }, [refresh]);

  // ── Derived state ────────────────────────────────────────────────────────────
  // Only mark as "needsSetup" when:
  //  1. wagmi has fully resolved its reconnection (status = connected)
  //  2. We have confirmed the profile check is done (profileSettled)
  //  3. No profile was found for the current address
  const isSettled    = status === "connected" || status === "disconnected";
  const hasProfile   = !!profile;
  const needsSetup   = isSettled && profileSettled && isConnected && !!address && !hasProfile;

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

  /**
   * Transfer an existing profile (any address) to the current wallet.
   * Used when the user's preferred username was saved under a different address
   * on this device (e.g. after switching wallets or a timing bug during signup).
   * All points / stats are preserved.
   */
  const claimExistingProfile = useCallback((username: string) => {
    if (!address) throw new Error("No wallet connected");
    const claimed = claimProfile(username, address);
    if (claimed) setProfile(claimed);
    return claimed;
  }, [address]);

  /**
   * Syncs verified X OAuth data (handle, avatar, name) into the player profile.
   * Safe to call even when X reconnects — only updates X fields, never points.
   */
  const syncXProfile = useCallback((x: XIdentity) => {
    if (!address) return;
    const updated = syncXToProfile(address, x);
    if (updated) setProfile(updated);
  }, [address]);

  return {
    profile,
    hasProfile,
    isConnected,
    status,
    needsSetup,
    profileSettled,
    setupProfile,
    claimExistingProfile,
    addMatchResult,
    checkUsername,
    syncXProfile,
    refresh,
  };
}
