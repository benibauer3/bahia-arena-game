import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { ACTIVE_CONTRACTS, ARENA_ABI, ERC20_ABI } from "@/lib/contracts";
import { useAccount } from "wagmi";

export type BattleStatus = 0 | 1 | 2 | 3; // OPEN | ACTIVE | RESOLVED | CANCELLED

export interface Battle {
  playerA:   `0x${string}`;
  playerB:   `0x${string}`;
  classA:    number;
  classB:    number;
  stake:     bigint;
  status:    BattleStatus;
  winner:    `0x${string}`;
  createdAt: bigint;
  startedAt: bigint;
}

export const STATUS_LABEL: Record<BattleStatus, string> = {
  0: "Open",
  1: "In Battle",
  2: "Resolved",
  3: "Cancelled",
};

// ─── Read hooks ───────────────────────────────────────────────────────────────

export function useOpenBattles() {
  return useReadContract({
    address:      ACTIVE_CONTRACTS.ArenaManager,
    abi:          ARENA_ABI,
    functionName: "getOpenBattles",
    args:         [0n, 20n],
  });
}

export function useBattle(battleId: bigint | undefined) {
  return useReadContract({
    address:      ACTIVE_CONTRACTS.ArenaManager,
    abi:          ARENA_ABI,
    functionName: "getBattle",
    args:         battleId !== undefined ? [battleId] : undefined,
    query:        { enabled: battleId !== undefined, refetchInterval: 5_000 },
  });
}

export function useUSDTBalance() {
  const { address } = useAccount();
  return useReadContract({
    address:      ACTIVE_CONTRACTS.usdt,
    abi:          ERC20_ABI,
    functionName: "balanceOf",
    args:         address ? [address] : undefined,
    query:        { enabled: !!address, refetchInterval: 10_000 },
  });
}

export function useUSDTAllowance(spender: `0x${string}`) {
  const { address } = useAccount();
  return useReadContract({
    address:      ACTIVE_CONTRACTS.usdt,
    abi:          ERC20_ABI,
    functionName: "allowance",
    args:         address ? [address, spender] : undefined,
    query:        { enabled: !!address },
  });
}

// ─── Write hooks ──────────────────────────────────────────────────────────────

/** Approve USDT spend then create a battle (2 tx). Returns helpers to drive the flow. */
export function useCreateBattle() {
  const approve    = useWriteContract();
  const create     = useWriteContract();
  const approveRct = useWaitForTransactionReceipt({ hash: approve.data });
  const createRct  = useWaitForTransactionReceipt({ hash: create.data });

  async function submit(classIndex: number, stakeUSD: string) {
    const stakeWei = parseUnits(stakeUSD, 18);

    // Step 1 – approve USDT
    const approveTx = await approve.writeContractAsync({
      address:      ACTIVE_CONTRACTS.usdt,
      abi:          ERC20_ABI,
      functionName: "approve",
      args:         [ACTIVE_CONTRACTS.ArenaManager, stakeWei],
    });

    return { approveTx, stakeWei };
  }

  async function createAfterApproval(classIndex: number, stakeWei: bigint) {
    return create.writeContractAsync({
      address:      ACTIVE_CONTRACTS.ArenaManager,
      abi:          ARENA_ABI,
      functionName: "createBattle",
      args:         [classIndex, stakeWei],
    });
  }

  return {
    submit,
    createAfterApproval,
    approveStatus:  approveRct.status,
    createStatus:   createRct.status,
    isApproving:    approve.isPending || approveRct.isLoading,
    isCreating:     create.isPending  || createRct.isLoading,
    error:          approve.error ?? create.error,
  };
}

export function useJoinBattle() {
  const approve  = useWriteContract();
  const join     = useWriteContract();
  const joinRct  = useWaitForTransactionReceipt({ hash: join.data });

  async function submit(battleId: bigint, classIndex: number, stake: bigint) {
    await approve.writeContractAsync({
      address:      ACTIVE_CONTRACTS.usdt,
      abi:          ERC20_ABI,
      functionName: "approve",
      args:         [ACTIVE_CONTRACTS.ArenaManager, stake],
    });
    return join.writeContractAsync({
      address:      ACTIVE_CONTRACTS.ArenaManager,
      abi:          ARENA_ABI,
      functionName: "joinBattle",
      args:         [battleId, classIndex],
    });
  }

  return {
    submit,
    isLoading: approve.isPending || join.isPending || joinRct.isLoading,
    isSuccess: joinRct.isSuccess,
    error:     approve.error ?? join.error,
  };
}
