import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { Link } from "react-router-dom";
import { formatUnits } from "viem";
import { ACTIVE_CONTRACTS, ARENA_ABI } from "@/lib/contracts";

// ─── Countdown ────────────────────────────────────────────────────────────────

function Countdown({ seconds }: { seconds: number }) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  if (seconds === 0) return <span className="text-arena-success font-bold">Distributing now!</span>;

  return (
    <div className="flex items-center gap-1 text-xs font-bold tabular-nums">
      {d > 0 && <><span className="text-arena-primary">{d}</span><span className="text-arena-muted">d </span></>}
      <span className="text-arena-primary">{pad(h)}</span>
      <span className="text-arena-muted">:</span>
      <span className="text-arena-primary">{pad(m)}</span>
      <span className="text-arena-muted">:</span>
      <span className="text-arena-primary">{pad(s)}</span>
    </div>
  );
}

// ─── Player Row ───────────────────────────────────────────────────────────────

const MEDALS = ["🥇", "🥈", "🥉"];
const RANK_WEIGHTS = [30, 20, 15, 10, 8, 6, 5, 3, 2, 1]; // % share per rank (top 10)

function PlayerRow({
  rank,
  address,
  points,
  isMe,
  estimatedReward,
}: {
  rank: number;
  address: string;
  points: number;
  isMe: boolean;
  estimatedReward: string;
}) {
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;
  const medal = rank <= 3 ? MEDALS[rank - 1] : `#${rank}`;

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
      isMe
        ? "bg-arena-primary/10 border border-arena-primary/30"
        : "bg-arena-surface border border-arena-border"
    }`}>
      <span className="text-base w-7 text-center shrink-0">{medal}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {short}
          {isMe && <span className="ml-1.5 text-xs text-arena-primary">(you)</span>}
        </p>
        <p className="text-xs text-arena-muted">{points} pts</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-arena-success font-semibold">~{estimatedReward}</p>
        <p className="text-xs text-arena-muted">USDT</p>
      </div>
    </div>
  );
}

// ─── Yield Card ───────────────────────────────────────────────────────────────

function YieldCard({
  totalPool,
  totalPrincipal,
  playerCount,
  yieldBps,
}: {
  totalPool: bigint;
  totalPrincipal: bigint;
  playerCount: number;
  yieldBps: number;
}) {
  const yield_    = totalPool > totalPrincipal ? totalPool - totalPrincipal : 0n;
  const toPlayers = (yield_ * BigInt(yieldBps)) / 10_000n;
  const toTreasury = yield_ - toPlayers;

  const fmt = (v: bigint) => parseFloat(formatUnits(v, 6)).toFixed(4);

  return (
    <div className="rounded-2xl bg-arena-surface border border-arena-border p-4 mb-4">
      <p className="text-xs text-arena-muted uppercase tracking-wider font-semibold mb-3">
        This Month's Pool
      </p>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-arena-bg rounded-xl p-2.5 border border-arena-border">
          <p className="text-arena-muted mb-0.5">Total Pool</p>
          <p className="font-bold text-sm text-white">{fmt(totalPool)} USDT</p>
          <p className="text-arena-muted mt-0.5">principal + yield</p>
        </div>
        <div className="bg-arena-bg rounded-xl p-2.5 border border-arena-border">
          <p className="text-arena-muted mb-0.5">Accrued Yield</p>
          <p className="font-bold text-sm text-arena-success">{fmt(yield_)} USDT</p>
          <p className="text-arena-muted mt-0.5">from Aave V3</p>
        </div>
        <div className="bg-arena-bg rounded-xl p-2.5 border border-arena-primary/20">
          <p className="text-arena-muted mb-0.5">→ Players ({yieldBps / 100}%)</p>
          <p className="font-bold text-sm text-arena-primary">{fmt(toPlayers)} USDT</p>
          <p className="text-arena-muted mt-0.5">top {Math.min(10, playerCount)} split</p>
        </div>
        <div className="bg-arena-bg rounded-xl p-2.5 border border-arena-border">
          <p className="text-arena-muted mb-0.5">→ Treasury ({(10000 - yieldBps) / 100}%)</p>
          <p className="font-bold text-sm text-amber-400">{fmt(toTreasury)} USDT</p>
          <p className="text-arena-muted mt-0.5">protocol / NIDO</p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Leaderboard() {
  const { address } = useAccount();

  // Contract reads
  const { data: monthData } = useReadContracts({
    contracts: [
      { address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI, functionName: "currentMonth" },
      { address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI, functionName: "totalPoolBalance" },
      { address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI, functionName: "currentYield" },
      { address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI, functionName: "secondsToMonthEnd" },
      { address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI, functionName: "yieldToPlayersBps" },
      { address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI, functionName: "totalPrincipal" },
      { address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI, functionName: "topRankCount" },
    ],
    query: { refetchInterval: 15_000 },
  });

  const currentMonth   = monthData?.[0]?.result as bigint  | undefined;
  const totalPool      = (monthData?.[1]?.result as bigint  | undefined) ?? 0n;
  const yieldAmt       = (monthData?.[2]?.result as bigint  | undefined) ?? 0n;
  const secsToEnd      = (monthData?.[3]?.result as bigint  | undefined) ?? 0n;
  const yieldBps       = Number((monthData?.[4]?.result as bigint | undefined) ?? 6000n);
  const totalPrincipal = (monthData?.[5]?.result as bigint  | undefined) ?? 0n;
  const topRankCount   = Number((monthData?.[6]?.result as bigint | undefined) ?? 10n);

  // Get players for current month
  const { data: rawPlayers } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi: ARENA_ABI,
    functionName: "monthPlayers",
    args: currentMonth !== undefined ? [currentMonth] : undefined,
    query: { enabled: currentMonth !== undefined, refetchInterval: 15_000 },
  });
  const players = (rawPlayers as `0x${string}`[] | undefined) ?? [];

  // Get points for each player
  const pointsContracts = players.map(p => ({
    address: ACTIVE_CONTRACTS.ArenaManager as `0x${string}`,
    abi: ARENA_ABI,
    functionName: "rankingPoints" as const,
    args: [currentMonth ?? 0n, p],
  }));
  const { data: rawPoints } = useReadContracts({
    contracts: pointsContracts,
    query: { enabled: players.length > 0 },
  });

  // Build sorted leaderboard
  const leaderboard = players
    .map((addr, i) => ({
      address: addr,
      points: Number((rawPoints?.[i]?.result as bigint | undefined) ?? 0n),
    }))
    .filter(p => p.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, topRankCount);

  const totalTopPoints = leaderboard.reduce((sum, p) => sum + p.points, 0);
  const toPlayers = (yieldAmt * BigInt(yieldBps)) / 10_000n;

  const estimatedReward = (pts: number) => {
    if (totalTopPoints === 0 || yieldAmt === 0n) return "0.0000";
    const share = (toPlayers * BigInt(pts)) / BigInt(totalTopPoints);
    return parseFloat(formatUnits(share, 6)).toFixed(4);
  };

  // My points
  const { data: myPts } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi: ARENA_ABI,
    functionName: "playerPoints",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });
  const myPoints = Number((myPts as bigint | undefined) ?? 0n);
  const myRank = leaderboard.findIndex(p => p.address.toLowerCase() === address?.toLowerCase()) + 1;

  return (
    <div className="flex flex-col min-h-screen bg-arena-bg px-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 pt-6 pb-4">
        <Link to="/" className="text-arena-muted text-xl">←</Link>
        <div className="flex-1">
          <h1 className="font-display text-arena-primary text-sm">LEADERBOARD</h1>
          <p className="text-xs text-arena-muted">
            Month #{currentMonth?.toString() ?? "—"} · PvP Ranking
          </p>
        </div>
        <Link to="/arena" className="text-xs text-arena-primary font-semibold px-3 py-1.5 rounded-xl bg-arena-primary/10">
          ⚔️ Battle
        </Link>
      </div>

      {/* Countdown */}
      <div className="rounded-2xl bg-arena-surface border border-arena-border p-3 mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-arena-muted">Distribution in</p>
          <Countdown seconds={Number(secsToEnd)} />
        </div>
        <div className="text-right">
          <p className="text-xs text-arena-muted">Aave V3 APY</p>
          <p className="text-sm font-bold text-arena-success">~4-6% 📈</p>
        </div>
      </div>

      {/* Yield Card */}
      <YieldCard
        totalPool={totalPool}
        totalPrincipal={totalPrincipal}
        playerCount={leaderboard.length}
        yieldBps={yieldBps}
      />

      {/* My rank banner */}
      {address && myPoints > 0 && (
        <div className="rounded-2xl bg-arena-accent/10 border border-arena-accent/30 p-3 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-arena-muted">Your rank</p>
            <p className="text-lg font-bold text-arena-accent">
              {myRank > 0 ? `#${myRank}` : "Unranked"}
            </p>
          </div>
          <div>
            <p className="text-xs text-arena-muted">Your points</p>
            <p className="text-lg font-bold">{myPoints} pts</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-arena-muted">Est. reward</p>
            <p className="text-sm font-bold text-arena-success">
              ~{estimatedReward(myPoints)} USDT
            </p>
          </div>
        </div>
      )}

      {address && myPoints === 0 && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 mb-4 text-center">
          <p className="text-xs text-amber-400">
            You have 0 points this month. Battle to earn your share of the yield! ⚔️
          </p>
        </div>
      )}

      {/* Leaderboard */}
      <p className="text-xs text-arena-muted uppercase tracking-wider mb-2 font-semibold">
        Top {topRankCount} Players
      </p>

      {leaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="text-5xl">🏆</span>
          <p className="text-arena-muted text-sm">No battles played this month yet.</p>
          <Link to="/arena"
            className="px-5 py-2.5 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm active:scale-95 transition-transform">
            Start Battling
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {leaderboard.map((entry, i) => (
            <PlayerRow
              key={entry.address}
              rank={i + 1}
              address={entry.address}
              points={entry.points}
              isMe={entry.address.toLowerCase() === address?.toLowerCase()}
              estimatedReward={estimatedReward(entry.points)}
            />
          ))}
        </div>
      )}

      {/* How rewards work */}
      <div className="mt-6 p-4 rounded-2xl bg-arena-surface border border-arena-border">
        <p className="text-xs font-semibold mb-2">💡 How Rewards Work</p>
        <div className="space-y-1.5 text-xs text-arena-muted">
          <p>• All 1 USDT entry fees are deposited into <span className="text-arena-primary">Aave V3</span> and earn yield automatically.</p>
          <p>• Every 30 days, <span className="text-arena-primary">60%</span> of the accumulated yield goes to the top {topRankCount} players.</p>
          <p>• Your share = <span className="text-white">your points / total top-{topRankCount} points × yield pool</span></p>
          <p>• Win: <span className="text-arena-success">+3 pts</span> · Lose: <span className="text-amber-400">+1 pt</span></p>
          <p>• The remaining <span className="text-amber-400">40%</span> goes to the protocol treasury (NIDO).</p>
          <p>• Your 1 USDT principal is <span className="text-arena-success">always withdrawable</span> — the game is zero-loss.</p>
        </div>
      </div>
    </div>
  );
}
