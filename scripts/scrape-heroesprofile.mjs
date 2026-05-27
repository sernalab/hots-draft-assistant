// Local HeroesProfile scraper (run on YOUR machine, not in the cloud).
//
// www.heroesprofile.com is behind a Cloudflare "managed challenge", so a plain fetch
// can't reach its data. This drives a real Chromium via Playwright to clear the
// challenge, then calls the site's internal stats endpoint from inside the page
// (so it carries the cf_clearance cookie). The result is written to
//   src/data/hpStats.json
// which the app serves as a free, snapshot-based HeroesProfile source (falling back
// to Icy-Veins when the snapshot is empty).
//
// Usage:  npm run scrape:hp
//
// Caveats: this circumvents HeroesProfile's Patreon gating + Cloudflare, against their
// ToS. It's fragile — Cloudflare may tighten the challenge and break it. Refresh is
// manual: re-run this script, commit the JSON, redeploy.

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '../src/data/hpStats.json');

const HP = 'https://www.heroesprofile.com';
const API_BASE = 'https://api.heroesprofile.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Headless by default (no window). If Cloudflare starts blocking the headless run,
// retry with a visible browser:  HEADED=1 npm run scrape:hp
const HEADLESS = process.env.HEADED !== '1';

function log(...args) {
  console.log('[scrape-hp]', ...args);
}

// Latest patch comes from the OPEN api (no Cloudflare), so no browser needed for it.
async function getLatestPatches() {
  const res = await fetch(`${API_BASE}/openApi/Patches`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`/openApi/Patches returned ${res.status}`);
  const json = await res.json();
  const majors = Object.keys(json)
    .filter(k => /^\d+\.\d+$/.test(k))
    .sort((a, b) => {
      const [am, an] = a.split('.').map(Number);
      const [bm, bn] = b.split('.').map(Number);
      return bm - am || bn - an;
    });
  if (majors.length === 0) throw new Error('patch list empty');
  const latestMajor = majors[0];
  const latestMinor = json[latestMajor][0]; // newest minor of the newest major
  return { latestMajor, latestMinor };
}

async function waitForChallengeToClear(page) {
  // The challenge page has title "Just a moment..." and lacks the csrf-token meta.
  // Poll until the real app page is present (or time out).
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() => {
      const hasToken = !!document.querySelector('meta[name="csrf-token"]');
      const blocked = /just a moment|attention required/i.test(document.title);
      return hasToken && !blocked;
    });
    if (ready) return true;
    await page.waitForTimeout(1000);
  }
  return false;
}

async function main() {
  log('Resolving latest patch via open API…');
  const { latestMajor, latestMinor } = await getLatestPatches();
  log(`Latest major=${latestMajor}, minor=${latestMinor}`);

  log(`Launching Chromium (headless=${HEADLESS})…`);
  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({
    userAgent: UA,
    viewport: { width: 1366, height: 900 },
    locale: 'en-US',
  });
  const page = await context.newPage();

  try {
    log('Navigating to /Global/Hero (clearing Cloudflare)…');
    await page.goto(`${HP}/Global/Hero`, { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const cleared = await waitForChallengeToClear(page);
    if (!cleared) {
      throw new Error('Cloudflare challenge did not clear within 45s. Try running headed (without HEADLESS=1) and solve any prompt manually.');
    }
    log('Challenge cleared — real page loaded.');

    const csrfToken = await page.evaluate(() => {
      const el = document.querySelector('meta[name="csrf-token"]');
      return el ? el.getAttribute('content') : null;
    });
    if (!csrfToken) throw new Error('CSRF token not found after clearing challenge');
    log('Got CSRF token.');

    // Call the internal stats endpoint from inside the page context. The browser
    // already holds the cf_clearance cookie, so this request passes Cloudflare.
    log('Calling internal /api/v1/global/hero…');
    const apiResult = await page.evaluate(async ({ token, patch }) => {
      const body = {
        timeframe_type: 'minor',
        timeframe: [patch],
        game_type: ['sl'],
        region: null,
        statfilter: 'win_rate',
        hero_level: null,
        role: null,
        hero: null,
        game_map: null,
        league_tier: null,
        hero_league_tier: null,
        role_league_tier: null,
        mirror: 0,
      };
      const r = await fetch('/api/v1/global/hero', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': token,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(body),
      });
      const text = await r.text();
      return { status: r.status, text };
    }, { token: csrfToken, patch: latestMinor });

    if (apiResult.status !== 200) {
      throw new Error(`Internal API returned ${apiResult.status}: ${apiResult.text.slice(0, 200)}`);
    }

    const json = JSON.parse(apiResult.text);
    const raw = json.data ?? json;
    const rows = Array.isArray(raw) ? raw : Object.values(raw);

    const heroes = rows
      .filter(h => h && typeof h.name === 'string')
      .map(h => ({
        name: String(h.name),
        winRate: Math.round(Number(h.win_rate ?? 0) * 10) / 10,
        pickRate: Math.round(Number(h.pick_rate ?? 0) * 10) / 10,
        banRate: Math.round(Number(h.ban_rate ?? 0) * 10) / 10,
        gamesPlayed: Number(h.games_played ?? (Number(h.wins) || 0) + (Number(h.losses) || 0)),
      }))
      .sort((a, b) => b.winRate - a.winRate);

    if (heroes.length === 0) throw new Error('Parsed 0 heroes from internal API response');

    const snapshot = {
      generatedAt: new Date().toISOString(),
      patch: latestMinor,
      gameType: 'Storm League',
      heroes,
    };

    mkdirSync(dirname(OUT_PATH), { recursive: true });
    writeFileSync(OUT_PATH, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
    log(`Wrote ${heroes.length} heroes to ${OUT_PATH}`);
    log(`Sample: ${heroes.slice(0, 3).map(h => `${h.name} ${h.winRate}%`).join(', ')}`);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('[scrape-hp] FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
