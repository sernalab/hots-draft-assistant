import type { DraftAdvice, DraftState, HeroMeta, ScreenshotResult, UserPreferences } from '../types';
import { MAPS_BY_ID } from '../data/maps';

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1000;

// Proxy endpoint — assumes a local proxy or Anthropic direct
const API_URL = '/api/chat';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | ClaudeContentBlock[];
}

interface ClaudeContentBlock {
  type: 'text' | 'image';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

async function callClaude(
  system: string,
  messages: ClaudeMessage[]
): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages,
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

function buildDraftContext(
  draft: DraftState,
  meta: HeroMeta[],
  prefs: UserPreferences
): string {
  const mapInfo = draft.map ? MAPS_BY_ID[draft.map] : null;

  const enemyBans = draft.enemyBans.filter(Boolean).map(h => h!.name);
  const allyBans = draft.allyBans.filter(Boolean).map(h => h!.name);
  const enemyPicks = draft.enemyPicks.filter(Boolean).map(h => h!.name);
  const allyPicks = draft.allyPicks.filter(Boolean).map(h => h!.name);

  const allTaken = [...enemyBans, ...allyBans, ...enemyPicks, ...allyPicks];

  const topMeta = meta
    .filter(m => !allTaken.includes(m.hero))
    .slice(0, 20)
    .map(m => `${m.hero} (${m.tier}, ${m.winRate}% WR, ${m.role})`)
    .join('\n');

  return `
CURRENT DRAFT STATE:
- Map: ${mapInfo?.name ?? 'Not selected'} ${mapInfo ? `(strengths: ${mapInfo.strengths.join(', ')})` : ''}
- Phase: ${draft.phase}
- Enemy bans: ${enemyBans.join(', ') || 'none'}
- Ally bans: ${allyBans.join(', ') || 'none'}
- Enemy picks: ${enemyPicks.join(', ') || 'none'}
- Ally picks: ${allyPicks.join(', ') || 'none'}

USER PREFERENCES:
- Hero pool: ${prefs.heroPool.length > 0 ? prefs.heroPool.join(', ') : 'no preference'}
- Main role: ${prefs.mainRole ?? 'flexible'}
- Playstyle: ${prefs.playstyleNotes || 'not specified'}

TOP META HEROES (available):
${topMeta}
`.trim();
}

const DRAFT_SYSTEM = `You are an expert Heroes of the Storm draft advisor. You analyze draft states and provide optimal pick recommendations.

RULES:
- Always respond with valid JSON only, no markdown or extra text
- Recommend max 3 heroes
- Prioritize heroes from the user's pool if they fit
- Consider map strengths, team composition, and counters
- Each reasoning should be 2-3 sentences max
- Never recommend heroes already picked or banned

DRAFT KNOWLEDGE:
- Importance of 1-3-1 vs 2-2-1 rotation depending on map
- Double support is viable when team has sustained damage
- Dive compositions need a dive-capable tank (Anub'arak, Tyrael, Diablo)
- Rule: no more than 2 heroes without CC
- Counter-pick vs synergy: counterpick when enemy has a key threat, synergize otherwise
- If enemy has heavy dive → pick tank with displacement (ETC, Garrosh)
- If map has short objectives → prioritize burst
- If map has long laning → waveclear and sustain
- Known ult combos: Zarya + Diablo/ETC, Dehaka + Zeratul, Malfurion + Jaina

Response format:
{
  "recommendations": [
    {
      "hero": "string",
      "tier": "S|A|B",
      "reasoning": "string",
      "synergyWith": ["hero1"],
      "counters": ["hero1"],
      "mapFit": "strong|neutral|weak"
    }
  ],
  "teamCompAnalysis": "string",
  "warning": "string or null"
}`;

export async function getDraftAdvice(
  draft: DraftState,
  meta: HeroMeta[],
  prefs: UserPreferences
): Promise<DraftAdvice> {
  const context = buildDraftContext(draft, meta, prefs);
  const response = await callClaude(DRAFT_SYSTEM, [
    { role: 'user', content: `Analyze this draft and suggest picks:\n\n${context}` },
  ]);

  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as DraftAdvice;
  } catch {
    return {
      recommendations: [],
      teamCompAnalysis: 'Error parsing AI response. Try again.',
      warning: response,
    };
  }
}

const SCREENSHOT_SYSTEM = `You are an expert at reading Heroes of the Storm draft screens. Analyze the screenshot and extract all visible information.

Return ONLY valid JSON:
{
  "map": "map name or null",
  "enemyBans": ["hero names"],
  "allyBans": ["hero names"],
  "enemyPicks": ["hero names"],
  "allyPicks": ["hero names"],
  "phase": "ban-1|pick-1|ban-2|pick-2|complete"
}

Use exact hero names. If you can't determine something, use empty arrays or null.`;

export async function analyzeScreenshot(base64Image: string, mimeType: string): Promise<ScreenshotResult> {
  const response = await callClaude(SCREENSHOT_SYSTEM, [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mimeType,
            data: base64Image,
          },
        },
        {
          type: 'text',
          text: 'Extract the draft state from this Heroes of the Storm screenshot.',
        },
      ],
    },
  ]);

  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as ScreenshotResult;
  } catch {
    return {
      map: null,
      enemyBans: [],
      allyBans: [],
      enemyPicks: [],
      allyPicks: [],
      phase: 'ban-1',
    };
  }
}
