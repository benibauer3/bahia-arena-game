import { useAccount, useReadContract } from "wagmi";
import { Link } from "react-router-dom";
import { formatUnits } from "viem";
import WalletConnect from "@/components/WalletConnect";
import { useMiniPay } from "@/hooks/useMiniPay";
import { ACTIVE_CONTRACTS, ARENA_ABI, ERC20_ABI } from "@/lib/contracts";
import { CHAMPIONS } from "@/lib/champions";
import { ChampionArt } from "@/components/ChampionArt";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { isMiniPay }            = useMiniPay();

  const { data: deposit } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI,
    functionName: "deposits", args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const { data: usdtBal } = useReadContract({
    address: ACTIVE_CONTRACTS.usdt, abi: ERC20_ABI,
    functionName: "balanceOf", args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const hasDeposit  = deposit && (deposit as bigint) > 0n;
  const usdtFmt     = usdtBal ? parseFloat(formatUnits(usdtBal as bigint, 18)).toFixed(2) : "—";

  return (
    <div className="flex flex-col min-h-screen bg-arena-bg">
      {/* Hero */}
      <div
        className="relative flex flex-col items-center justify-center pt-14 pb-6 px-6 text-center"
        style={{ background: "radial-gradient(ellipse at 50% 0%, #F6C90E22 0%, transparent 70%)" }}
      >
        <div className="text-6xl mb-3 animate-float">🏟️</div>
        <h1 className="font-display text-arena-primary text-xl leading-tight mb-2">
          BAHIA<br />ARENA
        </h1>
        <p className="text-arena-muted text-sm max-w-xs">
          Turn-based NFT battles with Brazilian folklore legends. Win USDT. Be the champion.
        </p>
        {isMiniPay && (
          <div className="mt-3 px-3 py-1 rounded-full bg-arena-success/20 border border-arena-success/40 text-arena-success text-xs">
            ✓ Running on MiniPay
          </div>
        )}
      </div>

      {/* Wallet */}
      <div className="px-4 mb-4">
        <WalletConnect />
      </div>

      {isConnected && (
        <div className="mx-4 mb-4 rounded-xl bg-arena-surface border border-arena-border p-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-arena-muted">USDT Balance</span>
            <span className="text-sm font-bold text-arena-primary">{usdtFmt} USDT</span>
          </div>
          <div className="w-px h-8 bg-arena-border" />
          <div className="flex flex-col items-center">
            <span className="text-xs text-arena-muted">Status</span>
            <span className={`text-sm font-bold ${hasDeposit ? "text-arena-success" : "text-arena-muted"}`}>
              {hasDeposit ? "✓ Active" : "Inactive"}
            </span>
          </div>
          <div className="w-px h-8 bg-arena-border" />
          <div className="flex flex-col items-end">
            <span className="text-xs text-arena-muted">Champions</span>
            <span className="text-sm font-bold">{hasDeposit ? "5 / 5" : "0 / 5"}</span>
          </div>
        </div>
      )}

      {/* Quick actions */}
      {isConnected && (
        <div className="px-4 grid grid-cols-2 gap-3 mb-5">
          <Link to="/arena" className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-arena-surface border border-arena-border active:scale-95 transition-transform">
            <span className="text-3xl">⚔️</span>
            <span className="text-sm font-semibold">Arena</span>
            <span className="text-xs text-arena-muted text-center">Open battles</span>
          </Link>
          <Link to="/roster" className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-arena-surface border border-arena-border active:scale-95 transition-transform">
            <span className="text-3xl">🐉</span>
            <span className="text-sm font-semibold">Champions</span>
            <span className="text-xs text-arena-muted text-center">5 legends of Brazil</span>
          </Link>
        </div>
      )}

      {/* Champions horizontal scroll */}
      <div className="px-4 mb-5">
        <p className="text-xs text-arena-muted uppercase tracking-wider mb-3 font-semibold">Champions</p>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {CHAMPIONS.map((c) => (
            <Link
              key={c.class}
              to="/roster"
              className={`
                shrink-0 flex flex-col items-center gap-2 w-[88px] p-3 rounded-2xl
                border bg-gradient-to-b ${c.color} ${c.borderColor}
                active:scale-95 transition-transform
              `}
            >
              <ChampionArt class_={c.class} size={52} animated={true} />
              <span className="text-xs font-semibold text-center leading-tight">{c.name}</span>
              <span className="text-xs text-arena-muted">{c.role}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* How to play */}
      <div className="px-4 pb-8">
        <p className="text-xs text-arena-muted uppercase tracking-wider mb-3 font-semibold">How to Play</p>
        {[
          { n: "1", t: "Deposit 1 USDT",       d: "Receive all 5 soulbound champions",     icon: "💰" },
          { n: "2", t: "Choose your champion",  d: "Curupira, Iara, Boitatá, Anhangá or Tupã", icon: "🐉" },
          { n: "3", t: "Battle & win",          d: "Instant USDT payout to your wallet",    icon: "⚔️" },
        ].map((step) => (
          <div key={step.n} className="flex items-start gap-3 p-3 rounded-xl bg-arena-surface border border-arena-border mb-2">
            <div className="w-7 h-7 rounded-full bg-arena-primary text-arena-bg font-display text-xs flex items-center justify-center shrink-0">
              {step.n}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{step.icon} {step.t}</p>
              <p className="text-xs text-arena-muted">{step.d}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
