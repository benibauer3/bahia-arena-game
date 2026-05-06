/**
 * xAuth.ts
 *
 * X (Twitter) OAuth 2.0 Authorization Code + PKCE — browser-safe, no client secret.
 *
 * Setup (one-time):
 *  1. developer.twitter.com → Projects & Apps → New App
 *  2. App type: "Native App"  (enables PKCE without a secret)
 *  3. Callback URL: https://your-domain.com/profile  (also add http://localhost:5173/profile for dev)
 *  4. Required permissions: tweet.read  users.read  tweet.write  offline.access
 *  5. Copy the Client ID → VITE_X_CLIENT_ID in .env
 */

export const X_CLIENT_ID  = import.meta.env.VITE_X_CLIENT_ID ?? "";

/** Must match EXACTLY what you registered in the X developer portal */
export const X_REDIRECT_URI =
  typeof window !== "undefined"
    ? `${window.location.origin}/profile`
    : "http://localhost:5173/profile";

export const X_SCOPES = ["tweet.read", "users.read", "tweet.write", "offline.access"];

/** Vercel edge function used to proxy X API calls and avoid browser CORS issues */
const PROXY = "/api/x-proxy";

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

function randomString(len: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const buf   = new Uint8Array(len);
  crypto.getRandomValues(buf);
  return Array.from(buf, b => chars[b % chars.length]).join("");
}

async function sha256Base64url(plain: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(plain));
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// ─── Build auth URL ───────────────────────────────────────────────────────────

export async function buildXAuthUrl(): Promise<{
  url:      string;
  verifier: string;
  state:    string;
}> {
  const verifier  = randomString(128);
  const challenge = await sha256Base64url(verifier);
  const state     = randomString(16);

  const params = new URLSearchParams({
    response_type:         "code",
    client_id:             X_CLIENT_ID,
    redirect_uri:          X_REDIRECT_URI,
    scope:                 X_SCOPES.join(" "),
    state,
    code_challenge:        challenge,
    code_challenge_method: "S256",
  });

  return {
    url:      `https://twitter.com/i/oauth2/authorize?${params}`,
    verifier,
    state,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface XToken {
  access_token:   string;
  refresh_token?: string;
  expires_at?:    number; // epoch ms
}

export interface XUser {
  id:                string;
  name:              string;
  username:          string;
  profile_image_url?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count:     number;
  };
}

// ─── Token exchange (via proxy to avoid CORS) ─────────────────────────────────

export async function exchangeXCode(code: string, verifier: string): Promise<XToken> {
  const body = new URLSearchParams({
    grant_type:    "authorization_code",
    code,
    redirect_uri:  X_REDIRECT_URI,
    client_id:     X_CLIENT_ID,
    code_verifier: verifier,
  });

  // Try the edge-function proxy first; fall back to direct call (local dev)
  let res: Response;
  try {
    res = await fetch(`${PROXY}?action=token`, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    body.toString(),
    });
  } catch {
    // Proxy not available (local dev without Vercel) — call X directly
    res = await fetch("https://api.twitter.com/2/oauth2/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    body.toString(),
    });
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description ?? `Token exchange failed (${res.status})`);

  return {
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    expires_at:    data.expires_in ? Date.now() + data.expires_in * 1_000 : undefined,
  };
}

// ─── Fetch authenticated user ─────────────────────────────────────────────────

export async function fetchXUser(accessToken: string): Promise<XUser> {
  // Try direct browser call first (may work depending on X CORS policy)
  try {
    const res = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (res.ok) {
      const { data } = await res.json();
      return data as XUser;
    }
  } catch { /* CORS blocked — fall through to proxy */ }

  // Proxy fallback
  const res = await fetch(`${PROXY}?action=me`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ token: accessToken }),
  });
  if (!res.ok) throw new Error(`Failed to fetch X profile (${res.status})`);
  const { data } = await res.json();
  return data as XUser;
}

// ─── Post tweet ───────────────────────────────────────────────────────────────

export async function postXTweet(accessToken: string, text: string): Promise<string> {
  const res = await fetch(`${PROXY}?action=tweet`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ token: accessToken, text }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? `Post failed (${res.status})`);
  return data.data?.id as string;
}

// ─── Refresh access token ─────────────────────────────────────────────────────

export async function refreshXToken(refreshToken: string): Promise<XToken> {
  const body = new URLSearchParams({
    grant_type:    "refresh_token",
    refresh_token: refreshToken,
    client_id:     X_CLIENT_ID,
  });

  let res: Response;
  try {
    res = await fetch(`${PROXY}?action=token`, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    body.toString(),
    });
  } catch {
    res = await fetch("https://api.twitter.com/2/oauth2/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    body.toString(),
    });
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description ?? "Token refresh failed");

  return {
    access_token:  data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
    expires_at:    data.expires_in ? Date.now() + data.expires_in * 1_000 : undefined,
  };
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

export const xStore = {
  getToken():   XToken | null  { try { return JSON.parse(localStorage.getItem("x_token")!); } catch { return null; } },
  setToken(t:   XToken)        { localStorage.setItem("x_token", JSON.stringify(t)); },
  delToken()                   { localStorage.removeItem("x_token"); },

  getUser():    XUser | null   { try { return JSON.parse(localStorage.getItem("x_user")!); } catch { return null; } },
  setUser(u:    XUser)         { localStorage.setItem("x_user", JSON.stringify(u)); },
  delUser()                    { localStorage.removeItem("x_user"); },

  // sessionStorage — survives the OAuth redirect but not a new tab/window
  getVerifier() { return sessionStorage.getItem("x_verifier"); },
  setVerifier(v: string) { sessionStorage.setItem("x_verifier", v); },
  delVerifier() { sessionStorage.removeItem("x_verifier"); },

  getState()    { return sessionStorage.getItem("x_state"); },
  setState(s: string) { sessionStorage.setItem("x_state", s); },
  delState()    { sessionStorage.removeItem("x_state"); },
};
