import type { Hero, HeroMeta, HeroRole, DraftStep } from '../types';
import { HEROES } from '../data/heroes';
import { getHeroMapAffinity, MAP_TRAIT_WEIGHTS } from '../data/heroTraits';
import { getSynergy, getCounter } from './matchupData';

// How strongly the data-driven matchup deltas (WR swing in points) weigh into scoring.
const SYNERGY_FACTOR = 1.5;   // bonus per synergy point with an ally
const COUNTER_FACTOR = 1.5;   // bonus per point our hero counters an enemy
const COUNTERED_PENALTY = 1;  // penalty per point an enemy counters our hero
// Minimum WR swing (points) to surface a relationship as a written reason.
const REASON_THRESHOLD = 3;

// --- Composition rules ---

interface CompCheck {
  label: string;
  ok: boolean;
  detail: string;
}

const ROLE_NEEDS: { role: HeroRole; min: number; label: string }[] = [
  { role: 'Tank', min: 1, label: 'Tank' },
  { role: 'Healer', min: 1, label: 'Healer' },
];

// Heroes with hard CC (stun, root, silence, displacement)
const HARD_CC_HEROES = new Set([
  'Anub\'arak', 'Arthas', 'Blaze', 'Diablo', 'E.T.C.', 'Garrosh', 'Johanna',
  'Mal\'Ganis', 'Mei', 'Muradin', 'Stitches', 'Tyrael',
  'Artanis', 'Dehaka', 'Imperius', 'Thrall', 'Yrel',
  'Alarak', 'Kerrigan', 'Maiev', 'Qhira',
  'Brightwing', 'Deckard', 'Stukov', 'Uther', 'Tyrande',
  'Jaina', 'Kael\'thas', 'Kel\'Thuzad', 'Chromie', 'Mephisto',
  'Zarya', 'Xul',
]);

// Heroes with strong waveclear
const WAVECLEAR_HEROES = new Set([
  'Johanna', 'Leoric', 'Ragnaros', 'Xul', 'Azmodan', 'Gul\'dan',
  'Jaina', 'Kael\'thas', 'Falstad', 'Sylvanas', 'Zagara', 'Nazeebo',
  'Fenix', 'Tassadar', 'Probius', 'Gazlowe', 'Blaze',
]);

// Synergy & counter relationships are no longer hardcoded — they come from the per-map
// matchup dataset (matchups.json) via getSynergy / getCounter in ./matchupData.

// --- Analysis functions ---

export interface PickSuggestion {
  hero: Hero;
  meta: HeroMeta | null;
  score: number;
  reasons: string[];
}

export interface BanSuggestion {
  hero: Hero;
  meta: HeroMeta;
  score: number;
  reasons: string[];
}

export interface DraftAnalysis {
  compChecks: CompCheck[];
  pickSuggestions: PickSuggestion[];
  banSuggestions: BanSuggestion[];
  synergiesFound: string[];
  warnings: string[];
}

function getTeamHeroes(steps: DraftStep[], team: 'ally' | 'enemy'): Hero[] {
  return steps
    .filter(s => s.team === team && s.action === 'pick' && s.hero)
    .map(s => s.hero!);
}

function takenNames(steps: DraftStep[]): Set<string> {
  const taken = new Set(steps.filter(s => s.hero).map(s => s.hero!.name));
  // Cho'Gall: either half present blocks both.
  if (taken.has('Cho')) taken.add('Gall');
  if (taken.has('Gall')) taken.add('Cho');
  return taken;
}

function getAvailableHeroes(steps: DraftStep[]): Hero[] {
  const taken = takenNames(steps);
  return HEROES.filter(h => !taken.has(h.name));
}

