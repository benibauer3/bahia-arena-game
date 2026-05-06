/**
 * PulseRewards.tsx — Daily UBI dashboard powered by GoodDollar.
 *
 * Sections:
 *  • G$ Balance card        — current token balance
 *  • Daily UBI claim card   — claim button OR countdown to next period
 *  • Identity status card   — humanity verification prompt
 *  • Info footer            — about GoodDollar
 *
 * Design: mobile-first, MiniPay aesthetic, dark theme with green (#4ade80) accents.
 * Privacy: never requests verification/facial data — only a link to gooddollar.org.
 */

import { useState, useEffect, useCallback, Component } from "react";
import type { ReactNode }                    from "react";
import { useAccount, useReadContract }       from "wagmi";
import { useGoodDollarPulse }                from "@/hooks/useGoodDollarPulse";
import WalletConnect                         from "@/components/WalletConnect";
import { GD_VERIFY_URL, GD_CONTRACTS, GD_IDENTITY_ABI } from "@/lib/gooddollar";
import BahiaArenaLogo                        from "@/components/BahiaArenaLogo";

// ─── Countdown helper ─────────────────────────────────────────────────────────

function useCountdown(target: Date | null): string {
  const [label, setLabel] = useState("");

  const compute = useCallback(() => {
    if (!target) { setLabel(""); return; }
    const diff = target.getTime() - Date.now();
    if (diff <= 0) { setLabel("Ready!"); return; }
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    setLabel(
      h > 0
        ? `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
        : `${m}m ${String(s).padStart(2, "0")}s`,
    );
  }, [target]);

  useEffect(() => {
    compute();
    const id = setInterval(compute, 1_000);
    return () => clearInterval(id);
  }, [compute]);

  return label;
}

// ─── Section card wrapper ─────────────────────────────────────────────────────

function Card({
  children,
  glow,
}: {
  children: React.ReactNode;
  glow?: boolean;
}) {
  return (
    <div
      className={`
        rounded-2xl border border-arena-border bg-arena-surface/70
        backdrop-blur-sm overflow-hidden
        ${glow ? "shadow-[0_0_24px_rgba(74,222,128,0.12)] border-green-500/30" : ""}
      `}
    >
      {children}
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-lg bg-white/5 animate-pulse ${className}`} />
  );
}

// ─── G$ Balance Card ──────────────────────────────────────────────────────────

function BalanceCard({
  gBalance,
  gBalanceUsd,
  isLoading,
}: {
  gBalance: string;
  gBalanceUsd: string;
  isLoading: boolean;
}) {
  return (
    <Card>
      <div className="px-4 py-3 border-b border-arena-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">💚</span>
          <span className="text-xs font-semibold text-arena-muted uppercase tracking-wider">
            G$ Balance
          </span>
        </div>
        <span className="text-[10px] text-arena-muted font-mono">Celo Network</span>
      </div>
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : (
          <>
            <p className="text-3xl font-bold text-green-400 tabular-nums leading-none">
              {gBalance}
              <span className="ml-1.5 text-base font-semibold text-green-400/60">G$</span>
            </p>
            <p className="mt-1 text-xs text-arena-muted">{gBalanceUsd}</p>
          </>
        )}
      </div>
    </Card>
  );
}

// ─── Daily UBI Claim Card ─────────────────────────────────────────────────────

