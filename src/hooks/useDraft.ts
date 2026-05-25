import { useCallback, useMemo, useState } from 'react';
import type { ActionType, DraftState, DraftStep, Hero, Team } from '../types';

/**
 * Storm League draft order (16 steps):
 * "A" = first pick team, "B" = second pick team
 *
 * Ban Phase 1:  A ban, B ban, A ban, B ban
 * Pick Phase 1: A pick, B pick, B pick, A pick
 * Ban Phase 2:  A ban, B ban
 * Pick Phase 2: B pick, A pick, A pick, B pick, B pick, A pick
 */
const DRAFT_SEQUENCE: { team: 'A' | 'B'; action: ActionType }[] = [
  { team: 'A', action: 'ban' },
  { team: 'B', action: 'ban' },
  { team: 'A', action: 'ban' },
  { team: 'B', action: 'ban' },
  { team: 'A', action: 'pick' },
  { team: 'B', action: 'pick' },
  { team: 'B', action: 'pick' },
  { team: 'A', action: 'pick' },
  { team: 'A', action: 'ban' },
  { team: 'B', action: 'ban' },
  { team: 'B', action: 'pick' },
  { team: 'A', action: 'pick' },
  { team: 'A', action: 'pick' },
  { team: 'B', action: 'pick' },
  { team: 'B', action: 'pick' },
  { team: 'A', action: 'pick' },
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
      const steps = [...prev.steps];
      steps[prev.activeStepIndex] = { ...steps[prev.activeStepIndex], hero };
      const nextActive = findNextEmpty(steps, prev.activeStepIndex + 1)
        ?? findNextEmpty(steps, 0);
      return { ...prev, steps, activeStepIndex: nextActive };
    });
  }, []);

  // Remove hero and set that step as active
  const removeHeroFromStep = useCallback((index: number) => {
    setDraft(prev => {
      const steps = [...prev.steps];
      steps[index] = { ...steps[index], hero: null };
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

  const takenHeroes = useMemo(() =>
    draft.steps.filter(s => s.hero).map(s => s.hero!.name),
    [draft.steps]
  );

  const currentPhaseLabel = useMemo(() => {
    const filled = draft.steps.filter(s => s.hero).length;
    if (filled < 4) return 'Ban Phase 1';
    if (filled < 8) return 'Pick Phase 1';
    if (filled < 10) return 'Ban Phase 2';
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
