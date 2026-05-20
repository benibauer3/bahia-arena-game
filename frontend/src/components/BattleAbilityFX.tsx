/**
 * BattleAbilityFX.tsx — Visual ability effects overlay for the battle arena.
 *
 * Renders per-champion projectiles, impact bursts, self-aura (heal/shield),
 * and persistent status-effect indicators (burn, stun, root).
 *
 * Must be placed as an absolute-positioned child of the arena container.
 * The arena has champion A at left ~12% and champion B at right ~12%.
 *
 * Timing (relative to lastResult):
 *   t = 0ms  : projectile spawns, self-aura spawns
 *   t = 380ms: impact burst ring expands (via CSS animation-delay)
 *   t = 350ms: parent triggers shake / flash / floating numbers
 */

import { ChampionClass } from "@/lib/champions";
import type { StatusType } from "@/lib/championCards";

// ─── Per-champion visual theme ────────────────────────────────────────────────

const FX_THEME = {
  [ChampionClass.CURUPIRA]: { color: "#22c55e", glow: "#4ade80", trail: "#bbf7d0", shape: "vine"      as const },
  [ChampionClass.IARA]:     { color: "#22d3ee", glow: "#67e8f9", trail: "#a5f3fc", shape: "water"     as const },
  [ChampionClass.BOITATA]:  { color: "#f97316", glow: "#fb923c", trail: "#fed7aa", shape: "fire"      as const },
  [ChampionClass.ANHANGA]:  { color: "#7c3aed", glow: "#a78bfa", trail: "#c4b5fd", shape: "shadow"    as const },
  [ChampionClass.TUPA]:     { color: "#fbbf24", glow: "#fde047", trail: "#fef9c3", shape: "lightning" as const },
} as const;

type Shape = "vine" | "water" | "fire" | "shadow" | "lightning";

// ─── Projectile shapes (SVG, viewBox -24 -24 48 48) ──────────────────────────

function ProjectileSVG({ shape, color, glow, size }: {
  shape: Shape; color: string; glow: string; size: number;
}) {
  return (
    <svg width={size} height={size} viewBox="-24 -24 48 48" style={{ overflow: "visible" }}>
      {shape === "fire" && <>
        {/* outer glow halo */}
        <circle r="20" fill={glow}    opacity="0.25"/>
        <circle r="14" fill={color}   opacity="0.8"/>
        <circle r="8"  fill="#fef9c3" opacity="0.95"/>
        {/* flame trail pointing left (behind the fireball) */}
        <path d="M-10,-3 C-18,-1 -22,3 -16,6 C-12,8 -16,-2 -10,3 C-14,-1 -20,2 -17,-5"
          fill={glow} opacity="0.7"/>
        <path d="M-6,0 C-12,1 -14,4 -10,5" stroke={color} strokeWidth="3"
          fill="none" strokeLinecap="round" opacity="0.5"/>
      </>}

      {shape === "lightning" && <>
        <circle r="20" fill={color}  opacity="0.12"/>
        {/* main bolt */}
        <polygon points="-7,-19 -11,-3 -3,-3 -9,19 13,-5 4,-5 10,-19" fill={glow}/>
        {/* bright core */}
        <polygon points="-5,-16 -9,0  -1,0  -7,15  10,-3 2,-3  7,-16"
          fill="white" opacity="0.7"/>
        {/* spark ring */}
        <circle r="17" fill="none" stroke={color} strokeWidth="1.5" opacity="0.35"
          strokeDasharray="4 3"/>
      </>}

      {shape === "water" && <>
        <circle r="20" fill={color}  opacity="0.15"/>
        <circle r="18" fill="none"   stroke={color} strokeWidth="1.5" opacity="0.4"/>
        <ellipse rx="14" ry="10"     fill={color}   opacity="0.85"/>
        <ellipse rx="9"  ry="6.5"    fill={glow}/>
        {/* highlight bubble */}
        <circle r="3.5" cx="4" cy="-3" fill="white" opacity="0.75"/>
        {/* ripple rings */}
        <ellipse rx="17" ry="12" fill="none" stroke={glow} strokeWidth="1" opacity="0.35"/>
      </>}

      {shape === "shadow" && <>
        <circle r="20" fill="#000"  opacity="0.5"/>
        <circle r="14" fill={color} opacity="0.9"/>
        <circle r="8"  fill={glow}/>
        {/* void tendrils */}
        <path d="M12,-4 C20,-8 22,2 17,6 C21,-3 14,8 8,3"
          fill={color} opacity="0.65"/>
        <path d="M-12,4 C-20,-1 -18,9 -12,7 C-18,3 -14,-6 -7,3"
          fill={color} opacity="0.45"/>
        {/* purple core spark */}
        <circle r="3" cx="1" cy="0" fill="white" opacity="0.5"/>
      </>}

      {/* vine (default / Curupira) */}
      {shape === "vine" && <>
        <circle r="19" fill={color}  opacity="0.22"/>
        <circle r="14" fill={color}  opacity="0.85"/>
        <circle r="8"  fill={glow}/>
        {/* leaf blobs */}
        <ellipse rx="9" ry="4" cx="-4" cy="-9"
          fill={color} opacity="0.85" transform="rotate(-35 -4 -9)"/>
        <ellipse rx="8" ry="3.5" cx="6" cy="-8"
          fill={glow}  opacity="0.7"  transform="rotate(22 6 -8)"/>
        {/* dark seed */}
        <circle r="2.5" fill="#052e16"/>
      </>}
    </svg>
  );
}