function checkComposition(allyPicks: Hero[]): CompCheck[] {
  const checks: CompCheck[] = [];
  const roles = allyPicks.map(h => h.role);

  // Role checks
  for (const need of ROLE_NEEDS) {
    const count = roles.filter(r => r === need.role).length;
    checks.push({
      label: need.label,
      ok: count >= need.min,
      detail: count >= need.min
        ? `${need.label}: ${allyPicks.filter(h => h.role === need.role).map(h => h.name).join(', ')}`
        : `Missing ${need.label}!`,
    });
  }

  // CC check
  const ccCount = allyPicks.filter(h => HARD_CC_HEROES.has(h.name)).length;
  checks.push({
    label: 'CC',
    ok: ccCount >= 2,
    detail: ccCount >= 2
      ? `${ccCount} heroes with hard CC`
      : ccCount === 0
        ? 'No hard CC in team!'
        : `Only ${ccCount} hero with CC — risky`,
  });

  // Waveclear
  const wcCount = allyPicks.filter(h => WAVECLEAR_HEROES.has(h.name)).length;
  checks.push({
    label: 'Waveclear',
    ok: wcCount >= 1,
    detail: wcCount >= 1
      ? `${wcCount} hero(es) with waveclear`
      : 'No waveclear — will lose soak',
  });

  // Damage balance
  const melee = allyPicks.filter(h => ['Tank', 'Bruiser', 'Melee Assassin'].includes(h.role)).length;
  const ranged = allyPicks.filter(h => ['Ranged Assassin'].includes(h.role)).length;
  if (allyPicks.length >= 3) {
    checks.push({
      label: 'Damage',
      ok: ranged >= 1,
      detail: ranged >= 1
        ? `${ranged} ranged DPS`
        : 'No ranged damage — vulnerable to kiting',
    });
    if (melee >= 4) {
      checks.push({
        label: 'Balance',
        ok: false,
        detail: 'Too many melee — easy to AoE',
      });
    }
  }

  return checks;
}

function findSynergies(allyPicks: Hero[], mapId: string | null): string[] {
  const found: { text: string; delta: number }[] = [];
  for (let i = 0; i < allyPicks.length; i++) {
    for (let j = i + 1; j < allyPicks.length; j++) {
      const a = allyPicks[i].name, b = allyPicks[j].name;
      const delta = getSynergy(mapId, a, b);
      if (delta >= REASON_THRESHOLD) {
        found.push({ text: `${a} + ${b}: +${delta.toFixed(1)}% win rate together`, delta });
      }
    }
  }
  return found.sort((x, y) => y.delta - x.delta).map(f => f.text);
}

function scorePick(
  hero: Hero,
  meta: HeroMeta | null,
  allyPicks: Hero[],
  enemyPicks: Hero[],
  allyRoles: HeroRole[],
  mapId: string | null,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // PRIMARY: Win rate on this map (real data from HeroesProfile)
  if (meta) {
    const wrScore = (meta.winRate - 45) * 4; // 50% = 20pts, 55% = 40pts — heavily weighted
    score += wrScore;
    if (meta.winRate >= 52) reasons.push(`${meta.winRate.toFixed(1)}% WR`);

    // Meta presence — high pick+ban = proven strong
    if (meta.pickRate >= 10) {
      score += meta.pickRate * 0.3;
      if (meta.pickRate >= 15) reasons.push(`${meta.pickRate.toFixed(0)}% pick rate`);
    }
    if (meta.banRate >= 10) {
      score += meta.banRate * 0.2;
    }

    // Sample size confidence
    if (meta.gamesPlayed >= 200) score += 5;
    else if (meta.gamesPlayed >= 100) score += 2;
    else if (meta.gamesPlayed < 50) score -= 15;
  }

  // SECONDARY: Map affinity (trait matching — bonus, not driver)
  if (mapId) {
    const affinity = getHeroMapAffinity(hero.name, mapId);
    score += affinity.score * 0.8; // 0-8 points max (was 15, now much less)
    if (affinity.score >= 7 && affinity.reasons.length > 0) {
      reasons.push(`Map: ${affinity.reasons[0]}`);
    }
  }

  // Fills needed role
  const hasTank = allyRoles.includes('Tank');
  const hasHealer = allyRoles.includes('Healer');
  if (!hasTank && hero.role === 'Tank') {
    score += 15;
    reasons.push('Team needs a Tank');
  }
  if (!hasHealer && hero.role === 'Healer') {
    score += 15;
    reasons.push('Team needs a Healer');
  }

  // Synergy with allies (data-driven, per map). Positive = good pairing, negative = clashes.
  for (const ally of allyPicks) {
    const delta = getSynergy(mapId, hero.name, ally.name);
    if (delta !== 0) {
      score += delta * SYNERGY_FACTOR;
      if (delta >= REASON_THRESHOLD) reasons.push(`+${delta.toFixed(1)}% with ${ally.name}`);
    }
  }

  // Counters vs enemies, and being countered by them (data-driven, per map).
  for (const enemy of enemyPicks) {
    const counters = getCounter(mapId, hero.name, enemy.name);
    if (counters > 0) {
      score += counters * COUNTER_FACTOR;
      if (counters >= REASON_THRESHOLD) reasons.push(`Counters ${enemy.name} (+${counters.toFixed(1)}%)`);
    }
    const counteredBy = getCounter(mapId, enemy.name, hero.name);
    if (counteredBy > 0) {
      score -= counteredBy * COUNTERED_PENALTY;
      if (counteredBy >= REASON_THRESHOLD) reasons.push(`⚠ Countered by ${enemy.name} (-${counteredBy.toFixed(1)}%)`);
    }
  }

  // CC bonus when team lacks it
  const teamCC = allyPicks.filter(h => HARD_CC_HEROES.has(h.name)).length;
  if (teamCC < 2 && HARD_CC_HEROES.has(hero.name)) {
    score += 5;
    reasons.push('Adds hard CC to team');
  }

  // Waveclear bonus when team lacks it
  const teamWC = allyPicks.filter(h => WAVECLEAR_HEROES.has(h.name)).length;
  if (teamWC === 0 && WAVECLEAR_HEROES.has(hero.name)) {
    score += 5;
    reasons.push('Adds waveclear');
  }

  // Popularity/meta weight (high pick+ban = meta hero)
  if (meta && (meta.pickRate + meta.banRate) >= 30) {
    score += 5;
    reasons.push('High priority in meta');
  }

  return { score, reasons };
}

