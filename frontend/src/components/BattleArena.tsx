/**
 * BattleArena.tsx — Themed battlefield backgrounds for each champion.
 *
 * Each arena is a full-bleed SVG scene that fills the battle area.
 * Themes:
 *   0 – Curupira   → Amazon Forest (giant trees, green mist, roots)
 *   1 – Iara       → River Abyss   (moonlit water, lotus, ripples)
 *   2 – Boitatá    → Fire Fields   (lava cracks, embers, flames)
 *   3 – Anhangá    → Shadow Realm  (void, purple rifts, debris)
 *   4 – Tupã       → Storm Peak    (thunderclouds, lightning, mountain)
 *   "amazon"   → Floresta Amazônica  (golden hour)
 *   "stadium"  → Estádio de Futebol  (night game)
 *   "sea"      → Mar Tropical        (sunset beach)
 *
 * A mixed matchup uses the "Coliseum" (default arena).
 */

import { ChampionClass } from "@/lib/champions";

export type ArenaTheme = "amazon" | "stadium" | "sea";

interface ArenaProps {
  /** classA decides the arena theme; pass null for coliseum default */
  classA?: ChampionClass;
  classB?: ChampionClass;
}

// ─── Coliseum (default / mixed) ───────────────────────────────────────────────

function ColiseumArena() {
  return (
    <svg viewBox="0 0 400 180" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="col-sky" cx="50%" cy="0%" r="100%">
          <stop offset="0%"   stopColor="#1a1040"/>
          <stop offset="100%" stopColor="#0D1117"/>
        </radialGradient>
        <radialGradient id="col-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#F6C90E" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#F6C90E" stopOpacity="0"/>
        </radialGradient>
      </defs>
      {/* Sky */}
      <rect width="400" height="180" fill="url(#col-sky)"/>
      {/* Arena glow */}
      <ellipse cx="200" cy="120" rx="180" ry="70" fill="url(#col-glow)"/>
      {/* Stars */}
      {[20,55,90,140,200,260,320,365,380,15,75,160,240,300].map((x,i) => (
        <circle key={i} cx={x} cy={8+(i%4)*10} r="0.8" fill="white" opacity={0.4+Math.random()*0.4}/>
      ))}
      {/* Ground */}
      <ellipse cx="200" cy="165" rx="190" ry="22" fill="#21262D"/>
      <ellipse cx="200" cy="163" rx="185" ry="18" fill="#2d3748"/>
      {/* Arena circle markings */}
      <ellipse cx="200" cy="158" rx="160" ry="14" fill="none" stroke="#F6C90E" strokeWidth="0.8" opacity="0.3"/>
      <ellipse cx="200" cy="158" rx="100" ry="9"  fill="none" stroke="#F6C90E" strokeWidth="0.5" opacity="0.2"/>
      {/* Columns */}
      {[30,90,310,370].map((x,i) => (
        <g key={i}>
          <rect x={x-6} y="40" width="12" height="110" rx="2" fill="#1a2233"/>
          <rect x={x-8} y="36" width="16" height="8"   rx="1" fill="#253045"/>
          <rect x={x-8} y="145" width="16" height="8"  rx="1" fill="#253045"/>
        </g>
      ))}
      {/* Torches */}
      {[110,290].map((x,i) => (
        <g key={i}>
          <rect x={x-2} y="55" width="4" height="20" fill="#6b7280"/>
          <ellipse cx={x} cy="52" rx="4" ry="6" fill="#f97316" opacity="0.9">
            <animate attributeName="ry" values="6;8;6" dur="0.8s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.9;0.6;0.9" dur="0.8s" repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx={x} cy="50" rx="2" ry="4" fill="#fbbf24" opacity="0.7">
            <animate attributeName="ry" values="4;6;4" dur="0.6s" repeatCount="indefinite"/>
          </ellipse>
        </g>
      ))}
      {/* Center divider line */}
      <line x1="200" y1="80" x2="200" y2="160" stroke="#F6C90E" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3"/>
    </svg>
  );
}

// ─── Amazon Forest ────────────────────────────────────────────────────────────

function ForestArena() {
  return (
    <svg viewBox="0 0 400 180" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="for-sky" cx="50%" cy="0%" r="100%">
          <stop offset="0%"   stopColor="#052e16"/>
          <stop offset="100%" stopColor="#042308"/>
        </radialGradient>
        <radialGradient id="for-light" cx="50%" cy="30%" r="40%">
          <stop offset="0%"   stopColor="#86efac" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#86efac" stopOpacity="0"/>
        </radialGradient>
        <filter id="for-blur"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <rect width="400" height="180" fill="url(#for-sky)"/>
      <rect width="400" height="180" fill="url(#for-light)"/>

      {/* Background mist */}
      <ellipse cx="200" cy="100" rx="200" ry="60" fill="#16a34a" opacity="0.08" filter="url(#for-blur)"/>

      {/* Background trees (silhouettes) */}
      {[15,50,85,130,165,235,275,315,355,385].map((x,i)=>(
        <g key={i}>
          <rect x={x-4} y={60+i%3*10} width="8" height={80-i%2*10} fill="#14532d" opacity="0.6"/>
          <ellipse cx={x} cy={55+i%3*10} rx={16+i%3*5} ry={22+i%2*8} fill="#15803d" opacity="0.5"/>
        </g>
      ))}

      {/* Foreground large trees */}
      <g>
        <rect x="12" y="20" width="18" height="160" rx="3" fill="#166534"/>
        <ellipse cx="21" cy="30" rx="40" ry="50" fill="#15803d" opacity="0.9"/>
        <ellipse cx="21" cy="20" rx="30" ry="40" fill="#16a34a" opacity="0.8"/>
      </g>
      <g>
        <rect x="370" y="20" width="18" height="160" rx="3" fill="#166534"/>
        <ellipse cx="379" cy="30" rx="40" ry="50" fill="#15803d" opacity="0.9"/>
        <ellipse cx="379" cy="20" rx="30" ry="40" fill="#16a34a" opacity="0.8"/>
      </g>

      {/* Ground — mossy */}
      <ellipse cx="200" cy="172" rx="200" ry="20" fill="#14532d"/>
      <ellipse cx="200" cy="168" rx="195" ry="16" fill="#166534"/>
      {/* Roots */}
      {[60,120,200,280,340].map((x,i)=>(
        <path key={i} d={`M${x} 168 Q${x-15} 150 ${x-5} 140`} stroke="#14532d" strokeWidth="3" fill="none" opacity="0.7"/>
      ))}

      {/* Fireflies */}
      {[80,140,200,260,320].map((x,i)=>(
        <circle key={i} cx={x} cy={50+i*15} r="1.5" fill="#86efac" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.1;0.8" dur={`${1.5+i*0.4}s`} repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="translate" values={`0,0;${(i%2===0?3:-3)},${-5};0,0`} dur={`${1.5+i*0.4}s`} repeatCount="indefinite"/>
        </circle>
      ))}

      {/* Canopy light rays */}
      <line x1="200" y1="0" x2="180" y2="80" stroke="#86efac" strokeWidth="8" opacity="0.05"/>
      <line x1="220" y1="0" x2="210" y2="80" stroke="#86efac" strokeWidth="6" opacity="0.04"/>

      {/* Center line */}
      <line x1="200" y1="60" x2="200" y2="168" stroke="#22c55e" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3"/>
    </svg>
  );
}

// ─── River Abyss ──────────────────────────────────────────────────────────────

