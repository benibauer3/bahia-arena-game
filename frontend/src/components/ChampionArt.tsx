/**
 * Champion Art — unique illustrated avatars for each champion.
 * Built with SVG + CSS animations, no external assets needed.
 */

import { ChampionClass } from "@/lib/champions";

interface ArtProps { size?: number; animated?: boolean }

// ─── Curupira — Forest Tank ───────────────────────────────────────────────────
export function CurupiraArt({ size = 120, animated = true }: ArtProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <radialGradient id="curu-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#166534" />
          <stop offset="100%" stopColor="#052e16" />
        </radialGradient>
        <filter id="curu-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Background circle */}
      <circle cx="60" cy="60" r="58" fill="url(#curu-bg)" />
      <circle cx="60" cy="60" r="58" fill="none" stroke="#16a34a" strokeWidth="1.5" strokeDasharray="4 2" />

      {/* Body */}
      <ellipse cx="60" cy="70" rx="22" ry="28" fill="#15803d" />
      {/* Head */}
      <circle cx="60" cy="42" r="18" fill="#22c55e" />
      {/* Wild hair / leaves */}
      <ellipse cx="45" cy="30" rx="8" ry="12" fill="#16a34a" transform="rotate(-30 45 30)" />
      <ellipse cx="60" cy="22" rx="7" ry="13" fill="#15803d" />
      <ellipse cx="75" cy="30" rx="8" ry="12" fill="#16a34a" transform="rotate(30 75 30)" />
      {/* Eyes - red (signature Curupira trait) */}
      <circle cx="53" cy="41" r="3.5" fill="#ff0000" />
      <circle cx="67" cy="41" r="3.5" fill="#ff0000" />
      <circle cx="54" cy="40" r="1.2" fill="white" />
      <circle cx="68" cy="40" r="1.2" fill="white" />
      {/* Nose */}
      <ellipse cx="60" cy="46" rx="2" ry="1.5" fill="#166534" />
      {/* Mouth */}
      <path d="M54 51 Q60 55 66 51" stroke="#166534" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* INVERTED FEET — signature trait! Feet point backwards */}
      <g filter="url(#curu-glow)">
        <ellipse cx="47" cy="97" rx="12" ry="6" fill="#fbbf24" transform="rotate(180 47 97)" />
        <ellipse cx="73" cy="97" rx="12" ry="6" fill="#fbbf24" transform="rotate(180 73 97)" />
        {/* Toes pointing backward */}
        <ellipse cx="38" cy="96" rx="3" ry="2" fill="#f59e0b" />
        <ellipse cx="41" cy="93" rx="3" ry="2" fill="#f59e0b" />
        <ellipse cx="64" cy="96" rx="3" ry="2" fill="#f59e0b" />
        <ellipse cx="67" cy="93" rx="3" ry="2" fill="#f59e0b" />
      </g>

      {/* Shield / bark armor */}
      <rect x="42" y="65" width="36" height="22" rx="4" fill="#14532d" opacity="0.8" />
      <path d="M42 72 L78 72" stroke="#16a34a" strokeWidth="1" opacity="0.5" />
      <path d="M42 79 L78 79" stroke="#16a34a" strokeWidth="1" opacity="0.5" />

      {/* Leaf particles */}
      {animated && <>
        <ellipse cx="20" cy="30" rx="5" ry="3" fill="#22c55e" opacity="0.6" transform="rotate(-45 20 30)">
          <animateTransform attributeName="transform" type="translate" values="0,0;5,-8;0,0" dur="3s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="95" cy="45" rx="4" ry="2.5" fill="#16a34a" opacity="0.7" transform="rotate(30 95 45)">
          <animateTransform attributeName="transform" type="translate" values="0,0;-4,-6;0,0" dur="2.5s" repeatCount="indefinite" />
        </ellipse>
      </>}
    </svg>
  );
}

