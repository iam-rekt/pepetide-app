/**
 * $PEPETIDE token configuration.
 *
 * Set NEXT_PUBLIC_PEPETIDE_MINT to the SPL mint address once the token launches
 * on pump.fun. While unset, balance reads return 0 and gated UI stays hidden.
 */

export const PEPETIDE_MINT = process.env.NEXT_PUBLIC_PEPETIDE_MINT ?? '';

// pump.fun launches default to 6 decimals.
export const PEPETIDE_DECIMALS = 6;

export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';

export const isTokenConfigured = PEPETIDE_MINT.length > 0;