function RiverArena() {
  return (
    <svg viewBox="0 0 400 180" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="riv-sky" cx="50%" cy="20%" r="80%">
          <stop offset="0%"   stopColor="#0c1e38"/>
          <stop offset="100%" stopColor="#060d1a"/>
        </radialGradient>
        <radialGradient id="riv-moon" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#e0f2fe" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="riv-water" cx="50%" cy="0%" r="100%">
          <stop offset="0%"   stopColor="#0369a1"/>
          <stop offset="100%" stopColor="#0c4a6e"/>
        </radialGradient>
        <filter id="riv-glow"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>
      <rect width="400" height="180" fill="url(#riv-sky)"/>

      {/* Stars */}
      {[30,60,90,130,170,220,265,300,340,380,10,50,140,190,250,290,360].map((x,i)=>(
        <circle key={i} cx={x} cy={5+i%5*8} r="0.7" fill="white" opacity={0.3+i%3*0.2}/>
      ))}

      {/* Moon */}
      <circle cx="200" cy="30" r="18" fill="#f0f9ff" opacity="0.9"/>
      <circle cx="206" cy="27" r="14" fill="#0c1e38"/>
      <circle cx="200" cy="30" r="20" fill="none" stroke="#e0f2fe" strokeWidth="1" opacity="0.3"/>
      {/* Moon glow */}
      <circle cx="200" cy="30" r="28" fill="url(#riv-moon)" filter="url(#riv-glow)"/>

      {/* Moon reflection on water */}
      <ellipse cx="200" cy="148" rx="12" ry="20" fill="#bae6fd" opacity="0.15">
        <animate attributeName="rx" values="10;14;10" dur="2s" repeatCount="indefinite"/>
      </ellipse>

      {/* Water surface */}
      <rect x="0" y="130" width="400" height="50" fill="url(#riv-water)"/>
      {/* Water shimmer lines */}
      {[0,1,2,3,4].map(i=>(
        <path key={i} d={`M${i*90} ${140+i*4} Q${i*90+22} ${136+i*4} ${i*90+45} ${140+i*4} Q${i*90+68} ${144+i*4} ${i*90+90} ${140+i*4}`}
          stroke="#7dd3fc" strokeWidth="0.8" fill="none" opacity="0.3">
          <animateTransform attributeName="transform" type="translate" values="0,0;-90,0" dur={`${3+i}s`} repeatCount="indefinite"/>
        </path>
      ))}

      {/* Lotus flowers */}
      {[80,160,240,320].map((x,i)=>(
        <g key={i}>
          <ellipse cx={x} cy="132" rx="10" ry="5" fill="#f9a8d4" opacity="0.7"/>
          <ellipse cx={x-5} cy="130" rx="7" ry="4" fill="#fbcfe8" opacity="0.6" transform={`rotate(-20 ${x-5} 130)`}/>
          <ellipse cx={x+5} cy="130" rx="7" ry="4" fill="#fbcfe8" opacity="0.6" transform={`rotate(20 ${x+5} 130)`}/>
          <circle cx={x} cy="130" r="3" fill="#fde047"/>
        </g>
      ))}

      {/* Misty bank */}
      <ellipse cx="200" cy="135" rx="200" ry="15" fill="#0c4a6e" opacity="0.4"/>

      {/* Mangrove roots */}
      {[30,80,320,370].map((x,i)=>(
        <path key={i} d={`M${x} 90 Q${x+10} 115 ${x+5} 130 M${x+15} 90 Q${x+5} 115 ${x+10} 130`}
          stroke="#1e3a5f" strokeWidth="3" fill="none"/>
      ))}

      {/* Fireflies on water */}
      {[100,200,300].map((x,i)=>(
        <circle key={i} cx={x} cy={125+i*2} r="1.5" fill="#67e8f9" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur={`${2+i*0.5}s`} repeatCount="indefinite"/>
        </circle>
      ))}

      <line x1="200" y1="60" x2="200" y2="130" stroke="#22d3ee" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3"/>
    </svg>
  );
}

// ─── Fire Fields ──────────────────────────────────────────────────────────────

function FireArena() {
  return (
    <svg viewBox="0 0 400 180" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="fire-sky" cx="50%" cy="0%" r="100%">
          <stop offset="0%"   stopColor="#450a0a"/>
          <stop offset="100%" stopColor="#1c0505"/>
        </radialGradient>
        <radialGradient id="fire-glow" cx="50%" cy="100%" r="80%">
          <stop offset="0%"   stopColor="#f97316" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
        </radialGradient>
        <filter id="fire-blur"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>
      <rect width="400" height="180" fill="url(#fire-sky)"/>
      <rect width="400" height="180" fill="url(#fire-glow)"/>

      {/* Cracked earth */}
      <rect x="0" y="148" width="400" height="32" fill="#1c0505"/>
      <rect x="0" y="148" width="400" height="5"  fill="#450a0a"/>
      {/* Lava cracks */}
      {[
        "M30 152 L60 155 L90 151 L120 156",
        "M150 153 L185 158 L220 152 L255 157",
        "M270 154 L305 151 L340 156 L370 153",
        "M50 160 L80 163 L110 159",
        "M200 160 L230 164 L260 161",
      ].map((d,i)=>(
        <path key={i} d={d} stroke="#f97316" strokeWidth="1.5" fill="none" opacity="0.7">
          <animate attributeName="opacity" values="0.7;1;0.7" dur={`${1+i*0.3}s`} repeatCount="indefinite"/>
        </path>
      ))}

      {/* Volcanic rocks */}
      {[40,110,200,290,360].map((x,i)=>(
        <g key={i}>
          <ellipse cx={x} cy="152" rx={15+i%3*5} ry="8" fill="#3d0a0a"/>
          <ellipse cx={x} cy="150" rx={12+i%3*4} ry="6" fill="#510e0e"/>
        </g>
      ))}

      {/* Background volcano */}
      <polygon points="200,20 140,148 260,148" fill="#2d0707" opacity="0.8"/>
      <polygon points="200,20 155,148 245,148" fill="#3d0a0a" opacity="0.6"/>
      {/* Lava flow from volcano */}
      <path d="M195 20 Q200 60 205 80 Q208 100 200 120 Q195 135 197 148" stroke="#f97316" strokeWidth="4" fill="none" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" repeatCount="indefinite"/>
      </path>

      {/* Flame particles — multiple sizes */}
      {[50,100,160,200,240,300,350].map((x,i)=>(
        <g key={i}>
          <ellipse cx={x} cy="148" rx="5" ry="12" fill="#f97316" opacity="0.8">
            <animateTransform attributeName="transform" type="translate" values={`0,0;${(i%2===0?2:-2)},${-8-i%3*4};0,0`} dur={`${0.8+i*0.2}s`} repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur={`${0.8+i*0.2}s`} repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx={x} cy="147" rx="3" ry="7" fill="#fbbf24" opacity="0.7">
            <animateTransform attributeName="transform" type="translate" values={`0,0;${(i%2===0?1:-1)},${-5-i%3*3};0,0`} dur={`${0.6+i*0.15}s`} repeatCount="indefinite"/>
          </ellipse>
        </g>
      ))}

      {/* Ember particles */}
      {[60,130,200,270,340].map((x,i)=>(
        <circle key={i} cx={x} cy={60+i*10} r="1.5" fill="#fbbf24" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0;0.8" dur={`${1+i*0.3}s`} repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="translate" values={`0,0;${(i%2===0?10:-8)},${-20-i*5};0,0`} dur={`${1+i*0.3}s`} repeatCount="indefinite"/>
        </circle>
      ))}

      {/* Red sky glow at horizon */}
      <rect x="0" y="120" width="400" height="30" fill="#7c2d12" opacity="0.3" filter="url(#fire-blur)"/>

      <line x1="200" y1="20" x2="200" y2="148" stroke="#f97316" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3"/>
    </svg>
  );
}

// ─── Shadow Realm ──────────────────────────────────────────────────────────────

