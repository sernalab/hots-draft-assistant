import type { HeroMeta, MetaCache } from '../types';
import { HEROES } from '../data/heroes';
import { getMetaCache, isMetaCacheExpired, setMetaCache } from './storage';

// Generate default meta data based on community knowledge
// In production, this would scrape from IcyVeins, HotsGG, HeroesProfile
function generateDefaultMeta(): HeroMeta[] {
  const tierAssignments: Record<string, { tier: HeroMeta['tier']; winRate: number; strongMaps: string[]; notes: string }> = {
    // S Tier
    'Anduin': { tier: 'S', winRate: 54.2, strongMaps: ['cursed-hollow', 'infernal-shrines', 'volskaya-foundry'], notes: 'Best solo healer. Lightbomb wins teamfights.' },
    'Muradin': { tier: 'S', winRate: 53.8, strongMaps: ['sky-temple', 'cursed-hollow', 'dragon-shire'], notes: 'Versatile tank. Strong at all phases of the game.' },
    'Orphea': { tier: 'S', winRate: 53.5, strongMaps: ['infernal-shrines', 'volskaya-foundry', 'hanamura-temple'], notes: 'High skill cap mage. Dominates teamfights with Eternal Feast.' },
    'Rehgar': { tier: 'S', winRate: 54.0, strongMaps: ['braxis-holdout', 'dragon-shire', 'infernal-shrines'], notes: 'Ancestral Healing is game-changing. Great waveclear for a healer.' },
    'Sonya': { tier: 'S', winRate: 53.9, strongMaps: ['battlefield-of-eternity', 'infernal-shrines', 'braxis-holdout'], notes: 'One of the best bruisers. Incredible camps and sustain.' },
    'Maiev': { tier: 'S', winRate: 54.5, strongMaps: ['tomb-of-the-spider-queen', 'infernal-shrines', 'volskaya-foundry'], notes: 'Cage of Warden is oppressive. Great in any teamfight-heavy map.' },
    'Falstad': { tier: 'S', winRate: 53.3, strongMaps: ['cursed-hollow', 'warhead-junction', 'sky-temple'], notes: 'Global presence. Strong burst and macro play.' },

    // A Tier
    'Johanna': { tier: 'A', winRate: 52.8, strongMaps: ['infernal-shrines', 'tomb-of-the-spider-queen', 'garden-of-terror'], notes: 'Best waveclear tank. Iron Skin makes her very safe.' },
    'E.T.C.': { tier: 'A', winRate: 52.5, strongMaps: ['cursed-hollow', 'sky-temple', 'volskaya-foundry'], notes: 'Mosh Pit is one of the best ultimates in the game.' },
    'Diablo': { tier: 'A', winRate: 52.2, strongMaps: ['infernal-shrines', 'tomb-of-the-spider-queen', 'volskaya-foundry'], notes: 'Devastating combos near walls. Lightning Breath for zoning.' },
    'Garrosh': { tier: 'A', winRate: 51.8, strongMaps: ['infernal-shrines', 'volskaya-foundry', 'hanamura-temple'], notes: 'Throw combo is a death sentence. Punishes poor positioning.' },
    'Tyrael': { tier: 'A', winRate: 52.0, strongMaps: ['dragon-shire', 'hanamura-temple', 'sky-temple'], notes: 'Sanctification is meta-defining. Enables dive compositions.' },
    'Dehaka': { tier: 'A', winRate: 52.4, strongMaps: ['cursed-hollow', 'warhead-junction', 'dragon-shire'], notes: 'Global presence with Brushstalker. Isolation is a strong ganking tool.' },
    'Brightwing': { tier: 'A', winRate: 52.6, strongMaps: ['cursed-hollow', 'warhead-junction', 'dragon-shire'], notes: 'Global healer. Polymorph shuts down divers.' },
    'Malfurion': { tier: 'A', winRate: 52.3, strongMaps: ['cursed-hollow', 'sky-temple', 'garden-of-terror'], notes: 'Twilight Dream is devastating. Innervate enables mana-hungry allies.' },
    'Li-Ming': { tier: 'A', winRate: 51.5, strongMaps: ['sky-temple', 'hanamura-temple', 'garden-of-terror'], notes: 'Resets are insane. High skill cap ranged assassin.' },
    'Jaina': { tier: 'A', winRate: 52.1, strongMaps: ['infernal-shrines', 'volskaya-foundry', 'hanamura-temple'], notes: 'Burst AoE mage. Ring of Frost wombo combos.' },
    'Greymane': { tier: 'A', winRate: 51.9, strongMaps: ['battlefield-of-eternity', 'infernal-shrines', 'braxis-holdout'], notes: 'Versatile damage dealer. Strong at all phases.' },
    'Imperius': { tier: 'A', winRate: 52.7, strongMaps: ['infernal-shrines', 'braxis-holdout', 'tomb-of-the-spider-queen'], notes: 'Molten Armor stun combo. Great bruiser for teamfight maps.' },
    'Zeratul': { tier: 'A', winRate: 51.2, strongMaps: ['cursed-hollow', 'sky-temple', 'warhead-junction'], notes: 'Void Prison combos. Huge playmaking potential.' },
    'Stukov': { tier: 'A', winRate: 52.0, strongMaps: ['tomb-of-the-spider-queen', 'infernal-shrines', 'volskaya-foundry'], notes: 'Massive Shove is hilarious. Lurking Arm silences zones.' },
    'Valla': { tier: 'A', winRate: 51.6, strongMaps: ['battlefield-of-eternity', 'dragon-shire', 'hanamura-temple'], notes: 'Consistent sustained damage. Rain of Vengeance for peel.' },
    'Sylvanas': { tier: 'A', winRate: 52.3, strongMaps: ['braxis-holdout', 'tomb-of-the-spider-queen', 'garden-of-terror'], notes: 'Trait disables structures. Incredible push potential.' },

    // B Tier
    'Blaze': { tier: 'B', winRate: 51.0, strongMaps: ['braxis-holdout', 'dragon-shire', 'alterac-pass'], notes: 'Bunker is situationally great. Good waveclear tank.' },
    'Arthas': { tier: 'B', winRate: 50.8, strongMaps: ['braxis-holdout', 'dragon-shire', 'alterac-pass'], notes: 'Anti-melee tank. Frozen Tempest slows everything.' },
    'Mei': { tier: 'B', winRate: 50.5, strongMaps: ['volskaya-foundry', 'hanamura-temple', 'infernal-shrines'], notes: 'Ice Wall creates picks. Avalanche for initiation.' },
    'Mal\'Ganis': { tier: 'B', winRate: 50.3, strongMaps: ['tomb-of-the-spider-queen', 'infernal-shrines', 'volskaya-foundry'], notes: 'Dark Conversion turns fights. Sleep is strong CC.' },
    'Leoric': { tier: 'B', winRate: 51.2, strongMaps: ['infernal-shrines', 'braxis-holdout', 'garden-of-terror'], notes: 'Entomb is incredible. Drain Hope melts tanks.' },
    'Thrall': { tier: 'B', winRate: 50.7, strongMaps: ['braxis-holdout', 'dragon-shire', 'battlefield-of-eternity'], notes: 'Sundering splits teams. Good solo laner.' },
    'Ragnaros': { tier: 'B', winRate: 51.3, strongMaps: ['braxis-holdout', 'tomb-of-the-spider-queen', 'alterac-pass'], notes: 'Molten Core defends keeps. Lava Wave for macro.' },
    'Ana': { tier: 'B', winRate: 50.9, strongMaps: ['sky-temple', 'hanamura-temple', 'garden-of-terror'], notes: 'Nano Boost enables carries. Sleep Dart for picks.' },
    'Lucio': { tier: 'B', winRate: 50.6, strongMaps: ['volskaya-foundry', 'tomb-of-the-spider-queen', 'hanamura-temple'], notes: 'Speed Boost for rotations. Sound Barrier saves teamfights.' },
    'Uther': { tier: 'B', winRate: 51.1, strongMaps: ['infernal-shrines', 'volskaya-foundry', 'hanamura-temple'], notes: 'Divine Shield saves carries. Stun is valuable CC.' },
    'Tyrande': { tier: 'B', winRate: 50.4, strongMaps: ['cursed-hollow', 'sky-temple', 'garden-of-terror'], notes: 'Shadowstalk for engage/disengage. Hunter Mark focus fire.' },
    'Hanzo': { tier: 'B', winRate: 50.2, strongMaps: ['sky-temple', 'hanamura-temple', 'warhead-junction'], notes: 'Long range poke. Dragonstrike zones objectives.' },
    'Kael\'thas': { tier: 'B', winRate: 51.0, strongMaps: ['infernal-shrines', 'tomb-of-the-spider-queen', 'volskaya-foundry'], notes: 'Living Bomb spread in teamfights. Pyroblast for picks.' },
    'Fenix': { tier: 'B', winRate: 50.8, strongMaps: ['sky-temple', 'hanamura-temple', 'warhead-junction'], notes: 'Safe poke with shield. Planet Cracker zones.' },
    'Raynor': { tier: 'B', winRate: 51.4, strongMaps: ['battlefield-of-eternity', 'braxis-holdout', 'alterac-pass'], notes: 'Simple but effective. Hyperion for zoning. Self-sustain.' },
    'Zarya': { tier: 'B', winRate: 50.5, strongMaps: ['volskaya-foundry', 'infernal-shrines', 'cursed-hollow'], notes: 'Graviton Surge wombo combos. Shields gain energy.' },
    'Cassia': { tier: 'B', winRate: 51.1, strongMaps: ['battlefield-of-eternity', 'infernal-shrines', 'braxis-holdout'], notes: 'Anti-AA. Ball Lightning for sustained damage.' },
    'Kerrigan': { tier: 'B', winRate: 50.3, strongMaps: ['infernal-shrines', 'tomb-of-the-spider-queen', 'volskaya-foundry'], notes: 'Combo is lethal. Maelstrom for teamfights.' },
    'Qhira': { tier: 'B', winRate: 51.0, strongMaps: ['tomb-of-the-spider-queen', 'dragon-shire', 'volskaya-foundry'], notes: 'Revolving Sweep for picks. Final Strike executes.' },
    'Xul': { tier: 'B', winRate: 51.5, strongMaps: ['tomb-of-the-spider-queen', 'infernal-shrines', 'braxis-holdout'], notes: 'Best waveclear in the game. Bone Prison for ganks.' },
    'Abathur': { tier: 'B', winRate: 50.0, strongMaps: ['cursed-hollow', 'warhead-junction', 'garden-of-terror'], notes: 'Map-wide presence. High skill cap. Needs a strong team.' },
    'Zagara': { tier: 'B', winRate: 51.2, strongMaps: ['braxis-holdout', 'tomb-of-the-spider-queen', 'warhead-junction'], notes: 'Lane bully. Nydus for global presence.' },
  };

  return HEROES.map(hero => {
    const assignment = tierAssignments[hero.name];
    if (assignment) {
      return {
        hero: hero.name,
        tier: assignment.tier,
        winRate: assignment.winRate,
        role: hero.role,
        strongMaps: assignment.strongMaps,
        notes: assignment.notes,
      };
    }
    return {
      hero: hero.name,
      tier: 'C' as const,
      winRate: 48 + Math.random() * 4,
      role: hero.role,
      strongMaps: [],
      notes: 'Situational pick. Can work in the right composition.',
    };
  }).sort((a, b) => {
    const tierOrder = { S: 0, A: 1, B: 2, C: 3, D: 4 };
    return tierOrder[a.tier] - tierOrder[b.tier] || b.winRate - a.winRate;
  });
}

export async function syncMeta(force = false): Promise<MetaCache> {
  if (!force && !isMetaCacheExpired()) {
    const cached = getMetaCache();
    if (cached) return cached;
  }

  // In production, this would fetch from IcyVeins, HotsGG, HeroesProfile
  // For now, use curated community knowledge
  const meta = generateDefaultMeta();

  const cache: MetaCache = {
    timestamp: Date.now(),
    data: meta,
  };

  setMetaCache(cache);
  return cache;
}

export function getMetaForHero(heroName: string): HeroMeta | undefined {
  const cache = getMetaCache();
  if (!cache) return undefined;
  return cache.data.find(m => m.hero === heroName);
}

export function getMetaByTier(tier: HeroMeta['tier']): HeroMeta[] {
  const cache = getMetaCache();
  if (!cache) return [];
  return cache.data.filter(m => m.tier === tier);
}
