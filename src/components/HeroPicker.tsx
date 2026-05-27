import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Hero, HeroMeta, HeroRole } from '../types';
import { HEROES } from '../data/heroes';
import { RANK_TIERS } from '../types';
import { HeroIcon } from './HeroIcon';

interface HeroPickerProps {
  meta: HeroMeta[];
  metaLoading: boolean;
  metaError: string | null;
  lastSync: string;
  currentRank: number | null;
  takenHeroes: string[];
  activeSlotInfo: { action: 'ban' | 'pick'; team: 'ally' | 'enemy' } | null;
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
  { label: 'Melee', value: 'Melee Assassin' },
  { label: 'Ranged', value: 'Ranged Assassin' },
];

export function HeroPicker({
  meta,
  metaLoading,
  metaError,
  lastSync,
  currentRank,
  takenHeroes,
  activeSlotInfo,
  onHeroClick,
  onSync,
  onRankChange,
}: HeroPickerProps) {
  const [roleFilter, setRoleFilter] = useState<HeroRole | null>(null);
  const [search, setSearch] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);

  const heroes = useMemo(() => {
    const metaMap = new Map(meta.map(m => [m.hero, m]));
    return HEROES
      .map(hero => ({
        hero,
        meta: metaMap.get(hero.name) ?? null,
        isTaken: takenHeroes.includes(hero.name),
      }))
      .filter(h => {
        if (h.isTaken) return false;
        if (roleFilter && h.hero.role !== roleFilter) return false;
        if (search && !h.hero.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        const aWr = a.meta?.winRate ?? 0;
        const bWr = b.meta?.winRate ?? 0;
        return bWr - aWr;
      });
  }, [meta, roleFilter, search, takenHeroes]);

  // Animate grid on filter change
  useEffect(() => {
    if (!gridRef.current) return;
    const items = gridRef.current.querySelectorAll('.hero-cell');
    if (items.length === 0) return;
    gsap.fromTo(items,
      { opacity: 0, scale: 0.85 },
      { opacity: 1, scale: 1, stagger: 0.01, duration: 0.25, ease: 'power2.out', overwrite: true },
    );
  }, [heroes]);

  const slotLabel = activeSlotInfo
    ? activeSlotInfo.action === 'ban'
      ? 'BAN'
      : activeSlotInfo.team === 'ally'
        ? 'ALLY PICK'
        : 'ENEMY PICK'
    : null;

  const slotColor = activeSlotInfo
    ? activeSlotInfo.action === 'ban'
      ? 'text-ban-light'
      : activeSlotInfo.team === 'ally'
        ? 'text-ally-light'
        : 'text-enemy-light'
    : '';

  const slotBorderColor = activeSlotInfo
    ? activeSlotInfo.action === 'ban'
      ? 'border-ban/40'
      : activeSlotInfo.team === 'ally'
        ? 'border-ally/40'
        : 'border-enemy/40'
    : 'border-border';

  return (
    <div className={`glass-card rounded-xl p-4 transition-colors ${activeSlotInfo ? slotBorderColor : ''}`}>
      {/* Top bar: slot indicator + filters + sync */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {/* Active slot indicator */}
        {slotLabel ? (
          <div className={`flex items-center gap-2 ${slotColor}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Select for {slotLabel}
            </span>
          </div>
        ) : (
          <span className="text-xs text-text-muted">
            {meta.length > 0 ? `${meta.length} heroes · ${lastSync}` : metaLoading ? 'Loading...' : 'Click Sync'}
          </span>
        )}

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-40 bg-bg-primary/60 border border-white/8 rounded-lg pl-7 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent/40 transition-all"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted/50 text-xs">&#x2315;</span>
        </div>

        {/* Rank */}
        <select
          value={currentRank ?? ''}
          onChange={e => onRankChange(e.target.value === '' ? null : Number(e.target.value))}
          className="bg-bg-primary/60 border border-white/8 rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent/50 transition-colors appearance-none cursor-pointer"
        >
          {RANK_TIERS.map(r => (
            <option key={r.name} value={r.code ?? ''}>{r.name}</option>
          ))}
        </select>

        {/* Sync */}
        <button
          onClick={onSync}
          disabled={metaLoading}
          className="flex items-center gap-1.5 text-xs bg-accent/10 border border-accent/30 hover:bg-accent/20 px-3 py-1.5 rounded-lg text-accent font-medium transition-all disabled:opacity-50"
        >
          {metaLoading ? (
            <span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          ) : (
            <span className="text-sm">&#x21bb;</span>
          )}
          {metaLoading ? 'Syncing' : 'Sync'}
        </button>
      </div>

      {metaError && (
        <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-2 text-xs text-red-400 mb-3">
          {metaError}
        </div>
      )}

      {/* Role filters */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {ROLES.map(r => {
          const isActive = roleFilter === r.value;
          return (
            <button
              key={r.label}
              onClick={() => setRoleFilter(roleFilter === r.value ? null : r.value)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all border ${
                isActive
                  ? 'bg-accent/20 text-accent border-accent/40 shadow-[0_0_8px_rgba(0,212,255,0.12)]'
                  : 'bg-bg-primary/40 text-text-muted hover:text-text-secondary border-transparent hover:border-white/8'
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Hero grid */}
      <div
        ref={gridRef}
        className="grid gap-1 overflow-y-auto max-h-[280px] pr-1"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))' }}
      >
        {heroes.map(({ hero, meta: m }) => (
          <button
            key={hero.id}
            onClick={() => onHeroClick(hero)}
            className="hero-cell group relative flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all duration-150 hover:bg-white/[0.06] hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="relative">
              <HeroIcon hero={hero} size="md" />
              {/* Tier badge overlay */}
              {m && m.gamesPlayed >= 50 && (
                <span className={`absolute -top-1 -right-1 text-[8px] font-bold px-1 py-px rounded ${
                  m.tier === 'S' ? 'bg-tier-s/30 text-tier-s'
                  : m.tier === 'A' ? 'bg-tier-a/30 text-tier-a'
                  : m.tier === 'B' ? 'bg-tier-b/30 text-tier-b'
                  : 'bg-gray-600/30 text-gray-400'
                }`}>
                  {m.tier}
                </span>
              )}
            </div>
            <span className="text-[9px] text-text-secondary leading-tight text-center truncate w-full">
              {hero.name}
            </span>
            {/* WR tooltip on hover */}
            {m && m.gamesPlayed >= 50 && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 bg-bg-elevated border border-white/10 rounded-md px-2 py-1 shadow-xl z-20 whitespace-nowrap">
                <span className={`text-[10px] font-bold ${
                  m.winRate >= 53 ? 'text-positive' : m.winRate >= 50 ? 'text-text-primary' : 'text-ban-light'
                }`}>
                  {m.winRate.toFixed(1)}%
                </span>
                <span className="text-[9px] text-text-muted">WR</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {heroes.length === 0 && (
        <p className="text-center text-text-muted text-xs py-6">No heroes match</p>
      )}
    </div>
  );
}