function ShadowArena() {
  return (
    <svg viewBox="0 0 400 180" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="sha-bg" cx="50%" cy="50%" r="70%">
          <stop offset="0%"   stopColor="#1a0938"/>
          <stop offset="100%" stopColor="#050008"/>
        </radialGradient>
        <radialGradient id="sha-rift" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
        </radialGradient>
        <filter id="sha-glow"><feGaussianBlur stdDeviation="5"/></filter>
        <filter id="sha-blur"><feGaussianBlur stdDeviation="2"/></filter>
      </defs>
      <rect width="400" height="180" fill="url(#sha-bg)"/>

      {/* Void rifts */}
      <ellipse cx="200" cy="90" rx="60" ry="30" fill="url(#sha-rift)" filter="url(#sha-glow)"/>
      {/* Rift cracks */}
      {[
        "M180 75 L190 85 L175 95 L185 105",
        "M220 75 L210 85 L225 95 L215 105",
        "M200 60 L200 120",
      ].map((d,i)=>(
        <path key={i} d={d} stroke="#7c3aed" strokeWidth="1.5" fill="none" opacity="0.6">
          <animate attributeName="opacity" values="0.6;1;0.6" dur={`${1.5+i*0.5}s`} repeatCount="indefinite"/>
        </path>
      ))}

      {/* Floating debris / rocks */}
      {[
        {x:60,  y:40,  r:6},
        {x:130, y:70,  r:4},
        {x:280, y:50,  r:7},
        {x:340, y:80,  r:5},
        {x:100, y:100, r:4},
        {x:310, y:110, r:6},
      ].map((d,i)=>(
        <g key={i}>
          <ellipse cx={d.x} cy={d.y} rx={d.r} ry={d.r*0.6} fill="#2e1065">
            <animateTransform attributeName="transform" type="translate"
              values={`0,0;${(i%2===0?4:-4)},${-6+i%3*3};0,0`}
              dur={`${2+i*0.5}s`} repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx={d.x} cy={d.y+d.r*2} rx={d.r*0.6} ry="1" fill="#7c3aed" opacity="0.2" filter="url(#sha-blur)"/>
        </g>
      ))}

      {/* Shadow tendrils from bottom */}
      {[30,90,140,200,260,310,370].map((x,i)=>(
        <path key={i}
          d={`M${x} 180 Q${x+10} ${140-i%3*15} ${x-5} ${110-i%2*20}`}
          stroke="#4c1d95" strokeWidth={3+i%3} fill="none" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.8;0.5" dur={`${1.5+i*0.3}s`} repeatCount="indefinite"/>
        </path>
      ))}

      {/* Purple orbs */}
      {[50,150,250,350].map((x,i)=>(
        <circle key={i} cx={x} cy={30+i*20} r="3" fill="#7c3aed" opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur={`${1+i*0.4}s`} repeatCount="indefinite"/>
          <animate attributeName="r" values="3;5;3" dur={`${1+i*0.4}s`} repeatCount="indefinite"/>
        </circle>
      ))}

      {/* Ground — cracked dark stone */}
      <rect x="0" y="155" width="400" height="25" fill="#0f0a1a"/>
      {[50,120,200,280,350].map((x,i)=>(
        <line key={i} x1={x} y1="155" x2={x+20} y2="165" stroke="#4c1d95" strokeWidth="1" opacity="0.5"/>
      ))}

      {/* Central dark portal */}
      <ellipse cx="200" cy="90" rx="25" ry="35" fill="#050008" opacity="0.6"/>
      <ellipse cx="200" cy="90" rx="25" ry="35" fill="none" stroke="#6d28d9" strokeWidth="1.5" opacity="0.5">
        <animate attributeName="ry" values="35;40;35" dur="3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0.8;0.5" dur="3s" repeatCount="indefinite"/>
      </ellipse>

      <line x1="200" y1="20" x2="200" y2="155" stroke="#7c3aed" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3"/>
    </svg>
  );
}

// ─── Storm Peak ───────────────────────────────────────────────────────────────

function StormArena() {
  return (
    <svg viewBox="0 0 400 180" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="sto-sky" cx="50%" cy="0%" r="100%">
          <stop offset="0%"   stopColor="#1c1400"/>
          <stop offset="100%" stopColor="#0a0a05"/>
        </radialGradient>
        <radialGradient id="sto-glow" cx="50%" cy="40%" r="50%">
          <stop offset="0%"   stopColor="#fbbf24" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0"/>
        </radialGradient>
        <filter id="sto-bolt"><feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="sto-cloud"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <rect width="400" height="180" fill="url(#sto-sky)"/>
      <rect width="400" height="180" fill="url(#sto-glow)"/>

      {/* Storm clouds */}
      {[
        {cx:70,  cy:25, rx:50, ry:18},
        {cx:200, cy:15, rx:80, ry:25},
        {cx:340, cy:30, rx:55, ry:20},
        {cx:130, cy:40, rx:45, ry:16},
        {cx:280, cy:35, rx:50, ry:18},
      ].map((c,i)=>(
        <ellipse key={i} cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill="#1c1917" opacity="0.9"/>
      ))}
      {/* Cloud highlights */}
      {[60,190,330].map((x,i)=>(
        <ellipse key={i} cx={x} cy={20+i*5} rx={30} ry={8} fill="#292524" opacity="0.6"/>
      ))}

      {/* Mountain peak */}
      <polygon points="200,45 120,155 280,155" fill="#1c1917"/>
      <polygon points="200,45 150,155 250,155" fill="#292524"/>
      {/* Snow cap */}
      <polygon points="200,45 188,80 212,80" fill="#f0f9ff" opacity="0.8"/>

      {/* Lightning bolts */}
      <g filter="url(#sto-bolt)">
        <polygon points="100,30 90,70 98,70 82,110" fill="#fde047" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0;0.9" dur="2.4s" repeatCount="indefinite" begin="0s"/>
        </polygon>
        <polygon points="102,30 92,70 100,70 84,110" fill="#fbbf24" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0;0.5" dur="2.4s" repeatCount="indefinite" begin="0s"/>
        </polygon>
      </g>
      <g filter="url(#sto-bolt)">
        <polygon points="300,25 288,65 297,65 278,105" fill="#fde047" opacity="0.9">
          <animate attributeName="opacity" values="0;0.9;0" dur="3.1s" repeatCount="indefinite" begin="0.5s"/>
        </polygon>
      </g>
      <g filter="url(#sto-bolt)">
        <polygon points="200,10 193,42 199,42 187,75" fill="#fde047" opacity="0.7">
          <animate attributeName="opacity" values="0;0.7;0" dur="1.8s" repeatCount="indefinite" begin="1s"/>
        </polygon>
      </g>

      {/* Rain streaks */}
      {Array.from({length:20},(_,i)=>(
        <line key={i}
          x1={i*22+5} y1={20+i%5*8}
          x2={i*22}   y2={40+i%5*8}
          stroke="#bae6fd" strokeWidth="0.5" opacity="0.2">
          <animateTransform attributeName="transform" type="translate" values="0,0;-5,20" dur={`${0.5+i%3*0.2}s`} repeatCount="indefinite"/>
        </line>
      ))}

      {/* Ground — rocky peak ledge */}
      <rect x="0" y="155" width="400" height="25" fill="#0f0a0a"/>
      <ellipse cx="200" cy="155" rx="200" ry="12" fill="#1a1008"/>
      {/* Rocky texture */}
      {[30,90,160,230,300,360].map((x,i)=>(
        <ellipse key={i} cx={x} cy={158} rx={12+i%3*4} ry="5" fill="#292524"/>
      ))}

      {/* Flash effect ring */}
      <circle cx="200" cy="80" r="60" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.1">
        <animate attributeName="r" values="40;80;40" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2s" repeatCount="indefinite"/>
      </circle>

      <line x1="200" y1="45" x2="200" y2="155" stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3"/>
    </svg>
  );
}

