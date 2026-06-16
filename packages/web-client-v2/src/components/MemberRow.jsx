import Icon from './Icon';
import { colorForName, initialsOf } from '../constants/colors';

// One roster row. `onRemove` (admin, non-self, non-admin targets) renders a trash button.
const MemberRow = ({ name, isAdmin, isYou, onRemove }) => (
  <div className="flex items-center gap-3.5 py-3 border-b border-line last:border-b-0">
    <span className="w-[38px] h-[38px] rounded-full grid place-items-center text-[13px] font-bold text-[#1b1f1c] flex-none"
      style={{ background: colorForName(name) }}>{initialsOf(name)}</span>
    <div className="flex-1 min-w-0 text-[15px] font-semibold flex items-center gap-2 flex-wrap">
      {name}
      {isAdmin && (
        <span className="inline-flex items-center gap-1.5 font-body font-bold text-[9.5px] tracking-[0.12em] uppercase text-mustard bg-mustard/15 border border-mustard/40 py-0.5 pl-1.5 pr-2 rounded-full">
          <Icon name="crown" className="w-[11px] h-[11px]" />Admin
        </span>
      )}
      {isYou && <span className="text-[9.5px] tracking-[0.12em] uppercase text-chalk-faint">&middot; You</span>}
    </div>
    {onRemove && (
      <button onClick={onRemove} aria-label={`Remove ${name}`}
        className="w-[34px] h-[34px] rounded-[9px] grid place-items-center text-chalk-faint bg-transparent border border-transparent cursor-pointer hover:text-red hover:border-red/40 hover:bg-red/[0.08]">
        <Icon name="trash" className="w-[17px] h-[17px]" />
      </button>
    )}
  </div>
);

export default MemberRow;
