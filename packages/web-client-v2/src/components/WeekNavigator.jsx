import IconButton from './ui/IconButton';
import { getCurrentWeek, previousWeek, nextWeek, mondayOf } from '../constants/schedule';

// Far enough to plan a holiday, near enough to stay inside what the product keeps.
const MAX_WEEKS_AHEAD = 8;

// Week navigator for the Ardoise redesign.
// Uses the shared chalk IconButton; the "back" chevron glyph is reused for all
// three buttons — next rotates 180°, jump-to-today uses dashed coral styling.
// The jump-to-today slot is always rendered (just invisible) so row width stays
// constant and the layout never shifts.
const WeekNavigator = ({ year, week, onChange }) => {
  const current = getCurrentWeek();
  const isCurrentWeek = year === current.year && week === current.week;
  const canGoPrevious = year > current.year || (year === current.year && week > current.week);
  // The product holds the near future, not an archive: schedules expire 14 days
  // after their week. Forward navigation was unbounded, so a member could set
  // meals in 2031 for data that is reaped before anyone cooks it.
  // Diff the actual Mondays rather than multiplying by 52 — ISO years have 52 or
  // 53 weeks, and this file used to carry exactly that bug.
  const weeksAhead = mondayOf(year, week).diff(mondayOf(current.year, current.week), 'week');
  const canGoNext = weeksAhead < MAX_WEEKS_AHEAD;
  // Week arithmetic lives in constants/schedule so the 52-vs-53-week year is
  // handled in exactly one place.
  const prev = previousWeek(year, week);
  const next = nextWeek(year, week);
  // Hide jump-to-today when we're already on the current week OR when pressing
  // prev would land exactly on the current week (one step away → redundant).
  const showJumpToToday = !isCurrentWeek && !(prev.year === current.year && prev.week === current.week);

  const handleToday = () => onChange(current.year, current.week);
  const handlePrevious = () => { if (canGoPrevious) onChange(prev.year, prev.week); };
  const handleNext = () => { if (canGoNext) onChange(next.year, next.week); };

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
      <IconButton name="back" label="Next week" onClick={handleNext} disabled={!canGoNext} className="rotate-180" />
    </div>
  );
};

export default WeekNavigator;