// ─── Amazon Arena (Floresta Amazônica — golden hour) ──────────────────────────

function AmazonArena() {
  return (
    <svg viewBox="0 0 400 180" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="amz-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#c2410c"/>
          <stop offset="50%"  stopColor="#f97316"/>
          <stop offset="100%" stopColor="#fbbf24"/>
        </linearGradient>
        <radialGradient id="amz-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#fde047" stopOpacity="1"/>
          <stop offset="70%"  stopColor="#fde047" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#fde047" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="amz-gnd" cx="50%" cy="0%" r="100%">
          <stop offset="0%"   stopColor="#166534"/>
          <stop offset="100%" stopColor="#052e16"/>
        </radialGradient>
        <filter id="amz-blur"><feGaussianBlur stdDeviation="3"/></filter>
        <filter id="amz-glow"><feGaussianBlur stdDeviation="5"/></filter>
      </defs>

      {/* Sky gradient */}
      <rect width="400" height="180" fill="url(#amz-sky)"/>

      {/* Sun glow halo */}
      <circle cx="60" cy="28" r="38" fill="url(#amz-sun)" filter="url(#amz-glow)" opacity="0.3"/>
      {/* Sun */}
      <circle cx="60" cy="28" r="22" fill="#fde047"/>

      {/* Distant mountains silhouette */}
      <path d="M0 90 Q40 55 80 70 Q120 50 160 75 Q200 55 240 72 Q280 48 320 68 Q360 52 400 70 L400 110 L0 110 Z"
        fill="#15803d" opacity="0.5"/>

      {/* BG canopy silhouette */}
      <path d="M0 80 Q20 55 45 68 Q65 50 90 65 Q110 50 140 62 Q165 48 195 60 Q220 50 250 62 Q275 48 305 60 Q330 50 360 62 Q380 55 400 60 L400 90 L0 90 Z"
        fill="#14532d"/>

      {/* Birds — animated V shapes moving right */}
      <g opacity="0.8">
        <path d="M30 22 L34 18 L38 22" stroke="#7c2d12" strokeWidth="1.5" fill="none" strokeLinecap="round">
          <animateTransform attributeName="transform" type="translate" values="-40,0;420,0" dur="8s" repeatCount="indefinite"/>
        </path>
        <path d="M80 15 L85 11 L90 15" stroke="#7c2d12" strokeWidth="1.5" fill="none" strokeLinecap="round">
          <animateTransform attributeName="transform" type="translate" values="-80,0;380,0" dur="10s" repeatCount="indefinite" begin="2s"/>
        </path>
        <path d="M0 35 L5 31 L10 35" stroke="#7c2d12" strokeWidth="1.5" fill="none" strokeLinecap="round">
          <animateTransform attributeName="transform" type="translate" values="-10,0;420,0" dur="12s" repeatCount="indefinite" begin="5s"/>
        </path>
      </g>

      {/* Mid-ground tree trunks with canopy */}
      {[70,130,200,265,330].map((x,i)=>(
        <g key={i}>
          <rect x={x-5} y={90} width="10" height={70} fill="#166534"/>
          <circle cx={x} cy={85} r={18+i%3*4} fill="#166534"/>
          <circle cx={x-8} cy={78} r={12+i%2*3} fill="#15803d"/>
        </g>
      ))}

      {/* Hanging vines */}
      <path d="M60 0 Q55 30 65 55 Q58 70 62 90" stroke="#15803d" strokeWidth="3" fill="none" opacity="0.8"/>
      <path d="M200 0 Q195 25 205 50 Q198 65 202 85" stroke="#15803d" strokeWidth="3" fill="none" opacity="0.7"/>
      <path d="M340 0 Q345 28 335 52 Q342 68 338 88" stroke="#15803d" strokeWidth="3" fill="none" opacity="0.8"/>

      {/* Left large foreground tree */}
      <g>
        <path d="M5 180 Q12 120 8 60" stroke="#14532d" strokeWidth="20" fill="none" strokeLinecap="round"/>
        <ellipse cx="10" cy="55" rx="32" ry="38" fill="#166534"/>
        <ellipse cx="28" cy="45" rx="26" ry="30" fill="#15803d"/>
        <ellipse cx="-2" cy="48" rx="22" ry="28" fill="#166534" opacity="0.9"/>
      </g>

      {/* Right large foreground tree */}
      <g>
        <path d="M395 180 Q388 120 392 60" stroke="#14532d" strokeWidth="20" fill="none" strokeLinecap="round"/>
        <ellipse cx="390" cy="55" rx="32" ry="38" fill="#166534"/>
        <ellipse cx="372" cy="45" rx="26" ry="30" fill="#15803d"/>
        <ellipse cx="402" cy="48" rx="22" ry="28" fill="#166534" opacity="0.9"/>
      </g>

      {/* River winding through midground */}
      <path d="M80 128 Q120 118 160 125 Q200 132 240 122 Q280 112 320 120"
        stroke="#0369a1" strokeWidth="18" fill="none" opacity="0.7" strokeLinecap="round"/>
      {/* Water shimmer */}
      <path d="M90 125 Q130 118 170 124 Q210 130 250 120 Q290 112 310 118"
        stroke="#7dd3fc" strokeWidth="2" fill="none" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite"/>
      </path>

      {/* Ground */}
      <rect x="0" y="158" width="400" height="22" fill="#166534"/>
      <ellipse cx="200" cy="158" rx="200" ry="12" fill="#22c55e" opacity="0.5"/>

      {/* Tropical flowers */}
      {[50,160,250,360].map((x,i)=>(
        <g key={i}>
          <circle cx={x} cy={160} r="5" fill={i%2===0?"#f97316":"#ec4899"}/>
          <circle cx={x-5} cy={157} r="3.5" fill={i%2===0?"#fb923c":"#f472b6"} opacity="0.8"/>
          <circle cx={x+5} cy={157} r="3.5" fill={i%2===0?"#fb923c":"#f472b6"} opacity="0.8"/>
          <circle cx={x} cy={154} r="3.5" fill={i%2===0?"#fb923c":"#f472b6"} opacity="0.8"/>
          <circle cx={x} cy={160} r="2" fill="#fde047"/>
        </g>
      ))}

      {/* Animated falling leaves */}
      {[100,180,280,360].map((x,i)=>(
        <ellipse key={i} cx={x} cy={20+i*10} rx="4" ry="2.5" fill="#22c55e" opacity="0.7">
          <animateTransform attributeName="transform" type="translate"
            values={`0,0;${(i%2===0?15:-12)},${80+i*10};0,0`}
            dur={`${4+i*1.2}s`} repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur={`${4+i*1.2}s`} repeatCount="indefinite"/>
        </ellipse>
      ))}

      {/* Light shafts from canopy */}
      <polygon points="150,0 170,0 210,90 190,90" fill="#fbbf24" opacity="0.05"/>
      <polygon points="220,0 240,0 280,90 260,90" fill="#fbbf24" opacity="0.04"/>
      <polygon points="280,0 295,0 330,90 315,90" fill="#fbbf24" opacity="0.04"/>

      {/* Fireflies */}
      {[120,200,310].map((x,i)=>(
        <circle key={i} cx={x} cy={100+i*8} r="2" fill="#fde047" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.1;0.8" dur={`${1.5+i*0.6}s`} repeatCount="indefinite"/>
          <animate attributeName="r" values="1.5;2.5;1.5" dur={`${1.5+i*0.6}s`} repeatCount="indefinite"/>
        </circle>
      ))}

      {/* Center divider */}
      <line x1="200" y1="60" x2="200" y2="158" stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.35"/>
    </svg>
  );
}

