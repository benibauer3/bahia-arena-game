import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
import WalletConnect from "@/components/WalletConnect";
import { useMiniPay } from "@/hooks/useMiniPay";

export default function Home() {
  const { isConnected } = useAccount();
  const { isMiniPay }   = useMiniPay();

  return (
    <div className="flex flex-col min-h-screen bg-arena-bg">
      {/* Hero */}
      <div
        className="relative flex flex-col items-center justify-center pt-16 pb-8 px-6 text-center"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, #F6C90E22 0%, transparent 70%)",
        }}
      >
        <div className="text-6xl mb-4 animate-float">🏟️</div>
        <h1 className="font-display text-arena-primary text-xl leading-tight mb-2">
          BAHIA<br />ARENA
        </h1>
        <p className="text-arena-muted text-sm max-w-xs">
          Batalhas NFT turn-based na Celo. Ganhe cUSD. Seja o campeão da arena.
        </p>

        {isMiniPay && (
          <div className="mt-3 px-3 py-1 rounded-full bg-arena-success/20 border border-arena-success/40 text-arena-success text-xs">
            ✓ Rodando no MiniPay
          </div>
        )}
      </div>

      {/* Wallet */}
      <div className="px-4 mb-6">
        <WalletConnect />
      </div>

      {isConnected && (
        <>
          {/* Quick actions */}
          <div className="px-4 grid grid-cols-2 gap-3 mb-6">
            <Link
              to="/arena"
              className="
                flex flex-col items-center gap-2 p-4 rounded-2xl
                bg-arena-surface border border-arena-border
                active:scale-95 transition-transform
              "
            >
              <span className="text-3xl">⚔️</span>
              <span className="text-sm font-semibold">Arena</span>
              <span className="text-xs text-arena-muted text-center">Batalhas abertas</span>
            </Link>
            <Link
              to="/roster"
              className="
                flex flex-col items-center gap-2 p-4 rounded-2xl
                bg-arena-surface border border-arena-border
                active:scale-95 transition-transform
              "
            >
              <span className="text-3xl">🐉</span>
              <span className="text-sm font-semibold">Criaturas</span>
              <span className="text-xs text-arena-muted text-center">Seu time</span>
            </Link>
          </div>

          {/* Stats bar */}
          <div className="px-4 grid grid-cols-3 gap-2 mb-6">
            {[
              { label: "Vitórias",    value: "—", icon: "🏆" },
              { label: "Criaturas",  value: "—", icon: "🐲" },
              { label: "Ganhos",     value: "—", icon: "💰" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center py-3 rounded-xl bg-arena-surface border border-arena-border"
              >
                <span className="text-xl">{s.icon}</span>
                <span className="text-base font-bold text-arena-primary">{s.value}</span>
                <span className="text-xs text-arena-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* How it works */}
      <div className="px-4 pb-8">
        <h2 className="text-sm font-semibold text-arena-muted mb-3 uppercase tracking-wider">
          Como jogar
        </h2>
        <div className="flex flex-col gap-3">
          {[
            { n: "1", t: "Adquira uma criatura",  d: "Compre seu NFT com cUSD" },
            { n: "2", t: "Crie ou entre numa batalha", d: "Coloque cUSD em stake" },
            { n: "3", t: "Vença e receba",        d: "Payout instantâneo em cUSD" },
          ].map((step) => (
            <div
              key={step.n}
              className="flex items-start gap-3 p-3 rounded-xl bg-arena-surface border border-arena-border"
            >
              <div className="w-7 h-7 rounded-full bg-arena-primary text-arena-bg font-display text-xs flex items-center justify-center shrink-0">
                {step.n}
              </div>
              <div>
                <p className="text-sm font-semibold">{step.t}</p>
                <p className="text-xs text-arena-muted">{step.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
