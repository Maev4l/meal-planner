import Icon from '../Icon';

// One-tap meal toggle. on=true → sage check (in); on=false → red cross (out).
// disabled = past/read-only.
// `day` is only for the accessible name: fourteen of these render per screen and the
// day name lives in a sibling element, so without it a screen reader announces
// fourteen indistinguishable "Lunch"/"Dinner" buttons with no state.
const MealTile = ({ label, day, on, onClick, disabled }) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    aria-pressed={on}
    aria-label={day ? `${label} on ${day}` : label}
    className={[
      'w-[clamp(64px,20vw,74px)] h-[54px] rounded-[14px] border-[1.5px] flex flex-col items-center justify-center gap-0.5 select-none transition active:scale-[0.93]',
      disabled ? 'cursor-default' : 'cursor-pointer',
      on ? 'border-sage bg-sage/15 text-sage' : 'border-red bg-red/15 text-red',
    ].join(' ')}
  >
    {/* Drawn, not typed: these were the last font characters sitting among
        chalk-filtered glyphs, and the tonal mismatch showed at small sizes. */}
    <Icon name={on ? 'check' : 'cross'} className="w-[17px] h-[17px]" />
    <span aria-hidden="true" className="text-[9.5px] tracking-[0.16em] uppercase">{label}</span>
  </button>
);

export default MealTile;
