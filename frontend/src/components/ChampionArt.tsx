/**
 * Champion Art — unique caricature/chibi SVG avatars for each champion.
 * Built with SVG + CSS animations, no external assets needed.
 * ViewBox 0 0 120 120, chibi proportions: big head, bold silhouettes.
 */

import { ChampionClass } from "@/lib/champions";

interface ArtProps { size?: number; animated?: boolean }

// ─── Curupira — Forest Tank ───────────────────────────────────────────────────
// Iconic: backwards feet, wild orange/red spiked hair, green skin, red glowing eyes

export function CurupiraArt({ size = 120, animated = true }: ArtProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <radialGradient id="curu-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#0f4a1f"/>
          <stop offset="100%" stopColor="#052e16"/>
        </radialGradient>
        <radialGradient id="curu-eye-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#ef4444" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
        </radialGradient>
        <filter id="curu-glow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <circle cx="60" cy="60" r="58" fill="url(#curu-bg)"/>
      <circle cx="60" cy="60" r="58" fill="none" stroke="#16a34a" strokeWidth="1.5" strokeDasharray="4 2"/>

      {/* ── WILD SPIKED HAIR (very large, top of circle) ── */}
      {/* Center spikes radiating up */}
      <ellipse cx="60"  cy="16" rx="7"  ry="18" fill="#ea580c"/>
      <ellipse cx="60"  cy="16" rx="4"  ry="18" fill="#f97316"/>
      <ellipse cx="44"  cy="18" rx="6"  ry="16" fill="#ea580c" transform="rotate(-18 44 18)"/>
      <ellipse cx="44"  cy="18" rx="3"  ry="16" fill="#f97316" transform="rotate(-18 44 18)"/>
      <ellipse cx="76"  cy="18" rx="6"  ry="16" fill="#ea580c" transform="rotate(18 76 18)"/>
      <ellipse cx="76"  cy="18" rx="3"  ry="16" fill="#f97316" transform="rotate(18 76 18)"/>
      <ellipse cx="30"  cy="26" rx="6"  ry="14" fill="#c2410c" transform="rotate(-35 30 26)"/>
      <ellipse cx="30"  cy="26" rx="3"  ry="14" fill="#ea580c" transform="rotate(-35 30 26)"/>
      <ellipse cx="90"  cy="26" rx="6"  ry="14" fill="#c2410c" transform="rotate(35 90 26)"/>
      <ellipse cx="90"  cy="26" rx="3"  ry="14" fill="#ea580c" transform="rotate(35 90 26)"/>
      <ellipse cx="18"  cy="38" rx="5"  ry="12" fill="#b45309" transform="rotate(-55 18 38)"/>
      <ellipse cx="102" cy="38" rx="5"  ry="12" fill="#b45309" transform="rotate(55 102 38)"/>

      {/* HEAD */}
      <circle cx="60" cy="48" r="22" fill="#22c55e"/>
      {/* Slight darker shading on top for depth */}
      <ellipse cx="60" cy="40" rx="18" ry="10" fill="#16a34a" opacity="0.4"/>

      {/* EYES — red glowing */}
      <circle cx="51" cy="46" r="6" fill="#ff0000" filter="url(#curu-glow)"/>
      <circle cx="69" cy="46" r="6" fill="#ff0000" filter="url(#curu-glow)"/>
      <circle cx="51" cy="46" r="3.5" fill="#dc2626"/>
      <circle cx="69" cy="46" r="3.5" fill="#dc2626"/>
      <circle cx="52" cy="44.5" r="1.5" fill="white" opacity="0.9"/>
      <circle cx="70" cy="44.5" r="1.5" fill="white" opacity="0.9"/>
      {/* Eye glow rings */}
      {animated && <>
        <circle cx="51" cy="46" r="8" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.7">
          <animate attributeName="r" values="7;10;7" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="69" cy="46" r="8" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.7">
          <animate attributeName="r" values="7;10;7" dur="2.3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.3s" repeatCount="indefinite"/>
        </circle>
      </>}

      {/* Nose */}
      <ellipse cx="60" cy="53" rx="2.5" ry="2" fill="#15803d"/>

      {/* Big grin with teeth */}
      <path d="M50 59 Q60 67 70 59" fill="#14532d" stroke="#14532d" strokeWidth="1"/>
      <path d="M52 59 L52 63 M57 61 L57 65 M63 61 L63 65 M68 59 L68 63"
        stroke="#f0fdf4" strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>

      {/* BODY — stocky oval */}
      <ellipse cx="60" cy="82" rx="20" ry="24" fill="#15803d"/>
      {/* Tribal body paint */}
      <path d="M46 76 L50 82 M54 73 L54 80 M66 73 L66 80 M70 76 L74 82"
        stroke="#166534" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      {/* Bark armor chest */}
      <rect x="47" y="75" width="26" height="18" rx="3" fill="#14532d" opacity="0.7"/>
      <path d="M47 82 L73 82" stroke="#22c55e" strokeWidth="0.8" opacity="0.4"/>
      <path d="M47 88 L73 88" stroke="#22c55e" strokeWidth="0.8" opacity="0.4"/>

      {/* Arms */}
      <ellipse cx="37" cy="78" rx="8" ry="14" fill="#22c55e" transform="rotate(15 37 78)"/>
      <ellipse cx="83" cy="78" rx="8" ry="14" fill="#22c55e" transform="rotate(-15 83 78)"/>

      {/* Left arm holding glowing vine/staff */}
      <line x1="32" y1="82" x2="22" y2="100" stroke="#166534" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="20" cy="103" rx="4" ry="8" fill="#22c55e" opacity="0.8">
        {animated && <animate attributeName="opacity" values="0.8;0.4;0.8" dur="1.5s" repeatCount="indefinite"/>}
      </ellipse>

      {/* ── BACKWARDS FEET — large and obvious, toes pointing toward viewer ── */}
      {/* Left foot — rotated 180° so toes point backward (toward camera) */}
      <g transform="rotate(180 43 103)">
        <ellipse cx="43" cy="103" rx="13" ry="7" fill="#f59e0b"/>
        {/* Toes (now pointing "backward" = toward viewer after rotation) */}
        <ellipse cx="34" cy="100" rx="4"  ry="3" fill="#fbbf24"/>
        <ellipse cx="38" cy="97"  rx="3.5" ry="2.5" fill="#fbbf24"/>
        <ellipse cx="43" cy="96"  rx="3.5" ry="2.5" fill="#fbbf24"/>
        <ellipse cx="48" cy="97"  rx="3.5" ry="2.5" fill="#fbbf24"/>
        <ellipse cx="52" cy="100" rx="4"  ry="3" fill="#fbbf24"/>
      </g>
      {/* Right foot — rotated 180° */}
      <g transform="rotate(180 77 103)">
        <ellipse cx="77" cy="103" rx="13" ry="7" fill="#f59e0b"/>
        <ellipse cx="68" cy="100" rx="4"  ry="3" fill="#fbbf24"/>
        <ellipse cx="72" cy="97"  rx="3.5" ry="2.5" fill="#fbbf24"/>
        <ellipse cx="77" cy="96"  rx="3.5" ry="2.5" fill="#fbbf24"/>
        <ellipse cx="82" cy="97"  rx="3.5" ry="2.5" fill="#fbbf24"/>
        <ellipse cx="86" cy="100" rx="4"  ry="3" fill="#fbbf24"/>
      </g>
      {/* Legs */}
      <rect x="48" y="98" width="10" height="12" rx="3" fill="#16a34a"/>
      <rect x="62" y="98" width="10" height="12" rx="3" fill="#16a34a"/>

      {/* Animated leaves floating around */}
      {animated && <>
        <ellipse cx="15" cy="45" rx="5" ry="3" fill="#22c55e" opacity="0.8" transform="rotate(-45 15 45)">
          <animateTransform attributeName="transform" type="translate" values="0,0;8,-10;0,0" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="3s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="100" cy="55" rx="4" ry="2.5" fill="#16a34a" opacity="0.7" transform="rotate(30 100 55)">
          <animateTransform attributeName="transform" type="translate" values="0,0;-6,-8;0,0" dur="2.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.5s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="25" cy="80" rx="4" ry="2.5" fill="#22c55e" opacity="0.6" transform="rotate(20 25 80)">
          <animateTransform attributeName="transform" type="translate" values="0,0;5,-12;0,0" dur="4s" repeatCount="indefinite" begin="1s"/>
        </ellipse>
        <ellipse cx="95" cy="30" rx="5" ry="3" fill="#15803d" opacity="0.7" transform="rotate(-30 95 30)">
          <animateTransform attributeName="transform" type="translate" values="0,0;-10,-8;0,0" dur="3.5s" repeatCount="indefinite" begin="0.5s"/>
        </ellipse>
      </>}
    </svg>
  );
}

