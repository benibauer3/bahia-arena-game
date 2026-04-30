import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { injected } from "@wagmi/connectors";
import { formatUnits } from "viem";
import { useMiniPay } from "@/hooks/useMiniPay";
import { useCUSDBalance } from "@/hooks/useBattle";

export default function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connect, isPending }          = useConnect();
  const { disconnect }                  = useDisconnect();
  const { isMiniPay }                   = useMiniPay();
  const { data: celoBalance }           = useBalance({ address });
  const { data: cusdBalance }           = useCUSDBalance();

  const shortAddr = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: injected() })}
        disabled={isPending}
        className="
          w-full px-5 py-3 rounded-xl font-body font-semibold text-sm
          bg-arena-primary text-arena-bg
          active:scale-95 transition-transform
          disabled:opacity-60
        "
      >
        {isPending
          ? "Conectando…"
          : isMiniPay
          ? "Conectar MiniPay"
          : "Conectar Carteira"}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-arena-surface border border-arena-border">
      <div className="flex flex-col">
        <span className="text-xs text-arena-muted">{chain?.name ?? "Celo"}</span>
        <span className="text-sm font-semibold text-white">{shortAddr}</span>
        <div className="flex gap-3 text-xs text-arena-muted mt-0.5">
          {celoBalance && (
            <span>{parseFloat(formatUnits(celoBalance.value, 18)).toFixed(2)} CELO</span>
          )}
          {cusdBalance !== undefined && (
            <span>{parseFloat(formatUnits(cusdBalance as bigint, 18)).toFixed(2)} cUSD</span>
          )}
        </div>
      </div>
      <button
        onClick={() => disconnect()}
        className="text-xs text-arena-danger px-2 py-1 rounded-lg hover:bg-arena-danger/10 transition-colors"
      >
        Sair
      </button>
    </div>
  );
}
