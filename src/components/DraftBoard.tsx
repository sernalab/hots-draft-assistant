import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { DraftState, DraftStep } from '../types';
import { MAPS_BY_ID } from '../data/maps';
import { HeroIcon } from './HeroIcon';

interface DraftBoardProps {
  draft: DraftState;
  phaseLabel: string;
  onChangeMap: () => void;
  onFirstPickChange: (isFirst: boolean) => void;
  onStepClick: (index: number) => void;
  onRemoveHero: (index: number) => void;
  onReset: () => void;
}

/* ── Role color map for pick slot role tags ── */
const ROLE_COLORS: Record<string, string> = {
  Tank: 'bg-sky-500/15 text-sky-300',
  Bruiser: 'bg-orange-500/15 text-orange-300',
  Healer: 'bg-emerald-500/15 text-emerald-300',
  Support: 'bg-teal-500/15 text-teal-300',
  'Melee Assassin': 'bg-rose-500/15 text-rose-300',
  'Ranged Assassin': 'bg-violet-500/15 text-violet-300',
};

const SPRING = { type: 'spring' as const, stiffness: 420, damping: 30 };

function BanGlyph({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  );
}

export function DraftBoard({
  draft,
  phaseLabel,
  onChangeMap,
  onFirstPickChange,
  onStepClick,
  onRemoveHero,
  onReset,
}: DraftBoardProps) {
  const currentMap = draft.map ? MAPS_BY_ID[draft.map] : null;
  const mapInitials = currentMap
    ? currentMap.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('')
    : '?';
  /* ── Partition steps into bans / picks by team ── */
  const { allyBans, enemyBans, allyPicks, enemyPicks } = useMemo(() => {
    const ab: DraftStep[] = [];
    const eb: DraftStep[] = [];
    const ap: DraftStep[] = [];
    const ep: DraftStep[] = [];
    for (const step of draft.steps) {
      if (step.action === 'ban') (step.team === 'ally' ? ab : eb).push(step);
      else (step.team === 'ally' ? ap : ep).push(step);
    }
    return { allyBans: ab, enemyBans: eb, allyPicks: ap, enemyPicks: ep };
  }, [draft.steps]);

  const activeStep = draft.activeStepIndex !== null ? draft.steps[draft.activeStepIndex] : null;
  const isYourTurn = activeStep?.team === 'ally';

  /* ── Turn / counter label for the center spine ── */
  const turnCounter = useMemo(() => {
    if (!activeStep) return null;
    if (activeStep.action === 'ban') {
      const done = draft.steps.filter(s => s.action === 'ban' && s.hero).length;
      return `BAN ${done + 1} / 6`;
    }
    const done = draft.steps.filter(s => s.action === 'pick' && s.hero).length;
    return `PICK ${done + 1} / 10`;
  }, [activeStep, draft.steps]);

  /* ── A single PICK slot (large portrait, facing center) ── */
  const renderPickSlot = (step: DraftStep, slotNumber: number, side: 'ally' | 'enemy') => {
    const isActive = draft.activeStepIndex === step.index;
    const isAlly = side === 'ally';
    const filled = !!step.hero;

    return (
      <motion.div layout key={step.index} className="group relative">
        <button
          onClick={() => onStepClick(step.index)}
          className={`relative w-full flex items-center gap-2.5 sm:gap-3 rounded-xl px-2.5 py-2 transition-colors duration-200
            ${isAlly ? '' : 'flex-row-reverse text-right'}
            ${isActive
              ? 'border-2 border-accent bg-accent/5 animate-pulse-glow'
              : filled
                ? (isAlly ? 'border border-ally/30 bg-ally/5 hover:bg-ally/10' : 'border border-enemy/30 bg-enemy/5 hover:bg-enemy/10')
                : (isAlly ? 'border border-dashed border-ally/25 bg-white/[0.02] hover:border-ally/50' : 'border border-dashed border-enemy/25 bg-white/[0.02] hover:border-enemy/50')
            }`}
        >
          {/* Portrait / placeholder */}
          <div className="relative shrink-0 w-16 h-16">
            <AnimatePresence mode="popLayout" initial={false}>
              {filled ? (
                <motion.div
                  key={step.hero!.id}
                  initial={{ opacity: 0, scale: 0.7, x: isAlly ? -28 : 28 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={SPRING}
                  className={isAlly ? 'drop-shadow-[0_0_10px_rgba(56,189,248,0.40)]' : 'drop-shadow-[0_0_10px_rgba(251,113,133,0.40)]'}
                >
                  <HeroIcon hero={step.hero!} size="xl" />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center text-xl font-bold ${
                    isActive ? 'border-accent/40 text-accent/50' : isAlly ? 'border-ally/20 text-ally/30' : 'border-enemy/20 text-enemy/30'
                  }`}
                >
                  {slotNumber}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            {filled ? (
              <>
                <span className="block text-sm font-semibold text-text-primary truncate">
                  {step.hero!.name}
                </span>
                <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full mt-1 font-medium ${ROLE_COLORS[step.hero!.role] ?? 'bg-white/10 text-text-secondary'}`}>
                  {step.hero!.role}
                </span>
              </>
            ) : (
              <span className={`text-xs font-medium ${isActive ? 'text-accent' : isAlly ? 'text-ally/50' : 'text-enemy/50'}`}>
                {isActive ? 'Selecting…' : `${isAlly ? 'Ally' : 'Enemy'} pick`}
              </span>
            )}
          </div>
        </button>

        {filled && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveHero(step.index); }}
            className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-ban text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md ${isAlly ? 'right-1.5' : 'left-1.5'}`}
          >
            ×
          </button>
        )}
      </motion.div>
    );
  };

  /* ── A single BAN slot (small, struck-through) ── */
  const renderBanSlot = (step: DraftStep) => {
    const isActive = draft.activeStepIndex === step.index;
    const filled = !!step.hero;

    return (
      <motion.div layout key={step.index} className="group relative">
        <button
          onClick={() => onStepClick(step.index)}
          className={`relative w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-lg flex items-center justify-center transition-colors duration-200
            ${isActive
              ? 'border-2 border-accent animate-pulse-glow'
              : filled
                ? 'border border-ban/40 bg-ban/5'
                : 'border border-dashed border-ban/30 bg-white/[0.02]'
            }`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {filled ? (
              <motion.div
                key={step.hero!.id}
                initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={SPRING}
                className="relative"
              >
                <HeroIcon hero={step.hero!} size="md" className="opacity-55 grayscale" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-0.5 bg-ban rotate-45 rounded-full shadow-sm" />
              </motion.div>
            ) : (
              <motion.span key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <BanGlyph className={`w-4 h-4 ${isActive ? 'text-accent/60' : 'text-ban/40'}`} />
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {filled && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveHero(step.index); }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-ban text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow"
          >
            ×
          </button>
        )}
      </motion.div>
    );
  };

  const TeamHeader = ({ side }: { side: 'ally' | 'enemy' }) => {
    const isAlly = side === 'ally';
    const picks = (isAlly ? allyPicks : enemyPicks).filter(s => s.hero).length;
    return (
      <div className={`flex items-center gap-2 ${isAlly ? '' : 'flex-row-reverse'}`}>
        <span
          className={`w-2.5 h-2.5 rounded-full ${isAlly ? 'bg-ally' : 'bg-enemy'}`}
          style={{ boxShadow: isAlly ? '0 0 8px rgba(56,189,248,0.9)' : '0 0 8px rgba(251,113,133,0.9)' }}
        />
        <span className={`text-sm font-bold uppercase tracking-[0.14em] font-[family-name:var(--font-display)] ${isAlly ? 'text-ally' : 'text-enemy'}`}>
          {isAlly ? 'Your Team' : 'Enemy'}
        </span>
        <span className="text-[11px] font-mono text-text-muted">{picks}/5</span>
      </div>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-5">
      {/* ── Control bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Battleground chip — opens the map selector */}
        <button
          onClick={onChangeMap}
          className="group flex items-center gap-2 bg-bg-primary border border-border hover:border-accent/50 rounded-lg pl-2 pr-3 py-1.5 transition-colors"
          title="Change battleground"
        >
          <span className="w-7 h-7 rounded-md bg-accent/15 text-accent-light flex items-center justify-center text-[11px] font-extrabold font-[family-name:var(--font-display)] shrink-0">
            {mapInitials}
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className="text-[8px] uppercase tracking-[0.15em] text-text-muted">Battleground</span>
            <span className="text-sm font-bold text-text-primary font-[family-name:var(--font-display)] tracking-wide">
              {currentMap?.name ?? 'Select map'}
            </span>
          </span>
          <span className="text-[11px] text-text-muted group-hover:text-accent transition-colors ml-1">⇆</span>
        </button>

        {/* First / second pick segmented control */}
        <div className="relative flex bg-bg-primary rounded-lg p-0.5 border border-border">
          <div
            className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-md bg-ally/15 border border-ally/40 transition-transform duration-200 ease-out"
            style={{ transform: draft.isFirstPick ? 'translateX(2px)' : 'translateX(calc(100% + 2px))' }}
          />
          <button
            onClick={() => onFirstPickChange(true)}
            className={`relative z-10 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors duration-200 ${draft.isFirstPick ? 'text-ally' : 'text-text-muted'}`}
          >
            1st Pick
          </button>
          <button
            onClick={() => onFirstPickChange(false)}
            className={`relative z-10 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors duration-200 ${!draft.isFirstPick ? 'text-ally' : 'text-text-muted'}`}
          >
            2nd Pick
          </button>
        </div>

        <div className="flex-1" />

        <button
          onClick={onReset}
          className="text-xs text-text-muted hover:text-ban transition-colors px-3 py-1.5 rounded-lg hover:bg-ban/10 border border-border"
        >
          Reset
        </button>
      </div>

      {/* ── Arena: ally | spine | enemy ── */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 items-stretch">
        {/* ALLY column */}
        <div className="space-y-3">
          <TeamHeader side="ally" />
          <div className="flex flex-wrap gap-1.5">
            {allyBans.map(renderBanSlot)}
          </div>
          <div className="space-y-2">
            {allyPicks.map((step, i) => renderPickSlot(step, i + 1, 'ally'))}
          </div>
        </div>

        {/* CENTER spine */}
        <div className="flex flex-col items-center justify-center gap-3 px-0.5 sm:px-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full text-center leading-tight whitespace-nowrap">
            {phaseLabel}
          </span>

          <div className="w-px flex-1 min-h-[20px] bg-gradient-to-b from-transparent via-border to-border" />

          {activeStep ? (
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{ x: isYourTurn ? [0, -5, 0] : [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.3, ease: 'easeInOut' }}
                className={`text-2xl leading-none ${isYourTurn ? 'text-ally' : 'text-enemy'}`}
              >
                {isYourTurn ? '◀' : '▶'}
              </motion.div>
              <span className={`text-[11px] font-bold uppercase tracking-wide ${isYourTurn ? 'text-ally' : 'text-enemy'}`}>
                {isYourTurn ? 'Your turn' : 'Enemy'}
              </span>
              <span className="text-[11px] font-mono text-text-muted whitespace-nowrap">{turnCounter}</span>
            </div>
          ) : (
            <span className="text-xs font-bold text-positive uppercase tracking-wide text-center">✓ Draft<br />complete</span>
          )}

          <div className="w-px flex-1 min-h-[20px] bg-gradient-to-b from-border via-border to-transparent" />
        </div>

        {/* ENEMY column */}
        <div className="space-y-3">
          <TeamHeader side="enemy" />
          <div className="flex flex-wrap gap-1.5 justify-end">
            {enemyBans.map(renderBanSlot)}
          </div>
          <div className="space-y-2">
            {enemyPicks.map((step, i) => renderPickSlot(step, i + 1, 'enemy'))}
          </div>
        </div>
      </div>
    </div>
  );
}
