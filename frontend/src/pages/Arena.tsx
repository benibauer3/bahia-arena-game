import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { Link, useNavigate } from "react-router-dom";
import { CHAMPIONS, ChampionClass } from "@/lib/champions";
import { ACTIVE_CONTRACTS, ARENA_ABI, CHAMPION_ABI } from "@/lib/contracts";
import { ChampionArt } from "@/components/ChampionArt";
import ChampionCard from "@/components/ChampionCard";

interface Battle {
  playerA: `0x${string}`; playerB: `0x${string}`;
  classA: number; classB: number;
  status: number; winner: `0x${string}`;
  createdAt: bigint; startedAt: bigint;
}

const STATUS_LABEL = ["Open", "In Battle", "Resolved", "Cancelled"];
const STATUS_COLOR = ["text-arena-success", "text-arena-primary", "text-purple-400", "text-arena-danger"];

// ─── Champion Selector ────────────────────────────────────────────────────────

function ChampionSelector({ selected, onSelect }: {
  selected: ChampionClass | null;
  onSelect: (c: ChampionClass) => void;
}) {
  return (
    <div>
      <p className="text-xs text-arena-muted mb-2">Choose your champion:</p>
      <div className="grid grid-cols-3 gap-2">
        {CHAMPIONS.map((c) => (
          <ChampionCard key={c.class} champion={c} size="sm"
            selected={selected === c.class} onClick={() => onSelect(c.class)} />
        ))}
      </div>
    </div>
  );
}

// ─── Create Battle Sheet ──────────────────────────────────────────────────────

function CreateBattleSheet({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [selectedClass, setSelectedClass] = useState<ChampionClass | null>(null);
  const [status, setStatus] = useState<"idle" | "creating" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const create = useWriteContract();

  const handleCreate = async () => {
    if (selectedClass === null) return;
    setErrMsg("");
    try {
      setStatus("creating");
      await create.writeContractAsync({
        address: ACTIVE_CONTRACTS.ArenaManager,
        abi: ARENA_ABI,
        functionName: "createBattle",
        args: [selectedClass],
      });
      setStatus("done");
      setTimeout(() => { onCreated(); onClose(); }, 700);
    } catch (e: any) { setErrMsg(e.shortMessage ?? e.message); setStatus("error"); }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end backdrop-blur-sm" onClick={onClose}>
      <div className="w-full bg-arena-surface rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto max-w-md mx-auto" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-arena-border rounded-full mx-auto mb-4" />
        <h2 className="font-semibold text-base mb-1">⚔️ New PvP Battle</h2>
        <p className="text-xs text-arena-muted mb-4">
          No stake required — battles earn <span className="text-arena-primary">ranking points</span> that determine your share of the monthly yield pool.
        </p>
        <ChampionSelector selected={selectedClass} onSelect={setSelectedClass} />
        <button
          onClick={handleCreate}
          disabled={selectedClass === null || status === "creating"}
          className="mt-4 w-full py-3 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm disabled:opacity-50 active:scale-95 transition-transform"
        >
          {status === "creating" ? "Creating…" : status === "done" ? "✓ Battle Created!" : "Create Battle"}
        </button>
        {status === "error" && <p className="mt-2 text-xs text-arena-danger text-center">{errMsg}</p>}
      </div>
    </div>
  );
}

// ─── Join Battle Sheet ────────────────────────────────────────────────────────

function JoinBattleSheet({ battleId, battle, onClose, onJoined }: {
  battleId: bigint; battle: Battle; onClose: () => void; onJoined: () => void;
}) {
  const [selectedClass, setSelectedClass] = useState<ChampionClass | null>(null);
  const [status, setStatus]  = useState<"idle" | "joining" | "done" | "error">("idle");
  const [errMsg, setErrMsg]  = useState("");
  const navigate = useNavigate();
  const join = useWriteContract();

  const handleJoin = async () => {
    if (selectedClass === null) return;
    setErrMsg("");
    try {
      setStatus("joining");
      await join.writeContractAsync({
        address: ACTIVE_CONTRACTS.ArenaManager,
        abi: ARENA_ABI,
        functionName: "joinBattle",
        args: [battleId, selectedClass],
      });
      setStatus("done");
      setTimeout(() => {
        onJoined();
        onClose();
        navigate(`/battle/${battleId.toString()}`);
      }, 500);
    } catch (e: any) { setErrMsg(e.shortMessage ?? e.message); setStatus("error"); }
  };

  const oppChampion = CHAMPIONS[battle.classA];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end backdrop-blur-sm" onClick={onClose}>
      <div className="w-full bg-arena-surface rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto max-w-md mx-auto" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-arena-border rounded-full mx-auto mb-4" />
        <h2 className="font-semibold text-base mb-1">⚔️ Battle #{battleId.toString()}</h2>
        <p className="text-xs text-arena-muted mb-4">
          PvP — winner earns <span className="text-arena-primary font-semibold">+3 pts</span>, loser earns <span className="text-amber-400 font-semibold">+1 pt</span> toward monthly yield.
        </p>
        <div className={`flex items-center gap-3 mb-4 p-3 rounded-xl bg-arena-bg/50 border ${oppChampion?.borderColor ?? "border-arena-border"}`}>
          <ChampionArt class_={battle.classA as ChampionClass} size={48} animated={false} />
          <div>
            <p className="text-xs text-arena-muted">Opponent plays</p>
            <p className="text-sm font-semibold">{oppChampion?.name} — {oppChampion?.role}</p>
            <p className="text-xs text-arena-muted">{oppChampion?.abilityName}</p>
          </div>
        </div>
        <ChampionSelector selected={selectedClass} onSelect={setSelectedClass} />
        <button
          onClick={handleJoin}
          disabled={selectedClass === null || status !== "idle"}
          className="mt-4 w-full py-3 rounded-xl bg-arena-accent text-white font-semibold text-sm disabled:opacity-50 active:scale-95 transition-transform"
        >
          {status === "joining" ? "Joining…" : status === "done" ? "✓ Joined! Loading battle…" : "⚔️ Challenge!"}
        </button>
        {status === "error" && <p className="mt-2 text-xs text-arena-danger text-center">{errMsg}</p>}
      </div>
    </div>
  );
}

