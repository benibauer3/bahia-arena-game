/**
 * WalletConnect.tsx
 *
 * Suporta: MetaMask · Uniswap Wallet · Rabby · Coinbase Wallet · MiniPay
 *
 * Detecção:
 *  • Checa window.ethereum.providers[] (multi-wallet) e window.ethereum diretamente.
 *  • Se a extensão não está instalada, mostra botão "Instalar →".
 *  • Se está no Opera MiniPay, exibe apenas MiniPay.
 */

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { useMiniPay } from "@/hooks/useMiniPay";
import { WALLET_CONNECTORS } from "@/lib/wagmiConfig";
import { useRequireCelo } from "@/hooks/useRequireCelo";

// ─── Detecção de provider instalado ──────────────────────────────────────────

function isProviderInstalled(flags: string[], globalKey?: string): boolean {
  if (typeof window === "undefined") return false;
  const win = window as any;
  const list = win.ethereum?.providers as Record<string, unknown>[] | undefined;
  if (Array.isArray(list) && list.some(p => flags.some(f => p[f]))) return true;
  if (flags.some(f => win.ethereum?.[f])) return true;
  if (globalKey && win[globalKey]) return true;
  return false;
}

// ─── Definição das wallets ────────────────────────────────────────────────────

interface WalletDef {
  id:          string;
  name:        string;
  description: string;
  icon:        string;           // emoji ou URL
  connector:   typeof WALLET_CONNECTORS[keyof typeof WALLET_CONNECTORS];
  installUrl:  string;
  detect:      () => boolean;
}

const WALLETS: WalletDef[] = [
  {
    id:          "metaMask",
    name:        "MetaMask",
    description: "A extensão mais usada no mundo",
    icon:        "🦊",
    connector:   WALLET_CONNECTORS.metaMask,
    installUrl:  "https://metamask.io/download",
    detect:      () => isProviderInstalled(["isMetaMask"]),
  },
  {
    id:          "uniswap",
    name:        "Uniswap Wallet",
    description: "Extensão oficial da Uniswap",
    icon:        "🦄",
    connector:   WALLET_CONNECTORS.uniswap,
    installUrl:  "https://wallet.uniswap.org",
    detect:      () => isProviderInstalled(["isUniswapWallet", "isUniswapExtension"]),
  },
  {
    id:          "rabby",
    name:        "Rabby Wallet",
    description: "Segurança avançada, multi-chain",
    icon:        "🐰",
    connector:   WALLET_CONNECTORS.rabby,
    installUrl:  "https://rabby.io",
    detect:      () => isProviderInstalled(["isRabby"], "rabby"),
  },
  {
    id:          "coinbase",
    name:        "Coinbase Wallet",
    description: "Smart wallet da Coinbase",
    icon:        "🟦",
    connector:   WALLET_CONNECTORS.coinbase,
    installUrl:  "https://www.coinbase.com/wallet/downloads",
    detect:      () => true, // Coinbase SDK funciona sem extensão (smart wallet)
  },
];

const MINIPAY_DEF: WalletDef = {
  id:          "miniPay",
  name:        "MiniPay",
  description: "Opera MiniPay — conecte sua carteira",
  icon:        "📱",
  connector:   WALLET_CONNECTORS.miniPay,
  installUrl:  "https://www.opera.com/pt/crypto/minipay",
  detect:      () => true,
};

// ─── Modal de seleção de wallet ───────────────────────────────────────────────

