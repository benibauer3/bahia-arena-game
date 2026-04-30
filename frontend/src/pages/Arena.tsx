import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Link } from "react-router-dom";
import { formatUnits } from "viem";
import { CHAMPIONS, ChampionClass } from "@/lib/champions";
import { ACTIVE_CONTRACTS, ARENA_ABI, ERC20_ABI } from "@/lib/contracts";
import ChampionCard from "@/components/ChampionCard";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Battle {
  playerA: `0x${string}`; playerB: `0x${string}`;
  classA: number; classB: number;
  stake: bigint; status: number; winner: `0x${string}`;
  createdAt: bigint; startedAt: bigint;
}
const STATUS_LABEL = ["Aberta", "Em Batalha", "Resolvida", "Cancelada"];
const STATUS_COLOR = ["text-arena-success","text-arena-primary","text-arena-muted","text-arena-danger"];

// ─── Champion Selector ────────────────────────────────────────────────────────
function ChampionSelector({ selected, onSelect }: { selected: ChampionClass | null; onSelect: (c: ChampionClass) => void }) {
  return (
    <div>
      <p className="text-xs text-arena-muted mb-2">Escolha seu campeão:</p>
      <div className="grid grid-cols-3 gap-2">
        {CHAMPIONS.map((c) => (
          <ChampionCard
            key={c.class}
            champion={c}
            size="sm"
            selected={selected === c.class}
            onClick={() => onSelect(c.class)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Create Battle Sheet ──────────────────────────────────────────────────────
function CreateBattleSheet({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [selectedClass, setSelectedClass] = useState<ChampionClass | null>(null);
  const [stakeInput, setStakeInput]       = useState("0");
  const [status, setStatus]               = useState<"idle"|"approving"|"creating"|"done"|"error">("idle");
  const [errMsg, setErrMsg]               = useState("");

  const approve  = useWriteContract();
  const create   = useWriteContract();

  const handleCreate = async () => {
    if (selectedClass === null) return;
    setStatus("idle"); setErrMsg("");
    const stakeNum = parseFloat(stakeInput) || 0;

    try {
      if (stakeNum > 0) {
        const stakeWei = BigInt(Math.round(stakeNum * 1e18));
        setStatus("approving");
        await approve.writeContractAsync({
          address: ACTIVE_CONTRACTS.usdt, abi: ERC20_ABI,
          functionName: "approve", args: [ACTIVE_CONTRACTS.ArenaManager, stakeWei],
        });
        setStatus("creating");
        await create.writeContractAsync({
          address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI,
          functionName: "createBattle", args: [selectedClass, stakeWei],
        });
      } else {
        setStatus("creating");
        await create.writeContractAsync({
          address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI,
          functionName: "createBattle", args: [selectedClass, 0n],
        });
      }
      setStatus("done");
      setTimeout(() => { onCreated(); onClose(); }, 800);
    } catch (e: any) { setErrMsg(e.shortMessage ?? e.message); setStatus("error"); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={onClose}>
      <div className="w-full bg-arena-surface rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-arena-border rounded-full mx-auto mb-4" />
        <h2 className="font-semibold text-base mb-4">⚔️ Criar Batalha</h2>

        <ChampionSelector selected={selectedClass} onSelect={setSelectedClass} />

        <div className="mt-4">
          <label className="text-xs text-arena-muted block mb-1">Stake extra (USDT) — opcional</label>
          <input
            type="number" value={stakeInput} min="0" step="0.5"
            onChange={e => setStakeInput(e.target.value)}
            className="w-full bg-arena-bg border border-arena-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-arena-primary"
            placeholder="0.00"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={selectedClass === null || status === "approving" || status === "creating"}
          className="mt-4 w-full py-3 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm disabled:opacity-50 active:scale-95 transition-transform"
        >
          {status === "approving" ? "Aprovando USDT…"
           : status === "creating" ? "Criando…"
           : status === "done" ? "✓ Criada!"
           : "Criar Batalha"}
        </button>
        {status === "error" && <p className="mt-2 text-xs text-arena-danger text-center">{errMsg}</p>}
      </div>
    </div>
  );
}

// ─── Join Battle Sheet ────────────────────────────────────────────────────────
function JoinBattleSheet({ battleId, battle, onClose, onJoined }: { battleId: bigint; battle: Battle; onClose: () => void; onJoined: () => void }) {
  const [selectedClass, setSelectedClass] = useState<ChampionClass | null>(null);
  const [status, setStatus]               = useState<"idle"|"approving"|"joining"|"done"|"error">("idle");
  const [errMsg, setErrMsg]               = useState("");
  const approve = useWriteContract();
  const join    = useWriteContract();

  const handleJoin = async () => {
    if (selectedClass === null) return;
    setErrMsg("");
    try {
      if (battle.stake > 0n) {
        setStatus("approving");
        await approve.writeContractAsync({
          address: ACTIVE_CONTRACTS.usdt, abi: ERC20_ABI,
          functionName: "approve", args: [ACTIVE_CONTRACTS.ArenaManager, battle.stake],
        });
      }
      setStatus("joining");
      await join.writeContractAsync({
        address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI,
        functionName: "joinBattle", args: [battleId, selectedClass],
      });
      setStatus("done");
      setTimeout(() => { onJoined(); onClose(); }, 800);
    } catch (e: any) { setErrMsg(e.shortMessage ?? e.message); setStatus("error"); }
  };

  const stakeFormatted = battle.stake > 0n ? parseFloat(formatUnits(battle.stake, 18)).toFixed(2) : "0";

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={onClose}>
      <div className="w-full bg-arena-surface rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-arena-border rounded-full mx-auto mb-4" />
        <h2 className="font-semibold text-base mb-1">⚔️ Batalha #{battleId.toString()}</h2>
        {battle.stake > 0n && (
          <p className="text-xs text-arena-muted mb-4">Stake: <span className="text-arena-primary font-semibold">{stakeFormatted} USDT</span> por jogador</p>
        )}

        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-arena-bg/50 border border-arena-border">
          <span className="text-2xl">{CHAMPIONS[battle.classA]?.emoji}</span>
          <div>
            <p className="text-xs text-arena-muted">Oponente usa</p>
            <p className="text-sm font-semibold">{CHAMPIONS[battle.classA]?.name} — {CHAMPIONS[battle.classA]?.role}</p>
          </div>
        </div>

        <ChampionSelector selected={selectedClass} onSelect={setSelectedClass} />

        <button
          onClick={handleJoin}
          disabled={selectedClass === null || status === "approving" || status === "joining"}
          className="mt-4 w-full py-3 rounded-xl bg-arena-accent text-white font-semibold text-sm disabled:opacity-50 active:scale-95 transition-transform"
        >
          {status === "approving" ? "Aprovando USDT…"
           : status === "joining" ? "Entrando…"
           : status === "done" ? "✓ Entrou!"
           : "Entrar na Batalha"}
        </button>
        {status === "error" && <p className="mt-2 text-xs text-arena-danger text-center">{errMsg}</p>}
      </div>
    </div>
  );
}

// ─── Battle Row ───────────────────────────────────────────────────────────────
function BattleRow({ battleId, battle, myAddress, onJoin }: { battleId: bigint; battle: Battle; myAddress?: string; onJoin: (id: bigint) => void }) {
  const champA   = CHAMPIONS[battle.classA];
  const stakeStr = battle.stake > 0n ? parseFloat(formatUnits(battle.stake, 18)).toFixed(2) + " USDT" : "Free";
  const isOwn    = myAddress?.toLowerCase() === battle.playerA.toLowerCase();

  return (
    <div className="rounded-2xl bg-arena-surface border border-arena-border p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-arena-muted">Batalha #{battleId.toString()}</span>
        <span className={`text-xs font-semibold ${STATUS_COLOR[battle.status]}`}>
          {STATUS_LABEL[battle.status]}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-3xl">{champA?.emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold">{champA?.name}</p>
          <p className="text-xs text-arena-muted">{battle.playerA.slice(0,6)}…{battle.playerA.slice(-4)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-arena-primary">{stakeStr}</p>
          <p className="text-xs text-arena-muted">/ jogador</p>
        </div>
      </div>

      {battle.status === 0 && !isOwn && (
        <button
          onClick={() => onJoin(battleId)}
          className="w-full py-2.5 rounded-xl bg-arena-accent text-white font-semibold text-sm active:scale-95 transition-transform"
        >
          ⚔️ Desafiar
        </button>
      )}
      {battle.status === 0 && isOwn && (
        <p className="text-center text-xs text-arena-muted">Aguardando oponente…</p>
      )}
    </div>
  );
}

// ─── Arena Page ────────────────────────────────────────────────────────────────
export default function Arena() {
  const { address, isConnected } = useAccount();
  const [showCreate, setShowCreate] = useState(false);
  const [joiningBattle, setJoiningBattle] = useState<{ id: bigint; battle: Battle } | null>(null);

  const { data: openData, refetch } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI,
    functionName: "getOpenBattles", args: [0n, 20n],
  });

  const { data: hasSet } = useReadContract({
    address: ACTIVE_CONTRACTS.BahiaChampion, abi: [
      { name: "hasChampionSet", type: "function", stateMutability: "view", inputs: [{ name: "player", type: "address" }], outputs: [{ type: "bool" }] },
    ],
    functionName: "hasChampionSet", args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const battles = openData ? { list: (openData as any)[0] as Battle[], ids: (openData as any)[1] as bigint[] } : null;

  return (
    <div className="flex flex-col min-h-screen bg-arena-bg px-4 pb-8">
      <div className="flex items-center justify-between pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-arena-muted text-xl">←</Link>
          <h1 className="font-display text-arena-primary text-sm">ARENA</h1>
        </div>
        {isConnected && hasSet && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-2 rounded-xl bg-arena-accent text-white text-xs font-semibold active:scale-95 transition-transform"
          >
            + Criar Batalha
          </button>
        )}
      </div>

      {!hasSet && isConnected && (
        <div className="rounded-2xl bg-arena-surface border border-amber-500/30 p-4 mb-4 text-center">
          <p className="text-sm text-amber-400 font-semibold mb-1">Nenhum campeão ativo</p>
          <p className="text-xs text-arena-muted mb-2">Deposite 1 USDT para receber seus 5 campeões.</p>
          <Link to="/roster" className="text-arena-primary underline text-xs">Ir para Campeões →</Link>
        </div>
      )}

      {!battles || battles.ids.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center py-16">
          <span className="text-5xl">🏜️</span>
          <p className="text-arena-muted text-sm">Nenhuma batalha aberta.</p>
          {hasSet && (
            <button onClick={() => setShowCreate(true)}
              className="px-5 py-3 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm active:scale-95 transition-transform">
              Criar a primeira batalha
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {battles.ids.map((id, i) => (
            <BattleRow
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
        <CreateBattleSheet
          onClose={() => setShowCreate(false)}
          onCreated={() => refetch()}
        />
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