// ─── Iara — Water Support ─────────────────────────────────────────────────────
// Iconic: beautiful mermaid, large shimmering fish tail, long golden hair, glowing blue eyes

export function IaraArt({ size = 120, animated = true }: ArtProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <radialGradient id="iara-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#164e63"/>
          <stop offset="100%" stopColor="#0c4a6e"/>
        </radialGradient>
        <radialGradient id="iara-tail" cx="50%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#22d3ee"/>
          <stop offset="50%"  stopColor="#0891b2"/>
          <stop offset="100%" stopColor="#0e7490"/>
        </radialGradient>
        <radialGradient id="iara-orb" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#67e8f9" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#0891b2" stopOpacity="0.3"/>
        </radialGradient>
        <filter id="iara-glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="iara-softglow">
          <feGaussianBlur stdDeviation="4"/>
        </filter>
      </defs>

      {/* Background circle */}
      <circle cx="60" cy="60" r="58" fill="url(#iara-bg)"/>
      <circle cx="60" cy="60" r="58" fill="none" stroke="#22d3ee" strokeWidth="1.5"/>
      {/* Underwater glow */}
      <ellipse cx="60" cy="80" rx="50" ry="30" fill="#0891b2" opacity="0.15" filter="url(#iara-softglow)"/>

      {/* ── LARGE FISH TAIL — fills bottom half ── */}
      {/* Main tail body */}
      <ellipse cx="60" cy="92" rx="22" ry="26" fill="url(#iara-tail)"/>
      {/* Tail fin fork */}
      <path d="M38 108 Q48 100 60 115 Q72 100 82 108 Q70 122 60 118 Q50 122 38 108 Z"
        fill="#0891b2"/>
      <path d="M42 110 Q52 103 60 115 Q68 103 78 110 Q70 118 60 116 Q50 118 42 110 Z"
        fill="#22d3ee" opacity="0.7"/>
      {/* Scale pattern — repeating arcs */}
      {[0,1,2,3,4,5,6,7].map(i=>(
        <path key={i}
          d={`M${44+i%4*8} ${78+Math.floor(i/4)*10} Q${48+i%4*8} ${74+Math.floor(i/4)*10} ${52+i%4*8} ${78+Math.floor(i/4)*10}`}
          stroke="#06b6d4" strokeWidth="1" fill="none" opacity="0.6"/>
      ))}
      {/* Iridescent highlights */}
      <ellipse cx="55" cy="85" rx="6" ry="14" fill="#a5f3fc" opacity="0.2" transform="rotate(-10 55 85)"/>
      <ellipse cx="65" cy="88" rx="5" ry="12" fill="#7dd3fc" opacity="0.2" transform="rotate(8 65 88)"/>

      {/* BODY — smooth torso */}
      <ellipse cx="60" cy="68" rx="15" ry="18" fill="#7dd3fc"/>
      {/* Torso shading */}
      <ellipse cx="60" cy="62" rx="10" ry="8" fill="#93c5fd" opacity="0.5"/>

      {/* ── LONG GOLDEN FLOWING HAIR ── */}
      {/* Left hair flow */}
      <path d="M44 36 Q22 48 20 68 Q18 82 28 90 Q22 78 26 65 Q30 52 44 44"
        stroke="#fcd34d" strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.9"/>
      <path d="M44 36 Q26 50 24 70 Q22 84 30 92"
        stroke="#f59e0b" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7"/>
      <path d="M48 34 Q32 52 32 72 Q32 86 40 94"
        stroke="#fde68a" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.6"/>
      {/* Right hair flow */}
      <path d="M76 36 Q98 48 100 68 Q102 82 92 90 Q98 78 94 65 Q90 52 76 44"
        stroke="#fcd34d" strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.9"/>
      <path d="M76 36 Q94 50 96 70 Q98 84 90 92"
        stroke="#f59e0b" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7"/>
      <path d="M72 34 Q88 52 88 72 Q88 86 80 94"
        stroke="#fde68a" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.6"/>

      {/* HEAD */}
      <circle cx="60" cy="38" r="21" fill="#93c5fd"/>
      {/* Hair top */}
      <ellipse cx="60" cy="20" rx="18" ry="12" fill="#fcd34d"/>
      <ellipse cx="60" cy="18" rx="14" ry="9"  fill="#fde68a" opacity="0.7"/>

      {/* Coral/pearl hair accessories */}
      <circle cx="44" cy="28" r="3.5" fill="#f9a8d4" opacity="0.8"/>
      <circle cx="44" cy="28" r="2"   fill="#fbcfe8"/>
      <circle cx="76" cy="28" r="3"   fill="#f9a8d4" opacity="0.8"/>
      <circle cx="76" cy="28" r="1.8" fill="#fbcfe8"/>

      {/* EYES — large, enchanting */}
      <ellipse cx="51" cy="38" rx="6"  ry="7"  fill="#0c4a6e"/>
      <ellipse cx="69" cy="38" rx="6"  ry="7"  fill="#0c4a6e"/>
      <ellipse cx="51" cy="38" rx="4.5" ry="5.5" fill="#22d3ee"/>
      <ellipse cx="69" cy="38" rx="4.5" ry="5.5" fill="#22d3ee"/>
      <ellipse cx="51" cy="38" rx="2.5" ry="3"  fill="#0891b2"/>
      <ellipse cx="69" cy="38" rx="2.5" ry="3"  fill="#0891b2"/>
      <circle  cx="52" cy="36" r="1.5" fill="white" opacity="0.95"/>
      <circle  cx="70" cy="36" r="1.5" fill="white" opacity="0.95"/>
      {/* Star highlights in eyes */}
      <circle cx="54" cy="40" r="0.8" fill="white" opacity="0.6"/>
      <circle cx="72" cy="40" r="0.8" fill="white" opacity="0.6"/>
      {/* Eyelashes */}
      <line x1="46" y1="33" x2="44" y2="31" stroke="#0c4a6e" strokeWidth="1.2"/>
      <line x1="50" y1="32" x2="50" y2="30" stroke="#0c4a6e" strokeWidth="1.2"/>
      <line x1="54" y1="33" x2="55" y2="31" stroke="#0c4a6e" strokeWidth="1.2"/>
      <line x1="64" y1="33" x2="63" y2="31" stroke="#0c4a6e" strokeWidth="1.2"/>
      <line x1="68" y1="32" x2="68" y2="30" stroke="#0c4a6e" strokeWidth="1.2"/>
      <line x1="72" y1="33" x2="74" y2="31" stroke="#0c4a6e" strokeWidth="1.2"/>

      {/* Gentle smile */}
      <path d="M54 47 Q60 52 66 47" stroke="#0369a1" strokeWidth="1.8" fill="none" strokeLinecap="round"/>

      {/* Arms reaching forward with glowing orb between hands */}
      <ellipse cx="38" cy="66" rx="7" ry="12" fill="#7dd3fc" transform="rotate(20 38 66)"/>
      <ellipse cx="82" cy="66" rx="7" ry="12" fill="#7dd3fc" transform="rotate(-20 82 66)"/>
      {/* Hands */}
      <circle cx="30" cy="73" r="5" fill="#93c5fd"/>
      <circle cx="90" cy="73" r="5" fill="#93c5fd"/>
      {/* Glowing orb between hands */}
      <circle cx="60" cy="76" r="8" fill="url(#iara-orb)" filter="url(#iara-glow)">
        {animated && <>
          <animate attributeName="r" values="7;9;7" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2s" repeatCount="indefinite"/>
        </>}
      </circle>
      <circle cx="60" cy="76" r="4" fill="#67e8f9" opacity="0.8"/>

      {/* Water sparkle particles */}
      {animated && <>
        {[15,18,22,105,108,112].map((x,i)=>(
          <circle key={i} cx={x} cy={40+i*8} r="2" fill={i%2===0?"#67e8f9":"#22d3ee"} opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.1;0.8" dur={`${1.2+i*0.3}s`} repeatCount="indefinite"/>
            <animate attributeName="r" values="1.5;2.5;1.5" dur={`${1.2+i*0.3}s`} repeatCount="indefinite"/>
          </circle>
        ))}
        {/* Music notes */}
        <text x="12" y="30" fontSize="11" fill="#67e8f9" opacity="0.9">♪
          <animate attributeName="opacity" values="0.9;0.2;0.9" dur="2s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="translate" values="0,0;-3,-10;0,0" dur="2s" repeatCount="indefinite"/>
        </text>
        <text x="100" y="25" fontSize="9" fill="#22d3ee" opacity="0.7">♫
          <animate attributeName="opacity" values="0.7;0.1;0.7" dur="2.5s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="translate" values="0,0;3,-8;0,0" dur="2.5s" repeatCount="indefinite"/>
        </text>
      </>}
    </svg>
  );
}

