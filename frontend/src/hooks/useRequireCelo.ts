/**
 * useRequireCelo.ts
 *
 * Garante que a wallet esteja na Celo Mainnet (chainId 42220) antes de qualquer tx.
 *
 * Uso:
 *   const { isCorrectChain, switchToCelo, isSwitching } = useRequireCelo();
 *   // Antes de qualquer writeContract:
 *   await switchToCelo();
 */

import { useCallback, useState } from "react";
import { useChainId, useSwitchChain } from "wagmi";
import { celo, activeChain } from "@/lib/wagmiConfig";

// Parâmetros completos da Celo Mainnet para wallet_addEthereumChain
const CELO_CHAIN_PARAMS = {
  chainId:           "0xA4EC",   // 42220 em hex
  chainName:         "Celo",
  nativeCurrency:    { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls:           ["https://forno.celo.org"],
  blockExplorerUrls: ["https://celoscan.io"],
};

export function useRequireCelo() {
  const chainId                       = useChainId();
  const { switchChainAsync }          = useSwitchChain();
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const isCorrectChain = chainId === activeChain.id;

  const switchToCelo = useCallback(async () => {
    if (isCorrectChain) return; // já está na Celo

    setIsSwitching(true);
    setSwitchError(null);

    try {
      // Tenta trocar via wagmi (wallet já conhece a rede)
      await switchChainAsync({ chainId: activeChain.id });
    } catch {
      // Se falhou (rede não cadastrada), adiciona via RPC puro
      try {
        await (window as any).ethereum?.request({
          method: "wallet_addEthereumChain",
          params: [CELO_CHAIN_PARAMS],
        });
        // Após adicionar, tenta trocar novamente
        await switchChainAsync({ chainId: activeChain.id });
      } catch (e2: unknown) {
        const err = e2 as { message?: string };
        const msg = err?.message ?? "Não foi possível trocar para a Celo.";
        setSwitchError(msg);
        throw new Error(msg);
      }
    } finally {
      setIsSwitching(false);
    }
  }, [isCorrectChain, switchChainAsync]);

  return { isCorrectChain, switchToCelo, isSwitching, switchError };
}
