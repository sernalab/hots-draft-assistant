// Hero traits that determine map affinity
// Each hero has gameplay traits; maps reward certain traits

export type HeroTrait =
  | 'global'        // Can rotate across map instantly (Falstad, Dehaka, Brightwing)
  | 'split-push'    // Strong split push / siege (Sylvanas, Zagara, Azmodan)
  | 'waveclear'     // Fast lane clear (Jaina, Johanna, Xul, Kael'thas)
  | 'solo-lane'     // Can hold a lane 1v1 (Sonya, Thrall, Rexxar, Leoric)
  | 'burst-aoe'     // AoE burst damage (Jaina, Kael'thas, Maiev, Kel'Thuzad)
  | 'sustained-dmg' // Consistent DPS over time (Valla, Raynor, Greymane, Lunara)
  | 'poke'          // Long range poke (Chromie, Hanzo, Li-Ming, Fenix)
  | 'dive'          // Can dive backline (Illidan, Zeratul, Genji, Tracer)
  | 'cc-heavy'      // Lots of crowd control (E.T.C., Garrosh, Stitches, Uther)
  | 'sustain-heal'  // Sustained healing over time (Malfurion, Lúcio, Brightwing)
  | 'burst-heal'    // Can burst heal to save (Rehgar, Uther, Anduin)
  | 'camp-clear'    // Fast mercenary camp clear (Sonya, Greymane, Gazlowe)
  | 'obj-control'   // Strong at controlling objectives (zoning, area denial)
  | 'pick-off'      // Can catch isolated targets (Zeratul, Nova, Stitches, Diablo)
  | 'anti-dive'     // Peels and protects vs dive (Johanna, Uther, Brightwing)
  | 'summons'       // Benefits from or creates summons (Zagara, Xul, Abathur)
  | 'mobility'      // High mobility / rotations (Falstad, Genji, Tracer, Zeratul)
  | 'siege'         // Strong structure damage (Sgt. Hammer, Sylvanas, Azmodan)
  | 'teamfight'     // Excels in 5v5 fights (E.T.C., Maiev, Zarya, Jaina)
  | 'point-control' // Holds a point/area well (Gazlowe, Probius, Ragnaros);