// ─── Boitatá — Fire Serpent DPS ───────────────────────────────────────────────
// Iconic: giant coiled serpent, enormous glowing fire eyes, flame body

export function BoitataArt({ size = 120, animated = true }: ArtProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <radialGradient id="boi-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#450a0a"/>
          <stop offset="60%"  stopColor="#1c0505"/>
          <stop offset="100%" stopColor="#0a0000"/>
        </radialGradient>
        <radialGradient id="boi-fire-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%"   stopColor="#f97316" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="boi-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#dc2626"/>
          <stop offset="100%" stopColor="#ea580c"/>
        </linearGradient>
        <filter id="boi-glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="boi-soft">
          <feGaussianBlur stdDeviation="4"/>
        </filter>
      </defs>

      {/* Background */}
      <circle cx="60" cy="60" r="58" fill="url(#boi-bg)"/>
      <circle cx="60" cy="60" r="50" fill="url(#boi-fire-glow)"/>
      <circle cx="60" cy="60" r="58" fill="none" stroke="#f97316" strokeWidth="2"/>

      {/* ── COILED SNAKE BODY — thick, making 1.5 loops ── */}
      {/* Outer glow of body */}
      <path d="M60 108 Q95 100 95 78 Q95 54 70 50 Q42 46 36 64 Q30 80 48 88 Q64 94 72 80 Q78 68 68 62 Q58 56 52 64"
        stroke="#f97316" strokeWidth="24" fill="none" strokeLinecap="round" opacity="0.3" filter="url(#boi-soft)"/>
      {/* Main body — dark red */}
      <path d="M60 108 Q95 100 95 78 Q95 54 70 50 Q42 46 36 64 Q30 80 48 88 Q64 94 72 80 Q78 68 68 62 Q58 56 52 64"
        stroke="#dc2626" strokeWidth="20" fill="none" strokeLinecap="round"/>
      {/* Body highlight — brighter orange */}
      <path d="M60 108 Q95 100 95 78 Q95 54 70 50 Q42 46 36 64 Q30 80 48 88 Q64 94 72 80 Q78 68 68 62 Q58 56 52 64"
        stroke="#ea580c" strokeWidth="14" fill="none" strokeLinecap="round"/>
      {/* Inner body highlight */}
      <path d="M60 108 Q95 100 95 78 Q95 54 70 50 Q42 46 36 64 Q30 80 48 88 Q64 94 72 80 Q78 68 68 62 Q58 56 52 64"
        stroke="#fb923c" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.5"/>
      {/* Scale dashes along body */}
      <path d="M60 108 Q95 100 95 78 Q95 54 70 50 Q42 46 36 64 Q30 80 48 88 Q64 94 72 80 Q78 68 68 62 Q58 56 52 64"
        stroke="#fed7aa" strokeWidth="2" fill="none" strokeDasharray="7 6" opacity="0.4"/>

      {/* ── SNAKE HEAD — large, prominent at top ── */}
      {/* Head shadow/glow */}
      <ellipse cx="60" cy="36" rx="28" ry="22" fill="#f97316" opacity="0.2" filter="url(#boi-soft)"/>
      {/* Head shape */}
      <ellipse cx="60" cy="36" rx="25" ry="20" fill="#c2410c"/>
      <ellipse cx="60" cy="34" rx="22" ry="17" fill="#ea580c"/>
      {/* Head top lighter highlight */}
      <ellipse cx="60" cy="30" rx="16" ry="9" fill="#fb923c" opacity="0.4"/>
      {/* Jaw/chin */}
      <ellipse cx="60" cy="50" rx="15" ry="6" fill="#9a3412"/>

      {/* ── ENORMOUS GLOWING FIRE EYES ── */}
      {/* Outer glow */}
      <circle cx="48" cy="33" r="12" fill="#fef08a" opacity="0.3" filter="url(#boi-soft)"/>
      <circle cx="72" cy="33" r="12" fill="#fef08a" opacity="0.3" filter="url(#boi-soft)"/>
      {/* Eye whites/outer */}
      <circle cx="48" cy="33" r="10" fill="#fef08a" filter="url(#boi-glow)"/>
      <circle cx="72" cy="33" r="10" fill="#fef08a" filter="url(#boi-glow)"/>
      {/* Iris */}
      <circle cx="48" cy="33" r="7" fill="#ef4444"/>
      <circle cx="72" cy="33" r="7" fill="#ef4444"/>
      {/* Pupil — slit shaped */}
      <ellipse cx="48" cy="33" rx="2" ry="5" fill="#1a0000"/>
      <ellipse cx="72" cy="33" rx="2" ry="5" fill="#1a0000"/>
      {/* Highlight */}
      <circle cx="50" cy="30" r="2.5" fill="white" opacity="0.9"/>
      <circle cx="74" cy="30" r="2.5" fill="white" opacity="0.9"/>
      {/* Animated pulsing glow rings */}
      {animated && <>
        <circle cx="48" cy="33" r="11" fill="none" stroke="#f97316" strokeWidth="2" opacity="0.8">
          <animate attributeName="r" values="10;14;10" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="72" cy="33" r="11" fill="none" stroke="#f97316" strokeWidth="2" opacity="0.8">
          <animate attributeName="r" values="10;14;10" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.8s" repeatCount="indefinite"/>
        </circle>
      </>}

      {/* Forked tongue — animated flicking */}
      <path d="M60 54 L56 62" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
        {animated && <animate attributeName="d" values="M60 54 L56 62;M60 54 L56 64;M60 54 L56 62" dur="0.4s" repeatCount="indefinite"/>}
      </path>
      <path d="M60 54 L64 62" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
        {animated && <animate attributeName="d" values="M60 54 L64 62;M60 54 L64 64;M60 54 L64 62" dur="0.4s" repeatCount="indefinite"/>}
      </path>

      {/* Flame aura around body */}
      {animated && <>
        <path d="M20 75 Q16 62 22 55 Q18 65 26 68 Q20 58 28 52" fill="#f97316" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.9s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="translate" values="0,0;0,-6;0,0" dur="0.9s" repeatCount="indefinite"/>
        </path>
        <path d="M98 80 Q102 67 96 60 Q100 70 92 72 Q98 62 90 56" fill="#fb923c" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.1s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="translate" values="0,0;0,-5;0,0" dur="1.1s" repeatCount="indefinite"/>
        </path>
        <path d="M28 100 Q24 90 30 84 Q26 92 34 90" fill="#fbbf24" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.3s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="translate" values="0,0;0,-7;0,0" dur="1.3s" repeatCount="indefinite"/>
        </path>
        {/* Ember particles */}
        {[30,55,85,100].map((x,i)=>(
          <circle key={i} cx={x} cy={50+i*12} r="2" fill="#fbbf24" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0;0.8" dur={`${0.8+i*0.25}s`} repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="translate"
              values={`0,0;${i%2===0?8:-6},${-18-i*4};0,0`}
              dur={`${0.8+i*0.25}s`} repeatCount="indefinite"/>
          </circle>
        ))}
      </>}
    </svg>
  );
}

