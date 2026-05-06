import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
import BahiaArenaLogo from "@/components/BahiaArenaLogo";
import {
  getLeaderboard,
  ensureSeedData,
  PTS,
  type PlayerProfile,
} from "@/lib/playerStore";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";

// ─── Countdown helpers ─────────────────────────────────────────────────────────

function msUntilNext30th(): number {
  const now  = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), 30, 0, 0, 0);
  if (now.getDate() >= 30) next.setMonth(next.getMonth() + 1);
  return Math.max(0, next.getTime() - now.getTime());
}

function formatCountdown(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d)}:${pad(h)}:${pad(m)}:${pad(s)}`;
}

// ─── Points guide ──────────────────────────────────────────────────────────────

function PointsGuide() {
  return (
    <div className="rounded-2xl bg-arena-surface border border-arena-border p-4 mb-4">
      <p className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Points Guide</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
        <span className="text-arena-muted">🏆 Win</span>        <span className="text-arena-primary font-bold">+{PTS.win} pts</span>
        <span className="text-arena-muted">🤝 Draw</span>       <span className="text-arena-primary font-bold">+{PTS.draw} pts</span>
        <span className="text-arena-muted">💪 Loss</span>       <span className="text-arena-primary font-bold">+{PTS.loss} pts</span>
        <span className="text-arena-muted">🔥 3x streak</span>  <span className="text-arena-success font-bold">+{PTS.streak3} bonus</span>
        <span className="text-arena-muted">🔥🔥 5x streak</span><span className="text-arena-success font-bold">+{PTS.streak5} bonus</span>
        <span className="text-arena-muted">💀 Hard win</span>   <span className="text-arena-success font-bold">+{PTS.hardBonus} bonus</span>
      </div>
    </div>
  );
}

// ─── Player Row ────────────────────────────────────────────────────────────────

const MEDALS = ["🥇", "🥈", "🥉"];

function PlayerRow({
  rank,
  player,
  isMe,
  estimatedReward,
}: {
  rank: number;
  player: PlayerProfile;
  isMe: boolean;
  estimatedReward: string;
}) {
  const medal = rank <= 3 ? MEDALS[rank - 1] : null;

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
      isMe
        ? "bg-arena-primary/10 border-arena-primary/30"
        : "bg-arena-surface border-arena-border"
    }`}>
      {/* Rank */}
      {medal ? (
        <span className="text-xl w-7 text-center shrink-0">{medal}</span>
      ) : (
        <span className="w-7 text-center shrink-0">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-arena-border/60 text-[10px] font-bold text-arena-muted">
            {rank}
          </span>
        </span>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-bold text-white truncate">{player.username}</span>
          {isMe && <span className="text-[10px] text-arena-primary font-semibold">(you)</span>}
          {player.xHandle && (
            <a
              href={`https://twitter.com/${player.xHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-arena-muted hover:text-white transition-colors"
              onClick={e => e.stopPropagation()}
            >
              @{player.xHandle}
            </a>
          )}
        </div>
        <p className="text-[10px] text-arena-muted">
          {player.wins}W / {player.losses}L / {player.draws}D
          {player.streak > 1 && (
            <span className="ml-1.5 text-arena-success">🔥 {player.streak}x streak</span>
          )}
        </p>
      </div>

      {/* Points + reward */}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-arena-primary">{player.points} pts</p>
        <p className="text-[10px] text-arena-success font-semibold">~{estimatedReward} USDT</p>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Leaderboard() {
  const { address } = useAccount();
  const { profile, hasProfile, needsSetup } = usePlayerProfile();

  const [leaderboard, setLeaderboard] = useState<PlayerProfile[]>([]);
  const [countdown,   setCountdown]   = useState(msUntilNext30th());

  // Seed + load leaderboard
  useEffect(() => {
    ensureSeedData();
    setLeaderboard(getLeaderboard().slice(0, 10));
  }, []);

  // Countdown ticker
  useEffect(() => {
    const id = setInterval(() => setCountdown(msUntilNext30th()), 1_000);
    return () => clearInterval(id);
  }, []);

  // Simulated prize pool
  const depositedUSDT = leaderboard.length * 1;         // 1 USDT each
  const prizePool     = leaderboard.length * 0.5;       // 50% of deposits

  const totalTopPoints = leaderboard.reduce((s, p) => s + p.points, 0);

  const estimatedReward = (pts: number) => {
    if (totalTopPoints === 0 || prizePool === 0) return "0.00";
    return ((pts / totalTopPoints) * prizePool).toFixed(2);
  };

  // My rank
  const myRank = hasProfile && profile
    ? leaderboard.findIndex(p => p.address.toLowerCase() === profile.address.toLowerCase()) + 1
    : 0;

  return (
    <div className="flex flex-col min-h-screen bg-arena-bg px-4 pt-4 pb-24">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <BahiaArenaLogo size={44} showWordmark={false} />
        <div>
          <h1 className="font-display text-arena-primary text-sm tracking-widest">LEADERBOARD</h1>
          <p className="text-[10px] text-arena-muted">Top 10 · Monthly Prizes · Celo</p>
        </div>
      </div>

      {/* ── Monthly Countdown ──────────────────────────────────────────── */}
      <div className="rounded-2xl bg-arena-surface border border-arena-border p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-arena-muted uppercase tracking-wider mb-1">🏆 Next Distribution</p>
          <p className="font-display text-arena-primary text-base tabular-nums">
            {formatCountdown(countdown)}
          </p>
          <p className="text-[9px] text-arena-muted mt-0.5">DD:HH:MM:SS</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-arena-muted uppercase tracking-wider mb-1">Prize Pool</p>
          <p className="text-sm font-bold text-arena-success">50% of deposits</p>
        </div>
      </div>

      {/* ── Prize Pool Visual ──────────────────────────────────────────── */}
      <div className="rounded-2xl p-4 mb-4 border border-arena-primary/20"
        style={{ background: "linear-gradient(135deg, rgba(246,201,14,0.07), rgba(34,197,94,0.07))" }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-arena-muted">≈ {depositedUSDT} USDT deposited</p>
            <p className="text-sm font-bold text-arena-primary">Prize Pool: ≈ {prizePool.toFixed(1)} USDT</p>
          </div>
          <span className="text-2xl">🏆</span>
        </div>
        {/* Progress bar */}
        <div className="h-2 rounded-full bg-arena-border overflow-hidden mb-2">
          <div className="h-full rounded-full bg-arena-success" style={{ width: "50%" }} />
        </div>
        <p className="text-[10px] text-arena-muted">
          Distributed proportionally by ranking points to the top 10 players on the 30th of each month.
        </p>
      </div>

      {/* ── My Stats ───────────────────────────────────────────────────── */}
      {hasProfile && profile ? (
        <div className="rounded-2xl bg-arena-surface border border-arena-primary/20 p-4 mb-4">
          <p className="text-[10px] text-arena-muted uppercase tracking-wider mb-2">Your Stats</p>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-bold text-white">{profile.username}</p>
              <p className="text-[10px] text-arena-muted">
                Rank: <span className="text-arena-primary font-bold">{myRank > 0 ? `#${myRank}` : "Unranked"}</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-arena-primary">{profile.points}</p>
              <p className="text-[10px] text-arena-muted">pts</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">{profile.wins}W/{profile.losses}L/{profile.draws}D</p>
              {profile.streak > 1 && (
                <p className="text-[10px] text-arena-success">🔥 {profile.streak}x streak</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-arena-success">~{estimatedReward(profile.points)} USDT</p>
              <p className="text-[10px] text-arena-muted">est. reward</p>
            </div>
          </div>
        </div>
      ) : needsSetup ? (
        <div className="rounded-2xl bg-arena-surface border border-arena-border p-4 mb-4 text-center">
          <p className="text-xs text-arena-muted mb-2">Connect & Create Profile to compete</p>
          <Link to="/arena"
            className="inline-block px-4 py-2 rounded-xl bg-arena-primary text-arena-bg text-xs font-bold active:scale-95 transition-transform">
            ⚔️ Enter the Arena
          </Link>
        </div>
      ) : !address ? (
        <div className="rounded-2xl bg-arena-surface border border-arena-border p-4 mb-4 text-center">
          <p className="text-xs text-arena-muted mb-2">Connect wallet to track your ranking</p>
          <Link to="/arena"
            className="inline-block px-4 py-2 rounded-xl bg-arena-primary text-arena-bg text-xs font-bold active:scale-95 transition-transform">
            Connect Wallet
          </Link>
        </div>
      ) : null}

      {/* ── Points Guide ───────────────────────────────────────────────── */}
      <PointsGuide />

      {/* ── Leaderboard List ───────────────────────────────────────────── */}
      <p className="text-[10px] text-arena-muted uppercase tracking-wider font-semibold mb-2">Top 10 Players</p>

      {leaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <span className="text-5xl">🏆</span>
          <p className="text-arena-muted text-sm">Battle to earn your spot!</p>
          <Link to="/demo"
            className="px-5 py-2.5 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm active:scale-95 transition-transform">
            🎮 Play Demo
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {leaderboard.map((entry, i) => (
            <PlayerRow
              key={entry.address}
              rank={i + 1}
              player={entry}
              isMe={!!profile && entry.address.toLowerCase() === profile.address.toLowerCase()}
              estimatedReward={estimatedReward(entry.points)}
            />
          ))}
        </div>
      )}

      {/* ── Footer explainer ───────────────────────────────────────────── */}
      <div className="mt-6 p-4 rounded-2xl bg-arena-surface border border-arena-border">
        <p className="text-xs font-semibold mb-2">💡 How to Earn Points</p>
        <div className="space-y-1.5 text-xs text-arena-muted">
          <p>• Play battles in <span className="text-arena-primary">Demo</span> or <span className="text-arena-primary">Arena</span> to earn points.</p>
          <p>• Win: <span className="text-arena-success">+{PTS.win} pts</span> · Draw: <span className="text-white">+{PTS.draw} pts</span> · Loss: <span className="text-white">+{PTS.loss} pts</span></p>
          <p>• Win 3 in a row for a <span className="text-arena-success">+{PTS.streak3} streak bonus</span>, 5 in a row for <span className="text-arena-success">+{PTS.streak5}</span>.</p>
          <p>• Beat hard mode for an extra <span className="text-arena-success">+{PTS.hardBonus} pts</span>.</p>
          <p>• Top 10 players share the prize pool every 30th of the month.</p>
        </div>
      </div>
    </div>
  );
}
