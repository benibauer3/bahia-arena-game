/**
 * DepositGateSheet.tsx
 *
 * Bottom sheet exibido quando um usuário sem depósito tenta
 * entrar em partidas PvP ou desafios.
 *
 * Regra do jogo:
 *  • Navegar e explorar tudo → LIVRE
 *  • Jogar Demo vs IA        → LIVRE
 *  • PvP / batalhas reais    → exige depósito de 1 USDT
 */

import { Link } from "react-router-dom";

interface Props {
  onClose: () => void;
}

export default function DepositGateSheet({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-end backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full bg-arena-surface rounded-t-3xl p-6 pb-10 max-w-md mx-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-arena-border rounded-full mx-auto mb-6" />

        {/* Lock icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-arena-primary/10 border border-arena-primary/30 flex items-center justify-center">
            <span className="text-3xl">🔒</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-center text-lg font-bold text-white mb-1">
          Deposit required
        </h2>
        <p className="text-center text-xs text-arena-muted mb-6">
          Deposit 1 USDT to enter the arena — earns automatic yield
        </p>

        {/* Benefits */}
        <div className="space-y-3 mb-6">
          {[
            {
              icon: "🏦",
              title: "Earns automatic yield",
              desc: "Your 1 USDT goes straight to Aave V3 and earns yield while you play",
            },
            {
              icon: "🏆",
              title: "Compete in the monthly ranking",
              desc: "Top 10 players share the accumulated yield every 30th, sent to your wallet",
            },
            {
              icon: "⚔️",
              title: "Unlimited PvP",
              desc: "Play as many battles as you want — no cost per match",
            },
            {
              icon: "🔓",
              title: "Withdraw anytime",
              desc: "Your principal (1 USDT) can be withdrawn anytime",
            },
          ].map(item => (
            <div
              key={item.title}
              className="flex items-start gap-3 p-3 rounded-xl bg-arena-bg/60 border border-arena-border"
            >
              <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-arena-muted mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          to="/play"
          onClick={onClose}
          className="block w-full py-4 rounded-2xl bg-arena-primary text-arena-bg font-bold text-center text-base active:scale-95 transition-transform"
          style={{ boxShadow: "0 4px 20px rgba(246,201,14,0.30)" }}
        >
          ⚔️ Deposit & Play
        </Link>

        <p className="text-center text-xs text-arena-muted mt-4">
          Your principal (1 USDT) can be withdrawn anytime
        </p>
      </div>
    </div>
  );
}
