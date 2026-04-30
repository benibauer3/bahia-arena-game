import { ELEMENT_NAMES, ELEMENT_EMOJIS, type CreatureStats } from "@/hooks/useCreatures";

interface Props {
  tokenId:   bigint;
  stats:     CreatureStats;
  selected?: boolean;
  onClick?:  () => void;
  compact?:  boolean;
}

const ELEMENT_BG = [
  "from-element-fire/20   border-element-fire/40",
  "from-element-water/20  border-element-water/40",
  "from-element-earth/20  border-element-earth/40",
  "from-element-wind/20   border-element-wind/40",
  "from-element-lightning/20 border-element-lightning/40",
] as const;

export default function CreatureCard({ tokenId, stats, selected, onClick, compact }: Props) {
  const el = stats.element ?? 0;

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl border bg-gradient-to-b to-arena-surface/80 p-3
        transition-all duration-200 select-none
        ${ELEMENT_BG[el]}
        ${onClick ? "cursor-pointer active:scale-95" : ""}
        ${selected ? "ring-2 ring-arena-primary ring-offset-1 ring-offset-arena-bg scale-105" : ""}
        ${compact ? "p-2" : "p-3"}
      `}
    >
      {/* Element badge */}
      <div className="absolute top-2 right-2 text-lg">
        {ELEMENT_EMOJIS[el]}
      </div>

      {/* Creature placeholder art */}
      <div className="w-full aspect-square rounded-xl bg-arena-border/50 flex items-center justify-center mb-2 overflow-hidden">
        <span className="text-4xl animate-float">{ELEMENT_EMOJIS[el]}</span>
      </div>

      {/* ID & level */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-arena-muted font-body">#{tokenId.toString()}</span>
        <span className="text-xs font-semibold text-arena-primary">Lv.{stats.level}</span>
      </div>

      <p className="text-sm font-semibold text-white mb-2 truncate">
        {ELEMENT_NAMES[el]} #{tokenId.toString().padStart(4, "0")}
      </p>

      {!compact && (
        <div className="grid grid-cols-2 gap-1 text-xs">
          <Stat label="HP"  value={stats.hp}      color="text-arena-success" />
          <Stat label="ATK" value={stats.attack}   color="text-arena-danger"  />
          <Stat label="DEF" value={stats.defense}  color="text-arena-info"    />
          <Stat label="SPD" value={stats.speed}    color="text-arena-primary" />
        </div>
      )}

      {stats.inBattle && (
        <div className="mt-2 text-center text-xs font-semibold text-arena-accent">
          ⚔️ Em Batalha
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex justify-between items-center bg-arena-bg/50 rounded px-1.5 py-0.5">
      <span className="text-arena-muted">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}
