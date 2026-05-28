import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
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
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    return searchHeroes(query, roleFilter).filter(h => !excludeHeroes.includes(h.name));
  }, [query, roleFilter, excludeHeroes]);

  // Animate modal entrance
  useEffect(() => {
    if (overlayRef.current && modalRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' });
      gsap.fromTo(modalRef.current,
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
    }
    inputRef.current?.focus();
  }, []);

  // Animate results on change
  useEffect(() => {
    if (!resultsRef.current) return;
    const cards = resultsRef.current.querySelectorAll('.hero-search-card');
    if (cards.length === 0) return;
    gsap.fromTo(cards,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, stagger: 0.02, duration: 0.25, ease: 'power2.out', overwrite: true }
    );
  }, [results]);

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-bg-card border border-border rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl shadow-black/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-base pointer-events-none">&#x2315;</span>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search hero..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded-xl pl-10 pr-10 py-3 text-base text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              autoFocus
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-lg transition-colors"
              >
                &times;
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            <button
              onClick={() => setRoleFilter(undefined)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                !roleFilter
                  ? 'bg-accent text-bg-primary border-accent shadow-sm'
                  : 'bg-white/5 text-text-secondary hover:text-text-primary border-border hover:border-accent/40'
              }`}
            >
              All
            </button>
            {ROLES.map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role === roleFilter ? undefined : role)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                  roleFilter === role
                    ? 'bg-accent text-bg-primary border-accent shadow-sm'
                    : 'bg-white/5 text-text-secondary hover:text-text-primary border-border hover:border-accent/40'
                }`}
              >
                {role.replace('Assassin', 'Ass.')}
              </button>
            ))}
          </div>
        </div>

        <div ref={resultsRef} className="overflow-y-auto flex-1 p-3 space-y-1">
          {results.map(hero => {
            const meta = getMetaForHero(hero.name);
            return (
              <button
                key={hero.id}
                onClick={() => onSelect(hero)}
                className="hero-search-card w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/5 hover:-translate-y-px hover:shadow-md transition-all duration-150 text-left"
              >
                <HeroIcon hero={hero} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-text-primary">{hero.name}</span>
                  <span className="text-[11px] text-text-muted ml-2">{hero.role}</span>
                </div>
                {meta && (
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs font-semibold ${
                      meta.winRate >= 53 ? 'text-map-strong' :
                      meta.winRate >= 50 ? 'text-text-primary' :
                      'text-map-weak'
                    }`}>
                      {meta.winRate.toFixed(1)}%
                    </span>
                    <TierBadge tier={meta.tier} />
                  </div>
                )}
              </button>
            );
          })}
          {results.length === 0 && (
            <p className="text-center text-text-muted py-10 text-sm">No heroes found</p>
          )}
        </div>
      </div>
    </div>
  );
}
