import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { DraftStep, Hero, HeroMeta } from '../types';
import { analyzeDraft, suggestFullComp } from '../services/draftAnalysis';
import { getTopSynergies } from '../services/matchupData';
import { HEROES_BY_NAME } from '../data/heroes';
import { MAPS_BY_ID } from '../data/maps';
import { HeroIcon } from './HeroIcon';
import { TierBadge } from './TierBadge';

interface DraftAdvisorProps {
  steps: DraftStep[];
  meta: HeroMeta[];
  mapId: string | null;
  onHeroClick: (hero: Hero) => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

function heroByName(name: string): Hero | undefined {
  return HEROES_BY_NAME[name.toLowerCase()];
}

export function DraftAdvisor({ steps, meta, mapId, onHeroClick }: DraftAdvisorProps) {
  const analysis = useMemo(() => analyzeDraft(steps, meta, mapId), [steps, meta, mapId]);
  const [compSeed, setCompSeed] = useState(0);

  const fullComp = useMemo(
    () => (meta.length > 0 ? suggestFullComp(steps, meta, mapId, compSeed) : null),
    [steps, meta, mapId, compSeed],
  );

  // Top heroes on this map by win rate (meta WR is already per-map).
  const topHeroes = useMemo(
    () => [...meta].filter(m => m.gamesPlayed >= 200).sort((a, b) => b.winRate - a.winRate).slice(0, 6),
    [meta],
  );

  // Strongest synergy duos on this map (per-map matchup data).
  const topDuos = useMemo(() => getTopSynergies(mapId, 6), [mapId]);

  const hasAnyPick = steps.some(s => s.hero);
  const nextStep = steps.find(s => !s.hero);
  const showBans = nextStep?.action === 'ban';
  const mapName = mapId ? MAPS_BY_ID[mapId]?.name : null;

  if (!mapId && meta.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-4">
        <h2 className="text-sm font-bold text-accent uppercase tracking-wider font-[family-name:var(--font-display)] mb-3">
          Draft Advisor
        </h2>
        <p className="text-sm text-text-muted text-center py-6">
          Select a map and sync data to get recommendations
        </p>
      </div>
    );
  }

