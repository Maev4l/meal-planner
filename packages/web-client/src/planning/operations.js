import moment from 'moment';

import actions from './actions';
import { api } from '../api';

export const getSchedules = (year, weekNumber) => async (dispatch) => {
  dispatch(actions.fetchingSchedules());
  try {
    const schedules = await api.get(`/api/schedules/${year}-${weekNumber}`);
    dispatch(actions.fetchSchedulesSuccess(year, weekNumber, schedules));
  } catch (e) {
    dispatch(actions.fetchSchedulesError(e));
  }
};

export const refreshMembersSchedules = (year, weekNumber, callback) => async (dispatch) => {
  try {
    const schedules = await api.get(`/api/schedules/${year}-${weekNumber}`);
    dispatch(actions.refreshMembersSchedulesSuccess(year, weekNumber, schedules));
    if (callback) {
      callback();
    }
  } catch (e) {
    dispatch(actions.refreshMembersSchedulesError(e));
  }
};

export const submitComments = (groupId, memberId, comments, callback) => async (dispatch) => {
  dispatch(actions.savingComments());
  try {
    await api.post(`/api/groups/${groupId}/comments`, comments);
    dispatch(actions.saveCommentsSuccess(groupId, memberId, comments));
    if (callback) {
      callback();
    }
  } catch (e) {
    dispatch(actions.saveCommentsError());
  }
};

export const submitPersonalSchedule = (groupId, memberId, schedule) => async (dispatch) => {
  dispatch(actions.savingPersonalSchedule());
  try {
    await api.post(`/api/groups/${groupId}/schedules`, {
      default: false,
      schedule: { ...schedule },
    });
    dispatch(actions.savePersonalScheduleSuccess(groupId, memberId, schedule));
  } catch (e) {
    dispatch(actions.savePersonalScheduleError(e));
  }
};

export const submitDefaultSchedule = (groupId, defaultSchedule, weekCursor) => async (dispatch) => {
  dispatch(actions.savingDefaultSchedule());
  try {
    await api.post(`/api/groups/${groupId}/schedules`, {
      default: true,
      schedule: { ...defaultSchedule },
    });

    // Need to refetch the personal schedules, as they have been impacted by the
    // update of the default schedule
    const cursor = moment(weekCursor).startOf('isoweek');
    const year = cursor.year();
    const weekNumber = cursor.isoWeek();
    const schedules = await api.get(`/api/schedules/${year}-${weekNumber}`);
    dispatch(actions.fetchSchedulesSuccess(year, weekNumber, schedules));
  } catch (e) {
    dispatch(actions.saveDefaultScheduleError(e));
  }
};
