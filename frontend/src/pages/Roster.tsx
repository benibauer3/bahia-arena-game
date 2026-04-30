import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Link } from "react-router-dom";
import { useOwnedTokenIds, useCreatureStats, useMintPrice, ELEMENT_NAMES } from "@/hooks/useCreatures";
import { ACTIVE_CONTRACTS, CREATURE_ABI, ERC20_ABI } from "@/lib/contracts";
import CreatureCard from "@/components/CreatureCard";

function CreatureItem({ tokenId }: { tokenId: bigint }) {
  const { data: stats } = useCreatureStats(tokenId);
  if (!stats) return <div className="h-40 rounded-2xl bg-arena-surface animate-pulse" />;
  return <CreatureCard tokenId={tokenId} stats={stats as any} />;
}

export default function Roster() {
  const { address, isConnected } = useAccount();
  const { data: tokenIds, refetch } = useOwnedTokenIds();
  const { data: mintPrice }         = useMintPrice();

  const [selectedEl, setSelectedEl]       = useState<number>(0);
  const [mintStatus, setMintStatus]       = useState<"idle"|"approving"|"minting"|"done"|"error">("idle");
  const [errMsg, setErrMsg]               = useState("");

  const approve   = useWriteContract();
  const mint      = useWriteContract();
  const approveRct = useWaitForTransactionReceipt({ hash: approve.data });
  const mintRct    = useWaitForTransactionReceipt({ hash: mint.data });

  const handleMint = async () => {
    if (!mintPrice) return;
    setMintStatus("approving");
    setErrMsg("");
    try {
      await approve.writeContractAsync({
        address:      ACTIVE_CONTRACTS.cUSD,
        abi:          ERC20_ABI,
        functionName: "approve",
        args:         [ACTIVE_CONTRACTS.BahiaArenaCreature, mintPrice as bigint],
      });
      setMintStatus("minting");
      await mint.writeContractAsync({
        address:      ACTIVE_CONTRACTS.BahiaArenaCreature,
        abi:          CREATURE_ABI,
        functionName: "mintCreature",
        args:         [selectedEl, "ipfs://QmPlaceholder"],
      });
      setMintStatus("done");
      refetch();
    } catch (e: any) {
      setErrMsg(e.shortMessage ?? e.message ?? "Erro desconhecido");
      setMintStatus("error");
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-4">
        <span className="text-5xl">🐉</span>
        <p className="text-arena-muted">Conecte sua carteira para ver suas criaturas.</p>
        <Link to="/" className="text-arena-primary underline text-sm">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-arena-bg px-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 pt-6 pb-4">
        <Link to="/" className="text-arena-muted text-xl">←</Link>
        <h1 className="font-display text-arena-primary text-sm">CRIATURAS</h1>
      </div>

      {/* Mint section */}
      <div className="rounded-2xl bg-arena-surface border border-arena-border p-4 mb-6">
        <p className="text-sm font-semibold mb-3">🥚 Adquirir Nova Criatura</p>

        {/* Element selector */}
        <div className="grid grid-cols-5 gap-2 mb-3">
          {ELEMENT_NAMES.map((name, i) => (
            <button
              key={i}
              onClick={() => setSelectedEl(i)}
              className={`
                flex flex-col items-center py-2 rounded-xl border text-xs
                transition-all active:scale-95
                ${selectedEl === i
                  ? "border-arena-primary bg-arena-primary/10 text-arena-primary"
                  : "border-arena-border text-arena-muted"}
              `}
            >
              <span className="text-lg mb-0.5">
                {["🔥","💧","🌍","🌀","⚡"][i]}
              </span>
              {name}
            </button>
          ))}
        </div>

        <button
          onClick={handleMint}
          disabled={mintStatus === "approving" || mintStatus === "minting"}
          className="
            w-full py-3 rounded-xl font-semibold text-sm
            bg-arena-primary text-arena-bg
            disabled:opacity-60 active:scale-95 transition-transform
          "
        >
          {mintStatus === "approving" ? "Aprovando cUSD…"
           : mintStatus === "minting" ? "Mintando…"
           : mintStatus === "done"    ? "✓ Mintado!"
           : `Mintar por ${mintPrice ? (Number(mintPrice) / 1e18).toFixed(1) : "?"} cUSD`}
        </button>

        {mintStatus === "error" && (
          <p className="mt-2 text-xs text-arena-danger text-center">{errMsg}</p>
        )}
      </div>

      {/* Owned creatures */}
      <p className="text-sm font-semibold mb-3">
        Suas criaturas {tokenIds ? `(${(tokenIds as bigint[]).length})` : ""}
      </p>

      {!tokenIds || (tokenIds as bigint[]).length === 0 ? (
        <div className="text-center py-12 text-arena-muted text-sm">
          Você ainda não tem criaturas.<br />Minte a sua primeira acima!
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {(tokenIds as bigint[]).map((id) => (
            <CreatureItem key={id.toString()} tokenId={id} />
          ))}
        </div>
      )}
    </div>
  );
}
