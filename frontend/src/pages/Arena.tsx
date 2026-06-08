/**
 * Arena.tsx — Classic on-chain PvP Arena
 * Coming soon on ArenaManager v7.
 */
import { Link } from "react-router-dom";

export default function Arena() {
  return (
    <div className="min-h-screen bg-arena-bg flex flex-col items-center justify-center px-6 text-center gap-6 pb-20">
      <div className="w-20 h-20 rounded-2xl bg-arena-primary/10 border border-arena-primary/30 flex items-center justify-center">
        <span className="text-4xl">🌐</span>
      </div>
      <div>
        <h1 className="text-white text-xl font-bold mb-2">On-Chain PvP Arena</h1>
        <p className="text-arena-muted text-sm max-w-xs">
          Real-time wallet-vs-wallet battles are coming in the next contract upgrade.
        </p>
      </div>
      <div className="w-full max-w-xs space-y-2 text-left">
        {[
          { icon: "⚔️", text: "Challenge any ranked player directly" },
          { icon: "🏆", text: "Results recorded permanently on Celo" },
          { icon: "💰", text: "Win streaks boost your monthly rewards" },
        ].map(b => (
          <div key={b.text} className="flex items-start gap-3 p-3 rounded-xl bg-arena-surface border border-arena-border">
            <span className="text-lg shrink-0">{b.icon}</span>
            <p className="text-xs text-arena-muted">{b.text}</p>
          </div>
        ))}
      </div>
      <Link
        to="/ranked"
        className="w-full max-w-xs py-3.5 rounded-2xl bg-arena-primary text-arena-bg font-bold text-sm text-center active:scale-95 transition-transform"
      >
        ⚔️ Play Ranked vs AI now
      </Link>
    </div>
  );
}
