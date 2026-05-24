import { useMemo, useState } from 'react';
import type { Hero, HeroRole } from '../types';
import { searchHeroes } from '../data/heroes';
import { HeroIcon } from './HeroIcon';
import { TierBadge } from './TierBadge';
import { getMetaForHero } from '../services/metaSync';

interface HeroSearchProps {
  onSelect: (hero: Hero) => void;
  excludeHeroes?: string[];
  onClose: () => void;
}

const ROLES: HeroRole[] = ['Tank', 'Bruiser', 'Healer', 'Support', 'Melee Assassin', 'Ranged Assassin'];

export function HeroSearch({ onSelect, excludeHeroes = [], onClose }: HeroSearchProps) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<HeroRole | undefined>();

  const results = useMemo(() => {
    return searchHeroes(query, roleFilter).filter(h => !excludeHeroes.includes(h.name));
  }, [query, roleFilter, excludeHeroes]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-bg-card border border-border rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border">
          <input
            type="text"
            placeholder="Search hero..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-bg-primary border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            autoFocus
          />
          <div className="flex flex-wrap gap-1.5 mt-3">
            <button
              onClick={() => setRoleFilter(undefined)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                !roleFilter ? 'bg-accent/20 text-accent' : 'bg-bg-primary text-text-secondary hover:text-text-primary'
              }`}
            >
              All
            </button>
            {ROLES.map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role === roleFilter ? undefined : role)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  roleFilter === role ? 'bg-accent/20 text-accent' : 'bg-bg-primary text-text-secondary hover:text-text-primary'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {results.map(hero => {
            const meta = getMetaForHero(hero.name);
            return (
              <button
                key={hero.id}
                onClick={() => onSelect(hero)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-card-hover transition-colors text-left"
              >
                <HeroIcon hero={hero} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-text-primary">{hero.name}</span>
                  <span className="text-xs text-text-muted ml-2">{hero.role}</span>
                </div>
                {meta && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">{meta.winRate.toFixed(1)}%</span>
                    <TierBadge tier={meta.tier} />
                  </div>
                )}
              </button>
            );
          })}
          {results.length === 0 && (
            <p className="text-center text-text-muted py-8 text-sm">No heroes found</p>
          )}
        </div>
      </div>
    </div>
  );
}
