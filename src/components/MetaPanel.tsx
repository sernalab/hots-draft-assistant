import { useState } from 'react';
import type { HeroMeta, Tier } from '../types';
import { TierBadge } from './TierBadge';

interface MetaPanelProps {
  meta: HeroMeta[];
  loading: boolean;
  lastSync: string;
  onSync: () => void;
}

const TIERS: Tier[] = ['S', 'A', 'B', 'C', 'D'];

export function MetaPanel({ meta, loading, lastSync, onSync }: MetaPanelProps) {
  const [expandedTiers, setExpandedTiers] = useState<Set<Tier>>(new Set(['S', 'A']));

  const toggleTier = (tier: Tier) => {
    setExpandedTiers(prev => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  };

  const heroesByTier = TIERS.reduce((acc, tier) => {
    acc[tier] = meta.filter(h => h.tier === tier);
    return acc;
  }, {} as Record<Tier, HeroMeta[]>);

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-accent uppercase tracking-wider font-[family-name:var(--font-display)]">
          Meta / Info
        </h2>
        <button
          onClick={onSync}
          disabled={loading}
          className="text-xs bg-bg-primary border border-border hover:border-accent/40 px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 border border-text-muted/30 border-t-accent rounded-full animate-spin" />
              Syncing...
            </span>
          ) : (
            'Sync Meta'
          )}
        </button>
      </div>

      <p className="text-xs text-text-muted">Last sync: {lastSync}</p>

      <div className="space-y-2">
        {TIERS.map(tier => {
          const heroes = heroesByTier[tier];
          if (heroes.length === 0) return null;
          const isExpanded = expandedTiers.has(tier);

          return (
            <div key={tier}>
              <button
                onClick={() => toggleTier(tier)}
                className="w-full flex items-center justify-between py-1.5 text-left"
              >
                <div className="flex items-center gap-2">
                  <TierBadge tier={tier} />
                  <span className="text-xs text-text-muted">({heroes.length})</span>
                </div>
                <span className="text-text-muted text-xs">{isExpanded ? '\u25B2' : '\u25BC'}</span>
              </button>

              {isExpanded && (
                <div className="space-y-1 ml-1 mt-1">
                  {heroes.map(h => (
                    <div
                      key={h.hero}
                      className="flex items-center justify-between px-2 py-1 rounded text-xs hover:bg-bg-card-hover transition-colors"
                    >
                      <span className="text-text-primary">{h.hero}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted">{h.role}</span>
                        <span className={`font-mono ${h.winRate >= 52 ? 'text-map-strong' : h.winRate >= 50 ? 'text-text-secondary' : 'text-map-weak'}`}>
                          {h.winRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
