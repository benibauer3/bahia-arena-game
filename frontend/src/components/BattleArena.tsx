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
 *
 * A mixed matchup uses the "Coliseum" (default arena).
 */

import { ChampionClass } from "@/lib/champions";

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
            <animateTransform attributeName="transform" type="translate" values={`0,0;${(i%2===0?2:-2)},-${8+i%3*4};0,0`} dur={`${0.8+i*0.2}s`} repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur={`${0.8+i*0.2}s`} repeatCount="indefinite"/>
          </ellipse>
          <ellipse cx={x} cy="147" rx="3" ry="7" fill="#fbbf24" opacity="0.7">
            <animateTransform attributeName="transform" type="translate" values={`0,0;${(i%2===0?1:-1)},-${5+i%3*3};0,0`} dur={`${0.6+i*0.15}s`} repeatCount="indefinite"/>
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

// ─── Dispatcher ───────────────────────────────────────────────────────────────

/** Returns the best-fit arena given the two champion classes. */
export function getBattleArenaTheme(classA?: ChampionClass, classB?: ChampionClass): ChampionClass | null {
  if (classA === undefined) return null;
  return classA; // home team's arena
}

export function BattleArenaBackground({ classA, classB }: ArenaProps) {
  const theme = getBattleArenaTheme(classA, classB);
  switch (theme) {
    case ChampionClass.CURUPIRA: return <ForestArena />;
    case ChampionClass.IARA:     return <RiverArena  />;
    case ChampionClass.BOITATA:  return <FireArena   />;
    case ChampionClass.ANHANGA:  return <ShadowArena />;
    case ChampionClass.TUPA:     return <StormArena  />;
    default:                     return <ColiseumArena />;
  }
}
