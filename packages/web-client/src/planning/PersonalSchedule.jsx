import { Text, Button, IconButton, useTheme } from 'react-native-paper';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';

import WeekSelector from './WeekSelector';
import { useDispatch, useSelector, useAuth, useGroup } from '../store';
import { Grid } from '../components';
import { MEAL } from '../domain';
import { submitPersonalSchedule } from './operations';

const RowHeaderCell = ({ day }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Text style={{ fontWeight: 500 }}>{day.format('ddd')}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Text>{day.format('MMM DD')}</Text>
      </View>
    </View>
  </View>
);

const MealCell = ({
  day,
  dayKey,
  schedule,
  comments,
  type,
  onToggleAttendance,
  onPressComments,
}) => {
  const theme = useTheme();
  const now = moment();
  const endOfDay = moment(day).endOf('day');
  const disabled = now.isAfter(endOfDay);

  const attendance = schedule[dayKey];

  const mealKey = type === MEAL.LUNCH ? 'lunch' : 'dinner';

  const handlePressMeal = () => {
    if (attendance & type) {
      // Change Set to Unset
      onToggleAttendance(dayKey, type * -1);
    } else {
      onToggleAttendance(dayKey, type);
    }
  };

  const handlePressComments = () => {
    onPressComments(day, dayKey, mealKey);
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Button
        disabled={disabled}
        compact
        mode="contained"
        style={{ flexGrow: 1 }}
        buttonColor={attendance & type ? theme.colors.primary : theme.colors.error}
        onPress={handlePressMeal}
      >
        {attendance & type ? 'PRESENT' : 'ABSENT'}
      </Button>
      <IconButton
        icon={comments[dayKey][mealKey] ? 'note-check' : 'note-edit-outline'}
        disabled={disabled}
        style={{ margin: 1 }}
        size={20}
        iconColor={theme.colors.primary}
        onPress={handlePressComments}
      />
    </View>
  );
};

const PersonalSchedule = ({ groupId }) => {
  const weekCursor = useSelector((state) => state.weekCursor);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const group = useGroup(groupId);

  const { members, groupName } = group;
  const { userId } = useAuth();
  const { schedule, comments } = members[userId];

  const monday = moment(weekCursor);
  const tuesday = moment(monday).add(1, 'days');
  const wednesday = moment(monday).add(2, 'days');
  const thursday = moment(monday).add(3, 'days');
  const friday = moment(monday).add(4, 'days');
  const saturday = moment(monday).add(5, 'days');
  const sunday = moment(monday).add(6, 'days');

  const handlePressMeal = (dayKey, val) => {
    const newSchedule = { ...schedule };
    newSchedule[dayKey] += val;

    dispatch(submitPersonalSchedule(groupId, userId, newSchedule));
  };

  const handlePressComments = (day, dayKey, mealKey) => {
    navigation.navigate('Comments', {
      groupId,
      groupName,
      day: day.format('dddd MMM DD'),
      dayKey,
      mealKey,
    });
  };

  const days = [
    { key: 'monday', day: monday },
    { key: 'tuesday', day: tuesday },
    { key: 'wednesday', day: wednesday },
    { key: 'thursday', day: thursday },
    { key: 'friday', day: friday },
    { key: 'saturday', day: saturday },
    { key: 'sunday', day: sunday },
  ];

  return (
    <>
      <WeekSelector weekStartDay={weekCursor} />

      <Grid columns={10} columnGap={20} rowGap={10}>
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
          <Grid.Row key={d.key} highlight={moment().isSame(d.day, 'day')}>
            <Grid.Column colsCount={2}>
              <RowHeaderCell day={d.day} />
            </Grid.Column>
            <Grid.Column colsCount={4}>
              <MealCell
                day={d.day}
                dayKey={d.key}
                type={MEAL.LUNCH}
                schedule={schedule}
                comments={comments}
                onToggleAttendance={handlePressMeal}
                onPressComments={handlePressComments}
              />
            </Grid.Column>
            <Grid.Column colsCount={4}>
              <MealCell
                day={d.day}
                dayKey={d.key}
                type={MEAL.DINNER}
                schedule={schedule}
                comments={comments}
                onToggleAttendance={handlePressMeal}
                onPressComments={handlePressComments}
              />
            </Grid.Column>
          </Grid.Row>
        ))}
      </Grid>
    </>
  );
};

export default PersonalSchedule;
