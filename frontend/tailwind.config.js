/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        arena: {
          bg:       "#0D1117",
          surface:  "#161B22",
          border:   "#21262D",
          primary:  "#F6C90E",
          accent:   "#FF6B35",
          success:  "#3FB950",
          danger:   "#F85149",
          info:     "#58A6FF",
          muted:    "#8B949E",
        },
        element: {
          fire:      "#FF4500",
          water:     "#1E90FF",
          earth:     "#8B6914",
          wind:      "#7EC8E3",
          lightning: "#FFD700",
        },
      },
      fontFamily: {
        display: ["'Press Start 2P'", "monospace"],
        body:    ["'Inter'", "sans-serif"],
      },
      animation: {
        // ── existing ────────────────────────────────────────
        "pulse-slow":  "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shake":       "shake 0.5s ease-in-out",
        "float":       "float 3s ease-in-out infinite",
        "glow":        "glow 2s ease-in-out infinite",
        // ── combat ──────────────────────────────────────────
        "float-up":        "floatUp 0.9s ease-out forwards",
        "shake-hit":       "shakeHit 0.45s ease-in-out",
        "flash-red":       "flashRed 0.4s ease-in-out",
        "flash-cyan":      "flashCyan 0.4s ease-in-out",
        "flash-gold":      "flashGold 0.6s ease-in-out",
        "flash-green":     "flashGreen 0.4s ease-in-out",
        "pop-in":          "popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        "card-fly":        "cardFly 0.4s ease-in forwards",
        "card-select":     "cardSelect 0.2s ease-out forwards",
        "victory-pulse":   "victoryPulse 0.8s ease-in-out infinite",
        "defeat-shake":    "defeatShake 0.6s ease-in-out",
        "status-pop":      "statusPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        "energy-fill":     "energyFill 0.3s ease-out forwards",
        "screen-flash":    "screenFlash 0.5s ease-in-out",
        "ultimate-burst":  "ultimateBurst 0.7s ease-out",
        // ── ability projectiles ──────────────────────────────
        "proj-ab":         "projAB 0.42s cubic-bezier(0.4,0,0.2,1) forwards",
        "proj-ba":         "projBA 0.42s cubic-bezier(0.4,0,0.2,1) forwards",
        "impact-burst":    "impactBurst 0.45s ease-out both",
        "self-aura":       "selfAura 0.75s ease-out forwards",
        // ── persistent status effects ─────────────────────────
        "status-burn":     "statusBurn 0.75s ease-in-out infinite",
        "status-stun":     "statusStun 1.3s linear infinite",
        "status-root":     "statusRoot 2.5s ease-in-out infinite",
        // ── champion charge-up before firing ──────────────────
        "champ-charge":    "champCharge 0.2s ease-out forwards",
        // ── SF3 / SF6 / DBFZ / DB Sparking! ──────────────────
        "hit-spark":       "hitSpark 0.42s ease-out forwards",
        "beam-super":      "beamSuper 0.55s cubic-bezier(0.25,0.46,0.45,0.94) forwards",
        "super-freeze":    "superFreeze 0.46s ease-out forwards",
        "afterimage":      "afterimage 0.42s ease-out forwards",
        "counter-text":    "counterText 0.72s cubic-bezier(0.175,0.885,0.32,1.275) forwards",
        "parry-text":      "parryText 0.58s cubic-bezier(0.175,0.885,0.32,1.275) forwards",
        "low-hp-pulse":    "lowHpPulse 0.6s ease-in-out infinite",
        "drive-flash":     "driveFlash 0.4s ease-out",
        "sparking-aura":   "sparkingAura 1.4s ease-in-out infinite",
        "beam-muzzle":     "beamMuzzle 0.22s ease-out forwards",
      },
      keyframes: {
        // ── existing ──
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%":      { transform: "translateX(-8px)" },
          "75%":      { transform: "translateX(8px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-10px)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 5px #F6C90E40" },
          "50%":      { boxShadow: "0 0 20px #F6C90ECC" },
        },
        // ── combat ──
        floatUp: {
          "0%":   { transform: "translateY(0) scale(1)",    opacity: "1" },
          "30%":  { transform: "translateY(-18px) scale(1.15)", opacity: "1" },
          "70%":  { transform: "translateY(-40px) scale(1.05)", opacity: "0.8" },
          "100%": { transform: "translateY(-60px) scale(0.9)",  opacity: "0" },
        },
        shakeHit: {
          "0%":   { transform: "translateX(0) rotate(0deg)" },
          "15%":  { transform: "translateX(-7px) rotate(-2deg)" },
          "30%":  { transform: "translateX(7px) rotate(2deg)" },
          "45%":  { transform: "translateX(-5px) rotate(-1deg)" },
          "60%":  { transform: "translateX(5px) rotate(1deg)" },
          "75%":  { transform: "translateX(-2px)" },
          "100%": { transform: "translateX(0) rotate(0deg)" },
        },
        flashRed: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(248,81,73,0)",   filter: "brightness(1)" },
          "40%":      { boxShadow: "0 0 24px rgba(248,81,73,0.9)", filter: "brightness(1.4)" },
        },
        flashCyan: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(34,211,238,0)",   filter: "brightness(1)" },
          "40%":      { boxShadow: "0 0 24px rgba(34,211,238,0.9)", filter: "brightness(1.3)" },
        },
        flashGold: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(246,201,14,0)",   filter: "brightness(1)" },
          "30%":      { boxShadow: "0 0 32px rgba(246,201,14,1)", filter: "brightness(1.6)" },
          "60%":      { boxShadow: "0 0 48px rgba(246,201,14,0.8)", filter: "brightness(1.4)" },
        },
        flashGreen: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(63,185,80,0)",   filter: "brightness(1)" },
          "40%":      { boxShadow: "0 0 24px rgba(63,185,80,0.9)", filter: "brightness(1.4)" },
        },
        popIn: {
          "0%":   { transform: "scale(0) rotate(-15deg)", opacity: "0" },
          "65%":  { transform: "scale(1.2) rotate(5deg)",  opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)",    opacity: "1" },
        },
        cardFly: {
          "0%":   { transform: "translateY(0) scale(1)",    opacity: "1" },
          "50%":  { transform: "translateY(-30px) scale(1.1)", opacity: "0.8" },
          "100%": { transform: "translateY(-80px) scale(0.7)",  opacity: "0" },
        },
        cardSelect: {
          "0%":   { transform: "translateY(0)" },
          "50%":  { transform: "translateY(-10px)" },
          "100%": { transform: "translateY(-8px)" },
        },
        victoryPulse: {
          "0%, 100%": { transform: "scale(1)",    filter: "brightness(1) drop-shadow(0 0 0 transparent)" },
          "50%":      { transform: "scale(1.06)", filter: "brightness(1.35) drop-shadow(0 0 16px #F6C90E)" },
        },
        defeatShake: {
          "0%":   { transform: "translateX(0) rotate(0)" },
          "10%":  { transform: "translateX(-10px) rotate(-3deg)" },
          "30%":  { transform: "translateX(10px) rotate(3deg)" },
          "50%":  { transform: "translateX(-8px) rotate(-2deg)" },
          "70%":  { transform: "translateX(8px) rotate(2deg)" },
          "85%":  { transform: "translateX(-3px)" },
          "100%": { transform: "translateX(0) rotate(0)" },
        },
        statusPop: {
          "0%":   { transform: "scale(0) translateY(4px)", opacity: "0" },
          "60%":  { transform: "scale(1.3) translateY(-2px)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(0)",      opacity: "1" },
        },
        energyFill: {
          "0%":   { transform: "scaleX(0)", opacity: "0.5" },
          "100%": { transform: "scaleX(1)", opacity: "1" },
        },
        screenFlash: {
          "0%, 100%": { opacity: "0" },
          "20%":      { opacity: "0.15" },
          "50%":      { opacity: "0.08" },
        },
        ultimateBurst: {
          "0%":   { transform: "scale(0.8)", opacity: "0.9" },
          "40%":  { transform: "scale(1.15)", opacity: "1" },
          "70%":  { transform: "scale(1.05)", opacity: "0.9" },
          "100%": { transform: "scale(1)",    opacity: "1" },
        },
        // ── projectile travel ──
        projAB: {
          "0%":   { transform: "translateX(0)     scale(0.5)",  opacity: "0" },
          "12%":  { transform: "translateX(12px)  scale(1.15)", opacity: "1" },
          "88%":  {                                              opacity: "0.9" },
          "100%": { transform: "translateX(192px) scale(0.65)", opacity: "0" },
        },
        projBA: {
          "0%":   { transform: "translateX(0)      scale(0.5)",  opacity: "0" },
          "12%":  { transform: "translateX(-12px)  scale(1.15)", opacity: "1" },
          "88%":  {                                               opacity: "0.9" },
          "100%": { transform: "translateX(-192px) scale(0.65)", opacity: "0" },
        },
        // ── impact burst (rings expand outward) ──
        impactBurst: {
          "0%":   { transform: "scale(0)",   opacity: "0" },
          "18%":  { transform: "scale(0.9)", opacity: "1" },
          "100%": { transform: "scale(3.2)", opacity: "0" },
        },
        // ── self aura (heal / shield) ──
        selfAura: {
          "0%":   { transform: "scale(0.6)", opacity: "0" },
          "22%":  { transform: "scale(1.1)", opacity: "0.9" },
          "65%":  { transform: "scale(1.0)", opacity: "0.65" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        // ── burn flicker ──
        statusBurn: {
          "0%, 100%": { transform: "scaleY(1)    translateY(0)",    opacity: "0.9" },
          "50%":      { transform: "scaleY(1.35) translateY(-5px)", opacity: "0.55" },
        },
        // ── stun star orbit ──
        statusStun: {
          "0%":   { transform: "rotate(0deg)   translateX(22px) rotate(0deg)",    opacity: "1" },
          "100%": { transform: "rotate(360deg) translateX(22px) rotate(-360deg)", opacity: "1" },
        },
        // ── root glow pulse ──
        statusRoot: {
          "0%, 100%": { opacity: "0.8", transform: "scale(1)" },
          "50%":      { opacity: "0.3", transform: "scale(0.92)" },
        },
        // ── charge-up flash before firing ──
        champCharge: {
          "0%":   { filter: "brightness(1)" },
          "50%":  { filter: "brightness(1.8) saturate(1.4)" },
          "100%": { filter: "brightness(1)" },
        },
        // ── SF / DBFZ radial hit sparks ──
        hitSpark: {
          "0%":   { transform: "scale(0.2) rotate(-5deg)",  opacity: "0" },
          "22%":  { transform: "scale(1.05) rotate(8deg)",  opacity: "1" },
          "70%":  { transform: "scale(1.7) rotate(20deg)",  opacity: "0.55" },
          "100%": { transform: "scale(2.4) rotate(28deg)",  opacity: "0" },
        },
        // ── DBFZ beam super (Kamehameha / Galick Gun) ──
        beamSuper: {
          "0%":   { transform: "scaleX(0)",    opacity: "0" },
          "9%":   { transform: "scaleX(0.12)", opacity: "1" },
          "62%":  { transform: "scaleX(1)",    opacity: "1" },
          "100%": { transform: "scaleX(1.02)", opacity: "0" },
        },
        // ── SF3 / SF6 / DBFZ super freeze ──
        superFreeze: {
          "0%":   { opacity: "0" },
          "12%":  { opacity: "0.88" },
          "42%":  { opacity: "0.55" },
          "78%":  { opacity: "0.18" },
          "100%": { opacity: "0" },
        },
        // ── DBFZ afterimage trail ──
        afterimage: {
          "0%":   { opacity: "0.52" },
          "100%": { opacity: "0" },
        },
        // ── SF6 counter hit text ──
        counterText: {
          "0%":   { transform: "scale(0.35) translateX(-18px) skewX(-10deg)", opacity: "0" },
          "18%":  { transform: "scale(1.12) translateX(3px)  skewX(4deg)",   opacity: "1" },
          "45%":  { transform: "scale(0.98) translateX(0)    skewX(0deg)",   opacity: "1" },
          "72%":  { transform: "scale(1)    translateX(0)",                   opacity: "0.92" },
          "100%": { transform: "scale(1)    translateX(0)",                   opacity: "0" },
        },
        // ── SF3 parry text ──
        parryText: {
          "0%":   { transform: "scale(0.3) translateY(10px)",  opacity: "0" },
          "22%":  { transform: "scale(1.25) translateY(-5px)", opacity: "1" },
          "52%":  { transform: "scale(0.97) translateY(0)",    opacity: "1" },
          "100%": { transform: "scale(1)    translateY(0)",    opacity: "0" },
        },
        // ── DB Sparking! low HP danger pulse ──
        lowHpPulse: {
          "0%, 100%": { opacity: "1",   filter: "brightness(1)" },
          "50%":      { opacity: "0.3", filter: "brightness(1.8)" },
        },
        // ── SF6 Drive Gauge flash on spend ──
        driveFlash: {
          "0%":   { filter: "brightness(1) saturate(1)" },
          "35%":  { filter: "brightness(2.6) saturate(1.8)" },
          "100%": { filter: "brightness(1) saturate(1)" },
        },
        // ── DB Sparking! low-HP aura ──
        sparkingAura: {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%":      { opacity: "0.9", transform: "scale(1.06)" },
        },
        // ── Beam muzzle flash ──
        beamMuzzle: {
          "0%":   { transform: "scale(0)", opacity: "0" },
          "40%":  { transform: "scale(1.4)", opacity: "1" },
          "100%": { transform: "scale(0.8)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
