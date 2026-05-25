import type { DraftState } from '../types';
import { MAPS } from '../data/maps';
import { HeroIcon } from './HeroIcon';

interface DraftBoardProps {
  draft: DraftState;
  phaseLabel: string;
  onMapChange: (mapId: string) => void;
  onFirstPickChange: (isFirst: boolean) => void;
  onStepClick: (index: number) => void;
  onRemoveHero: (index: number) => void;
  onReset: () => void;
}

const PHASE_LABELS = [
  { start: 0, end: 3, label: 'Ban Phase 1' },
  { start: 4, end: 7, label: 'Pick Phase 1' },
  { start: 8, end: 9, label: 'Ban Phase 2' },
  { start: 10, end: 15, label: 'Pick Phase 2' },
];

export function DraftBoard({
  draft,
  phaseLabel,
  onMapChange,
  onFirstPickChange,
  onStepClick,
  onRemoveHero,
  onReset,
}: DraftBoardProps) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-accent uppercase tracking-wider font-[family-name:var(--font-display)]">
          Draft
        </h2>
        <button
          onClick={onReset}
          className="text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Map selector */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Map</label>
        <select
          value={draft.map ?? ''}
          onChange={e => onMapChange(e.target.value)}
          className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
        >
          <option value="">Select map...</option>
          {MAPS.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* First/Second pick toggle */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Your team</label>
        <div className="flex gap-1">
          <button
            onClick={() => onFirstPickChange(true)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              draft.isFirstPick
                ? 'bg-ally/20 text-ally border border-ally/40'
                : 'bg-bg-primary text-text-muted border border-transparent'
            }`}
          >
            1st Pick
          </button>
          <button
            onClick={() => onFirstPickChange(false)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !draft.isFirstPick
                ? 'bg-ally/20 text-ally border border-ally/40'
                : 'bg-bg-primary text-text-muted border border-transparent'
            }`}
          >
            2nd Pick
          </button>
        </div>
      </div>

      {/* Phase indicator */}
      <div className="text-xs text-accent-purple-light font-semibold">{phaseLabel}</div>

      {/* Draft sequence */}
      <div className="space-y-0.5">
        {PHASE_LABELS.map(phase => (
          <div key={phase.label}>
            <div className="text-[10px] text-text-muted uppercase tracking-wider mt-2 mb-1">
              {phase.label}
            </div>
            {draft.steps.slice(phase.start, phase.end + 1).map(step => {
              const isActive = draft.activeStepIndex === step.index;
              const isAlly = step.team === 'ally';
              const isBan = step.action === 'ban';

              return (
                <div
                  key={step.index}
                  className="group relative"
                >
                  <button
                    onClick={() => onStepClick(step.index)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all ${
                      isActive
                        ? 'bg-accent/10 border border-accent/50'
                        : step.hero
                          ? 'bg-bg-primary/50 border border-transparent hover:border-border'
                          : 'bg-bg-primary/30 border border-transparent hover:border-border'
                    }`}
                  >
                    {/* Step number */}
                    <span className="text-[10px] text-text-muted w-4 text-right shrink-0">
                      {step.index + 1}
                    </span>

                    {/* Team indicator */}
                    <span className={`w-1.5 h-6 rounded-full shrink-0 ${
                      isAlly ? 'bg-ally/60' : 'bg-enemy/60'
                    }`} />

                    {/* Action label */}
                    <span className={`text-[10px] uppercase font-semibold w-7 shrink-0 ${
                      isBan ? 'text-red-400/70' : isAlly ? 'text-ally/70' : 'text-enemy/70'
                    }`}>
                      {isBan ? 'BAN' : 'PICK'}
                    </span>

                    {/* Hero or empty slot */}
                    {step.hero ? (
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <HeroIcon hero={step.hero} size="sm" className="shrink-0" />
                        <span className={`text-xs truncate ${isBan ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                          {step.hero.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted/40 flex-1">
                        {isAlly ? 'Your' : 'Enemy'} {isBan ? 'ban' : 'pick'}
                      </span>
                    )}
                  </button>

                  {/* Remove button */}
                  {step.hero && (
                    <button
                      onClick={() => onRemoveHero(step.index)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-red-600/80 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
