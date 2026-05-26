import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Hero, HeroMeta, HeroRole, SortField } from '../types';
import { HEROES } from '../data/heroes';
import { RANK_TIERS } from '../types';
import { HeroIcon } from './HeroIcon';
import { TierBadge } from './TierBadge';

interface HeroBrowserProps {
  meta: HeroMeta[];
  metaLoading: boolean;
  metaError: string | null;
  lastSync: string;
  currentRank: number | null;
  takenHeroes: string[];
  hasActiveSlot: boolean;
  onHeroClick: (hero: Hero) => void;
  onSync: () => void;
  onRankChange: (rank: number | null) => void;
}

const ROLES: { label: string; value: HeroRole | null }[] = [
  { label: 'All', value: null },
  { label: 'Tank', value: 'Tank' },
  { label: 'Bruiser', value: 'Bruiser' },
  { label: 'Healer', value: 'Healer' },
  { label: 'Support', value: 'Support' },
  { label: 'Melee Ass.', value: 'Melee Assassin' },
  { label: 'Ranged Ass.', value: 'Ranged Assassin' },
];

function formatGames(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

type SortDir = 'asc' | 'desc';

function SortHeader({
  label,
  field,
  currentSort,
  currentDir,
  onSort,
  className = '',
}: {
  label: string;
  field: SortField;
  currentSort: SortField;
  currentDir: SortDir;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const isActive = currentSort === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={`text-right font-medium transition-colors text-[10px] uppercase tracking-wider ${
        isActive ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
      } ${className}`}
    >
      {label}
      <span className="ml-0.5 inline-block">
        {isActive
          ? (currentDir === 'desc' ? '\u25BC' : '\u25B2')
          : '\u25BD'
        }
      </span>
    </button>
  );
}

export function HeroBrowser({
  meta,
  metaLoading,
  metaError,
  lastSync,
  currentRank,
  takenHeroes,
  hasActiveSlot,
  onHeroClick,
  onSync,
  onRankChange,
}: HeroBrowserProps) {
  const [roleFilter, setRoleFilter] = useState<HeroRole | null>(null);
  const [search, setSearch] = useState('');
  const [showTaken, setShowTaken] = useState(false);
  const [sortField, setSortField] = useState<SortField>('winRate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [minGames, setMinGames] = useState(50);
  const listRef = useRef<HTMLDivElement>(null);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const heroes = useMemo(() => {
    const metaMap = new Map(meta.map(m => [m.hero, m]));
    const mult = sortDir === 'desc' ? -1 : 1;

    return HEROES
      .map(hero => ({
        hero,
        meta: metaMap.get(hero.name) ?? null,
        isTaken: takenHeroes.includes(hero.name),
      }))
      .filter(h => {
        if (!showTaken && h.isTaken) return false;
        if (roleFilter && h.hero.role !== roleFilter) return false;
        if (search && !h.hero.name.toLowerCase().includes(search.toLowerCase())) return false;
        // Filter by minimum games
        if (h.meta && h.meta.gamesPlayed < minGames) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.isTaken !== b.isTaken) return a.isTaken ? 1 : -1;
        const aVal = a.meta?.[sortField] ?? -1;
        const bVal = b.meta?.[sortField] ?? -1;
        return (aVal - bVal) * mult;
      });
  }, [meta, roleFilter, search, takenHeroes, showTaken, sortField, sortDir, minGames]);

  // GSAP stagger animation on hero list changes
  useEffect(() => {
    if (!listRef.current) return;
    const rows = listRef.current.querySelectorAll('.hero-row');
    if (rows.length === 0) return;
    gsap.fromTo(rows,
      { opacity: 0, x: -10 },
      { opacity: 1, x: 0, stagger: 0.02, duration: 0.3, ease: 'power2.out', overwrite: true }
    );
  }, [heroes]);

  const rankLabel = RANK_TIERS.find(r => r.code === currentRank)?.name ?? 'All Ranks';

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold uppercase tracking-wider font-[family-name:var(--font-display)] bg-gradient-to-r from-accent to-white bg-clip-text text-transparent">
            Heroes
          </h2>
          <p className="text-[10px] text-text-muted mt-1">
            {meta.length > 0 ? (
              <>HeroesProfile &middot; Storm League &middot; {rankLabel} &middot; Synced: {lastSync}</>
            ) : (
              metaLoading ? 'Loading...' : 'Click Sync to load data'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Rank selector inline */}
          <select
            value={currentRank ?? ''}
            onChange={e => onRankChange(e.target.value === '' ? null : Number(e.target.value))}
            className="bg-bg-primary/60 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent/50 transition-colors appearance-none cursor-pointer backdrop-blur-sm"
          >
            {RANK_TIERS.map(r => (
              <option key={r.name} value={r.code ?? ''}>{r.name}</option>
            ))}
          </select>
          <button
            onClick={onSync}
            disabled={metaLoading}
            className="flex items-center gap-1.5 text-xs bg-accent/10 border border-accent/30 hover:bg-accent/20 hover:border-accent/50 px-4 py-1.5 rounded-lg text-accent font-medium transition-all disabled:opacity-50"
          >
            {metaLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.312.311a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-9.624-2.848a.75.75 0 00-.39-1.449 7 7 0 0111.712 3.139.75.75 0 01-1.449.389 5.5 5.5 0 00-9.201-2.466l-.312.311V6.067a.75.75 0 00-1.5 0v3.634a.75.75 0 00.75.75h3.634a.75.75 0 000-1.5H6.5l.312-.311a5.474 5.474 0 01-.124-.064z" clipRule="evenodd" />
                </svg>
                Sync
              </>
            )}
          </button>
        </div>
      </div>

      {metaError && (
        <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-2.5 text-xs text-red-400">
          {metaError}
        </div>
      )}

      {hasActiveSlot && (
        <div className="bg-accent/5 border border-accent/20 rounded-lg p-2.5 text-xs text-accent flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          Click a hero to assign to the active draft slot
        </div>
      )}

      {/* Compact filters bar */}
      <div className="glass-subtle rounded-lg p-3 space-y-2.5">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">&#x2315;</span>
            <input
              type="text"
              placeholder="Search hero..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-bg-primary/50 border border-white/8 rounded-lg pl-8 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent/40 focus:bg-bg-primary/70 transition-all"
            />
          </div>
          {/* Min games inline */}
          <div className="flex items-center gap-1 bg-bg-primary/50 border border-white/8 rounded-lg px-2.5 py-2">
            <label className="text-[10px] text-text-muted whitespace-nowrap">Min</label>
            <input
              type="number"
              value={minGames}
              onChange={e => setMinGames(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-11 bg-transparent text-xs text-text-primary text-center focus:outline-none"
              min={0}
              step={10}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {ROLES.map(r => {
            const isActive = roleFilter === r.value;
            return (
              <button
                key={r.label}
                onClick={() => setRoleFilter(roleFilter === r.value ? null : r.value)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  isActive
                    ? 'bg-accent/20 text-accent border border-accent/40 shadow-[0_0_8px_rgba(0,212,255,0.15)]'
                    : 'bg-bg-primary/40 text-text-muted hover:text-text-secondary border border-transparent hover:border-white/8'
                }`}
              >
                {r.label}
              </button>
            );
          })}
          <button
            onClick={() => setShowTaken(!showTaken)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ml-auto border ${
              showTaken
                ? 'bg-white/8 text-text-secondary border-white/10'
                : 'text-text-muted hover:text-text-secondary border-transparent'
            }`}
          >
            {showTaken ? 'Showing taken' : 'Hide taken'}
          </button>
        </div>
      </div>

      {/* Column headers (sortable) */}
      {meta.length > 0 && (
        <div className="flex items-center px-3 py-1">
          <span className="flex-1 text-[10px] uppercase tracking-wider text-text-muted">Hero</span>
          <div className="flex items-center gap-2">
            <span className="w-8 text-right text-[10px] uppercase tracking-wider text-text-muted">Tier</span>
            <SortHeader label="Win%" field="winRate" currentSort={sortField} currentDir={sortDir} onSort={handleSort} className="w-14" />
            <SortHeader label="Pick%" field="pickRate" currentSort={sortField} currentDir={sortDir} onSort={handleSort} className="w-12" />
            <SortHeader label="Ban%" field="banRate" currentSort={sortField} currentDir={sortDir} onSort={handleSort} className="w-12" />
            <SortHeader label="Games" field="gamesPlayed" currentSort={sortField} currentDir={sortDir} onSort={handleSort} className="w-11" />
          </div>
        </div>
      )}

      {/* Hero list */}
      <div ref={listRef} className="space-y-0 max-h-[60vh] overflow-y-auto pr-1">
        {heroes.map(({ hero, meta: m, isTaken }, index) => (
          <button
            key={hero.id}
            onClick={() => !isTaken && onHeroClick(hero)}
            disabled={isTaken}
            className={`hero-row w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 ${
              isTaken
                ? 'opacity-25 cursor-not-allowed grayscale'
                : 'hover:bg-white/[0.04] hover:-translate-y-px hover:shadow-md cursor-pointer'
            } ${index % 2 === 0 ? 'bg-white/[0.015]' : ''}`}
          >
            <HeroIcon hero={hero} size="sm" className="shrink-0" />
            <div className="flex-1 min-w-0">
              <span className={`text-xs font-medium text-text-primary truncate block ${isTaken ? 'line-through' : ''}`}>
                {hero.name}
              </span>
              <span className="text-[10px] text-text-muted">{hero.role}</span>
            </div>

            {m ? (
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="w-8 text-right"><TierBadge tier={m.tier} /></span>
                <span className="w-14 text-right">
                  <span className="relative inline-flex items-center">
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full opacity-30"
                      style={{
                        width: `${Math.min(m.winRate, 100)}%`,
                        maxWidth: '100%',
                        backgroundColor: m.winRate >= 53 ? '#22c55e' : m.winRate >= 50 ? '#60a5fa' : '#ef4444',
                      }}
                    />
                    <span className={`relative font-semibold ${
                      m.winRate >= 53 ? 'text-map-strong' :
                      m.winRate >= 50 ? 'text-text-primary' :
                      'text-map-weak'
                    }`}>
                      {m.winRate.toFixed(1)}%
                    </span>
                  </span>
                </span>
                <span className="w-12 text-right text-text-muted/70 text-[10px]">
                  {m.pickRate.toFixed(1)}%
                </span>
                <span className={`w-12 text-right text-[10px] ${m.banRate >= 20 ? 'text-ban-light' : 'text-text-muted/70'}`}>
                  {m.banRate.toFixed(1)}%
                </span>
                <span className="w-11 text-right text-text-muted/50 text-[10px]">
                  {formatGames(m.gamesPlayed)}
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-text-muted/30 italic">No data</span>
            )}
          </button>
        ))}

        {heroes.length === 0 && (
          <p className="text-center text-text-muted text-sm py-10">No heroes match</p>
        )}
      </div>
    </div>
  );
}
