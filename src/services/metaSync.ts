import type { HeroMeta, MetaCache, Tier } from '../types';
import { HEROES } from '../data/heroes';
import { getMetaCache, setMetaCache } from './storage';
import { getMapWr } from './matchupData';

interface ApiHero {
  name: string;
  winRate: number;
  pickRate: number;
  banRate: number;
  gamesPlayed: number;
}

function assignTier(winRate: number, gamesPlayed: number): Tier {
  // Not enough data for a meaningful tier
  if (gamesPlayed < 100) return 'C';
  if (winRate >= 53) return 'S';
  if (winRate >= 51) return 'A';
  if (winRate >= 49) return 'B';
  if (winRate >= 47) return 'C';
  return 'D';
}

function resolveRole(name: string) {
  return HEROES.find(h => h.name === name)?.role ?? 'Ranged Assassin' as const;
}

// Win rate + sample size come from the per-map matchup dataset (matchups.json); pick/ban
// rate stay global from the HeroesProfile snapshot (the DB has no pick/ban data). Maps
// absent from the DB and the "all maps" view use the global aggregate.
function toMeta(apiHeroes: ApiHero[], mapId: string | null): HeroMeta[] {
  return apiHeroes
    .map(h => {
      const mapWr = getMapWr(mapId, h.name);
      const winRate = mapWr ? mapWr.winRate : h.winRate;
      const gamesPlayed = mapWr ? mapWr.games : h.gamesPlayed;
      return {
        hero: h.name,
        tier: assignTier(winRate, gamesPlayed),
        winRate,
        pickRate: h.pickRate,
        banRate: h.banRate,
        gamesPlayed,
        role: resolveRole(h.name),
        influence: 0,
      };
    })
    .sort((a, b) => b.winRate - a.winRate);
}

const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

export async function syncMeta(
  mapId: string | null = null,
  rankTier: number | null = null,
  force = false,
): Promise<MetaCache> {
  // Use cache if valid, same filters, and not empty
  if (!force) {
    const cached = getMetaCache();
    if (cached && cached.data.length > 0 && cached.map === mapId && cached.rank === rankTier && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached;
    }
  }

  const params = new URLSearchParams();
  if (mapId) params.set('map', mapId);
  if (rankTier !== null) params.set('rank', String(rankTier));
  const qs = params.toString();
  const url = `/api/meta${qs ? `?${qs}` : ''}`;

  console.log('[MetaSync] Fetching:', url);
  const res = await fetch(url);
  const json = await res.json();
  console.log('[MetaSync] Response ok:', json.ok, 'heroes:', json.data?.length ?? 0);

  if (!json.ok) {
    const cached = getMetaCache();
    if (cached && cached.data.length > 0) return cached;
    throw new Error(json.error ?? 'Failed to fetch meta data');
  }

  const cache: MetaCache = {
    timestamp: Date.now(),
    data: toMeta(json.data, mapId),
    map: mapId,
    rank: rankTier,
  };

  setMetaCache(cache);
  return cache;
}

export function getMetaForHero(heroName: string): HeroMeta | undefined {
  const cache = getMetaCache();
  if (!cache) return undefined;
  return cache.data.find(m => m.hero === heroName);
}
