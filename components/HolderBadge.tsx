import { getHolderTier, type HolderTierId } from '@/lib/holder';

const TIER_STYLES: Record<HolderTierId, string> = {
  anon: 'border-slate-300/50 bg-slate-100/70 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
  holder: 'border-emerald-300/60 bg-emerald-100/80 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200',
  ape: 'border-lime-300/70 bg-lime-100/80 text-lime-800 dark:border-lime-500/40 dark:bg-lime-950/40 dark:text-lime-200',
  whale: 'border-cyan-300/70 bg-cyan-100/80 text-cyan-800 dark:border-cyan-500/40 dark:bg-cyan-950/40 dark:text-cyan-200',
  legend: 'border-amber-300/80 bg-amber-100/80 text-amber-900 dark:border-amber-500/50 dark:bg-amber-950/40 dark:text-amber-200',
};

interface HolderBadgeProps {
  tier?: HolderTierId | string | null;
  balance?: number | null;
  voteWeight?: number | null;
  compact?: boolean;
}

export default function HolderBadge({ tier, balance, voteWeight, compact = false }: HolderBadgeProps) {
  const resolvedTier = (tier || getHolderTier(balance).id) as HolderTierId;

  if (resolvedTier === 'anon') {
    return null;
  }

  const label = getHolderTier(balance).id === resolvedTier
    ? getHolderTier(balance).label
    : resolvedTier.charAt(0).toUpperCase() + resolvedTier.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${TIER_STYLES[resolvedTier] ?? TIER_STYLES.holder}`}
      title={voteWeight ? `Thread vote weight: ${voteWeight}x` : undefined}
    >
      {label}
      {!compact && voteWeight ? <span className="opacity-70">· {voteWeight}x</span> : null}
    </span>
  );
}
