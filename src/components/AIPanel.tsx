import { useCallback, useState } from 'react';
import type { DraftAdvice, DraftState, HeroMeta, MapFit, UserPreferences } from '../types';
import { getDraftAdvice } from '../services/claude';
import { TierBadge } from './TierBadge';

interface AIPanelProps {
  draft: DraftState;
  meta: HeroMeta[];
  prefs: UserPreferences;
  onScreenshotClick: () => void;
}

const mapFitColors: Record<MapFit, string> = {
  strong: 'text-map-strong',
  neutral: 'text-map-neutral',
  weak: 'text-map-weak',
};

const mapFitDots: Record<MapFit, string> = {
  strong: 'bg-map-strong',
  neutral: 'bg-map-neutral',
  weak: 'bg-map-weak',
};

const medals = ['text-tier-s', 'text-tier-a', 'text-tier-b'];

export function AIPanel({ draft, meta, prefs, onScreenshotClick }: AIPanelProps) {
  const [advice, setAdvice] = useState<DraftAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetPicks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDraftAdvice(draft, meta, prefs);
      setAdvice(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI advice');
    } finally {
      setLoading(false);
    }
  }, [draft, meta, prefs]);

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-4">
      <h2 className="text-sm font-bold text-accent-purple uppercase tracking-wider font-[family-name:var(--font-display)]">
        AI Recommendations
      </h2>

      <div className="flex gap-2">
        <button
          onClick={handleGetPicks}
          disabled={loading}
          className="flex-1 bg-accent-purple hover:bg-accent-purple/80 disabled:bg-accent-purple/40 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Thinking...
            </span>
          ) : (
            'Suggest Picks'
          )}
        </button>
        <button
          onClick={onScreenshotClick}
          className="bg-bg-primary border border-border hover:border-accent/40 text-text-secondary hover:text-text-primary py-2.5 px-3 rounded-lg transition-colors text-sm"
          title="Analyze screenshot"
        >
          Screenshot
        </button>
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {advice && (
        <div className="space-y-3">
          {advice.recommendations.map((rec, i) => (
            <div
              key={rec.hero}
              className="bg-bg-primary border border-border rounded-lg p-3 hover:border-border-active transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-lg font-bold ${medals[i] ?? 'text-text-muted'}`}>
                  #{i + 1}
                </span>
                <span className="font-semibold text-text-primary flex-1">{rec.hero}</span>
                <TierBadge tier={rec.tier} />
                <span className={`flex items-center gap-1 text-xs ${mapFitColors[rec.mapFit]}`}>
                  <span className={`w-2 h-2 rounded-full ${mapFitDots[rec.mapFit]}`} />
                  {rec.mapFit}
                </span>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed mb-2">
                {rec.reasoning}
              </p>

              <div className="flex flex-wrap gap-1">
                {rec.synergyWith.map(h => (
                  <span key={h} className="text-[10px] bg-ally/10 text-ally px-1.5 py-0.5 rounded">
                    + {h}
                  </span>
                ))}
                {rec.counters.map(h => (
                  <span key={h} className="text-[10px] bg-enemy/10 text-enemy px-1.5 py-0.5 rounded">
                    vs {h}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {advice.teamCompAnalysis && (
            <div className="bg-accent-purple/5 border border-accent-purple/20 rounded-lg p-3">
              <span className="text-xs font-semibold text-accent-purple-light block mb-1">Team Analysis</span>
              <p className="text-xs text-text-secondary">{advice.teamCompAnalysis}</p>
            </div>
          )}

          {advice.warning && (
            <div className="bg-yellow-950/30 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-xs text-yellow-400">{advice.warning}</p>
            </div>
          )}
        </div>
      )}

      {!advice && !loading && !error && (
        <div className="text-center py-8">
          <p className="text-text-muted text-sm">
            Set up your draft and click "Suggest Picks" for AI recommendations
          </p>
        </div>
      )}
    </div>
  );
}