// ─── Impact burst (concentric expanding rings) ────────────────────────────────

function ImpactBurst({ color, glow, delayMs }: {
  color: string; glow: string; delayMs: number;
}) {
  const delay = `${delayMs}ms`;
  return (
    <svg width="100" height="100" viewBox="-50 -50 100 100" style={{ overflow: "visible" }}>
      {/* outer ring */}
      <circle r="42" fill={glow}  className="animate-impact-burst" opacity="0"
        style={{ animationDelay: delay }}/>
      {/* mid ring */}
      <circle r="26" fill={color} className="animate-impact-burst" opacity="0"
        style={{ animationDelay: `${delayMs + 40}ms` }}/>
      {/* core flash */}
      <circle r="12" fill="white" className="animate-impact-burst" opacity="0"
        style={{ animationDelay: `${delayMs + 80}ms` }}/>
    </svg>
  );
}

// ─── Self aura (heal / shield) ────────────────────────────────────────────────

function SelfAura({ color, glow, animKey }: { color: string; glow: string; animKey: number }) {
  return (
    <div key={`sa-${animKey}`} className="absolute pointer-events-none animate-self-aura"
      style={{ width: 130, height: 130, transform: "translate(-50%, -50%)" }}>
      <svg width="130" height="130" viewBox="-65 -65 130 130" style={{ overflow: "visible" }}>
        <circle r="58" fill={glow}  opacity="0.2"/>
        <circle r="42" fill={color} opacity="0.22"/>
        <circle r="24" fill={color} opacity="0.35"/>
        {/* sparkle lines radiating */}
        {[0,45,90,135,180,225,270,315].map((deg, i) => (
          <line key={i}
            x1="0" y1="0" x2="0" y2="-52"
            stroke={glow} strokeWidth="1.5" opacity="0.4"
            transform={`rotate(${deg})`}/>
        ))}
      </svg>
    </div>
  );
}

// ─── Hit Spark — SF3 / SF6 / DBFZ radial impact lines ───────────────────────

function HitSpark({ color, glow, delayMs, animKey }: {
  color: string; glow: string; delayMs: number; animKey: number;
}) {
  const d = `${delayMs}ms`;
  return (
    <svg key={`hs-${animKey}`} width="100" height="100" viewBox="-50 -50 100 100"
      className="animate-hit-spark pointer-events-none"
      style={{ animationDelay: d, overflow: "visible" }}>
      {/* 8 primary radial lines */}
      {[0,45,90,135,180,225,270,315].map((angle, i) => (
        <line key={i}
          x1={i % 2 === 0 ? 11 : 9} y1="0"
          x2={i % 2 === 0 ? 42 : 34} y2="0"
          stroke={i % 2 === 0 ? glow : color}
          strokeWidth={i % 2 === 0 ? 3.5 : 2.2}
          strokeLinecap="round"
          transform={`rotate(${angle})`}/>
      ))}
      {/* 4 diagonal accent lines (SF6 style thin lines) */}
      {[22.5, 67.5, 112.5, 157.5].map((angle, i) => (
        <line key={`s${i}`}
          x1="6" y1="0" x2="24" y2="0"
          stroke="white" strokeWidth="1.5" strokeLinecap="round"
          transform={`rotate(${angle})`} opacity="0.85"/>
      ))}
      {/* core flash */}
      <circle r="13" fill={glow}  opacity="0.75" style={{ animationDelay: d }}/>
      <circle r="6"  fill="white" opacity="0.95"/>
    </svg>
  );
}

// ─── Beam Super — DBFZ Kamehameha / Galick Gun style ─────────────────────────

