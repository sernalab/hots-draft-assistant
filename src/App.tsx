import { useCallback, useState } from 'react';
import { DraftBoard } from './components/DraftBoard';
import { AIPanel } from './components/AIPanel';
import { MetaPanel } from './components/MetaPanel';
import { HeroSearch } from './components/HeroSearch';
import { UserPoolModal } from './components/UserPoolModal';
import { ScreenshotAnalyzer } from './components/ScreenshotAnalyzer';
import { useDraft } from './hooks/useDraft';
import { useMeta } from './hooks/useMeta';
import { getUserPreferences, setUserPreferences } from './services/storage';
import type { SlotType, Team, UserPreferences } from './types';

export default function App() {
  const {
    draft,
    setMap,
    setActiveSlot,
    clearActiveSlot,
    setHeroInSlot,
    removeHeroFromSlot,
    resetDraft,
    applyScreenshot,
    getAllPickedHeroes,
  } = useDraft();

  const { meta, loading: metaLoading, lastSync, forceSync } = useMeta();
  const [prefs, setPrefs] = useState<UserPreferences>(getUserPreferences);
  const [showHeroSearch, setShowHeroSearch] = useState(false);
  const [showUserPool, setShowUserPool] = useState(false);
  const [showScreenshot, setShowScreenshot] = useState(false);

  const handleSlotClick = useCallback((team: Team, type: SlotType, index: number) => {
    setActiveSlot(team, type, index);
    setShowHeroSearch(true);
  }, [setActiveSlot]);

  const handleHeroSelect = useCallback((hero: Parameters<typeof setHeroInSlot>[0]) => {
    setHeroInSlot(hero);
    setShowHeroSearch(false);
  }, [setHeroInSlot]);

  const handleSavePrefs = useCallback((newPrefs: UserPreferences) => {
    setPrefs(newPrefs);
    setUserPreferences(newPrefs);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <span className="text-accent font-bold text-sm font-[family-name:var(--font-display)]">H</span>
            </div>
            <h1 className="text-lg font-bold text-text-primary font-[family-name:var(--font-display)]">
              HotS Draft <span className="text-accent">Assistant</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={forceSync}
              disabled={metaLoading}
              className="text-xs bg-bg-primary border border-border hover:border-accent/40 px-3 py-1.5 rounded-lg text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
            >
              {metaLoading ? 'Syncing...' : 'Sync Meta'}
            </button>
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
        </div>
      </header>

      {/* Main layout */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Draft Board */}
          <div className="lg:col-span-3">
            <DraftBoard
              draft={draft}
              onMapChange={setMap}
              onSlotClick={handleSlotClick}
              onRemoveHero={removeHeroFromSlot}
              onReset={resetDraft}
            />
          </div>

          {/* AI Recommendations */}
          <div className="lg:col-span-5">
            <AIPanel
              draft={draft}
              meta={meta?.data ?? []}
              prefs={prefs}
              onScreenshotClick={() => setShowScreenshot(true)}
            />
          </div>

          {/* Meta Panel */}
          <div className="lg:col-span-4">
            <MetaPanel
              meta={meta?.data ?? []}
              loading={metaLoading}
              lastSync={lastSync}
              onSync={forceSync}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      {showHeroSearch && (
        <HeroSearch
          onSelect={handleHeroSelect}
          excludeHeroes={getAllPickedHeroes()}
          onClose={() => { setShowHeroSearch(false); clearActiveSlot(); }}
        />
      )}

      {showUserPool && (
        <UserPoolModal
          prefs={prefs}
          onSave={handleSavePrefs}
          onClose={() => setShowUserPool(false)}
        />
      )}

      {showScreenshot && (
        <ScreenshotAnalyzer
          onApply={applyScreenshot}
          onClose={() => setShowScreenshot(false)}
        />
      )}
    </div>
  );
}
