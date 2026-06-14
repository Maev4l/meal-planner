// One-tap meal toggle. on=true → sage ✓ (in); on=false → red ✕ (out). disabled = past/read-only.
const MealTile = ({ label, on, onClick, disabled }) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={[
      'w-[74px] h-[54px] rounded-[14px] border-[1.5px] flex flex-col items-center justify-center gap-0.5 select-none transition active:scale-[0.93]',
      disabled ? 'cursor-default' : 'cursor-pointer',
      on ? 'border-sage bg-sage/15 text-sage' : 'border-red bg-red/15 text-red',
    ].join(' ')}
  >
    <span className="font-body font-extrabold text-[17px] leading-none">{on ? '✓' : '✕'}</span>
    <span className="text-[9.5px] tracking-[0.16em] uppercase">{label}</span>
  </button>
);

export default MealTile;
