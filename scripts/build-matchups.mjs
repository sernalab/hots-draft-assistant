// Transforms the teammate-provided matchup-tables.db (SQLite) into a compact, committed
// src/data/matchups.json that the app bundles. Mirrors how scrape-heroesprofile.mjs
// produces hpStats.json.
//
// Usage:  npm run build:matchups            (reads data/matchup-tables.db)
//         node --experimental-strip-types scripts/build-matchups.mjs <path-to-db>
//
// Output shape (ids are the DB's hero ids; resolve to names via `heroes`):
//   {
//     generatedAt, source, prune: { minAbsDelta, minWeight },
//     heroes:  { "<dbHeroId>": "Hero Name", ... },
//     wr:      { "<map-slug>"|"_global": { "<heroId>": [winRate, games], ... } },
//     synergy: { "<map-slug>"|"_global": [ [aId, bId, delta], ... ] },   // symmetric, aId<bId
//     counter: { "<map-slug>"|"_global": [ [winnerId, loserId, delta], ... ] }, // delta>0
//   }

import { DatabaseSync } from 'node:sqlite';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAPS } from '../src/data/maps.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.argv[2] || resolve(__dirname, '../data/matchup-tables.db');
const OUT = resolve(__dirname, '../src/data/matchups.json');

const MIN_ABS_DELTA = 2;   // ignore relationships that move WR by < 2 points
const MIN_WEIGHT = 0.5;    // ignore low-confidence (small-sample) relationships

const r1 = x => Math.round(x * 10) / 10;
const log = (...a) => console.log('[build-matchups]', ...a);

const db = new DatabaseSync(DB_PATH, { readOnly: true });
const q = (s, ...p) => db.prepare(s).all(...p);

// hero id -> name
const heroes = Object.fromEntries(q('SELECT id, name FROM heroes').map(h => [h.id, h.name]));

// db map id -> our maps.ts slug (join by name)
const nameToSlug = Object.fromEntries(MAPS.map(m => [m.name, m.id]));
const mapSlug = {};
for (const m of q('SELECT id, name FROM maps')) {
  const slug = nameToSlug[m.name];
  if (!slug) { log('WARN: no slug for db map', JSON.stringify(m.name)); continue; }
  mapSlug[m.id] = slug;
}
const slugs = Object.values(mapSlug);

// ---------- wr per map (+ _global weighted by games) ----------
const wr = { _global: {} };
for (const slug of slugs) wr[slug] = {};
const wrAcc = {}; // heroId -> { swn, sn }
for (const row of q('SELECT hero_id, map_id, wr, n FROM wr_base')) {
  const slug = mapSlug[row.map_id];
  if (!slug) continue;
  wr[slug][row.hero_id] = [r1(row.wr), row.n];
  const a = (wrAcc[row.hero_id] ??= { swn: 0, sn: 0 });
  a.swn += row.wr * row.n; a.sn += row.n;
}
for (const [hid, a] of Object.entries(wrAcc)) wr._global[hid] = [r1(a.swn / a.sn), a.sn];

// ---------- synergy (symmetric -> store aId<bId only) ----------
const synergy = { _global: [] };
for (const slug of slugs) synergy[slug] = [];
const synAcc = {}; // "a:b" -> { a, b, sdw, sw, cnt }
for (const row of q('SELECT a_id, b_id, map_id, delta, weight FROM delta_aliado WHERE a_id < b_id')) {
  const slug = mapSlug[row.map_id];
  if (!slug) continue;
  if (Math.abs(row.delta) >= MIN_ABS_DELTA && row.weight >= MIN_WEIGHT) {
    synergy[slug].push([row.a_id, row.b_id, r1(row.delta)]);
  }
  const k = row.a_id + ':' + row.b_id;
  const a = (synAcc[k] ??= { a: row.a_id, b: row.b_id, sdw: 0, sw: 0, cnt: 0 });
  a.sdw += row.delta * row.weight; a.sw += row.weight; a.cnt += 1;
}
for (const a of Object.values(synAcc)) {
  const d = a.sdw / a.sw;
  if (Math.abs(d) >= MIN_ABS_DELTA && a.sw / a.cnt >= MIN_WEIGHT) synergy._global.push([a.a, a.b, r1(d)]);
}

// ---------- counter (directional -> store winner beats loser, delta>0) ----------
const counter = { _global: [] };
for (const slug of slugs) counter[slug] = [];
const cntAcc = {}; // "a:e" -> { a, e, sdw, sw, cnt }
for (const row of q('SELECT a_id, e_id, map_id, delta, weight FROM delta_counter')) {
  const slug = mapSlug[row.map_id];
  if (!slug) continue;
  if (row.delta >= MIN_ABS_DELTA && row.weight >= MIN_WEIGHT) {
    counter[slug].push([row.a_id, row.e_id, r1(row.delta)]);
  }
  const k = row.a_id + ':' + row.e_id;
  const a = (cntAcc[k] ??= { a: row.a_id, e: row.e_id, sdw: 0, sw: 0, cnt: 0 });
  a.sdw += row.delta * row.weight; a.sw += row.weight; a.cnt += 1;
}
for (const a of Object.values(cntAcc)) {
  const d = a.sdw / a.sw;
  if (d >= MIN_ABS_DELTA && a.sw / a.cnt >= MIN_WEIGHT) counter._global.push([a.a, a.e, r1(d)]);
}

db.close();

const out = {
  generatedAt: new Date().toISOString(),
  source: 'matchup-tables.db',
  prune: { minAbsDelta: MIN_ABS_DELTA, minWeight: MIN_WEIGHT },
  heroes,
  wr,
  synergy,
  counter,
};

writeFileSync(OUT, JSON.stringify(out) + '\n', 'utf8');

const sum = obj => Object.entries(obj).reduce((n, [k, v]) => k === '_global' ? n : n + v.length, 0);
log(`maps: ${slugs.length} (missing: ${MAPS.filter(m => !slugs.includes(m.id)).map(m => m.id).join(', ') || 'none'})`);
log(`wr rows: ${Object.values(wr).reduce((n, o) => n + Object.keys(o).length, 0)}`);
log(`synergy: ${sum(synergy)} per-map + ${synergy._global.length} global`);
log(`counter: ${sum(counter)} per-map + ${counter._global.length} global`);
log(`wrote ${OUT}`);
