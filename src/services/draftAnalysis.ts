import type { Hero, HeroMeta, HeroRole, DraftStep } from '../types';
import { HEROES } from '../data/heroes';
import { getHeroMapAffinity, MAP_TRAIT_WEIGHTS } from '../data/heroTraits';

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

// Known synergy pairs
const SYNERGIES: [string, string, string][] = [
  ['Zarya', 'E.T.C.', 'Graviton + Mosh Pit combo'],
  ['Zarya', 'Diablo', 'Graviton + Apocalypse combo'],
  ['Zarya', 'Garrosh', 'Graviton + Warlord combo'],
  ['E.T.C.', 'Jaina', 'Mosh Pit + Ring of Frost'],
  ['E.T.C.', 'Kael\'thas', 'Mosh Pit + AoE burst'],
  ['Tyrael', 'Illidan', 'Sanctification enables dive'],
  ['Tyrael', 'Greymane', 'Sanctification + dive damage'],
  ['Abathur', 'Illidan', 'Hat + dive sustain'],
  ['Abathur', 'Greymane', 'Hat + burst amplification'],
  ['Malfurion', 'Jaina', 'Root + Ring of Frost follow-up'],
  ['Uther', 'Valla', 'Divine Shield + aggressive carry'],
  ['Dehaka', 'Zeratul', 'Isolation + Void Prison combo'],
  ['Rehgar', 'Thrall', 'Ancestral + aggressive bruiser'],
  ['Anduin', 'Diablo', 'Lightbomb + displacement'],
  ['Ana', 'Valla', 'Nano Boost + sustained damage'],
  ['Ana', 'Greymane', 'Nano Boost + burst'],
  ['Auriel', 'Gul\'dan', 'Hope battery + sustain damage'],
  ['Auriel', 'Valla', 'Hope battery + consistent DPS'],
  ['Lucio', 'Illidan', 'Speed + dive enabler'],
];

// Counter relationships: [counter, target, reason]
const COUNTERS: [string, string, string][] = [
  ['Anub\'arak', 'Jaina', 'Spell armor + cocoon shuts down mages'],
  ['Anub\'arak', 'Kael\'thas', 'Spell armor absorbs burst'],
  ['Anub\'arak', 'Li-Ming', 'Dive + spell armor vs mage'],
  ['Cassia', 'Valla', 'Blind counters AA heroes'],
  ['Cassia', 'Raynor', 'Blind + avoidance vs AA'],
  ['Cassia', 'Zul\'jin', 'Blind shuts down AA carry'],
  ['Johanna', 'Illidan', 'Blind + CC stops dive'],
  ['Johanna', 'Tracer', 'Blind + unstoppable vs dive'],
  ['Li Li', 'Illidan', 'Blind on trait counters AA dive'],
  ['Li Li', 'Tracer', 'Blind + easy healing vs dive'],
  ['E.T.C.', 'Illidan', 'Displacement + CC stops dive'],
  ['Garrosh', 'Illidan', 'Throw + taunt punishes dive'],
  ['Garrosh', 'Tracer', 'Throw punishes aggressive positioning'],
  ['Arthas', 'Illidan', 'Attack speed slow + root destroys melee'],
  ['Arthas', 'Thrall', 'Frozen Tempest slows melee bruisers'],
  ['Brightwing', 'Illidan', 'Polymorph shuts down dive'],
  ['Brightwing', 'Tracer', 'Polymorph + global presence'],
  ['Tyrael', 'Chromie', 'Dive enables closing gap on long range'],
  ['Zeratul', 'Chromie', 'Dive assassin kills immobile mages'],
  ['Zeratul', 'Sgt. Hammer', 'Dive punishes immobile heroes'],
  ['Malthael', 'Cho', 'Percent damage melts high HP'],
  ['Malthael', 'Deathwing', 'Percent damage ignores armor'],
  ['Tychus', 'Cho', 'Minigun % damage vs high HP'],
  ['Tychus', 'Deathwing', 'Minigun shreds high HP targets'],
];

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

