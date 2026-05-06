/**
 * useXAuth.ts
 *
 * React hook — X (Twitter) OAuth 2.0 PKCE state management.
 *
 * Handles:
 *  • Loading persisted token/user from localStorage on mount
 *  • Processing the OAuth callback (URL ?code=&state= params) on mount
 *  • Token expiry + auto-refresh via refresh_token
 *  • connectX()    → redirect to X authorization page
 *  • disconnectX() → clear tokens
 *  • shareTweet()  → post via API; fallback to web intent if CORS/error
 */

import { useState, useEffect, useCallback } from "react";
import {
  buildXAuthUrl,
  exchangeXCode,
  fetchXUser,
  postXTweet,
  refreshXToken,
  xStore,
  type XToken,
  type XUser,
} from "@/lib/xAuth";

export function useXAuth() {
  const [token,        setTokenState]   = useState<XToken | null>(() => xStore.getToken());
  const [xUser,        setXUserState]   = useState<XUser  | null>(() => xStore.getUser());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTweeting,   setIsTweeting]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // Helper: persist + set token
  const saveToken = (t: XToken) => { xStore.setToken(t); setTokenState(t); };
  const saveUser  = (u: XUser)  => { xStore.setUser(u);  setXUserState(u); };

  const isConnected = !!token?.access_token && !!xUser;

  // ── Token auto-refresh on load ─────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    // If expires within 5 minutes, refresh immediately
    const expiresIn = (token.expires_at ?? Infinity) - Date.now();
    if (expiresIn > 5 * 60_000) return;
    if (!token.refresh_token) { xStore.delToken(); setTokenState(null); return; }

    refreshXToken(token.refresh_token)
      .then(saveToken)
      .catch(() => { xStore.delToken(); setTokenState(null); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── OAuth callback handler ─────────────────────────────────────────────────
  useEffect(() => {
    const params      = new URLSearchParams(window.location.search);
    const code        = params.get("code");
    const stateParam  = params.get("state");
    const errorParam  = params.get("error");

    // X returned an error (e.g. user denied)
    if (errorParam) {
      setError(params.get("error_description") ?? "X authorization was denied.");
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (!code || !stateParam) return;

    // CSRF check
    const savedState = xStore.getState();
    if (stateParam !== savedState) {
      setError("Security check failed. Please try again.");
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    const verifier = xStore.getVerifier();
    if (!verifier) {
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    // Clean URL and stored PKCE data
    window.history.replaceState({}, "", window.location.pathname);
    xStore.delState();
    xStore.delVerifier();

    setIsConnecting(true);
    setError(null);

    exchangeXCode(code, verifier)
      .then(async (tok) => {
        saveToken(tok);
        const user = await fetchXUser(tok.access_token);
        saveUser(user);
      })
      .catch((e: Error) => {
        setError(e.message);
        xStore.delToken();
        setTokenState(null);
      })
      .finally(() => setIsConnecting(false));
  // Run once on mount — do not add deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── connectX ──────────────────────────────────────────────────────────────
  const connectX = useCallback(async () => {
    setError(null);
    try {
      const { url, verifier, state } = await buildXAuthUrl();
      xStore.setVerifier(verifier);
      xStore.setState(state);
      window.location.href = url;
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to start X auth");
    }
  }, []);

  // ── disconnectX ────────────────────────────────────────────────────────────
  const disconnectX = useCallback(() => {
    xStore.delToken();
    xStore.delUser();
    setTokenState(null);
    setXUserState(null);
    setError(null);
  }, []);

  // ── shareTweet ─────────────────────────────────────────────────────────────
  /**
   * Posts `text` to X.
   * - If connected: tries the API; returns true on success.
   * - On CORS / API error, or if not connected: opens the Web Intent in a new tab.
   */
  const shareTweet = useCallback(async (text: string): Promise<boolean> => {
    const webIntent = () => {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer",
      );
    };

    if (!token?.access_token) { webIntent(); return false; }

    setIsTweeting(true);
    setError(null);
    try {
      await postXTweet(token.access_token, text);
      return true;
    } catch (e: unknown) {
      // Proxy unavailable in local dev — fall back to web intent
      webIntent();
      return false;
    } finally {
      setIsTweeting(false);
    }
  }, [token]);

  return {
    isConnected,
    isConnecting,
    isTweeting,
    xUser,
    token,
    connectX,
    disconnectX,
    shareTweet,
    error,
  };
}
