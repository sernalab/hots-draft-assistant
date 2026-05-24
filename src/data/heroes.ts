import type { Hero, HeroRole } from '../types';

interface HeroData {
  name: string;
  role: HeroRole;
}

const heroesRaw: HeroData[] = [
  // Tanks
  { name: 'Anub\'arak', role: 'Tank' },
  { name: 'Arthas', role: 'Tank' },
  { name: 'Blaze', role: 'Tank' },
  { name: 'Cho', role: 'Tank' },
  { name: 'Diablo', role: 'Tank' },
  { name: 'E.T.C.', role: 'Tank' },
  { name: 'Garrosh', role: 'Tank' },
  { name: 'Johanna', role: 'Tank' },
  { name: 'Mal\'Ganis', role: 'Tank' },
  { name: 'Mei', role: 'Tank' },
  { name: 'Muradin', role: 'Tank' },
  { name: 'Stitches', role: 'Tank' },
  { name: 'Tyrael', role: 'Tank' },

  // Bruisers
  { name: 'Artanis', role: 'Bruiser' },
  { name: 'Chen', role: 'Bruiser' },
  { name: 'D.Va', role: 'Bruiser' },
  { name: 'Deathwing', role: 'Bruiser' },
  { name: 'Dehaka', role: 'Bruiser' },
  { name: 'Gazlowe', role: 'Bruiser' },
  { name: 'Hogger', role: 'Bruiser' },
  { name: 'Imperius', role: 'Bruiser' },
  { name: 'Leoric', role: 'Bruiser' },
  { name: 'Malthael', role: 'Bruiser' },
  { name: 'Ragnaros', role: 'Bruiser' },
  { name: 'Rexxar', role: 'Bruiser' },
  { name: 'Sonya', role: 'Bruiser' },
  { name: 'Thrall', role: 'Bruiser' },
  { name: 'Varian', role: 'Bruiser' },
  { name: 'Xul', role: 'Bruiser' },
  { name: 'Yrel', role: 'Bruiser' },

  // Healers
  { name: 'Alexstrasza', role: 'Healer' },
  { name: 'Ana', role: 'Healer' },
  { name: 'Anduin', role: 'Healer' },
  { name: 'Auriel', role: 'Healer' },
  { name: 'Brightwing', role: 'Healer' },
  { name: 'Deckard', role: 'Healer' },
  { name: 'Kharazim', role: 'Healer' },
  { name: 'Li Li', role: 'Healer' },
  { name: 'Lt. Morales', role: 'Healer' },
  { name: 'Lucio', role: 'Healer' },
  { name: 'Malfurion', role: 'Healer' },
  { name: 'Rehgar', role: 'Healer' },
  { name: 'Stukov', role: 'Healer' },
  { name: 'Tyrande', role: 'Healer' },
  { name: 'Uther', role: 'Healer' },
  { name: 'Whitemane', role: 'Healer' },

  // Supports
  { name: 'Abathur', role: 'Support' },
  { name: 'Medivh', role: 'Support' },
  { name: 'The Lost Vikings', role: 'Support' },
  { name: 'Zarya', role: 'Support' },

  // Melee Assassins
  { name: 'Alarak', role: 'Melee Assassin' },
  { name: 'Illidan', role: 'Melee Assassin' },
  { name: 'Kerrigan', role: 'Melee Assassin' },
  { name: 'Maiev', role: 'Melee Assassin' },
  { name: 'Murky', role: 'Melee Assassin' },
  { name: 'Qhira', role: 'Melee Assassin' },
  { name: 'Samuro', role: 'Melee Assassin' },
  { name: 'The Butcher', role: 'Melee Assassin' },
  { name: 'Valeera', role: 'Melee Assassin' },
  { name: 'Zeratul', role: 'Melee Assassin' },

  // Ranged Assassins
  { name: 'Azmodan', role: 'Ranged Assassin' },
  { name: 'Cassia', role: 'Ranged Assassin' },
  { name: 'Chromie', role: 'Ranged Assassin' },
  { name: 'Falstad', role: 'Ranged Assassin' },
  { name: 'Fenix', role: 'Ranged Assassin' },
  { name: 'Gall', role: 'Ranged Assassin' },
  { name: 'Genji', role: 'Ranged Assassin' },
  { name: 'Greymane', role: 'Ranged Assassin' },
  { name: 'Gul\'dan', role: 'Ranged Assassin' },
  { name: 'Hanzo', role: 'Ranged Assassin' },
  { name: 'Jaina', role: 'Ranged Assassin' },
  { name: 'Junkrat', role: 'Ranged Assassin' },
  { name: 'Kael\'thas', role: 'Ranged Assassin' },
  { name: 'Kel\'Thuzad', role: 'Ranged Assassin' },
  { name: 'Li-Ming', role: 'Ranged Assassin' },
  { name: 'Lunara', role: 'Ranged Assassin' },
  { name: 'Mephisto', role: 'Ranged Assassin' },
  { name: 'Nazeebo', role: 'Ranged Assassin' },
  { name: 'Nova', role: 'Ranged Assassin' },
  { name: 'Orphea', role: 'Ranged Assassin' },
  { name: 'Probius', role: 'Ranged Assassin' },
  { name: 'Raynor', role: 'Ranged Assassin' },
  { name: 'Sgt. Hammer', role: 'Ranged Assassin' },
  { name: 'Sylvanas', role: 'Ranged Assassin' },
  { name: 'Tassadar', role: 'Ranged Assassin' },
  { name: 'Tracer', role: 'Ranged Assassin' },
  { name: 'Tychus', role: 'Ranged Assassin' },
  { name: 'Valla', role: 'Ranged Assassin' },
  { name: 'Zagara', role: 'Ranged Assassin' },
  { name: 'Zul\'jin', role: 'Ranged Assassin' },
];

function heroId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export const HEROES: Hero[] = heroesRaw.map(h => ({
  id: heroId(h.name),
  name: h.name,
  role: h.role,
  icon: `https://heroespatchnotes.github.io/heroes-talents/images/heroes/${heroId(h.name)}.png`,
}));

export const HEROES_BY_ID: Record<string, Hero> = Object.fromEntries(
  HEROES.map(h => [h.id, h])
);

export const HEROES_BY_NAME: Record<string, Hero> = Object.fromEntries(
  HEROES.map(h => [h.name.toLowerCase(), h])
);

export function findHero(query: string): Hero | undefined {
  const q = query.toLowerCase().trim();
  return HEROES.find(h =>
    h.name.toLowerCase() === q ||
    h.id === q ||
    h.name.toLowerCase().includes(q)
  );
}

export function searchHeroes(query: string, roleFilter?: HeroRole): Hero[] {
  const q = query.toLowerCase().trim();
  return HEROES.filter(h => {
    const matchesRole = !roleFilter || h.role === roleFilter;
    const matchesQuery = !q || h.name.toLowerCase().includes(q);
    return matchesRole && matchesQuery;
  });
}