export const HERO_TRAITS: Record<string, { traits: HeroTrait[]; mapNotes?: Record<string, string> }> = {
  // --- Tanks ---
  'Anub\'arak':     { traits: ['dive', 'cc-heavy', 'teamfight'], mapNotes: { 'infernal-shrines': 'Cocoon removes key target during shrine fights' } },
  'Arthas':         { traits: ['cc-heavy', 'anti-dive', 'solo-lane', 'teamfight'] },
  'Blaze':          { traits: ['waveclear', 'solo-lane', 'cc-heavy', 'point-control'] },
  'Cho':            { traits: ['sustained-dmg', 'teamfight'] },
  'Diablo':         { traits: ['cc-heavy', 'pick-off', 'teamfight', 'dive'] },
  'E.T.C.':         { traits: ['cc-heavy', 'teamfight', 'dive', 'obj-control'], mapNotes: { 'volskaya-foundry': 'Mosh Pit in tight objective areas', 'infernal-shrines': 'Mosh on shrine cluster' } },
  'Garrosh':        { traits: ['cc-heavy', 'pick-off', 'anti-dive', 'teamfight'] },
  'Johanna':        { traits: ['waveclear', 'cc-heavy', 'anti-dive', 'teamfight'], mapNotes: { 'infernal-shrines': 'Condemn + waveclear clears guardians fast', 'tomb-of-the-spider-queen': 'Waveclear for gem denial' } },
  'Mal\'Ganis':     { traits: ['cc-heavy', 'dive', 'teamfight', 'sustain-heal'] },
  'Mei':            { traits: ['cc-heavy', 'obj-control', 'teamfight', 'anti-dive'] },
  'Muradin':        { traits: ['cc-heavy', 'dive', 'mobility', 'teamfight'] },
  'Stitches':       { traits: ['pick-off', 'cc-heavy', 'obj-control'] },
  'Tyrael':         { traits: ['dive', 'teamfight', 'mobility'], mapNotes: { 'dragon-shire': 'Enables dive on split shrines', 'sky-temple': 'Sanctification on temple fights' } },

  // --- Bruisers ---
  'Artanis':        { traits: ['solo-lane', 'sustained-dmg', 'teamfight'] },
  'Chen':           { traits: ['solo-lane', 'dive', 'mobility'] },
  'D.Va':           { traits: ['mobility', 'obj-control', 'anti-dive'] },
  'Deathwing':      { traits: ['waveclear', 'teamfight', 'siege', 'obj-control'], mapNotes: { 'infernal-shrines': 'AoE clears guardians, unstoppable on shrine' } },
  'Dehaka':         { traits: ['global', 'solo-lane', 'pick-off', 'cc-heavy'], mapNotes: { 'cursed-hollow': 'Global to every tribute', 'warhead-junction': 'Global covers huge map', 'dragon-shire': 'Global between shrines' } },
  'Gazlowe':        { traits: ['camp-clear', 'point-control', 'siege', 'obj-control'], mapNotes: { 'infernal-shrines': 'Turrets help clear guardians', 'braxis-holdout': 'Point control on beacons' } },
  'Hogger':         { traits: ['solo-lane', 'cc-heavy', 'point-control', 'camp-clear'] },
  'Imperius':       { traits: ['solo-lane', 'cc-heavy', 'teamfight', 'dive'] },
  'Leoric':         { traits: ['solo-lane', 'waveclear', 'sustained-dmg', 'siege'] },
  'Malthael':       { traits: ['solo-lane', 'sustained-dmg', 'waveclear', 'camp-clear'] },
  'Ragnaros':       { traits: ['waveclear', 'solo-lane', 'siege', 'point-control'], mapNotes: { 'braxis-holdout': 'Lava Wave clears zerg wave', 'tomb-of-the-spider-queen': 'Waveclear + Molten Core defense' } },
  'Rexxar':         { traits: ['solo-lane', 'camp-clear', 'point-control', 'obj-control'], mapNotes: { 'braxis-holdout': 'Misha holds beacon solo', 'dragon-shire': 'Misha captures shrine while Rexxar soaks' } },
  'Sonya':          { traits: ['solo-lane', 'camp-clear', 'sustained-dmg', 'teamfight'], mapNotes: { 'battlefield-of-eternity': 'Burns immortal fast', 'infernal-shrines': 'Camps + shrine clear' } },
  'Thrall':         { traits: ['solo-lane', 'cc-heavy', 'sustained-dmg', 'teamfight'] },
  'Varian':         { traits: ['solo-lane', 'cc-heavy', 'anti-dive'] },
  'Xul':            { traits: ['waveclear', 'cc-heavy', 'summons', 'siege'], mapNotes: { 'tomb-of-the-spider-queen': 'Best waveclear = gem denial', 'infernal-shrines': 'Skeleton summons on shrine' } },
  'Yrel':           { traits: ['solo-lane', 'sustain-heal', 'cc-heavy', 'point-control'] },

  // --- Healers ---
  'Alexstrasza':    { traits: ['sustain-heal', 'teamfight', 'obj-control'] },
  'Ana':            { traits: ['burst-heal', 'cc-heavy', 'poke'], mapNotes: { 'sky-temple': 'Long range heal + sleep on temple', 'hanamura-temple': 'Nano Boost carry + poke' } },
  'Anduin':         { traits: ['burst-heal', 'teamfight', 'cc-heavy'], mapNotes: { 'infernal-shrines': 'Lightbomb on shrine cluster', 'volskaya-foundry': 'Lightbomb in tight objective' } },
  'Auriel':         { traits: ['sustain-heal', 'cc-heavy', 'teamfight'] },
  'Brightwing':     { traits: ['global', 'sustain-heal', 'anti-dive', 'cc-heavy'], mapNotes: { 'cursed-hollow': 'Global to tributes', 'warhead-junction': 'Global covers map', 'dragon-shire': 'Global between lanes' } },
  'Deckard':        { traits: ['cc-heavy', 'sustain-heal', 'obj-control', 'teamfight'] },
  'Kharazim':       { traits: ['burst-heal', 'dive', 'sustained-dmg', 'mobility'] },
  'Li Li':          { traits: ['sustain-heal', 'anti-dive'] },
  'Lt. Morales':    { traits: ['burst-heal', 'sustained-dmg'] },
  'Lúcio':          { traits: ['sustain-heal', 'mobility', 'teamfight', 'anti-dive'], mapNotes: { 'volskaya-foundry': 'Speed on conveyors + Sound Barrier', 'tomb-of-the-spider-queen': 'Speed for rotations on small map' } },
  'Malfurion':      { traits: ['sustain-heal', 'cc-heavy', 'obj-control'], mapNotes: { 'cursed-hollow': 'Root on tribute + sustain for long fights', 'sky-temple': 'Twilight Dream on temple' } },
  'Rehgar':         { traits: ['burst-heal', 'waveclear', 'camp-clear', 'teamfight'], mapNotes: { 'infernal-shrines': 'Waveclear healer on shrine', 'braxis-holdout': 'Can solo camp + heal' } },
  'Stukov':         { traits: ['sustain-heal', 'cc-heavy', 'obj-control', 'teamfight'] },
  'Tyrande':        { traits: ['burst-heal', 'cc-heavy', 'sustained-dmg', 'pick-off'] },
  'Uther':          { traits: ['burst-heal', 'cc-heavy', 'anti-dive', 'teamfight'] },
  'Whitemane':      { traits: ['sustain-heal', 'teamfight', 'sustained-dmg'] },

  // --- Support ---
  'Abathur':        { traits: ['global', 'split-push', 'siege', 'summons'], mapNotes: { 'cursed-hollow': 'Global soak on huge map', 'warhead-junction': 'Mines + global on biggest map', 'sky-temple': 'Global soak + split push' } },
  'Medivh':         { traits: ['mobility', 'poke', 'teamfight', 'obj-control'] },
  'The Lost Vikings': { traits: ['global', 'split-push', 'solo-lane'], mapNotes: { 'garden-of-terror': 'Triple soak all 3 lanes', 'cursed-hollow': 'XP advantage on large map' } },
  'Zarya':          { traits: ['cc-heavy', 'teamfight', 'anti-dive', 'obj-control'], mapNotes: { 'volskaya-foundry': 'Graviton + tight objective', 'infernal-shrines': 'Graviton on shrine' } },

  // --- Melee Assassins ---
  'Alarak':         { traits: ['pick-off', 'cc-heavy', 'burst-aoe', 'teamfight'] },
  'Illidan':        { traits: ['dive', 'sustained-dmg', 'camp-clear', 'mobility'], mapNotes: { 'battlefield-of-eternity': 'Burns immortal with sustained damage' } },
  'Kerrigan':       { traits: ['dive', 'burst-aoe', 'cc-heavy', 'teamfight'], mapNotes: { 'infernal-shrines': 'Combo on grouped enemies at shrine', 'tomb-of-the-spider-queen': 'Picks in tight corridors' } },
  'Maiev':          { traits: ['burst-aoe', 'cc-heavy', 'teamfight', 'mobility'], mapNotes: { 'infernal-shrines': 'Cage on shrine is devastating', 'tomb-of-the-spider-queen': 'Cage in narrow lanes', 'volskaya-foundry': 'Cage on objective point' } },
  'Murky':          { traits: ['split-push', 'waveclear', 'siege', 'summons'] },
  'Qhira':          { traits: ['dive', 'pick-off', 'sustained-dmg', 'mobility'] },
  'Samuro':         { traits: ['split-push', 'camp-clear', 'mobility', 'pick-off'], mapNotes: { 'cursed-hollow': 'Image soak + camp control', 'warhead-junction': 'Split push on huge map' } },
  'The Butcher':    { traits: ['dive', 'sustained-dmg', 'pick-off', 'camp-clear'] },
  'Valeera':        { traits: ['pick-off', 'dive', 'cc-heavy'] },
  'Zeratul':        { traits: ['dive', 'pick-off', 'mobility', 'teamfight'], mapNotes: { 'cursed-hollow': 'Void Prison on tribute fights + roam', 'warhead-junction': 'Mobility on huge map + VP on nuke fights', 'sky-temple': 'VP zoning on temples', 'dragon-shire': 'VP on shrine contests' } },

  // --- Ranged Assassins ---
  'Azmodan':        { traits: ['siege', 'split-push', 'waveclear', 'poke'] },
  'Cassia':         { traits: ['sustained-dmg', 'anti-dive', 'teamfight'] },
  'Chromie':        { traits: ['poke', 'burst-aoe', 'obj-control'], mapNotes: { 'sky-temple': 'Poke on temple from safety', 'hanamura-temple': 'Poke on payload lanes' } },
  'Falstad':        { traits: ['global', 'burst-aoe', 'poke', 'mobility'], mapNotes: { 'cursed-hollow': 'Global fly to tributes', 'warhead-junction': 'Global on biggest map', 'sky-temple': 'Fly between temples', 'dragon-shire': 'Global between lanes' } },
  'Fenix':          { traits: ['poke', 'sustained-dmg', 'siege', 'waveclear'] },
  'Gall':           { traits: ['burst-aoe', 'poke', 'sustained-dmg'] },
  'Genji':          { traits: ['dive', 'mobility', 'pick-off'], mapNotes: { 'sky-temple': 'Dive + resets on temple fights' } },
  'Greymane':       { traits: ['burst-aoe', 'sustained-dmg', 'camp-clear', 'dive'], mapNotes: { 'battlefield-of-eternity': 'Burns immortal fast', 'infernal-shrines': 'Camp + burst on shrine' } },
  'Gul\'dan':       { traits: ['sustained-dmg', 'waveclear', 'teamfight', 'poke'] },
  'Hanzo':          { traits: ['poke', 'waveclear', 'obj-control'], mapNotes: { 'sky-temple': 'Long range on temples', 'hanamura-temple': 'Poke on payloads', 'warhead-junction': 'Vision + poke' } },
  'Jaina':          { traits: ['burst-aoe', 'waveclear', 'cc-heavy', 'teamfight'], mapNotes: { 'infernal-shrines': 'AoE burst clears guardians', 'volskaya-foundry': 'Ring of Frost on objective', 'tomb-of-the-spider-queen': 'Waveclear + burst in lanes' } },
  'Junkrat':        { traits: ['poke', 'siege', 'obj-control', 'waveclear'] },
  'Kael\'thas':     { traits: ['burst-aoe', 'waveclear', 'teamfight', 'poke'], mapNotes: { 'infernal-shrines': 'Living Bomb spreads on shrine', 'tomb-of-the-spider-queen': 'Waveclear + AoE burst' } },
  'Kel\'Thuzad':    { traits: ['burst-aoe', 'cc-heavy', 'pick-off', 'teamfight'] },
  'Li-Ming':        { traits: ['poke', 'burst-aoe', 'mobility'], mapNotes: { 'sky-temple': 'Poke on temples', 'hanamura-temple': 'Poke + resets', 'tomb-of-the-spider-queen': 'Resets in frequent fights' } },
  'Lunara':         { traits: ['poke', 'sustained-dmg', 'mobility', 'waveclear'] },
  'Mephisto':       { traits: ['burst-aoe', 'waveclear', 'teamfight', 'poke'] },
  'Nazeebo':        { traits: ['sustained-dmg', 'waveclear', 'siege', 'summons'], mapNotes: { 'tomb-of-the-spider-queen': 'Waveclear + late game power' } },
  'Nova':           { traits: ['pick-off', 'burst-aoe', 'poke'] },
  'Orphea':         { traits: ['burst-aoe', 'teamfight', 'sustained-dmg', 'mobility'] },
  'Probius':        { traits: ['point-control', 'waveclear', 'siege', 'obj-control'] },
  'Raynor':         { traits: ['sustained-dmg', 'siege', 'teamfight'], mapNotes: { 'battlefield-of-eternity': 'Sustained DPS burns immortal' } },
  'Sgt. Hammer':    { traits: ['siege', 'poke', 'sustained-dmg'], mapNotes: { 'warhead-junction': 'Siege + nuke pressure' } },
  'Sylvanas':       { traits: ['split-push', 'siege', 'waveclear', 'sustained-dmg'], mapNotes: { 'braxis-holdout': 'Trait disables structures during zerg push', 'tomb-of-the-spider-queen': 'Waveclear + push with spiders', 'garden-of-terror': 'Push with garden terror + disabled structures' } },
  'Tassadar':       { traits: ['poke', 'waveclear', 'sustained-dmg', 'obj-control'] },
  'Tracer':         { traits: ['dive', 'mobility', 'sustained-dmg', 'pick-off'] },
  'Tychus':         { traits: ['sustained-dmg', 'camp-clear', 'teamfight'] },
  'Valla':          { traits: ['sustained-dmg', 'burst-aoe', 'teamfight'], mapNotes: { 'battlefield-of-eternity': 'Burns immortal with sustained DPS' } },
  'Zagara':         { traits: ['split-push', 'waveclear', 'summons', 'solo-lane', 'siege'], mapNotes: { 'braxis-holdout': 'Lane bully + Nydus for rotation', 'tomb-of-the-spider-queen': 'Waveclear queen + vision', 'warhead-junction': 'Nydus on huge map' } },
  'Zul\'jin':       { traits: ['sustained-dmg', 'siege', 'teamfight'] },
};

