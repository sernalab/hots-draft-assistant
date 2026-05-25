import { useCallback, useState } from 'react';
import { DraftBoard } from './components/DraftBoard';
import { DraftAdvisor } from './components/DraftAdvisor';
import { HeroBrowser } from './components/HeroBrowser';
import { HeroSearch } from './components/HeroSearch';
import { UserPoolModal } from './components/UserPoolModal';
import { useDraft } from './hooks/useDraft';
import { useMeta } from './hooks/useMeta';
import { getUserPreferences, setUserPreferences } from './services/storage';
import type { Hero, UserPreferences } from './types';

export default function App() {
  const {
    draft,
    setMap,
    setFirstPick,
    setActiveStep,
    setHeroInStep,
    removeHeroFromStep,
    resetDraft,
    takenHeroes,
    currentPhaseLabel,
  } = useDraft();

  const { meta, loading: metaLoading, error: metaError, lastSync, currentRank, forceSync, syncForMap, syncForRank } = useMeta();
  const [prefs, setPrefs] = useState<UserPreferences>(getUserPreferences);
  const [showUserPool, setShowUserPool] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleMapChange = useCallback((mapId: string) => {
    setMap(mapId);
    syncForMap(mapId || null);
  }, [setMap, syncForMap]);

  const handleStepClick = useCallback((index: number) => {
    setActiveStep(index);
  }, [setActiveStep]);

  const handleHeroSelect = useCallback((hero: Hero) => {
    setHeroInStep(hero);
    setShowSearch(false);
  }, [setHeroInStep]);

  const handleHeroBrowserClick = useCallback((hero: Hero) => {
    if (draft.activeStepIndex !== null) {
      setHeroInStep(hero);
    } else {
      const nextEmpty = draft.steps.findIndex(s => !s.hero);
      if (nextEmpty >= 0) {
        setActiveStep(nextEmpty);
        setHeroInStep(hero);
      }
    }
  }, [draft.activeStepIndex, draft.steps, setActiveStep, setHeroInStep]);

  const handleSavePrefs = useCallback((newPrefs: UserPreferences) => {
    setPrefs(newPrefs);
    setUserPreferences(newPrefs);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <span className="text-accent font-bold text-sm font-[family-name:var(--font-display)]">H</span>
            </div>
            <h1 className="text-lg font-bold text-text-primary font-[family-name:var(--font-display)]">
              HotS Draft <span className="text-accent">Assistant</span>
            </h1>
          </div>
          <button
            onClick={() => setShowUserPool(true)}
            className="w-8 h-8 rounded-lg bg-bg-primary border border-border hover:border-accent/40 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </header>

      {/* 3-column layout: Draft | Advisor | Heroes */}
      <main className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Draft Board */}
          <div className="lg:col-span-3">
            <DraftBoard
              draft={draft}
              phaseLabel={currentPhaseLabel}
              onMapChange={handleMapChange}
              onFirstPickChange={setFirstPick}
              onStepClick={handleStepClick}
              onRemoveHero={removeHeroFromStep}
              onReset={resetDraft}
            />
          </div>

          {/* Draft Advisor */}
          <div className="lg:col-span-3">
            <DraftAdvisor
              steps={draft.steps}
              meta={meta?.data ?? []}
              mapId={draft.map}
              onHeroClick={handleHeroBrowserClick}
            />
          </div>

          {/* Hero Browser */}
          <div className="lg:col-span-6">
            <HeroBrowser
              meta={meta?.data ?? []}
              metaLoading={metaLoading}
              metaError={metaError}
              lastSync={lastSync}
              currentRank={currentRank}
              takenHeroes={takenHeroes}
              hasActiveSlot={draft.activeStepIndex !== null}
              onHeroClick={handleHeroBrowserClick}
              onSync={forceSync}
              onRankChange={syncForRank}
            />
          </div>
        </div>
      </main>

      {showSearch && (
        <HeroSearch
          onSelect={handleHeroSelect}
          excludeHeroes={takenHeroes}
          onClose={() => { setShowSearch(false); setActiveStep(null); }}
        />
      )}

      {showUserPool && (
        <UserPoolModal
          prefs={prefs}
          onSave={handleSavePrefs}
          onClose={() => setShowUserPool(false)}
        />
      )}
    </div>
  );
}
