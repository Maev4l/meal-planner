import { useEffect, useState, Fragment } from 'react';
import moment from 'moment';
import { Stack } from '@mui/material';
import { useOutletContext } from 'react-router-dom';

import { api } from '../api';
import { Progress } from '../components';
import PersonalSchedule from './PersonalSchedule';
import GroupPicker from './GroupPicker';
import DefaultSchedule from './DefaultSchedule';
import MembersSchedules from './MembersSchedules';
import { VIEW_MODE } from './viewmode';

const Planning = () => {
  const [schedules, setSchedules] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState(VIEW_MODE.PERSONAL_SCHEDULE);
  const [weekCursor, setWeekCursor] = useState(moment().startOf('isoweek')); // the 1st weekday (monday) of the selected calendar week
  const [groupCursor /* , setGroupCursor */] = useState(0);
  const { userId } = useOutletContext();

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

  const saveWeeklySchedule = async () => {
    const group = schedules[groupCursor];
    const { members, groupId } = group;
    const { schedule } = members[userId];

    setLoading(true);
    try {
      await api.post(`/api/groups/${groupId}/schedules`, {
        default: false,
        schedule: { ...schedule },
      });
    } finally {
      setLoading(false);
    }
  };

  const saveDefaultSchedule = async () => {
    const group = schedules[groupCursor];
    const { members, groupId } = group;
    const { default: def } = members[userId];

    setLoading(true);
    try {
      await api.post(`/api/groups/${groupId}/schedules`, {
        default: true,
        schedule: { ...def },
      });

      // After a default schedule is save, reload the data from the
      // server in order to get new computed weekly schedules
      await fetchSchedules(weekCursor);
    } finally {
      setLoading(false);
    }
  };

  const onRefreshMembersSchedules = async () => {
    try {
      setLoading(true);
      await fetchSchedules(weekCursor);
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

    let d = schedule[day].meals;
    d += meal;
    const newSchedule = { ...schedule };
    newSchedule[day].meals = d;
    newSchedule.overriden = true;
    group.members[userId].schedule = newSchedule;

    setSchedules(newSchedules);
    saveWeeklySchedule();
  };

  const onUnsetMeal = (groupId, day, meal) => {
    const newSchedules = [...schedules];
    const group = newSchedules[groupCursor];
    const { schedule } = group.members[userId];

    let d = schedule[day].meals;
    d -= meal;
    const newSchedule = { ...schedule };
    newSchedule[day].meals = d;
    newSchedule.overriden = true;
    group.members[userId].schedule = newSchedule;

    setSchedules(newSchedules);
    saveWeeklySchedule();
  };

  const onSetDefaultMeal = (groupId, day, meal) => {
    const newSchedules = [...schedules];
    const group = newSchedules[groupCursor];
    const { default: def } = group.members[userId];

    let d = def[day];
    d += meal;
    const newSchedule = { ...def };
    newSchedule[day] = d;
    group.members[userId].default = newSchedule;

    setSchedules(newSchedules);
    saveDefaultSchedule();
  };

  const onUnsetDefaultMeal = (groupId, day, meal) => {
    const newSchedules = [...schedules];
    const group = newSchedules[groupCursor];
    const { default: def } = group.members[userId];

    let d = def[day];
    d -= meal;
    const newSchedule = { ...def };
    newSchedule[day] = d;
    group.members[userId].default = newSchedule;

    setSchedules(newSchedules);
    saveDefaultSchedule();
  };

  const onChangeViewMode = (m) => setViewMode(m);

  const onSubmitComment = (comment) => {
    const newSchedules = [...schedules];
    const group = newSchedules[groupCursor];
    const { members } = group;
    const member = members[comment.userId];
    const { schedule } = member;
    const dailySchedule = schedule[comment.day];
    dailySchedule.comments[comment.mealKey] = comment.content;
    /* { author: memberName, userId, day, mealKey, content: comment, dayOfWeek } */
    setSchedules(newSchedules);
    saveWeeklySchedule();
  };

  const onResetWeek = () => {
    const start = moment().startOf('isoweek');
    fetchSchedules(start);
  };

  const groupsCount = schedules ? schedules.length : 0;

  return (
    <Fragment>
      <Progress show={loading} />
      <Stack spacing={4} sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
        {groupsCount > 0 && viewMode === VIEW_MODE.PERSONAL_SCHEDULE ? (
          <Fragment>
            <GroupPicker group={schedules[groupCursor]} />
            <PersonalSchedule
              group={schedules[groupCursor]}
              weekStartDay={weekCursor}
              onSetMeal={onSetMeal}
              onUnsetMeal={onUnsetMeal}
              onNextCalendarWeek={onNextCalendarWeek}
              onPreviousCalendarWeek={onPreviousCalendarWeek}
              onChangeViewMode={onChangeViewMode}
              onSetComment={onSubmitComment}
              onResetWeek={onResetWeek}
            />
          </Fragment>
        ) : null}
        {groupsCount > 0 && viewMode === VIEW_MODE.MEMBERS_SCHEDULES ? (
          <Fragment>
            <GroupPicker group={schedules[groupCursor]} />
            <MembersSchedules
              group={schedules[groupCursor]}
              weekStartDay={weekCursor}
              onChangeViewMode={onChangeViewMode}
              onRefresh={onRefreshMembersSchedules}
            />
          </Fragment>
        ) : null}
        {viewMode === VIEW_MODE.DEFAULT_SCHEDULE ? (
          <DefaultSchedule
            group={schedules[groupCursor]}
            onChangeViewMode={onChangeViewMode}
            onSetMeal={onSetDefaultMeal}
            onUnsetMeal={onUnsetDefaultMeal}
          />
        ) : null}
      </Stack>
    </Fragment>
  );
};

export default Planning;
