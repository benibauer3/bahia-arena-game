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
          Depósito necessário
        </h2>
        <p className="text-center text-xs text-arena-muted mb-6">
          Para jogar PvP, deposite 1 USDT na arena pool
        </p>

        {/* Benefits */}
        <div className="space-y-3 mb-6">
          {[
            {
              icon: "🏦",
              title: "Rende yield automático",
              desc: "Seu 1 USDT vai direto para a Aave V3 e fica rendendo enquanto você joga",
            },
            {
              icon: "🏆",
              title: "Compita no ranking mensal",
              desc: "Top 10 recebe parte do yield acumulado todo dia 30, direto na sua wallet",
            },
            {
              icon: "⚔️",
              title: "PvP ilimitado",
              desc: "Jogue quantas batalhas quiser — sem custo por partida",
            },
            {
              icon: "🔓",
              title: "Saque quando quiser",
              desc: "Seu principal (1 USDT) pode ser retirado a qualquer momento",
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
          to="/roster"
          onClick={onClose}
          className="block w-full py-4 rounded-2xl bg-arena-primary text-arena-bg font-bold text-center text-base active:scale-95 transition-transform"
          style={{ boxShadow: "0 4px 20px rgba(246,201,14,0.30)" }}
        >
          💰 Depositar 1 USDT
        </Link>

        {/* Demo free option */}
        <p className="text-center text-xs text-arena-muted mt-4">
          Quer testar antes?{" "}
          <Link to="/demo" onClick={onClose} className="text-arena-primary font-semibold">
            Jogar Demo grátis →
          </Link>
        </p>
      </div>
    </div>
  );
}
