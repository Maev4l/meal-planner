import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isLeapYear from 'dayjs/plugin/isLeapYear';
import isoWeeksInYear from 'dayjs/plugin/isoWeeksInYear';

dayjs.extend(isoWeek);
dayjs.extend(isLeapYear); // required by isoWeeksInYear
dayjs.extend(isoWeeksInYear);

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const MEAL = {
  LUNCH: 1,
  DINNER: 2,
};

export const getCurrentWeek = () => {
  const now = dayjs();
  return { year: now.isoWeekYear(), week: now.isoWeek() };
};

// An ISO year has 52 or 53 weeks — 2026 has 53. Hardcoding 52 skips the last week
// of a long year entirely and lets "next" land on a week that does not exist.
// Mid-year so the instance's ISO year always equals `year` (1 Jan can belong to the
// previous ISO year).
export const weeksInYear = (year) => dayjs(`${year}-06-15`).isoWeeksInYear();

export const previousWeek = (year, week) =>
  week <= 1 ? { year: year - 1, week: weeksInYear(year - 1) } : { year, week: week - 1 };

export const nextWeek = (year, week) =>
  week >= weeksInYear(year) ? { year: year + 1, week: 1 } : { year, week: week + 1 };

// The one canonical period key. Every caller must build it through this, or the
// cache key and the request drift apart (they used to: the schedules cache computed
// its own naive Sunday-first week number while this module used ISO, so on Sundays
// the home screen and the schedule page asked for two different weeks).
export const periodOf = (year, week) => `${year}-${week}`;

export const getCurrentPeriod = () => {
  const { year, week } = getCurrentWeek();
  return periodOf(year, week);
};

// 4 January is always in ISO week 1, so its Monday is the year's first Monday.
export const mondayOf = (year, week) => dayjs(`${year}-01-04`).startOf('isoWeek').add(week - 1, 'week');

export const getWeekDates = (year, week) => {
  const monday = mondayOf(year, week);
  return DAYS.map((_, i) => monday.add(i, 'day').format('D MMMM'));
};

// Full date of one day in a week, for places that need the year spelled out.
export const fullDateOf = (year, week, dayIndex) =>
  mondayOf(year, week).add(dayIndex, 'day').format('D MMMM YYYY');

export const getTodayIndex = (year, week) => {
  const today = dayjs();
  return today.isoWeekYear() === year && today.isoWeek() === week
    ? today.isoWeekday() - 1
    : -1;
};
