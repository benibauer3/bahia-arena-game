/**
 * gooddollar.ts — GoodDollar protocol addresses + minimal ABIs (Celo Mainnet).
 *
 * Contracts:
 *  • G$ Token     (ERC-20, 2 decimals)  — balanceOf, decimals
 *  • UBIScheme                           — checkEntitlement, claim, periodStart
 *  • IdentityV2                          — isWhitelisted
 *
 * Addresses sourced from GoodDollar's official docs:
 *   https://docs.gooddollar.org/protocol-v3-documentation/core-contracts-and-api
 */

// ─── Addresses (Celo Mainnet 42220) ──────────────────────────────────────────

export const GD_CONTRACTS = {
  /** G$ ERC-20 token */
  token:     "0x62B8B11039FcfE5aB0C56E502b1C372A3d462a4b" as `0x${string}`,
  /** UBIScheme — daily claim, 24-hour periods */
  ubiScheme: "0xAACbaaB8571cbECEB46ba85B5981efDB8928545e" as `0x${string}`,
  /** IdentityV2 — humanity proof whitelist */
  identity:  "0xC361A6E67822a0EDc17D899227dd9FC50BD62F42" as `0x${string}`,
} as const;

/** Fiat value proxy: 1 G$ ≈ $0.001 USD (informational only, not oracle) */
export const GD_USD_RATE = 0.001;

/** External URL to verify humanity */
export const GD_VERIFY_URL = "https://wallet.gooddollar.org/?receiving=true";

// ─── ABIs ────────────────────────────────────────────────────────────────────

export const GD_TOKEN_ABI = [
  {
    name: "balanceOf", type: "function", stateMutability: "view",
    inputs:  [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "decimals", type: "function", stateMutability: "view",
    inputs:  [],
    outputs: [{ type: "uint8" }],
  },
] as const;

export const GD_IDENTITY_ABI = [
  {
    name: "isWhitelisted", type: "function", stateMutability: "view",
    inputs:  [{ name: "account", type: "address" }],
    outputs: [{ type: "bool" }],
  },
] as const;

export const GD_UBI_ABI = [
  /**
   * Returns the amount the given address can claim right now (in G$ raw units).
   * Returns 0n if:  (a) already claimed today, or (b) address not whitelisted.
   */
  {
    name: "checkEntitlement", type: "function", stateMutability: "view",
    inputs:  [{ name: "claimer", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  /**
   * Execute the UBI claim for msg.sender.
   * Must be called from the beneficiary's own wallet.
   */
  {
    name: "claim", type: "function", stateMutability: "nonpayable",
    inputs:  [],
    outputs: [{ type: "bool" }],
  },
  /**
   * Unix timestamp (seconds) when the current UBI period began.
   * Next period starts at periodStart + 86400.
   */
  {
    name: "periodStart", type: "function", stateMutability: "view",
    inputs:  [],
    outputs: [{ type: "uint256" }],
  },
] as const;
