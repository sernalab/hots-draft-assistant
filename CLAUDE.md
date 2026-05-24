# HotS Draft Assistant

## Overview
Real-time draft assistant for Heroes of the Storm (Storm League / ranked). Provides AI-powered pick and ban recommendations based on map, team composition, and current meta.

## Stack
- **Framework**: React (Vite) + TypeScript
- **Styles**: Tailwind CSS 4
- **AI**: Anthropic API (claude-sonnet-4-20250514) via `/api/chat` proxy
- **Persistence**: localStorage (meta cache, user preferences)
- **Deployment**: SPA, standalone

## Architecture

### Services
- `services/claude.ts` — Claude API integration for draft advice and screenshot analysis
- `services/metaSync.ts` — Meta data generation and caching (tier lists, win rates)
- `services/storage.ts` — localStorage wrapper for cache, preferences

### Key Components
- `DraftBoard` — Map selector + pick/ban slots (3 enemy bans, 3 ally bans, 5 picks each)
- `AIPanel` — Claude-powered recommendations with reasoning
- `MetaPanel` — Tier list browser with win rates
- `HeroSearch` — Modal with instant filter by name/role
- `ScreenshotAnalyzer` — Vision-based draft extraction from screenshots
- `UserPoolModal` — Hero pool and playstyle preferences

### .claude/ Structure
- `agents/` — meta-sync, draft-advisor, screenshot-reader agent prompts
- `skills/` — hots-knowledge, tier-list-parser, draft-reasoning

## API Integration
- Proxy endpoint: `POST /api/chat`
- Model: `claude-sonnet-4-20250514`
- Max tokens: 1000
- No API key in code — handled by proxy

## Design
- Dark gaming theme (#0a0e1a background, #00d4ff accent, #7c3aed AI purple)
- Font: Exo 2 (display) + Inter (body)
- Mobile-friendly (tablet-first for second screen usage)