// ─── Stadium Arena (Maracanã — Rio de Janeiro, jogo noturno) ──────────────────

function StadiumArena() {
  return (
    <svg viewBox="0 0 400 180" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="mrc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#020617"/>
          <stop offset="65%"  stopColor="#0f172a"/>
          <stop offset="100%" stopColor="#1e3a5f"/>
        </linearGradient>
        <linearGradient id="mrc-roof-l" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#94a3b8"/>
          <stop offset="100%" stopColor="#334155"/>
        </linearGradient>
        <linearGradient id="mrc-roof-r" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#94a3b8"/>
          <stop offset="100%" stopColor="#334155"/>
        </linearGradient>
        <radialGradient id="mrc-pitch-glow" cx="50%" cy="60%" r="55%">
          <stop offset="0%"   stopColor="#4ade80" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="mrc-floodlight" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#fef9c3" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#fde047" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="mrc-cristo-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#fef9c3" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#fef9c3" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="mrc-city-glow" cx="50%" cy="80%" r="60%">
          <stop offset="0%"   stopColor="#f97316" stopOpacity="0.10"/>
          <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
        </radialGradient>
        <filter id="mrc-glow"><feGaussianBlur stdDeviation="3"/></filter>
        <filter id="mrc-sglow"><feGaussianBlur stdDeviation="7"/></filter>
        <filter id="mrc-cglow"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>

      {/* ─── NIGHT SKY ─── */}
      <rect width="400" height="180" fill="url(#mrc-sky)"/>
      <rect width="400" height="180" fill="url(#mrc-city-glow)"/>

      {/* Stars */}
      {[15,35,52,70,92,115,138,160,185,212,238,262,288,315,342,368,390,
         25,58,98,148,178,222,268,308,352,382,42,88,132,172,242,292,328,372].map((x,i)=>(
        <circle key={i} cx={x} cy={2+i%9*4} r={i%4===0?"0.9":"0.5"} fill="white"
          opacity={0.18+i%5*0.08+(i%7===0?0.2:0)}/>
      ))}

      {/* ─── TIJUCA ATLANTIC FOREST — left hillside ─── */}
      <path d="M0 118 Q8 90 20 78 Q35 65 52 68 Q68 60 82 65 Q96 56 112 62 Q124 52 138 58 Q148 48 160 54 Q168 46 172 52 L170 118 Z"
        fill="#0d2210" opacity="0.97"/>
      {/* Forest layers */}
      <path d="M0 105 Q12 82 28 74 Q45 64 62 68 Q78 60 95 64 Q110 55 128 60 Q140 50 156 56 Q164 48 172 52"
        stroke="#15803d" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.6"/>
      {/* Treetop silhouettes */}
      {[8,22,38,54,70,86,100,116,132,148,162].map((x,i)=>(
        <g key={i}>
          <ellipse cx={x} cy={66+i%4*4} rx={7+i%3*3} ry={5+i%2*3} fill="#14532d" opacity="0.9"/>
          <ellipse cx={x+4} cy={62+i%3*4} rx={5+i%2*2} ry={4+i%3*2} fill="#166534" opacity="0.7"/>
        </g>
      ))}

      {/* ─── CORCOVADO MOUNTAIN (center background) ─── */}
      {/* Mountain mass */}
      <path d="M152 118 Q162 96 174 78 Q182 62 190 50 Q195 40 198 34 L200 30 L202 34 Q205 40 210 50 Q218 62 226 78 Q238 96 248 118 Z"
        fill="#0a1a0a"/>
      {/* Mountain ridgeline highlight */}
      <path d="M180 64 Q188 50 194 40 Q197 34 200 30 L202 34 Q205 40 210 50 Q216 62 222 74"
        stroke="#1a3020" strokeWidth="2" fill="none" opacity="0.8"/>
      {/* Forest cloak on slopes */}
      {[158,168,178,220,230,240].map((x,i)=>(
        <ellipse key={i} cx={x} cy={102+i%2*6} rx={8+i%2*3} ry={6} fill="#166534" opacity="0.5"/>
      ))}

      {/* ─── CRISTO REDENTOR ─── */}
      {/* Uplighting cone from mountain */}
      <path d="M194 118 Q196 60 200 32 Q204 60 206 118" fill="#fef9c3" opacity="0.018"/>
      {/* Halo / spotlight glow */}
      <circle cx="200" cy="26" r="11" fill="url(#mrc-cristo-halo)" filter="url(#mrc-cglow)" opacity="0.9"/>
      {/* Pedestal */}
      <rect x="198.5" y="29" width="4" height="3.5" rx="0.6" fill="#c9a040" opacity="0.85"/>
      {/* Body */}
      <rect x="199.5" y="17" width="2.5" height="13" rx="0.8" fill="#f8fafc" opacity="0.97"/>
      {/* Arms outstretched */}
      <rect x="192" y="20.5" width="17" height="2.2" rx="0.8" fill="#f8fafc" opacity="0.97"/>
      {/* Head */}
      <circle cx="200.8" cy="16" r="1.9" fill="#f8fafc" opacity="0.95"/>
      {/* Tiny glow dots under arms (uplights) */}
      <circle cx="193" cy="21" r="1.2" fill="#fef9c3" opacity="0.5" filter="url(#mrc-glow)"/>
      <circle cx="208" cy="21" r="1.2" fill="#fef9c3" opacity="0.5" filter="url(#mrc-glow)"/>

      {/* ─── PÃO DE AÇÚCAR — SUGARLOAF (right background) ─── */}
      {/* The iconic rounded granite dome */}
      <path d="M318 118 Q322 102 328 88 Q334 74 342 62 Q349 52 357 46 Q363 42 368 43 Q374 44 379 51 Q385 59 389 70 Q393 82 395 95 Q398 107 400 118 Z"
        fill="#0e1e0e"/>
      {/* Dome highlight — left lit face */}
      <path d="M342 62 Q349 52 357 46 Q363 42 368 43 Q366 45 362 49 Q356 55 350 63 Q344 72 340 82"
        stroke="#2d4a1e" strokeWidth="3" fill="none" opacity="0.7"/>
      {/* Morro da Urca (smaller hill in front) */}
      <path d="M305 118 Q310 108 318 100 Q326 93 332 95 Q338 94 342 100 Q346 106 348 118 Z"
        fill="#0a1a0a" opacity="0.9"/>
      {/* Forest on lower Sugarloaf slopes */}
      {[322,332,342,352,376,386,396].map((x,i)=>(
        <ellipse key={i} cx={x} cy={96+i%3*4} rx={6+i%2*2} ry={5} fill="#14532d" opacity={0.5+i%2*0.15}/>
      ))}

      {/* ─── CITY LIGHTS (Zona Sul / Botafogo / Flamengo) ─── */}
      {/* Building mass silhouette */}
      <rect x="170" y="98" width="130" height="18" fill="#0a1220" opacity="0.8"/>
      {/* Window lights — warm glow */}
      {Array.from({length:65},(_,i)=>{
        const cols=["#fbbf24","#f97316","#fde047","#fb923c","#fef3c7","#fde68a"];
        return <rect key={i} x={172+(i%22)*5.8} y={100+Math.floor(i/22)*5+(i%3)*1.2}
          width={1+i%2*0.4} height={1.4+i%3*0.4}
          fill={cols[i%6]} opacity={0.35+i%4*0.1}/>;
      })}
      {/* Coastal road lights (Aterro) */}
      {Array.from({length:18},(_,i)=>(
        <circle key={i} cx={170+i*7.5} cy={114} r="0.8" fill="#fbbf24" opacity="0.25"/>
      ))}

      {/* ─── MARACANÃ ROOF — left panel ─── */}
      <path d="M0 2 Q35 0 70 3 Q105 6 135 14 Q158 20 168 35 Q173 44 170 60 L148 65 Q150 50 146 42 Q138 28 116 20 Q88 11 55 8 Q25 5 0 8 Z"
        fill="url(#mrc-roof-l)" stroke="#475569" strokeWidth="0.8"/>
      {[0,22,44,66,88,110,132,148].map((x,i)=>(
        <line key={i} x1={x} y1={2+i*0.4} x2={x} y2={60-i*0.2}
          stroke="#64748b" strokeWidth="0.7" opacity="0.45"/>
      ))}
      <path d="M0 8 Q25 5 55 8 Q88 11 116 20 Q138 28 146 42 Q150 50 148 65"
        stroke="#fef9c3" strokeWidth="2.5" fill="none" opacity="0.7" filter="url(#mrc-glow)"/>
      {[[20,7],[50,9],[85,12],[115,21],[140,34],[150,52]].map(([x,y],i)=>(
        <ellipse key={i} cx={x} cy={y} rx="14" ry="7"
          fill="url(#mrc-floodlight)" filter="url(#mrc-sglow)" opacity="0.6"/>
      ))}

      {/* ─── MARACANÃ ROOF — right panel ─── */}
      <path d="M400 2 Q365 0 330 3 Q295 6 265 14 Q242 20 232 35 Q227 44 230 60 L252 65 Q250 50 254 42 Q262 28 284 20 Q312 11 345 8 Q375 5 400 8 Z"
        fill="url(#mrc-roof-r)" stroke="#475569" strokeWidth="0.8"/>
      {[400,378,356,334,312,290,268,252].map((x,i)=>(
        <line key={i} x1={x} y1={2+i*0.4} x2={x} y2={60-i*0.2}
          stroke="#64748b" strokeWidth="0.7" opacity="0.45"/>
      ))}
      <path d="M400 8 Q375 5 345 8 Q312 11 284 20 Q262 28 254 42 Q250 50 252 65"
        stroke="#fef9c3" strokeWidth="2.5" fill="none" opacity="0.7" filter="url(#mrc-glow)"/>
      {[[380,7],[350,9],[315,12],[285,21],[260,34],[250,52]].map(([x,y],i)=>(
        <ellipse key={i} cx={x} cy={y} rx="14" ry="7"
          fill="url(#mrc-floodlight)" filter="url(#mrc-sglow)" opacity="0.6"/>
      ))}

      {/* ─── STANDS ─── */}
      <rect x="0" y="58" width="400" height="32" fill="#0f172a"/>
      {Array.from({length:96},(_,i)=>{
        const colors=["#fde047","#22c55e","#fde047","#f8fafc","#22c55e","#fde047","#3b82f6","#fde047"];
        return <rect key={i} x={1+(i%48)*8} y={60+Math.floor(i/48)*12}
          width="6" height="9" fill={colors[i%8]} opacity="0.7"/>;
      })}
      <rect x="0" y="60" width="68" height="58" fill="#0c1525"/>
      {Array.from({length:54},(_,i)=>{
        const colors=["#fde047","#22c55e","#fde047","#f8fafc","#22c55e","#fde047"];
        return <circle key={i} cx={5+(i%6)*10} cy={66+(Math.floor(i/6))*8}
          r="3.2" fill={colors[i%6]} opacity="0.82"/>;
      })}
      <rect x="332" y="60" width="68" height="58" fill="#0c1525"/>
      {Array.from({length:54},(_,i)=>{
        const colors=["#fde047","#22c55e","#fde047","#f8fafc","#22c55e","#fde047"];
        return <circle key={i} cx={336+(i%6)*10} cy={66+(Math.floor(i/6))*8}
          r="3.2" fill={colors[i%6]} opacity="0.82"/>;
      })}

      {/* ─── SCOREBOARD ─── */}
      <rect x="152" y="4" width="96" height="24" rx="3" fill="#020617" stroke="#475569" strokeWidth="1"/>
      <rect x="154" y="6" width="92" height="20" rx="2" fill="#0a0a0a"/>
      <text x="200" y="15" textAnchor="middle" fontSize="7" fill="#fde047"
        fontFamily="monospace" fontWeight="bold" letterSpacing="1">MARACANÃ</text>
      <text x="200" y="24" textAnchor="middle" fontSize="6" fill="white"
        fontFamily="monospace">0  x  0</text>

      {/* ─── FOOTBALL PITCH ─── */}
      {[0,1,2,3,4,5].map(i=>(
        <rect key={i} x="68" y={118+i*10} width="264" height="10"
          fill={i%2===0?"#166534":"#15803d"}/>
      ))}
      <rect x="68" y="118" width="264" height="62" fill="url(#mrc-pitch-glow)"/>
      <rect x="70" y="120" width="260" height="58" fill="none" stroke="white" strokeWidth="1.5" opacity="0.75"/>
      <line x1="200" y1="120" x2="200" y2="178" stroke="white" strokeWidth="1.5" opacity="0.75"/>
      <ellipse cx="200" cy="149" rx="28" ry="14" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7"/>
      <circle cx="200" cy="149" r="2" fill="white" opacity="0.8"/>
      <rect x="70" y="133" width="54" height="32" fill="none" stroke="white" strokeWidth="1.2" opacity="0.65"/>
      <rect x="70" y="140" width="26" height="18" fill="none" stroke="white" strokeWidth="1" opacity="0.55"/>
      <rect x="276" y="133" width="54" height="32" fill="none" stroke="white" strokeWidth="1.2" opacity="0.65"/>
      <rect x="304" y="140" width="26" height="18" fill="none" stroke="white" strokeWidth="1" opacity="0.55"/>
      <line x1="70" y1="120" x2="70" y2="114" stroke="white" strokeWidth="1" opacity="0.5"/>
      <line x1="330" y1="120" x2="330" y2="114" stroke="white" strokeWidth="1" opacity="0.5"/>

      {/* Battle divider */}
      <line x1="200" y1="60" x2="200" y2="180" stroke="#22c55e" strokeWidth="0.5" strokeDasharray="5 4" opacity="0.3"/>
    </svg>
  );
}

