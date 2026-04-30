import { useState } from "react";
import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
import { formatUnits } from "viem";
import BattleCard from "@/components/BattleCard";
import CreatureCard from "@/components/CreatureCard";
import { useOpenBattles, useCreateBattle, useJoinBattle } from "@/hooks/useBattle";
import { useOwnedTokenIds, useCreatureStats } from "@/hooks/useCreatures";

// ─── Creature picker for join/create flow ─────────────────────────────────────
function CreaturePicker({ onPick }: { onPick: (id: bigint) => void }) {
  const { data: ids } = useOwnedTokenIds();
  const [sel, setSel] = useState<bigint | null>(null);

  if (!ids || (ids as bigint[]).length === 0) {
    return (
      <p className="text-center text-arena-muted text-sm py-4">
        Você não tem criaturas. <Link to="/roster" className="text-arena-primary underline">Minte uma!</Link>
      </p>
    );
  }

  return (
    <div>
      <p className="text-xs text-arena-muted mb-2">Escolha sua criatura:</p>
      <div className="grid grid-cols-2 gap-2 mb-3 max-h-56 overflow-y-auto">
        {(ids as bigint[]).map((id) => (
          <CreaturePickerItem key={id.toString()} tokenId={id} selected={sel === id} onSelect={setSel} />
        ))}
      </div>
      <button
        disabled={sel === null}
        onClick={() => sel !== null && onPick(sel)}
        className="w-full py-3 rounded-xl bg-arena-accent text-white font-semibold text-sm disabled:opacity-50 active:scale-95 transition-transform"
      >
        Confirmar Criatura
      </button>
    </div>
  );
}

function CreaturePickerItem({
  tokenId, selected, onSelect,
}: { tokenId: bigint; selected: boolean; onSelect: (id: bigint) => void }) {
  const { data: stats } = useCreatureStats(tokenId);
  if (!stats) return <div className="h-28 rounded-xl bg-arena-border animate-pulse" />;
  return <CreatureCard tokenId={tokenId} stats={stats as any} selected={selected} onClick={() => onSelect(tokenId)} compact />;
}

// ─── Create Battle Modal ──────────────────────────────────────────────────────
function CreateBattleModal({ onClose }: { onClose: () => void }) {
  const [step, setStep]       = useState<"creature"|"stake"|"confirm">("creature");
  const [creature, setCreature] = useState<bigint | null>(null);
  const [stakeInput, setStake] = useState("0.5");
  const [errMsg, setErrMsg]   = useState("");
  const { submit, createAfterApproval, isApproving, isCreating, error } = useCreateBattle();

  const handleCreate = async () => {
    if (!creature) return;
    setErrMsg("");
    try {
      const { stakeWei } = await submit(creature, stakeInput);
      await createAfterApproval(creature, stakeWei);
      onClose();
    } catch (e: any) {
      setErrMsg(e.shortMessage ?? e.message ?? "Erro");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-arena-surface rounded-t-3xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-arena-border rounded-full mx-auto mb-4" />
        <h2 className="font-semibold text-base mb-4">⚔️ Criar Batalha</h2>

        {step === "creature" && (
          <CreaturePicker onPick={(id) => { setCreature(id); setStep("stake"); }} />
        )}

        {step === "stake" && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-arena-muted block mb-1">Stake (cUSD)</label>
              <input
                type="number"
                value={stakeInput}
                onChange={(e) => setStake(e.target.value)}
                min="0.1"
                step="0.1"
                className="w-full bg-arena-bg border border-arena-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-arena-primary"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={isApproving || isCreating}
              className="w-full py-3 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm disabled:opacity-60 active:scale-95 transition-transform"
            >
              {isApproving ? "Aprovando cUSD…" : isCreating ? "Criando batalha…" : "Criar Batalha"}
            </button>
            {(errMsg || error) && (
              <p className="text-xs text-arena-danger text-center">{errMsg || (error as any)?.shortMessage}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Arena Page ────────────────────────────────────────────────────────────────
export default function Arena() {
  const { address, isConnected } = useAccount();
  const { data: openBattlesData, refetch } = useOpenBattles();
  const [showCreate, setShowCreate] = useState(false);
  const [joiningId, setJoiningId]   = useState<bigint | null>(null);
  const { submit: joinSubmit, isLoading: isJoining } = useJoinBattle();

  const battles = openBattlesData
    ? { list: (openBattlesData as any)[0], ids: (openBattlesData as any)[1] }
    : null;

  const handleJoin = (battleId: bigint) => setJoiningId(battleId);

  return (
    <div className="flex flex-col min-h-screen bg-arena-bg px-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-arena-muted text-xl">←</Link>
          <h1 className="font-display text-arena-primary text-sm">ARENA</h1>
        </div>
        {isConnected && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-2 rounded-xl bg-arena-accent text-white text-xs font-semibold active:scale-95 transition-transform"
          >
            + Criar Batalha
          </button>
        )}
      </div>

      {/* Open battles list */}
      {!battles || battles.ids.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center py-16">
          <span className="text-5xl">🏜️</span>
          <p className="text-arena-muted text-sm">Nenhuma batalha aberta no momento.</p>
          {isConnected && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-3 rounded-xl bg-arena-primary text-arena-bg font-semibold text-sm active:scale-95 transition-transform"
            >
              Criar a primeira batalha
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {battles.ids.map((id: bigint, i: number) => (
            <BattleCard
              key={id.toString()}
              battleId={id}
              battle={battles.list[i]}
              onJoin={isConnected ? handleJoin : undefined}
              myAddress={address}
            />
          ))}
        </div>
      )}

      {/* Join battle sheet */}
      {joiningId !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end" onClick={() => setJoiningId(null)}>
          <div className="w-full bg-arena-surface rounded-t-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-arena-border rounded-full mx-auto mb-4" />
            <h2 className="font-semibold text-base mb-4">⚔️ Entrar na Batalha #{joiningId.toString()}</h2>
            <CreaturePicker
              onPick={async (creatureId) => {
                const battleData = battles?.list[battles.ids.findIndex((id: bigint) => id === joiningId)];
                if (!battleData) return;
                try {
                  await joinSubmit(joiningId, creatureId, battleData.stake);
                  setJoiningId(null);
                  refetch();
                } catch (e: any) {
                  alert(e.shortMessage ?? e.message);
                }
              }}
            />
          </div>
        </div>
      )}

      {showCreate && <CreateBattleModal onClose={() => { setShowCreate(false); refetch(); }} />}
    </div>
  );
}
