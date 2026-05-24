import { useCallback, useRef, useState } from 'react';
import type { DraftPhase, Hero, ScreenshotResult } from '../types';
import { analyzeScreenshot } from '../services/claude';
import { findHero } from '../data/heroes';

interface ScreenshotAnalyzerProps {
  onApply: (data: {
    map: string | null;
    enemyBans: Hero[];
    allyBans: Hero[];
    enemyPicks: Hero[];
    allyPicks: Hero[];
    phase: DraftPhase;
  }) => void;
  onClose: () => void;
}

export function ScreenshotAnalyzer({ onApply, onClose }: ScreenshotAnalyzerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScreenshotResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);

      const base64 = dataUrl.split(',')[1];
      const mimeType = file.type;

      setLoading(true);
      setError(null);
      try {
        const res = await analyzeScreenshot(base64, mimeType);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to analyze screenshot');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }, [handleFile]);

  const handleApply = useCallback(() => {
    if (!result) return;

    const resolveHeroes = (names: string[]) =>
      names.map(n => findHero(n)).filter((h): h is Hero => h !== undefined);

    onApply({
      map: result.map,
      enemyBans: resolveHeroes(result.enemyBans),
      allyBans: resolveHeroes(result.allyBans),
      enemyPicks: resolveHeroes(result.enemyPicks),
      allyPicks: resolveHeroes(result.allyPicks),
      phase: result.phase,
    });
    onClose();
  }, [result, onApply, onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-bg-card border border-border rounded-xl w-full max-w-xl p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-accent-purple-light font-[family-name:var(--font-display)]">
            Screenshot Analyzer
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">\u00D7</button>
        </div>

        {!preview && (
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-accent/40 transition-colors"
          >
            <p className="text-text-secondary text-sm">Drop a screenshot here or click to upload</p>
            <p className="text-text-muted text-xs mt-1">Supports PNG, JPG</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        )}

        {preview && (
          <img src={preview} alt="Draft screenshot" className="w-full rounded-lg border border-border" />
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-4">
            <span className="w-5 h-5 border-2 border-accent-purple/30 border-t-accent-purple rounded-full animate-spin" />
            <span className="text-sm text-text-secondary">Analyzing screenshot...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {result && !loading && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-text-primary">Detected:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-text-muted">Map:</span>{' '}
                <span className="text-text-primary">{result.map ?? 'Unknown'}</span>
              </div>
              <div>
                <span className="text-text-muted">Phase:</span>{' '}
                <span className="text-accent-purple-light">{result.phase}</span>
              </div>
              <div>
                <span className="text-enemy/70">Enemy Bans:</span>{' '}
                <span className="text-text-primary">{result.enemyBans.join(', ') || 'None'}</span>
              </div>
              <div>
                <span className="text-ally/70">Ally Bans:</span>{' '}
                <span className="text-text-primary">{result.allyBans.join(', ') || 'None'}</span>
              </div>
              <div>
                <span className="text-enemy/70">Enemy Picks:</span>{' '}
                <span className="text-text-primary">{result.enemyPicks.join(', ') || 'None'}</span>
              </div>
              <div>
                <span className="text-ally/70">Ally Picks:</span>{' '}
                <span className="text-text-primary">{result.allyPicks.join(', ') || 'None'}</span>
              </div>
            </div>

            <button
              onClick={handleApply}
              className="w-full bg-accent-purple hover:bg-accent-purple/80 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-3"
            >
              Apply to Draft
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
