# HotS Draft Assistant

## Overview
Real-time draft assistant for Heroes of the Storm (Storm League / ranked). Provides rule-based pick and ban recommendations using live win-rate data from HeroesProfile, plus team-composition heuristics (role coverage, CC, waveclear, synergies, counters, map affinity).

**No AI / LLM integration. All logic is deterministic.**

## Stack
- **Framework**: React 19 (Vite) + TypeScript
- **Styles**: Tailwind CSS 4
- **Data**: HeroesProfile scrape via Vite middleware (dev) and Netlify Function (prod), both exposed at `/api/meta`
- **Persistence**: localStorage (meta cache, user preferences)
- **Deployment**: SPA on Netlify

## Architecture

### Services (`src/services/`)
- `metaSync.ts` — Fetches `/api/meta`, normalises into `HeroMeta[]`, caches in localStorage (2h TTL keyed by map+rank)
- `draftAnalysis.ts` — Pure scoring functions: composition checks, pick/ban suggestions, full-comp builder. Drives `DraftAdvisor`.
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
- `server/heroesprofile.ts` — Scrapes HeroesProfile's CSRF-protected internal API (`/api/v1/global/hero`). Includes retries with exponential backoff.
- `server/vite-plugin-api.ts` — Dev-only middleware exposing `/api/meta`
- `netlify/functions/meta.ts` — Production endpoint, same logic

## Design
- Dark gaming theme (`#0a0e1a` bg, `#00d4ff` cyan accent, `#7c3aed` purple for the advisor panel)
- Font: Exo 2 (display) + Inter (body)
- Tablet-first (designed as a second-screen companion)

## Data Sources
- **HeroesProfile** (`heroesprofile.com`) — primary source for win/pick/ban rates by map and rank tier
- Hero list, roles and map metadata are bundled statically in `src/data/`