function scoreBan(
  hero: Hero,
  meta: HeroMeta,
  allyPicks: Hero[],
  enemyPicks: Hero[],
  mapId: string | null,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // PRIMARY: High win rate + high presence = ban-worthy
  if (meta.winRate >= 52) {
    score += (meta.winRate - 48) * 4;
    reasons.push(`${meta.winRate.toFixed(1)}% WR`);
  }

  // High pick rate = consistently strong, worth banning
  if (meta.pickRate >= 10) {
    score += meta.pickRate * 0.5;
    if (meta.pickRate >= 15) reasons.push(`${meta.pickRate.toFixed(0)}% pick rate`);
  }

  // High ban rate combined with high WR = community consensus ban
  if (meta.banRate >= 10 && meta.winRate >= 51) {
    score += meta.banRate * 0.3;
  }

  // SECONDARY: Map affinity bonus
  if (mapId) {
    const affinity = getHeroMapAffinity(hero.name, mapId);
    if (affinity.score >= 7) {
      score += affinity.score * 0.5;
      if (affinity.reasons.length > 0) reasons.push(`Map: ${affinity.reasons[0]}`);
    }
  }

  // Already highly banned = community consensus
  if (meta.banRate >= 20) {
    score += 5;
    reasons.push(`${meta.banRate.toFixed(1)}% ban rate — widely feared`);
  }

  // Would counter our picks (ban to protect them) — data-driven, per map.
  for (const ally of allyPicks) {
    const c = getCounter(mapId, hero.name, ally.name);
    if (c >= REASON_THRESHOLD) {
      score += c * 1.2;
      reasons.push(`Would counter your ${ally.name} (+${c.toFixed(1)}%)`);
    }
  }

  // Would pair strongly with the enemy team — data-driven, per map.
  for (const enemy of enemyPicks) {
    const s = getSynergy(mapId, hero.name, enemy.name);
    if (s >= REASON_THRESHOLD) {
      score += s;
      reasons.push(`Would pair with enemy ${enemy.name} (+${s.toFixed(1)}%)`);
    }
  }

  // Sample size confidence
  if (meta.gamesPlayed < 50) score -= 15;

  return { score, reasons };
}

