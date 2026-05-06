/**
 * BahiaArenaLogo.tsx — Brasão SVG oficial do Bahia Arena.
 *
 * Art Direction:
 *  • Escudo heráldico moderno (e-sports crest)
 *  • Fundo: gradiente Azul Cobalto → Azul Marinho → Verde Floresta
 *  • Panorama brasileiro: Farol da Barra · Floresta Atlântica ·
 *    Corcovado + Cristo Redentor (centro, branco) · Pão de Açúcar ·
 *    Cobertura do Maracanã
 *  • Dois raios cruzados no terço superior (branco → verde neon)
 *  • Linha de chão neon verde com nós de blockchain
 *  • Borda dupla: branca externa + esmeralda interna
 *  • Ornamentos losango nos cantos
 *  • Wordmark: BAHIA (branco) + ARENA (gradiente azul→verde)
 *
 * Props:
 *  size          — largura em px (altura calculada automaticamente)
 *  showWordmark  — inclui BAHIA / ARENA abaixo do escudo (default true)
 *  className     — classes adicionais no <svg>
 */

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export default function BahiaArenaLogo({
  size = 120,
  showWordmark = true,
  className = "",
}: LogoProps) {
  // Shield: 200 × 230. Wordmark adds 68 more units.
  const totalH = showWordmark ? 298 : 230;
  const w = size;
  const h = Math.round((size / 200) * totalH);

  // Shield outline path (reused for fill + borders + clip)
  const shield = "M100,3 L185,11 L194,21 L194,152 Q194,167 183,179 Q145,214 100,230 Q55,214 17,179 Q6,167 6,152 L6,21 L15,11 Z";
  // Inner border (inset ~6 px)
  const shieldInner = "M100,9 L179,16 L187,26 L187,152 Q187,164 177,175 Q141,208 100,224 Q59,208 23,175 Q13,164 13,152 L13,26 L21,16 Z";

  return (
    <svg
      viewBox={`0 0 200 ${totalH}`}
      width={w}
      height={h}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* ── Background gradient ── */}
        <linearGradient id="bala-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0A2A6E"/>
          <stop offset="52%"  stopColor="#061A4A"/>
          <stop offset="100%" stopColor="#042A0C"/>
        </linearGradient>

        {/* ── Ground fill (below neon line) ── */}
        <linearGradient id="bala-gnd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#042A0C"/>
          <stop offset="100%" stopColor="#021408"/>
        </linearGradient>

        {/* ── Lightning bolt ── */}
        <linearGradient id="bala-bolt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFFFFF"/>
          <stop offset="100%" stopColor="#00FF88"/>
        </linearGradient>

        {/* ── ARENA wordmark ── */}
        <linearGradient id="bala-arena" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#4FC3F7"/>
          <stop offset="100%" stopColor="#00FF88"/>
        </linearGradient>

        {/* ── Filters ── */}
        <filter id="bala-glow"  x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="bala-bglow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="bala-halo" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="7"/>
        </filter>

        {/* ── Shield clip (content stays inside the shield) ── */}
        <clipPath id="bala-clip">
          <path d={shield}/>
        </clipPath>
      </defs>

      {/* ════════════ SHIELD BASE ════════════ */}
      <path d={shield} fill="url(#bala-bg)"/>

      {/* ════════ CIRCUIT TEXTURE (inside clip) ════════ */}
      <g clipPath="url(#bala-clip)" opacity="0.045">
        {[10,28,46,64,82,100,118,136,154,172,190].map((x, i) => (
          <line key={i}
            x1={x} y1="0" x2={x - 52} y2="232"
            stroke="white" strokeWidth="0.9"/>
        ))}
      </g>

      {/* ════════ PANORAMA SILHOUETTE ════════ */}
      <g clipPath="url(#bala-clip)">

        {/* Sky horizon glow */}
        <ellipse cx="100" cy="160" rx="105" ry="22"
          fill="#061A4A" opacity="0.55"/>

        {/* ── 1. FAROL DA BARRA (left) ── */}
        {/* Fort base */}
        <rect x="13" y="182" width="30" height="8" rx="1" fill="#042A0C"/>
        {/* Tower shaft — octagonal feel via clipped rect */}
        <rect x="24" y="145" width="9" height="40" rx="1.5" fill="#0d3a15" opacity="0.95"/>
        {/* Tower horizontal bands */}
        <rect x="23" y="155" width="11" height="2" fill="#1a5e2a" opacity="0.7"/>
        <rect x="23" y="165" width="11" height="2" fill="#1a5e2a" opacity="0.7"/>
        {/* Lantern room */}
        <rect x="21" y="139" width="15" height="8" rx="1" fill="#165a22"/>
        {/* Dome */}
        <ellipse cx="28.5" cy="139" rx="8" ry="3.5" fill="#0d3a15"/>
        {/* Beacon light — animated pulse */}
        <circle cx="28.5" cy="136" r="3" fill="#00FF88" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.25;0.9" dur="2.2s" repeatCount="indefinite"/>
        </circle>
        {/* Beacon halo */}
        <circle cx="28.5" cy="136" r="8" fill="#00FF88" opacity="0.12" filter="url(#bala-halo)">
          <animate attributeName="opacity" values="0.12;0.03;0.12" dur="2.2s" repeatCount="indefinite"/>
        </circle>

        {/* ── 2. ATLANTIC FOREST (left hills) ── */}
        {/* Hill mass */}
        <path d="M42 190 Q46 170 54 162 Q60 152 70 157 Q76 147 86 152 Q90 142 96 148 L96 190 Z"
          fill="#031a08" opacity="0.95"/>
        {/* Layered canopy silhouette */}
        <path d="M42 172 Q48 158 58 163 Q65 152 76 157 Q82 146 92 151 Q95 145 97 149"
          stroke="#0a3210" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.8"/>
        {/* Individual treetops */}
        {[48,58,68,78,88].map((x, i) => (
          <g key={i}>
            <ellipse cx={x}   cy={158 + i % 3 * 4} rx={6 + i%2*2} ry={5 + i%3*2}
              fill="#0a3d12" opacity="0.9"/>
            <ellipse cx={x+4} cy={154 + i%2*3}     rx={4 + i%2*2} ry={4 + i%2*2}
              fill="#0d5218" opacity="0.7"/>
          </g>
        ))}

        {/* ── 3. CORCOVADO MOUNTAIN ── */}
        {/* Mountain body */}
        <path d="M84 190 Q89 170 93 156 Q97 143 99 135 L100 131 L101 135 Q103 143 107 156 Q111 170 116 190 Z"
          fill="#020e05"/>
        {/* Rock face highlight */}
        <path d="M93 156 Q97 143 99 135 L100 131 L101 135 Q103 143 106 153"
          stroke="#0d2a10" strokeWidth="1.5" fill="none" opacity="0.7"/>

        {/* ── Cristo Redentor ── */}
        {/* Uplighting cone (very subtle warm beam from base) */}
        <path d="M94 190 Q97 155 100 132 Q103 155 106 190"
          fill="#fef9c3" opacity="0.015"/>
        {/* Halo (blown-out spotlight from below) */}
        <circle cx="100" cy="124" r="12" fill="#FFFFFF" opacity="0.06"
          filter="url(#bala-halo)"/>
        {/* Pedestal */}
        <rect x="98" y="128" width="4.5" height="4" rx="0.6"
          fill="#c9a030" opacity="0.88"/>
        {/* Body (vertical arm) */}
        <rect x="99.2" y="116" width="2.8" height="13" rx="1"
          fill="#FFFFFF" opacity="0.97"/>
        {/* Outstretched arms (horizontal) */}
        <rect x="92"   y="119.5" width="16" height="2.2" rx="1"
          fill="#FFFFFF" opacity="0.97"/>
        {/* Head */}
        <circle cx="100.5" cy="115" r="2.2"
          fill="#FFFFFF" opacity="0.95"/>
        {/* Subtle arm-tip glow (uplights) */}
        <circle cx="92.5" cy="120" r="1.5" fill="#fef9c3" opacity="0.4"
          filter="url(#bala-glow)"/>
        <circle cx="108.5" cy="120" r="1.5" fill="#fef9c3" opacity="0.4"
          filter="url(#bala-glow)"/>

        {/* ── 4. PÃO DE AÇÚCAR ── */}
        {/* Morro da Urca (smaller front hill) */}
        <path d="M118 190 Q121 178 127 170 Q132 163 137 164 Q142 163 146 170 Q150 178 152 190 Z"
          fill="#020e05" opacity="0.9"/>
        {/* Sugarloaf main dome (rounded granite) */}
        <path d="M147 190 Q149 178 154 165 Q158 153 164 145 Q168 139 173 138 Q178 138 182 145 Q186 153 188 164 Q191 175 192 190 Z"
          fill="#031508"/>
        {/* Dome highlight — left lit face */}
        <path d="M164 145 Q168 139 173 138 Q170 140 167 146 Q162 154 160 163"
          stroke="#0a3210" strokeWidth="2.5" fill="none" opacity="0.65"/>
        {/* Forest on lower slopes */}
        {[150,158,166,174,182,190].map((x, i) => (
          <ellipse key={i} cx={x} cy={180 + i%3*2} rx={5+i%2*2} ry={4}
            fill="#0a3210" opacity={0.45+i%2*0.15}/>
        ))}

        {/* ── 5. MARACANÃ RING ROOF (right edge) ── */}
        {/* Arena bowl base */}
        <rect x="16" y="182" width="168" height="10" fill="#031408" opacity="0.7"/>
        {/* Right side arch — the iconic suspended roof */}
        {/* Left half of arch */}
        <path d="M60 165 Q65 152 75 147 Q85 143 95 144"
          stroke="#4FC3F7" strokeWidth="1.8" fill="none"
          strokeLinecap="round" opacity="0.75"/>
        {/* Right half of arch */}
        <path d="M95 144 Q108 143 118 147 Q128 152 133 165"
          stroke="#4FC3F7" strokeWidth="1.8" fill="none"
          strokeLinecap="round" opacity="0.75"/>
        {/* Suspension cables from arch */}
        {[68,80,92,102,114,126].map((x, i) => (
          <line key={i}
            x1={x} y1={163 - i%2}
            x2={x + (x < 97 ? -3 : 3)} y2={150 - i%3*2}
            stroke="#4FC3F7" strokeWidth="0.8" opacity="0.45"/>
        ))}
        {/* Stands */}
        <rect x="58" y="168" width="78" height="14" fill="#041a0a" opacity="0.85"/>
        {/* Crowd dots */}
        {Array.from({length: 16}, (_, i) => (
          <circle key={i}
            cx={62 + i*4.5} cy={172 + i%2*3} r="1.4"
            fill={i%3===0?"#fde047":i%3===1?"#22c55e":"#f8fafc"}
            opacity="0.75"/>
        ))}
        {/* Pitch — green stripes */}
        <rect x="58" y="181" width="78" height="10" fill="#15803d" opacity="0.85"/>
        <rect x="58" y="181" width="39" height="10" fill="#166534" opacity="0.85"/>
        {/* Pitch center line */}
        <line x1="97" y1="181" x2="97" y2="191" stroke="white" strokeWidth="0.8" opacity="0.5"/>
        {/* Goal areas */}
        <rect x="58"  y="183" width="15" height="8" fill="none" stroke="white" strokeWidth="0.6" opacity="0.45"/>
        <rect x="121" y="183" width="15" height="8" fill="none" stroke="white" strokeWidth="0.6" opacity="0.45"/>

        {/* ── NEON GROUND LINE ── */}
        <line x1="14" y1="191" x2="186" y2="191"
          stroke="#00FF88" strokeWidth="2" opacity="0.9"/>
        {/* Ground glow */}
        <line x1="14" y1="191" x2="186" y2="191"
          stroke="#00FF88" strokeWidth="6" opacity="0.08"
          filter="url(#bala-glow)"/>
        {/* Blockchain nodes */}
        <circle cx="14"  cy="191" r="3"   fill="#00FF88" opacity="0.95"/>
        <circle cx="100" cy="191" r="2.2" fill="#00FF88" opacity="0.8"/>
        <circle cx="186" cy="191" r="3"   fill="#00FF88" opacity="0.95"/>
        {/* Node connectors (mini hash marks) */}
        <circle cx="57"  cy="191" r="1.5" fill="#00A86B" opacity="0.6"/>
        <circle cx="143" cy="191" r="1.5" fill="#00A86B" opacity="0.6"/>

        {/* Ground fill */}
        <rect x="6" y="191" width="188" height="39" fill="url(#bala-gnd)"/>
      </g>

      {/* ════════ LIGHTNING BOLTS — upper third ════════ */}
      <g clipPath="url(#bala-clip)">

        {/* Bolt halos (glow behind) */}
        <path d="M87,44 L75,44 L68,82 L81,82 L63,122 L83,87 L87,44 Z"
          fill="#00FF88" opacity="0.10" filter="url(#bala-bglow)"/>
        <path d="M113,44 L125,44 L132,82 L119,82 L137,122 L117,87 L113,44 Z"
          fill="#00FF88" opacity="0.10" filter="url(#bala-bglow)"/>

        {/* Left bolt (leans left going down) */}
        <path d="M87,44 L75,44 L68,82 L81,82 L63,122 L83,87 L87,44 Z"
          fill="url(#bala-bolt)" filter="url(#bala-glow)"/>

        {/* Right bolt (mirror — leans right going down) */}
        <path d="M113,44 L125,44 L132,82 L119,82 L137,122 L117,87 L113,44 Z"
          fill="url(#bala-bolt)" filter="url(#bala-glow)"/>

        {/* Central spark where bolts converge */}
        <circle cx="100" cy="83" r="5" fill="#FFFFFF" opacity="0.18"
          filter="url(#bala-halo)"/>
        <circle cx="100" cy="83" r="2" fill="#FFFFFF" opacity="0.5"/>
      </g>

      {/* ════════ SHIELD BORDERS ════════ */}
      {/* Outer white border */}
      <path d={shield}
        fill="none" stroke="white" strokeWidth="2.8"/>
      {/* Inner emerald border */}
      <path d={shieldInner}
        fill="none" stroke="#00A86B" strokeWidth="1.6"/>

      {/* ════════ DIAMOND CORNER ORNAMENTS ════════ */}
      {/* top-left */}
      <g transform="translate(19,16)">
        <path d="M0,-5 L4,0 L0,5 L-4,0 Z" fill="#00A86B" opacity="0.9"/>
        <circle cx="0" cy="0" r="1.3" fill="white"/>
      </g>
      {/* top-right */}
      <g transform="translate(181,16)">
        <path d="M0,-5 L4,0 L0,5 L-4,0 Z" fill="#00A86B" opacity="0.9"/>
        <circle cx="0" cy="0" r="1.3" fill="white"/>
      </g>
      {/* lower-left */}
      <g transform="translate(34,194)">
        <path d="M0,-5 L4,0 L0,5 L-4,0 Z" fill="#00A86B" opacity="0.9"/>
        <circle cx="0" cy="0" r="1.3" fill="white"/>
      </g>
      {/* lower-right */}
      <g transform="translate(166,194)">
        <path d="M0,-5 L4,0 L0,5 L-4,0 Z" fill="#00A86B" opacity="0.9"/>
        <circle cx="0" cy="0" r="1.3" fill="white"/>
      </g>

      {/* ════════ WORDMARK ════════ */}
      {showWordmark && (
        <g transform="translate(100,242)">
          {/* BAHIA */}
          <text
            textAnchor="middle"
            fontSize="30"
            fontWeight="900"
            fontFamily="'Arial Black', 'Impact', 'Press Start 2P', sans-serif"
            letterSpacing="5"
            fill="white"
            y="0"
          >BAHIA</text>

          {/* Separator line */}
          <line x1="-64" y1="8" x2="64" y2="8" stroke="#00FF88" strokeWidth="1.6"/>
          {/* Node dots */}
          <circle cx="-64" cy="8" r="2.8" fill="#00FF88"/>
          <circle cx="64"  cy="8" r="2.8" fill="#00FF88"/>
          <circle cx="0"   cy="8" r="2"   fill="#00A86B"/>
          <circle cx="-32" cy="8" r="1.4" fill="#00A86B" opacity="0.7"/>
          <circle cx="32"  cy="8" r="1.4" fill="#00A86B" opacity="0.7"/>

          {/* ARENA */}
          <text
            textAnchor="middle"
            fontSize="24"
            fontWeight="900"
            fontFamily="'Arial Black', 'Impact', 'Press Start 2P', sans-serif"
            letterSpacing="9"
            fill="url(#bala-arena)"
            y="34"
          >ARENA</text>
        </g>
      )}
    </svg>
  );
}
