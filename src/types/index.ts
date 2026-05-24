export type HeroRole = 'Tank' | 'Bruiser' | 'Support' | 'Healer' | 'Melee Assassin' | 'Ranged Assassin';

export type Tier = 'S' | 'A' | 'B' | 'C' | 'D';

export type MapFit = 'strong' | 'neutral' | 'weak';

export type DraftPhase =
  | 'ban-1'
  | 'pick-1'
  | 'ban-2'
  | 'pick-2'
  | 'complete';

export type SlotType = 'ban' | 'pick';
export type Team = 'ally' | 'enemy';

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
  role: HeroRole;
  strongMaps: string[];
  notes: string;
}

export interface MetaCache {
  timestamp: number;
  data: HeroMeta[];
}

export interface DraftSlot {
  team: Team;
  type: SlotType;
  index: number;
  hero: Hero | null;
}

export interface DraftState {
  map: string | null;
  phase: DraftPhase;
  enemyBans: (Hero | null)[];
  allyBans: (Hero | null)[];
  enemyPicks: (Hero | null)[];
  allyPicks: (Hero | null)[];
  activeSlot: { team: Team; type: SlotType; index: number } | null;
}

export interface Recommendation {
  hero: string;
  tier: Tier;
  reasoning: string;
  synergyWith: string[];
  counters: string[];
  mapFit: MapFit;
}

export interface DraftAdvice {
  recommendations: Recommendation[];
  teamCompAnalysis: string;
  warning: string | null;
}

export interface UserPreferences {
  heroPool: string[];
  mainRole: HeroRole | null;
  playstyleNotes: string;
}

export interface ScreenshotResult {
  map: string | null;
  enemyBans: string[];
  allyBans: string[];
  enemyPicks: string[];
  allyPicks: string[];
  phase: DraftPhase;
}