function WalletModal({ onClose }: { onClose: () => void }) {
  const { connect, isPending, variables, error } = useConnect();
  const { isMiniPay } = useMiniPay();
  const [connecting, setConnecting] = useState<string | null>(null);

  const wallets = isMiniPay ? [MINIPAY_DEF] : WALLETS;

  const handleConnect = async (w: WalletDef) => {
    if (!w.detect() && w.id !== "coinbase") return; // não instalado
    setConnecting(w.id);
    try {
      connect({ connector: w.connector as any });
    } finally {
      // onClose vai ser chamado pelo useEffect externo ao conectar
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-end backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full bg-arena-surface rounded-t-3xl p-5 pb-10 max-w-md mx-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-arena-border rounded-full mx-auto mb-5" />

        <h2 className="text-base font-bold mb-0.5">Conectar Carteira</h2>
        <p className="text-xs text-arena-muted mb-5">
          Escolha a extensão instalada no seu navegador
        </p>

        <div className="flex flex-col gap-2">
          {wallets.map((w) => {
            const installed  = w.detect();
            const isLoading  = (isPending || connecting === w.id) &&
                               variables?.connector === (w.connector as any);

            return (
              <div key={w.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-arena-bg border border-arena-border">
                {/* Ícone */}
                <span className="text-2xl w-9 text-center shrink-0">{w.icon}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{w.name}</p>
                  <p className="text-xs text-arena-muted">{w.description}</p>
                </div>

                {/* Ação */}
                {installed ? (
                  <button
                    onClick={() => handleConnect(w)}
                    disabled={isPending}
                    className="shrink-0 px-3.5 py-2 rounded-xl bg-arena-primary text-arena-bg text-xs font-bold disabled:opacity-50 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    {isLoading ? (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-arena-bg border-t-transparent animate-spin" />
                    ) : "Conectar"}
                  </button>
                ) : (
                  <a
                    href={w.installUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 px-3 py-2 rounded-xl border border-arena-border text-arena-muted text-xs font-semibold hover:text-white hover:border-white/30 transition-colors"
                  >
                    Instalar →
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {/* Erro */}
        {error && (
          <p className="mt-3 text-xs text-arena-danger text-center px-2">
            {error.message.includes("rejected") ? "Conexão cancelada pelo usuário." : error.message}
          </p>
        )}

        {/* Footer */}
        <p className="mt-5 text-center text-[11px] text-arena-muted">
          Novo na Web3?{" "}
          <a href="https://metamask.io/download" target="_blank" rel="noreferrer"
            className="text-arena-primary underline">
            Instale o MetaMask →
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── Botão / Badge conectado ──────────────────────────────────────────────────

export default function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect }                  = useDisconnect();
  const { data: celoBalance }           = useBalance({ address });
  const [showModal, setShowModal]       = useState(false);
  const { isMiniPay }                   = useMiniPay();
  const { isCorrectChain, switchToCelo, isSwitching } = useRequireCelo();

  // Fechar modal automaticamente ao conectar
  const [wasConnected, setWasConnected] = useState(isConnected);
  if (isConnected && !wasConnected) {
    setWasConnected(true);
    setShowModal(false);
  }
  if (!isConnected && wasConnected) {
    setWasConnected(false);
  }

  const shortAddr = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  // ── Não conectado ──────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="w-full px-5 py-3.5 rounded-xl font-semibold text-sm bg-arena-primary text-arena-bg active:scale-95 transition-transform shadow-lg shadow-arena-primary/20"
        >
          {isMiniPay ? "📱 Conectar MiniPay" : "🔗 Conectar Carteira"}
        </button>
        {showModal && <WalletModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  // ── Conectado ──────────────────────────────────────────────────────────────
  const celoAmt = celoBalance
    ? parseFloat(formatUnits(celoBalance.value, 18)).toFixed(3)
    : null;

  // Wrong network — show switch banner instead of wallet info
  if (!isCorrectChain) {
    return (
      <div className="rounded-xl bg-orange-950/40 border border-orange-500/50 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-orange-400 text-base shrink-0">⚠️</span>
          <div className="min-w-0">
            <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">Wrong Network</p>
            <p className="text-xs text-arena-muted truncate">{address?.slice(0,6)}…{address?.slice(-4)}</p>
          </div>
        </div>
        <button
          onClick={switchToCelo}
          disabled={isSwitching}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold disabled:opacity-60 active:scale-95 transition-transform flex items-center gap-1.5"
        >
          {isSwitching
            ? <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
            : "Switch to Celo"
          }
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-arena-surface border border-arena-border px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {/* Dot rede */}
        <div className="w-2.5 h-2.5 rounded-full bg-arena-success animate-pulse shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] text-arena-muted uppercase tracking-wider">
            {chain?.name ?? "Celo"}
          </p>
          <p className="text-sm font-semibold text-white truncate">{shortAddr}</p>
          {celoAmt && (
            <p className="text-xs text-arena-muted">{celoAmt} CELO</p>
          )}
        </div>
      </div>

      <button
        onClick={() => disconnect()}
        className="shrink-0 text-xs text-arena-danger px-3 py-1.5 rounded-lg border border-arena-danger/30 hover:bg-arena-danger/10 transition-colors"
      >
        Sair
      </button>
    </div>
  );
}
