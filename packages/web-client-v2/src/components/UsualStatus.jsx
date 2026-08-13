import { DAYS } from '../constants/schedule';

// Names the mechanism the API already performs silently: an untouched week is
// served from the member's default ("the usual"), so tiles a member never set
// still look like decisions they made. This row says which of the two you are
// looking at, and offers the matching way out.
//
// Truth comes from comparing values, not from the API's `overriden` flag: once a
// week has been written it stays flagged as overridden even if it is reset back
// to the usual, so the flag would keep claiming "adjusted" for an identical week.
// `days` scopes the comparison to the days a reset could actually change: days
// already past are read-only history, not adjustments the member can undo, so
// counting them would leave the Reset button unable to reach its own goal.
export const daysDifferingFromUsual = (schedule, usual, days = DAYS) =>
  days.filter((d) => (schedule?.[d] ?? 0) !== (usual?.[d] ?? 0));

const UsualStatus = ({ schedule, usual, days, onEdit, onReset, busy }) => {
  const differing = daysDifferingFromUsual(schedule, usual, days);
  const adjusted = differing.length > 0;

  return (
    <div className="flex items-start gap-3 mb-[18px] pb-3.5 border-b border-dashed border-chalk-faint">
      <div className="min-w-0 flex-1">
        <div className={`text-[10px] tracking-[0.22em] uppercase mb-1 ${adjusted ? 'text-chalk' : 'text-mustard'}`}>
          {adjusted ? 'Adjusted this week' : 'On the usual'}
        </div>
        <p className="m-0 text-[12.5px] leading-snug text-chalk-dim">
          {/* The "this week only" reassurance belongs to the adjusted state, where a
              member has just edited and may fear they changed their default. The steady
              state stays one line — it is read once and then lives above the grid forever. */}
          {adjusted
            ? `${differing.length} ${differing.length === 1 ? 'day differs' : 'days differ'} from your usual — this week only.`
            : 'Your usual, until you change a day.'}
        </p>
      </div>
      <button
        type="button"
        onClick={adjusted ? onReset : onEdit}
        disabled={busy}
        className="flex-none min-h-[44px] px-3.5 rounded-[12px] border border-line bg-transparent text-chalk-dim font-body font-bold text-[10.5px] tracking-[0.12em] uppercase cursor-pointer transition hover:text-chalk hover:border-chalk-dim active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
      >
        {adjusted ? 'Reset week' : 'Edit usual'}
      </button>
    </div>
  );
};

export default UsualStatus;
