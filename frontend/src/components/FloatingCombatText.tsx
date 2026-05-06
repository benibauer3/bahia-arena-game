/**
 * FloatingCombatText.tsx
 *
 * Floating damage / heal / shield numbers that animate upward and fade.
 * Positioned ABSOLUTELY inside its parent — parent must be `position: relative`.
 * Parent should be `overflow-visible` so numbers can float above the champion.
 *
 * Items are removed via `onRemove(id)` on `onAnimationEnd` so the parent
 * clears state once the CSS animation finishes (0.9 s).
 */

export interface FloatItem {
  id:    string;
  label: string;
  type:  "damage" | "heal" | "shield" | "ultimate" | "status";
}

interface Props {
  items:    FloatItem[];
  onRemove: (id: string) => void;
}

const ITEM_CLASS: Record<FloatItem["type"], string> = {
  damage:   "text-red-400   font-black text-xl  drop-shadow-[0_1px_4px_rgba(0,0,0,1)]",
  heal:     "text-emerald-400 font-bold text-base drop-shadow-[0_1px_4px_rgba(0,0,0,1)]",
  shield:   "text-cyan-300  font-bold text-base drop-shadow-[0_1px_4px_rgba(0,0,0,1)]",
  ultimate: "text-yellow-300 font-black text-xl drop-shadow-[0_1px_8px_rgba(246,201,14,0.8)]",
  status:   "text-yellow-400 font-semibold text-sm drop-shadow-[0_1px_4px_rgba(0,0,0,1)]",
};

// Staggered horizontal spread so multiple events don't perfectly overlap
const SLOTS = ["10%", "38%", "62%", "24%", "50%", "75%"];

export default function FloatingCombatText({ items, onRemove }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
      {items.map((item, idx) => (
        <span
          key={item.id}
          className={`absolute animate-float-up select-none whitespace-nowrap ${ITEM_CLASS[item.type]}`}
          style={{
            left:   SLOTS[idx % SLOTS.length],
            bottom: "40%",
          }}
          onAnimationEnd={() => onRemove(item.id)}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}
