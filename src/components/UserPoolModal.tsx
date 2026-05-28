import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
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
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Animate entrance
  useEffect(() => {
    if (overlayRef.current && modalRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' });
      gsap.fromTo(modalRef.current,
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, []);

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
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-black/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-text-primary font-[family-name:var(--font-display)] text-lg">
            Your Hero Pool & Preferences
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-text-primary text-lg transition-colors">&times;</button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Main role */}
          <div>
            <label className="text-xs text-text-secondary block mb-2 font-medium">Main Role</label>
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map(role => {
                const isActive = mainRole === role;
                return (
                  <button
                    key={role ?? 'all'}
                    onClick={() => setMainRole(role)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      isActive
                        ? 'bg-accent text-bg-primary border-accent shadow-sm'
                        : 'bg-white/5 text-text-secondary hover:text-text-primary border-border hover:border-accent/40'
                    }`}
                  >
                    {role ?? 'Flexible'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Playstyle notes */}
          <div>
            <label className="text-xs text-text-secondary block mb-2 font-medium">Playstyle Notes</label>
            <textarea
              value={playstyleNotes}
              onChange={e => setPlaystyleNotes(e.target.value)}
              placeholder="e.g. I prefer aggressive dive, I'm good at skillshots..."
              className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none h-20"
            />
          </div>

          {/* Hero pool */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-text-secondary font-medium">
                Hero Pool <span className="text-accent ml-1">({heroPool.size} selected)</span>
              </label>
              <div className="flex gap-1">
                {(['Tank', 'Bruiser', 'Healer', 'Support', 'Melee Assassin', 'Ranged Assassin'] as HeroRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => setFilterRole(filterRole === role ? null : role)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all border ${
                      filterRole === role
                        ? 'bg-accent text-bg-primary border-accent'
                        : 'bg-white/5 text-text-muted border-border hover:border-accent/40'
                    }`}
                  >
                    {role.replace('Assassin', 'Ass.')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-2">
              {filteredHeroes.map(hero => {
                const isSelected = heroPool.has(hero.name);
                return (
                  <button
                    key={hero.id}
                    onClick={() => toggleHero(hero.name)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-150 border ${
                      isSelected
                        ? 'bg-accent/15 border-accent ring-2 ring-accent/30'
                        : 'bg-white/[0.03] border-border hover:border-accent/40 opacity-60 hover:opacity-100'
                    }`}
                    title={hero.name}
                  >
                    <HeroIcon hero={hero} size="sm" />
                    <span className="text-[9px] text-text-muted truncate w-full text-center leading-tight">
                      {hero.name.length > 8 ? hero.name.slice(0, 7) + '\u2026' : hero.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-accent hover:bg-accent-light text-bg-primary font-semibold px-6 py-2 rounded-xl transition-all text-sm shadow-sm glow-accent"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
