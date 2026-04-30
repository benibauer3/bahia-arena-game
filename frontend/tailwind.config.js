/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Bahia Arena palette – vibrant tropics meets neon Web3
        arena: {
          bg:       "#0D1117",
          surface:  "#161B22",
          border:   "#21262D",
          primary:  "#F6C90E",  // golden yellow
          accent:   "#FF6B35",  // sunset orange
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
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shake":      "shake 0.5s ease-in-out",
        "float":      "float 3s ease-in-out infinite",
        "glow":       "glow 2s ease-in-out infinite",
      },
      keyframes: {
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
      },
    },
  },
  plugins: [],
};
