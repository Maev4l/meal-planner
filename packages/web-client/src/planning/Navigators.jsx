import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import moment from 'moment';

import Groups from './Groups';

import SchedulesContainer from './SchedulesContainer';
import Comments, { CommentsHeaderBarTitle } from './Comments';
import WeeklyNotice, { WeeklyNoticeHeaderBarTitle } from './WeeklyNotice';
import { getSchedules } from './operations';
import { useDispatch } from '../store';

const PlanningStack = createNativeStackNavigator();

const PlanningNavigator = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const weekCursor = moment().startOf('isoweek');
    dispatch(getSchedules(weekCursor.year(), weekCursor.isoWeek()));
  }, []);

  return (
    <PlanningStack.Navigator initialRouteName="Groups">
      <PlanningStack.Group screenOptions={{ headerTitleAlign: 'center' }}>
        <PlanningStack.Screen
          name="Groups"
          options={{ headerTitle: 'Groups' }}
          component={Groups}
        />
        <PlanningStack.Screen
          name="Schedules"
          options={({ route }) => ({
            headerTitle: `${route.params.groupName}`,
          })}
          component={SchedulesContainer}
        />
        <PlanningStack.Screen
          options={({ route }) => ({
            headerTitle: () => <CommentsHeaderBarTitle route={route} />,
          })}
          name="Comments"
          component={Comments}
        />
        <PlanningStack.Screen
          options={({ route }) => ({
            headerTitle: () => <WeeklyNoticeHeaderBarTitle route={route} />,
          })}
          name="Notice"
          component={WeeklyNotice}
        />
      </PlanningStack.Group>
    </PlanningStack.Navigator>
  );
};

export default PlanningNavigator;
