import { useState, useEffect } from 'react';
import { DAYS, DAY_LABELS, MEAL, getTodayIndex } from '../constants/schedule';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';

// A single meal's headcount inside a day column. The L/D letter carries the meal
// so the board never relies on colour alone; a zero reads as an em-dash (absence),
// not as a greyed-out state — the Never-Grey Rule is about refusal, and a count of
// nobody is genuinely nothing rather than somebody's "no".
const CountCell = ({ letter, n, tone }) => (
  <span
    className={`flex items-center justify-center gap-[3px] h-[25px] rounded-[8px] border tabular-nums
      ${n ? tone : 'border-line text-chalk-faint'}`}
  >
    <small className="text-[8.5px] tracking-[0.1em] font-bold">{letter}</small>
    <b className="text-[13px] font-bold leading-none">{n || '–'}</b>
  </span>
);

// One column of the week board: an inverting day header over Lunch and Dinner
// counts. The whole column is the tap target that selects the day below.
const DayColumn = ({ label, date, lunch, dinner, hasNotes, selected, isToday, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={selected}
    aria-label={`${label} ${date} — ${lunch} for lunch, ${dinner} for dinner${hasNotes ? ', has notes' : ''}`}
    className={`flex-1 min-w-0 flex flex-col gap-1 p-1 rounded-[12px] border-[1.5px] bg-transparent cursor-pointer transition active:scale-[0.96]
      ${selected ? 'border-chalk-dim bg-chalk/[0.06]' : 'border-transparent hover:bg-chalk/[0.03]'}`}
  >
    {/* Header chip inverts to solid chalk on the selected day (day-strip convention) */}
    <span
      className={`flex flex-col items-center py-[3px] rounded-[8px]
        ${selected ? 'bg-chalk text-slate-0' : isToday ? 'text-coral' : 'text-chalk-dim'}`}
    >
      <small className="text-[8.5px] tracking-[0.1em] uppercase leading-none">{label.slice(0, 3)}</small>
      <b className="text-[14px] font-semibold leading-tight">{date}</b>
    </span>
    <CountCell letter="L" n={lunch} tone="border-mustard/45 bg-mustard/15 text-mustard" />
    <CountCell letter="D" n={dinner} tone="border-coral/45 bg-coral/15 text-coral" />
    {/* Note marker keeps its 5px slot on every column so heights never shift */}
    <span className="h-[5px] grid place-items-center">
      {hasNotes && <span className="w-[5px] h-[5px] rounded-full bg-mustard" />}
    </span>
  </button>
);

// One meal's attendees for the selected day.
const MealBlock = ({ title, tone, attendees }) => (
  <div>
    <div className={`font-hand font-bold text-[24px] leading-none mb-2.5 ${tone}`}>{title}</div>
    {attendees.length ? (
      <div className="flex flex-wrap gap-[7px]">{attendees.map((n) => <Badge key={n} name={n} />)}</div>
    ) : (
      <div className="text-chalk-faint italic font-hand text-[19px]">nobody yet — quiet one</div>
    )}
  </div>
);

const MembersScheduleView = ({ members, dates, year, week }) => {
  const todayIndex = getTodayIndex(year, week);
  const [sel, setSel] = useState(todayIndex >= 0 ? todayIndex : 0);

  // Re-anchor the selection when the week changes, otherwise navigating away from
  // the current week left `sel` on a stale index from whichever week was open.
  useEffect(() => {
    setSel(todayIndex >= 0 ? todayIndex : 0);
  }, [year, week, todayIndex]);

  const list = Object.values(members);
  const attendeesFor = (dayKey, meal) =>
    list.filter((m) => ((m.schedule?.[dayKey] ?? 0) & meal) !== 0).map((m) => m.memberName).sort((a, b) => a.localeCompare(b));
  const countFor = (dayKey, meal) =>
    list.filter((m) => ((m.schedule?.[dayKey] ?? 0) & meal) !== 0).length;
  const notesFor = (dayKey) =>
    list.filter((m) => m.comments?.[dayKey]?.lunch || m.comments?.[dayKey]?.dinner)
      .map((m) => ({ name: m.memberName, lunch: m.comments[dayKey].lunch, dinner: m.comments[dayKey].dinner }))
      .sort((a, b) => a.name.localeCompare(b.name));
  const hasNotes = (dayKey) => list.some((m) => m.comments?.[dayKey]?.lunch || m.comments?.[dayKey]?.dinner);

  const dayKey = DAYS[sel];
  const notes = notesFor(dayKey);

  return (
    <div>
      {/* Week board — the whole week's headcount, readable without a tap. Seven
          columns are sized to fit the phone column, so nothing scrolls sideways. */}
      <div className="flex gap-1 mb-5" role="group" aria-label={`Headcount for week ${week}`}>
        {DAYS.map((day, i) => (
          <DayColumn
            key={day}
            label={DAY_LABELS[i]}
            date={(dates[i] || '').split(' ')[0]}
            lunch={countFor(day, MEAL.LUNCH)}
            dinner={countFor(day, MEAL.DINNER)}
            hasNotes={hasNotes(day)}
            selected={i === sel}
            isToday={i === todayIndex}
            onSelect={() => setSel(i)}
          />
        ))}
      </div>

      {/* Selected day — names and notes behind the numbers above */}
      <div className="flex items-baseline gap-2.5 mb-4">
        <h2 className="font-hand font-bold text-[30px] leading-none m-0">{DAY_LABELS[sel]}</h2>
        <span className="text-[10.5px] tracking-[0.2em] uppercase text-chalk-dim">{dates[sel]}</span>
      </div>

      <div className="flex flex-col gap-3.5">
        <MealBlock title="Lunch" tone="text-mustard" attendees={attendeesFor(dayKey, MEAL.LUNCH)} />
        <div className="border-b border-dashed border-chalk-faint" />
        <MealBlock title="Dinner" tone="text-coral" attendees={attendeesFor(dayKey, MEAL.DINNER)} />

        {notes.length > 0 && (
          <>
            <div className="border-b border-dashed border-chalk-faint" />
            <div>
              <div className="font-hand font-bold text-[24px] leading-none mb-2.5 text-chalk">Notes</div>
              <div className="flex flex-col gap-3">
                {notes.map((n) => (
                  <div key={n.name} className="flex gap-3">
                    <Avatar name={n.name} size={32} />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm mb-1">{n.name}</div>
                      {n.lunch && <div className="text-chalk-dim text-[13px] mb-0.5"><span className="text-mustard font-bold mr-1.5">L</span>{n.lunch}</div>}
                      {n.dinner && <div className="text-chalk-dim text-[13px]"><span className="text-coral font-bold mr-1.5">D</span>{n.dinner}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MembersScheduleView;
