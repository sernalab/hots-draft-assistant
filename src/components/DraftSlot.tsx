import type { Hero, SlotType, Team } from '../types';
import { HeroIcon } from './HeroIcon';

interface DraftSlotProps {
  hero: Hero | null;
  team: Team;
  type: SlotType;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onRemove: () => void;
}

export function DraftSlot({ hero, team, type, isActive, onClick, onRemove }: DraftSlotProps) {
  const borderColor = type === 'ban'
    ? 'border-red-500/30'
    : team === 'ally'
      ? 'border-ally/30'
      : 'border-enemy/30';

  const activeBorder = isActive ? 'border-accent animate-pulse-glow' : borderColor;
  const bgColor = type === 'ban' ? 'bg-red-950/20' : 'bg-bg-card';

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-12 h-12 rounded-lg border-2 ${activeBorder} ${bgColor} flex items-center justify-center transition-all hover:border-accent/60`}
      >
        {hero ? (
          <HeroIcon hero={hero} size="sm" />
        ) : (
          <span className="text-text-muted text-lg">
            {type === 'ban' ? '\u00D7' : '+'}
          </span>
        )}
      </button>
      {hero && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          \u00D7
        </button>
      )}
      {hero && (
        <span className="block text-[10px] text-text-muted text-center mt-0.5 truncate w-12">
          {hero.name}
        </span>
      )}
    </div>
  );
}
