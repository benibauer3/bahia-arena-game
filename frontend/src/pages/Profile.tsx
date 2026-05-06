import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { useXAuth } from "@/hooks/useXAuth";
import { getPlayerMatches } from "@/lib/playerStore";
import type { MatchRecord } from "@/lib/playerStore";
import { ACTIVE_CONTRACTS, ARENA_ABI } from "@/lib/contracts";
import { ChampionArt } from "@/components/ChampionArt";
import { CHAMPIONS, ChampionClass } from "@/lib/champions";
import { X_CLIENT_ID } from "@/lib/xAuth";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function fmtCountdown(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}h ${m}m ${s}s`;
}

function fmtMonthCountdown(secs: number): string {
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  return `${d}d ${h}h`;
}

const CHECKIN_COOLDOWN = 20 * 3600; // 20 hours in seconds

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-arena-border/50 ${className}`} />
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
export default function Profile() {
  const { address, isConnected } = useAccount();
  const { profile, hasProfile, setupProfile, refresh } = usePlayerProfile();

  // ── X OAuth ────────────────────────────────────────────────────────────────
  const {
    isConnected:  xConnected,
    isConnecting: xConnecting,
    isTweeting,
    xUser,
    connectX,
    disconnectX,
    shareTweet,
    error:        xError,
  } = useXAuth();

  const [tweetSent, setTweetSent] = useState(false);

  // ── Username inline edit ───────────────────────────────────────────────────
  const [usernameEditing, setUsernameEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");

  const saveUsername = useCallback(() => {
    if (!usernameInput.trim()) { setUsernameEditing(false); return; }
    setupProfile(usernameInput.trim(), xUser?.username || undefined);
    refresh();
    setUsernameEditing(false);
  }, [usernameInput, xUser, setupProfile, refresh]);

  // ── Copy address ───────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // ── Contract reads ─────────────────────────────────────────────────────────
  const enabled = !!address;

  const { data: rankPts } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi: ARENA_ABI,
    functionName: "rankingPoints",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const { data: wins } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi: ARENA_ABI,
    functionName: "wins",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const { data: losses } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi: ARENA_ABI,
    functionName: "losses",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const { data: depositBal } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi: ARENA_ABI,
    functionName: "deposits",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const { data: lastCheckIn } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi: ARENA_ABI,
    functionName: "lastCheckIn",
    args: address ? [address] : undefined,
    query: { enabled, refetchInterval: 10_000 },
  });

  const { data: totalYield } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi: ARENA_ABI,
    functionName: "totalYield",
    query: { enabled },
  });

  const { data: secsToMonthEnd } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi: ARENA_ABI,
    functionName: "secondsToMonthEnd",
    query: { enabled, refetchInterval: 30_000 },
  });

  // ── Daily check-in logic ───────────────────────────────────────────────────
  const nowSecs = Math.floor(Date.now() / 1000);
  const lastCI  = lastCheckIn !== undefined ? Number(lastCheckIn as bigint) : null;
  const secsSinceCI = lastCI !== null ? nowSecs - lastCI : CHECKIN_COOLDOWN + 1;
  const canCheckIn  = secsSinceCI >= CHECKIN_COOLDOWN;
  const cooldownRem = canCheckIn ? 0 : CHECKIN_COOLDOWN - secsSinceCI;

  const [checkInStatus, setCheckInStatus] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [checkInErr, setCheckInErr] = useState("");
  const { writeContractAsync } = useWriteContract();

  const handleCheckIn = async () => {
    setCheckInStatus("pending");
    setCheckInErr("");
    try {
      await writeContractAsync({
        address: ACTIVE_CONTRACTS.ArenaManager,
        abi: ARENA_ABI,
        functionName: "dailyCheckIn",
        args: [],
      });
      setCheckInStatus("done");
    } catch (e: unknown) {
      const err = e as { shortMessage?: string; message?: string };
      setCheckInErr(err.shortMessage ?? err.message ?? "Error");
      setCheckInStatus("error");
    }
  };

  // ── Match history ──────────────────────────────────────────────────────────
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  useEffect(() => {
    if (address) {
      setMatches(getPlayerMatches(address, 5));
    }
  }, [address]);

  // ── Champion avatar ────────────────────────────────────────────────────────
  const champIndex = address
    ? parseInt(address.slice(-2), 16) % 5
    : 0;
  const champClass = (profile as any)?.champion ?? champIndex;
  const champDef = CHAMPIONS[champClass as number] ?? CHAMPIONS[0];

  // ── Share text ─────────────────────────────────────────────────────────────
  const rankStr  = rankPts !== undefined ? ` (${String(rankPts as bigint)} pts)` : "";
  const shareText = `⚔️ Jogando como ${champDef.name} na @BahiaArena!${rankStr} 🏆 Venha desafiar: https://bahiaarena.xyz #CeloArena #Web3Gaming`;

  const handleShareTweet = async () => {
    const ok = await shareTweet(shareText);
    if (ok) { setTweetSent(true); setTimeout(() => setTweetSent(false), 3000); }
  };

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-4">
        <span className="text-5xl">👤</span>
        <p className="text-lg font-semibold">Connect your wallet</p>
        <p className="text-arena-muted text-sm">Connect to view your profile.</p>
        <Link to="/" className="mt-2 px-6 py-3 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm active:scale-95 transition-transform">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-arena-bg px-4 pb-10">

      {/* ── 1. Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-arena-muted text-xl leading-none">←</Link>
          <h1 className="font-display text-arena-primary text-sm tracking-widest">PROFILE</h1>
        </div>
        <button className="text-arena-muted text-lg" title="Settings (coming soon)">⚙️</button>
      </div>

      {/* ── 2. Wallet Card ─────────────────────────────────────────────────── */}
      <section className="rounded-2xl bg-arena-surface border border-arena-border p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-arena-muted uppercase tracking-wider font-semibold">Wallet</p>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-arena-primary/15 text-arena-primary border border-arena-primary/30">
            Celo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <p className="font-mono text-sm text-white">{truncate(address!)}</p>
          <button
            onClick={copyAddress}
            className="text-arena-muted text-xs hover:text-white transition-colors"
          >
            {copied ? "✓" : "📋"}
          </button>
        </div>
      </section>

      {/* ── 3. Username & Avatar Card ───────────────────────────────────────── */}
      <section className="rounded-2xl bg-arena-surface border border-arena-border p-4 mb-4">
        <div className="flex items-center gap-4">
          {/* Champion avatar */}
          <div className={`rounded-2xl p-1 bg-gradient-to-b ${champDef.color} border ${champDef.borderColor} shrink-0`}>
            <ChampionArt class_={champClass as ChampionClass} size={64} animated={false} />
          </div>
          <div className="flex-1 min-w-0">
            {!hasProfile ? (
              <div>
                <p className="text-sm font-semibold text-arena-muted mb-2">No profile yet</p>
                <button
                  onClick={() => {
                    setUsernameInput("");
                    setUsernameEditing(true);
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-arena-primary text-arena-bg font-semibold"
                >
                  Create Profile
                </button>
              </div>
            ) : usernameEditing ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  placeholder={profile?.username ?? "username"}
                  maxLength={18}
                  className="flex-1 px-2 py-1.5 text-sm rounded-lg bg-arena-bg border border-arena-border text-white focus:outline-none focus:border-arena-primary"
                />
                <button onClick={saveUsername} className="text-xs px-2 py-1.5 rounded-lg bg-arena-primary text-arena-bg font-semibold">Save</button>
                <button onClick={() => setUsernameEditing(false)} className="text-xs text-arena-muted">✕</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-bold text-white truncate">{profile?.username}</p>
                <button
                  onClick={() => { setUsernameInput(profile?.username ?? ""); setUsernameEditing(true); }}
                  className="text-[10px] text-arena-muted hover:text-white transition-colors shrink-0"
                >
                  ✏️
                </button>
              </div>
            )}
            <p className="text-xs text-arena-muted mt-0.5">{champDef.name} · {champDef.role}</p>
          </div>
        </div>
      </section>

      {/* ── 4. X (Twitter) OAuth Card ────────────────────────────────────── */}
      <section className="rounded-2xl bg-arena-surface border border-arena-border p-4 mb-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* X logo */}
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" aria-hidden>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <p className="text-xs font-semibold">X Profile</p>
          </div>
          {xConnected && (
            <button
              onClick={disconnectX}
              className="text-[10px] text-arena-muted hover:text-arena-danger transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>

        {/* ── Not configured ─────────────────────────────────────────────── */}
        {!X_CLIENT_ID ? (
          <div className="rounded-xl bg-arena-bg border border-arena-border p-3 text-center">
            <p className="text-xs text-arena-muted">
              Set <code className="text-arena-primary">VITE_X_CLIENT_ID</code> in .env to enable X login
            </p>
          </div>
        ) : xConnecting ? (
          /* ── Connecting spinner ────────────────────────────────────────── */
          <div className="flex flex-col items-center gap-3 py-4">
            <span className="w-8 h-8 rounded-full border-2 border-[#1d9bf0] border-t-transparent animate-spin" />
            <p className="text-xs text-arena-muted">Connecting to X…</p>
          </div>

        ) : xConnected && xUser ? (
          /* ── Connected ─────────────────────────────────────────────────── */
          <div>
            {/* User card */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-arena-bg border border-arena-border">
              {xUser.profile_image_url ? (
                <img
                  src={xUser.profile_image_url.replace("_normal", "_bigger")}
                  alt={xUser.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#1d9bf0]/40"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#1d9bf0]/20 flex items-center justify-center text-xl">
                  🐦
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{xUser.name}</p>
                <p className="text-xs text-[#1d9bf0]">@{xUser.username}</p>
                {xUser.public_metrics && (
                  <p className="text-[10px] text-arena-muted mt-0.5">
                    {xUser.public_metrics.followers_count.toLocaleString()} seguidores
                  </p>
                )}
              </div>
              <span className="text-green-400 text-lg shrink-0">✓</span>
            </div>

            {/* Tweet preview */}
            <div className="rounded-xl bg-arena-bg border border-arena-border p-3 mb-3">
              <p className="text-[10px] text-arena-muted uppercase tracking-wider mb-1">Preview</p>
              <p className="text-xs text-white/80 leading-relaxed">{shareText}</p>
            </div>

            {/* Share button */}
            <button
              onClick={handleShareTweet}
              disabled={isTweeting || tweetSent}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#1d9bf0]/15 border border-[#1d9bf0]/40 text-[#1d9bf0] text-xs font-semibold active:scale-95 transition-all disabled:opacity-60"
            >
              {tweetSent ? (
                <>✓ Postado!</>
              ) : isTweeting ? (
                <><span className="w-3.5 h-3.5 rounded-full border-2 border-[#1d9bf0] border-t-transparent animate-spin" /> Postando…</>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#1d9bf0]">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Postar no X
                </>
              )}
            </button>
          </div>

        ) : (
          /* ── Not connected ─────────────────────────────────────────────── */
          <div>
            <p className="text-xs text-arena-muted mb-4">
              Conecte sua conta X para compartilhar vitórias automaticamente e aparecer no ranking.
            </p>
            <button
              onClick={connectX}
              className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl bg-black border border-white/10 text-white text-sm font-semibold active:scale-95 transition-transform hover:bg-white/5"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Entrar com X
            </button>
          </div>
        )}

        {/* Error */}
        {xError && (
          <p className="mt-3 text-xs text-arena-danger text-center">{xError}</p>
        )}
      </section>

      {/* ── 5. On-Chain Stats Card ──────────────────────────────────────────── */}
      <section className="rounded-2xl bg-arena-surface border border-arena-border p-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-arena-muted mb-3">On-Chain Stats</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {/* Rank Points */}
          <div className="rounded-xl bg-arena-bg border border-arena-border p-3">
            <p className="text-[10px] text-arena-muted mb-1">Rank Points</p>
            {rankPts !== undefined
              ? <p className="text-lg font-bold text-arena-primary">{String(rankPts as bigint)}</p>
              : <Skeleton className="h-6 w-12" />}
          </div>
          {/* Wins */}
          <div className="rounded-xl bg-arena-bg border border-arena-border p-3">
            <p className="text-[10px] text-arena-muted mb-1">Wins</p>
            {wins !== undefined
              ? <p className="text-lg font-bold text-arena-success">{String(wins as bigint)}</p>
              : <Skeleton className="h-6 w-8" />}
          </div>
          {/* Losses */}
          <div className="rounded-xl bg-arena-bg border border-arena-border p-3">
            <p className="text-[10px] text-arena-muted mb-1">Losses</p>
            {losses !== undefined
              ? <p className="text-lg font-bold text-arena-danger">{String(losses as bigint)}</p>
              : <Skeleton className="h-6 w-8" />}
          </div>
          {/* Deposit */}
          <div className="rounded-xl bg-arena-bg border border-arena-border p-3">
            <p className="text-[10px] text-arena-muted mb-1">Deposited</p>
            {depositBal !== undefined
              ? <p className="text-lg font-bold text-green-400">
                  {(Number(depositBal as bigint) / 1e6).toFixed(2)} USDT
                </p>
              : <Skeleton className="h-6 w-16" />}
          </div>
        </div>

        {/* Daily Check-In */}
        <div className="border-t border-arena-border pt-3">
          {canCheckIn ? (
            <button
              onClick={handleCheckIn}
              disabled={checkInStatus === "pending"}
              className="w-full py-2.5 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm disabled:opacity-50 active:scale-95 transition-transform"
            >
              {checkInStatus === "pending" ? "Checking in…" :
               checkInStatus === "done"    ? "✓ Checked In!" :
               "✓ Check in for +1 pt"}
            </button>
          ) : (
            <div className="text-center">
              <p className="text-xs text-arena-muted">Next check-in in</p>
              <p className="text-sm font-bold text-white">{fmtCountdown(cooldownRem)}</p>
            </div>
          )}
          {checkInErr && <p className="mt-1 text-xs text-arena-danger text-center">{checkInErr}</p>}
        </div>
      </section>

      {/* ── 6. Monthly Rewards Card ─────────────────────────────────────────── */}
      <section className="rounded-2xl bg-arena-surface border border-arena-border p-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-arena-muted mb-3">Monthly Rewards</p>

        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] text-arena-muted">Total Yield Pool</p>
            {totalYield !== undefined
              ? <p className="text-lg font-bold text-green-400">
                  {(Number(totalYield as bigint) / 1e6).toFixed(4)} USDT
                </p>
              : <Skeleton className="h-6 w-20" />}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-arena-muted">Next Distribution</p>
            {secsToMonthEnd !== undefined
              ? <p className="text-sm font-bold text-white">
                  {fmtMonthCountdown(Number(secsToMonthEnd as bigint))}
                </p>
              : <Skeleton className="h-5 w-16" />}
          </div>
        </div>

        <p className="text-[10px] text-arena-muted text-center">
          Rewards paid directly to your wallet 🔒
        </p>
      </section>

      {/* ── 7. Match History ────────────────────────────────────────────────── */}
      <section className="rounded-2xl bg-arena-surface border border-arena-border p-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-arena-muted mb-3">Recent Battles</p>

        {matches.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-arena-muted">No battles yet</p>
            <Link to="/demo" className="mt-2 inline-block text-xs text-arena-primary underline">
              Play Demo to get started
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {matches.map((m) => {
              const champLookup = CHAMPIONS.find(c => c.name.toLowerCase() === m.myChampion.toLowerCase());
              const oppLookup   = CHAMPIONS.find(c => c.name.toLowerCase() === m.opponentChampion.toLowerCase());
              const myEmoji     = champLookup?.emoji ?? "⚔️";
              const oppEmoji    = oppLookup?.emoji   ?? "🛡️";
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl bg-arena-bg border border-arena-border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{myEmoji}</span>
                    <span className={`text-xs font-bold ${
                      m.result === "win"  ? "text-arena-success" :
                      m.result === "loss" ? "text-arena-danger"  : "text-arena-muted"
                    }`}>
                      {m.result === "win" ? "W" : m.result === "loss" ? "L" : "D"}
                    </span>
                    <span className="text-xs text-arena-muted">vs</span>
                    <span className="text-lg">{oppEmoji}</span>
                    <span className="text-xs text-arena-muted">{m.opponentChampion}</span>
                  </div>
                  <span className="text-xs font-semibold text-arena-primary">
                    +{m.pointsEarned} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
