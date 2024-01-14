import { useEffect, useState } from 'react';
import moment from 'moment';
import { Stack } from '@mui/material';
import { useOutletContext } from 'react-router-dom';

import { api } from '../api';
import { Progress } from '../components';
import Group from './Group';
import CalendarWeekPicker from './CalendarWeekPicker';

const Planning = () => {
  const [schedules, setSchedules] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weekCursor, setWeekCursor] = useState(moment().startOf('isoweek')); // the 1st weekday (monday) of the selected calendar week
  const [groupCursor /* , setGroupCursor */] = useState(0);
  const [userId] = useOutletContext();

  const fetchSchedules = async (t) => {
    setLoading(true);
    const year = t.year();
    const weekNumber = t.isoWeek();
    setWeekCursor(t);
    try {
      const { schedules: response } = await api.get(`/api/schedules/${year}-${weekNumber}`);
      setSchedules(response);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const start = moment().startOf('isoweek');
    fetchSchedules(start);
  }, []);

  const onSaveWeeklySchedule = async (groupId, schedule) => {
    const {
      year: y,
      weekNumber: w,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
    } = schedule;
    setLoading(true);
    try {
      await api.post(`/api/groups/${groupId}/schedules`, {
        year: y,
        weekNumber: w,
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
      });
    } finally {
      setLoading(false);
    }
  };

  const onPreviousCalendarWeek = async () => {
    const previous = moment(weekCursor).subtract(1, 'isoweek');
    await fetchSchedules(previous);
  };

  const onNextCalendarWeek = async () => {
    const next = moment(weekCursor).add(1, 'isoweek');
    await fetchSchedules(next);
  };

  const onSetMeal = (groupId, day, meal) => {
    const newSchedules = [...schedules];
    const group = newSchedules[groupCursor];
    const { schedule } = group.members[userId];

    let d = schedule[day];
    d += meal;
    const newSchedule = { ...schedule };
    newSchedule[day] = d;
    newSchedule.overriden = true;
    group.members[userId].schedule = newSchedule;

    setSchedules(newSchedules);
  };

  const onUnsetMeal = (groupId, day, meal) => {
    const newSchedules = [...schedules];
    const group = newSchedules[groupCursor];
    const { schedule } = group.members[userId];

    let d = schedule[day];
    d -= meal;
    const newSchedule = { ...schedule };
    newSchedule[day] = d;
    newSchedule.overriden = true;
    group.members[userId].schedule = newSchedule;

    setSchedules(newSchedules);
  };

  const groupsCount = schedules ? schedules.length : 0;

  return (
    <div>
      <Progress open={loading} />
      <Stack spacing={4}>
        <CalendarWeekPicker
          weekStartDay={weekCursor}
          onPrevious={onPreviousCalendarWeek}
          onNext={onNextCalendarWeek}
        />
        {groupsCount > 0 ? (
          <Group
            group={schedules[groupCursor]}
            weekStartDay={weekCursor}
            onSaveWeeklySchedule={onSaveWeeklySchedule}
            onSetMeal={onSetMeal}
            onUnsetMeal={onUnsetMeal}
          />
        ) : null}
      </Stack>
    </div>
  );
};

export default Planning;
