---
description: Re-scrape HeroesProfile stats and push so Netlify redeploys
---

Refresh the HeroesProfile data snapshot. Steps:

1. Run `npm run scrape:hp`. The script drives a real Chromium (Playwright) to clear
   `www.heroesprofile.com`'s Cloudflare challenge and writes `src/data/hpStats.json`.
   - If it fails due to Cloudflare, retry once with `HEADED=1 npm run scrape:hp`
     (opens a visible browser window).
2. Report the hero count and 3–4 sample win rates from the new `src/data/hpStats.json`
   so the result can be sanity-checked.
3. If the data looks valid (non-zero heroes, sane win rates), commit
   `src/data/hpStats.json` with a message like `chore: refresh HeroesProfile stats`
   and push to `origin`. Netlify will redeploy automatically.
   - If the scrape produced 0 heroes or clearly broken data, do NOT push — report the
     problem instead.

Note: this must run in a local Claude Code session (the scrape needs a real browser and
a residential IP). It cannot run as a cloud routine — Cloudflare blocks datacenter IPs.
