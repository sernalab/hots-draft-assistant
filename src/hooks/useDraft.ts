import { useCallback, useMemo, useState } from 'react';
import type { ActionType, DraftState, DraftStep, Hero, Team } from '../types';
import { HEROES_BY_NAME } from '../data/heroes';

// Cho'Gall is a 2-in-1 hero: the two halves are always drafted together by the
// same team and share availability (banning/picking one blocks the other).
const CHO_GALL: Record<string, string> = { Cho: 'Gall', Gall: 'Cho' };

/**
 * Storm League draft order (16 steps):
 * "A" = first pick team, "B" = second pick team
 *
 * Ban Phase 1:  A ban, B ban, A ban, B ban
 * Pick Phase 1: A pick, B pick·B pick, A pick·A pick   (1-2-2)
 * Ban Phase 2:  B ban, A ban
 * Pick Phase 2: B pick·B pick, A pick·A pick, B pick    (2-2-1)
 *
 * Net pick pattern is the standard MOBA 1-2-2-2-2-1; first-pick team gets a
 * double pick at the end of phase 1 before the second ban phase.
 */
const DRAFT_SEQUENCE: { team: 'A' | 'B'; action: ActionType }[] = [
  { team: 'A', action: 'ban' },   // 0
  { team: 'B', action: 'ban' },   // 1
  { team: 'A', action: 'ban' },   // 2
  { team: 'B', action: 'ban' },   // 3
  { team: 'A', action: 'pick' },  // 4
  { team: 'B', action: 'pick' },  // 5
  { team: 'B', action: 'pick' },  // 6
  { team: 'A', action: 'pick' },  // 7
  { team: 'A', action: 'pick' },  // 8
  { team: 'B', action: 'ban' },   // 9
  { team: 'A', action: 'ban' },   // 10
  { team: 'B', action: 'pick' },  // 11
  { team: 'B', action: 'pick' },  // 12
  { team: 'A', action: 'pick' },  // 13
  { team: 'A', action: 'pick' },  // 14
  { team: 'B', action: 'pick' },  // 15
];

function buildSteps(isFirstPick: boolean): DraftStep[] {
  return DRAFT_SEQUENCE.map((s, i) => ({
    index: i,
    team: (s.team === 'A') === isFirstPick ? 'ally' as Team : 'enemy' as Team,
    action: s.action,
    hero: null,
  }));
}

function findNextEmpty(steps: DraftStep[], from = 0): number | null {
  for (let i = from; i < steps.length; i++) {
    if (!steps[i].hero) return i;
  }
  return null;
}

function createInitialState(): DraftState {
  return {
    map: null,
    isFirstPick: true,
    steps: buildSteps(true),
    activeStepIndex: 0, // Start at first step
  };
}

export function useDraft() {
  const [draft, setDraft] = useState<DraftState>(createInitialState);

  const setMap = useCallback((mapId: string) => {
    setDraft(prev => ({ ...prev, map: mapId || null }));
  }, []);

  const setFirstPick = useCallback((isFirst: boolean) => {
    const steps = buildSteps(isFirst);
    setDraft(prev => ({
      ...prev,
      isFirstPick: isFirst,
      steps,
      activeStepIndex: findNextEmpty(steps),
    }));
  }, []);

  // Allow clicking a specific step to override it (e.g., fix a mistake)
  const setActiveStep = useCallback((index: number | null) => {
    setDraft(prev => ({ ...prev, activeStepIndex: index }));
  }, []);

  // Assign hero to active step and auto-advance to next empty
  const setHeroInStep = useCallback((hero: Hero) => {
    setDraft(prev => {
      if (prev.activeStepIndex === null) return prev;
      const active = prev.activeStepIndex;
      const steps = [...prev.steps];
      const step = steps[active];
      steps[active] = { ...step, hero };

      // Cho'Gall: on a PICK, the partner auto-fills another same-team pick slot
      // (they always come as a pair and occupy two slots). On a ban, one slot
      // is enough — the partner is blocked via takenHeroes.
      let lastFilled = active;
      const partnerName = CHO_GALL[hero.name];
      if (partnerName && step.action === 'pick') {
        const partner = HEROES_BY_NAME[partnerName.toLowerCase()];
        const pi = steps.findIndex((s, i) =>
          i !== active && s.action === 'pick' && s.team === step.team && !s.hero);
        if (partner && pi !== -1) {
          steps[pi] = { ...steps[pi], hero: partner };
          lastFilled = Math.max(lastFilled, pi);
        }
      }

      const nextActive = findNextEmpty(steps, lastFilled + 1) ?? findNextEmpty(steps, 0);
      return { ...prev, steps, activeStepIndex: nextActive };
    });
  }, []);

  // Remove hero and set that step as active
  const removeHeroFromStep = useCallback((index: number) => {
    setDraft(prev => {
      const steps = [...prev.steps];
      const removed = steps[index].hero;
      steps[index] = { ...steps[index], hero: null };

      // Cho'Gall: removing one half of a picked pair also clears the other half.
      const partnerName = removed ? CHO_GALL[removed.name] : undefined;
      if (partnerName && steps[index].action === 'pick') {
        const pi = steps.findIndex(s => s.action === 'pick' && s.hero?.name === partnerName);
        if (pi !== -1) steps[pi] = { ...steps[pi], hero: null };
      }
      return { ...prev, steps, activeStepIndex: index };
    });
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(prev => {
      const steps = buildSteps(prev.isFirstPick);
      return {
        ...createInitialState(),
        map: prev.map,
        isFirstPick: prev.isFirstPick,
        steps,
        activeStepIndex: 0,
      };
    });
  }, []);

  const takenHeroes = useMemo(() => {
    const names = new Set(draft.steps.filter(s => s.hero).map(s => s.hero!.name));
    // Cho'Gall: if either half is in the draft, neither is independently available.
    if (names.has('Cho')) names.add('Gall');
    if (names.has('Gall')) names.add('Cho');
    return [...names];
  }, [draft.steps]);

  const currentPhaseLabel = useMemo(() => {
    const filled = draft.steps.filter(s => s.hero).length;
    if (filled < 4) return 'Ban Phase 1';
    if (filled < 9) return 'Pick Phase 1';
    if (filled < 11) return 'Ban Phase 2';
    if (filled < 16) return 'Pick Phase 2';
    return 'Draft Complete';
  }, [draft.steps]);

  return {
    draft,
    setMap,
    setFirstPick,
    setActiveStep,
    setHeroInStep,
    removeHeroFromStep,
    resetDraft,
    takenHeroes,
    currentPhaseLabel,
  };
}
