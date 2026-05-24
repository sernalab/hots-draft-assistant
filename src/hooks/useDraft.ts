import { useCallback, useState } from 'react';
import type { DraftPhase, DraftState, Hero, SlotType, Team } from '../types';

const INITIAL_STATE: DraftState = {
  map: null,
  phase: 'ban-1',
  enemyBans: [null, null, null],
  allyBans: [null, null, null],
  enemyPicks: [null, null, null, null, null],
  allyPicks: [null, null, null, null, null],
  activeSlot: null,
};

export function useDraft() {
  const [draft, setDraft] = useState<DraftState>(INITIAL_STATE);

  const setMap = useCallback((mapId: string) => {
    setDraft(prev => ({ ...prev, map: mapId }));
  }, []);

  const setActiveSlot = useCallback((team: Team, type: SlotType, index: number) => {
    setDraft(prev => ({ ...prev, activeSlot: { team, type, index } }));
  }, []);

  const clearActiveSlot = useCallback(() => {
    setDraft(prev => ({ ...prev, activeSlot: null }));
  }, []);

  const setHeroInSlot = useCallback((hero: Hero) => {
    setDraft(prev => {
      if (!prev.activeSlot) return prev;
      const { team, type, index } = prev.activeSlot;
      const key = `${team}${type === 'ban' ? 'Bans' : 'Picks'}` as keyof DraftState;
      const slots = [...(prev[key] as (Hero | null)[])];
      slots[index] = hero;
      return { ...prev, [key]: slots, activeSlot: null };
    });
  }, []);

  const removeHeroFromSlot = useCallback((team: Team, type: SlotType, index: number) => {
    setDraft(prev => {
      const key = `${team}${type === 'ban' ? 'Bans' : 'Picks'}` as keyof DraftState;
      const slots = [...(prev[key] as (Hero | null)[])];
      slots[index] = null;
      return { ...prev, [key]: slots };
    });
  }, []);

  const setPhase = useCallback((phase: DraftPhase) => {
    setDraft(prev => ({ ...prev, phase }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(INITIAL_STATE);
  }, []);

  const applyScreenshot = useCallback((data: {
    map: string | null;
    enemyBans: Hero[];
    allyBans: Hero[];
    enemyPicks: Hero[];
    allyPicks: Hero[];
    phase: DraftPhase;
  }) => {
    setDraft(prev => ({
      ...prev,
      map: data.map ?? prev.map,
      phase: data.phase,
      enemyBans: padSlots(data.enemyBans, 3),
      allyBans: padSlots(data.allyBans, 3),
      enemyPicks: padSlots(data.enemyPicks, 5),
      allyPicks: padSlots(data.allyPicks, 5),
      activeSlot: null,
    }));
  }, []);

  const getAllPickedHeroes = useCallback((): string[] => {
    const all = [
      ...draft.enemyBans, ...draft.allyBans,
      ...draft.enemyPicks, ...draft.allyPicks,
    ];
    return all.filter(Boolean).map(h => h!.name);
  }, [draft]);

  return {
    draft,
    setMap,
    setActiveSlot,
    clearActiveSlot,
    setHeroInSlot,
    removeHeroFromSlot,
    setPhase,
    resetDraft,
    applyScreenshot,
    getAllPickedHeroes,
  };
}

function padSlots(heroes: Hero[], size: number): (Hero | null)[] {
  const result: (Hero | null)[] = [...heroes];
  while (result.length < size) result.push(null);
  return result.slice(0, size);
}
