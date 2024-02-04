import moment from 'moment';
import ACTION_TYPES from './types';

export const INITIAL_STATE = {
  preferences: {
    darkMode: false,
  },
  loading: false,
  authn: {
    state: 'FETCHING_TOKEN', // LOGGED_IN, LOGGED_OUT
    token: null,
  },
  notification: {
    text: null,
    severity: '', // error, success
  },
  weekCursor: null,
  schedules: [],
};

export const reducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case ACTION_TYPES.SAVE_COMMENTS_SUCCESS: {
      const newState = { ...state };
      const { groupId, memberId, comments } = payload;
      const [groupSchedule] = newState.schedules.filter((g) => g.groupId === groupId);

      const member = groupSchedule.members[memberId];
      member.comments = comments;
      return { ...newState, loading: false };
    }

    case ACTION_TYPES.SAVE_PERSONAL_SCHEDULE_SUCCESS: {
      const newState = { ...state };
      const { groupId, memberId, schedule } = payload;

      const [groupSchedule] = newState.schedules.filter((g) => g.groupId === groupId);

      const member = groupSchedule.members[memberId];
      member.schedule = schedule;
      member.schedule.overriden = true;

      return { ...newState, loading: false };
    }

    case ACTION_TYPES.SIGN_IN_SUCCESS: {
      const authn = {
        state: 'LOGGED_IN',
        token: payload,
      };
      return { ...state, loading: false, authn };
    }

    case ACTION_TYPES.FETCH_TOKEN_SUCCESS: {
      const token = payload;
      const authn = {
        state: '',
        token: null,
      };

      if (token) {
        authn.state = 'LOGGED_IN';
        authn.token = token;
      } else {
        authn.state = 'LOGGED_OUT';
      }
      return { ...state, loading: false, authn };
    }

    case ACTION_TYPES.REFRESH_MEMBERS_SCHEDULES_SUCCESS:
    case ACTION_TYPES.SAVE_DEFAULT_SCHEDULE_SUCCESS:
    case ACTION_TYPES.FETCH_SCHEDULES_SUCCESS: {
      const { schedules, year, week } = payload;

      const weekCursor = moment().isoWeekYear(year).isoWeek(week).startOf('isoWeek');

      return { ...state, loading: false, schedules, weekCursor };
    }

    case ACTION_TYPES.DISMISS_NOTIFICATION: {
      return {
        ...state,
        loading: false,
        notification: { text: null, severity: '' },
      };
    }

    case ACTION_TYPES.SIGN_OUT_SUCCESS: {
      return {
        ...state,
        loading: false,
        authn: {
          state: 'LOGGED_OUT',
          token: null,
        },
        weekCursor: null,
        schedules: [],
      };
    }

    case ACTION_TYPES.CHANGE_PASSWORD_SUCCESS: {
      return {
        ...state,
        loading: false,
        notification: {
          severity: 'success',
          text: 'Password has been changed',
        },
      };
    }

    case ACTION_TYPES.READ_APP_PREFERENCES_SUCCESS: {
      if (payload !== null) {
        return { ...state, preferences: payload, loading: false };
      }
      return { ...state, loading: false };
    }

    case ACTION_TYPES.WRITE_APP_PREFERENCES_SUCCESS: {
      return { ...state, preferences: payload, loading: false };
    }

    case ACTION_TYPES.WRITING_APP_PREFERENCES:
    case ACTION_TYPES.READING_APP_PREFERENCES:
    case ACTION_TYPES.SAVING_COMMENTS:
    case ACTION_TYPES.CHANGING_PASSWORD:
    case ACTION_TYPES.SIGNING_OUT:
    case ACTION_TYPES.SAVING_DEFAULT_SCHEDULE:
    case ACTION_TYPES.SAVING_PERSONAL_SCHEDULE:
    case ACTION_TYPES.FETCHING_SCHEDULES:
    case ACTION_TYPES.FETCHING_TOKEN:
    case ACTION_TYPES.SIGNING_IN: {
      return { ...state, loading: true };
    }

    case ACTION_TYPES.WRITE_APP_PREFERENCES_ERROR:
    case ACTION_TYPES.READ_APP_PREFERENCES_ERROR:
    case ACTION_TYPES.SAVE_COMMENTS_ERROR:
    case ACTION_TYPES.CHANGE_PASSWORD_ERROR:
    case ACTION_TYPES.SIGN_OUT_ERROR:
    case ACTION_TYPES.REFRESH_MEMBERS_SCHEDULES_ERROR:
    case ACTION_TYPES.SAVE_DEFAULT_SCHEDULE_ERROR:
    case ACTION_TYPES.SAVE_PERSONAL_SCHEDULE_ERROR:
    case ACTION_TYPES.FETCH_SCHEDULES_ERROR:
    case ACTION_TYPES.FETCH_TOKEN_ERROR:
    case ACTION_TYPES.SIGN_IN_ERROR: {
      const error = payload;
      return {
        ...state,
        loading: false,
        notification: { text: error.message, severity: 'error' },
      };
    }

    default:
      return state;
  }
};
