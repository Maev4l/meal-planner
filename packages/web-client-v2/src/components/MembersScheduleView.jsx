import { useState } from 'react';
import { DAYS, DAY_LABELS, MEAL, getTodayIndex } from '../constants/schedule';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';

const MealBlock = ({ title, tone, attendees }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2.5 mb-3">
      <span className={`font-hand font-bold text-[28px] leading-none ${tone}`}>{title}</span>
      <span className="ml-auto text-[11px] font-bold tracking-[0.04em] text-slate-0 bg-chalk-dim rounded-full px-2.5 py-0.5">{attendees.length}</span>
    </div>
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

  const list = Object.values(members);
  const attendeesFor = (dayKey, meal) =>
    list.filter((m) => ((m.schedule?.[dayKey] ?? 0) & meal) !== 0).map((m) => m.memberName).sort((a, b) => a.localeCompare(b));
  const notesFor = (dayKey) =>
    list.filter((m) => m.comments?.[dayKey]?.lunch || m.comments?.[dayKey]?.dinner)
      .map((m) => ({ name: m.memberName, lunch: m.comments[dayKey].lunch, dinner: m.comments[dayKey].dinner }))
      .sort((a, b) => a.name.localeCompare(b.name));
  const hasAnyone = (dayKey) => list.some((m) => (m.schedule?.[dayKey] ?? 0) !== 0);
  const hasNotes = (dayKey) => list.some((m) => m.comments?.[dayKey]?.lunch || m.comments?.[dayKey]?.dinner);

  const dayKey = DAYS[sel];
  const notes = notesFor(dayKey);

  return (
    <div>
      {/* Day selector strip — scrollable, no visible scrollbar */}
      <div className="flex gap-[7px] mb-[18px] overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {DAYS.map((day, i) => (
          <button key={day} onClick={() => setSel(i)}
            className={`flex-none w-[42px] h-14 rounded-[14px] border-[1.5px] flex flex-col items-center justify-center gap-[3px] cursor-pointer
              ${i === sel ? 'bg-chalk text-slate-0 border-chalk' : 'border-line text-chalk-dim bg-transparent'}`}>
            <small className="text-[9px] tracking-[0.12em] uppercase">{DAY_LABELS[i].slice(0, 3)}</small>
            <b className="text-[17px] font-semibold">{(dates[i] || '').split(' ')[0]}</b>
            {/* Indicator dots: coral = someone attending, mustard = notes present */}
            <span className="flex gap-0.5 h-[5px]">
              {hasAnyone(day) && <span className="w-[5px] h-[5px] rounded-full bg-coral" />}
              {hasNotes(day) && <span className="w-[5px] h-[5px] rounded-full bg-mustard" />}
            </span>
          </button>
        ))}
      </div>

      <MealBlock title="Lunch" tone="text-mustard" attendees={attendeesFor(dayKey, MEAL.LUNCH)} />
      <div className="border-b border-dashed border-chalk-faint my-3.5" />
      <MealBlock title="Dinner" tone="text-coral" attendees={attendeesFor(dayKey, MEAL.DINNER)} />

      {/* Notes section — only rendered when selected day has any notes */}
      {notes.length > 0 && (
        <>
          <div className="border-b border-dashed border-chalk-faint my-3.5" />
          <div className="flex items-center gap-2.5 mb-3">
            <span className="font-hand font-bold text-[28px] leading-none text-chalk">Notes</span>
            <span className="ml-auto text-[11px] font-bold text-slate-0 bg-chalk-dim rounded-full px-2.5 py-0.5">{notes.length}</span>
          </div>
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
        </>
      )}
    </div>
  );
};

export default MembersScheduleView;
