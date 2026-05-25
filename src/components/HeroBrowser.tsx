import { useMemo, useState } from 'react';
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
  currentMap: string | null;
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
      className={`text-right font-medium transition-colors ${
        isActive ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
      } ${className}`}
    >
      {label}
      {isActive && (
        <span className="ml-0.5">{currentDir === 'desc' ? '\u25BC' : '\u25B2'}</span>
      )}
    </button>
  );
}

export function HeroBrowser({
  meta,
  metaLoading,
  metaError,
  lastSync,
  currentMap,
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

  const rankLabel = RANK_TIERS.find(r => r.code === currentRank)?.name ?? 'All Ranks';

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-accent uppercase tracking-wider font-[family-name:var(--font-display)]">
            Heroes
          </h2>
          <p className="text-[10px] text-text-muted mt-0.5">
            {meta.length > 0 ? (
              <>HeroesProfile · Storm League · {rankLabel} · Synced: {lastSync}</>
            ) : (
              metaLoading ? 'Loading...' : 'Click Sync to load data'
            )}
          </p>
        </div>
        <button
          onClick={onSync}
          disabled={metaLoading}
          className="text-xs bg-bg-primary border border-border hover:border-accent/40 px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 shrink-0"
        >
          {metaLoading ? (
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 border border-text-muted/30 border-t-accent rounded-full animate-spin" />
              Loading...
            </span>
          ) : 'Sync'}
        </button>
      </div>

      {metaError && (
        <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-2 text-xs text-red-400">
          {metaError}
        </div>
      )}

      {hasActiveSlot && (
        <div className="bg-accent/5 border border-accent/20 rounded-lg p-2 text-xs text-accent">
          Click a hero to assign to the active draft slot
        </div>
      )}

      {/* Filters row */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search hero..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
          {/* Rank filter */}
          <select
            value={currentRank ?? ''}
            onChange={e => onRankChange(e.target.value === '' ? null : Number(e.target.value))}
            className="bg-bg-primary border border-border rounded-lg px-2 py-2 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
          >
            {RANK_TIERS.map(r => (
              <option key={r.name} value={r.code ?? ''}>{r.name}</option>
            ))}
          </select>
          {/* Min games filter */}
          <div className="flex items-center gap-1 bg-bg-primary border border-border rounded-lg px-2 py-2">
            <label className="text-[10px] text-text-muted whitespace-nowrap">Min</label>
            <input
              type="number"
              value={minGames}
              onChange={e => setMinGames(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-12 bg-transparent text-xs text-text-primary text-center focus:outline-none"
              min={0}
              step={10}
            />
            <label className="text-[10px] text-text-muted whitespace-nowrap">games</label>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {ROLES.map(r => (
            <button
              key={r.label}
              onClick={() => setRoleFilter(roleFilter === r.value ? null : r.value)}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                roleFilter === r.value
                  ? 'bg-accent/20 text-accent'
                  : 'bg-bg-primary text-text-muted hover:text-text-secondary'
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={() => setShowTaken(!showTaken)}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ml-auto ${
              showTaken ? 'bg-border text-text-secondary' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {showTaken ? 'Showing taken' : 'Hide taken'}
          </button>
        </div>
      </div>

      {/* Column headers (sortable) */}
      {meta.length > 0 && (
        <div className="flex items-center px-2 text-[10px] uppercase tracking-wider">
          <span className="flex-1 text-text-muted">Hero</span>
          <div className="flex items-center gap-2">
            <span className="w-8 text-right text-text-muted">Tier</span>
            <SortHeader label="Win%" field="winRate" currentSort={sortField} currentDir={sortDir} onSort={handleSort} className="w-12" />
            <SortHeader label="Pick%" field="pickRate" currentSort={sortField} currentDir={sortDir} onSort={handleSort} className="w-12" />
            <SortHeader label="Ban%" field="banRate" currentSort={sortField} currentDir={sortDir} onSort={handleSort} className="w-12" />
            <SortHeader label="Games" field="gamesPlayed" currentSort={sortField} currentDir={sortDir} onSort={handleSort} className="w-10" />
          </div>
        </div>
      )}

      {/* Hero list */}
      <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
        {heroes.map(({ hero, meta: m, isTaken }) => (
          <button
            key={hero.id}
            onClick={() => !isTaken && onHeroClick(hero)}
            disabled={isTaken}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
              isTaken
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:bg-bg-card-hover hero-card-hover cursor-pointer'
            }`}
          >
            <HeroIcon hero={hero} size="sm" className="shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-text-primary truncate block">{hero.name}</span>
              <span className="text-[10px] text-text-muted">{hero.role}</span>
            </div>

            {m ? (
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="w-8 text-right"><TierBadge tier={m.tier} /></span>
                <span className={`w-12 text-right font-semibold ${
                  m.winRate >= 53 ? 'text-map-strong' :
                  m.winRate >= 50 ? 'text-text-primary' :
                  'text-map-weak'
                }`}>
                  {m.winRate.toFixed(1)}%
                </span>
                <span className="w-12 text-right text-text-muted">
                  {m.pickRate.toFixed(1)}%
                </span>
                <span className={`w-12 text-right ${m.banRate >= 20 ? 'text-map-weak' : 'text-text-muted'}`}>
                  {m.banRate.toFixed(1)}%
                </span>
                <span className="w-10 text-right text-text-muted/60">
                  {formatGames(m.gamesPlayed)}
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-text-muted/40">No data</span>
            )}
          </button>
        ))}

        {heroes.length === 0 && (
          <p className="text-center text-text-muted text-sm py-8">No heroes match</p>
        )}
      </div>
    </div>
  );
}
