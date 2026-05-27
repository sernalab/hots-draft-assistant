// Server-side HeroesProfile data source.
//
// www.heroesprofile.com is now behind a Cloudflare "managed challenge", so the old
// internal-API scrape (CSRF + cookies) no longer works from a server. Two working
// sources replace it, both returning the same HpHeroResult[] the frontend expects:
//   1. Official API (api.heroesprofile.com/api/Heroes/Stats) — requires
//      HEROESPROFILE_API_TOKEN (Patreon). Honors the rank tier (league_tier).
//   2. Local snapshot (src/data/hpStats.json, produced by `npm run scrape:hp`) — free,
//      global Storm League, refreshed manually. Used when there's no token.

import { getSnapshot } from './heroesprofileSnapshot';

export interface HpHeroResult {
  name: string;
  winRate: number;
  pickRate: number;
  banRate: number;
  gamesPlayed: number;
}

const API_BASE = 'https://api.heroesprofile.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export function hasToken(): boolean {
  return Boolean(process.env.HEROESPROFILE_API_TOKEN);
}

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        const delay = 250 * Math.pow(2, i);
        console.warn(`[HeroesProfile] ${label} failed (attempt ${i + 1}/${attempts}), retrying in ${delay}ms:`, err instanceof Error ? err.message : err);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

let cachedPatch: { value: string; at: number } | null = null;
const PATCH_TTL = 6 * 60 * 60 * 1000;

// /openApi/Patches (free, no Cloudflare) returns { "2.55": [...], "2.54": [...] }.
async function getLatestMajorPatch(): Promise<string> {
  if (cachedPatch && Date.now() - cachedPatch.at < PATCH_TTL) return cachedPatch.value;
  const res = await fetch(`${API_BASE}/openApi/Patches`, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HeroesProfile /openApi/Patches returned ${res.status}`);
  const json = (await res.json()) as Record<string, unknown>;
  const majors = Object.keys(json).filter(k => /^\d+\.\d+$/.test(k)).sort((a, b) => {
    const [am, an] = a.split('.').map(Number);
    const [bm, bn] = b.split('.').map(Number);
    return bm - am || bn - an;
  });
  if (majors.length === 0) throw new Error('HeroesProfile patch list empty or changed shape');
  cachedPatch = { value: majors[0], at: Date.now() };
  return majors[0];
}

interface HpStatsRow {
  name?: string;
  win_rate?: number;
  pick_rate?: number;
  ban_rate?: number;
  games_played?: number;
  wins?: number;
  losses?: number;
  [key: string]: unknown;
}

function toResult(name: string, row: HpStatsRow): HpHeroResult {
  return {
    name,
    winRate: Math.round(Number(row.win_rate ?? 0) * 10) / 10,
    pickRate: Math.round(Number(row.pick_rate ?? 0) * 10) / 10,
    banRate: Math.round(Number(row.ban_rate ?? 0) * 10) / 10,
    gamesPlayed: Number(row.games_played ?? (Number(row.wins) || 0) + (Number(row.losses) || 0)),
  };
}

// Paid path: official API. timeframe_type=major aggregates across maps (so mapId isn't
// applied here), but league_tier lets us honor the rank selector.
async function fetchOfficial(rankTier: number | null): Promise<HpHeroResult[]> {
  const token = process.env.HEROESPROFILE_API_TOKEN!;
  const patch = await withRetry('patch fetch', () => getLatestMajorPatch());

  return withRetry('stats fetch', async () => {
    const params = new URLSearchParams({
      api_token: token,
      timeframe_type: 'major',
      timeframe: patch,
      game_type: 'Storm League',
      group_by_map: 'false',
    });
    if (rankTier !== null) params.set('league_tier', String(rankTier));

    const res = await fetch(`${API_BASE}/api/Heroes/Stats?${params.toString()}`, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    });
    if (res.status === 401) throw new Error('HeroesProfile API rejected the token (401) — check HEROESPROFILE_API_TOKEN');
    if (!res.ok) throw new Error(`HeroesProfile /api/Heroes/Stats returned ${res.status}`);

    const json = (await res.json()) as Record<string, unknown> | HpStatsRow[];
    const raw = (typeof json === 'object' && json !== null && 'data' in json)
      ? (json as Record<string, unknown>).data
      : json;

    let results: HpHeroResult[];
    if (Array.isArray(raw)) {
      results = raw
        .filter((r): r is HpStatsRow => typeof r === 'object' && r !== null && typeof (r as HpStatsRow).name === 'string')
        .map(r => toResult(String(r.name), r));
    } else if (typeof raw === 'object' && raw !== null) {
      results = Object.entries(raw as Record<string, HpStatsRow>)
        .filter(([, v]) => typeof v === 'object' && v !== null)
        .map(([name, v]) => toResult(typeof v.name === 'string' ? v.name : name, v));
    } else {
      throw new Error('HeroesProfile stats: unexpected response format');
    }

    if (results.length === 0) throw new Error('HeroesProfile stats returned no heroes');
    return results.sort((a, b) => b.winRate - a.winRate);
  });
}

// mapId is accepted for signature compatibility; per-map filtering isn't supported by
// the snapshot or the global-major API path yet.
export async function getHeroStats(mapId: string | null, rankTier: number | null = null): Promise<HpHeroResult[]> {
  void mapId;

  if (hasToken()) {
    try {
      return await fetchOfficial(rankTier);
    } catch (err) {
      console.error('[HeroesProfile] official API failed, falling back to snapshot:', err instanceof Error ? err.message : err);
    }
  }

  const snap = getSnapshot();
  if (snap) return snap.heroes;

  throw new Error('No HeroesProfile data available — set HEROESPROFILE_API_TOKEN or run `npm run scrape:hp`.');
}
