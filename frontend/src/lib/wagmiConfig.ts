import { createConfig, http } from "wagmi";
import { injected } from "@wagmi/connectors";
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
  contracts: {
    // cUSD stablecoin
    cUSD: { address: "0x765DE816845861e75A25fCA122bb6898B8B1282a" },
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
  contracts: {
    cUSD: { address: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1" },
  },
});

// ─── Detect active network from env ──────────────────────────────────────────

const IS_TESTNET = import.meta.env.VITE_NETWORK === "alfajores";
export const activeChain = IS_TESTNET ? celoAlfajores : celo;

// ─── Wagmi config ─────────────────────────────────────────────────────────────
// injected() covers both MiniPay's window.ethereum and MetaMask

export const wagmiConfig = createConfig({
  chains:      [activeChain],
  connectors:  [injected()],
  transports:  { [activeChain.id]: http() },
  // Reduce polling – Celo finalises in ~5s, no need for aggressive polling
  pollingInterval: 6_000,
});
