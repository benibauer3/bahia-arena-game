/**
 * CardHand.tsx — Touch-optimised card hand for MiniPay / mobile browsers.
 *
 * Layout:
 *  • 4 cards displayed in a horizontal scrollable row (snap-x).
 *  • Each card shows emoji, name, description, type badge and energy info.
 *  • Tapping a card toggles selection; max 2 cards can be selected per turn.
 *  • Ultimate card becomes tappable only when player has ≥ 3 energy.
 *  • Selected cards show a glowing ring matching the champion's border color.
 *  • Disabled (e.g. stunned, not enough energy) cards are grayed out.
 */

import { useMemo } from "react";
import type { Card } from "@/lib/championCards";
import { MAX_ENERGY } from "@/lib/championCards";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CardHandProps {
  cards:         [Card, Card, Card, Card];
  selected:      number[];            // card ids currently selected (0–3)
  energy:        number;              // current energy (0–3)
  maxSelect:     number;              // how many cards the player may still pick (1 or 2)
  isStunned:     boolean;             // if stunned, no card can be played
  isHalfTurn:    boolean;             // if halfTurn, maxSelect forced to 1
  onSelect:      (id: number) => void;
  disabled:      boolean;             // whole hand locked (e.g. waiting for opponent / resolving)
}

// ─── Type badge colours ───────────────────────────────────────────────────────

const TYPE_BADGE: Record<Card["type"], string> = {
  Attack:   "bg-red-900/70    text-red-300   border-red-500/40",
  Defense:  "bg-green-900/70  text-green-300 border-green-500/40",
  Heal:     "bg-blue-900/70   text-blue-300  border-blue-500/40",
  Ultimate: "bg-yellow-900/70 text-yellow-300 border-yellow-500/40",
};

// ─── Single Card ──────────────────────────────────────────────────────────────

interface CardTileProps {
  card:        Card;
  isSelected:  boolean;
  isDisabled:  boolean;
  onTap:       () => void;
}

function CardTile({ card, isSelected, isDisabled, onTap }: CardTileProps) {
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={isDisabled}
      className={`
        relative flex-shrink-0 w-36 h-48
        rounded-2xl border-2 overflow-hidden
        flex flex-col items-center justify-between
        p-3 text-left select-none
        transition-all duration-200 active:scale-95
        bg-gradient-to-b ${card.gradientFrom} ${card.gradientTo}
        ${isSelected
          ? `${card.borderColor} ring-2 ring-offset-1 ring-offset-arena-bg ${card.borderColor.replace("border-", "ring-")} scale-[1.04] shadow-lg`
          : "border-white/10 opacity-90"
        }
        ${isDisabled && !isSelected ? "opacity-40 grayscale cursor-not-allowed" : "cursor-pointer"}
      `}
      aria-pressed={isSelected}
      aria-label={`${card.name}: ${card.description}`}
    >
      {/* Energy badge */}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5">
        {card.energyCost > 0 ? (
          <span className="text-[10px] font-bold text-yellow-300 bg-yellow-900/70 rounded-full px-1.5 py-0.5 border border-yellow-500/40">
            ⚡{card.energyCost}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/70 rounded-full px-1.5 py-0.5 border border-emerald-500/40">
            +⚡
          </span>
        )}
      </div>

      {/* Emoji illustration */}
      <div className="text-5xl leading-none mt-1 drop-shadow-md">{card.emoji}</div>

      {/* Card info */}
      <div className="w-full space-y-1">
        {/* Type badge */}
        <span className={`text-[9px] font-bold uppercase tracking-wide border rounded-full px-1.5 py-0.5 ${TYPE_BADGE[card.type]}`}>
          {card.type}
        </span>

        {/* Card name */}
        <p className="text-white text-xs font-bold leading-tight line-clamp-1">
          {card.name}
        </p>

        {/* Card description */}
        <p className="text-white/70 text-[10px] leading-tight line-clamp-2">
          {card.description}
        </p>
      </div>

      {/* Selected glow overlay */}
      {isSelected && (
        <div className="absolute inset-0 rounded-2xl ring-inset ring-2 ring-white/20 pointer-events-none" />
      )}
    </button>
  );
}

// ─── Energy Bar ───────────────────────────────────────────────────────────────

function EnergyBar({ current, max }: { current: number; max: number }) {
  return (
    <div className="flex items-center gap-1 px-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`
            h-2.5 flex-1 rounded-full transition-all duration-300
            ${i < current ? "bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.7)]" : "bg-white/10"}
          `}
        />
      ))}
      <span className="ml-1 text-xs text-yellow-300 font-bold w-5 text-right">{current}/{max}</span>
    </div>
  );
}

// ─── CardHand ─────────────────────────────────────────────────────────────────

export default function CardHand({
  cards,
  selected,
  energy,
  maxSelect,
  isStunned,
  isHalfTurn,
  onSelect,
  disabled,
}: CardHandProps) {
  const effectiveMax = isHalfTurn ? 1 : maxSelect;

  // Work out which cards are tappable
  const cardDisabled = useMemo(
    () =>
      cards.map((card) => {
        if (disabled || isStunned)                              return true;
        if (card.energyCost > 0 && energy < card.energyCost)   return true;
        if (selected.includes(card.id))                        return false; // can always deselect
        if (selected.length >= effectiveMax)                   return true;
        return false;
      }),
    [cards, disabled, isStunned, energy, selected, effectiveMax],
  );

  return (
    <div className="space-y-2">
      {/* Energy bar */}
      <EnergyBar current={energy} max={MAX_ENERGY} />

      {/* Status hint */}
      {isStunned && (
        <p className="text-center text-xs text-yellow-400 font-semibold animate-pulse">
          💫 Stunned — no cards this turn
        </p>
      )}
      {isHalfTurn && !isStunned && (
        <p className="text-center text-xs text-orange-400 font-semibold">
          🌿 Entangled — max 1 card this turn
        </p>
      )}

      {/* Scroll container */}
      <div
        className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-1 px-1 scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {cards.map((card, idx) => (
          <div key={card.id} className="snap-center">
            <CardTile
              card={card}
              isSelected={selected.includes(card.id)}
              isDisabled={cardDisabled[idx]}
              onTap={() => onSelect(card.id)}
            />
          </div>
        ))}
      </div>

      {/* Selection count hint */}
      {!isStunned && !disabled && (
        <p className="text-center text-[11px] text-arena-muted">
          {selected.length === 0
            ? `Select up to ${effectiveMax} card${effectiveMax > 1 ? "s" : ""}`
            : `${selected.length} / ${effectiveMax} selected`}
        </p>
      )}
    </div>
  );
}