function BeamSuper({ color, glow, fromLeft, animKey }: {
  color: string; glow: string; fromLeft: boolean; animKey: number;
}) {
  const origin = fromLeft ? "left center" : "right center";
  return (
    <div key={`beam-${animKey}`}
      className="absolute pointer-events-none animate-beam-super"
      style={{
        left:            fromLeft ? "17%" : "auto",
        right:           fromLeft ? "auto" : "17%",
        top:             "calc(43% - 22px)",
        width:           "66%",
        height:          44,
        zIndex:          26,
        transformOrigin: origin,
      }}
    >
      {/* Wide outer energy glow */}
      <div style={{
        position: "absolute", inset: "-20px 0",
        background: fromLeft
          ? `radial-gradient(ellipse 85% 100% at 8% 50%, ${glow}99 0%, ${glow}44 55%, transparent 100%)`
          : `radial-gradient(ellipse 85% 100% at 92% 50%, ${glow}99 0%, ${glow}44 55%, transparent 100%)`,
        filter:       "blur(16px)",
        borderRadius: 32,
      }}/>
      {/* Mid beam body */}
      <div style={{
        position: "absolute", inset: "-7px 0",
        background: fromLeft
          ? `linear-gradient(90deg, ${color}ee, ${color}, ${color}dd, ${color}88)`
          : `linear-gradient(270deg, ${color}ee, ${color}, ${color}dd, ${color}88)`,
        borderRadius: 18,
        filter:       "blur(2.5px)",
      }}/>
      {/* Bright white core */}
      <div style={{
        position: "absolute", inset: "11px 0",
        background: fromLeft
          ? "linear-gradient(90deg, white 0%, white 78%, #ffffff77)"
          : "linear-gradient(270deg, white 0%, white 78%, #ffffff77)",
        borderRadius: 8,
        opacity:      0.92,
      }}/>
      {/* Muzzle flash — glowing origin point */}
      <div className="absolute animate-beam-muzzle"
        style={{
          left:   fromLeft ? -22 : "auto",
          right:  fromLeft ? "auto" : -22,
          top:    -28,
          width:  68,
          height: 100,
          background: `radial-gradient(circle, ${glow}dd 0%, ${color}88 40%, transparent 72%)`,
          filter: "blur(6px)",
          transformOrigin: "center center",
        }}/>
    </div>
  );
}

// ─── Super Freeze — SF3 / SF6 / DBFZ super activation flash ──────────────────

function SuperFreeze({ animKey }: { animKey: number }) {
  return (
    <div key={`sfz-${animKey}`}
      className="absolute inset-0 pointer-events-none animate-super-freeze z-50"
      style={{ background: "white" }}
    />
  );
}

// ─── Status: Burn flames ──────────────────────────────────────────────────────

function BurnIndicator() {
  return (
    <div className="pointer-events-none animate-status-burn flex gap-1">
      <svg width="28" height="36" viewBox="0 0 28 36">
        <path d="M14,34 C6,26 2,18 8,10 C10,16 12,14 14,8 C16,14 18,16 20,10 C26,18 22,26 14,34 Z"
          fill="#f97316" opacity="0.9"/>
        <path d="M14,30 C9,23 8,16 12,11 C13,15 14,13 14,9 C15,13 16,15 18,11 C21,16 20,24 14,30 Z"
          fill="#fbbf24" opacity="0.8"/>
        <path d="M14,25 C11,20 11,15 13,12 C14,15 15,14 14,11 C16,15 16,20 14,25 Z"
          fill="#fef9c3" opacity="0.7"/>
      </svg>
      <svg width="22" height="28" viewBox="0 0 22 28" style={{ marginTop: 8 }}>
        <path d="M11,26 C5,20 3,13 7,7 C9,12 10,10 11,6 C12,10 13,12 15,7 C19,13 17,20 11,26 Z"
          fill="#ef4444" opacity="0.8"/>
        <path d="M11,22 C7,16 7,11 10,8 C11,11 12,10 11,7 C13,11 13,16 11,22 Z"
          fill="#fbbf24" opacity="0.7"/>
      </svg>
    </div>
  );
}

// ─── Status: Stun stars ───────────────────────────────────────────────────────

function StunIndicator() {
  return (
    <div className="pointer-events-none relative" style={{ width: 60, height: 30 }}>
      {["0s", "0.43s", "0.87s"].map((delay, i) => (
        <span key={i}
          className="absolute text-base animate-status-stun"
          style={{
            animationDelay: delay,
            top: "50%", left: "50%",
            transformOrigin: "0 0",
          }}>
          ⭐
        </span>
      ))}
    </div>
  );
}

// ─── Status: Root vines ───────────────────────────────────────────────────────

function RootIndicator({ color }: { color: string }) {
  return (
    <div className="pointer-events-none animate-status-root">
      <svg width="60" height="28" viewBox="0 0 60 28">
        <path d="M5,24 C10,14 20,8 30,10 C40,8 50,14 55,24"
          stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8"/>
        <path d="M12,22 Q15,14 20,16" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6"/>
        <path d="M48,22 Q45,14 40,16" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6"/>
        {/* leaf nubs */}
        <ellipse cx="20" cy="13" rx="5" ry="3" fill={color} opacity="0.7" transform="rotate(-20 20 13)"/>
        <ellipse cx="40" cy="13" rx="5" ry="3" fill={color} opacity="0.7" transform="rotate(20 40 13)"/>
        <circle cx="30" cy="9" r="3.5" fill={color} opacity="0.8"/>
      </svg>
    </div>
  );
}

