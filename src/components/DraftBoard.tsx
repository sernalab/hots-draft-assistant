import type { DraftState, Hero, SlotType, Team } from '../types';
import { MAPS } from '../data/maps';
import { DraftSlot } from './DraftSlot';

interface DraftBoardProps {
  draft: DraftState;
  onMapChange: (mapId: string) => void;
  onSlotClick: (team: Team, type: SlotType, index: number) => void;
  onRemoveHero: (team: Team, type: SlotType, index: number) => void;
  onReset: () => void;
}

function SlotRow({
  label,
  team,
  type,
  slots,
  activeSlot,
  onSlotClick,
  onRemoveHero,
}: {
  label: string;
  team: Team;
  type: SlotType;
  slots: (Hero | null)[];
  activeSlot: DraftState['activeSlot'];
  onSlotClick: (team: Team, type: SlotType, index: number) => void;
  onRemoveHero: (team: Team, type: SlotType, index: number) => void;
}) {
  return (
    <div>
      <span className={`text-xs font-semibold uppercase tracking-wider ${
        team === 'enemy' ? 'text-enemy/70' : 'text-ally/70'
      }`}>
        {label}
      </span>
      <div className="flex gap-2 mt-1">
        {slots.map((hero, i) => (
          <DraftSlot
            key={`${team}-${type}-${i}`}
            hero={hero}
            team={team}
            type={type}
            index={i}
            isActive={
              activeSlot?.team === team &&
              activeSlot?.type === type &&
              activeSlot?.index === i
            }
            onClick={() => onSlotClick(team, type, i)}
            onRemove={() => onRemoveHero(team, type, i)}
          />
        ))}
      </div>
    </div>
  );
}

export function DraftBoard({ draft, onMapChange, onSlotClick, onRemoveHero, onReset }: DraftBoardProps) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-accent uppercase tracking-wider font-[family-name:var(--font-display)]">
          Draft Board
        </h2>
        <button
          onClick={onReset}
          className="text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Map selector */}
      <div>
        <label className="text-xs text-text-secondary block mb-1">Map</label>
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

      {/* Phase indicator */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted">Phase:</span>
        <span className="text-xs font-semibold text-accent-purple-light">{draft.phase}</span>
      </div>

      {/* Enemy side */}
      <div className="space-y-3">
        <SlotRow
          label="Enemy Bans"
          team="enemy"
          type="ban"
          slots={draft.enemyBans}
          activeSlot={draft.activeSlot}
          onSlotClick={onSlotClick}
          onRemoveHero={onRemoveHero}
        />
        <SlotRow
          label="Enemy Picks"
          team="enemy"
          type="pick"
          slots={draft.enemyPicks}
          activeSlot={draft.activeSlot}
          onSlotClick={onSlotClick}
          onRemoveHero={onRemoveHero}
        />
      </div>

      <div className="border-t border-border" />

      {/* Ally side */}
      <div className="space-y-3">
        <SlotRow
          label="Your Bans"
          team="ally"
          type="ban"
          slots={draft.allyBans}
          activeSlot={draft.activeSlot}
          onSlotClick={onSlotClick}
          onRemoveHero={onRemoveHero}
        />
        <SlotRow
          label="Your Picks"
          team="ally"
          type="pick"
          slots={draft.allyPicks}
          activeSlot={draft.activeSlot}
          onSlotClick={onSlotClick}
          onRemoveHero={onRemoveHero}
        />
      </div>
    </div>
  );
}
