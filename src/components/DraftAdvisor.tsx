import { useMemo, useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { DraftStep, Hero, HeroMeta } from '../types';
import { analyzeDraft, suggestFullComp } from '../services/draftAnalysis';
import { HeroIcon } from './HeroIcon';
import { TierBadge } from './TierBadge';

interface DraftAdvisorProps {
  steps: DraftStep[];
  meta: HeroMeta[];
  mapId: string | null;
  onHeroClick: (hero: Hero) => void;
}

export function DraftAdvisor({ steps, meta, mapId, onHeroClick }: DraftAdvisorProps) {
  const analysis = useMemo(
    () => analyzeDraft(steps, meta, mapId),
    [steps, meta, mapId]
  );

  const [showComp, setShowComp] = useState(false);

  const fullComp = useMemo(
    () => (showComp ? suggestFullComp(steps, meta, mapId) : null),
    [showComp, steps, meta, mapId],
  );

  const hasAnyPick = steps.some(s => s.hero);
  const nextStep = steps.find(s => !s.hero);
  const showBans = nextStep?.action === 'ban';
  const showPicks = nextStep?.action === 'pick' && nextStep.team === 'ally';

  // Refs for GSAP animations
  const banCardsRef = useRef<HTMLDivElement>(null);
  const pickCardsRef = useRef<HTMLDivElement>(null);
  const compCardsRef = useRef<HTMLDivElement>(null);
  const warningsRef = useRef<HTMLDivElement>(null);
  const synergiesRef = useRef<HTMLDivElement>(null);

  // Animate ban suggestions when they change
  useEffect(() => {
    if (banCardsRef.current) {
      const cards = banCardsRef.current.querySelectorAll('.suggestion-card');
      if (cards.length > 0) {
        gsap.from(cards, {
          opacity: 0,
          y: 20,
          stagger: 0.08,
          duration: 0.4,
          ease: 'power2.out',
        });
      }
    }
  }, [analysis.banSuggestions]);

  // Animate pick suggestions when they change
  useEffect(() => {
    if (pickCardsRef.current) {
      const cards = pickCardsRef.current.querySelectorAll('.suggestion-card');
      if (cards.length > 0) {
        gsap.from(cards, {
          opacity: 0,
          y: 20,
          stagger: 0.08,
          duration: 0.4,
          ease: 'power2.out',
        });
      }
    }
  }, [analysis.pickSuggestions]);

  // Animate comp suggestions when they appear
  useEffect(() => {
    if (compCardsRef.current) {
      const cards = compCardsRef.current.querySelectorAll('.suggestion-card');
      if (cards.length > 0) {
        gsap.from(cards, {
          opacity: 0,
          y: 20,
          stagger: 0.08,
          duration: 0.4,
          ease: 'power2.out',
        });
      }
    }
  }, [fullComp]);

  // Animate warnings
  useEffect(() => {
    if (warningsRef.current) {
      const items = warningsRef.current.querySelectorAll('.warning-item');
      if (items.length > 0) {
        gsap.from(items, {
          opacity: 0,
          y: 12,
          stagger: 0.06,
          duration: 0.35,
          ease: 'power2.out',
        });
      }
    }
  }, [analysis.warnings]);

  // Animate synergies
  useEffect(() => {
    if (synergiesRef.current) {
      const items = synergiesRef.current.querySelectorAll('.synergy-item');
      if (items.length > 0) {
        gsap.from(items, {
          opacity: 0,
          x: -12,
          stagger: 0.06,
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    }
  }, [analysis.synergiesFound]);

  if (!mapId && meta.length === 0) {
    return (
      <div className="bg-bg-card border border-border rounded-xl p-4">
        <h2 className="text-sm font-bold text-accent-purple uppercase tracking-wider font-[family-name:var(--font-display)] mb-3">
          Draft Advisor
        </h2>
        <p className="text-sm text-text-muted text-center py-6">
          Select a map and sync data to get recommendations
        </p>
      </div>
    );
  }

  const isBanPhaseActive = showBans || !hasAnyPick;
  const isPickPhaseActive = showPicks || (!showBans && hasAnyPick);

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-accent-purple uppercase tracking-wider font-[family-name:var(--font-display)]">
          Draft Advisor
        </h2>
        {mapId && meta.length > 0 && (
          <button
            onClick={() => setShowComp(v => !v)}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-all duration-200 border ${
              showComp
                ? 'bg-accent-purple text-white border-accent-purple glow-purple shadow-lg'
                : 'bg-accent-purple/15 hover:bg-accent-purple/25 text-accent-purple-light border-accent-purple/30 hover:border-accent-purple/50'
            }`}
          >
            {showComp ? '★ Comp Active' : '★ Suggest Comp'}
          </button>
        )}
      </div>

      {/* Full comp suggestion */}
      {fullComp && (
        <div className="space-y-2" ref={compCardsRef}>
          <SectionHeader
            icon="★"
            label="Suggested Composition"
            colorClass="text-accent-purple-light"
            bgClass="bg-accent-purple/10"
            borderClass="border-accent-purple/30"
          />
          <p className="text-xs text-accent-purple-light italic px-1">{fullComp.strategy}</p>
          {fullComp.heroes.map(({ hero, role, reason }, i) => (
            <button
              key={hero.id}
              onClick={() => onHeroClick(hero)}
              className="suggestion-card w-full flex items-center gap-3 bg-accent-purple/5 border-l-4 border-l-accent-purple border border-accent-purple/15 rounded-lg px-3 py-2.5 hover:border-accent-purple/40 hover:bg-accent-purple/10 transition-colors text-left"
            >
              <span className="text-sm font-bold text-accent-purple/70 w-5 text-center">{i + 1}</span>
              <HeroIcon hero={hero} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">{hero.name}</span>
                  <span className="text-[10px] font-bold text-accent-purple-light bg-accent-purple/15 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {role}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-0.5 truncate">{reason}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Warnings */}
      {analysis.warnings.length > 0 && (
        <div className="space-y-2" ref={warningsRef}>
          <SectionHeader
            icon="⚠"
            label="Warnings"
            colorClass="text-amber-400"
            bgClass="bg-amber-950/30"
            borderClass="border-amber-500/30"
          />
          {analysis.warnings.map((w, i) => (
            <div
              key={i}
              className="warning-item flex items-start gap-2.5 bg-amber-950/20 border border-amber-500/25 rounded-lg px-3 py-2.5"
            >
              <span className="text-amber-400 text-sm mt-0.5 shrink-0">⚠</span>
              <span className="text-xs text-amber-300 leading-relaxed">{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Composition checks */}
      {hasAnyPick && analysis.compChecks.length > 0 && (
        <div className="space-y-2">
          <SectionHeader
            icon="✓"
            label="Team Composition"
            colorClass="text-accent"
            bgClass="bg-accent/10"
            borderClass="border-accent/30"
          />
          <div className="grid grid-cols-2 gap-2">
            {analysis.compChecks.map(c => (
              <div
                key={c.label}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  c.ok
                    ? 'bg-map-strong/8 border-map-strong/20'
                    : 'bg-map-weak/8 border-map-weak/20 animate-[pulse_3s_ease-in-out_infinite]'
                }`}
                title={c.detail}
              >
                <span
                  className={`text-base font-bold shrink-0 ${
                    c.ok ? 'text-map-strong' : 'text-map-weak'
                  }`}
                >
                  {c.ok ? '✓' : '✗'}
                </span>
                <span
                  className={`text-xs font-medium ${
                    c.ok ? 'text-map-strong' : 'text-map-weak'
                  }`}
                >
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Synergies found */}
      {analysis.synergiesFound.length > 0 && (
        <div className="space-y-2" ref={synergiesRef}>
          <SectionHeader
            icon="⚡"
            label="Synergies"
            colorClass="text-positive"
            bgClass="bg-positive/10"
            borderClass="border-positive/30"
          />
          {analysis.synergiesFound.map((s, i) => (
            <div
              key={i}
              className="synergy-item flex items-center gap-2.5 bg-positive/5 border-l-4 border-l-positive border border-positive/15 rounded-lg px-3 py-2"
            >
              <span className="text-positive text-sm shrink-0">⚡</span>
              <span className="text-xs text-positive-light">{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* Ban suggestions */}
      {isBanPhaseActive && analysis.banSuggestions.length > 0 && (
        <div
          className={`space-y-2 transition-opacity duration-300 ${
            isBanPhaseActive ? 'opacity-100' : 'opacity-60'
          }`}
          ref={banCardsRef}
        >
          <SectionHeader
            icon="⛔"
            label="Suggested Bans"
            colorClass="text-ban-light"
            bgClass="bg-ban/10"
            borderClass="border-ban/30"
          />
          <div className="space-y-1.5">
            {analysis.banSuggestions.map(({ hero, meta: m, reasons }, i) => (
              <button
                key={hero.id}
                onClick={() => onHeroClick(hero)}
                className="suggestion-card w-full flex items-center gap-3 bg-red-950/20 border-l-4 border-l-ban border border-ban/15 rounded-lg px-3 py-2.5 hover:border-ban/40 hover:bg-red-950/30 transition-colors text-left"
              >
                <span className="text-sm font-bold text-ban w-5 text-center">{i + 1}</span>
                <HeroIcon hero={hero} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">{hero.name}</span>
                    <TierBadge tier={m.tier} />
                    <span className="text-[11px] text-text-muted font-medium">{m.winRate.toFixed(1)}% WR</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed mt-0.5 line-clamp-1">
                    {reasons.slice(0, 2).join(' · ')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pick suggestions */}
      {isPickPhaseActive && analysis.pickSuggestions.length > 0 && (
        <div
          className={`space-y-2 transition-opacity duration-300 ${
            isPickPhaseActive ? 'opacity-100' : 'opacity-60'
          }`}
          ref={pickCardsRef}
        >
          <SectionHeader
            icon="✦"
            label="Suggested Picks"
            colorClass="text-ally-light"
            bgClass="bg-ally/10"
            borderClass="border-ally/30"
          />
          <div className="space-y-1.5">
            {analysis.pickSuggestions.map(({ hero, meta: m, reasons }, i) => (
              <button
                key={hero.id}
                onClick={() => onHeroClick(hero)}
                className="suggestion-card w-full flex items-center gap-3 bg-blue-950/20 border-l-4 border-l-ally border border-ally/15 rounded-lg px-3 py-2.5 hover:border-ally/40 hover:bg-blue-950/30 transition-colors text-left"
              >
                <span className="text-sm font-bold text-ally w-5 text-center">{i + 1}</span>
                <HeroIcon hero={hero} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">{hero.name}</span>
                    {m && <TierBadge tier={m.tier} />}
                    {m && <span className="text-[11px] text-text-muted font-medium">{m.winRate.toFixed(1)}% WR</span>}
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed mt-0.5 line-clamp-1">
                    {reasons.slice(0, 3).join(' · ')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!hasAnyPick && analysis.banSuggestions.length === 0 && meta.length > 0 && (
        <p className="text-xs text-text-muted text-center py-4">
          Start your draft to see recommendations
        </p>
      )}
    </div>
  );
}

/* ── Section Header sub-component ── */

interface SectionHeaderProps {
  icon: string;
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

function SectionHeader({ icon, label, colorClass, bgClass, borderClass }: SectionHeaderProps) {
  return (
    <div className={`flex items-center gap-2 ${bgClass} ${borderClass} border rounded-md px-3 py-1.5`}>
      <span className={`${colorClass} text-sm`}>{icon}</span>
      <h3 className={`text-[11px] font-bold uppercase tracking-wider ${colorClass}`}>
        {label}
      </h3>
    </div>
  );
}
