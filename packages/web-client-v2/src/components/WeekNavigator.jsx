import IconButton from './ui/IconButton';
import { getCurrentWeek } from '../constants/schedule';

// Week navigator for the Ardoise redesign.
// Uses the shared chalk IconButton; the "back" chevron glyph is reused for all
// three buttons — next rotates 180°, jump-to-today uses dashed coral styling.
// The jump-to-today slot is always rendered (just invisible) so row width stays
// constant and the layout never shifts.
const WeekNavigator = ({ year, week, onChange }) => {
  const current = getCurrentWeek();
  const isCurrentWeek = year === current.year && week === current.week;
  const canGoPrevious = year > current.year || (year === current.year && week > current.week);
  const prevWeek = week === 1 ? 52 : week - 1;
  const prevYear = week === 1 ? year - 1 : year;
  // Hide jump-to-today when we're already on the current week OR when pressing
  // prev would land exactly on the current week (one step away → redundant).
  const showJumpToToday = !isCurrentWeek && !(prevYear === current.year && prevWeek === current.week);

  const handleToday = () => onChange(current.year, current.week);
  const handlePrevious = () => { if (canGoPrevious) onChange(week === 1 ? year - 1 : year, week === 1 ? 52 : week - 1); };
  const handleNext = () => onChange(week === 52 ? year + 1 : year, week === 52 ? 1 : week + 1);

  return (
    <div className="flex items-center justify-center gap-1.5 my-1">
      {/* jump-to-today slot is reserved (hidden, not removed) so the row width is constant */}
      <IconButton name="back" label="Jump to this week" onClick={handleToday}
        className={`border-dashed !border-coral !text-coral ${showJumpToToday ? '' : 'invisible'}`} />
      <IconButton name="back" label="Previous week" onClick={handlePrevious} disabled={!canGoPrevious} />
      <div className="flex items-center justify-between gap-2.5 px-4 py-[7px] rounded-[14px] bg-chalk/[0.06] border border-line w-[200px]">
        <div className="min-w-0">
          <div className="font-hand font-bold text-[23px] leading-none whitespace-nowrap">Week {String(week).padStart(2, '0')}</div>
          <div className="text-[10px] tracking-[0.16em] uppercase text-chalk-dim mt-px">{year}</div>
        </div>
        {isCurrentWeek && (
          <span className="text-[9px] tracking-[0.14em] uppercase bg-mustard text-slate-0 font-bold px-[7px] py-0.5 rounded-full">Now</span>
        )}
      </div>
      <IconButton name="back" label="Next week" onClick={handleNext} className="rotate-180" />
    </div>
  );
};

export default WeekNavigator;
