# HotS Draft Assistant

Real-time draft assistant for Heroes of the Storm (Storm League / ranked). Helps you choose picks and bans based on map, team composition, and current meta — using live win-rate data scraped from HeroesProfile.

## Features

- **Draft Board** — Select map, walk through the 16-step Storm League draft sequence for both teams
- **Draft Advisor** — Rule-based pick/ban suggestions with reasoning (role coverage, CC, waveclear, synergies, counters, map affinity)
- **Hero Browser** — Filter and sort the full hero pool by win rate / pick rate / ban rate / sample size, by rank tier
- **Meta Sync** — Pulls live stats from HeroesProfile, cached in localStorage for 2h
- **Hero Pool** — Save your preferred heroes and playstyle in localStorage

## Tech Stack

- React 19 (Vite) + TypeScript
- Tailwind CSS 4
- HeroesProfile scraping via Vite dev middleware (dev) / Netlify Function (production)
- localStorage for persistence

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — Vite dev server with `/api/meta` middleware
- `npm run build` — TypeScript build + Vite production bundle
- `npm run lint` — ESLint
- `npm run preview` — Preview the production build locally

## API

The app calls `GET /api/meta?map=<map-id>&rank=<rank-tier>`.

- **Dev**: served by `server/vite-plugin-api.ts` (Vite middleware)
- **Production**: served by `netlify/functions/meta.ts` (Netlify Function)

Both call into `server/heroesprofile.ts`, which scrapes HeroesProfile's CSRF-protected internal API.

## License

MIT
