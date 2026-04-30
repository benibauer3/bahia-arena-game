// Legacy creature hooks — superseded by ChampionCard + champions.ts (v2).
// Kept only for the ELEMENT_* constants used by CreatureCard.tsx.

export const ELEMENT_NAMES  = ["Fogo", "Água", "Terra", "Vento", "Raio"] as const;
export const ELEMENT_EMOJIS = ["🔥", "💧", "🌍", "🌀", "⚡"] as const;
export const ELEMENT_COLORS = [
  "text-element-fire",
  "text-element-water",
  "text-element-earth",
  "text-element-wind",
  "text-element-lightning",
] as const;

export interface CreatureStats {
  hp: number; attack: number; defense: number;
  speed: number; level: number; element: number; inBattle: boolean;
}
