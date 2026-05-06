/**
 * useGoodDollarPulse.ts — GoodDollar UBI state manager for Bahia Arena.
 *
 * Responsibilities:
 *  • Reads G$ balance, whitelist status, and claimable amount from Celo mainnet.
 *  • Derives countdown to next claim period.
 *  • Executes claim() transaction through the connected wallet.
 *  • Fires refetch after a successful claim so UI updates automatically.
 *
 * Architecture notes:
 *  • Reads use a standalone viem publicClient pointed at Celo mainnet so they
 *    work even when the user's wallet is connected to Alfajores (testnet).
 *  • Writes use wagmi's useWriteContract with chainId:42220 so wagmi will
 *    automatically prompt a chain-switch if the user is on the wrong network.
 *  • All blockchain I/O is isolated here — the UI never touches contracts directly.
 */

import { useState, useCallback, useEffect, useRef }  from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from "wagmi";
import { createPublicClient, http, formatUnits } from "viem";
import {
  GD_CONTRACTS,
  GD_TOKEN_ABI,
  GD_IDENTITY_ABI,
  GD_UBI_ABI,
  GD_USD_RATE,
} from "@/lib/gooddollar";
import { celo } from "@/lib/wagmiConfig";

// Celo mainnet chain ID — used only for the wrong-chain guard
const CELO_CHAIN_ID = celo.id; // 42220

// ─── Viem public client — always Celo mainnet for reads ──────────────────────