// ─── Iara — River Mermaid Support ─────────────────────────────────────────────
export function IaraArt({ size = 120, animated = true }: ArtProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <radialGradient id="iara-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#0e7490" />
          <stop offset="100%" stopColor="#0c4a6e" />
        </radialGradient>
        <radialGradient id="iara-glow-r" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#iara-bg)" />
      <circle cx="60" cy="60" r="40" fill="url(#iara-glow-r)" />
      <circle cx="60" cy="60" r="58" fill="none" stroke="#22d3ee" strokeWidth="1.5" />

      {/* Water ripples */}
      <ellipse cx="60" cy="85" rx="35" ry="8" fill="#0284c7" opacity="0.4" />
      <ellipse cx="60" cy="88" rx="28" ry="6" fill="#0369a1" opacity="0.3" />

      {/* Fish tail */}
      <ellipse cx="60" cy="95" rx="20" ry="14" fill="#0891b2" />
      <path d="M40 95 Q50 108 60 100 Q70 108 80 95" fill="#06b6d4" />
      <ellipse cx="60" cy="94" rx="14" ry="8" fill="#22d3ee" opacity="0.5" />
      {/* Scales pattern */}
      <circle cx="52" cy="90" r="4" fill="#0e7490" opacity="0.5" />
      <circle cx="60" cy="90" r="4" fill="#0e7490" opacity="0.5" />
      <circle cx="68" cy="90" r="4" fill="#0e7490" opacity="0.5" />

      {/* Body */}
      <ellipse cx="60" cy="68" rx="16" ry="20" fill="#06b6d4" />

      {/* Long flowing hair */}
      <path d="M42 42 Q30 55 35 75 Q38 82 42 80" stroke="#fcd34d" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M78 42 Q90 55 85 75 Q82 82 78 80" stroke="#fcd34d" strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M48 38 Q40 60 44 80" stroke="#fbbf24" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M72 38 Q80 60 76 80" stroke="#fbbf24" strokeWidth="6" fill="none" strokeLinecap="round" />

      {/* Head */}
      <circle cx="60" cy="42" r="18" fill="#7dd3fc" />
      {/* Top of hair */}
      <ellipse cx="60" cy="26" rx="16" ry="10" fill="#fcd34d" />

      {/* Eyes — enchanting */}
      <ellipse cx="53" cy="42" rx="4" ry="5" fill="#0c4a6e" />
      <ellipse cx="67" cy="42" rx="4" ry="5" fill="#0c4a6e" />
      <circle cx="53" cy="42" r="2.5" fill="#22d3ee" />
      <circle cx="67" cy="42" r="2.5" fill="#22d3ee" />
      <circle cx="54" cy="41" r="1" fill="white" />
      <circle cx="68" cy="41" r="1" fill="white" />
      {/* Lashes */}
      <line x1="50" y1="38" x2="48" y2="36" stroke="#0c4a6e" strokeWidth="1" />
      <line x1="53" y1="37" x2="53" y2="35" stroke="#0c4a6e" strokeWidth="1" />
      <line x1="56" y1="38" x2="57" y2="36" stroke="#0c4a6e" strokeWidth="1" />

      {/* Smile */}
      <path d="M55 50 Q60 55 65 50" stroke="#0369a1" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Music notes — Canto Sedutor */}
      {animated && <>
        <text x="18" y="35" fontSize="12" fill="#67e8f9" opacity="0.9">♪
          <animate attributeName="opacity" values="0.9;0.2;0.9" dur="2s" repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0,0;-3,-8;0,0" dur="2s" repeatCount="indefinite" />
        </text>
        <text x="92" y="40" fontSize="10" fill="#67e8f9" opacity="0.7">♫
          <animate attributeName="opacity" values="0.7;0.1;0.7" dur="2.5s" repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0,0;3,-6;0,0" dur="2.5s" repeatCount="indefinite" />
        </text>
      </>}
    </svg>
  );
}

