import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSchedules } from '../contexts/SchedulesContext';
import { api } from '../services/api';
import { DAYS, DAY_LABELS, MEAL } from '../constants/schedule';
import TopBar from '../components/ui/TopBar';
import IconButton from '../components/ui/IconButton';
import MealTile from '../components/ui/MealTile';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';

const DefaultSchedulePage = () => {
  const { groupId, groupName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchSchedules, loading } = useSchedules();
  const toast = useToast();
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const schedules = await fetchSchedules();
      const group = schedules.find((g) => g.groupId === groupId);
      if (!group) return setError('Group not found');
      const me = group.members[user.memberId];
      if (!me) return setError('You are not a member of this group');
      setSchedule({ ...me.default });
    })();
  }, [groupId, user.memberId, fetchSchedules]);

  const handleToggle = useCallback(async (day, meal) => {
    const prev = schedule;
    const next = { ...schedule, [day]: (schedule[day] ?? 0) ^ meal };
    setSchedule(next);
    try {
      await api.createSchedule(groupId, { default: true, schedule: next });
      fetchSchedules(true);
    } catch {
      setSchedule(prev);
      toast?.('Failed to save');
    }
  }, [schedule, groupId, fetchSchedules, toast]);

  return (
    <div className="min-h-dvh">
      <TopBar title={decodeURIComponent(groupName)}
        left={<IconButton name="back" label="Back" onClick={() => navigate(-1)} className="ml-0" />} />
      <div className="px-5 pt-4 pb-6">
        {loading || !schedule ? (
          error ? <div className="text-red text-sm py-4">{error}</div> : <Spinner label="Loading the usual…" />
        ) : (
          <>
            <div className="text-center mb-4">
              <div className="font-hand font-bold text-[34px] leading-none">The usual</div>
              <div className="text-chalk-dim text-[13px] mt-1">applied to new weeks automatically</div>
            </div>
            <Card dashed className="p-4">
              {DAYS.map((day, i) => {
                const a = schedule?.[day] ?? 0;
                return (
                  <div key={day} className="flex items-center gap-2.5 py-2.5 border-b border-line last:border-0">
                    <div className="w-[80px] flex-none font-semibold text-sm">{DAY_LABELS[i]}</div>
                    <div className="ml-auto flex gap-2.5">
                      <MealTile label="Lunch" on={(a & MEAL.LUNCH) !== 0} onClick={() => handleToggle(day, MEAL.LUNCH)} />
                      <MealTile label="Dinner" on={(a & MEAL.DINNER) !== 0} onClick={() => handleToggle(day, MEAL.DINNER)} />
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