// Map trait weights — which traits matter most on each map
export const MAP_TRAIT_WEIGHTS: Record<string, Partial<Record<HeroTrait, number>>> = {
  'alterac-pass': {
    'teamfight': 3, 'sustain-heal': 2, 'cc-heavy': 2, 'solo-lane': 1, 'camp-clear': 1,
  },
  'battlefield-of-eternity': {
    'sustained-dmg': 3, 'burst-heal': 2, 'camp-clear': 2, 'solo-lane': 1, 'teamfight': 1,
  },
  'blackhearts-bay': {
    'split-push': 3, 'waveclear': 2, 'global': 3, 'camp-clear': 2, 'mobility': 1,
  },
  'braxis-holdout': {
    'solo-lane': 3, 'point-control': 3, 'waveclear': 2, 'summons': 1, 'teamfight': 1,
  },
  'cursed-hollow': {
    'global': 3, 'sustain-heal': 2, 'cc-heavy': 2, 'pick-off': 2, 'mobility': 1, 'camp-clear': 1,
  },
  'dragon-shire': {
    'solo-lane': 3, 'global': 2, 'dive': 2, 'mobility': 2, 'point-control': 1,
  },
  'garden-of-terror': {
    'split-push': 2, 'siege': 2, 'waveclear': 2, 'poke': 1, 'sustain-heal': 1,
  },
  'hanamura-temple': {
    'poke': 3, 'sustain-heal': 2, 'waveclear': 2, 'obj-control': 1, 'teamfight': 1,
  },
  'infernal-shrines': {
    'burst-aoe': 3, 'waveclear': 3, 'teamfight': 2, 'cc-heavy': 2, 'obj-control': 1,
  },
  'sky-temple': {
    'poke': 3, 'global': 2, 'obj-control': 2, 'mobility': 1, 'teamfight': 1,
  },
  'tomb-of-the-spider-queen': {
    'waveclear': 3, 'split-push': 2, 'sustain-heal': 2, 'teamfight': 1, 'summons': 1,
  },
  'towers-of-doom': {
    'teamfight': 3, 'sustain-heal': 2, 'cc-heavy': 2, 'point-control': 2, 'obj-control': 1,
  },
  'volskaya-foundry': {
    'cc-heavy': 3, 'teamfight': 3, 'burst-aoe': 2, 'obj-control': 2, 'anti-dive': 1,
  },
  'warhead-junction': {
    'global': 3, 'mobility': 3, 'poke': 2, 'split-push': 2, 'siege': 2, 'pick-off': 1,
  },
};

export interface MapAffinity {
  score: number;     // 0-10 how well the hero fits this map
  reasons: string[]; // Why they're good/bad
}

export function getHeroMapAffinity(heroName: string, mapId: string): MapAffinity {
  const heroData = HERO_TRAITS[heroName];
  const mapWeights = MAP_TRAIT_WEIGHTS[mapId];

  if (!heroData || !mapWeights) return { score: 5, reasons: [] };

  let score = 0;
  let maxPossible = 0;
  const reasons: string[] = [];

  // Check trait matches
  for (const [trait, weight] of Object.entries(mapWeights)) {
    maxPossible += weight;
    if (heroData.traits.includes(trait as HeroTrait)) {
      score += weight;
      const traitLabel = trait.replace(/-/g, ' ');
      if (weight >= 2) reasons.push(traitLabel);
    }
  }

  // Add specific map note if exists
  const mapNote = heroData.mapNotes?.[mapId];
  if (mapNote) {
    score += 2;
    maxPossible += 2;
    reasons.unshift(mapNote);
  }

  // Normalize to 0-10
  const normalized = maxPossible > 0 ? Math.round((score / maxPossible) * 10) : 5;

  return { score: normalized, reasons };
}