// ─── Ground-level ability strike SVGs (one per champion shape) ───────────────
// Each SVG fills viewBox="0 0 260 72", drawn left-to-right (attacker→defender).
// The GroundStrike wrapper scales it from the attacker's side via animate-beam-super.

function VineStrike({ color, glow }: { color: string; glow: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 260 72" preserveAspectRatio="none">
      {/* ground glow */}
      <ellipse cx="130" cy="68" rx="122" ry="6" fill={color} opacity="0.12"/>
      {/* earth crack */}
      <path d="M2,66 L18,56 L34,64 L52,52 L70,62 L90,50 L110,60 L130,48 L152,58 L174,46 L194,56 L216,44 L238,54 L260,60"
        stroke="#5a3810" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.55"/>
      {/* main vine snake */}
      <path d="M2,62 C22,55 42,38 64,52 C84,65 104,33 126,47 C148,61 166,30 188,44 C208,57 228,36 260,46"
        stroke={color} strokeWidth="5.5" fill="none" strokeLinecap="round" opacity="0.9"/>
      <path d="M2,62 C22,55 42,38 64,52 C84,65 104,33 126,47 C148,61 166,30 188,44 C208,57 228,36 260,46"
        stroke={glow} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.65"/>
      {/* vine sprouts */}
      <path d="M64,52 C60,34 54,20 44,10" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>
      <path d="M70,47 C68,32 74,22 66,12" stroke={glow} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
      <path d="M126,47 C122,30 116,18 106,8" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8"/>
      <path d="M132,42 C130,28 136,20 130,10" stroke={glow} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.65"/>
      <path d="M188,44 C184,27 178,15 168,6" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.75"/>
      {/* leaf clusters */}
      <ellipse cx="46" cy="8"  rx="12" ry="6" fill={color} opacity="0.85" transform="rotate(-22 46 8)"/>
      <ellipse cx="58" cy="4"  rx="8"  ry="4" fill={glow}  opacity="0.7"  transform="rotate(12 58 4)"/>
      <ellipse cx="108" cy="6" rx="11" ry="5" fill={color} opacity="0.8"  transform="rotate(18 108 6)"/>
      <ellipse cx="118" cy="2" rx="7"  ry="3.5" fill={glow} opacity="0.65" transform="rotate(-14 118 2)"/>
      <ellipse cx="170" cy="4" rx="10" ry="5" fill={color} opacity="0.75" transform="rotate(-26 170 4)"/>
      <circle cx="50" cy="7" r="3" fill="#052e16" opacity="0.6"/>
      <circle cx="110" cy="5" r="2.5" fill="#052e16" opacity="0.55"/>
    </svg>
  );
}

function WaterStrike({ color, glow }: { color: string; glow: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 260 72" preserveAspectRatio="none">
      {/* wave fill */}
      <path d="M0,72 L0,46 C20,26 40,40 60,33 C80,26 100,46 122,38 C144,30 162,48 182,40 C202,32 222,50 244,42 L260,42 L260,72 Z"
        fill={color} opacity="0.22"/>
      {/* wave crest */}
      <path d="M0,46 C20,26 40,40 60,33 C80,26 100,46 122,38 C144,30 162,48 182,40 C202,32 222,50 244,42 L260,42"
        stroke={color} strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.85"/>
      <path d="M0,46 C20,26 40,40 60,33 C80,26 100,46 122,38 C144,30 162,48 182,40 C202,32 222,50 244,42 L260,42"
        stroke={glow} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6"/>
      {/* spray droplets */}
      <circle cx="58" cy="20" r="5"   fill={glow}   opacity="0.75"/>
      <circle cx="68" cy="12" r="3.5" fill="white"  opacity="0.7"/>
      <circle cx="76" cy="22" r="3"   fill={color}  opacity="0.65"/>
      <circle cx="120" cy="25" r="4.5" fill={glow}  opacity="0.7"/>
      <circle cx="130" cy="16" r="3"  fill="white"  opacity="0.65"/>
      <circle cx="180" cy="27" r="4"  fill={glow}   opacity="0.65"/>
      <circle cx="188" cy="18" r="2.5" fill="white" opacity="0.6"/>
      {/* foam at front */}
      <ellipse cx="248" cy="42" rx="14" ry="7" fill={color} opacity="0.45"/>
      <ellipse cx="252" cy="40" rx="8"  ry="4" fill="white" opacity="0.4"/>
      {/* ground reflection */}
      <ellipse cx="130" cy="66" rx="122" ry="5" fill={color} opacity="0.15"/>
    </svg>
  );
}

