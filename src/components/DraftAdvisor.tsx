import { useCallback, useMemo, useState } from 'react';
import type { DraftStep, Hero, HeroMeta } from '../types';
import { analyzeDraft, suggestFullComp, type CompSuggestion } from '../services/draftAnalysis';
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

  const [fullComp, setFullComp] = useState<CompSuggestion | null>(null);

  const handleSuggestComp = useCallback(() => {
    const comp = suggestFullComp(steps, meta, mapId);
    setFullComp(comp);
  }, [steps, meta, mapId]);

  const hasAnyPick = steps.some(s => s.hero);
  const nextStep = steps.find(s => !s.hero);
  const showBans = nextStep?.action === 'ban';
  const showPicks = nextStep?.action === 'pick' && nextStep.team === 'ally';

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

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-accent-purple uppercase tracking-wider font-[family-name:var(--font-display)]">
          Draft Advisor
        </h2>
        {mapId && meta.length > 0 && (
          <button
            onClick={handleSuggestComp}
            className="text-[11px] bg-accent-purple/20 hover:bg-accent-purple/30 text-accent-purple-light border border-accent-purple/30 px-2.5 py-1 rounded-lg transition-colors font-medium"
          >
            Suggest Comp
          </button>
        )}
      </div>

      {/* Full comp suggestion */}
      {fullComp && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] text-text-muted uppercase tracking-wider">Suggested Composition</h3>
            <button onClick={() => setFullComp(null)} className="text-[10px] text-text-muted hover:text-text-primary">
              ×
            </button>
          </div>
          <p className="text-[10px] text-accent-purple-light">{fullComp.strategy}</p>
          {fullComp.heroes.map(({ hero, role, reason }) => (
            <button
              key={hero.id}
              onClick={() => onHeroClick(hero)}
              className="w-full flex items-center gap-2 bg-accent-purple/5 border border-accent-purple/15 rounded-lg px-3 py-2 hover:border-accent-purple/40 transition-colors text-left"
            >
              <HeroIcon hero={hero} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-text-primary">{hero.name}</span>
                  <span className="text-[10px] text-accent-purple-light bg-accent-purple/10 px-1.5 py-0.5 rounded">{role}</span>
                </div>
                <p className="text-[10px] text-text-muted truncate">{reason}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Warnings */}
      {analysis.warnings.map((w, i) => (
        <div key={i} className="bg-yellow-950/30 border border-yellow-500/30 rounded-lg px-3 py-2 text-xs text-yellow-400">
          {w}
        </div>
      ))}

      {/* Composition checks */}
      {hasAnyPick && (
        <div>
          <h3 className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Team Composition</h3>
          <div className="flex flex-wrap gap-1.5">
            {analysis.compChecks.map(c => (
              <span
                key={c.label}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border ${
                  c.ok
                    ? 'bg-map-strong/10 text-map-strong border-map-strong/20'
                    : 'bg-map-weak/10 text-map-weak border-map-weak/20'
                }`}
                title={c.detail}
              >
                <span>{c.ok ? '\u2713' : '\u2717'}</span>
                {c.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Synergies found */}
      {analysis.synergiesFound.length > 0 && (
        <div>
          <h3 className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Synergies</h3>
          {analysis.synergiesFound.map((s, i) => (
            <div key={i} className="text-xs text-accent-purple-light bg-accent-purple/5 rounded-lg px-3 py-1.5 mb-1">
              {s}
            </div>
          ))}
        </div>
      )}

      {/* Ban suggestions */}
      {(showBans || !hasAnyPick) && analysis.banSuggestions.length > 0 && (
        <div>
          <h3 className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Suggested Bans</h3>
          <div className="space-y-1">
            {analysis.banSuggestions.map(({ hero, meta: m, reasons }, i) => (
              <button
                key={hero.id}
                onClick={() => onHeroClick(hero)}
                className="w-full flex items-center gap-2 bg-red-950/10 border border-red-500/10 rounded-lg px-3 py-2 hover:border-red-500/30 transition-colors text-left"
              >
                <span className="text-xs font-bold text-red-400/60 w-4">{i + 1}</span>
                <HeroIcon hero={hero} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-text-primary">{hero.name}</span>
                    <TierBadge tier={m.tier} />
                    <span className="text-[10px] text-text-muted">{m.winRate.toFixed(1)}% WR</span>
                  </div>
                  <p className="text-[10px] text-text-muted leading-relaxed mt-0.5 truncate">
                    {reasons.slice(0, 2).join(' · ')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pick suggestions */}
      {(showPicks || (!showBans && hasAnyPick)) && analysis.pickSuggestions.length > 0 && (
        <div>
          <h3 className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Suggested Picks</h3>
          <div className="space-y-1">
            {analysis.pickSuggestions.map(({ hero, meta: m, reasons }, i) => (
              <button
                key={hero.id}
                onClick={() => onHeroClick(hero)}
                className="w-full flex items-center gap-2 bg-ally/5 border border-ally/10 rounded-lg px-3 py-2 hover:border-ally/30 transition-colors text-left"
              >
                <span className="text-xs font-bold text-ally/60 w-4">{i + 1}</span>
                <HeroIcon hero={hero} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-text-primary">{hero.name}</span>
                    {m && <TierBadge tier={m.tier} />}
                    {m && <span className="text-[10px] text-text-muted">{m.winRate.toFixed(1)}% WR</span>}
                  </div>
                  <p className="text-[10px] text-text-muted leading-relaxed mt-0.5">
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