function getAvailableHeroes(steps: DraftStep[]): Hero[] {
  const taken = new Set(
    steps.filter(s => s.hero).map(s => s.hero!.name)
  );
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

function findSynergies(allyPicks: Hero[]): string[] {
  const names = new Set(allyPicks.map(h => h.name));
  const found: string[] = [];
  for (const [a, b, desc] of SYNERGIES) {
    if (names.has(a) && names.has(b)) {
      found.push(`${a} + ${b}: ${desc}`);
    }
  }
  return found;
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

  // Synergy bonus
  const allyNames = new Set(allyPicks.map(h => h.name));
  for (const [a, b, desc] of SYNERGIES) {
    if (hero.name === a && allyNames.has(b)) {
      score += 8;
      reasons.push(`Synergy with ${b}: ${desc}`);
    }
    if (hero.name === b && allyNames.has(a)) {
      score += 8;
      reasons.push(`Synergy with ${a}: ${desc}`);
    }
  }

  // Counter bonus
  const enemyNames = new Set(enemyPicks.map(h => h.name));
  for (const [counter, target, desc] of COUNTERS) {
    if (hero.name === counter && enemyNames.has(target)) {
      score += 10;
      reasons.push(`Counters ${target}: ${desc}`);
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

  // Would counter our team
  const allyNames = new Set(allyPicks.map(h => h.name));
  for (const [counter, target] of COUNTERS) {
    if (hero.name === counter && allyNames.has(target)) {
      score += 8;
      reasons.push(`Would counter your ${target}`);
    }
  }

  // Would synergize with enemy team
  const enemyNames = new Set(enemyPicks.map(h => h.name));
  for (const [a, b, desc] of SYNERGIES) {
    if ((hero.name === a && enemyNames.has(b)) || (hero.name === b && enemyNames.has(a))) {
      score += 6;
      reasons.push(`Would synergize with enemy: ${desc}`);
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
  const synergiesFound = findSynergies(allyPicks);

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
 * Suggests a full 5-hero composition for the map,
 * excluding any already banned/picked heroes.
 */
export function suggestFullComp(
  steps: DraftStep[],
  meta: HeroMeta[],
  mapId: string | null,
): CompSuggestion {
  const taken = new Set(steps.filter(s => s.hero).map(s => s.hero!.name));
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

  const picked = new Set<string>();
  // Seed synergy context with existing ally picks
  const result: { hero: Hero; role: string; reason: string }[] = allyPicks.map(h => ({
    hero: h, role: h.role, reason: 'Already picked',
  }));

  for (const slot of slotsToFill) {
    const candidates = HEROES
      .filter(h => slot.role.includes(h.role) && !taken.has(h.name) && !picked.has(h.name))
      .map(h => {
        const m = metaMap.get(h.name);
        let score = 0;
        const reasons: string[] = [];

        // PRIMARY: Win rate (real data)
        if (m && m.gamesPlayed >= 50) {
          score += (m.winRate - 45) * 4;
          if (m.winRate >= 52) reasons.push(`${m.winRate.toFixed(1)}% WR`);
        }
        if (m && m.gamesPlayed < 50) score -= 15;

        // Meta presence — proven picks
        if (m && m.pickRate >= 10) score += m.pickRate * 0.3;
        if (m && m.banRate >= 10) score += m.banRate * 0.2;
        if (m && (m.pickRate + m.banRate) >= 20) {
          reasons.push(`${(m.pickRate + m.banRate).toFixed(0)}% presence`);
        }

        // SECONDARY: Map affinity (bonus)
        if (mapId) {
          const aff = getHeroMapAffinity(h.name, mapId);
          score += aff.score * 0.8;
          if (aff.reasons.length > 0 && aff.score >= 7) reasons.push(aff.reasons[0]);
        }

        // Synergy with already picked (ally picks + previously suggested)
        for (const prev of result) {
          for (const [a, b] of SYNERGIES) {
            if ((h.name === a && prev.hero.name === b) || (h.name === b && prev.hero.name === a)) {
              score += 6;
              reasons.push(`synergy with ${prev.hero.name}`);
            }
          }
        }

        // Counter bonus vs enemy picks
        const enemyNames = new Set(enemyPicks.map(e => e.name));
        for (const [counter, target, desc] of COUNTERS) {
          if (h.name === counter && enemyNames.has(target)) {
            score += 8;
            reasons.push(`counters ${target}`);
          }
        }

        return { hero: h, score, reason: reasons[0] ?? slot.label };
      })
      .sort((a, b) => b.score - a.score);

    if (candidates.length > 0) {
      const best = candidates[0];
      picked.add(best.hero.name);
      result.push({ hero: best.hero, role: slot.label, reason: best.reason });
    }
  }

  // Remove the seeded ally picks — only return suggestions
  const suggestions = result.filter(r => r.reason !== 'Already picked');

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
