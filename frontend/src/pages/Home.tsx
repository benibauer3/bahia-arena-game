/**
 * Home.tsx — Landing page MVP
 *
 * Layout (top → bottom, sempre visível):
 *  1. Header compacto
 *  2. DEMO BATTLE — botão gigante, primeiro elemento de destaque
 *  3. Grade de campeões (2 colunas) — arte SVG + arena de fundo
 *  4. Wallet connect + status
 *  5. Como funciona
 */

import { useAccount, useReadContract } from "wagmi";
import { Link }                        from "react-router-dom";
import { formatUnits }                 from "viem";
import WalletConnect                   from "@/components/WalletConnect";
import { ACTIVE_CONTRACTS, ARENA_ABI, ERC20_ABI } from "@/lib/contracts";
import { CHAMPIONS, ChampionClass }    from "@/lib/champions";
import { ChampionArt }                 from "@/components/ChampionArt";
import { BattleArenaBackground }       from "@/components/BattleArena";
import BahiaArenaLogo                  from "@/components/BahiaArenaLogo";
import { useViewMode }                 from "@/lib/viewModeContext";

// ─── Champion card com arena de fundo ─────────────────────────────────────────

function ChampionArenaCard({ cls }: { cls: ChampionClass }) {
  const c = CHAMPIONS[cls];
  return (
    <Link
      to="/demo"
      className="relative overflow-hidden rounded-2xl border border-white/10 active:scale-95 transition-transform block"
      style={{ height: 160 }}
    >
      {/* Arena de fundo */}
      <BattleArenaBackground classA={cls} />

      {/* Overlay escuro para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Arte do campeão centralizada */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pt-2">
        <ChampionArt class_={cls} size={72} animated={true} />
      </div>

      {/* Nome + função na base */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
        <p className="text-white text-xs font-bold leading-tight">{c.name}</p>
        <p className="text-white/60 text-[10px]">{c.role}</p>
      </div>

      {/* Badge de cartas */}
      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5">
        <span className="text-[9px] text-arena-primary font-bold">4 cards</span>
      </div>

      {/* Borda colorida do campeão */}
      <div className={`absolute inset-0 rounded-2xl border-2 ${c.borderColor} pointer-events-none`} />
    </Link>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const viewMode                  = useViewMode();
  const { address, isConnected } = useAccount();

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
  const { data: totalPool } = useReadContract({
    address: ACTIVE_CONTRACTS.ArenaManager, abi: ARENA_ABI,
    functionName: "totalDeposits", query: { refetchInterval: 15_000 },
  });

  const hasDeposit = !!deposit && (deposit as bigint) > 0n;
  const usdtFmt   = usdtBal   ? parseFloat(formatUnits(usdtBal   as bigint, 6)).toFixed(2) : "—";
  const poolFmt   = totalPool ? parseFloat(formatUnits(totalPool as bigint, 6)).toFixed(2) : "—";

  return (
    <div className="flex flex-col bg-arena-bg min-h-screen pb-20">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end px-4 pt-4 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-arena-success animate-pulse" />
          <span className="text-[10px] text-arena-muted">Celo</span>
        </div>
      </div>

      {/* ── LOGO HERO — only in mobile mode (sidebar already shows logo in desktop) ── */}
      {viewMode === "mobile" && (
        <div className="flex justify-center py-3">
          <BahiaArenaLogo size={148} showWordmark={true} />
        </div>
      )}

      {/* ── DEMO BATTLE ─────────────────────────────────────────────────────── */}
      <div className="px-4 mb-5">
        <Link
          to="/demo"
          className="block w-full rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
          style={{
            background: "linear-gradient(135deg, #F6C90E 0%, #FF6B35 100%)",
            boxShadow: "0 8px 32px rgba(246,201,14,0.35)",
          }}
        >
          <div className="relative px-5 py-5">
            {/* Texto principal */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-arena-bg font-bold text-xl leading-tight">🎮 DEMO BATTLE</p>
                <p className="text-arena-bg/70 text-xs mt-0.5 font-medium">Play now — no wallet needed</p>
              </div>
              <div className="text-4xl animate-float">⚔️</div>
            </div>

            {/* Mini prévia dos 5 campeões */}
            <div className="flex items-center gap-1.5 mt-3">
              {CHAMPIONS.map(c => (
                <div
                  key={c.class}
                  className="flex-1 flex items-center justify-center bg-black/20 rounded-xl py-1.5"
                >
                  <ChampionArt class_={c.class} size={32} animated={false} />
                </div>
              ))}
            </div>
            <p className="text-arena-bg/60 text-[10px] mt-2 text-center">5 champions · 4 cards each · AI opponent</p>
          </div>
        </Link>
      </div>

      {/* ── CAMPEÕES + ARENAS ───────────────────────────────────────────────── */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-white uppercase tracking-wider">Champions & Arenas</p>
          <Link to="/roster" className="text-[11px] text-arena-primary font-semibold">View all →</Link>
        </div>

        {/* Grade 2 colunas */}
        <div className="grid grid-cols-2 gap-2.5">
          {CHAMPIONS.map(c => (
            <ChampionArenaCard key={c.class} cls={c.class} />
          ))}
          {/* Card de bônus — "Entrar na Arena Real" */}
          <Link
            to="/arena"
            className="relative overflow-hidden rounded-2xl border border-arena-primary/40 active:scale-95 transition-transform flex flex-col items-center justify-center gap-2 bg-arena-surface"
            style={{ height: 160 }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{ background: "radial-gradient(ellipse at 50% 50%, #F6C90E 0%, transparent 70%)" }}
            />
            <span className="text-4xl relative">⚔️</span>
            <div className="relative text-center px-3">
              <p className="text-arena-primary text-xs font-bold">PvP Arena</p>
              <p className="text-white/50 text-[10px] mt-0.5">On-chain battles</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ── WALLET CONNECT ──────────────────────────────────────────────────── */}
      <div className="px-4 mb-4">
        <WalletConnect />
      </div>

      {/* ── STATUS (só quando conectado) ────────────────────────────────────── */}
      {isConnected && (
        <div className="mx-4 mb-4 rounded-2xl bg-arena-surface border border-arena-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-arena-muted uppercase tracking-wider">Balance</p>
              <p className="text-lg font-bold text-arena-primary tabular-nums">
                {usdtFmt} <span className="text-sm text-arena-muted font-normal">USDT</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-arena-muted uppercase tracking-wider">Pool</p>
              <p className="text-lg font-bold text-white tabular-nums">
                {poolFmt} <span className="text-sm text-arena-muted font-normal">USDT</span>
              </p>
            </div>
          </div>

          {hasDeposit ? (
            <Link to="/arena"
              className="block w-full py-3 rounded-xl bg-arena-primary text-arena-bg text-sm font-bold text-center active:scale-95 transition-transform">
              ⚔️ Enter the Arena
            </Link>
          ) : (
            <Link to="/roster"
              className="block w-full py-3 rounded-xl bg-arena-primary/10 border border-arena-primary/40 text-arena-primary text-xs font-semibold text-center active:scale-95 transition-transform">
              Deposit 1 USDT to play →
            </Link>
          )}
        </div>
      )}

      {/* ── COMO FUNCIONA ───────────────────────────────────────────────────── */}
      <div className="px-4 pb-4">
        <p className="text-xs font-semibold text-white uppercase tracking-wider mb-3">How It Works</p>
        <div className="space-y-2">
          {[
            { n:"1", emoji:"🎮", title:"Play the Demo",        desc:"No wallet needed. Pick a champion and fight now.",         color:"bg-yellow-500" },
            { n:"2", emoji:"💰", title:"Deposit 1 USDT",       desc:"Deposited into Aave V3 to generate yield automatically.", color:"bg-green-500"  },
            { n:"3", emoji:"🃏", title:"Card Battles",         desc:"3 basic + 1 ultimate per champion. Up to 2 cards per turn.", color:"bg-blue-500" },
            { n:"4", emoji:"🏆", title:"Monthly Ranking",      desc:"Top 10 share 60% of yield. Withdraw anytime.",            color:"bg-purple-500" },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-3 p-3 rounded-xl bg-arena-surface border border-arena-border">
              <div className={`w-7 h-7 rounded-lg ${s.color} flex items-center justify-center shrink-0`}>
                <span className="text-xs font-bold text-white">{s.n}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{s.emoji} {s.title}</p>
                <p className="text-[11px] text-arena-muted mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA final de demo — redundância intencional */}
        <Link to="/demo"
          className="mt-4 flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-arena-primary text-arena-bg font-bold text-base active:scale-95 transition-transform"
          style={{ boxShadow: "0 4px 20px rgba(246,201,14,0.3)" }}
        >
          🎮 PLAY FREE DEMO
        </Link>
      </div>
    </div>
  );
}
