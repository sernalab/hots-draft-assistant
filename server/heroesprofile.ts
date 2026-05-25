// Server-side HeroesProfile fetcher — runs in Node via Vite middleware
// No CORS issues since this runs on the server

export interface HpHeroResult {
  name: string;
  winRate: number;
  pickRate: number;
  banRate: number;
  gamesPlayed: number;
}

const HP_BASE = 'https://www.heroesprofile.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

const MAP_NAMES: Record<string, string> = {
  'alterac-pass': 'Alterac Pass',
  'battlefield-of-eternity': 'Battlefield of Eternity',
  'blackhearts-bay': "Blackheart's Bay",
  'braxis-holdout': 'Braxis Holdout',
  'cursed-hollow': 'Cursed Hollow',
  'dragon-shire': 'Dragon Shire',
  'garden-of-terror': 'Garden of Terror',
  'hanamura-temple': 'Hanamura Temple',
  'infernal-shrines': 'Infernal Shrines',
  'sky-temple': 'Sky Temple',
  'tomb-of-the-spider-queen': 'Tomb of the Spider Queen',
  'towers-of-doom': 'Towers of Doom',
  'volskaya-foundry': 'Volskaya Foundry',
  'warhead-junction': 'Warhead Junction',
};

interface PageData {
  csrfToken: string;
  cookies: string;
  latestPatch: string;
}

async function getPageData(): Promise<PageData> {
  const res = await fetch(`${HP_BASE}/Global/Hero`, {
    headers: { 'User-Agent': UA, 'Accept': 'text/html' },
  });
  if (!res.ok) throw new Error(`HeroesProfile returned ${res.status}`);

  const html = await res.text();

  // CSRF token
  const tokenMatch = html.match(/<meta name="csrf-token" content="([^"]+)"/);
  if (!tokenMatch) throw new Error('CSRF token not found');

  // Cookies
  const setCookies = res.headers.getSetCookie?.() ?? [];
  const cookies = setCookies.map(c => c.split(';')[0]).join('; ');

  // Latest patch version from embedded Vue data (HTML-encoded quotes)
  const patchMatch = html.match(/&quot;code&quot;:&quot;(\d+\.\d+\.\d+\.\d+)&quot;/);
  if (!patchMatch) throw new Error('Could not find patch version');

  return {
    csrfToken: tokenMatch[1],
    cookies,
    latestPatch: patchMatch[1],
  };
}

interface HpApiResponse {
  data: Record<string, {
    name: string;
    win_rate: number;
    pick_rate: number;
    ban_rate: number;
    games_played: number;
    wins: number;
    losses: number;
    [key: string]: unknown;
  }> | Array<{
    name: string;
    win_rate: number;
    pick_rate: number;
    ban_rate: number;
    games_played: number;
    wins: number;
    losses: number;
    [key: string]: unknown;
  }>;
  status?: string;
}

async function fetchApi(page: PageData, mapId: string | null, rankTier: number | null = null): Promise<HpHeroResult[]> {
  const mapName = mapId ? MAP_NAMES[mapId] ?? null : null;

  const body = {
    timeframe_type: 'minor',
    timeframe: [page.latestPatch],
    game_type: ['sl'],
    region: null,
    statfilter: 'win_rate',
    hero_level: null,
    role: null,
    hero: null,
    game_map: mapName ? [mapName] : null,
    league_tier: rankTier !== null ? [rankTier] : null,
    hero_league_tier: null,
    role_league_tier: null,
    mirror: 0,
  };

  const res = await fetch(`${HP_BASE}/api/v1/global/hero`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRF-TOKEN': page.csrfToken,
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': page.cookies,
      'User-Agent': UA,
      'Referer': `${HP_BASE}/Global/Hero`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`API returned ${res.status}`);

  const json: HpApiResponse = await res.json();

  if (json.status && json.status !== 'success') {
    throw new Error(`API error: ${json.status}`);
  }

  // Response might be an object keyed by hero name, or have a nested data property
  let entries: Array<Record<string, unknown>>;
  const rawData = json.data ?? json;

  if (Array.isArray(rawData)) {
    entries = rawData;
  } else if (typeof rawData === 'object' && rawData !== null) {
    entries = Object.values(rawData);
  } else {
    throw new Error('Unexpected response format');
  }

  return entries
    .filter((h): h is Record<string, unknown> & { name: string } =>
      typeof h === 'object' && h !== null && typeof h.name === 'string'
    )
    .map(h => ({
      name: String(h.name),
      winRate: Math.round(Number(h.win_rate ?? 0) * 10) / 10,
      pickRate: Math.round(Number(h.pick_rate ?? 0) * 10) / 10,
      banRate: Math.round(Number(h.ban_rate ?? 0) * 10) / 10,
      gamesPlayed: Number(h.games_played ?? ((Number(h.wins) || 0) + (Number(h.losses) || 0))),
    }))
    .sort((a, b) => b.winRate - a.winRate);
}

export async function getHeroStats(mapId: string | null, rankTier: number | null = null): Promise<HpHeroResult[]> {
  const page = await getPageData();
  return fetchApi(page, mapId, rankTier);
}
