# HotS Draft Assistant

Real-time AI-powered draft assistant for Heroes of the Storm (Storm League / ranked). Helps you choose optimal picks and bans based on map, team composition, and current meta.

## Features

- **Draft Board** — Select map, manage picks and bans for both teams
- **AI Recommendations** — Get 3 hero suggestions with reasoning, synergy analysis, and counter information
- **Meta Sync** — Tier list with win rates, cached for 24h
- **Screenshot Analysis** — Upload a draft screenshot to auto-fill the draft state
- **Hero Pool** — Save your preferred heroes and playstyle for personalized suggestions

## Tech Stack

- React (Vite) + TypeScript
- Tailwind CSS 4
- Anthropic API (Claude Sonnet) via proxy
- localStorage for persistence

## Getting Started

```bash
npm install
npm run dev
```

## AI Integration

The app expects a proxy at `/api/chat` that forwards to the Anthropic API. Configure your proxy to handle:

```
POST /api/chat
Body: { model, max_tokens, system, messages }
```

## License

MIT