// ─── Boitatá — Fire Snake DPS ─────────────────────────────────────────────────
export function BoitataArt({ size = 120, animated = true }: ArtProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <radialGradient id="boi-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7c2d12" />
          <stop offset="100%" stopColor="#431407" />
        </radialGradient>
        <radialGradient id="boi-fire" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#fb923c" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#boi-bg)" />
      <circle cx="60" cy="60" r="50" fill="url(#boi-fire)" />
      <circle cx="60" cy="60" r="58" fill="none" stroke="#f97316" strokeWidth="2" />

      {/* Snake body coiled */}
      <path d="M60 100 Q90 90 88 70 Q86 50 65 48 Q40 46 38 62 Q36 78 55 80 Q72 82 70 70 Q68 60 60 62"
        stroke="#ea580c" strokeWidth="14" fill="none" strokeLinecap="round" />
      <path d="M60 100 Q90 90 88 70 Q86 50 65 48 Q40 46 38 62 Q36 78 55 80 Q72 82 70 70 Q68 60 60 62"
        stroke="#fb923c" strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* Scale pattern on body */}
      <path d="M60 100 Q90 90 88 70 Q86 50 65 48 Q40 46 38 62 Q36 78 55 80 Q72 82 70 70 Q68 60 60 62"
        stroke="#fed7aa" strokeWidth="2" fill="none" strokeLinecap="round" strokeDasharray="8 6" opacity="0.4" />

      {/* Snake head */}
      <ellipse cx="60" cy="55" rx="18" ry="14" fill="#c2410c" />
      <ellipse cx="60" cy="53" rx="16" ry="11" fill="#ea580c" />

      {/* Glowing fire eyes */}
      <circle cx="53" cy="52" r="5" fill="#fef08a" />
      <circle cx="67" cy="52" r="5" fill="#fef08a" />
      <circle cx="53" cy="52" r="3" fill="#ef4444" />
      <circle cx="67" cy="52" r="3" fill="#ef4444" />
      <circle cx="54" cy="51" r="1.5" fill="white" />
      <circle cx="68" cy="51" r="1.5" fill="white" />
      {animated && <>
        <circle cx="53" cy="52" r="6" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.8">
          <animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="67" cy="52" r="6" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.8">
          <animate attributeName="r" values="5;7;5" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </>}

      {/* Forked tongue */}
      <path d="M60 63 L56 70 M60 63 L64 70" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />

      {/* Flame particles */}
      {animated && <>
        <path d="M25 55 Q22 45 28 40 Q24 48 30 50 Q26 42 32 38" fill="#f97316" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1s" repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0,0;0,-5;0,0" dur="1s" repeatCount="indefinite" />
        </path>
        <path d="M90 65 Q87 55 92 50 Q89 58 94 60 Q90 52 95 47" fill="#fb923c" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.2s" repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0,0;0,-4;0,0" dur="1.2s" repeatCount="indefinite" />
        </path>
      </>}
    </svg>
  );
}

// ─── Anhangá — Shadow Assassin ────────────────────────────────────────────────
export function AnhangaArt({ size = 120, animated = true }: ArtProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <radialGradient id="anh-bg" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#3b0764" />
          <stop offset="100%" stopColor="#0f0a1a" />
        </radialGradient>
        <radialGradient id="anh-shadow" cx="50%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <filter id="anh-blur">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#anh-bg)" />
      <circle cx="60" cy="60" r="58" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Shadow aura */}
      <circle cx="60" cy="60" r="45" fill="url(#anh-shadow)" />

      {/* Torn cloak / shadow tendrils */}
      <path d="M30 100 Q25 80 30 65 Q35 50 40 45" fill="#4c1d95" opacity="0.8" />
      <path d="M90 100 Q95 80 90 65 Q85 50 80 45" fill="#4c1d95" opacity="0.8" />
      <path d="M22 95 Q18 75 25 60" stroke="#6d28d9" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M98 95 Q102 75 95 60" stroke="#6d28d9" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.6" />

      {/* Body — hooded figure */}
      <ellipse cx="60" cy="72" rx="20" ry="26" fill="#1e1b4b" />
      {/* Cloak folds */}
      <path d="M40 72 Q45 60 40 50 Q50 72 40 88" fill="#312e81" opacity="0.5" />
      <path d="M80 72 Q75 60 80 50 Q70 72 80 88" fill="#312e81" opacity="0.5" />

      {/* Hood */}
      <ellipse cx="60" cy="44" rx="20" ry="22" fill="#1e1b4b" />
      <ellipse cx="60" cy="42" rx="16" ry="17" fill="#111827" />

      {/* Glowing purple eyes — piercing */}
      <ellipse cx="52" cy="43" rx="5" ry="4" fill="#7c3aed" />
      <ellipse cx="68" cy="43" rx="5" ry="4" fill="#7c3aed" />
      <ellipse cx="52" cy="43" rx="3" ry="2.5" fill="#a78bfa" />
      <ellipse cx="68" cy="43" rx="3" ry="2.5" fill="#a78bfa" />
      {animated && <>
        <ellipse cx="52" cy="43" rx="6" ry="5" fill="none" stroke="#7c3aed" strokeWidth="1" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite" />
          <animate attributeName="rx" values="5;7;5" dur="2s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="68" cy="43" rx="6" ry="5" fill="none" stroke="#7c3aed" strokeWidth="1" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2.3s" repeatCount="indefinite" />
          <animate attributeName="rx" values="5;7;5" dur="2.3s" repeatCount="indefinite" />
        </ellipse>
      </>}

      {/* Dagger */}
      <g transform="rotate(-35 75 75)">
        <rect x="72" y="62" width="4" height="22" rx="1" fill="#c4b5fd" />
        <polygon points="74,58 70,66 78,66" fill="#a78bfa" />
        <rect x="68" y="66" width="12" height="3" rx="1" fill="#6d28d9" />
      </g>

      {/* Shadow particles */}
      {animated && <>
        <circle cx="20" cy="50" r="3" fill="#7c3aed" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0,0;5,5;0,0" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="40" r="2" fill="#6d28d9" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0,0;-4,3;0,0" dur="2s" repeatCount="indefinite" />
        </circle>
      </>}
    </svg>
  );
}

