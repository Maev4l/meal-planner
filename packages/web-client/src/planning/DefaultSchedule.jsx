import { Text, Button, useTheme } from 'react-native-paper';
import { View, ScrollView } from 'react-native';
import moment from 'moment';

import { Grid } from '../components';
import { MEAL } from '../domain';
import { useAuth, useGroup, useSelector, useDispatch } from '../store';
import { submitDefaultSchedule } from './operations';

const MealCell = ({ dayKey, schedule, type, onToggleAttendance }) => {
  const theme = useTheme();
  const meals = schedule[dayKey];

  const handlePressMeal = () => {
    if (meals & type) {
      // Change Set to Unset
      onToggleAttendance(dayKey, type * -1);
    } else {
      onToggleAttendance(dayKey, type);
    }
  };

  return (
    <Button
      compact
      mode="contained"
      style={{ flexGrow: 1 }}
      buttonColor={meals & type ? theme.colors.primary : theme.colors.error}
      onPress={handlePressMeal}
    >
      {meals & type ? 'PRESENT' : 'ABSENT'}
    </Button>
  );
};

const DefaultSchedule = ({ groupId }) => {
  const group = useGroup(groupId);
  const weekCursor = useSelector((state) => state.weekCursor);
  const dispatch = useDispatch();

  const { members } = group;
  const { userId } = useAuth();
  const { default: defaultSchedule } = members[userId];

  const now = moment();
  const monday = moment(now).weekday(1);
  const tuesday = moment(now).weekday(2);
  const wednesday = moment(now).weekday(3);
  const thursday = moment(now).weekday(4);
  const friday = moment(now).weekday(5);
  const saturday = moment(now).weekday(6);
  const sunday = moment(now).weekday(7);
  const days = [
    { key: 'monday', day: monday },
    { key: 'tuesday', day: tuesday },
    { key: 'wednesday', day: wednesday },
    { key: 'thursday', day: thursday },
    { key: 'friday', day: friday },
    { key: 'saturday', day: saturday },
    { key: 'sunday', day: sunday },
  ];

  const handlePressMeal = (dayKey, val) => {
    const newDefaultSchedule = { ...defaultSchedule };
    newDefaultSchedule[dayKey] += val;
    dispatch(submitDefaultSchedule(groupId, newDefaultSchedule, weekCursor));
  };

  return (
    <ScrollView>
      <Grid columns={10} columnGap={20} rowGap={10} style={{ marginTop: 10 }}>
        <Grid.Row>
          <Grid.Column colsCount={2}>
            <Text>&nbsp;</Text>
          </Grid.Column>
          <Grid.Column colsCount={4} style={{ alignItems: 'center' }}>
            <Text>Lunch</Text>
          </Grid.Column>
          <Grid.Column colsCount={4} style={{ alignItems: 'center' }}>
            <Text>Dinner</Text>
          </Grid.Column>
        </Grid.Row>
        {days.map((d) => (
          <Grid.Row key={d.key}>
            <Grid.Column colsCount={2}>
              <View style={{ justifyContent: 'flex-end', flexDirection: 'row' }}>
                <Text style={{ fontWeight: 500 }}>{d.day.format('ddd')}</Text>
              </View>
            </Grid.Column>
            <Grid.Column colsCount={4}>
              <MealCell
                dayKey={d.key}
                type={MEAL.LUNCH}
                schedule={defaultSchedule}
                onToggleAttendance={handlePressMeal}
              />
            </Grid.Column>
            <Grid.Column colsCount={4}>
              <MealCell
                dayKey={d.key}
                type={MEAL.DINNER}
                schedule={defaultSchedule}
                onToggleAttendance={handlePressMeal}
              />
            </Grid.Column>
          </Grid.Row>
        ))}
      </Grid>
    </ScrollView>
  );
};

export default DefaultSchedule;
