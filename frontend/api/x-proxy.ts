/**
 * api/x-proxy.ts  (Vercel Edge Function)
 *
 * Proxies requests to the X (Twitter) API to avoid browser CORS restrictions.
 *
 * Routes  (query param ?action=):
 *  token  — OAuth 2.0 token exchange or refresh (POST, x-www-form-urlencoded)
 *  me     — GET /2/users/me  (POST body: { token })
 *  tweet  — POST /2/tweets   (POST body: { token, text })
 *
 * Deploy: Vercel automatically serves files in /api as serverless functions.
 */

export const config = { runtime: "edge" };

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

export default async function handler(req: Request): Promise<Response> {
  // Pre-flight
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST")   return new Response("Method Not Allowed", { status: 405, headers: CORS });

  const action = new URL(req.url).searchParams.get("action");

  // ── Token exchange / refresh ─────────────────────────────────────────────
  if (action === "token") {
    const body = await req.text();
    const res  = await fetch("https://api.twitter.com/2/oauth2/token", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    return json(await res.json(), res.status);
  }

  // ── GET /2/users/me ────────────────────────────────────────────────────────
  if (action === "me") {
    const { token } = await req.json() as { token: string };
    if (!token) return json({ error: "missing token" }, 400);

    const res = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics",
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return json(await res.json(), res.status);
  }

  // ── POST /2/tweets ─────────────────────────────────────────────────────────
  if (action === "tweet") {
    const { token, text } = await req.json() as { token: string; text: string };
    if (!token || !text) return json({ error: "missing token or text" }, 400);
    if (text.length > 280) return json({ error: "Tweet exceeds 280 characters" }, 400);

    const res = await fetch("https://api.twitter.com/2/tweets", {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
    return json(await res.json(), res.status);
  }

  return json({ error: "Unknown action" }, 400);
}
