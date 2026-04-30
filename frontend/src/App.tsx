import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WagmiProvider }                from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig }                  from "@/lib/wagmiConfig";
import { useMiniPay }                   from "@/hooks/useMiniPay";
import Home                             from "@/pages/Home";
import Arena                            from "@/pages/Arena";
import Roster                           from "@/pages/Roster";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 10_000 } },
});

function AutoConnect() {
  const { isMiniPay, isDetected } = useMiniPay();
  // MiniPay auto-provides accounts — trigger connect silently once detected
  // (handled by wagmi's injected connector auto-detection)
  return null;
}

// ─── Bottom navigation ────────────────────────────────────────────────────────
function BottomNav() {
  const path = window.location.pathname;

  const tabs = [
    { to: "/",       icon: "🏠", label: "Início"   },
    { to: "/arena",  icon: "⚔️",  label: "Arena"    },
    { to: "/roster", icon: "🐉",  label: "Criaturas" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-arena-surface border-t border-arena-border safe-area-inset-bottom">
      <div className="grid grid-cols-3 max-w-md mx-auto">
        {tabs.map((tab) => (
          <a
            key={tab.to}
            href={tab.to}
            className={`
              flex flex-col items-center gap-0.5 py-2 text-xs
              ${path === tab.to ? "text-arena-primary" : "text-arena-muted"}
              active:bg-arena-border/30 transition-colors
            `}
          >
            <span className="text-xl">{tab.icon}</span>
            {tab.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AutoConnect />
          <div className="max-w-md mx-auto pb-16">
            <Routes>
              <Route path="/"       element={<Home />}   />
              <Route path="/arena"  element={<Arena />}  />
              <Route path="/roster" element={<Roster />} />
            </Routes>
          </div>
          <BottomNav />
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
