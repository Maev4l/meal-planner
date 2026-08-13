import { useEffect, useRef } from 'react';
import Icon from './Icon';
import MealTile from './ui/MealTile';
import { DAYS, DAY_LABELS, MEAL, getTodayIndex } from '../constants/schedule';

const PersonalScheduleView = ({ schedule, dates, onToggle, year, week, comments, onDayClick }) => {
  const todayIndex = getTodayIndex(year, week);
  const todayRef = useRef(null);

  // Rows are 79px, so from Saturday on, the only editable row sat under the fixed
  // nav or below the fold behind up to six dimmed, read-only rows. Bring it into
  // view on arrival; honour a reduced-motion preference for the scroll itself.
  useEffect(() => {
    if (todayIndex < 0 || !todayRef.current) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    todayRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
  }, [todayIndex, year, week]);
  return (
    <div>
      {DAYS.map((day, i) => {
        const attendance = schedule?.[day] ?? 0;
        const isToday = i === todayIndex;
        const isPast = todayIndex >= 0 && i < todayIndex;
        const dayComment = comments?.[day];
        const hasComment = dayComment?.lunch || dayComment?.dinner;
        return (
          <div key={day}
            ref={isToday ? todayRef : undefined}
            className={`relative flex items-center gap-2.5 py-3 border-b border-line ${isPast ? 'opacity-45' : ''}
              ${isToday ? "before:content-[''] before:absolute before:-left-5 before:inset-y-0 before:w-1 before:bg-coral before:rounded-r-[3px]" : ''}`}>
            <div className="flex-1 min-w-0">
              <b className={`block font-semibold text-sm truncate ${isToday ? 'text-coral' : ''}`}>{DAY_LABELS[i]}</b>
              <small className="text-chalk-dim text-[11px]">{dates[i]}</small>
            </div>
            <div className="flex-none flex gap-2.5 items-center">
              <MealTile label="Lunch" day={DAY_LABELS[i]} on={(attendance & MEAL.LUNCH) !== 0} disabled={isPast} onClick={() => onToggle(day, MEAL.LUNCH)} />
              <MealTile label="Dinner" day={DAY_LABELS[i]} on={(attendance & MEAL.DINNER) !== 0} disabled={isPast} onClick={() => onToggle(day, MEAL.DINNER)} />
              <button onClick={() => onDayClick(day, i)} aria-label={`Notes for ${DAY_LABELS[i]}`}
                className={`relative flex-none w-9 h-9 grid place-items-center rounded-full border-[1.5px] bg-transparent cursor-pointer transition active:scale-95 after:absolute after:content-[''] after:-inset-[6px]
                  ${hasComment ? 'border-coral text-coral' : 'border-line text-chalk-dim hover:text-chalk'}`}>
                <Icon name="note" className="w-[52%] h-[52%]" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PersonalScheduleView;