// ─── Tupã — Thunder God Mage ──────────────────────────────────────────────────
export function TupaArt({ size = 120, animated = true }: ArtProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <radialGradient id="tupa-bg" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#713f12" />
          <stop offset="100%" stopColor="#1c1917" />
        </radialGradient>
        <radialGradient id="tupa-aura" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <filter id="tupa-lightning">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#tupa-bg)" />
      <circle cx="60" cy="60" r="50" fill="url(#tupa-aura)" />
      <circle cx="60" cy="60" r="58" fill="none" stroke="#fbbf24" strokeWidth="2" />

      {/* Storm clouds */}
      <ellipse cx="40" cy="25" rx="18" ry="10" fill="#292524" />
      <ellipse cx="60" cy="20" rx="22" ry="12" fill="#1c1917" />
      <ellipse cx="80" cy="26" rx="18" ry="10" fill="#292524" />

      {/* Lightning bolt — signature */}
      <filter id="bolt-glow">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <g filter="url(#bolt-glow)">
        <polygon points="65,25 55,52 63,52 50,82 70,48 62,48" fill="#fde047" />
        <polygon points="65,25 55,52 63,52 50,82 70,48 62,48" fill="none" stroke="#fbbf24" strokeWidth="1" />
      </g>

      {/* God figure body */}
      <ellipse cx="60" cy="78" rx="18" ry="22" fill="#78350f" />

      {/* Cape/feathers */}
      <path d="M42 65 Q30 70 28 85 Q35 72 42 78" fill="#b45309" />
      <path d="M78 65 Q90 70 92 85 Q85 72 78 78" fill="#b45309" />
      <path d="M42 65 Q32 60 30 72" stroke="#d97706" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M78 65 Q88 60 90 72" stroke="#d97706" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* Head with headdress */}
      <circle cx="60" cy="50" r="16" fill="#92400e" />
      {/* Feather headdress */}
      <ellipse cx="47" cy="35" rx="5" ry="14" fill="#dc2626" transform="rotate(-20 47 35)" />
      <ellipse cx="54" cy="30" rx="5" ry="15" fill="#f97316" transform="rotate(-10 54 30)" />
      <ellipse cx="60" cy="28" rx="5" ry="16" fill="#fbbf24" />
      <ellipse cx="66" cy="30" rx="5" ry="15" fill="#f97316" transform="rotate(10 66 30)" />
      <ellipse cx="73" cy="35" rx="5" ry="14" fill="#dc2626" transform="rotate(20 73 35)" />

      {/* Face */}
      <circle cx="60" cy="50" r="12" fill="#a16207" />
      {/* Eyes — electric */}
      <ellipse cx="54" cy="49" rx="3.5" ry="4" fill="#fef08a" />
      <ellipse cx="66" cy="49" rx="3.5" ry="4" fill="#fef08a" />
      <circle cx="54" cy="49" r="2" fill="#1d4ed8" />
      <circle cx="66" cy="49" r="2" fill="#1d4ed8" />
      <circle cx="55" cy="48" r="0.8" fill="white" />
      <circle cx="67" cy="48" r="0.8" fill="white" />

      {/* War paint */}
      <path d="M48 47 L52 49" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M72 47 L68 49" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />

      {/* Electric sparks */}
      {animated && <>
        <g filter="url(#tupa-lightning)">
          <path d="M15 40 L20 45 L17 50 L24 55" stroke="#fde047" strokeWidth="2" fill="none" strokeLinecap="round">
            <animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite" />
          </path>
          <path d="M100 50 L95 55 L98 60 L92 65" stroke="#fde047" strokeWidth="2" fill="none" strokeLinecap="round">
            <animate attributeName="opacity" values="0;1;0" dur="1s" repeatCount="indefinite" />
          </path>
          <circle cx="60" cy="60" r="55" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.3">
            <animate attributeName="r" values="52;58;52" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </g>
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