// ─── Anhangá — Shadow Assassin ────────────────────────────────────────────────
// Iconic: ghostly deer, massive dark antlers, intense purple glowing eyes, ethereal shadow form

export function AnhangaArt({ size = 120, animated = true }: ArtProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <radialGradient id="anh-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#0f0a1a"/>
          <stop offset="100%" stopColor="#050008"/>
        </radialGradient>
        <radialGradient id="anh-aura" cx="50%" cy="60%" r="55%">
          <stop offset="0%"   stopColor="#6d28d9" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0"/>
        </radialGradient>
        <filter id="anh-glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="anh-soft">
          <feGaussianBlur stdDeviation="5"/>
        </filter>
      </defs>

      {/* Background */}
      <circle cx="60" cy="60" r="58" fill="url(#anh-bg)"/>
      <circle cx="60" cy="60" r="58" fill="none" stroke="#6d28d9" strokeWidth="1.5" strokeDasharray="3 3"/>
      {/* Purple aura */}
      <circle cx="60" cy="65" r="55" fill="url(#anh-aura)" filter="url(#anh-soft)"/>

      {/* ── MASSIVE ANTLERS — THE MOST PROMINENT FEATURE ── */}
      {/* Left antler — main branch */}
      <path d="M42 46 Q28 30 18 16 Q14 8 20 6"
        stroke="#1e1b4b" strokeWidth="7" fill="none" strokeLinecap="round"/>
      <path d="M42 46 Q28 30 18 16 Q14 8 20 6"
        stroke="#4c1d95" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7"/>
      {/* Left antler branches */}
      <path d="M30 28 Q22 22 14 20"
        stroke="#1e1b4b" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M30 28 Q22 22 14 20"
        stroke="#6d28d9" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M24 20 Q18 12 12 10"
        stroke="#1e1b4b" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M22 34 Q14 28 8 30"
        stroke="#1e1b4b" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M36 38 Q30 28 26 22"
        stroke="#1e1b4b" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M36 38 Q30 28 26 22"
        stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>

      {/* Right antler — main branch */}
      <path d="M78 46 Q92 30 102 16 Q106 8 100 6"
        stroke="#1e1b4b" strokeWidth="7" fill="none" strokeLinecap="round"/>
      <path d="M78 46 Q92 30 102 16 Q106 8 100 6"
        stroke="#4c1d95" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7"/>
      {/* Right antler branches */}
      <path d="M90 28 Q98 22 106 20"
        stroke="#1e1b4b" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d="M90 28 Q98 22 106 20"
        stroke="#6d28d9" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M96 20 Q102 12 108 10"
        stroke="#1e1b4b" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M98 34 Q106 28 112 30"
        stroke="#1e1b4b" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M84 38 Q90 28 94 22"
        stroke="#1e1b4b" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M84 38 Q90 28 94 22"
        stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>

      {/* DEER EARS */}
      <path d="M40 50 Q32 38 36 30 Q44 42 44 50 Z" fill="#111827"/>
      <path d="M40 50 Q34 40 38 34 Q44 44 44 50 Z" fill="#1e1b4b" opacity="0.6"/>
      <path d="M80 50 Q88 38 84 30 Q76 42 76 50 Z" fill="#111827"/>
      <path d="M80 50 Q86 40 82 34 Q76 44 76 50 Z" fill="#1e1b4b" opacity="0.6"/>

      {/* DEER HEAD — elongated oval */}
      <ellipse cx="60" cy="52" rx="20" ry="22" fill="#111827"/>
      {/* Muzzle area — lighter */}
      <ellipse cx="60" cy="62" rx="10" ry="10" fill="#1e293b" opacity="0.8"/>
      <ellipse cx="60" cy="64" rx="7"  ry="6"  fill="#374151" opacity="0.6"/>

      {/* INTENSE PURPLE EYES */}
      {/* Eye glow backdrop */}
      <ellipse cx="50" cy="50" rx="8" ry="7" fill="#7c3aed" opacity="0.4" filter="url(#anh-soft)"/>
      <ellipse cx="70" cy="50" rx="8" ry="7" fill="#7c3aed" opacity="0.4" filter="url(#anh-soft)"/>
      {/* Eyes */}
      <ellipse cx="50" cy="50" rx="6"  ry="5"  fill="#7c3aed" filter="url(#anh-glow)"/>
      <ellipse cx="70" cy="50" rx="6"  ry="5"  fill="#7c3aed" filter="url(#anh-glow)"/>
      <ellipse cx="50" cy="50" rx="4"  ry="3.5" fill="#a78bfa"/>
      <ellipse cx="70" cy="50" rx="4"  ry="3.5" fill="#a78bfa"/>
      <circle  cx="51" cy="48.5" r="1.5" fill="white" opacity="0.8"/>
      <circle  cx="71" cy="48.5" r="1.5" fill="white" opacity="0.8"/>
      {/* Animated intense glow rings */}
      {animated && <>
        <ellipse cx="50" cy="50" rx="7" ry="6" fill="none" stroke="#7c3aed" strokeWidth="1.5" opacity="0.9">
          <animate attributeName="rx" values="6;9;6" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="ry" values="5;8;5" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.8s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="70" cy="50" rx="7" ry="6" fill="none" stroke="#7c3aed" strokeWidth="1.5" opacity="0.9">
          <animate attributeName="rx" values="6;9;6" dur="2.1s" repeatCount="indefinite"/>
          <animate attributeName="ry" values="5;8;5" dur="2.1s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.9;0.2;0.9" dur="2.1s" repeatCount="indefinite"/>
        </ellipse>
      </>}

      {/* Nose */}
      <ellipse cx="60" cy="65" rx="3.5" ry="2.5" fill="#0f172a"/>

      {/* GHOSTLY BODY — partially transparent */}
      <ellipse cx="60" cy="86" rx="16" ry="22" fill="#1e1b4b" opacity="0.7"/>
      {/* Body highlight */}
      <ellipse cx="60" cy="82" rx="10" ry="12" fill="#312e81" opacity="0.3"/>

      {/* DEER LEGS — 4 thin legs */}
      <line x1="50" y1="100" x2="46" y2="116" stroke="#1e1b4b" strokeWidth="4" strokeLinecap="round"/>
      <line x1="55" y1="102" x2="52" y2="118" stroke="#1e1b4b" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="65" y1="102" x2="68" y2="118" stroke="#1e1b4b" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="70" y1="100" x2="74" y2="116" stroke="#1e1b4b" strokeWidth="4" strokeLinecap="round"/>

      {/* Ethereal wisps / shadow tendrils */}
      {animated && <>
        {[
          {x:15, y:60, dx:8,  dy:-20},
          {x:105,y:65, dx:-8, dy:-18},
          {x:20, y:85, dx:10, dy:-15},
          {x:100,y:85, dx:-10,dy:-15},
          {x:35, y:108,dx:5,  dy:-25},
          {x:85, y:108,dx:-5, dy:-25},
        ].map((w,i)=>(
          <path key={i}
            d={`M${w.x} ${w.y} Q${w.x+w.dx/2} ${w.y+w.dy/2-5} ${w.x+w.dx} ${w.y+w.dy}`}
            stroke="#6d28d9" strokeWidth={2+i%2} fill="none" strokeLinecap="round" opacity="0.5">
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur={`${1.5+i*0.4}s`} repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="translate"
              values={`0,0;${i%2===0?3:-3},-5;0,0`}
              dur={`${1.5+i*0.4}s`} repeatCount="indefinite"/>
          </path>
        ))}
        {/* Shadow particles floating */}
        {[22,42,78,98,12,108].map((x,i)=>(
          <circle key={i} cx={x} cy={30+i*12} r="2.5" fill="#4c1d95" opacity="0.6">
            <animate attributeName="opacity" values="0.6;0;0.6" dur={`${1.8+i*0.4}s`} repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="translate"
              values={`0,0;${i%2===0?4:-4},${-8-i*2};0,0`}
              dur={`${1.8+i*0.4}s`} repeatCount="indefinite"/>
          </circle>
        ))}
      </>}
    </svg>
  );
}

