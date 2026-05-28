export interface GameMap {
  id: string;
  name: string;
  strengths: string[];
  description: string;
}

export const MAPS: GameMap[] = [
  {
    id: 'alterac-pass',
    name: 'Alterac Pass',
    strengths: ['teamfight', 'brawlers', 'sustain'],
    description: 'Extended teamfights around objectives. Brawlers and sustain compositions excel.',
  },
  {
    id: 'battlefield-of-eternity',
    name: 'Battlefield of Eternity',
    strengths: ['burst damage', 'sustain healers', 'single target'],
    description: 'Race to burn down the Immortal. Burst damage and sustain healers are key.',
  },
  {
    id: 'blackhearts-bay',
    name: "Blackheart's Bay",
    strengths: ['split push', 'waveclear', 'globals'],
    description: 'Coin collection rewards split push and waveclear. Globals shine.',
  },
  {
    id: 'braxis-holdout',
    name: 'Braxis Holdout',
    strengths: ['summons', 'solo lane', 'waveclear'],
    description: 'Dual-lane control. Strong solo laners and waveclear are essential.',
  },
  {
    id: 'cursed-hollow',
    name: 'Cursed Hollow',
    strengths: ['sustain', 'CC', 'rotation'],
    description: 'Large map with roaming tributes. Sustain and heavy CC compositions thrive.',
  },
  {
    id: 'dragon-shire',
    name: 'Dragon Shire',
    strengths: ['dive', 'mobility', 'dual soak'],
    description: 'Dual shrine control. Dive compositions and mobility are highly valued.',
  },
  {
    id: 'garden-of-terror',
    name: 'Garden of Terror',
    strengths: ['poke', 'siege', 'sustain'],
    description: 'Three-lane map with seed objectives. Poke and siege damage are effective.',
  },
  {
    id: 'hanamura-temple',
    name: 'Hanamura Temple',
    strengths: ['poke', 'sustain', 'AoE'],
    description: 'Payload escort map. Poke, sustain, and AoE compositions dominate.',
  },
  {
    id: 'infernal-shrines',
    name: 'Infernal Shrines',
    strengths: ['burst AoE', 'teamfight', 'waveclear'],
    description: 'Kill guardians fast. Burst AoE and strong teamfighting are crucial.',
  },
  {
    id: 'sky-temple',
    name: 'Sky Temple',
    strengths: ['poke', 'long range', 'control'],
    description: 'Temple control zones. Poke compositions and long-range heroes excel.',
  },
  {
    id: 'tomb-of-the-spider-queen',
    name: 'Tomb of the Spider Queen',
    strengths: ['waveclear', 'split push', 'sustain'],
    description: 'Small map focused on gem collection. Waveclear and split push specialists thrive.',
  },
  {
    id: 'volskaya-foundry',
    name: 'Volskaya Foundry',
    strengths: ['CC', 'teamfight', 'AoE'],
    description: 'Conveyors add positioning dynamics. CC-heavy teamfight compositions are ideal.',
  },
  {
    id: 'towers-of-doom',
    name: 'Towers of Doom',
    strengths: ['sustain', 'control', 'teamfight'],
    description: 'Core cannot be attacked directly. Altar control deals core damage. Sustain and teamfight compositions excel.',
  },
  {
    id: 'warhead-junction',
    name: 'Warhead Junction',
    strengths: ['poke', 'structures', 'globals'],
    description: 'Large map with scattered nukes. Poke, siege, and global heroes dominate.',
  },
];

export const MAPS_BY_ID: Record<string, GameMap> = Object.fromEntries(
  MAPS.map(m => [m.id, m])
);

/** Number of lanes per battleground (used to group the map selector). */
export const MAP_LANES: Record<string, 2 | 3> = {
  'alterac-pass': 3,
  'battlefield-of-eternity': 2,
  'blackhearts-bay': 3,
  'braxis-holdout': 2,
  'cursed-hollow': 3,
  'dragon-shire': 3,
  'garden-of-terror': 3,
  'hanamura-temple': 2,
  'infernal-shrines': 3,
  'sky-temple': 3,
  'tomb-of-the-spider-queen': 3,
  'volskaya-foundry': 3,
  'towers-of-doom': 3,
  'warhead-junction': 3,
};