// ─── Sea Arena (Baía de Todos os Santos — Salvador, Bahia) ────────────────────

function SeaArena() {
  return (
    <svg viewBox="0 0 400 180" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="bts-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0369a1"/>
          <stop offset="55%"  stopColor="#38bdf8"/>
          <stop offset="100%" stopColor="#7dd3fc"/>
        </linearGradient>
        <linearGradient id="bts-bay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0891b2"/>
          <stop offset="50%"  stopColor="#0e7490"/>
          <stop offset="100%" stopColor="#155e75"/>
        </linearGradient>
        <linearGradient id="bts-hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#365314"/>
          <stop offset="100%" stopColor="#4d7c0f"/>
        </linearGradient>
        <radialGradient id="bts-sun-haze" cx="75%" cy="25%" r="35%">
          <stop offset="0%"   stopColor="#fef9c3" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#fef9c3" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="bts-fort-stone" cx="40%" cy="35%" r="60%">
          <stop offset="0%"   stopColor="#e8d5a3"/>
          <stop offset="100%" stopColor="#b8936a"/>
        </radialGradient>
        <filter id="bts-glow"><feGaussianBlur stdDeviation="5"/></filter>
        <filter id="bts-blur2"><feGaussianBlur stdDeviation="2"/></filter>
      </defs>

      {/* ─── SKY ─── */}
      <rect width="400" height="180" fill="url(#bts-sky)"/>
      {/* Sun haze top-right */}
      <ellipse cx="310" cy="22" rx="70" ry="35" fill="url(#bts-sun-haze)" filter="url(#bts-glow)"/>
      {/* Sun disk */}
      <circle cx="320" cy="18" r="14" fill="#fef08a" opacity="0.9"/>
      <circle cx="320" cy="18" r="18" fill="none" stroke="#fde047" strokeWidth="2" opacity="0.3"/>

      {/* Clouds */}
      <ellipse cx="230" cy="18" rx="42" ry="12" fill="white" opacity="0.88"/>
      <ellipse cx="260" cy="13" rx="26" ry="9"  fill="white" opacity="0.92"/>
      <ellipse cx="295" cy="20" rx="30" ry="10" fill="white" opacity="0.8"/>
      <ellipse cx="115" cy="20" rx="38" ry="11" fill="white" opacity="0.75"/>
      <ellipse cx="140" cy="14" rx="22" ry="8"  fill="white" opacity="0.82"/>

      {/* ─── CIDADE ALTA (Salvador hillside — Cidade Alta) ─── */}
      {/* Hill mass */}
      <path d="M0 92 Q15 38 50 26 Q80 16 115 22 Q148 28 168 42 Q182 52 182 88 L0 88 Z"
        fill="url(#bts-hill)"/>
      {/* Extra green depth */}
      <path d="M0 75 Q18 34 48 24 Q74 15 108 20 Q140 25 162 38 Q176 46 178 60"
        fill="#1a2e05" opacity="0.35"/>

      {/* Colonial buildings — Cidade Alta */}
      {/* Building row 1 */}
      <rect x="10"  y="54" width="16" height="34" fill="#e8d5a3" stroke="#c9a861" strokeWidth="0.5"/>
      <rect x="11"  y="50" width="14" height="6"  fill="#b45309"/>
      <rect x="28"  y="48" width="18" height="40" fill="#fef3c7" stroke="#c9a861" strokeWidth="0.5"/>
      <rect x="29"  y="44" width="16" height="6"  fill="#92400e"/>
      <rect x="48"  y="52" width="16" height="36" fill="#e8d5a3" stroke="#c9a861" strokeWidth="0.5"/>
      <rect x="49"  y="48" width="14" height="6"  fill="#b45309"/>
      <rect x="66"  y="46" width="18" height="42" fill="#fde68a" stroke="#c9a861" strokeWidth="0.5"/>
      <rect x="67"  y="42" width="16" height="6"  fill="#92400e"/>
      <rect x="86"  y="50" width="16" height="38" fill="#fef3c7" stroke="#c9a861" strokeWidth="0.5"/>
      <rect x="87"  y="46" width="14" height="6"  fill="#b45309"/>
      <rect x="104" y="47" width="18" height="41" fill="#e8d5a3" stroke="#c9a861" strokeWidth="0.5"/>
      <rect x="105" y="43" width="16" height="6"  fill="#78350f"/>
      <rect x="124" y="52" width="16" height="36" fill="#fde68a" stroke="#c9a861" strokeWidth="0.5"/>
      <rect x="125" y="48" width="14" height="6"  fill="#b45309"/>
      <rect x="142" y="55" width="18" height="33" fill="#fef3c7" stroke="#c9a861" strokeWidth="0.5"/>
      <rect x="143" y="51" width="16" height="6"  fill="#92400e"/>
      <rect x="160" y="58" width="14" height="30" fill="#e8d5a3" stroke="#c9a861" strokeWidth="0.5"/>

      {/* Windows */}
      {[10,28,48,66,86,104,124,142].map((x,i)=>(
        <g key={i}>
          <rect x={x+2}  y={58+i%2*4} width="4" height="5" fill="#7dd3fc" opacity="0.75"/>
          <rect x={x+9}  y={60+i%2*4} width="4" height="5" fill="#7dd3fc" opacity="0.75"/>
          <rect x={x+3}  y={70+i%2*3} width="4" height="5" fill="#bae6fd" opacity="0.6"/>
        </g>
      ))}

      {/* ─── CHURCH SPIRES ─── */}
      {/* Igreja do Bonfim style — left spire */}
      <rect x="22" y="32" width="11" height="28" fill="#f5f5f4" stroke="#d1d5db" strokeWidth="0.5"/>
      <polygon points="27,20 18,32 36,32" fill="#d4a017"/>
      <rect x="25" y="24" width="5" height="6" fill="#93c5fd" opacity="0.8"/>
      <line x1="27" y1="20" x2="27" y2="15" stroke="#d4a017" strokeWidth="1.5"/>
      <line x1="25" y1="17" x2="29" y2="17" stroke="#d4a017" strokeWidth="1.5"/>

      {/* Right church spire */}
      <rect x="112" y="36" width="10" height="22" fill="#f5f5f4" stroke="#d1d5db" strokeWidth="0.5"/>
      <polygon points="117,26 109,36 125,36" fill="#d4a017"/>
      <rect x="115" y="29" width="4" height="5" fill="#93c5fd" opacity="0.8"/>
      <line x1="117" y1="26" x2="117" y2="21" stroke="#d4a017" strokeWidth="1.5"/>
      <line x1="115" y1="23" x2="119" y2="23" stroke="#d4a017" strokeWidth="1.5"/>

      {/* ─── ELEVADOR LACERDA ─── */}
      {/* The iconic yellow vertical elevator connecting Cidade Alta & Baixa */}
      <rect x="157" y="46" width="9" height="52" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8"/>
      <rect x="156" y="44" width="11" height="9" rx="1" fill="#f59e0b"/>
      {/* Elevator car sliding down */}
      <rect x="157" y="58" width="7" height="9" rx="1" fill="#fef9c3" stroke="#d97706" strokeWidth="0.5">
        <animate attributeName="y" values="58;88;58" dur="6s" repeatCount="indefinite"/>
      </rect>
      {/* Guide cables */}
      <line x1="159" y1="53" x2="155" y2="95" stroke="#92400e" strokeWidth="1.2" opacity="0.7"/>
      <line x1="163" y1="53" x2="167" y2="95" stroke="#92400e" strokeWidth="1.2" opacity="0.7"/>

      {/* ─── CIDADE BAIXA (lower waterfront strip) ─── */}
      <rect x="0" y="88" width="190" height="12" fill="#64748b"/>
      {[4,22,40,58,76,94,112,130,148,166].map((x,i)=>(
        <rect key={i} x={x} y={80+i%3*2} width="16" height="14"
          fill={["#e2c98a","#fde68a","#cbd5e1"][i%3]} stroke="#94a3b8" strokeWidth="0.3"/>
      ))}

      {/* ─── BAÍA DE TODOS OS SANTOS (bay water) ─── */}
      <rect x="0" y="98" width="400" height="82" fill="url(#bts-bay)"/>

      {/* Bay shimmer / sun path on water */}
      <ellipse cx="310" cy="110" rx="90" ry="10" fill="#fef9c3" opacity="0.09" filter="url(#bts-blur2)"/>

      {/* Gentle calm waves */}
      <path d="M0 108 Q50 104 100 108 Q150 112 200 108 Q250 104 300 108 Q350 112 400 108"
        stroke="#67e8f9" strokeWidth="1" fill="none" opacity="0.5">
        <animateTransform attributeName="transform" type="translate" values="0,0;-40,0;0,0" dur="5s" repeatCount="indefinite"/>
      </path>
      <path d="M0 118 Q55 114 110 118 Q165 122 220 118 Q275 114 330 118 Q365 122 400 118"
        stroke="#38bdf8" strokeWidth="0.7" fill="none" opacity="0.4">
        <animateTransform attributeName="transform" type="translate" values="0,0;35,0;0,0" dur="6s" repeatCount="indefinite"/>
      </path>
      <path d="M0 130 Q60 126 120 130 Q180 134 240 130 Q300 126 360 130 Q385 134 400 130"
        stroke="#22d3ee" strokeWidth="0.5" fill="none" opacity="0.3">
        <animateTransform attributeName="transform" type="translate" values="0,0;-25,0;0,0" dur="7s" repeatCount="indefinite"/>
      </path>

      {/* ─── FORTE DE SÃO MARCELO (round circular fort in the water) ─── */}
      {/* Water shadow beneath fort */}
      <ellipse cx="232" cy="130" rx="24" ry="6" fill="#064e63" opacity="0.55"/>
      {/* Outer fort wall — CIRCULAR drum, sandy stone */}
      <circle cx="232" cy="117" r="21" fill="url(#bts-fort-stone)" stroke="#9a6c2a" strokeWidth="2"/>
      {/* Inner rampart ring */}
      <circle cx="232" cy="117" r="15" fill="#d4b07a" stroke="#9a6c2a" strokeWidth="1.2"/>
      {/* Central courtyard */}
      <circle cx="232" cy="117" r="8" fill="#c4924a" stroke="#7a5210" strokeWidth="0.8"/>
      {/* Radial stone-joint lines */}
      {[0,40,80,120,160,200,240,280,320].map((deg,i)=>{
        const r = Math.PI * deg / 180;
        return <line key={i}
          x1={232+15*Math.cos(r)} y1={117+15*Math.sin(r)}
          x2={232+21*Math.cos(r)} y2={117+21*Math.sin(r)}
          stroke="#7a5210" strokeWidth="0.6" opacity="0.55"/>;
      })}
      {/* Battlements — crenellations around top */}
      {[0,25,50,75,100,125,150,175,200,225,250,275,300,325,350].map((deg,i)=>{
        const r = Math.PI * deg / 180;
        const bx = 232 + 20 * Math.cos(r);
        const by = 117 + 20 * Math.sin(r);
        return <rect key={i} x={bx-1.5} y={by-1.5} width="3" height="3"
          fill="#7a5210" transform={`rotate(${deg} ${bx} ${by})`} opacity="0.9"/>;
      })}
      {/* Fort flag — Brazilian green */}
      <line x1="232" y1="109" x2="232" y2="100" stroke="#5c3d0a" strokeWidth="1.2"/>
      <polygon points="232,100 241,103 232,106" fill="#22c55e"/>
      {/* Water lapping at fort base */}
      <ellipse cx="232" cy="133" rx="22" ry="4" fill="#0891b2" opacity="0.5">
        <animate attributeName="ry" values="4;5;4" dur="2.5s" repeatCount="indefinite"/>
      </ellipse>

      {/* ─── SAVEIROS (traditional Bahian sailboats) ─── */}
      {/* Saveiro 1 */}
      <g>
        <path d="M118 145 Q128 143 140 145 L138 153 Q128 155 120 153 Z" fill="#7c2d12"/>
        <line x1="129" y1="145" x2="129" y2="122" stroke="#92400e" strokeWidth="1.2"/>
        <polygon points="129,122 129,143 152,134" fill="#dc2626" opacity="0.92"/>
        <polygon points="129,126 129,143 110,136" fill="#fbbf24" opacity="0.6"/>
      </g>
      {/* Saveiro 2 */}
      <g>
        <path d="M295 138 Q304 136 316 138 L314 146 Q305 148 297 146 Z" fill="#7c2d12"/>
        <line x1="306" y1="138" x2="306" y2="116" stroke="#92400e" strokeWidth="1.2"/>
        <polygon points="306,116 306,137 328,128" fill="#fbbf24" opacity="0.92"/>
        <polygon points="306,120 306,137 286,130" fill="#f8fafc" opacity="0.7"/>
      </g>
      {/* Saveiro 3 — distant small */}
      <g>
        <path d="M356 130 Q362 129 370 130 L369 136 Q362 138 357 136 Z" fill="#7c2d12"/>
        <line x1="363" y1="130" x2="363" y2="114" stroke="#92400e" strokeWidth="1"/>
        <polygon points="363,114 363,129 378,122" fill="#f8fafc" opacity="0.8"/>
      </g>

      {/* ─── DOCKSIDE / CAIS ─── */}
      <rect x="0" y="155" width="200" height="25" fill="#475569"/>
      {[0,18,36,54,72,90,108,126,144,162,180].map((x,i)=>(
        <line key={i} x1={x} y1="155" x2={x} y2="180" stroke="#334155" strokeWidth="0.6"/>
      ))}
      <line x1="0" y1="155" x2="200" y2="155" stroke="#94a3b8" strokeWidth="1.5" opacity="0.8"/>
      {/* Mooring posts */}
      {[30,90,150].map((x,i)=>(
        <g key={i}>
          <rect x={x-2} y="150" width="4" height="10" rx="1" fill="#1e293b"/>
          <ellipse cx={x} cy="150" rx="4" ry="2" fill="#334155"/>
        </g>
      ))}

      {/* ─── PALM TREE (right edge) ─── */}
      <path d="M378 180 Q374 162 380 142 Q382 125 372 108 Q368 97 370 86"
        stroke="#78350f" strokeWidth="7" fill="none" strokeLinecap="round"/>
      <ellipse cx="370" cy="83" rx="27" ry="6" fill="#15803d" transform="rotate(-28 370 83)"/>
      <ellipse cx="370" cy="83" rx="27" ry="6" fill="#16a34a" transform="rotate(12 370 83)"/>
      <ellipse cx="370" cy="83" rx="25" ry="6" fill="#15803d" transform="rotate(52 370 83)"/>
      <ellipse cx="370" cy="83" rx="23" ry="5" fill="#14532d" transform="rotate(-65 370 83)"/>
      <ellipse cx="370" cy="83" rx="20" ry="5" fill="#166534" transform="rotate(82 370 83)"/>
      <circle cx="372" cy="90" r="3.5" fill="#78350f"/>
      <circle cx="367" cy="88" r="3"   fill="#92400e"/>

      {/* ─── SEAGULLS over the bay ─── */}
      <path d="M155 58 Q159 54 163 58 Q167 54 171 58"
        stroke="#0c4a6e" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <animateTransform attributeName="transform" type="translate"
          values="-120,0;300,0" dur="11s" repeatCount="indefinite"/>
      </path>
      <path d="M270 44 Q273 41 276 44 Q279 41 282 44"
        stroke="#0c4a6e" strokeWidth="1.2" fill="none" strokeLinecap="round">
        <animateTransform attributeName="transform" type="translate"
          values="0,0;-260,0" dur="15s" repeatCount="indefinite" begin="4s"/>
      </path>

      {/* Center battle divider */}
      <line x1="200" y1="55" x2="200" y2="155" stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.35"/>
    </svg>
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

/** Returns the best-fit arena given the two champion classes. */
export function getBattleArenaTheme(classA?: ChampionClass, classB?: ChampionClass): ChampionClass | null {
  if (classA === undefined) return null;
  return classA; // home team's arena
}

export function BattleArenaBackground({
  classA,
  classB,
  theme,
}: {
  classA?: ChampionClass;
  classB?: ChampionClass;
  theme?: ArenaTheme;
}) {
  if (theme === "amazon")  return <AmazonArena />;
  if (theme === "stadium") return <StadiumArena />;
  if (theme === "sea")     return <SeaArena />;

  // existing class-based switch
  const resolvedTheme = getBattleArenaTheme(classA, classB);
  switch (resolvedTheme) {
    case ChampionClass.CURUPIRA: return <ForestArena />;
    case ChampionClass.IARA:     return <RiverArena  />;
    case ChampionClass.BOITATA:  return <FireArena   />;
    case ChampionClass.ANHANGA:  return <ShadowArena />;
    case ChampionClass.TUPA:     return <StormArena  />;
    default:                     return <ColiseumArena />;
  }
}