export function analyzeDraft(
  steps: DraftStep[],
  meta: HeroMeta[],
  mapId: string | null = null,
): DraftAnalysis {
  const allyPicks = getTeamHeroes(steps, 'ally');
  const enemyPicks = getTeamHeroes(steps, 'enemy');
  const available = getAvailableHeroes(steps);
  const allyRoles = allyPicks.map(h => h.role);
  const metaMap = new Map(meta.map(m => [m.hero, m]));

  // Composition analysis
  const compChecks = checkComposition(allyPicks);
  const synergiesFound = findSynergies(allyPicks, mapId);

  // Warnings
  const warnings: string[] = [];
  const allyPickCount = allyPicks.length;
  if (allyPickCount >= 3 && !allyRoles.includes('Tank')) {
    warnings.push('You have 3+ picks but no Tank — pick one soon!');
  }
  if (allyPickCount >= 3 && !allyRoles.includes('Healer')) {
    warnings.push('You have 3+ picks but no Healer — pick one soon!');
  }
  if (allyPickCount >= 4) {
    const ccCount = allyPicks.filter(h => HARD_CC_HEROES.has(h.name)).length;
    if (ccCount < 2) warnings.push('Low CC — enemy can play freely');
  }

  // Pick suggestions
  const pickScores = available
    .map(hero => {
      const heroMeta = metaMap.get(hero.name) ?? null;
      const { score, reasons } = scorePick(hero, heroMeta, allyPicks, enemyPicks, allyRoles, mapId);
      return { hero, meta: heroMeta, score, reasons };
    })
    .filter(s => s.reasons.length > 0 || (s.meta && s.meta.gamesPlayed >= 50))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Ban suggestions
  const banScores = available
    .filter(h => {
      const m = metaMap.get(h.name);
      return m && m.gamesPlayed >= 50;
    })
    .map(hero => {
      const heroMeta = metaMap.get(hero.name)!;
      const { score, reasons } = scoreBan(hero, heroMeta, allyPicks, enemyPicks, mapId);
      return { hero, meta: heroMeta, score, reasons };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    compChecks,
    pickSuggestions: pickScores,
    banSuggestions: banScores,
    synergiesFound,
    warnings,
  };
}

// --- Full comp suggestion ---

export interface CompSuggestion {
  heroes: { hero: Hero; role: string; reason: string }[];
  strategy: string;
}

/**
 * Suggests a full 5-hero composition for the map, excluding any already
 * banned/picked heroes. `variation` re-rolls among the top candidates per slot
 * (0 = strongest comp, higher = alternative strong comps) so the user can ask
 * for more suggestions.
 */
export function suggestFullComp(
  steps: DraftStep[],
  meta: HeroMeta[],
  mapId: string | null,
  variation = 0,
): CompSuggestion {
  const taken = takenNames(steps);
  const allyPicks = steps
    .filter(s => s.team === 'ally' && s.action === 'pick' && s.hero)
    .map(s => s.hero!);
  const enemyPicks = steps
    .filter(s => s.team === 'enemy' && s.action === 'pick' && s.hero)
    .map(s => s.hero!);
  const metaMap = new Map(meta.map(m => [m.hero, m]));

  // Full template: 1 Tank, 1 Healer, 1 Bruiser/Solo, 2 DPS (flex)
  const allSlots: { role: HeroRole[]; label: string }[] = [
    { role: ['Tank'], label: 'Tank' },
    { role: ['Healer'], label: 'Healer' },
    { role: ['Bruiser'], label: 'Offlane' },
    { role: ['Ranged Assassin'], label: 'Ranged DPS' },
    { role: ['Ranged Assassin', 'Melee Assassin', 'Support'], label: 'Flex' },
  ];

  // Remove slots already covered by ally picks
  const allyRoles = allyPicks.map(h => h.role);
  const slots = allSlots.filter(slot => {
    // For single-role slots, skip if an ally already fills it
    if (slot.role.length === 1) {
      const idx = allyRoles.indexOf(slot.role[0]);
      if (idx !== -1) {
        allyRoles.splice(idx, 1); // consume only once (don't skip both DPS slots)
        return false;
      }
    }
    return true;
  });

  // Cap to remaining open ally slots (5 - already picked)
  const remainingSlots = Math.max(0, 5 - allyPicks.length);
  const slotsToFill = slots.slice(0, remainingSlots);

  // Cho'Gall occupies two of the five slots and needs two coordinated players, so
  // it's never auto-suggested as part of a generated comp (it would imply 6 players).
  const CHO_GALL_NAMES = new Set(['Cho', 'Gall']);

  // Per-hero score independent of the rest of the comp: per-map WR + meta presence
  // + map affinity + counters vs the current enemy picks.
  const baseScore = (h: Hero): number => {
    const m = metaMap.get(h.name);
    let s = 0;
    if (m && m.gamesPlayed >= 50) s += (m.winRate - 45) * 4;
    if (m && m.gamesPlayed < 50) s -= 15;
    if (m && m.pickRate >= 10) s += m.pickRate * 0.3;
    if (m && m.banRate >= 10) s += m.banRate * 0.2;
    if (mapId) s += getHeroMapAffinity(h.name, mapId).score * 0.8;
    for (const e of enemyPicks) s += getCounter(mapId, h.name, e.name) * COUNTER_FACTOR;
    return s;
  };

  // Beam search over the open role slots: maximise per-map WR + pairwise synergy
  // across the WHOLE comp (not just greedy slot-by-slot). Keep the K best partial
  // comps at each step; `variation` then picks among the K best final comps.
  interface Beam { added: { hero: Hero; role: string }[]; names: Set<string>; score: number; }
  const BEAM_WIDTH = 6;
  const POOL = 10;
  let beams: Beam[] = [{ added: [], names: new Set(allyPicks.map(h => h.name)), score: 0 }];

  for (const slot of slotsToFill) {
    const pool = HEROES
      .filter(h => slot.role.includes(h.role) && !taken.has(h.name) && !CHO_GALL_NAMES.has(h.name))
      .map(h => ({ h, b: baseScore(h) }))
      .sort((x, y) => y.b - x.b)
      .slice(0, POOL);

    const nextBeams: Beam[] = [];
    for (const beam of beams) {
      for (const { h, b } of pool) {
        if (beam.names.has(h.name)) continue;
        let syn = 0;
        for (const ally of allyPicks) syn += getSynergy(mapId, h.name, ally.name) * SYNERGY_FACTOR;
        for (const a of beam.added) syn += getSynergy(mapId, h.name, a.hero.name) * SYNERGY_FACTOR;
        const names = new Set(beam.names); names.add(h.name);
        nextBeams.push({ added: [...beam.added, { hero: h, role: slot.label }], names, score: beam.score + b + syn });
      }
    }
    if (nextBeams.length === 0) break;
    nextBeams.sort((a, b) => b.score - a.score);
    beams = nextBeams.slice(0, BEAM_WIDTH);
  }

  // Pick the variation-th best comp (re-roll cycles alternative strong comps).
  const best = beams.length ? beams[variation % beams.length] : { added: [] as { hero: Hero; role: string }[] };
  const comp = [...allyPicks.map(h => ({ hero: h, role: h.role })), ...best.added];

  const suggestions = best.added.map(({ hero, role }) => {
    const m = metaMap.get(hero.name);
    const reasons: string[] = [];
    if (m && m.winRate >= 52) reasons.push(`${m.winRate.toFixed(1)}% WR`);
    let partner: string | null = null, bestDelta = 0;
    for (const other of comp) {
      if (other.hero.name === hero.name) continue;
      const d = getSynergy(mapId, hero.name, other.hero.name);
      if (d > bestDelta) { bestDelta = d; partner = other.hero.name; }
    }
    if (partner && bestDelta >= REASON_THRESHOLD) reasons.push(`+${bestDelta.toFixed(1)}% w/ ${partner}`);
    return { hero, role, reason: reasons[0] ?? role };
  });

  // Build strategy description from map strengths
  let strategy = 'Balanced composition';
  if (mapId) {
    const weights = MAP_TRAIT_WEIGHTS[mapId];
    if (weights) {
      const topTraits = Object.entries(weights)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([t]) => (t as string).replace(/-/g, ' '));
      strategy = `Optimized for ${topTraits.join(', ')}`;
    }
  }

  return { heroes: suggestions, strategy };
}
