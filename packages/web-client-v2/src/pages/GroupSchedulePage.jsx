import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { useAuth } from '../contexts/AuthContext';
import { api, errorMessage } from '../services/api';
import { DAYS, getCurrentWeek, getWeekDates, getTodayIndex, periodOf } from '../constants/schedule';
import TopBar from '../components/ui/TopBar';
import IconButton from '../components/ui/IconButton';
import Spinner from '../components/ui/Spinner';
import WeekNavigator from '../components/WeekNavigator';
import PersonalScheduleView from '../components/PersonalScheduleView';
import MembersScheduleView from '../components/MembersScheduleView';
import CommentEditorSheet from '../components/CommentEditorSheet';
import UsualStatus from '../components/UsualStatus';
import ErrorState from '../components/ErrorState';
import { useToast } from '../components/ui/Toast';

// A day is read-only if it falls before today within the current week.
const isPastDay = (dayIndex, year, week) => {
  const ti = getTodayIndex(year, week);
  return ti >= 0 && dayIndex < ti;
};

const GroupSchedulePage = () => {
  const { groupId, groupName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const current = getCurrentWeek();

  const [year, setYear] = useState(location.state?.year ?? current.year);
  const [week, setWeek] = useState(location.state?.week ?? current.week);
  const [view, setView] = useState('personal');
  const [schedule, setSchedule] = useState(null);
  const [usual, setUsual] = useState(null); // the member's default schedule for this group
  const [comments, setComments] = useState(null);
  const [members, setMembers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState(null);
  const [editor, setEditor] = useState(null); // { day, dayIndex } | null

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await api.getSchedules(periodOf(year, week));
      const group = data.schedules?.find((g) => g.groupId === groupId);
      if (!group) { setError("This group isn't here any more."); return; }
      setMembers(group.members);
      const me = group.members[user.memberId];
      if (!me) { setError("You're no longer a member of this group."); return; }
      setSchedule({ ...me.schedule });
      setUsual(me.default ?? null);
      setComments(me.comments ?? {});
    } catch (err) {
      setError(errorMessage(err, {
        403: "You're no longer a member of this group.",
        404: "This group isn't here any more.",
        fallback: "Couldn't load this week.",
      }));
    } finally {
      setLoading(false);
    }
  }, [groupId, user.memberId, year, week]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggle = useCallback(async (day, meal) => {
    const next = { ...schedule, [day]: (schedule[day] ?? 0) ^ meal };
    setSchedule(next);
    setMembers((m) => ({ ...m, [user.memberId]: { ...m[user.memberId], schedule: next } }));
    try {
      await api.createSchedule(groupId, { period: periodOf(year, week), schedule: next });
    } catch (err) {
      // Undo only this meal's bit, against whatever the state is now. Restoring a
      // whole pre-tap snapshot silently discarded any edit that succeeded in the
      // meantime — tap Lunch, tap Dinner, Lunch fails, and Dinner's save was lost.
      // XOR is its own inverse, so re-applying it reverts exactly one bit.
      const undo = (s) => ({ ...s, [day]: (s?.[day] ?? 0) ^ meal });
      setSchedule(undo);
      setMembers((m) => ({ ...m, [user.memberId]: { ...m[user.memberId], schedule: undo(m[user.memberId]?.schedule) } }));
      toast?.(errorMessage(err, { fallback: "Couldn't save — tap the meal again." }), 'error');
    }
  }, [schedule, groupId, year, week, user.memberId, toast]);

  // Days a member can still act on this week; a reset never rewrites history.
  const editableDays = DAYS.filter((_, i) => !isPastDay(i, year, week));

  const handleReset = useCallback(async () => {
    if (!schedule || !usual) return;
    const prev = schedule;
    const next = { ...schedule };
    DAYS.forEach((day, i) => {
      if (!isPastDay(i, year, week)) next[day] = usual[day] ?? 0;
    });
    setResetting(true);
    setSchedule(next);
    setMembers((m) => ({ ...m, [user.memberId]: { ...m[user.memberId], schedule: next } }));
    try {
      await api.createSchedule(groupId, { period: periodOf(year, week), schedule: next });
      toast?.('Week back on the usual', 'success');
    } catch (err) {
      setSchedule(prev);
      setMembers((m) => ({ ...m, [user.memberId]: { ...m[user.memberId], schedule: prev } }));
      toast?.(errorMessage(err, { fallback: "Couldn't reset the week." }), 'error');
    } finally {
      setResetting(false);
    }
  }, [schedule, usual, groupId, year, week, user.memberId, toast]);

  const dates = getWeekDates(year, week);

  const handleSaved = useCallback((week7) => {
    setComments(week7);
    setMembers((m) => ({ ...m, [user.memberId]: { ...m[user.memberId], comments: week7 } }));
  }, [user.memberId]);

  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar
        title={decodeURIComponent(groupName)}
        left={<IconButton name="back" label="Back" onClick={() => navigate('/')} className="ml-0" />}
        right={<IconButton name="repeat" label="Default schedule" onClick={() => navigate(`/groups/${groupId}/${groupName}/default`)} />}
      />
      <div className="px-5 pt-4">
        <div className="flex gap-1.5 bg-chalk/[0.06] border border-line p-1.5 rounded-[14px] mb-[18px]">
          {[['personal', 'My week'], ['everyone', 'Everyone']].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)}
              className={`flex-1 border-0 cursor-pointer font-body font-semibold text-[12.5px] py-2.5 rounded-[10px] ${view === v ? 'bg-chalk text-slate-0' : 'bg-transparent text-chalk-dim'}`}>
              {label}
            </button>
          ))}
        </div>
        <WeekNavigator year={year} week={week} onChange={(y, w) => { setYear(y); setWeek(w); }} />
      </div>

      <PullToRefresh onRefresh={() => loadData(false)} pullingContent="">
        <div className="px-5 pt-2 pb-6">
          {loading ? <Spinner label="Loading schedule…" />
            : error ? <ErrorState message={error} onRetry={() => loadData()} />
            : view === 'personal' && schedule ? (
              <>
                {usual && (
                  <UsualStatus schedule={schedule} usual={usual} days={editableDays} busy={resetting}
                    onEdit={() => navigate(`/groups/${groupId}/${groupName}/default`)}
                    onReset={handleReset} />
                )}
                <PersonalScheduleView schedule={schedule} dates={dates} onToggle={handleToggle}
                  year={year} week={week} comments={comments}
                  onDayClick={(day, dayIndex) => setEditor({ day, dayIndex })} />
              </>
            ) : view === 'everyone' && members ? (
              <MembersScheduleView members={members} dates={dates} year={year} week={week} />
            ) : null}
        </div>
      </PullToRefresh>

      <CommentEditorSheet
        open={editor !== null}
        onClose={() => setEditor(null)}
        day={editor?.day}
        dayIndex={editor?.dayIndex}
        year={year}
        week={week}
        groupId={groupId}
        allComments={comments ?? {}}
        readOnly={editor ? isPastDay(editor.dayIndex, year, week) : false}
        onSaved={handleSaved}
      />
    </div>
  );
};

export default GroupSchedulePage;
