import { View } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import moment from 'moment';

import { useDispatch } from '../store';
import { getSchedules } from './operations';

const WeekSelector = ({ weekCursor }) => {
  const dispatch = useDispatch();
  const { year, week: weekNumber } = weekCursor;

  const nowWeekStartDay = moment().startOf('isoweek');

  const prevWeekStartDay = moment()
    .year(year)
    .week(weekNumber)
    .startOf('isoWeek')
    .subtract(1, 'isoweek');

  const handleNextWeek = () => {
    const weeksInYear = moment().isoWeeksInYear();

    let next = null;
    if (weekNumber !== weeksInYear) {
      const m = moment().year(year).isoWeek(weekNumber).startOf('isoWeek');
      next = m.add(1, 'isoweek');
    } else {
      next = moment()
        .year(year + 1)
        .isoWeek(1);
    }

    const nextYear = next.year();
    const nextWeekNumber = next.isoWeek();
    dispatch(getSchedules(nextYear, nextWeekNumber));
  };

  const handlePreviousWeek = () => {
    const previous = moment()
      .year(year)
      .isoWeek(weekNumber)
      .startOf('isoWeek')
      .subtract(1, 'isoweek');
    const previousYear = previous.year();
    const previousWeekNumber = previous.isoWeek();
    dispatch(getSchedules(previousYear, previousWeekNumber));
  };

  const handleCurrentWeek = () => {
    const current = moment();
    const currentYear = current.year();
    const currentWeekNumber = current.isoWeek();
    dispatch(getSchedules(currentYear, currentWeekNumber));
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <IconButton
          icon="chevron-double-left"
          size={20}
          style={{ margin: 0 }}
          disabled={nowWeekStartDay.isAfter(prevWeekStartDay)}
          onPress={handleCurrentWeek}
        />
        <IconButton
          icon="chevron-left"
          size={20}
          style={{ margin: 0 }}
          disabled={nowWeekStartDay.isAfter(prevWeekStartDay)}
          onPress={handlePreviousWeek}
        />
        <Text>{`Calendar Week: ${year} - ${String(weekNumber).padStart(2, '0')}`}</Text>
        <IconButton icon="chevron-right" size={20} onPress={handleNextWeek} />
      </View>
    </View>
  );
};

export default WeekSelector;
