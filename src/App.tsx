import { useCallback, useState } from 'react';
import { motion } from 'motion/react';
import { DraftBoard } from './components/DraftBoard';
import { DraftAdvisor } from './components/DraftAdvisor';
import { HeroPicker } from './components/HeroPicker';
import { UserPoolModal } from './components/UserPoolModal';
import { MapSelect } from './components/MapSelect';
import { useDraft } from './hooks/useDraft';
import { useMeta } from './hooks/useMeta';
import { getUserPreferences, setUserPreferences, setLastMap } from './services/storage';
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

  const { meta, loading: metaLoading, error: metaError, lastSync, forceSync, syncForMap } = useMeta();
  const [prefs, setPrefs] = useState<UserPreferences>(getUserPreferences);
  const [showUserPool, setShowUserPool] = useState(false);
  const [showMapSelect, setShowMapSelect] = useState(false);

  const handleMapChange = useCallback((mapId: string) => {
    setMap(mapId);
    syncForMap(mapId || null);
    setLastMap(mapId || null);
    setShowMapSelect(false);
  }, [setMap, syncForMap]);

  const handleStepClick = useCallback((index: number) => {
    setActiveStep(index);
  }, [setActiveStep]);

  const handleHeroSelect = useCallback((hero: Hero) => {
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

  // Active slot info for the hero picker
  const activeSlotInfo = draft.activeStepIndex !== null
    ? {
        action: draft.steps[draft.activeStepIndex].action,
        team: draft.steps[draft.activeStepIndex].team,
      }
    : null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-subtle sticky top-0 z-40">
        <div className="h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_12px_rgba(245,183,61,0.6)]" />
        <div className="max-w-[1400px] mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shadow-sm glow-accent">
              <span className="text-bg-primary font-extrabold text-base font-[family-name:var(--font-display)]">H</span>
            </div>
            <h1 className="text-base font-extrabold uppercase tracking-[0.18em] text-text-primary font-[family-name:var(--font-display)]">
              HotS Draft <span className="text-gradient-accent">Assistant</span>
            </h1>
          </div>
          <button
            onClick={() => setShowUserPool(true)}
            className="w-8 h-8 rounded-lg bg-bg-card border border-border hover:border-accent/40 hover:bg-bg-card-hover flex items-center justify-center text-text-secondary hover:text-text-primary transition-all"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-5 py-5 space-y-5">
        {!draft.map ? (
          /* Pre-draft gate: pick a battleground first */
          <MapSelect currentMap={null} onSelect={handleMapChange} />
        ) : (
          <>
            {/* Top: full-width landscape Advisor */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <DraftAdvisor
                steps={draft.steps}
                meta={meta?.data ?? []}
                mapId={draft.map}
                onHeroClick={handleHeroSelect}
              />
            </motion.div>

            {/* Middle: full-width Draft Arena */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <DraftBoard
                draft={draft}
                phaseLabel={currentPhaseLabel}
                onChangeMap={() => setShowMapSelect(true)}
                onFirstPickChange={setFirstPick}
                onStepClick={handleStepClick}
                onRemoveHero={removeHeroFromStep}
                onReset={resetDraft}
              />
            </motion.div>

            {/* Bottom: full-width Hero Picker */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <HeroPicker
                meta={meta?.data ?? []}
                metaLoading={metaLoading}
                metaError={metaError}
                lastSync={lastSync}
                takenHeroes={takenHeroes}
                activeSlotInfo={activeSlotInfo}
                onHeroClick={handleHeroSelect}
                onSync={forceSync}
              />
            </motion.div>
          </>
        )}
      </main>

      {showMapSelect && draft.map && (
        <MapSelect
          currentMap={draft.map}
          onSelect={handleMapChange}
          onClose={() => setShowMapSelect(false)}
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
