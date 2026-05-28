import type { Tier } from '../types';

// Glowing tinted chips, readable on the obsidian surface.
const tierStyles: Record<Tier, string> = {
  S: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  A: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  B: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  C: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  D: 'bg-slate-600/15 text-slate-400 border-slate-600/30',
};

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className={`inline-flex items-center justify-center w-7 h-6 rounded-md text-[11px] font-bold border ${tierStyles[tier]}`}>
      {tier}
    </span>
  );
}