function UBIClaimCard({
  isLoading,
  canClaim,
  claimableFormatted,
  nextClaimAt,
  isWhitelisted,
  isClaiming,
  claimSuccess,
  claimError,
  isWrongChain,
  onClaim,
}: {
  isLoading:          boolean;
  canClaim:           boolean;
  claimableFormatted: string;
  nextClaimAt:        Date | null;
  isWhitelisted:      boolean;
  isClaiming:         boolean;
  claimSuccess:       boolean;
  claimError:         string | null;
  isWrongChain:       boolean;
  onClaim:            () => void;
}) {
  const countdown = useCountdown(nextClaimAt);
  const [justClaimed, setJustClaimed] = useState(false);

  useEffect(() => {
    if (claimSuccess) {
      setJustClaimed(true);
      const t = setTimeout(() => setJustClaimed(false), 4_000);
      return () => clearTimeout(t);
    }
  }, [claimSuccess]);

  const statusBadge = canClaim
    ? <span className="text-[10px] font-bold text-green-400 bg-green-400/10 rounded-full px-2 py-0.5">READY</span>
    : isWhitelisted
      ? <span className="text-[10px] font-bold text-emerald-600 bg-emerald-900/20 rounded-full px-2 py-0.5">CLAIMED ✓</span>
      : <span className="text-[10px] font-bold text-arena-muted bg-white/5 rounded-full px-2 py-0.5">LOCKED</span>;

  return (
    <Card glow={canClaim && !isClaiming}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-arena-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">⚡</span>
          <span className="text-xs font-semibold text-arena-muted uppercase tracking-wider">
            Daily UBI
          </span>
        </div>
        {!isLoading && statusBadge}
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !isWhitelisted ? (
          <p className="text-xs text-arena-muted leading-relaxed">
            Verify your humanity on GoodDollar to start receiving daily UBI.
          </p>
        ) : justClaimed ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center gap-2 py-2">
            <span className="text-3xl">🎉</span>
            <p className="text-sm font-semibold text-green-400">UBI claimed!</p>
            <p className="text-xs text-arena-muted">
              Next claim available tomorrow.
            </p>
          </div>
        ) : canClaim ? (
          /* ── Ready to claim ── */
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-arena-muted">Available now</span>
              <span className="text-sm font-bold text-green-400">{claimableFormatted}</span>
            </div>

            {isWrongChain ? (
              <p className="text-[11px] text-yellow-400 text-center">
                ⚠️ Switch to the Celo network to claim
              </p>
            ) : (
              <button
                onClick={onClaim}
                disabled={isClaiming}
                className={`
                  w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95
                  ${isClaiming
                    ? "bg-green-500/30 text-green-400/50 cursor-not-allowed"
                    : "bg-green-500 text-black hover:bg-green-400 shadow-[0_0_20px_rgba(74,222,128,0.35)]"
                  }
                `}
              >
                {isClaiming ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 10" />
                    </svg>
                    Confirming…
                  </span>
                ) : (
                  "⚡ Claim UBI"
                )}
              </button>
            )}
          </>
        ) : (
          /* ── Already claimed — countdown ── */
          <div className="space-y-2">
            <p className="text-xs text-arena-muted">Next claim in</p>
            <p className="text-2xl font-mono font-bold text-white tabular-nums">
              {countdown || "…"}
            </p>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500/50 transition-all duration-1000"
                style={{
                  width: nextClaimAt
                    ? `${Math.max(0, 100 - ((nextClaimAt.getTime() - Date.now()) / 86_400_000) * 100)}%`
                    : "0%",
                }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {claimError && (
          <p className="text-[10px] text-red-400 leading-tight">{claimError}</p>
        )}
      </div>
    </Card>
  );
}

// ─── Identity Status Card ─────────────────────────────────────────────────────

