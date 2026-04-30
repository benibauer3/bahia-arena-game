import { createConfig, http } from "wagmi";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";
import { defineChain } from "viem";

// ─── Celo chains ──────────────────────────────────────────────────────────────

export const celo = defineChain({
  id: 42220,
  name: "Celo",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://forno.celo.org"] },
    public:  { http: ["https://forno.celo.org"] },
  },
  blockExplorers: {
    default: { name: "Celoscan", url: "https://celoscan.io" },
  },
});

export const celoAlfajores = defineChain({
  id: 44787,
  name: "Celo Alfajores",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://alfajores-forno.celo-testnet.org"] },
    public:  { http: ["https://alfajores-forno.celo-testnet.org"] },
  },
  blockExplorers: {
    default: { name: "Celoscan Alfajores", url: "https://alfajores.celoscan.io" },
  },
  testnet: true,
});

const IS_TESTNET   = import.meta.env.VITE_NETWORK === "alfajores";
export const activeChain = IS_TESTNET ? celoAlfajores : celo;

// ─── Connectors ────────────────────────────────────────────────────────────────
// WalletConnect projectId — get one free at https://cloud.walletconnect.com
const WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID ?? "bahia-arena-demo";

export const WALLET_CONNECTORS = {
  metaMask: injected({ target: "metaMask" }),
  rabby:    injected({
    target() {
      return {
        id:       "rabby",
        name:     "Rabby Wallet",
        provider: (typeof window !== "undefined"
          ? (window as any).rabby ?? (window as any).ethereum
          : undefined),
      };
    },
  }),
  injected:       injected(),          // any injected wallet (fallback)
  walletConnect:  walletConnect({ projectId: WC_PROJECT_ID }),
  coinbase:       coinbaseWallet({ appName: "Bahia Arena" }),
  miniPay:        injected({           // MiniPay injects window.ethereum
    target() {
      return {
        id:       "minipay",
        name:     "MiniPay",
        provider: (typeof window !== "undefined"
          ? (window as any).ethereum
          : undefined),
      };
    },
  }),
};

export const wagmiConfig = createConfig({
  chains:     [activeChain],
  connectors: Object.values(WALLET_CONNECTORS),
  transports: { [activeChain.id]: http() },
  pollingInterval: 6_000,
});
