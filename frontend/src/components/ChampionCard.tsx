import { type ChampionDef, statPct } from "@/lib/champions";
import { ChampionArt } from "./ChampionArt";

interface Props {
  champion:  ChampionDef;
  selected?: boolean;
  locked?:   boolean;
  onClick?:  () => void;
  size?:     "sm" | "md" | "lg";
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-arena-muted text-xs w-8 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-arena-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${statPct(value, max)}%` }}
        />
      </div>
      <span className="text-xs font-semibold w-7 text-right">{value}</span>
    </div>
  );
}

export default function ChampionCard({ champion: c, selected, locked, onClick, size = "md" }: Props) {
  const isLg = size === "lg";
  const isSm = size === "sm";

  return (
    <div
      onClick={locked ? undefined : onClick}
      className={`
        relative rounded-2xl border bg-gradient-to-b ${c.color} ${c.borderColor}
        transition-all duration-200 select-none overflow-hidden
        ${onClick && !locked ? "cursor-pointer active:scale-95" : ""}
        ${selected ? "ring-2 ring-arena-primary ring-offset-1 ring-offset-arena-bg scale-105 shadow-lg shadow-arena-primary/20" : ""}
        ${locked ? "opacity-50 grayscale" : ""}
        ${isLg ? "p-4" : isSm ? "p-2" : "p-3"}
      `}
    >
      {/* Role badge */}
      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-arena-bg/60 backdrop-blur-sm text-arena-muted">
        {c.role}
      </div>

      {/* Champion Art */}
      <div className={`flex items-center justify-center mx-auto mb-2
        ${isLg ? "w-28 h-28" : isSm ? "w-14 h-14" : "w-20 h-20"}`}
      >
        <ChampionArt
          class_={c.class}
          size={isLg ? 112 : isSm ? 56 : 80}
          animated={!locked}
        />
      </div>

      {/* Name */}
      <p className={`font-semibold text-center mb-0.5 ${isLg ? "text-base" : isSm ? "text-xs" : "text-sm"}`}>
        {c.name}
      </p>

      {!isSm && (
        <>
          <div className="text-center mb-2">
            <span className="text-xs text-arena-primary font-semibold">✦ {c.abilityName}</span>
          </div>
          {isLg && (
            <p className="text-xs text-arena-muted mb-3 text-center leading-relaxed">
              {c.abilityDesc}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <StatBar label="HP"  value={c.maxHp}   max={200} color="bg-arena-success" />
            <StatBar label="ATK" value={c.attack}  max={55}  color="bg-arena-danger"  />
            <StatBar label="DEF" value={c.defense} max={45}  color="bg-arena-info"    />
            <StatBar label="SPD" value={c.speed}   max={35}  color="bg-arena-primary" />
          </div>
          {isLg && (
            <div className="mt-3 flex gap-2 justify-center text-xs text-arena-muted">
              <span>🎯 {c.critPct}% crit</span>
              <span>·</span>
              <span>💨 {c.dodgePct}% dodge</span>
            </div>
          )}
        </>
      )}

      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-arena-bg/40 rounded-2xl">
          <span className="text-xs text-arena-muted bg-arena-bg/80 px-2 py-1 rounded-lg">⚔️ In Battle</span>
        </div>
      )}
    </div>
  );
}