// ─── Battle Card ──────────────────────────────────────────────────────────────

function BattleCard({ battleId, battle, myAddress, onJoin }: {
  battleId: bigint; battle: Battle; myAddress?: string; onJoin: (id: bigint) => void;
}) {
  const navigate = useNavigate();
  const champA = CHAMPIONS[battle.classA];
  const champB = battle.status > 0 ? CHAMPIONS[battle.classB] : null;
  const isOwn  = myAddress?.toLowerCase() === battle.playerA.toLowerCase();
  const short  = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
  const isParticipant = myAddress && (
    myAddress.toLowerCase() === battle.playerA.toLowerCase() ||
    myAddress.toLowerCase() === battle.playerB.toLowerCase()
  );

  return (
    <div className="rounded-2xl bg-arena-surface border border-arena-border p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-arena-muted">Battle #{battleId.toString()}</span>
        <span className={`text-xs font-semibold ${STATUS_COLOR[battle.status]}`}>
          {STATUS_LABEL[battle.status]}
        </span>
      </div>

      {/* Champions row */}
      <div className="flex items-center gap-2">
        {/* Player A */}
        <div className="flex items-center gap-2 flex-1">
          <ChampionArt class_={battle.classA as ChampionClass} size={40} animated={false} />
          <div>
            <p className="text-xs font-semibold">{champA?.name}</p>
            <p className="text-xs text-arena-muted">{short(battle.playerA)}</p>
          </div>
        </div>

        {/* VS or winner */}
        <div className="text-center px-2">
          {battle.status === 2 ? (
            <span className="text-xs text-purple-400 font-bold">DONE</span>
          ) : battle.status === 1 ? (
            <span className="text-xs text-arena-primary font-bold animate-pulse">VS</span>
          ) : (
            <span className="text-xs text-arena-muted">VS</span>
          )}
        </div>

        {/* Player B */}
        {champB && battle.playerB !== "0x0000000000000000000000000000000000000000" ? (
          <div className="flex items-center gap-2 flex-1 justify-end">
            <div className="text-right">
              <p className="text-xs font-semibold">{champB?.name}</p>
              <p className="text-xs text-arena-muted">{short(battle.playerB)}</p>
            </div>
            <ChampionArt class_={battle.classB as ChampionClass} size={40} animated={false} />
          </div>
        ) : (
          <div className="flex-1 flex justify-end">
            <div className="w-10 h-10 rounded-xl border-2 border-dashed border-arena-border flex items-center justify-center text-arena-muted">
              ?
            </div>
          </div>
        )}
      </div>

      {/* Winner banner */}
      {battle.status === 2 && battle.winner !== "0x0000000000000000000000000000000000000000" && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-1.5 text-center">
          <p className="text-xs text-purple-400">
            🏆 Winner: {short(battle.winner)}
            {myAddress?.toLowerCase() === battle.winner.toLowerCase() && " (You!)"}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {/* Join button (open + not own) */}
        {battle.status === 0 && !isOwn && (
          <button
            onClick={() => onJoin(battleId)}
            className="flex-1 py-2.5 rounded-xl bg-arena-accent text-white font-semibold text-xs active:scale-95 transition-transform"
          >
            ⚔️ Challenge
          </button>
        )}

        {/* Waiting text (open + own) */}
        {battle.status === 0 && isOwn && (
          <p className="flex-1 text-center text-xs text-arena-muted py-2.5">
            Waiting for opponent…
          </p>
        )}

        {/* Go to battle (active + participant) */}
        {battle.status === 1 && isParticipant && (
          <button
            onClick={() => navigate(`/battle/${battleId.toString()}`)}
            className="flex-1 py-2.5 rounded-xl bg-arena-primary text-arena-bg font-semibold text-xs active:scale-95 transition-transform"
          >
            ⚔️ Go to Battle!
          </button>
        )}

        {/* View button for resolved */}
        {battle.status === 2 && (
          <button
            onClick={() => navigate(`/battle/${battleId.toString()}`)}
            className="flex-1 py-2.5 rounded-xl bg-arena-surface border border-arena-border text-xs font-semibold active:scale-95 transition-transform"
          >
            View Replay
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Arena Page ──────────────────────────────────────────────────────────

export default function Arena() {
  const { address, isConnected } = useAccount();
  const [showCreate, setShowCreate]       = useState(false);
  const [joiningBattle, setJoiningBattle] = useState<{ id: bigint; battle: Battle } | null>(null);

  const { data: openData, refetch } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi: ARENA_ABI,
    functionName: "getOpenBattles",
    args: [0n, 20n],
    query: { refetchInterval: 8_000 },
  });

  const { data: hasSet } = useReadContract({
    address: ACTIVE_CONTRACTS.BahiaChampion,
    abi: CHAMPION_ABI,
    functionName: "hasChampionSet",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Also fetch active battles (to show "Go to Battle" for user's active battles)
  const { data: activeBattleId } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager,
    abi: ARENA_ABI,
    functionName: "playerActiveBattle",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 8_000 },
  });

  const myActiveBattleId = activeBattleId ? (activeBattleId as bigint) - 1n : null;

  const battles = openData
    ? { list: (openData as any)[0] as Battle[], ids: (openData as any)[1] as bigint[] }
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-arena-bg px-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-6 pb-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-arena-muted text-xl">←</Link>
          <div>
            <h1 className="font-display text-arena-primary text-sm">ARENA</h1>
            <p className="text-xs text-arena-muted">PvP · Yield-backed ranking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/leaderboard"
            className="px-2.5 py-1.5 rounded-xl bg-arena-surface border border-arena-border text-xs font-semibold active:scale-95 transition-transform">
            🏆 Rank
          </Link>
          {isConnected && hasSet && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-3 py-1.5 rounded-xl bg-arena-accent text-white text-xs font-semibold active:scale-95 transition-transform"
            >
              + Battle
            </button>
          )}
        </div>
      </div>

      {/* No champions banner */}
      {!hasSet && isConnected && (
        <div className="rounded-2xl bg-arena-surface border border-amber-500/30 p-4 mb-4 text-center">
          <p className="text-sm text-amber-400 font-semibold mb-1">No active champions</p>
          <p className="text-xs text-arena-muted mb-2">Deposit 1 USDT to receive your 5 champions & join the yield pool.</p>
          <Link to="/roster" className="text-arena-primary underline text-xs">Get Champions →</Link>
        </div>
      )}

      {/* Active battle call-to-action */}
      {myActiveBattleId !== null && myActiveBattleId >= 0n && (
        <Link
          to={`/battle/${myActiveBattleId.toString()}`}
          className="flex items-center gap-3 p-3 rounded-2xl bg-arena-primary/10 border border-arena-primary/30 mb-4 active:scale-95 transition-transform"
        >
          <div className="w-2 h-2 rounded-full bg-arena-primary animate-ping" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-arena-primary">You have an active battle!</p>
            <p className="text-xs text-arena-muted">Battle #{myActiveBattleId.toString()} — tap to resolve ⚔️</p>
          </div>
          <span className="text-arena-primary text-lg">→</span>
        </Link>
      )}

      {/* How PvP works */}
      <div className="rounded-xl bg-arena-surface border border-arena-border p-3 mb-4 flex items-start gap-3">
        <span className="text-lg shrink-0">💡</span>
        <p className="text-xs text-arena-muted leading-relaxed">
          <span className="text-white font-semibold">PvP Mode: </span>
          No stakes per battle. All 1 USDT entry fees earn yield on <span className="text-arena-primary">Aave V3</span>.
          Win battles to climb the leaderboard and claim your share of the monthly yield pool!
        </p>
      </div>

      {/* Battle list */}
      {!battles || battles.ids.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center py-16">
          <span className="text-5xl">🏜️</span>
          <p className="text-arena-muted text-sm">No open battles right now.</p>
          {hasSet && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-3 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm active:scale-95 transition-transform"
            >
              Create the first battle
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-arena-muted uppercase tracking-wider font-semibold">
            Open Challenges ({battles.ids.length})
          </p>
          {battles.ids.map((id, i) => (
            <BattleCard
              key={id.toString()}
              battleId={id}
              battle={battles.list[i]}
              myAddress={address}
              onJoin={(bid) => setJoiningBattle({ id: bid, battle: battles.list[i] })}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateBattleSheet onClose={() => setShowCreate(false)} onCreated={() => refetch()} />
      )}
      {joiningBattle && (
        <JoinBattleSheet
          battleId={joiningBattle.id}
          battle={joiningBattle.battle}
          onClose={() => setJoiningBattle(null)}
          onJoined={() => refetch()}
        />
      )}
    </div>
  );
}