function IdentityCard({
  isLoading,
  isWhitelisted,
}: {
  isLoading:    boolean;
  isWhitelisted: boolean;
}) {
  return (
    <Card>
      {/* Header */}
      <div className="px-4 py-3 border-b border-arena-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🌐</span>
          <span className="text-xs font-semibold text-arena-muted uppercase tracking-wider">
            Identity
          </span>
        </div>
        {!isLoading && (
          isWhitelisted ? (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold text-green-400">VERIFIED</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-arena-muted" />
              <span className="text-[10px] font-bold text-arena-muted">NOT VERIFIED</span>
            </div>
          )
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : isWhitelisted ? (
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">✅</span>
            <div>
              <p className="text-sm font-semibold text-white">Verified human</p>
              <p className="text-xs text-arena-muted mt-0.5">
                Your social rank is active in the Celo ecosystem.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🔒</span>
              <div>
                <p className="text-sm font-semibold text-white">Not verified</p>
                <p className="text-xs text-arena-muted mt-0.5 leading-relaxed">
                  Verify your humanity to unlock daily UBI and
                  boost your social rank.
                </p>
              </div>
            </div>
            <a
              href={GD_VERIFY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex items-center justify-center gap-2
                w-full py-2.5 rounded-xl border border-green-500/40
                text-xs font-semibold text-green-400
                hover:bg-green-500/10 transition-colors active:scale-95
              "
            >
              <span>Verify humanity</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

function StatsRow({ claimSuccess }: { claimSuccess: boolean }) {
  const [totalClaims, setTotalClaims] = useState(() => {
    return parseInt(localStorage.getItem("gd-claims") ?? "0", 10);
  });

  useEffect(() => {
    if (claimSuccess) {
      setTotalClaims((n) => {
        const next = n + 1;
        localStorage.setItem("gd-claims", String(next));
        return next;
      });
    }
  }, [claimSuccess]);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-arena-surface/50 border border-arena-border px-3 py-2.5 text-center">
        <p className="text-lg font-bold text-arena-primary">{totalClaims}</p>
        <p className="text-[10px] text-arena-muted">Claims in app</p>
      </div>
      <div className="rounded-xl bg-arena-surface/50 border border-arena-border px-3 py-2.5 text-center">
        <p className="text-lg font-bold text-green-400">G$</p>
        <p className="text-[10px] text-arena-muted">GoodDollar · Celo</p>
      </div>
    </div>
  );
}

// ─── Local error boundary (catches hook crashes in RewardsContent) ────────────

class RewardsErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <Card>
          <div className="px-4 py-6 flex flex-col items-center gap-3 text-center">
            <span className="text-3xl">⚠️</span>
            <p className="text-sm font-semibold text-white">Could not load rewards data.</p>
            <p className="text-[11px] text-arena-muted leading-relaxed">
              Check your connection and make sure you are on the Celo network.
            </p>
            <button
              onClick={() => this.setState({ error: null })}
              className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold"
            >
              Try again
            </button>
          </div>
        </Card>
      );
    }
    return this.props.children;
  }
}

// ─── Connected rewards body (all hook calls live here) ────────────────────────

function RewardsContent({ isConnected }: { isConnected: boolean }) {
  const pulse = useGoodDollarPulse();

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <Card>
          <div className="px-4 py-6 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <span className="text-2xl">💚</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Connect your wallet
              </p>
              <p className="text-xs text-arena-muted mt-1 leading-relaxed">
                Access your daily GoodDollar UBI and view your G$ balance.
              </p>
            </div>
            <div className="w-full pt-1">
              <WalletConnect />
            </div>
          </div>
        </Card>

        {/* Teaser cards */}
        <div className="grid grid-cols-2 gap-3 opacity-40 pointer-events-none select-none">
          <div className="rounded-xl bg-arena-surface/50 border border-arena-border px-3 py-3">
            <p className="text-[10px] text-arena-muted mb-1">G$ Balance</p>
            <p className="text-lg font-bold text-green-400">— G$</p>
          </div>
          <div className="rounded-xl bg-arena-surface/50 border border-arena-border px-3 py-3">
            <p className="text-[10px] text-arena-muted mb-1">Daily UBI</p>
            <p className="text-lg font-bold text-white">⚡ —</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <BalanceCard
        gBalance={pulse.gBalance}
        gBalanceUsd={pulse.gBalanceUsd}
        isLoading={pulse.isLoading}
      />
      <UBIClaimCard
        isLoading={pulse.isLoading}
        canClaim={pulse.canClaim}
        claimableFormatted={pulse.claimableFormatted}
        nextClaimAt={pulse.nextClaimAt}
        isWhitelisted={pulse.isWhitelisted}
        isClaiming={pulse.isClaiming}
        claimSuccess={pulse.claimSuccess}
        claimError={pulse.claimError}
        isWrongChain={pulse.isWrongChain}
        onClaim={pulse.claim}
      />
      <StatsRow claimSuccess={pulse.claimSuccess} />
      <IdentityCard
        isLoading={pulse.isLoading}
        isWhitelisted={pulse.isWhitelisted}
      />
    </div>
  );
}

// ─── Daily G$ Claim Card ──────────────────────────────────────────────────────
//
// This section is OPTIONAL and separate from the main game.
// It checks GoodDollar's IdentityV2 contract to see if the wallet is
// verified, then redirects to wallet.gooddollar.org for the actual claim
// (we do NOT execute on-chain transactions from this UI).

