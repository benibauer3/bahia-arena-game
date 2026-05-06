import { createConfig, http } from "wagmi";
import { injected, coinbaseWallet } from "wagmi/connectors";
// Use viem's built-in Celo chains — they include CIP-64 transaction formatters
// (feeCurrency support) required for correct gas estimation and fee abstraction.
// A manual defineChain() lacks these formatters, causing "Unavailable" gas in wallets.
import {
  celo        as viemCelo,
  celoAlfajores as viemCeloAlfajores,
} from "viem/chains";

// ─── Celo chains ──────────────────────────────────────────────────────────────
// Re-export under the same names the rest of the codebase uses, so no other
// file needs to change.  We keep forno.celo.org as the primary RPC endpoint.

export const celo = {
  ...viemCelo,
  rpcUrls: {
    default: { http: ["https://forno.celo.org"] },
    public:  { http: ["https://forno.celo.org"] },
  },
} as typeof viemCelo;

export const celoAlfajores = {
  ...viemCeloAlfajores,
  rpcUrls: {
    default: { http: ["https://alfajores-forno.celo-testnet.org"] },
    public:  { http: ["https://alfajores-forno.celo-testnet.org"] },
  },
} as typeof viemCeloAlfajores;

const IS_TESTNET      = import.meta.env.VITE_NETWORK === "alfajores";
export const activeChain = IS_TESTNET ? celoAlfajores : celo;

// ─── Provider detection ────────────────────────────────────────────────────────
// When multiple extensions are installed, browsers expose window.ethereum.providers[].
// We search that array first, then fall back to window.ethereum directly.

type EthProvider = Record<string, unknown>;

function findProvider(flags: string[]): EthProvider | undefined {
  if (typeof window === "undefined") return undefined;
  const win = window as any;

  // Multi-wallet scenario: providers array
  const list: EthProvider[] | undefined = win.ethereum?.providers;
  if (Array.isArray(list)) {
    const found = list.find(p => flags.some(f => p[f]));
    if (found) return found;
  }

  // Single wallet: check window.ethereum directly
  const eth: EthProvider | undefined = win.ethereum;
  if (eth && flags.some(f => eth[f])) return eth;

  // Last resort: named global (Rabby exposes window.rabby)
  for (const flag of flags) {
    if (win[flag]) return win[flag] as EthProvider;
  }

  return undefined;
}

// ─── Connectors ───────────────────────────────────────────────────────────────

export const WALLET_CONNECTORS = {

  // MetaMask — isMetaMask flag; skip if it's actually Rabby pretending to be MM
  metaMask: injected({
    target() {
      return {
        id:       "metaMask",
        name:     "MetaMask",
        provider: findProvider(["isMetaMask"]) as any,
      };
    },
  }),

  // Rabby Wallet — isRabby flag; also exposes window.rabby
  rabby: injected({
    target() {
      return {
        id:       "rabby",
        name:     "Rabby Wallet",
        provider: (findProvider(["isRabby"]) ?? (typeof window !== "undefined" ? (window as any).rabby : undefined)) as any,
      };
    },
  }),

  // Uniswap Extension — isUniswapWallet flag
  uniswap: injected({
    target() {
      return {
        id:       "uniswapWallet",
        name:     "Uniswap Wallet",
        provider: findProvider(["isUniswapWallet", "isUniswapExtension"]) as any,
      };
    },
  }),

  // Coinbase Wallet — smart wallet + extension
  coinbase: coinbaseWallet({ appName: "Bahia Arena" }),

  // MiniPay (Opera browser on Celo)
  miniPay: injected({
    target() {
      return {
        id:       "minipay",
        name:     "MiniPay",
        provider: (typeof window !== "undefined" ? (window as any).ethereum : undefined) as any,
      };
    },
  }),

  // Generic fallback — picks up any other injected wallet
  injected: injected(),
};

export const wagmiConfig = createConfig({
  chains:     [activeChain],
  connectors: Object.values(WALLET_CONNECTORS),
  transports: {
    [celo.id]:          http("https://forno.celo.org"),
    [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
  },
  pollingInterval: 6_000,
});
