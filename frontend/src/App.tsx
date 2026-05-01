import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { WagmiProvider }                              from "wagmi";
import { QueryClient, QueryClientProvider }           from "@tanstack/react-query";
import { useState, useEffect }                        from "react";
import { wagmiConfig }                                from "@/lib/wagmiConfig";
import Home                                           from "@/pages/Home";
import Arena                                          from "@/pages/Arena";
import Roster                                         from "@/pages/Roster";
import Battle                                         from "@/pages/Battle";
import Leaderboard                                    from "@/pages/Leaderboard";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000 } },
});

// ─── View toggle (PC / Mobile) ────────────────────────────────────────────────
type ViewMode = "mobile" | "desktop";

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-1 bg-arena-surface/90 border border-arena-border backdrop-blur-sm rounded-full px-1.5 py-1 shadow-lg">
      <button
        onClick={() => onChange("mobile")}
        title="Mobile view"
        className={`
          flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all
          ${mode === "mobile"
            ? "bg-arena-primary text-arena-bg"
            : "text-arena-muted hover:text-white"}
        `}
      >
        📱 <span className="hidden sm:inline">Mobile</span>
      </button>
      <button
        onClick={() => onChange("desktop")}
        title="Desktop view"
        className={`
          flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all
          ${mode === "desktop"
            ? "bg-arena-primary text-arena-bg"
            : "text-arena-muted hover:text-white"}
        `}
      >
        🖥️ <span className="hidden sm:inline">Desktop</span>
      </button>
    </div>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────
function BottomNav() {
  const location = useLocation();
  const path     = location.pathname;

  const tabs = [
    { to: "/",            icon: "🏠", label: "Home"      },
    { to: "/arena",       icon: "⚔️",  label: "Arena"     },
    { to: "/leaderboard", icon: "🏆", label: "Ranking"   },
    { to: "/roster",      icon: "🐉",  label: "Champions" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-arena-surface/95 backdrop-blur-sm border-t border-arena-border safe-area-inset-bottom">
      <div className="grid grid-cols-4 max-w-md mx-auto">
        {tabs.map((tab) => (
          <a
            key={tab.to}
            href={tab.to}
            className={`
              flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium
              ${path === tab.to ? "text-arena-primary" : "text-arena-muted"}
              active:bg-arena-border/30 transition-colors
            `}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            {tab.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

// ─── Desktop layout wrapper ────────────────────────────────────────────────────
function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070a10] flex">
      {/* Left sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-arena-border bg-arena-surface/30 p-6 shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-3xl">🏟️</span>
          <div>
            <p className="font-display text-arena-primary text-xs leading-tight">BAHIA<br />ARENA</p>
          </div>
        </div>
        <nav className="flex flex-col gap-2">
          {[
            { to: "/",            icon: "🏠", label: "Home"       },
            { to: "/arena",       icon: "⚔️",  label: "Arena"      },
            { to: "/leaderboard", icon: "🏆", label: "Ranking"    },
            { to: "/roster",      icon: "🐉",  label: "Champions"  },
          ].map(tab => (
            <a key={tab.to} href={tab.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-arena-muted hover:text-white hover:bg-arena-border/50 transition-colors"
            >
              <span className="text-lg">{tab.icon}</span>{tab.label}
            </a>
          ))}
        </nav>
        {/* Network badge */}
        <div className="mt-auto pt-4 border-t border-arena-border">
          <div className="flex items-center gap-2 text-xs text-arena-muted">
            <div className="w-2 h-2 rounded-full bg-arena-success animate-pulse" />
            Celo Network
          </div>
        </div>
      </aside>

      {/* Center — phone frame */}
      <main className="flex-1 flex items-start justify-center py-8 px-4">
        <div className="
          w-full max-w-sm bg-arena-bg rounded-3xl overflow-hidden
          shadow-2xl shadow-black/60
          border border-arena-border/60
          ring-1 ring-white/5
          min-h-[700px] relative
        ">
          {children}
        </div>
      </main>

      {/* Right panel — champion quick-ref */}
      <aside className="hidden xl:flex flex-col w-72 border-l border-arena-border bg-arena-surface/30 p-6 shrink-0 gap-4">
        <p className="text-xs font-semibold text-arena-muted uppercase tracking-wider">Champions</p>
        {[
          { name: "Curupira", role: "Tank",     emoji: "🦶", color: "text-green-400"  },
          { name: "Iara",     role: "Support",  emoji: "🧜‍♀️", color: "text-cyan-400"   },
          { name: "Boitatá",  role: "DPS/DoT",  emoji: "🐍", color: "text-orange-400" },
          { name: "Anhangá",  role: "Assassin", emoji: "💀", color: "text-purple-400" },
          { name: "Tupã",     role: "Mage",     emoji: "⚡", color: "text-yellow-400" },
        ].map(c => (
          <div key={c.name} className="flex items-center gap-3">
            <span className="text-2xl">{c.emoji}</span>
            <div>
              <p className={`text-sm font-semibold ${c.color}`}>{c.name}</p>
              <p className="text-xs text-arena-muted">{c.role}</p>
            </div>
          </div>
        ))}
        <div className="mt-auto pt-4 border-t border-arena-border">
          <p className="text-xs text-arena-muted">Entry Fee: <span className="text-arena-primary font-semibold">1 USDT</span></p>
          <p className="text-xs text-arena-muted">Protocol Fee: <span className="text-white font-semibold">2%</span></p>
        </div>
      </aside>
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem("bahia-view") as ViewMode) ?? "mobile";
  });

  useEffect(() => {
    localStorage.setItem("bahia-view", viewMode);
  }, [viewMode]);

  const content = (
    <>
      <div className={viewMode === "mobile" ? "pb-16" : ""}>
        <Routes>
          <Route path="/"                  element={<Home />}        />
          <Route path="/arena"             element={<Arena />}       />
          <Route path="/battle/:id"        element={<Battle />}      />
          <Route path="/leaderboard"       element={<Leaderboard />} />
          <Route path="/roster"            element={<Roster />}      />
        </Routes>
      </div>
      {viewMode === "mobile" && <BottomNav />}
    </>
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {/* PC / Mobile toggle — always visible */}
          <ViewToggle mode={viewMode} onChange={setViewMode} />

          {viewMode === "mobile" ? (
            <div className="max-w-md mx-auto relative">
              {content}
            </div>
          ) : (
            <DesktopLayout>{content}</DesktopLayout>
          )}
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
