import Icon from '../Icon';

// Password show/hide. Shared so the same control cannot be an eye icon on one
// screen and the words "show"/"hide" on another, and so it keeps a 44px hit area
// around an 18px glyph.
const Reveal = ({ shown, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={shown ? 'Hide password' : 'Show password'}
    aria-pressed={shown}
    className="flex-none grid place-items-center w-11 h-11 -mr-2 bg-transparent border-0 text-chalk-dim hover:text-chalk cursor-pointer transition active:scale-90"
  >
    <Icon name={shown ? 'eye' : 'eye-off'} className="w-[18px] h-[18px]" />
  </button>
);

export default Reveal;