  const isBanPhaseActive = showBans || !hasAnyPick;
  const suggestionsActive = isBanPhaseActive ? analysis.banSuggestions : analysis.pickSuggestions;
  const tone = isBanPhaseActive
    ? { accent: 'text-ban-light', bar: 'border-l-ban', bg: 'bg-ban/10', bd: 'border-ban/20', hover: 'hover:bg-ban/15 hover:border-ban/50', icon: '⛔', label: 'Suggested Bans', hdBg: 'bg-ban/10', hdBd: 'border-ban/30' }
    : { accent: 'text-ally-light', bar: 'border-l-ally', bg: 'bg-ally/10', bd: 'border-ally/20', hover: 'hover:bg-ally/15 hover:border-ally/50', icon: '✦', label: 'Suggested Picks', hdBg: 'bg-ally/10', hdBd: 'border-ally/30' };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5">
      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ boxShadow: '0 0 8px rgba(245,183,61,0.9)' }} />
        <h2 className="text-base font-extrabold uppercase tracking-[0.14em] text-text-primary font-[family-name:var(--font-display)]">
          Draft <span className="text-gradient-accent">Advisor</span>
        </h2>
      </div>

      {/* Landscape body: 3 columns using the full width */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ── Composition status ── */}
        <div className="lg:col-span-3 space-y-2">
          <SectionHeader icon="✓" label="Team Composition" colorClass="text-accent" bgClass="bg-accent/10" borderClass="border-accent/30" />
          {hasAnyPick && analysis.compChecks.length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5">
              {analysis.compChecks.map(c => (
                <div
                  key={c.label}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
                    c.ok ? 'bg-map-strong/10 border-map-strong/25' : 'bg-map-weak/10 border-map-weak/25'
                  }`}
                  title={c.detail}
                >
                  <span className={`text-sm font-bold shrink-0 ${c.ok ? 'text-map-strong' : 'text-map-weak'}`}>{c.ok ? '✓' : '✗'}</span>
                  <span className={`text-[11px] font-medium ${c.ok ? 'text-map-strong' : 'text-map-weak'}`}>{c.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-text-muted px-1 py-3">Pick heroes to see role coverage.</p>
          )}
        </div>

        {/* ── Primary suggestions (active phase) ── */}
        <div className="lg:col-span-6 space-y-2">
          <SectionHeader icon={tone.icon} label={tone.label} colorClass={tone.accent} bgClass={tone.hdBg} borderClass={tone.hdBd} />
          {suggestionsActive.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-1.5">
              {suggestionsActive.map(({ hero, meta: m, reasons }, i) => (
                <motion.button
                  key={hero.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: Math.min(i * 0.05, 0.3), ease }}
                  onClick={() => onHeroClick(hero)}
                  className={`w-full flex items-center gap-2.5 ${tone.bg} border-l-4 ${tone.bar} border ${tone.bd} rounded-lg px-3 py-2.5 ${tone.hover} transition-colors text-left`}
                >
                  <span className={`text-sm font-bold w-4 text-center ${tone.accent}`}>{i + 1}</span>
                  <HeroIcon hero={hero} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary truncate">{hero.name}</span>
                      {m && <TierBadge tier={m.tier} />}
                      {m && <span className="text-[11px] text-text-muted font-medium">{m.winRate.toFixed(1)}%</span>}
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed mt-0.5 line-clamp-1">
                      {reasons.slice(0, 3).join(' · ')}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-text-muted px-1 py-3">No recommendations yet.</p>
          )}
        </div>

        {/* ── Alerts: warnings + synergies ── */}
        <div className="lg:col-span-3 space-y-3">
          {analysis.warnings.length > 0 && (
            <div className="space-y-2">
              <SectionHeader icon="⚠" label="Warnings" colorClass="text-amber-300" bgClass="bg-amber-500/10" borderClass="border-amber-500/25" />
              {analysis.warnings.map((w, i) => (
                <motion.div key={w} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: Math.min(i * 0.05, 0.25), ease }} className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2.5 py-2">
                  <span className="text-amber-400 text-xs mt-0.5 shrink-0">⚠</span>
                  <span className="text-[11px] text-amber-200/90 leading-relaxed">{w}</span>
                </motion.div>
              ))}
            </div>
          )}

          {analysis.synergiesFound.length > 0 && (
            <div className="space-y-2">
              <SectionHeader icon="⚡" label="Synergies" colorClass="text-positive" bgClass="bg-positive/10" borderClass="border-positive/30" />
              {analysis.synergiesFound.map((s, i) => (
                <motion.div key={s} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: Math.min(i * 0.05, 0.25), ease }} className="flex items-center gap-2 bg-positive/5 border-l-4 border-l-positive border border-positive/15 rounded-lg px-2.5 py-1.5">
                  <span className="text-positive text-xs shrink-0">⚡</span>
                  <span className="text-[11px] text-positive font-medium">{s}</span>
                </motion.div>
              ))}
            </div>
          )}

          {analysis.warnings.length === 0 && analysis.synergiesFound.length === 0 && (
            <>
              <SectionHeader icon="◇" label="Alerts" colorClass="text-text-muted" bgClass="bg-white/5" borderClass="border-border" />
              <p className="text-[11px] text-text-muted px-1 py-2">No warnings or synergies detected.</p>
            </>
          )}
        </div>
      </div>

      {/* ── MAP INTEL: best comp, top heroes & top duos for this battleground ── */}
      {meta.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-accent-light font-[family-name:var(--font-display)] whitespace-nowrap">
              Best on <span className="text-text-primary">{mapName ?? 'this map'}</span>
            </h3>
            <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Best comp */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <SectionHeader icon="★" label="Best Comp" colorClass="text-accent-light" bgClass="bg-accent/10" borderClass="border-accent/30" />
                <button
                  onClick={() => setCompSeed(s => s + 1)}
                  className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
                  title="Show another strong comp"
                >
                  ↻ Another
                </button>
              </div>
              {fullComp && fullComp.heroes.length > 0 ? (
                <>
                  <p className="text-[11px] text-accent italic px-1 truncate">{fullComp.strategy}</p>
                  {fullComp.heroes.map(({ hero, role, reason }) => (
                    <button
                      key={hero.id}
                      onClick={() => onHeroClick(hero)}
                      className="w-full flex items-center gap-2.5 bg-accent/5 border-l-4 border-l-accent border border-accent/15 rounded-lg px-2.5 py-2 hover:border-accent/40 hover:bg-accent/10 transition-colors text-left"
                    >
                      <HeroIcon hero={hero} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold text-text-primary truncate">{hero.name}</span>
                          <span className="text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">{role}</span>
                        </div>
                        <p className="text-[10px] text-text-muted truncate">{reason}</p>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <p className="text-[11px] text-text-muted px-1 py-3">Full team already drafted.</p>
              )}
            </div>

            {/* Top heroes */}
            <div className="space-y-2">
              <SectionHeader icon="▲" label="Top Heroes" colorClass="text-positive" bgClass="bg-positive/10" borderClass="border-positive/30" />
              {topHeroes.map((m, i) => {
                const hero = heroByName(m.hero);
                if (!hero) return null;
                return (
                  <button
                    key={m.hero}
                    onClick={() => onHeroClick(hero)}
                    className="w-full flex items-center gap-2.5 bg-white/[0.02] border border-border rounded-lg px-2.5 py-1.5 hover:bg-white/5 hover:border-accent/30 transition-colors text-left"
                  >
                    <span className="text-[11px] font-bold text-text-muted w-3 text-center">{i + 1}</span>
                    <HeroIcon hero={hero} size="sm" />
                    <span className="text-[13px] font-semibold text-text-primary truncate flex-1">{hero.name}</span>
                    <TierBadge tier={m.tier} />
                    <span className="text-[11px] font-semibold text-positive w-12 text-right">{m.winRate.toFixed(1)}%</span>
                  </button>
                );
              })}
            </div>

            {/* Top synergy duos */}
            <div className="space-y-2">
              <SectionHeader icon="⚡" label="Top Synergy Duos" colorClass="text-accent" bgClass="bg-accent/10" borderClass="border-accent/30" />
              {topDuos.length > 0 ? topDuos.map((duo, i) => {
                const a = heroByName(duo.a), b = heroByName(duo.b);
                return (
                  <div key={`${duo.a}-${duo.b}-${i}`} className="flex items-center gap-2.5 bg-white/[0.02] border border-border rounded-lg px-2.5 py-1.5">
                    <div className="flex -space-x-1.5 shrink-0">
                      {a && <HeroIcon hero={a} size="sm" className="ring-2 ring-bg-card" />}
                      {b && <HeroIcon hero={b} size="sm" className="ring-2 ring-bg-card" />}
                    </div>
                    <span className="text-[12px] font-medium text-text-primary truncate flex-1">{duo.a} + {duo.b}</span>
                    <span className="text-[11px] font-bold text-positive shrink-0">+{duo.delta.toFixed(1)}%</span>
                  </div>
                );
              }) : (
                <p className="text-[11px] text-text-muted px-1 py-3">No synergy data for this map.</p>
              )}
            </div>
          </div>
        </div>
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
