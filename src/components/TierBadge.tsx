import type { Tier } from '../types';

const tierStyles: Record<Tier, string> = {
  S: 'bg-tier-s/15 text-tier-s border-tier-s/50 shadow-[0_0_8px_rgba(255,215,0,0.2)]',
  A: 'bg-tier-a/15 text-tier-a border-tier-a/50',
  B: 'bg-tier-b/15 text-tier-b border-tier-b/50',
  C: 'bg-tier-c/10 text-tier-c/70 border-tier-c/30',
  D: 'bg-tier-d/10 text-tier-d/60 border-tier-d/20',
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`inline-flex items-center justify-center w-7 h-6 rounded-md text-[11px] font-bold border ${tierStyles[tier]}`}>
      {tier}
    </span>
  );
}
