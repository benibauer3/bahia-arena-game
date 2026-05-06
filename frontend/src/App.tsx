import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import { WagmiProvider, useAccount }                  from "wagmi";
import { QueryClient, QueryClientProvider }           from "@tanstack/react-query";
import { useState, useEffect, useMemo, Component }    from "react";
import type { ReactNode }                             from "react";
import UsernameModal                                  from "@/components/UsernameModal";
import { usePlayerProfile }                           from "@/hooks/usePlayerProfile";
import { getProfile }                                 from "@/lib/playerStore";
import BahiaArenaLogo                                 from "@/components/BahiaArenaLogo";
import { wagmiConfig }                                from "@/lib/wagmiConfig";
import { ViewModeContext, type ViewMode }              from "@/lib/viewModeContext";
import Home                                           from "@/pages/Home";
import Arena                                          from "@/pages/Arena";
import Roster                                         from "@/pages/Roster";
import Battle                                         from "@/pages/Battle";
import Leaderboard                                    from "@/pages/Leaderboard";
import Demo                                           from "@/pages/Demo";
import PulseRewards                                   from "@/pages/PulseRewards";
import Profile                                        from "@/pages/Profile";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000 } },
});

// ─── Error Boundary ───────────────────────────────────────────────────────────
class PageErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-arena-bg flex flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="text-4xl">⚠️</span>
          <p className="text-white font-semibold">Something went wrong on this page.</p>
          <p className="text-xs text-arena-muted">{(this.state.error as Error).message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-2 px-5 py-2.5 rounded-xl bg-arena-primary text-arena-bg text-sm font-semibold"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── View toggle (PC / Mobile) ────────────────────────────────────────────────

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

// ─── Bottom Navigation (mobile only) ──────────────────────────────────────────
function BottomNav() {
  const location = useLocation();
  const path     = location.pathname;

  const tabs = [
    { to: "/",            icon: "🏠", label: "Home"    },
    { to: "/demo",        icon: "🎮", label: "Demo"    },
    { to: "/arena",       icon: "⚔️",  label: "Arena"   },
    { to: "/leaderboard", icon: "🏆", label: "Ranking" },
    { to: "/profile",     icon: "👤", label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-arena-surface/95 backdrop-blur-sm border-t border-arena-border safe-area-inset-bottom">
      <div className="grid grid-cols-5 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isDemo   = tab.to === "/demo";
          const isActive = path === tab.to;
          return (
            <a
              key={tab.to}
              href={tab.to}
              className={`
                relative flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium
                ${isActive ? "text-arena-primary" : isDemo ? "text-arena-primary/80" : "text-arena-muted"}
                active:bg-arena-border/30 transition-colors
              `}
            >
              {isDemo && !isActive && (
                <span className="absolute top-1.5 right-3 w-1.5 h-1.5 rounded-full bg-arena-primary animate-ping" />
              )}
              <span className={`
                text-xl leading-none
                ${isDemo && !isActive ? "drop-shadow-[0_0_6px_rgba(246,201,14,0.8)]" : ""}
              `}>
                {tab.icon}
              </span>
              {tab.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Sidebar Nav (desktop only) ───────────────────────────────────────────────
function SidebarNav() {
  const location = useLocation();
  const path     = location.pathname;

  const items = [
    { to: "/",            icon: "🏠", label: "Home"      },
    { to: "/demo",        icon: "🎮", label: "Demo"      },
    { to: "/arena",       icon: "⚔️",  label: "Arena"     },
    { to: "/leaderboard", icon: "🏆", label: "Ranking"   },
    { to: "/roster",      icon: "🐉",  label: "Champions" },
    { to: "/pulse",       icon: "⚡", label: "Rewards"   },
    { to: "/profile",     icon: "👤", label: "Profile"   },
  ];

  return (
    <aside className="
      fixed top-0 left-0 z-40
      w-64 h-screen flex flex-col
      border-r border-arena-border bg-[#080c14]
      p-6 shrink-0 overflow-y-auto
    ">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <BahiaArenaLogo size={130} showWordmark={true} />
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1">
        {items.map(item => {
          const isActive = path === item.to;
          const isPulse  = item.to === "/pulse";
          const isDemo   = item.to === "/demo";
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`
                relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? isPulse
                    ? "bg-green-400/10 text-green-400 border border-green-400/25"
                    : "bg-arena-primary/12 text-arena-primary border border-arena-primary/25"
                  : "text-arena-muted hover:text-white hover:bg-white/5 border border-transparent"}
              `}
            >
              {/* Pulse dot for demo & pulse when inactive */}
              {(isDemo || isPulse) && !isActive && (
                <span className={`
                  absolute top-2.5 right-3 w-1.5 h-1.5 rounded-full animate-ping
                  ${isPulse ? "bg-green-400" : "bg-arena-primary"}
                `}/>
              )}
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Network badge */}
      <div className="mt-auto pt-4 border-t border-arena-border">
        <div className="flex items-center gap-2 text-xs text-arena-muted">
          <div className="w-2 h-2 rounded-full bg-arena-success animate-pulse" />
          Celo Network
        </div>
      </div>
    </aside>
  );
}

// ─── Desktop Layout — full screen ─────────────────────────────────────────────
function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#070a10]">
      <SidebarNav />
      {/* Content offset by sidebar width */}
      <main className="flex-1 ml-64 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

// ─── Profile Gate ─────────────────────────────────────────────────────────────
function ProfileGate({ children }: { children: React.ReactNode }) {
  const { address, status } = useAccount();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissal whenever the connected wallet changes so a new wallet
  // always gets a fresh prompt.
  useEffect(() => { setDismissed(false); }, [address]);

  /**
   * Read localStorage DIRECTLY — no React state, no timing window.
   *
   * The previous approach (usePlayerProfile().needsSetup) went through React
   * state that initialises as null and is only populated after a useEffect.
   * On the render where wagmi transitions to "connected", React state hadn't
   * caught up yet, so needsSetup was briefly true and the modal flashed open —
   * even for wallets that already had a saved profile.
   *
   * getProfile() is a synchronous localStorage read (~µs).  Re-evaluated only
   * when `address` changes so it doesn't run on every single render.
   */
  const walletHasProfile = useMemo(
    () => !!(address && getProfile(address)),
    [address],
  );

  const showModal =
    status === "connected" &&
    !!address &&
    !walletHasProfile &&
    !dismissed;

  return (
    <>
      {children}
      {showModal && <UsernameModal onClose={() => setDismissed(true)} />}
    </>
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

  const routes = (
    <PageErrorBoundary>
      <Routes>
        <Route path="/"            element={<Home />}         />
        <Route path="/arena"       element={<Arena />}        />
        <Route path="/battle/:id"  element={<Battle />}       />
        <Route path="/leaderboard" element={<Leaderboard />}  />
        <Route path="/roster"      element={<Roster />}       />
        <Route path="/demo"        element={<Demo />}         />
        <Route path="/pulse"       element={<PulseRewards />} />
        <Route path="/profile"     element={<Profile />}      />
      </Routes>
    </PageErrorBoundary>
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ViewModeContext.Provider value={viewMode}>
            <ProfileGate>
              {/* View toggle — always visible */}
              <ViewToggle mode={viewMode} onChange={setViewMode} />

              {viewMode === "mobile" ? (
                /* ── MOBILE: narrow centered layout with bottom nav ── */
                <div className="max-w-md mx-auto relative">
                  <div className="pb-16">{routes}</div>
                  <BottomNav />
                </div>
              ) : (
                /* ── DESKTOP: full-screen with sidebar ── */
                <DesktopLayout>
                  {routes}
                </DesktopLayout>
              )}
            </ProfileGate>
          </ViewModeContext.Provider>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
