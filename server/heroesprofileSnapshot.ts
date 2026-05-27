// Loads the locally-scraped HeroesProfile snapshot (src/data/hpStats.json), produced
// by `npm run scrape:hp`. Bundled at build time so it works both in the Vite dev
// middleware and in the Netlify Function. Empty/absent → callers fall back elsewhere.

import snapshot from '../src/data/hpStats.json';

export interface HpSnapshotHero {
  name: string;
  winRate: number;
  pickRate: number;
  banRate: number;
  gamesPlayed: number;
}

export interface HpSnapshot {
  generatedAt: string;
  patch: string;
  gameType: string;
  heroes: HpSnapshotHero[];
}

const data = snapshot as HpSnapshot;

export function getSnapshot(): HpSnapshot | null {
  if (!data || !Array.isArray(data.heroes) || data.heroes.length === 0) return null;
  return data;
}