const celoClient = createPublicClient({
  chain: celo,
  transport: http("https://forno.celo.org"),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoodDollarPulse {
  // ── Data
  gBalance:           string;        // e.g. "12.34"
  gBalanceUsd:        string;        // e.g. "≈ $0.01"
  claimableRaw:       bigint;        // 0n = already claimed / not whitelisted
  claimableFormatted: string;        // e.g. "0.05 G$"
  isWhitelisted:      boolean;
  nextClaimAt:        Date | null;   // null = not applicable
  decimals:           number;

  // ── Status
  isLoading:    boolean;
  isClaiming:   boolean;
  claimTxHash:  `0x${string}` | undefined;
  claimSuccess: boolean;
  claimError:   string | null;
  isWrongChain: boolean;

  // ── Derived
  canClaim:   boolean;               // whitelisted && claimableRaw > 0n
  hasWallet:  boolean;

  // ── Actions
  claim:   () => Promise<void>;
  refetch: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGoodDollarPulse(): GoodDollarPulse {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // ── Contract data state ───────────────────────────────────────────────────
  const [gBalance,      setGBalance]      = useState(0n);
  const [decimals,      setDecimals]      = useState(2);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [claimableRaw,  setClaimableRaw]  = useState(0n);
  const [periodStart,   setPeriodStart]   = useState(0n);
  const [isLoading,     setIsLoading]     = useState(false);
  const [claimError,    setClaimError]    = useState<string | null>(null);

  // ── Write contract ────────────────────────────────────────────────────────
  const {
    writeContractAsync,
    isPending: isClaiming,
    data:      claimTxHash,
    reset:     resetWrite,
  } = useWriteContract();

  const {
    isSuccess: claimSuccess,
    isError:   txError,
  } = useWaitForTransactionReceipt({ hash: claimTxHash });

  // ── Fetch all GoodDollar data ─────────────────────────────────────────────
  const fetchRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (!address || fetchRef.current) return;
    fetchRef.current = true;
    setIsLoading(true);
    setClaimError(null);

    // Timeout: if Celo RPC doesn't respond in 10 s, bail out gracefully
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("RPC timeout")), 10_000),
    );

    try {
      const [rawBalance, rawDecimals, whitelisted, entitlement, start] =
        await Promise.race([
          Promise.all([
            celoClient.readContract({
              address: GD_CONTRACTS.token,
              abi:     GD_TOKEN_ABI,
              functionName: "balanceOf",
              args: [address],
            }),
            celoClient.readContract({
              address: GD_CONTRACTS.token,
              abi:     GD_TOKEN_ABI,
              functionName: "decimals",
            }),
            celoClient.readContract({
              address: GD_CONTRACTS.identity,
              abi:     GD_IDENTITY_ABI,
              functionName: "isWhitelisted",
              args: [address],
            }),
            celoClient.readContract({
              address: GD_CONTRACTS.ubiScheme,
              abi:     GD_UBI_ABI,
              functionName: "checkEntitlement",
              args: [address],
            }),
            celoClient.readContract({
              address: GD_CONTRACTS.ubiScheme,
              abi:     GD_UBI_ABI,
              functionName: "periodStart",
            }),
          ]),
          timeout,
        ]);

      setGBalance(rawBalance as bigint);
      setDecimals(rawDecimals as number);
      setIsWhitelisted(whitelisted as boolean);
      setClaimableRaw(entitlement as bigint);
      setPeriodStart(start as bigint);
    } catch (err) {
      console.warn("[useGoodDollarPulse] read error:", err);
      // Silently fail — UI will show zeros / unverified state
    } finally {
      setIsLoading(false);
      fetchRef.current = false;
    }
  }, [address]);

  // Initial fetch + refetch on address change
  useEffect(() => {
    if (address) fetchData();
  }, [address, fetchData]);

  // Refetch after successful claim
  useEffect(() => {
    if (claimSuccess) {
      const t = setTimeout(() => fetchData(), 1_500);
      return () => clearTimeout(t);
    }
  }, [claimSuccess, fetchData]);

  // ── Claim action ──────────────────────────────────────────────────────────
  const claim = useCallback(async () => {
    if (!address || !isWhitelisted || claimableRaw === 0n) return;
    setClaimError(null);
    resetWrite();

    try {
      await writeContractAsync({
        address:      GD_CONTRACTS.ubiScheme,
        abi:          GD_UBI_ABI,
        functionName: "claim",
        // NOTE: claim() must be submitted on Celo mainnet (42220).
        // The isWrongChain guard in the UI prevents calling this on wrong network.
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message.slice(0, 120)
          : "Transaction rejected";
      setClaimError(msg);
    }
  }, [address, isWhitelisted, claimableRaw, resetWrite, writeContractAsync]);

  // ── Derived values ────────────────────────────────────────────────────────
  const dec = decimals;

  const gBalanceStr = Number(formatUnits(gBalance, dec)).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const gBalanceUsd = (() => {
    const n = Number(formatUnits(gBalance, dec));
    const usd = n * GD_USD_RATE;
    return usd < 0.01 ? "< $0.01" : `≈ $${usd.toFixed(2)}`;
  })();

  const claimableFormatted =
    claimableRaw > 0n
      ? `${Number(formatUnits(claimableRaw, dec)).toFixed(2)} G$`
      : "0.00 G$";

  // Next claim = periodStart + 24 h, but only relevant when whitelisted + already claimed
  const nextClaimAt: Date | null =
    isWhitelisted && claimableRaw === 0n && periodStart > 0n
      ? new Date((Number(periodStart) + 86_400) * 1_000)
      : null;

  const canClaim    = isWhitelisted && claimableRaw > 0n;
  const isWrongChain = isConnected && chainId !== CELO_CHAIN_ID;

  const composedClaimError =
    txError ? "Transaction failed. Check your CELO balance for gas." : claimError;

  return {
    gBalance:           gBalanceStr,
    gBalanceUsd,
    claimableRaw,
    claimableFormatted,
    isWhitelisted,
    nextClaimAt,
    decimals:           dec,
    isLoading,
    isClaiming,
    claimTxHash,
    claimSuccess,
    claimError:         composedClaimError,
    isWrongChain,
    canClaim,
    hasWallet:          isConnected,
    claim,
    refetch:            fetchData,
  };
}
