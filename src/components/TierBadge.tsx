import type { Tier } from '../types';

const tierStyles: Record<Tier, string> = {
  S: 'bg-tier-s/20 text-tier-s border-tier-s/40',
  A: 'bg-tier-a/20 text-tier-a border-tier-a/40',
  B: 'bg-tier-b/20 text-tier-b border-tier-b/40',
  C: 'bg-tier-c/20 text-tier-c border-tier-c/40',
  D: 'bg-tier-d/20 text-tier-d border-tier-d/40',
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold border ${tierStyles[tier]}`}>
      {tier}
    </span>
  );
}