function FireStrike({ color, glow }: { color: string; glow: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 260 72" preserveAspectRatio="none">
      {/* ground glow */}
      <ellipse cx="130" cy="68" rx="122" ry="6" fill={color} opacity="0.2"/>
      {/* shadow body */}
      <path d="M2,62 C24,62 40,46 60,56 C80,66 96,44 116,54 C136,64 154,42 174,52 C194,62 212,44 260,54"
        stroke="#7c2d12" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.4"/>
      {/* fire serpent */}
      <path d="M2,62 C24,62 40,46 60,56 C80,66 96,44 116,54 C136,64 154,42 174,52 C194,62 212,44 260,54"
        stroke={color} strokeWidth="5.5" fill="none" strokeLinecap="round" opacity="0.9"/>
      <path d="M2,62 C24,62 40,46 60,56 C80,66 96,44 116,54 C136,64 154,42 174,52 C194,62 212,44 260,54"
        stroke={glow} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.6"/>
      {/* flame tongues */}
      <path d="M60,56 C56,36 64,18 52,6 C62,22 68,10 60,2"  stroke={color} strokeWidth="3"   fill="none" strokeLinecap="round" opacity="0.85"/>
      <path d="M66,51 C70,34 76,20 70,8"                     stroke={glow}  strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.7"/>
      <path d="M116,54 C112,34 120,16 108,4"                 stroke={color} strokeWidth="2.8" fill="none" strokeLinecap="round" opacity="0.82"/>
      <path d="M122,48 C126,30 132,18 126,6"                 stroke={glow}  strokeWidth="2"   fill="none" strokeLinecap="round" opacity="0.65"/>
      <path d="M174,52 C170,32 178,16 166,4"                 stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.78"/>
      {/* ember orbs */}
      <circle cx="54"  cy="4"  r="5.5" fill="#fef9c3" opacity="0.9"/>
      <circle cx="68"  cy="8"  r="3.5" fill={glow}    opacity="0.8"/>
      <circle cx="110" cy="2"  r="5"   fill="#fef9c3" opacity="0.85"/>
      <circle cx="124" cy="6"  r="3"   fill={glow}    opacity="0.75"/>
      <circle cx="168" cy="2"  r="4.5" fill="#fef9c3" opacity="0.8"/>
    </svg>
  );
}

function ShadowStrike({ color, glow }: { color: string; glow: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 260 72" preserveAspectRatio="none">
      {/* ground void fog */}
      <ellipse cx="130" cy="66" rx="122" ry="8" fill="#000" opacity="0.6"/>
      <ellipse cx="130" cy="64" rx="100" ry="5" fill={color} opacity="0.12"/>
      {/* shadow streak */}
      <path d="M2,58 C22,52 38,40 58,50 C78,60 94,38 114,48 C134,58 152,36 172,46 C192,56 210,38 260,48"
        stroke={color} strokeWidth="6.5" fill="none" strokeLinecap="round" opacity="0.82"/>
      <path d="M2,58 C22,52 38,40 58,50 C78,60 94,38 114,48 C134,58 152,36 172,46 C192,56 210,38 260,48"
        stroke={glow} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.55"/>
      {/* rising tendrils */}
      <path d="M58,50 C54,32 62,18 50,8 C60,24 64,12 56,4" stroke={color} strokeWidth="3"   fill="none" strokeLinecap="round" opacity="0.82"/>
      <path d="M64,45 C68,28 74,16 66,6"                   stroke={glow}  strokeWidth="2"   fill="none" strokeLinecap="round" opacity="0.65"/>
      <path d="M114,48 C110,30 118,16 106,6"               stroke={color} strokeWidth="2.8" fill="none" strokeLinecap="round" opacity="0.78"/>
      <path d="M120,43 C124,26 130,14 122,4"               stroke={glow}  strokeWidth="2"   fill="none" strokeLinecap="round" opacity="0.62"/>
      <path d="M172,46 C168,28 176,14 164,4"               stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.72"/>
      {/* void orbs */}
      <circle cx="52" cy="3"   r="7"   fill="#000"  opacity="0.92"/>
      <circle cx="52" cy="3"   r="4"   fill={glow}  opacity="0.82"/>
      <circle cx="108" cy="4"  r="6"   fill="#000"  opacity="0.88"/>
      <circle cx="108" cy="4"  r="3.5" fill={color} opacity="0.78"/>
      <circle cx="166" cy="2"  r="5.5" fill="#000"  opacity="0.85"/>
      <circle cx="166" cy="2"  r="3"   fill={glow}  opacity="0.72"/>
    </svg>
  );
}

