import Icon from './Icon';
import MealTile from './ui/MealTile';
import { DAYS, DAY_LABELS, MEAL, getTodayIndex } from '../constants/schedule';

const PersonalScheduleView = ({ schedule, dates, onToggle, year, week, comments, onDayClick }) => {
  const todayIndex = getTodayIndex(year, week);
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
            className={`relative flex items-center gap-2.5 py-3 border-b border-line ${isPast ? 'opacity-45' : ''}
              ${isToday ? "before:content-[''] before:absolute before:-left-5 before:inset-y-0 before:w-1 before:bg-coral before:rounded-r-[3px]" : ''}`}>
            <div className="w-[62px] flex-none">
              <b className={`block font-semibold text-sm ${isToday ? 'text-coral' : ''}`}>{DAY_LABELS[i]}</b>
              <small className="text-chalk-dim text-[11px]">{dates[i]}</small>
            </div>
            <div className="ml-auto flex gap-2.5 items-center">
              <MealTile label="Lunch" on={(attendance & MEAL.LUNCH) !== 0} disabled={isPast} onClick={() => onToggle(day, MEAL.LUNCH)} />
              <MealTile label="Dinner" on={(attendance & MEAL.DINNER) !== 0} disabled={isPast} onClick={() => onToggle(day, MEAL.DINNER)} />
              <button onClick={() => onDayClick(day, i)} aria-label={`Notes for ${DAY_LABELS[i]}`}
                className={`flex-none w-9 h-9 grid place-items-center rounded-full border-[1.5px] bg-transparent cursor-pointer transition active:scale-95
                  ${hasComment ? 'border-coral text-coral' : 'border-line text-chalk-faint hover:text-chalk-dim'}`}>
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
