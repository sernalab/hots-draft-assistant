// Per-map win rates + dynamic synergies/counters, sourced from the teammate-provided
// matchup-tables.db and bundled as src/data/matchups.json (see scripts/build-matchups.mjs).
//
// Everything is keyed by our map slugs (src/data/maps.ts). Maps not present in the DB
// (e.g. Blackheart's Bay) and the "no map selected" case fall back to the "_global"
// weighted aggregate. Lookups use hero display names (Hero.name).

import raw from '../data/matchups.json';

type Pair = [number, number, number]; // [heroIdA, heroIdB, delta]

interface MatchupsJson {
  generatedAt: string;
  source: string;
  prune: { minAbsDelta: number; minWeight: number };
  heroes: Record<string, string>;                       // dbHeroId -> name
  wr: Record<string, Record<string, [number, number]>>; // mapKey -> heroId -> [winRate, games]
  synergy: Record<string, Pair[]>;                       // mapKey -> [aId<bId, delta]
  counter: Record<string, Pair[]>;                       // mapKey -> [winnerId, loserId, delta>0]
}

// JSON imports widen tuples to number[]; cast through unknown to our precise shape.
const data = raw as unknown as MatchupsJson;

const idToName = new Map<number, string>(
  Object.entries(data.heroes).map(([id, name]) => [Number(id), name]),
);

const GLOBAL = '_global';

/** Resolve a map slug to a key present in the data, falling back to the global aggregate. */
function mapKey(mapId: string | null): string {
  return mapId && data.wr[mapId] ? mapId : GLOBAL;
}

// --- WR per map (name-keyed, built once per map) ---
const wrCache = new Map<string, Map<string, [number, number]>>();
function wrIndex(key: string): Map<string, [number, number]> {
  let idx = wrCache.get(key);
  if (!idx) {
    idx = new Map();
    for (const [hid, val] of Object.entries(data.wr[key] ?? {})) {
      const name = idToName.get(Number(hid));
      if (name) idx.set(name, val);
    }
    wrCache.set(key, idx);
  }
  return idx;
}

export interface MapWr { winRate: number; games: number; }

/** Per-map win rate + sample size for a hero (global aggregate when no/unknown map). */
export function getMapWr(mapId: string | null, hero: string): MapWr | null {
  const v = wrIndex(mapKey(mapId)).get(hero);
  return v ? { winRate: v[0], games: v[1] } : null;
}

// --- Synergy (symmetric) ---
const synCache = new Map<string, Map<string, number>>();
const synKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
function synIndex(key: string): Map<string, number> {
  let idx = synCache.get(key);
  if (!idx) {
    idx = new Map();
    for (const [a, b, d] of data.synergy[key] ?? []) {
      const na = idToName.get(a), nb = idToName.get(b);
      if (na && nb) idx.set(synKey(na, nb), d);
    }
    synCache.set(key, idx);
  }
  return idx;
}

/** WR swing (points) when heroA and heroB are on the same team. 0 if not significant. */
export function getSynergy(mapId: string | null, a: string, b: string): number {
  return synIndex(mapKey(mapId)).get(synKey(a, b)) ?? 0;
}

// --- Counter (directional: winner beats loser, delta > 0) ---
const cntCache = new Map<string, Map<string, number>>();
const cntKey = (w: string, l: string) => `${w}>${l}`;
function cntIndex(key: string): Map<string, number> {
  let idx = cntCache.get(key);
  if (!idx) {
    idx = new Map();
    for (const [w, l, d] of data.counter[key] ?? []) {
      const nw = idToName.get(w), nl = idToName.get(l);
      if (nw && nl) idx.set(cntKey(nw, nl), d);
    }
    cntCache.set(key, idx);
  }
  return idx;
}

/** WR swing (points) for `winner` against `loser` on the enemy team. 0 if not a counter. */
export function getCounter(mapId: string | null, winner: string, loser: string): number {
  return cntIndex(mapKey(mapId)).get(cntKey(winner, loser)) ?? 0;
}

export const matchupMeta = { generatedAt: data.generatedAt, prune: data.prune };