function LightningStrike({ color, glow }: { color: string; glow: string }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 260 72" preserveAspectRatio="none">
      {/* ground arc glow */}
      <ellipse cx="130" cy="68" rx="122" ry="5" fill={color} opacity="0.22"/>
      {/* secondary bolt (wider, dimmer) */}
      <path d="M2,58 L20,46 L12,53 L34,36 L26,44 L52,24 L44,36 L74,14 L64,27 L98,8 L86,22 L118,2 L108,17 L140,0 L130,15 L160,-2 L150,14 L180,-2 L170,15 L200,2 L190,19 L220,4 L210,22 L240,6 L260,18"
        stroke={color} strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.45"/>
      {/* main bolt */}
      <path d="M2,56 L22,44 L14,51 L38,34 L28,43 L56,22 L46,34 L78,12 L66,25 L102,5 L88,19 L122,0 L111,15 L144,-2 L132,13 L162,-4 L152,12 L182,-2 L172,14 L202,0 L192,18 L222,2 L212,20 L242,4 L260,16"
        stroke={glow} strokeWidth="3.2" fill="none" strokeLinecap="round" opacity="0.92"/>
      {/* bright white core */}
      <path d="M2,56 L22,44 L14,51 L38,34 L28,43 L56,22 L46,34 L78,12 L66,25 L102,5 L88,19 L122,0 L111,15 L144,-2 L132,13 L162,-4 L152,12 L182,-2 L172,14 L202,0 L192,18 L222,2 L212,20 L242,4 L260,16"
        stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.78"/>
      {/* branch sparks */}
      <path d="M78,12 L90,-6 L94,6"   stroke={glow}  strokeWidth="2"   fill="none" strokeLinecap="round" opacity="0.82"/>
      <path d="M144,-2 L156,-18 L160,-6" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.72"/>
      <path d="M202,0 L214,-16 L218,-4" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.68"/>
      {/* spark nodes */}
      <circle cx="78"  cy="12"  r="5.5" fill="white" opacity="0.92"/>
      <circle cx="144" cy="-2"  r="5"   fill={glow}  opacity="0.88"/>
      <circle cx="202" cy="0"   r="4.5" fill="white" opacity="0.82"/>
      <circle cx="260" cy="16"  r="5"   fill={glow}  opacity="0.85"/>
    </svg>
  );
}

// ─── Ground Strike wrapper — scales from attacker's side outward ──────────────

function GroundStrike({ shape, color, glow, fromLeft, animKey, bottomOffset = "2%" }: {
  shape: Shape; color: string; glow: string; fromLeft: boolean; animKey: number; bottomOffset?: string;
}) {
  const origin = fromLeft ? "left center" : "right center";
  return (
    <div
      key={`gs-${animKey}`}
      className="absolute pointer-events-none animate-beam-super"
      style={{
        left:            fromLeft ? "15%" : "auto",
        right:           fromLeft ? "auto" : "15%",
        bottom:          bottomOffset,
        width:           "70%",
        height:          88,
        zIndex:          22,
        transformOrigin: origin,
      }}
    >
      {/* Mirror the SVG for B→A attacks so the vines/flames face the right way */}
      <div style={{ width: "100%", height: "100%", transform: fromLeft ? "none" : "scaleX(-1)" }}>
        {shape === "vine"      && <VineStrike      color={color} glow={glow}/>}
        {shape === "water"     && <WaterStrike     color={color} glow={glow}/>}
        {shape === "fire"      && <FireStrike      color={color} glow={glow}/>}
        {shape === "shadow"    && <ShadowStrike    color={color} glow={glow}/>}
        {shape === "lightning" && <LightningStrike color={color} glow={glow}/>}
      </div>
    </div>
  );
}

// ─── Clash Burst — when BOTH champions attack the same turn ──────────────────

