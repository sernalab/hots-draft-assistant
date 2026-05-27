import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import type { DraftState, DraftStep } from '../types';
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

/* ── Role color map for pick slot role tags ── */
const ROLE_COLORS: Record<string, string> = {
  Tank: 'bg-blue-600/30 text-blue-300',
  Bruiser: 'bg-orange-600/30 text-orange-300',
  Healer: 'bg-green-600/30 text-green-300',
  Support: 'bg-teal-600/30 text-teal-300',
  'Melee Assassin': 'bg-red-600/30 text-red-300',
  'Ranged Assassin': 'bg-purple-600/30 text-purple-300',
};

export function DraftBoard({
  draft,
  phaseLabel,
  onMapChange,
  onFirstPickChange,
  onStepClick,
  onRemoveHero,
  onReset,
}: DraftBoardProps) {
  /* ── Refs for GSAP animations ── */
  const slotRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const prevHeroes = useRef<Map<number, string | null>>(new Map());

  /* ── Partition steps into bans / picks by team ── */
  const { allyBans, enemyBans, allyPicks, enemyPicks } = useMemo(() => {
    const ab: DraftStep[] = [];
    const eb: DraftStep[] = [];
    const ap: DraftStep[] = [];
    const ep: DraftStep[] = [];

    for (const step of draft.steps) {
      if (step.action === 'ban') {
        if (step.team === 'ally') ab.push(step);
        else eb.push(step);
      } else {
        if (step.team === 'ally') ap.push(step);
        else ep.push(step);
      }
    }
    return { allyBans: ab, enemyBans: eb, allyPicks: ap, enemyPicks: ep };
  }, [draft.steps]);

  /* ── GSAP animation on hero changes ── */
  useEffect(() => {
    for (const step of draft.steps) {
      const prevHero = prevHeroes.current.get(step.index) ?? null;
      const curHero = step.hero?.id ?? null;
      const el = slotRefs.current.get(step.index);

      if (!el) continue;

      if (prevHero === null && curHero !== null) {
        // Hero was assigned
        if (step.action === 'ban') {
          // Ban: red flash + shake
          gsap.fromTo(
            el,
            { x: -6, backgroundColor: 'rgba(220, 38, 38, 0.3)' },
            {
              x: 0,
              backgroundColor: 'rgba(220, 38, 38, 0)',
              duration: 0.4,
              ease: 'elastic.out(1, 0.4)',
              keyframes: [
                { x: -6, duration: 0.05 },
                { x: 6, duration: 0.05 },
                { x: -4, duration: 0.05 },
                { x: 4, duration: 0.05 },
                { x: 0, duration: 0.1 },
              ],
            }
          );
        } else {
          // Pick: slide-in from team side + glow burst
          const isAlly = step.team === 'ally';
          gsap.from(el, {
            x: isAlly ? -30 : 30,
            scale: 0.9,
            opacity: 0,
            duration: 0.45,
            ease: 'back.out(1.4)',
          });
          // Glow burst
          gsap.fromTo(
            el,
            { boxShadow: isAlly
              ? '0 0 0px rgba(59, 130, 246, 0)'
              : '0 0 0px rgba(245, 158, 11, 0)'
            },
            {
              boxShadow: isAlly
                ? '0 0 20px rgba(59, 130, 246, 0.4)'
                : '0 0 20px rgba(245, 158, 11, 0.4)',
              duration: 0.3,
              yoyo: true,
              repeat: 1,
              ease: 'power2.out',
            }
          );
        }
      } else if (prevHero !== null && curHero === null) {
        // Hero was removed: fade out + scale down, then reset
        gsap.fromTo(
          el,
          { opacity: 0.3, scale: 0.85 },
          { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
        );
      }
    }

    // Update prev state
    const newMap = new Map<number, string | null>();
    for (const step of draft.steps) {
      newMap.set(step.index, step.hero?.id ?? null);
    }
    prevHeroes.current = newMap;
  }, [draft.steps]);

  /* ── Helper: set ref for a slot ── */
  const setSlotRef = (index: number) => (el: HTMLDivElement | null) => {
    slotRefs.current.set(index, el);
  };

  /* ── Render a BAN slot ── */
  const renderBanSlot = (step: DraftStep) => {
    const isActive = draft.activeStepIndex === step.index;
    const isAlly = step.team === 'ally';
    const filled = !!step.hero;

    return (
      <div
        key={step.index}
        ref={setSlotRef(step.index)}
        className="group relative"
      >
        <button
          onClick={() => onStepClick(step.index)}
          className={`
            relative flex flex-col items-center justify-center
            w-16 h-20 sm:w-20 sm:h-24 rounded-lg transition-all duration-200
            ${isActive
              ? 'border-2 border-accent animate-pulse-glow shadow-lg scale-105'
              : filled
                ? 'border border-ban/50 bg-ban/10'
                : 'border border-dashed border-ban/40 bg-ban/5'
            }
          `}
        >
          {/* Active selecting label */}
          {isActive && !filled && (
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] sm:text-[9px] font-bold text-accent bg-bg-primary px-1.5 rounded-full whitespace-nowrap tracking-wider uppercase">
              Selecting...
            </span>
          )}

          {filled ? (
            <>
              {/* Hero icon with red diagonal strike-through */}
              <div className="relative">
                <HeroIcon hero={step.hero!} size="sm" className="opacity-70" />
                {/* Diagonal red line overlay */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 32 32"
                >
                  <line
                    x1="4" y1="4" x2="28" y2="28"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                </svg>
              </div>
              <span className="text-[9px] sm:text-[10px] text-ban-light mt-0.5 truncate max-w-full px-1 line-through">
                {step.hero!.name}
              </span>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-md border border-dashed border-ban/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-ban/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
              </div>
              <span className="text-[9px] sm:text-[10px] text-ban/50 mt-0.5 font-semibold uppercase">
                Ban
              </span>
            </>
          )}

          {/* Team indicator dot */}
          <span className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${
            isAlly ? 'bg-ally/60' : 'bg-enemy/60'
          }`} />
        </button>

        {/* Remove button */}
        {filled && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveHero(step.index); }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ban text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md"
          >
            x
          </button>
        )}
      </div>
    );
  };

  /* ── Render a PICK slot ── */
  const renderPickSlot = (step: DraftStep, slotNumber: number) => {
    const isActive = draft.activeStepIndex === step.index;
    const isAlly = step.team === 'ally';
    const filled = !!step.hero;

    // Use full class strings so Tailwind JIT can detect them
    const filledClasses = isAlly
      ? 'border border-ally/40 bg-ally/10 hover:bg-ally/15'
      : 'border border-enemy/40 bg-enemy/10 hover:bg-enemy/15';
    const emptyClasses = isAlly
      ? 'border border-dashed border-ally/30 bg-ally/5 hover:border-ally/50'
      : 'border border-dashed border-enemy/30 bg-enemy/5 hover:border-enemy/50';
    const activeClasses = isAlly
      ? 'border-2 border-accent animate-pulse-glow shadow-lg bg-ally/5'
      : 'border-2 border-accent animate-pulse-glow shadow-lg bg-enemy/5';

    return (
      <div
        key={step.index}
        ref={setSlotRef(step.index)}
        className="group relative"
      >
        <button
          onClick={() => onStepClick(step.index)}
          className={`
            relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200
            ${isActive ? activeClasses : filled ? filledClasses : emptyClasses}
          `}
        >
          {/* Active selecting label */}
          {isActive && !filled && (
            <span className="absolute -top-2 left-3 text-[8px] sm:text-[9px] font-bold text-accent bg-bg-primary px-1.5 rounded-full whitespace-nowrap tracking-wider uppercase">
              Selecting...
            </span>
          )}

          {/* Slot number */}
          <span className={`text-[10px] font-bold w-4 shrink-0 text-center ${
            isActive ? 'text-accent' : isAlly ? 'text-ally/50' : 'text-enemy/50'
          }`}>
            {slotNumber}
          </span>

          {/* Team color bar */}
          <span className={`w-1 h-8 rounded-full shrink-0 ${
            filled
              ? (isAlly ? 'bg-ally' : 'bg-enemy')
              : (isAlly ? 'bg-ally/30' : 'bg-enemy/30')
          }`} />

          {filled ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <HeroIcon hero={step.hero!} size="sm" className="shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-text-primary block truncate">
                  {step.hero!.name}
                </span>
                <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full mt-0.5 font-medium ${
                  ROLE_COLORS[step.hero!.role] ?? 'bg-gray-600/30 text-gray-300'
                }`}>
                  {step.hero!.role}
                </span>
              </div>
            </div>
          ) : (
            <span className={`text-xs flex-1 ${
              isActive ? 'text-accent/70' : isAlly ? 'text-ally/40' : 'text-enemy/40'
            }`}>
              {isAlly ? 'Ally' : 'Enemy'} pick
            </span>
          )}
        </button>

        {/* Remove button */}
        {filled && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveHero(step.index); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-ban text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md"
          >
            x
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="glass-card rounded-xl p-4 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-accent uppercase tracking-wider font-[family-name:var(--font-display)]">
          Draft Board
        </h2>
        <button
          onClick={onReset}
          className="text-xs text-text-muted hover:text-ban transition-colors px-2 py-1 rounded hover:bg-ban/10"
        >
          Reset
        </button>
      </div>

      {/* ── Map selector ── */}
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

      {/* ── First/Second pick segmented control ── */}
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Your team</label>
        <div className="relative flex bg-bg-primary rounded-lg p-0.5 border border-border">
          {/* Sliding highlight */}
          <div
            className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-md bg-ally/20 border border-ally/40 transition-transform duration-200 ease-out"
            style={{
              transform: draft.isFirstPick ? 'translateX(2px)' : 'translateX(calc(100% + 2px))',
            }}
          />
          <button
            onClick={() => onFirstPickChange(true)}
            className={`relative z-10 flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors duration-200 ${
              draft.isFirstPick ? 'text-ally' : 'text-text-muted'
            }`}
          >
            1st Pick
          </button>
          <button
            onClick={() => onFirstPickChange(false)}
            className={`relative z-10 flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors duration-200 ${
              !draft.isFirstPick ? 'text-ally' : 'text-text-muted'
            }`}
          >
            2nd Pick
          </button>
        </div>
      </div>

      {/* ── BAN SECTION ── */}
      <div>
        <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <svg className="w-3 h-3 text-ban/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          Bans
        </div>

        <div className="flex items-center gap-2 justify-center">
          {/* Ally bans */}
          <div className="flex gap-1.5">
            {allyBans.map(step => renderBanSlot(step))}
          </div>

          {/* Divider */}
          <div className="flex flex-col items-center gap-0.5 px-1">
            <span className="text-[8px] text-ally/60 font-bold uppercase">You</span>
            <div className="w-px h-6 bg-border" />
            <span className="text-[8px] text-enemy/60 font-bold uppercase">Foe</span>
          </div>

          {/* Enemy bans */}
          <div className="flex gap-1.5">
            {enemyBans.map(step => renderBanSlot(step))}
          </div>
        </div>
      </div>

      {/* ── Phase indicator badge ── */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-accent-purple-light bg-accent-purple/15 px-3 py-1 rounded-full uppercase tracking-wider border border-accent-purple/20">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-purple-light animate-pulse" />
          {phaseLabel}
        </span>
      </div>

      {/* ── PICKS SECTION ── */}
      <div>
        <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <svg className="w-3 h-3 text-accent/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Picks
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
          {/* ── Ally picks (left column) ── */}
          <div className="space-y-1.5">
            <div className="text-center text-[10px] font-bold text-ally/70 uppercase tracking-wider mb-1">
              Ally
            </div>
            {allyPicks.map((step, i) => renderPickSlot(step, i + 1))}
          </div>

          {/* ── Center divider ── */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-px h-full bg-gradient-to-b from-transparent via-border to-transparent" />
          </div>

          {/* ── Enemy picks (right column) ── */}
          <div className="space-y-1.5">
            <div className="text-center text-[10px] font-bold text-enemy/70 uppercase tracking-wider mb-1">
              Enemy
            </div>
            {enemyPicks.map((step, i) => renderPickSlot(step, i + 1))}
          </div>
        </div>
      </div>
    </div>
  );
}
