/**
 * Home.tsx — Bahia Arena landing page.
 *
 * Sections:
 *  1. Cinematic hero with animated title + battle preview
 *  2. DEMO BATTLE button (no wallet needed)
 *  3. Wallet connect + status
 *  4. Monthly prize pool stats
 *  5. Champion showcase (horizontal scroll with art)
 *  6. How it works
 */

import { useAccount, useReadContract } from "wagmi";
import { Link }                        from "react-router-dom";
import { formatUnits }                 from "viem";
import WalletConnect                   from "@/components/WalletConnect";
import { useMiniPay }                  from "@/hooks/useMiniPay";
import { ACTIVE_CONTRACTS, ARENA_ABI, ERC20_ABI } from "@/lib/contracts";
import { CHAMPIONS }                   from "@/lib/champions";
import { ChampionArt }                 from "@/components/ChampionArt";

// ─── Prize pool card ──────────────────────────────────────────────────────────

function PoolCard() {
  const { data: totalPool }  = useReadContract({ address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI, functionName: "totalPoolBalance",  query: { refetchInterval: 15_000 } });
  const { data: totalPrinc } = useReadContract({ address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI, functionName: "totalPrincipal",    query: { refetchInterval: 15_000 } });
  const { data: secsLeft }   = useReadContract({ address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI, functionName: "secondsToMonthEnd", query: { refetchInterval: 60_000 } });

  const pool    = totalPool  ? parseFloat(formatUnits(totalPool  as bigint, 18)).toFixed(2) : "—";
  const yield_  = totalPool && totalPrinc
    ? parseFloat(formatUnits((totalPool as bigint) - (totalPrinc as bigint), 18)).toFixed(3)
    : "—";
  const daysLeft = secsLeft ? Math.floor(Number(secsLeft as bigint) / 86400) : "—";

  return (
    <div className="mx-4 mb-4 rounded-2xl overflow-hidden border border-arena-border"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold text-arena-muted uppercase tracking-wider">Monthly Prize Pool</p>
          <span className="text-[10px] bg-arena-success/20 text-arena-success border border-arena-success/30 px-2 py-0.5 rounded-full font-semibold">
            Live on Celo
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[9px] text-arena-muted mb-0.5">Total Pool</p>
            <p className="text-sm font-bold text-white">{pool}</p>
            <p className="text-[9px] text-arena-muted">USDT</p>
          </div>
          <div>
            <p className="text-[9px] text-arena-muted mb-0.5">Yield</p>
            <p className="text-sm font-bold text-arena-primary">{yield_}</p>
            <p className="text-[9px] text-arena-muted">USDT</p>
          </div>
          <div>
            <p className="text-[9px] text-arena-muted mb-0.5">Closes In</p>
            <p className="text-sm font-bold text-white">{daysLeft}</p>
            <p className="text-[9px] text-arena-muted">days</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-2 bg-black/20 border-t border-white/5">
        <p className="text-[10px] text-arena-muted">
          Top 10 ranked players share <span className="text-arena-primary font-semibold">60% of yield</span> every month · Zero-loss model
        </p>
      </div>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { address, isConnected } = useAccount();
  const { isMiniPay }            = useMiniPay();

  const { data: deposit }  = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI,
    functionName: "deposits", args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const { data: usdtBal }  = useReadContract({
    address: ACTIVE_CONTRACTS.usdt, abi: ERC20_ABI,
    functionName: "balanceOf", args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const hasDeposit = !!deposit && (deposit as bigint) > 0n;
  const usdtFmt    = usdtBal
    ? parseFloat(formatUnits(usdtBal as bigint, 18)).toFixed(2)
    : "—";

  return (
    <div className="flex flex-col min-h-screen bg-arena-bg">

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Background gradient layers */}
        <div className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 20% 50%, #F6C90E18 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, #FF6B3518 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, #3FB95018 0%, transparent 50%)",
          }}/>

        {/* Decorative champion silhouettes */}
        <div className="absolute -left-6 top-8 opacity-20 pointer-events-none">
          <ChampionArt class_={0} size={90} animated={false}/>
        </div>
        <div className="absolute -right-6 top-8 opacity-20 pointer-events-none">
          <ChampionArt class_={4} size={90} animated={false}/>
        </div>

        <div className="relative flex flex-col items-center pt-12 pb-6 px-6 text-center">
          {/* Logo */}
          <div className="text-5xl mb-3 animate-float">🏟️</div>
          <h1 className="font-display text-arena-primary text-2xl leading-tight mb-3 drop-shadow-lg"
            style={{ textShadow: "0 0 30px rgba(246,201,14,0.4)" }}>
            BAHIA<br/>ARENA
          </h1>
          <p className="text-white/70 text-sm max-w-[260px] leading-relaxed mb-2">
            Card PvP battles with Brazilian folklore legends.
            <span className="text-arena-primary font-semibold"> Win USDT.</span>
          </p>

          {isMiniPay && (
            <div className="mt-1 px-3 py-1 rounded-full bg-arena-success/20 border border-arena-success/40 text-arena-success text-xs font-semibold">
              ✓ MiniPay Ready
            </div>
          )}

          {/* ── DEMO BATTLE — big CTA ── */}
          <Link
            to="/demo"
            className="
              mt-5 w-full max-w-xs py-4 rounded-2xl
              font-display text-sm tracking-widest
              bg-arena-primary text-arena-bg
              shadow-[0_0_40px_rgba(246,201,14,0.4)]
              active:scale-95 transition-all duration-200
              flex items-center justify-center gap-2
            "
          >
            🎮 DEMO BATTLE
          </Link>
          <p className="mt-2 text-[11px] text-white/40">No wallet required · Play instantly</p>
        </div>
      </div>

      {/* ── WALLET ────────────────────────────────────────────────────────────── */}
      <div className="px-4 mb-4">
        <WalletConnect/>
      </div>

      {/* ── STATUS CARD ────────────────────────────────────────────────────────── */}
      {isConnected && (
        <div className="mx-4 mb-4 rounded-2xl bg-arena-surface border border-arena-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-arena-muted uppercase tracking-wider mb-1">Your Account</p>
              <p className="text-lg font-bold text-arena-primary">{usdtFmt} <span className="text-sm text-arena-muted">USDT</span></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-arena-muted uppercase tracking-wider mb-1">Status</p>
              <span className={`text-sm font-bold ${hasDeposit ? "text-arena-success" : "text-arena-muted"}`}>
                {hasDeposit ? "✓ Active Player" : "Not Enrolled"}
              </span>
            </div>
          </div>

          {!hasDeposit && (
            <Link
              to="/roster"
              className="mt-3 block w-full py-2.5 rounded-xl bg-arena-primary/10 border border-arena-primary/30 text-arena-primary text-xs font-semibold text-center active:scale-95 transition-transform"
            >
              Deposit 1 USDT to Enter Arena →
            </Link>
          )}
          {hasDeposit && (
            <Link
              to="/arena"
              className="mt-3 block w-full py-2.5 rounded-xl bg-arena-primary text-arena-bg text-xs font-semibold text-center active:scale-95 transition-transform"
            >
              ⚔️ Go to Arena →
            </Link>
          )}
        </div>
      )}

      {/* ── PRIZE POOL ───────────────────────────────────────────────────────── */}
      <PoolCard/>

      {/* ── CHAMPION SHOWCASE ────────────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="flex items-center justify-between px-4 mb-3">
          <p className="text-xs text-arena-muted uppercase tracking-wider font-semibold">Champions</p>
          <Link to="/roster" className="text-[11px] text-arena-primary font-semibold">View All →</Link>
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-2 px-4 scrollbar-hide">
          {CHAMPIONS.map((c) => (
            <Link
              key={c.class}
              to="/roster"
              className={`
                shrink-0 flex flex-col items-center gap-2 w-[100px] py-4 px-3 rounded-2xl
                border bg-gradient-to-b ${c.color} ${c.borderColor}
                active:scale-95 transition-all duration-200
                hover:ring-1 hover:ring-white/20
              `}
            >
              <ChampionArt class_={c.class} size={58} animated={true}/>
              <div className="text-center">
                <p className="text-xs font-bold text-white leading-tight">{c.name}</p>
                <p className="text-[10px] text-white/60">{c.role}</p>
              </div>
              {/* Card count */}
              <div className="flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/30"/>)}
                <div className="w-1.5 h-1.5 rounded-full bg-arena-primary/80"/>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <div className="px-4 pb-10">
        <p className="text-xs text-arena-muted uppercase tracking-wider mb-3 font-semibold">How to Play</p>
        <div className="space-y-2">
          {[
            {
              n: "1", icon: "💰",
              title: "Deposit 1 USDT",
              desc: "Your USDT enters Aave V3 and earns yield. You get all 5 soulbound champions.",
              color: "from-yellow-900/40 to-yellow-800/20",
              border: "border-yellow-600/30",
            },
            {
              n: "2", icon: "🃏",
              title: "Card PvP Battles",
              desc: "Each champion has 4 cards — 3 basics and 1 powerful ultimate. Pick up to 2 per turn.",
              color: "from-blue-900/40 to-blue-800/20",
              border: "border-blue-600/30",
            },
            {
              n: "3", icon: "🏆",
              title: "Climb the Ranking",
              desc: "Win = +3 pts · Loss = +1 pt. Monthly top 10 split 60% of the yield pool.",
              color: "from-purple-900/40 to-purple-800/20",
              border: "border-purple-600/30",
            },
            {
              n: "4", icon: "💸",
              title: "Earn & Withdraw",
              desc: "Collect your USDT reward at month end. Your 1 USDT deposit is always refundable.",
              color: "from-green-900/40 to-green-800/20",
              border: "border-green-600/30",
            },
          ].map((step) => (
            <div key={step.n}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border bg-gradient-to-r ${step.color} ${step.border}`}>
              <div className="w-8 h-8 rounded-xl bg-white/10 font-display text-xs flex items-center justify-center shrink-0 text-white">
                {step.n}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white mb-0.5">{step.icon} {step.title}</p>
                <p className="text-[11px] text-white/60 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom demo repeat CTA */}
        <Link
          to="/demo"
          className="
            mt-5 block w-full py-4 rounded-2xl text-center
            bg-arena-surface border border-arena-primary/30
            text-arena-primary font-semibold text-sm
            active:scale-95 transition-transform
          "
        >
          🎮 Try Demo Battle — Free
        </Link>
      </div>
    </div>
  );
}