// ─── Tupã — Thunder Mage ──────────────────────────────────────────────────────
// Iconic: colorful massive feather headdress, lightning everywhere, warrior

export function TupaArt({ size = 120, animated = true }: ArtProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <radialGradient id="tupa-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#1c1400"/>
          <stop offset="100%" stopColor="#0a0a05"/>
        </radialGradient>
        <radialGradient id="tupa-elec" cx="50%" cy="40%" r="55%">
          <stop offset="0%"   stopColor="#fbbf24" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/>
        </radialGradient>
        <filter id="tupa-bolt">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="tupa-glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="tupa-soft">
          <feGaussianBlur stdDeviation="5"/>
        </filter>
      </defs>

      {/* Background */}
      <circle cx="60" cy="60" r="58" fill="url(#tupa-bg)"/>
      <circle cx="60" cy="60" r="50" fill="url(#tupa-elec)"/>
      {/* Electric border pulse */}
      <circle cx="60" cy="60" r="58" fill="none" stroke="#fbbf24" strokeWidth="2">
        {animated && <>
          <animate attributeName="strokeWidth" values="2;3.5;2" dur="1.2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;0.5;1" dur="1.2s" repeatCount="indefinite"/>
        </>}
      </circle>

      {/* Thunder clouds at top */}
      <ellipse cx="30" cy="18" rx="20" ry="10" fill="#292524" opacity="0.9"/>
      <ellipse cx="60" cy="13" rx="28" ry="12" fill="#1c1917" opacity="0.9"/>
      <ellipse cx="90" cy="18" rx="20" ry="10" fill="#292524" opacity="0.9"/>

      {/* ── MASSIVE COLORFUL FEATHER HEADDRESS ── */}
      {/* 10 feathers in a wide fan — each a long narrow ellipse at different angles */}
      {/* Feather order: back feathers first, then front ones on top */}
      <ellipse cx="60" cy="34" rx="4" ry="20" fill="#8b5cf6" transform="rotate(-40 60 54)"/>
      <ellipse cx="60" cy="34" rx="4" ry="20" fill="#3b82f6" transform="rotate(-28 60 54)"/>
      <ellipse cx="60" cy="34" rx="4" ry="20" fill="#22c55e" transform="rotate(-14 60 54)"/>
      <ellipse cx="60" cy="34" rx="4" ry="22" fill="#fbbf24" transform="rotate(0 60 54)"/>
      <ellipse cx="60" cy="34" rx="4" ry="20" fill="#f97316" transform="rotate(14 60 54)"/>
      <ellipse cx="60" cy="34" rx="4" ry="20" fill="#dc2626" transform="rotate(28 60 54)"/>
      <ellipse cx="60" cy="34" rx="4" ry="18" fill="#8b5cf6" transform="rotate(40 60 54)"/>
      {/* Feather highlights */}
      <ellipse cx="60" cy="34" rx="1.5" ry="19" fill="#fde047" opacity="0.4" transform="rotate(0 60 54)"/>
      <ellipse cx="60" cy="34" rx="1.5" ry="17" fill="#86efac" opacity="0.4" transform="rotate(-14 60 54)"/>
      <ellipse cx="60" cy="34" rx="1.5" ry="17" fill="#93c5fd" opacity="0.4" transform="rotate(14 60 54)"/>
      {/* Headdress band */}
      <rect x="40" y="52" width="40" height="6" rx="2" fill="#78350f"/>
      <rect x="40" y="52" width="40" height="3" rx="2" fill="#92400e" opacity="0.8"/>

      {/* HEAD */}
      <circle cx="60" cy="60" r="18" fill="#92400e"/>
      {/* Face shading */}
      <ellipse cx="60" cy="56" rx="14" ry="9" fill="#a16207" opacity="0.5"/>
      <ellipse cx="60" cy="65" rx="12" ry="8" fill="#78350f" opacity="0.4"/>

      {/* War paint — red diagonal lines on cheeks */}
      <line x1="44" y1="56" x2="50" y2="60" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="45" y1="60" x2="51" y2="64" stroke="#dc2626" strokeWidth="2"   strokeLinecap="round"/>
      <line x1="76" y1="56" x2="70" y2="60" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="75" y1="60" x2="69" y2="64" stroke="#dc2626" strokeWidth="2"   strokeLinecap="round"/>

      {/* EYES — electric yellow-white */}
      <ellipse cx="53" cy="59" rx="4" ry="4.5" fill="#fef9c3"/>
      <ellipse cx="67" cy="59" rx="4" ry="4.5" fill="#fef9c3"/>
      <circle  cx="53" cy="59" r="2.5" fill="#1d4ed8"/>
      <circle  cx="67" cy="59" r="2.5" fill="#1d4ed8"/>
      <circle  cx="54" cy="57.5" r="1" fill="white" opacity="0.9"/>
      <circle  cx="68" cy="57.5" r="1" fill="white" opacity="0.9"/>
      {animated && <>
        <ellipse cx="53" cy="59" rx="5" ry="5.5" fill="none" stroke="#fde047" strokeWidth="1" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="67" cy="59" rx="5" ry="5.5" fill="none" stroke="#fde047" strokeWidth="1" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.3s" repeatCount="indefinite"/>
        </ellipse>
      </>}

      {/* Determined mouth */}
      <path d="M54 68 L66 68" stroke="#78350f" strokeWidth="2" strokeLinecap="round"/>

      {/* BODY — muscular warrior */}
      <ellipse cx="60" cy="90" rx="18" ry="20" fill="#78350f"/>
      {/* Tribal cloth wrap */}
      <rect x="48" y="88" width="24" height="10" rx="2" fill="#451a03" opacity="0.8"/>
      {/* Tribal lines on body */}
      <path d="M50 84 L56 90 M64 84 L70 90" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>

      {/* Arms */}
      <ellipse cx="38" cy="86" rx="7" ry="13" fill="#92400e" transform="rotate(15 38 86)"/>
      <ellipse cx="82" cy="82" rx="7" ry="13" fill="#92400e" transform="rotate(-30 82 82)"/>
      {/* Extended right arm */}
      <ellipse cx="88" cy="74" rx="6" ry="10" fill="#a16207" transform="rotate(-50 88 74)"/>

      {/* ── MAIN LIGHTNING BOLT — large, prominent ── */}
      <g filter="url(#tupa-bolt)">
        {/* Glow layer */}
        <polygon points="52,72 44,92 50,92 38,112" fill="#fbbf24" opacity="0.3" filter="url(#tupa-soft)"/>
        {/* Main bolt */}
        <polygon points="52,72 44,92 50,92 38,112" fill="#fde047"/>
        <polygon points="52,72 46,90 51,90 40,110" fill="#ffffff" opacity="0.6"/>
      </g>

      {/* Secondary lightning sparks */}
      {animated && <>
        <g filter="url(#tupa-bolt)">
          <polygon points="85,68 80,80 83,80 76,94" fill="#fde047" opacity="0.9">
            <animate attributeName="opacity" values="0.9;0;0.9" dur="0.9s" repeatCount="indefinite" begin="0.2s"/>
          </polygon>
        </g>
        <g filter="url(#tupa-bolt)">
          <polygon points="100,55 96,64 98.5,64 93,74" fill="#fde047" opacity="0.8">
            <animate attributeName="opacity" values="0;0.8;0" dur="1.1s" repeatCount="indefinite" begin="0.5s"/>
          </polygon>
        </g>
        <g filter="url(#tupa-bolt)">
          <polygon points="18,70 15,80 17.5,80 12,90" fill="#fde047" opacity="0.7">
            <animate attributeName="opacity" values="0.7;0;0.7" dur="1.4s" repeatCount="indefinite" begin="0.8s"/>
          </polygon>
        </g>
        {/* Electric arcs on arms */}
        <path d="M32 82 L28 86 L34 90 L30 94" stroke="#fde047" strokeWidth="1.5" fill="none" strokeLinecap="round">
          <animate attributeName="opacity" values="1;0;1" dur="0.7s" repeatCount="indefinite"/>
        </path>
        <path d="M94 70 L98 74 L92 78 L96 82" stroke="#fde047" strokeWidth="1.5" fill="none" strokeLinecap="round">
          <animate attributeName="opacity" values="0;1;0" dur="0.9s" repeatCount="indefinite"/>
        </path>
        {/* Electric aura ring */}
        <circle cx="60" cy="60" r="56" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.3">
          <animate attributeName="r" values="54;58;54" dur="1s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1s" repeatCount="indefinite"/>
        </circle>
      </>}
    </svg>
  );
}

// ─── Art dispatcher ───────────────────────────────────────────────────────────
export function ChampionArt({ class_, size = 120, animated = true }: { class_: ChampionClass } & ArtProps) {
  switch (class_) {
    case ChampionClass.CURUPIRA: return <CurupiraArt size={size} animated={animated} />;
    case ChampionClass.IARA:     return <IaraArt     size={size} animated={animated} />;
    case ChampionClass.BOITATA:  return <BoitataArt  size={size} animated={animated} />;
    case ChampionClass.ANHANGA:  return <AnhangaArt  size={size} animated={animated} />;
    case ChampionClass.TUPA:     return <TupaArt     size={size} animated={animated} />;
  }
}
