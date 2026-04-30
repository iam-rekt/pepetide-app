export type HolderTierId = 'anon' | 'holder' | 'ape' | 'whale' | 'legend';

export interface HolderTier {
  id: HolderTierId;
  label: string;
  minBalance: number;
  voteWeight: number;
}

export const HOLDER_TIERS: HolderTier[] = [
  { id: 'legend', label: 'Legend', minBalance: 1_000_000, voteWeight: 25 },
  { id: 'whale', label: 'Whale', minBalance: 250_000, voteWeight: 10 },
  { id: 'ape', label: 'Ape', minBalance: 50_000, voteWeight: 5 },
  { id: 'holder', label: 'Holder', minBalance: 0.000001, voteWeight: 2 },
  { id: 'anon', label: 'Anon', minBalance: 0, voteWeight: 1 },
];

export function getHolderTier(balance: number | null | undefined): HolderTier {
  const safeBalance = balance ?? 0;
  return HOLDER_TIERS.find((tier) => safeBalance >= tier.minBalance) ?? HOLDER_TIERS[HOLDER_TIERS.length - 1];
}

export function getThreadVoteWeight(balance: number | null | undefined): number {
  return getHolderTier(balance).voteWeight;
}

export function formatTokenBalance(balance: number | null | undefined): string {
  const n = balance ?? 0;
  if (n === 0) return '0';
  if (n < 0.01) return n.toExponential(2);
  if (n < 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  return `${(n / 1_000_000_000).toFixed(2)}B`;
}
