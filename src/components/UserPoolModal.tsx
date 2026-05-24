import { useCallback, useState } from 'react';
import type { HeroRole, UserPreferences } from '../types';
import { HEROES } from '../data/heroes';
import { HeroIcon } from './HeroIcon';

interface UserPoolModalProps {
  prefs: UserPreferences;
  onSave: (prefs: UserPreferences) => void;
  onClose: () => void;
}

const ROLES: (HeroRole | null)[] = [null, 'Tank', 'Bruiser', 'Healer', 'Support', 'Melee Assassin', 'Ranged Assassin'];

export function UserPoolModal({ prefs, onSave, onClose }: UserPoolModalProps) {
  const [heroPool, setHeroPool] = useState<Set<string>>(new Set(prefs.heroPool));
  const [mainRole, setMainRole] = useState<HeroRole | null>(prefs.mainRole);
  const [playstyleNotes, setPlaystyleNotes] = useState(prefs.playstyleNotes);
  const [filterRole, setFilterRole] = useState<HeroRole | null>(null);

  const toggleHero = useCallback((name: string) => {
    setHeroPool(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    onSave({
      heroPool: Array.from(heroPool),
      mainRole,
      playstyleNotes,
    });
    onClose();
  }, [heroPool, mainRole, playstyleNotes, onSave, onClose]);

  const filteredHeroes = filterRole
    ? HEROES.filter(h => h.role === filterRole)
    : HEROES;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-bg-card border border-border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-text-primary font-[family-name:var(--font-display)]">
            Your Hero Pool & Preferences
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl">\u00D7</button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Main role */}
          <div>
            <label className="text-xs text-text-secondary block mb-1.5">Main Role</label>
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map(role => (
                <button
                  key={role ?? 'all'}
                  onClick={() => setMainRole(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    mainRole === role
                      ? 'bg-accent-purple/20 text-accent-purple-light border border-accent-purple/40'
                      : 'bg-bg-primary text-text-secondary hover:text-text-primary border border-transparent'
                  }`}
                >
                  {role ?? 'Flexible'}
                </button>
              ))}
            </div>
          </div>

          {/* Playstyle notes */}
          <div>
            <label className="text-xs text-text-secondary block mb-1.5">Playstyle Notes</label>
            <textarea
              value={playstyleNotes}
              onChange={e => setPlaystyleNotes(e.target.value)}
              placeholder="e.g. I prefer aggressive dive, I'm good at skillshots..."
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none h-20"
            />
          </div>

          {/* Hero pool */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-text-secondary">
                Hero Pool ({heroPool.size} selected)
              </label>
              <div className="flex gap-1">
                {(['Tank', 'Bruiser', 'Healer', 'Support', 'Melee Assassin', 'Ranged Assassin'] as HeroRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => setFilterRole(filterRole === role ? null : role)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      filterRole === role ? 'bg-accent/20 text-accent' : 'bg-bg-primary text-text-muted'
                    }`}
                  >
                    {role.replace('Assassin', 'Ass.')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-1.5">
              {filteredHeroes.map(hero => {
                const isSelected = heroPool.has(hero.name);
                return (
                  <button
                    key={hero.id}
                    onClick={() => toggleHero(hero.name)}
                    className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-accent/10 border border-accent/40 glow-accent'
                        : 'bg-bg-primary border border-transparent hover:border-border opacity-50 hover:opacity-100'
                    }`}
                    title={hero.name}
                  >
                    <HeroIcon hero={hero} size="sm" />
                    <span className="text-[9px] text-text-muted truncate w-full text-center">
                      {hero.name.length > 8 ? hero.name.slice(0, 7) + '\u2026' : hero.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-accent hover:bg-accent/80 text-bg-primary font-semibold px-6 py-2 rounded-lg transition-colors text-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