function DailyGDollarCard({ address }: { address?: `0x${string}` }) {
  const { data: isWhitelisted, isLoading } = useReadContract({
    address:      GD_CONTRACTS.identity,
    abi:          GD_IDENTITY_ABI,
    functionName: "isWhitelisted",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address },
  });

  return (
    <Card>
      {/* Header */}
      <div className="px-4 py-3 border-b border-arena-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🪙</span>
          <span className="text-xs font-semibold text-arena-muted uppercase tracking-wider">
            Daily G$ Claim
          </span>
        </div>
        <span className="text-[9px] text-arena-muted bg-white/5 rounded-full px-2 py-0.5 font-medium">
          OPTIONAL
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-3">
        {!address ? (
          /* ── Not connected ── */
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">💚</span>
            <div>
              <p className="text-sm font-semibold text-white">Connect wallet</p>
              <p className="text-xs text-arena-muted mt-0.5 leading-relaxed">
                Connect your wallet to check your GoodDollar daily claim status.
              </p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isWhitelisted ? (
          /* ── Whitelisted: show claim button that opens external wallet ── */
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">✅</span>
              <div>
                <p className="text-sm font-semibold text-white">You are verified!</p>
                <p className="text-xs text-arena-muted mt-0.5 leading-relaxed">
                  Your wallet is whitelisted on GoodDollar. Claim your daily G$ in the official wallet.
                </p>
              </div>
            </div>
            <a
              href="https://wallet.gooddollar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex items-center justify-center gap-2
                w-full py-3 rounded-xl font-bold text-sm tracking-wide
                bg-green-500 text-black
                hover:bg-green-400 active:scale-95 transition-all
                shadow-[0_0_20px_rgba(74,222,128,0.35)]
              "
            >
              ⚡ Claim G$ on GoodDollar
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        ) : (
          /* ── Not whitelisted: prompt to verify ── */
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🔒</span>
              <div>
                <p className="text-sm font-semibold text-white">Not verified yet</p>
                <p className="text-xs text-arena-muted mt-0.5 leading-relaxed">
                  Verify your humanity on GoodDollar to start receiving free G$ every day.
                </p>
              </div>
            </div>
            <a
              href="https://gooddollar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex items-center justify-center gap-2
                w-full py-2.5 rounded-xl border border-green-500/40
                text-xs font-semibold text-green-400
                hover:bg-green-500/10 transition-colors active:scale-95
              "
            >
              Verify on GoodDollar →
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[9px] text-arena-muted/50 leading-relaxed border-t border-arena-border pt-2">
          G$ claims are processed by GoodDollar, not by Bahia Arena. This is entirely optional and unrelated to the game.
        </p>
      </div>
    </Card>
  );
}

// ─── Page shell — header + error-bounded body + footer always render ──────────

export default function PulseRewards() {
  const { isConnected, address } = useAccount();

  return (
    <div className="bg-arena-bg px-4 pt-4 pb-24 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BahiaArenaLogo size={44} showWordmark={false} />
          <div>
            <h1 className="text-sm font-display font-bold text-white tracking-tight">
              Rewards
            </h1>
            <p className="text-[10px] text-arena-muted">
              Daily UBI · GoodDollar · Celo
            </p>
          </div>
        </div>
      </div>

      {/* ── Body (error-isolated) ── */}
      <RewardsErrorBoundary>
        <RewardsContent isConnected={isConnected} />
      </RewardsErrorBoundary>

      {/* ── Daily G$ Claim (optional, always visible) ── */}
      <DailyGDollarCard address={address} />

      {/* ── About GoodDollar footer — always visible ── */}
      <div className="rounded-xl bg-arena-surface/30 border border-arena-border/50 px-4 py-3 space-y-1.5">
        <p className="text-[11px] font-semibold text-arena-muted uppercase tracking-wider">
          About GoodDollar
        </p>
        <p className="text-[11px] text-arena-muted leading-relaxed">
          GoodDollar is a blockchain-based Universal Basic Income (UBI) protocol.
          Every day, verified humans receive free G$ on the Celo network.
        </p>
        <a
          href="https://www.gooddollar.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-green-400/70 hover:text-green-400 transition-colors"
        >
          gooddollar.org
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

    </div>
  );
}
