import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSchedules } from '../contexts/SchedulesContext';
import { api, errorMessage } from '../services/api';
import { DAYS, DAY_LABELS, MEAL } from '../constants/schedule';
import TopBar from '../components/ui/TopBar';
import IconButton from '../components/ui/IconButton';
import MealTile from '../components/ui/MealTile';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import ErrorState from '../components/ErrorState';
import { useToast } from '../components/ui/Toast';

const DefaultSchedulePage = () => {
  const { groupId, groupName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchSchedules, loading } = useSchedules();
  const toast = useToast();
  const [schedule, setSchedule] = useState(null);
  const [groupTitle, setGroupTitle] = useState(decodeURIComponent(groupName));
  const [error, setError] = useState(null);

  // One load path, callable again. Previously this was an async IIFE with no
  // catch: fetchSchedules rethrows, so a failed load rejected unhandled, `error`
  // stayed null and the page span forever — the retry never even appeared. And
  // the retry that did exist only re-ran fetchSchedules without clearing `error`
  // or re-deriving `schedule`, so pressing it changed nothing.
  const load = useCallback(async (force = false) => {
    setError(null);
    try {
      const schedules = await fetchSchedules(force);
      const group = schedules.find((g) => g.groupId === groupId);
      if (!group) return setError("This group isn't here any more.");
      if (group.groupName) setGroupTitle(group.groupName);
      const me = group.members[user.memberId];
      if (!me) return setError("You're no longer a member of this group.");
      setSchedule({ ...me.default });
    } catch (err) {
      setError(errorMessage(err, { fallback: "Couldn't load the usual." }));
    }
  }, [groupId, user.memberId, fetchSchedules]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = useCallback(async (day, meal) => {
    const prev = schedule;
    const next = { ...schedule, [day]: (schedule[day] ?? 0) ^ meal };
    setSchedule(next);
    try {
      await api.createSchedule(groupId, { default: true, schedule: next });
      fetchSchedules(true);
    } catch (err) {
      setSchedule(prev);
      toast?.(errorMessage(err, { fallback: "Couldn't save the usual." }), 'error');
    }
  }, [schedule, groupId, fetchSchedules, toast]);

  return (
    <div className="min-h-dvh">
      <TopBar title={groupTitle}
        left={<IconButton name="back" label="Back" onClick={() => navigate(-1)} className="ml-0" />} />
      <div className="px-5 pt-4 pb-6">
        {loading || !schedule ? (
          error ? <ErrorState message={error} onRetry={() => load(true)} /> : <Spinner label="Loading the usual…" />
        ) : (
          <>
            <div className="text-center mb-4">
              {/* A real heading: the top bar's <h1> is the group name, so without this the page's
                  subject was invisible to heading navigation. Named "My usual" to match the button
                  that leads here. */}
              <h2 className="font-hand font-bold text-[34px] leading-none m-0">My usual</h2>
              {/* The usual only pre-fills weeks the member has not touched (the API serves the default
                  only when no week record exists). "Applied to new weeks automatically" let members
                  expect an edit here to rewrite a week they had already adjusted, which then looked
                  like a bug. */}
              <p className="text-chalk-dim text-[13px] mt-1 mb-0">Every week starts from this. Days you change in My week stay changed.</p>
            </div>
            <Card dashed className="p-4">
              {DAYS.map((day, i) => {
                const a = schedule?.[day] ?? 0;
                return (
                  <div key={day} className="flex items-center gap-2.5 py-2.5 border-b border-line last:border-0">
                    <div className="w-[80px] flex-none font-semibold text-sm">{DAY_LABELS[i]}</div>
                    <div className="ml-auto flex gap-2.5">
                      <MealTile label="Lunch" day={DAY_LABELS[i]} on={(a & MEAL.LUNCH) !== 0} onClick={() => handleToggle(day, MEAL.LUNCH)} />
                      <MealTile label="Dinner" day={DAY_LABELS[i]} on={(a & MEAL.DINNER) !== 0} onClick={() => handleToggle(day, MEAL.DINNER)} />
                    </div>
                  </div>
                );
              })}
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default DefaultSchedulePage;
