import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { useMiniPay } from "@/hooks/useMiniPay";
import { useUSDTBalance } from "@/hooks/useBattle";
import { WALLET_CONNECTORS } from "@/lib/wagmiConfig";

// ─── Wallet definitions for UI ────────────────────────────────────────────────
const WALLETS = [
  {
    id:          "metaMask",
    name:        "MetaMask",
    icon:        "🦊",
    connector:   WALLET_CONNECTORS.metaMask,
    description: "Browser extension",
  },
  {
    id:          "rabby",
    name:        "Rabby Wallet",
    icon:        "🐰",
    connector:   WALLET_CONNECTORS.rabby,
    description: "Security-first wallet",
  },
  {
    id:          "walletConnect",
    name:        "WalletConnect",
    icon:        "🔗",
    connector:   WALLET_CONNECTORS.walletConnect,
    description: "Scan with any wallet",
  },
  {
    id:          "coinbase",
    name:        "Coinbase Wallet",
    icon:        "🟦",
    connector:   WALLET_CONNECTORS.coinbase,
    description: "Coinbase smart wallet",
  },
  {
    id:          "injected",
    name:        "Browser Wallet",
    icon:        "🌐",
    connector:   WALLET_CONNECTORS.injected,
    description: "Any injected wallet",
  },
];

// ─── Wallet Selector Modal ────────────────────────────────────────────────────
function WalletModal({ onClose }: { onClose: () => void }) {
  const { connect, isPending, variables } = useConnect();
  const { isMiniPay } = useMiniPay();

  const walletsToShow = isMiniPay
    ? [{ id: "miniPay", name: "MiniPay", icon: "📱", connector: WALLET_CONNECTORS.miniPay, description: "Opera MiniPay" }]
    : WALLETS;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-end backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full bg-arena-surface rounded-t-3xl p-5 pb-8 max-w-md mx-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-arena-border rounded-full mx-auto mb-5" />

        <h2 className="text-base font-semibold mb-1">Connect Wallet</h2>
        <p className="text-xs text-arena-muted mb-4">
          Choose your wallet to enter the Arena
        </p>

        <div className="flex flex-col gap-2">
          {walletsToShow.map((w) => {
            const isLoading = isPending && variables?.connector === w.connector;
            return (
              <button
                key={w.id}
                onClick={() => connect({ connector: w.connector })}
                disabled={isPending}
                className="
                  flex items-center gap-3 p-3.5 rounded-xl
                  bg-arena-bg border border-arena-border
                  hover:border-arena-primary/50 hover:bg-arena-primary/5
                  active:scale-98 transition-all
                  disabled:opacity-50
                "
              >
                <span className="text-2xl w-8 text-center">{w.icon}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold">{w.name}</p>
                  <p className="text-xs text-arena-muted">{w.description}</p>
                </div>
                {isLoading && (
                  <div className="w-4 h-4 rounded-full border-2 border-arena-primary border-t-transparent animate-spin" />
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-center text-xs text-arena-muted">
          New to Web3?{" "}
          <a
            href="https://metamask.io"
            target="_blank"
            rel="noreferrer"
            className="text-arena-primary underline"
          >
            Get MetaMask →
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── Connected badge ──────────────────────────────────────────────────────────
export default function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect }                  = useDisconnect();
  const { data: celoBalance }           = useBalance({ address });
  const { data: cusdBalance }           = useUSDTBalance();
  const [showModal, setShowModal]       = useState(false);
  const { isMiniPay }                   = useMiniPay();

  const shortAddr = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  if (!isConnected) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="
            w-full px-5 py-3.5 rounded-xl font-body font-semibold text-sm
            bg-arena-primary text-arena-bg
            active:scale-95 transition-transform shadow-lg shadow-arena-primary/20
          "
        >
          {isMiniPay ? "Connect MiniPay" : "Connect Wallet"}
        </button>
        {showModal && <WalletModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-arena-surface border border-arena-border">
      <div className="flex flex-col">
        <span className="text-xs text-arena-muted">{chain?.name ?? "Celo"}</span>
        <span className="text-sm font-semibold text-white">{shortAddr}</span>
        <div className="flex gap-3 text-xs text-arena-muted mt-0.5">
          {celoBalance && (
            <span>{parseFloat(formatUnits(celoBalance.value, 18)).toFixed(2)} CELO</span>
          )}
          {cusdBalance !== undefined && (
            <span>{parseFloat(formatUnits(cusdBalance as bigint, 18)).toFixed(2)} USDT</span>
          )}
        </div>
      </div>
      <button
        onClick={() => disconnect()}
        className="text-xs text-arena-danger px-2 py-1 rounded-lg hover:bg-arena-danger/10 transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}
