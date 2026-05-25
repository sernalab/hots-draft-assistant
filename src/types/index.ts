export type HeroRole = 'Tank' | 'Bruiser' | 'Support' | 'Healer' | 'Melee Assassin' | 'Ranged Assassin';

export type Tier = 'S' | 'A' | 'B' | 'C' | 'D';

export type Team = 'ally' | 'enemy';
export type ActionType = 'ban' | 'pick';

export interface Hero {
  id: string;
  name: string;
  role: HeroRole;
  icon: string;
}

export interface HeroMeta {
  hero: string;
  tier: Tier;
  winRate: number;
  pickRate: number;
  banRate: number;
  gamesPlayed: number;
  role: HeroRole;
  influence: number;
}

export interface MetaCache {
  timestamp: number;
  data: HeroMeta[];
  map: string | null;
  rank: number | null;
}

export type SortField = 'winRate' | 'pickRate' | 'banRate' | 'gamesPlayed';

export const RANK_TIERS = [
  { code: null, name: 'All Ranks' },
  { code: 6, name: 'Master' },
  { code: 5, name: 'Diamond' },
  { code: 4, name: 'Platinum' },
  { code: 3, name: 'Gold' },
  { code: 2, name: 'Silver' },
  { code: 1, name: 'Bronze' },
] as const;

// Each step in the Storm League draft sequence
export interface DraftStep {
  index: number;
  team: Team;
  action: ActionType;
  hero: Hero | null;
}

export interface DraftState {
  map: string | null;
  isFirstPick: boolean;
  steps: DraftStep[];
  activeStepIndex: number | null; // which step is being filled
}

export interface UserPreferences {
  heroPool: string[];
  mainRole: HeroRole | null;
  playstyleNotes: string;
}
