import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

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

export const getWeekDates = (year, week) => {
  const jan4 = dayjs(`${year}-01-04`);
  const firstMonday = jan4.startOf('isoWeek');
  const targetMonday = firstMonday.add(week - 1, 'week');
  return DAYS.map((_, i) => targetMonday.add(i, 'day').format('D MMM'));
};

export const getTodayIndex = (year, week) => {
  const today = dayjs();
  return today.isoWeekYear() === year && today.isoWeek() === week
    ? today.isoWeekday() - 1
    : -1;
};
