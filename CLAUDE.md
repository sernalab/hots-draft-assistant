# HotS Draft Assistant

## Overview
Real-time draft assistant for Heroes of the Storm (Storm League / ranked). Provides rule-based pick and ban recommendations using **per-map** win-rate, synergy and counter data (from `matchup-tables.db`), plus team-composition heuristics (role coverage, CC, waveclear, map affinity). HeroesProfile supplies pick/ban rates.

**No AI / LLM integration. All logic is deterministic.**

## Stack
- **Framework**: React 19 (Vite) + TypeScript
- **Styles**: Tailwind CSS 4
- **Data**: HeroesProfile scrape via Vite middleware (dev) and Netlify Function (prod), both exposed at `/api/meta`
- **Persistence**: localStorage (meta cache, user preferences)
- **Deployment**: SPA on Netlify

## Architecture

### Services (`src/services/`)
- `metaSync.ts` — Fetches `/api/meta`, normalises into `HeroMeta[]`, caches in localStorage (2h TTL keyed by map+rank). **Overrides winRate + gamesPlayed (and thus tier) from the per-map matchup data** (`matchupData`); pick/ban rate stay global from the HeroesProfile snapshot.
- `matchupData.ts` — Loads bundled `src/data/matchups.json` and exposes per-map lookups: `getMapWr(map, hero)`, `getSynergy(map, a, b)`, `getCounter(map, winner, loser)`. Maps absent from the DB and the "all maps" view fall back to a `_global` weighted aggregate.
- `draftAnalysis.ts` — Pure scoring functions: composition checks, pick/ban suggestions, full-comp builder. **Synergies/counters are data-driven via `matchupData` (no hardcoded pairs).** Drives `DraftAdvisor`.
- `storage.ts` — localStorage wrapper for `MetaCache` and `UserPreferences`

### Hooks (`src/hooks/`)
- `useDraft` — Owns the 16-step Storm League draft state machine
- `useMeta` — Loads meta cache on mount, exposes `forceSync` / `syncForMap` / `syncForRank`

### Components (`src/components/`)
- `DraftBoard` — Map selector, first-pick toggle, 16 ordered pick/ban slots
- `DraftAdvisor` — Composition checks, top-5 pick/ban suggestions, full-comp builder
- `HeroBrowser` — Sortable/filterable hero table with meta stats + rank-tier selector
- `HeroSearch` — Modal with instant name/role filter
- `UserPoolModal` — Hero pool and playstyle preference editor
- `HeroIcon`, `TierBadge` — Presentational

### Server (`server/`, `netlify/`)
- `server/heroesprofile.ts` — Returns `HpHeroResult[]` (`{name, winRate, pickRate, banRate, gamesPlayed}`) from the HeroesProfile **official API** (`api.heroesprofile.com/api/Heroes/Stats`, needs `HEROESPROFILE_API_TOKEN`, honors rank) when a token is set, else from the local snapshot `src/data/hpStats.json`. The old `www.heroesprofile.com` scrape is dead (Cloudflare challenge).
- `server/heroesprofileSnapshot.ts` — Loads the bundled `src/data/hpStats.json` snapshot.
- `server/vite-plugin-api.ts` — Dev-only middleware exposing `/api/meta`; also copies `HEROESPROFILE_API_TOKEN` from `.env` into `process.env`.
- `netlify/functions/meta.ts` — Production endpoint, same logic.

### Scripts (`scripts/`)
- `scrape-heroesprofile.mjs` (`npm run scrape:hp`) — Drives a real Chromium (Playwright) **locally** to clear `www.heroesprofile.com`'s Cloudflare challenge, calls its internal stats endpoint, and writes `src/data/hpStats.json`. Then commit the JSON and redeploy. Headless by default; `HEADED=1` to show the browser. Free alternative to the paid token (circumvents their Patreon/Cloudflare — fragile + against ToS). NB: that endpoint allows only **one** POST per Cloudflare clear, so multi-query scrapes (per-map, matchups) aren't viable this way.
- `build-matchups.mjs` (`npm run build:matchups`) — Transforms `data/matchup-tables.db` (gitignored, ~12 MB SQLite) into the committed, compact `src/data/matchups.json`. Prunes synergy/counter pairs to `|Δ|≥2 & weight≥0.5` and adds a `_global` weighted aggregate. Run via `node --experimental-strip-types` (imports `maps.ts`).

## Design
- Dark gaming theme (`#0a0e1a` bg, `#00d4ff` cyan accent, `#7c3aed` purple for the advisor panel)
- Font: Exo 2 (display) + Inter (body)
- Tablet-first (designed as a second-screen companion)

## Data Sources
- **Matchup DB** (`data/matchup-tables.db` → `src/data/matchups.json`) — teammate-provided SQLite with **per-map** hero win rate + sample size (`wr_base`), synergy deltas (`delta_aliado`) and counter deltas (`delta_counter`). The primary source for tiers, synergies and counters. Has 13 of 14 maps (no Blackheart's Bay → global fallback) and no pick/ban rate.
- **HeroesProfile official API** (`api.heroesprofile.com`) — pick/ban rates (and a global WR fallback). Requires `HEROESPROFILE_API_TOKEN` (Patreon, ~5€/mo); honors rank tier. `www.heroesprofile.com` is behind a Cloudflare challenge, so a plain fetch can't scrape it.
- **HeroesProfile local snapshot** (`src/data/hpStats.json`) — free pick/ban source, produced by `npm run scrape:hp` (Playwright clears Cloudflare locally). Global Storm League, manual refresh.
- Hero list, roles and map metadata are bundled statically in `src/data/`.

## Refreshing data ("actualiza datos")

When the user says **"actualiza datos"** / "refresh stats" (or equivalent), run the refresh (also `/actualiza-datos`):
1. `npm run scrape:hp` (retry with `HEADED=1` if Cloudflare blocks the headless run).
2. Report hero count + sample win rates from `src/data/hpStats.json`.
3. Commit `src/data/hpStats.json` and push to `origin` → Netlify redeploys.

Only works in a **local** Claude Code session (the scrape needs a real browser + residential IP). It cannot run in a cloud routine — Cloudflare blocks datacenter IPs. Don't push if the scrape produced 0 heroes.
