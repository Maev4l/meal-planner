import { ACTION_TYPES } from '../store';

const fetchingSchedules = () => ({ type: ACTION_TYPES.FETCHING_SCHEDULES });

const fetchSchedulesSuccess = (year, week, data) => ({
  type: ACTION_TYPES.FETCH_SCHEDULES_SUCCESS,
  payload: { year, week, schedules: data.schedules },
});

const fetchSchedulesError = (error) => ({
  type: ACTION_TYPES.FETCH_SCHEDULES_ERROR,
  payload: error,
});

const refreshMembersSchedulesSuccess = (year, week, data) => ({
  type: ACTION_TYPES.REFRESH_MEMBERS_SCHEDULES_SUCCESS,
  payload: { year, week, schedules: data.schedules },
});

const refreshMembersSchedulesError = (error) => ({
  type: ACTION_TYPES.REFRESH_MEMBERS_SCHEDULES_ERROR,
  payload: error,
});

const savingComments = () => ({
  type: ACTION_TYPES.SAVING_COMMENTS,
});

const saveCommentsSuccess = (groupId, memberId, comments) => ({
  type: ACTION_TYPES.SAVE_COMMENTS_SUCCESS,
  payload: { groupId, memberId, comments },
});

const saveCommentsError = (error) => ({
  type: ACTION_TYPES.SAVE_COMMENTS_ERROR,
  payload: error,
});

const savingPersonalSchedule = () => ({
  type: ACTION_TYPES.SAVING_PERSONAL_SCHEDULE,
});
const savePersonalScheduleSuccess = (groupId, memberId, schedule) => ({
  type: ACTION_TYPES.SAVE_PERSONAL_SCHEDULE_SUCCESS,
  payload: { groupId, memberId, schedule },
});
const savePersonalScheduleError = (error) => ({
  type: ACTION_TYPES.SAVE_PERSONAL_SCHEDULE_SUCCESS,
  payload: error,
});

const savingDefaultSchedule = () => ({
  type: ACTION_TYPES.SAVING_DEFAULT_SCHEDULE,
});

const saveDefaultScheduleSuccess = (year, week, data) => ({
  type: ACTION_TYPES.SAVE_DEFAULT_SCHEDULE_SUCCESS,
  payload: { year, week, schedules: data.schedules },
});

const saveDefaultScheduleError = (error) => ({
  type: ACTION_TYPES.SAVE_DEFAULT_SCHEDULE_ERROR,
  payload: error,
});

export default {
  fetchingSchedules,
  fetchSchedulesSuccess,
  fetchSchedulesError,
  savingPersonalSchedule,
  savePersonalScheduleSuccess,
  savePersonalScheduleError,
  savingDefaultSchedule,
  saveDefaultScheduleSuccess,
  saveDefaultScheduleError,
  refreshMembersSchedulesSuccess,
  refreshMembersSchedulesError,
  savingComments,
  saveCommentsSuccess,
  saveCommentsError,
};
