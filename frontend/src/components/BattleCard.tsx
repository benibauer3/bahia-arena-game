import { formatUnits } from "viem";
import { type Battle, STATUS_LABEL } from "@/hooks/useBattle";

interface Props {
  battleId: bigint;
  battle:   Battle;
  onJoin?:  (battleId: bigint) => void;
  myAddress?: `0x${string}`;
}

const STATUS_COLOR: Record<number, string> = {
  0: "text-arena-success",
  1: "text-arena-primary",
  2: "text-arena-muted",
  3: "text-arena-danger",
};

export default function BattleCard({ battleId, battle, onJoin, myAddress }: Props) {
  const stakeFormatted = parseFloat(formatUnits(battle.stake ?? 0n, 18)).toFixed(2);
  const isOwn          = myAddress && battle.playerA.toLowerCase() === myAddress.toLowerCase();
  const isOpen         = battle.status === 0;

  const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

  return (
    <div className="rounded-2xl bg-arena-surface border border-arena-border p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-arena-muted">Batalha #{battleId.toString()}</span>
        <span className={`text-xs font-semibold ${STATUS_COLOR[battle.status]}`}>
          {STATUS_LABEL[battle.status as 0|1|2|3]}
        </span>
      </div>

      {/* Players */}
      <div className="flex items-center gap-2 text-sm">
        <span className="flex-1 text-center font-semibold truncate">{shortAddr(battle.playerA)}</span>
        <span className="text-arena-accent font-display text-xs">VS</span>
        <span className="flex-1 text-center text-arena-muted truncate">
          {battle.playerB !== "0x0000000000000000000000000000000000000000"
            ? shortAddr(battle.playerB)
            : "???"}
        </span>
      </div>

      {/* Stake */}
      <div className="flex items-center justify-center gap-1 text-arena-primary font-semibold">
        <span className="text-lg">💰</span>
        <span>{stakeFormatted} cUSD</span>
        <span className="text-arena-muted text-xs">/ jogador</span>
      </div>

      {/* CTA */}
      {isOpen && !isOwn && onJoin && (
        <button
          onClick={() => onJoin(battleId)}
          className="
            w-full py-3 rounded-xl font-semibold text-sm
            bg-arena-accent text-white
            active:scale-95 transition-transform
          "
        >
          ⚔️ Entrar na Batalha
        </button>
      )}
      {isOwn && isOpen && (
        <div className="text-center text-xs text-arena-muted py-1">
          Aguardando oponente…
        </div>
      )}
    </div>
  );
}