function ClashBurst({ colorA, glowA, colorB, glowB, animKey }: {
  colorA: string; glowA: string; colorB: string; glowB: string; animKey: number;
}) {
  return (
    <div key={`clash-${animKey}`}
      className="absolute pointer-events-none"
      style={{ left: "50%", bottom: "22%", transform: "translate(-50%, 50%)", zIndex: 28 }}
    >
      {/* Outer mixed-color ring */}
      <div className="absolute animate-clash-ring"
        style={{
          width: 120, height: 120,
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          border: `3px solid ${glowA}`,
          boxShadow: `0 0 20px ${glowA}, inset 0 0 20px ${glowB}44`,
        }}/>
      <div className="absolute animate-clash-ring"
        style={{
          width: 120, height: 120,
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          border: `3px solid ${glowB}`,
          boxShadow: `0 0 20px ${glowB}`,
          animationDelay: "60ms",
        }}/>
      {/* Core burst SVG */}
      <svg width="120" height="120" viewBox="-60 -60 120 120"
        className="animate-clash-burst"
        style={{ overflow: "visible", animationDelay: "30ms" }}>
        {/* 12 radial clash lines alternating both colors */}
        {Array.from({length:12}).map((_, i) => (
          <line key={i}
            x1={i % 3 === 0 ? 14 : 10} y1="0"
            x2={i % 3 === 0 ? 52 : 42} y2="0"
            stroke={i % 2 === 0 ? glowA : glowB}
            strokeWidth={i % 3 === 0 ? 4.5 : 2.8}
            strokeLinecap="round"
            transform={`rotate(${i * 30})`}/>
        ))}
        {/* Thin accent spokes */}
        {[15,75,135,195,255,315].map((angle, i) => (
          <line key={`s${i}`}
            x1="6" y1="0" x2="28" y2="0"
            stroke="white" strokeWidth="2" strokeLinecap="round"
            transform={`rotate(${angle})`} opacity="0.9"/>
        ))}
        {/* Core glow */}
        <circle r="18" fill={glowA} opacity="0.6"/>
        <circle r="10" fill={glowB} opacity="0.7"/>
        <circle r="5"  fill="white" opacity="0.95"/>
      </svg>
      {/* "CLASH!" text */}
      <div
        className="absolute inset-x-0 text-center pointer-events-none animate-pop-in"
        style={{ top: -32, animationDelay: "120ms" }}
      >
        <span className="font-display font-black text-[10px] tracking-[0.18em] text-white"
          style={{ textShadow: `0 0 12px ${glowA}, 0 0 24px ${glowB}, 0 1px 0 rgba(0,0,0,0.95)` }}>
          ⚡ CLASH!
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface AbilityFXProps {
  animKey:  number;          // increments each turn to re-trigger animations
  classA:   ChampionClass;
  classB:   ChampionClass;
  attackA:  boolean;         // A fired an offensive card toward B
  attackB:  boolean;
  selfA:    boolean;         // A played a heal or shield card (self buff)
  selfB:    boolean;
  ultA:     boolean;         // A's card was an ultimate
  ultB:     boolean;
  statusA:  StatusType;      // current persistent status on A
  statusB:  StatusType;
  charging: boolean;         // brief charge-up flash before projectile (for attacker)
}

export default function BattleAbilityFX({
  animKey, classA, classB,
  attackA, attackB, selfA, selfB, ultA, ultB,
  statusA, statusB,
}: AbilityFXProps) {
  const fxA = FX_THEME[classA];
  const fxB = FX_THEME[classB];
  // Projectile size (non-ultimate only)
  const sizeA = 44;
  const sizeB = 44;
  // Impact timing: projectile/beam arrives at ~90% of its travel
  const impactMs     = 340;
  // Beam arrives a bit later (it's longer)
  const beamImpactMs = 420;

  return (
    <div className="absolute inset-0 pointer-events-none z-20" style={{ overflow: "hidden" }}>

      {/* ══════════════════════════════════════════════════════════════════
          SUPER FREEZE — SF3 / SF6 / DBFZ white flash on ultimate
      ══════════════════════════════════════════════════════════════════ */}
      {(ultA || ultB) && <SuperFreeze animKey={animKey}/>}

      {/* ══════════════════════════════════════════════════════════════════
          GROUND STRIKE A→B  (non-ultimate: champion-specific ground FX)
      ══════════════════════════════════════════════════════════════════ */}
      {attackA && !ultA && (
        <GroundStrike
          shape={fxA.shape} color={fxA.color} glow={fxA.glow}
          fromLeft={true} animKey={animKey}
          bottomOffset={attackB && !ultB ? "10%" : "2%"}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          GROUND STRIKE B→A  (non-ultimate)
      ══════════════════════════════════════════════════════════════════ */}
      {attackB && !ultB && (
        <GroundStrike
          shape={fxB.shape} color={fxB.color} glow={fxB.glow}
          fromLeft={false} animKey={animKey}
          bottomOffset="2%"
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CLASH BURST — both attack same turn (centre of arena)
      ══════════════════════════════════════════════════════════════════ */}
      {attackA && attackB && !ultA && !ultB && (
        <ClashBurst
          colorA={fxA.color} glowA={fxA.glow}
          colorB={fxB.color} glowB={fxB.glow}
          animKey={animKey}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          BEAM SUPER A→B  (DBFZ Kamehameha — ultimate only)
      ══════════════════════════════════════════════════════════════════ */}
      {ultA && (
        <BeamSuper
          color={fxA.color} glow={fxA.glow}
          fromLeft={true} animKey={animKey}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          BEAM SUPER B→A  (DBFZ — ultimate only)
      ══════════════════════════════════════════════════════════════════ */}
      {ultB && (
        <BeamSuper
          color={fxB.color} glow={fxB.glow}
          fromLeft={false} animKey={animKey}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          IMPACT BURST at B + HIT SPARK  (when A attacks)
          — ground level for ground strike, mid-air for beam
      ══════════════════════════════════════════════════════════════════ */}
      {attackA && (
        <>
          <div key={`iba-${animKey}`}
            className="absolute"
            style={{
              right:  "8%",
              bottom: ultA ? "36%" : "12%",
              zIndex: 23,
            }}
          >
            <ImpactBurst color={fxA.color} glow={fxA.glow}
              delayMs={ultA ? beamImpactMs : impactMs}/>
          </div>
          <div key={`hsa-${animKey}`}
            className="absolute"
            style={{
              right:  "9%",
              bottom: ultA ? "40%" : "16%",
              zIndex: 24,
            }}
          >
            <HitSpark color={fxA.color} glow={fxA.glow}
              delayMs={ultA ? beamImpactMs + 20 : impactMs + 15}
              animKey={animKey}/>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          IMPACT BURST at A + HIT SPARK  (when B attacks)
      ══════════════════════════════════════════════════════════════════ */}
      {attackB && (
        <>
          <div key={`ibb-${animKey}`}
            className="absolute"
            style={{
              left:   "8%",
              bottom: ultB ? "36%" : "12%",
              zIndex: 23,
            }}
          >
            <ImpactBurst color={fxB.color} glow={fxB.glow}
              delayMs={ultB ? beamImpactMs : impactMs}/>
          </div>
          <div key={`hsb-${animKey}`}
            className="absolute"
            style={{
              left:   "9%",
              bottom: ultB ? "40%" : "16%",
              zIndex: 24,
            }}
          >
            <HitSpark color={fxB.color} glow={fxB.glow}
              delayMs={ultB ? beamImpactMs + 20 : impactMs + 15}
              animKey={animKey}/>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SELF AURA — heal / shield
      ══════════════════════════════════════════════════════════════════ */}
      {selfA && (
        <div key={`saa-${animKey}`}
          className="absolute"
          style={{ left: "17%", bottom: "50%", zIndex: 21 }}
        >
          <SelfAura color={fxA.color} glow={fxA.glow} animKey={animKey}/>
        </div>
      )}
      {selfB && (
        <div key={`sab-${animKey}`}
          className="absolute"
          style={{ right: "17%", bottom: "50%", zIndex: 21 }}
        >
          <SelfAura color={fxB.color} glow={fxB.glow} animKey={animKey}/>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ULTIMATE GROUND SHOCKWAVE (ellipse rings — DB Sparking! style)
      ══════════════════════════════════════════════════════════════════ */}
      {(ultA || ultB) && (
        <div key={`ult-${animKey}`}
          className="absolute inset-0"
          style={{ zIndex: 19 }}
        >
          <svg width="100%" height="100%" viewBox="0 0 375 280"
            style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <ellipse cx="187" cy="210" rx="75" ry="36"
              fill="none"
              stroke={ultA ? fxA.glow : fxB.glow}
              strokeWidth="3.5"
              className="animate-impact-burst"
              opacity="0"
              style={{ animationDelay: `${beamImpactMs - 20}ms` }}/>
            <ellipse cx="187" cy="210" rx="130" ry="58"
              fill="none"
              stroke={ultA ? fxA.color : fxB.color}
              strokeWidth="2.5"
              className="animate-impact-burst"
              opacity="0"
              style={{ animationDelay: `${beamImpactMs + 55}ms` }}/>
            <ellipse cx="187" cy="210" rx="175" ry="75"
              fill="none"
              stroke={ultA ? fxA.glow : fxB.glow}
              strokeWidth="1.5"
              className="animate-impact-burst"
              opacity="0"
              style={{ animationDelay: `${beamImpactMs + 120}ms` }}/>
          </svg>
        </div>
      )}

      {/* ═══════════════ STATUS: BURN ═══════════════ */}
      {statusA === "burned" && (
        <div className="absolute" style={{ left: "6%", bottom: "8%", zIndex: 18 }}>
          <BurnIndicator/>
        </div>
      )}
      {statusB === "burned" && (
        <div className="absolute" style={{ right: "6%", bottom: "8%", zIndex: 18 }}>
          <BurnIndicator/>
        </div>
      )}

      {/* ═══════════════ STATUS: STUN ═══════════════ */}
      {statusA === "stunned" && (
        <div className="absolute" style={{ left: "10%", bottom: "62%", zIndex: 18 }}>
          <StunIndicator/>
        </div>
      )}
      {statusB === "stunned" && (
        <div className="absolute" style={{ right: "10%", bottom: "62%", zIndex: 18 }}>
          <StunIndicator/>
        </div>
      )}

      {/* ═══════════════ STATUS: HALFURN (root / vines) ═══════════════ */}
      {statusA === "halfTurn" && (
        <div className="absolute" style={{ left: "4%", bottom: "7%", zIndex: 18 }}>
          <RootIndicator color={FX_THEME[ChampionClass.CURUPIRA].color}/>
        </div>
      )}
      {statusB === "halfTurn" && (
        <div className="absolute" style={{ right: "4%", bottom: "7%", zIndex: 18 }}>
          <RootIndicator color={FX_THEME[ChampionClass.CURUPIRA].color}/>
        </div>
      )}

    </div>
  );
}
