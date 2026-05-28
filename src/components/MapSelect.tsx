import { motion } from 'motion/react';
import { MAPS, MAP_LANES } from '../data/maps';

interface MapSelectProps {
  currentMap: string | null;
  onSelect: (mapId: string) => void;
  /** When provided, render as a dismissible modal (mid-draft map change). */
  onClose?: () => void;
}

/* Per-battleground colour identity [from, to] — makes each map distinct without art. */
const MAP_GRADIENTS: Record<string, [string, string]> = {
  'alterac-pass': ['#38bdf8', '#7dd3fc'],
  'battlefield-of-eternity': ['#f87171', '#60a5fa'],
  'blackhearts-bay': ['#2dd4bf', '#22d3ee'],
  'braxis-holdout': ['#84cc16', '#22d3ee'],
  'cursed-hollow': ['#a78bfa', '#7c3aed'],
  'dragon-shire': ['#2dd4bf', '#34d399'],
  'garden-of-terror': ['#34d399', '#16a34a'],
  'hanamura-temple': ['#fb7185', '#fbbf24'],
  'infernal-shrines': ['#f87171', '#fb923c'],
  'sky-temple': ['#fbbf24', '#fcd34d'],
  'tomb-of-the-spider-queen': ['#c084fc', '#e879f9'],
  'volskaya-foundry': ['#60a5fa', '#38bdf8'],
  'towers-of-doom': ['#f87171', '#a78bfa'],
  'warhead-junction': ['#fb923c', '#fbbf24'],
};

function gradFor(id: string): [string, string] {
  return MAP_GRADIENTS[id] ?? ['#f5b73d', '#38bdf8'];
}

const threeLane = MAPS.filter(m => MAP_LANES[m.id] === 3);
const twoLane = MAPS.filter(m => MAP_LANES[m.id] === 2);

export function MapSelect({ currentMap, onSelect, onClose }: MapSelectProps) {
  const isModal = !!onClose;

  const renderCard = (m: (typeof MAPS)[number], i: number) => {
    const isCurrent = currentMap === m.id;
    const [a, b] = gradFor(m.id);
    return (
      <motion.button
        key={m.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: Math.min(i * 0.025, 0.3), ease: [0.22, 1, 0.36, 1] }}
        onClick={() => onSelect(m.id)}
        className={`group relative overflow-hidden rounded-2xl min-h-[120px] sm:min-h-[140px] flex flex-col justify-end p-4 transition-all duration-200 hover:-translate-y-1
          ${isCurrent
            ? 'border-2 border-accent glow-accent'
            : 'border border-border hover:border-white/20 hover:shadow-[0_18px_40px_-14px_rgba(0,0,0,0.8)]'
          }`}
        style={{ backgroundColor: 'var(--color-bg-card)' }}
      >
        {/* Colour wash */}
        <span
          aria-hidden
          className="absolute inset-0 opacity-50 group-hover:opacity-90 transition-opacity duration-300"
          style={{ background: `radial-gradient(130% 130% at 100% 0%, ${a}40, transparent 55%), radial-gradient(120% 120% at 0% 100%, ${b}30, transparent 60%)` }}
        />
        {/* Top accent edge */}
        <span aria-hidden className="absolute top-0 inset-x-0 h-1" style={{ background: `linear-gradient(90deg, ${a}, ${b})` }} />
        {/* Hover bloom */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-300"
          style={{ background: a }}
        />

        {isCurrent && (
          <span className="absolute top-2.5 right-2.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-bg-primary backdrop-blur-sm">
            Current
          </span>
        )}

        <h3 className="relative text-base sm:text-lg font-extrabold leading-tight text-white font-[family-name:var(--font-display)] tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          {m.name}
        </h3>
      </motion.button>
    );
  };

  const group = (title: string, maps: typeof MAPS, offset: number) => (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-accent-light font-[family-name:var(--font-display)] whitespace-nowrap">
          {title}
        </h3>
        <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        <span className="text-[10px] text-text-muted">{maps.length}</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {maps.map((m, i) => renderCard(m, offset + i))}
      </div>
    </div>
  );

  const body = (
    <div className="space-y-6">
      {group('3-Lane Battlegrounds', threeLane, 0)}
      {group('2-Lane Battlegrounds', twoLane, threeLane.length)}
    </div>
  );

  const header = (
    <div className="flex items-end justify-between gap-3 mb-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-[0.16em] text-text-primary font-[family-name:var(--font-display)]">
          Select <span className="text-gradient-accent">Battleground</span>
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Tiers, synergies & counters are calculated <span className="text-accent-light">per map</span>.
        </p>
      </div>
      {isModal && (
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-text-primary text-lg transition-colors shrink-0"
          aria-label="Close"
        >
          &times;
        </button>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card rounded-2xl w-full max-w-4xl my-8 p-5"
          onClick={e => e.stopPropagation()}
        >
          {header}
          {body}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6">
      {header}
      {body}
    </div>
  );
}
