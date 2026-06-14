import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { getCurrentWeek, getWeekDates, getTodayIndex } from '../constants/schedule';
import TopBar from '../components/ui/TopBar';
import IconButton from '../components/ui/IconButton';
import Spinner from '../components/ui/Spinner';
import WeekNavigator from '../components/WeekNavigator';
import PersonalScheduleView from '../components/PersonalScheduleView';
import MembersScheduleView from '../components/MembersScheduleView';
import CommentEditorSheet from '../components/CommentEditorSheet';
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
  const [comments, setComments] = useState(null);
  const [members, setMembers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editor, setEditor] = useState(null); // { day, dayIndex } | null

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await api.getSchedules(`${year}-${week}`);
      const group = data.schedules?.find((g) => g.groupId === groupId);
      if (!group) { setError('Group not found'); return; }
      setMembers(group.members);
      const me = group.members[user.memberId];
      if (!me) { setError('You are not a member of this group'); return; }
      setSchedule({ ...me.schedule });
      setComments(me.comments ?? {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [groupId, user.memberId, year, week]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggle = useCallback(async (day, meal) => {
    const prev = schedule;
    const next = { ...schedule, [day]: (schedule[day] ?? 0) ^ meal };
    setSchedule(next);
    setMembers((m) => ({ ...m, [user.memberId]: { ...m[user.memberId], schedule: next } }));
    try {
      await api.createSchedule(groupId, { period: `${year}-${week}`, schedule: next });
    } catch {
      setSchedule(prev);
      setMembers((m) => ({ ...m, [user.memberId]: { ...m[user.memberId], schedule: prev } }));
      toast?.('Failed to save schedule');
    }
  }, [schedule, groupId, year, week, user.memberId, toast]);

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
            : error ? <div className="text-red text-sm py-4">{error}</div>
            : view === 'personal' && schedule ? (
              <PersonalScheduleView schedule={schedule} dates={dates} onToggle={handleToggle}
                year={year} week={week} comments={comments}
                onDayClick={(day, dayIndex) => setEditor({ day, dayIndex })} />
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
