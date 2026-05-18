/**
 * Leaderboard.tsx — MVP Season (AI Battles)
 *
 * Rankings based entirely on AI battles during the 2-month MVP period.
 * Points scale with difficulty — Legendary wins are worth 12× Easy wins.
 * Top 10 share the Aave yield pool every 30th of the month.
 */

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
import BahiaArenaLogo from "@/components/BahiaArenaLogo";
import {
  getLeaderboard,
  ensureSeedData,
  DIFF_PTS,
  STREAK_BONUS,
  type PlayerProfile,
  type Difficulty,
} from "@/lib/playerStore";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";

// ─── Season end date (2 months from launch) ──────────────────────────────────

const SEASON_END = new Date("2026-07-05T00:00:00Z"); // 2 months from now

function msUntilSeasonEnd(): number {
  return Math.max(0, SEASON_END.getTime() - Date.now());
}

function msUntilNext30th(): number {
  const now  = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), 30, 0, 0, 0);
  if (now.getDate() >= 30) next.setMonth(next.getMonth() + 1);
  return Math.max(0, next.getTime() - now.getTime());
}

function formatCountdown(ms: number, showDays = true): string {
  const t  = Math.floor(ms / 1000);
  const d  = Math.floor(t / 86400);
  const h  = Math.floor((t % 86400) / 3600);
  const m  = Math.floor((t % 3600) / 60);
  const s  = t % 60;
  const p  = (n: number) => String(n).padStart(2, "0");
  return showDays ? `${p(d)}:${p(h)}:${p(m)}:${p(s)}` : `${p(h)}:${p(m)}:${p(s)}`;
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────

const DIFF_META: Record<Difficulty, { emoji: string; label: string; color: string }> = {
  easy:      { emoji: "🟢", label: "Easy",      color: "text-emerald-400" },
  medium:    { emoji: "🟡", label: "Medium",    color: "text-amber-300"   },
  hard:      { emoji: "🔴", label: "Hard",      color: "text-red-400"     },
  legendary: { emoji: "⭐", label: "Legendary", color: "text-arena-primary" },
};

// ─── Points Guide ─────────────────────────────────────────────────────────────

function PointsGuide() {
  return (
    <div className="rounded-2xl bg-arena-surface border border-arena-border p-4 mb-4">
      <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">
        ⚡ Points per Battle
      </p>

      <div className="space-y-2">
        {(["easy", "medium", "hard", "legendary"] as Difficulty[]).map(d => {
          const m    = DIFF_META[d];
          const pts  = DIFF_PTS[d];
          const strk = STREAK_BONUS[d];
          return (
            <div
              key={d}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-arena-bg border border-arena-border text-xs"
            >
              <span className="text-base shrink-0">{m.emoji}</span>
              <span className={`font-bold w-20 shrink-0 ${m.color}`}>{m.label}</span>
              <div className="flex gap-3 flex-wrap text-[10px]">
                <span className="text-arena-success font-semibold">W +{pts.win}</span>
                <span className="text-white/60">D +{pts.draw}</span>
                <span className="text-arena-muted">L +{pts.loss}</span>
                <span className="text-arena-primary">🔥×3 +{strk.s3}</span>
                <span className="text-arena-primary">×5 +{strk.s5}</span>
                <span className="text-arena-primary font-bold">×10 +{strk.s10}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-arena-muted mt-3 text-center">
        Streak bonus applies only on wins. Higher tiers overwrite lower.
      </p>
    </div>
  );
}

// ─── Diff breakdown mini bar ──────────────────────────────────────────────────

function DiffBar({ d }: { d: PlayerProfile["winsByDiff"] }) {
  const total = d.easy + d.medium + d.hard + d.legendary;
  if (total === 0) return <span className="text-[10px] text-arena-muted">—</span>;

  const items: { key: Difficulty; pct: number; color: string }[] = [
    { key: "legendary", pct: (d.legendary / total) * 100, color: "bg-arena-primary" },
    { key: "hard",      pct: (d.hard      / total) * 100, color: "bg-red-500"       },
    { key: "medium",    pct: (d.medium    / total) * 100, color: "bg-amber-400"     },
    { key: "easy",      pct: (d.easy      / total) * 100, color: "bg-emerald-500"   },
  ];

  return (
    <div className="flex items-center gap-1">
      <div className="flex h-1.5 w-12 rounded-full overflow-hidden bg-arena-border">
        {items.map(it => it.pct > 0 && (
          <div key={it.key} className={`${it.color} h-full`} style={{ width: `${it.pct}%` }} />
        ))}
      </div>
      {d.legendary > 0 && (
        <span className="text-[9px] text-arena-primary font-bold">⭐{d.legendary}</span>
      )}
      {d.hard > 0 && (
        <span className="text-[9px] text-red-400 font-bold">🔴{d.hard}</span>
      )}
    </div>
  );
}

// ─── Player Row ───────────────────────────────────────────────────────────────

const MEDALS = ["🥇", "🥈", "🥉"];

function PlayerRow({
  rank,
  player,
  isMe,
  estimatedReward,
}: {
  rank:             number;
  player:           PlayerProfile;
  isMe:             boolean;
  estimatedReward:  string;
}) {
  const medal = rank <= 3 ? MEDALS[rank - 1] : null;

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
      isMe
        ? "bg-arena-primary/10 border-arena-primary/40"
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
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          {player.xAvatar && (
            <img
              src={player.xAvatar}
              alt={player.username}
              className="w-5 h-5 rounded-full object-cover shrink-0 border border-[#1d9bf0]/30"
            />
          )}
          <span className="text-sm font-bold text-white truncate">{player.username}</span>
          {isMe && <span className="text-[10px] text-arena-primary font-semibold">(você)</span>}
          {player.xHandle && (
            <a
              href={`https://twitter.com/${player.xHandle}`}
              target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-arena-muted hover:text-white transition-colors"
              onClick={e => e.stopPropagation()}
            >
              @{player.xHandle}
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-arena-muted">
            {player.wins}V / {player.losses}D / {player.draws}E
          </span>
          {player.streak > 1 && (
            <span className="text-[10px] text-arena-success">🔥 {player.streak}x</span>
          )}
          <DiffBar d={player.winsByDiff} />
        </div>
      </div>

      {/* Points + reward */}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-arena-primary">{player.points.toLocaleString()} pts</p>
        <p className="text-[10px] text-arena-success font-semibold">~{estimatedReward} USDT</p>
      </div>
    </div>
  );
}

// ─── Season Banner ────────────────────────────────────────────────────────────

function SeasonBanner() {
  const [seasonMs, setSeasonMs]   = useState(msUntilSeasonEnd());
  const [rewardMs, setRewardMs]   = useState(msUntilNext30th());

  useEffect(() => {
    const id = setInterval(() => {
      setSeasonMs(msUntilSeasonEnd());
      setRewardMs(msUntilNext30th());
    }, 1_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="rounded-2xl p-4 mb-4 border border-arena-primary/30"
      style={{ background: "linear-gradient(135deg, rgba(246,201,14,0.08), rgba(239,68,68,0.06))" }}
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🏆</span>
        <div>
          <p className="text-xs font-bold text-arena-primary uppercase tracking-wider">
            MVP Season — AI Battles
          </p>
          <p className="text-[10px] text-arena-muted">Temporada 1 · Somente batalhas contra IA</p>
        </div>
      </div>

      {/* Two countdowns side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-arena-bg/60 border border-arena-border px-3 py-2 text-center">
          <p className="text-[9px] text-arena-muted uppercase tracking-wider mb-1">
            ⏳ Fim da Temporada
          </p>
          <p className="font-display text-arena-primary text-sm tabular-nums">
            {formatCountdown(seasonMs)}
          </p>
          <p className="text-[8px] text-arena-muted mt-0.5">DD:HH:MM:SS</p>
        </div>
        <div className="rounded-xl bg-arena-bg/60 border border-arena-border px-3 py-2 text-center">
          <p className="text-[9px] text-arena-muted uppercase tracking-wider mb-1">
            💰 Próximo Prêmio
          </p>
          <p className="font-display text-arena-success text-sm tabular-nums">
            {formatCountdown(rewardMs)}
          </p>
          <p className="text-[8px] text-arena-muted mt-0.5">DD:HH:MM:SS</p>
        </div>
      </div>

      <p className="text-[10px] text-arena-muted text-center mt-3">
        Top 10 dividem o yield Aave todo dia 30 · proporcionalmente aos pontos
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Leaderboard() {
  const { address } = useAccount();
  const { profile, hasProfile, needsSetup } = usePlayerProfile();

  const [leaderboard, setLeaderboard] = useState<PlayerProfile[]>([]);

  useEffect(() => {
    ensureSeedData();
    setLeaderboard(getLeaderboard().slice(0, 10));
  }, []);

  // Refresh when user comes back to this tab
  useEffect(() => {
    const onFocus = () => setLeaderboard(getLeaderboard().slice(0, 10));
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // Estimated reward calc (proportional to points)
  const totalPts      = leaderboard.reduce((s, p) => s + p.points, 0);
  const playersCount  = leaderboard.filter(p => !p.address.startsWith("0xSEED")).length;
  const depositedUSDT = Math.max(leaderboard.length, playersCount) * 1;
  const prizePool     = depositedUSDT * 0.5; // 50% of Aave yield approximation

  const estimatedReward = (pts: number): string => {
    if (totalPts === 0 || prizePool === 0) return "0.00";
    return ((pts / totalPts) * prizePool).toFixed(3);
  };

  // My rank (1-indexed; 0 = unranked)
  const myRank = hasProfile && profile
    ? leaderboard.findIndex(p => p.address.toLowerCase() === profile.address.toLowerCase()) + 1
    : 0;

  const myEntry = hasProfile && profile
    ? leaderboard.find(p => p.address.toLowerCase() === profile.address.toLowerCase())
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-arena-bg px-4 pt-4 pb-24">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <BahiaArenaLogo size={44} showWordmark={false} />
        <div>
          <h1 className="font-display text-arena-primary text-sm tracking-widest">LEADERBOARD</h1>
          <p className="text-[10px] text-arena-muted">Top 10 · Pool Mensal · Celo</p>
        </div>
      </div>

      {/* ── Season Banner ───────────────────────────────────────────────── */}
      <SeasonBanner />

      {/* ── My Stats ───────────────────────────────────────────────────── */}
      {hasProfile && profile ? (
        <div className="rounded-2xl bg-arena-surface border border-arena-primary/20 p-4 mb-4">
          <p className="text-[10px] text-arena-muted uppercase tracking-wider mb-2">Sua Posição</p>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-bold text-white">{profile.username}</p>
              <p className="text-[10px] text-arena-muted mt-0.5">
                Rank:{" "}
                <span className={`font-bold ${myRank > 0 ? "text-arena-primary" : "text-arena-muted"}`}>
                  {myRank > 0 ? `#${myRank}` : "Não classificado"}
                </span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-arena-primary">{profile.points.toLocaleString()}</p>
              <p className="text-[10px] text-arena-muted">pts</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-3 text-xs mb-1">
                <span className="text-arena-success font-bold">{profile.wins}V</span>
                <span className="text-arena-danger">{profile.losses}D</span>
                <span className="text-arena-muted">{profile.draws}E</span>
              </div>
              {profile.streak > 1 && (
                <p className="text-[10px] text-arena-success">🔥 {profile.streak}x streak</p>
              )}
              {myEntry && <DiffBar d={myEntry.winsByDiff} />}
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-arena-success">
                ~{estimatedReward(profile.points)} USDT
              </p>
              <p className="text-[10px] text-arena-muted">prêmio est.</p>
            </div>
          </div>
        </div>
      ) : needsSetup ? (
        <div className="rounded-2xl bg-arena-surface border border-arena-border p-4 mb-4 text-center">
          <p className="text-xs text-arena-muted mb-2">
            Crie um perfil para aparecer no ranking
          </p>
          <Link
            to="/play"
            className="inline-block px-4 py-2 rounded-xl bg-arena-primary text-arena-bg text-xs font-bold active:scale-95 transition-transform"
          >
            🎮 Jogar e Criar Perfil
          </Link>
        </div>
      ) : !address ? (
        <div className="rounded-2xl bg-arena-surface border border-arena-border p-4 mb-4 text-center">
          <p className="text-xs text-arena-muted mb-2">
            Conecte sua carteira para rastrear seu ranking
          </p>
          <Link
            to="/"
            className="inline-block px-4 py-2 rounded-xl bg-arena-primary text-arena-bg text-xs font-bold active:scale-95 transition-transform"
          >
            Conectar Carteira
          </Link>
        </div>
      ) : null}

      {/* ── Points Guide ───────────────────────────────────────────────── */}
      <PointsGuide />

      {/* ── Top 10 List ────────────────────────────────────────────────── */}
      <p className="text-[10px] text-arena-muted uppercase tracking-wider font-semibold mb-2">
        Top 10 Players
      </p>

      {leaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <span className="text-5xl">🏆</span>
          <p className="text-arena-muted text-sm">Seja o primeiro no ranking!</p>
          <Link
            to="/play"
            className="px-5 py-2.5 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm active:scale-95 transition-transform"
          >
            🎮 Batalhar agora
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
        <p className="text-xs font-semibold mb-3">💡 Como ganhar mais pontos</p>
        <div className="space-y-2 text-xs text-arena-muted">
          <p>
            • Jogue em{" "}
            <Link to="/play" className="text-arena-primary font-semibold">Demo</Link>
            {" "}— qualquer dificuldade conta para o ranking.
          </p>
          <p>
            • <span className="text-arena-primary">⭐ Legendary</span> = {DIFF_PTS.legendary.win} pts/vitória ·{" "}
            <span className="text-red-400">🔴 Hard</span> = {DIFF_PTS.hard.win} pts ·{" "}
            <span className="text-amber-300">🟡 Medium</span> = {DIFF_PTS.medium.win} pts ·{" "}
            <span className="text-emerald-400">🟢 Easy</span> = {DIFF_PTS.easy.win} pts
          </p>
          <p>
            • Sequências de vitórias (3×, 5×, 10×) multiplicam seus pontos — especialmente em Legendary.
          </p>
          <p>
            • Derrotas ainda rendem pontos — nunca pare de jogar!
          </p>
          <p>
            • Top 10 dividem 50% do yield Aave todo dia 30, proporcional aos pontos.
          </p>
          <p className="text-arena-primary font-semibold">
            🏆 Temporada MVP encerra em{" "}
            {SEASON_END.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}.
          </p>
        </div>
      </div>
    </div>
  );
}
