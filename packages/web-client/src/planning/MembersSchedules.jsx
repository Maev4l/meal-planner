import { List, Text, useTheme, Button, Portal, Dialog } from 'react-native-paper';
import { ScrollView } from 'react-native';
import { RefreshControl } from 'react-native-web-refresh-control';
import { useState, useEffect } from 'react';
import moment from 'moment';

import { useSelector, useGroup, useDispatch } from '../store';
import WeekSelector from './WeekSelector';
import { Grid } from '../components';
import { MEAL } from '../domain';
import { refreshMembersSchedules } from './operations';

const MemberComments = ({ comments, onDismiss }) => {
  const { date, mealLabel, memberName, text } = comments;

  return (
    <Portal>
      <Dialog visible onDismiss={onDismiss}>
        <Dialog.Title>
          <Text variant="titleMedium">
            {memberName.toUpperCase()} - {date} ({mealLabel})
          </Text>
        </Dialog.Title>
        <Dialog.Content>
          <Text adjustsFontSizeToFit>{text}</Text>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
};

const MembersSchedules = ({ groupId }) => {
  const weekCursor = useSelector((state) => state.weekCursor);
  const theme = useTheme();
  const group = useGroup(groupId);
  const dispatch = useDispatch();
  const now = moment();
  const [expandState, setExpandState] = useState({
    monday: moment()
      .year(weekCursor.year)
      .isoWeek(weekCursor.week)
      .startOf('isoweek')
      .add(1, 'days')
      .isAfter(now),
    tuesday: moment()
      .year(weekCursor.year)
      .isoWeek(weekCursor.week)
      .startOf('isoweek')
      .add(2, 'days')
      .isAfter(now),
    wednesday: moment()
      .year(weekCursor.year)
      .isoWeek(weekCursor.week)
      .startOf('isoweek')
      .add(3, 'days')
      .isAfter(now),
    thursday: moment()
      .year(weekCursor.year)
      .isoWeek(weekCursor.week)
      .startOf('isoweek')
      .add(4, 'days')
      .isAfter(now),
    friday: moment()
      .year(weekCursor.year)
      .isoWeek(weekCursor.week)
      .startOf('isoweek')
      .add(5, 'days')
      .isAfter(now),
    saturday: moment()
      .year(weekCursor.year)
      .isoWeek(weekCursor.week)
      .startOf('isoweek')
      .add(6, 'days')
      .isAfter(now),
    sunday: moment()
      .year(weekCursor.year)
      .isoWeek(weekCursor.week)
      .startOf('isoweek')
      .add(7, 'days')
      .isAfter(now),
  });

  const [memberComments, setMemberComments] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setExpandState({
      monday: moment()
        .year(weekCursor.year)
        .isoWeek(weekCursor.week)
        .startOf('isoweek')
        .add(1, 'days')
        .isAfter(now),
      tuesday: moment()
        .year(weekCursor.year)
        .isoWeek(weekCursor.week)
        .startOf('isoweek')
        .add(2, 'days')
        .isAfter(now),
      wednesday: moment()
        .year(weekCursor.year)
        .isoWeek(weekCursor.week)
        .startOf('isoweek')
        .add(3, 'days')
        .isAfter(now),
      thursday: moment()
        .year(weekCursor.year)
        .isoWeek(weekCursor.week)
        .startOf('isoweek')
        .add(4, 'days')
        .isAfter(now),
      friday: moment()
        .year(weekCursor.year)
        .isoWeek(weekCursor.week)
        .startOf('isoweek')
        .add(5, 'days')
        .isAfter(now),
      saturday: moment()
        .year(weekCursor.year)
        .isoWeek(weekCursor.week)
        .startOf('isoweek')
        .add(6, 'days')
        .isAfter(now),
      sunday: moment()
        .year(weekCursor.year)
        .isoWeek(weekCursor.week)
        .startOf('isoweek')
        .add(7, 'days')
        .isAfter(now),
    });
  }, [weekCursor]);

  const { members } = group;
  const sortedMembers = Object.entries(members)
    .map(([, m]) => m)
    .sort((a, b) => a.memberName.toLowerCase().localeCompare(b.memberName.toLowerCase()));

  const monday = moment().year(weekCursor.year).isoWeek(weekCursor.week).startOf('isoweek');
  const tuesday = moment(monday).add(1, 'days');
  const wednesday = moment(monday).add(2, 'days');
  const thursday = moment(monday).add(3, 'days');
  const friday = moment(monday).add(4, 'days');
  const saturday = moment(monday).add(5, 'days');
  const sunday = moment(monday).add(6, 'days');
  const days = [
    { key: 'monday', day: monday },
    { key: 'tuesday', day: tuesday },
    { key: 'wednesday', day: wednesday },
    { key: 'thursday', day: thursday },
    { key: 'friday', day: friday },
    { key: 'saturday', day: saturday },
    { key: 'sunday', day: sunday },
  ];

  const handlePressMeal = (date, mealLabel, memberName, comments) => {
    if (comments) {
      setMemberComments({ date, mealLabel, memberName, text: comments });
    }
  };

  const handleDismissComments = () => {
    setMemberComments(null);
  };

  const handleToggleDay = (dayKey) => {
    const newState = { ...expandState };
    newState[dayKey] = !newState[dayKey];
    setExpandState({ ...newState });
  };

  const handleRefreshMembersSchedules = () => {
    setRefreshing(true);
    dispatch(
      refreshMembersSchedules(weekCursor.year(), weekCursor.isoWeek(), () => {
        setRefreshing(false);
      }),
    );
  };

  return (
    <>
      {memberComments && (
        <MemberComments comments={memberComments} onDismiss={handleDismissComments} />
      )}
      <WeekSelector weekCursor={weekCursor} />
      <ScrollView
        refreshControl={
          <RefreshControl onRefresh={handleRefreshMembersSchedules} refreshing={refreshing} />
        }
      >
        {days.map((d) => {
          const totals = {
            lunch: 0,
            dinner: 0,
          };

          return (
            <List.Accordion
              key={d.day.format('dddd MMMM DD')}
              title={d.day.format('dddd MMMM DD')}
              titleStyle={{ fontWeight: 500 }}
              expanded={expandState[d.key]}
              onPress={() => handleToggleDay(d.key)}
            >
              <List.Item
                contentStyle={{ paddingLeft: 0 }}
                title={
                  <Grid columns={10} columnGap={20} rowGap={10} style={{ width: '100%' }}>
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
                    {sortedMembers.map((member) => {
                      const { schedule, memberName, comments } = member;
                      const attendance = schedule[d.key];
                      const daylyComments = comments[d.key];

                      if (attendance & MEAL.LUNCH) {
                        totals.lunch += 1;
                      }
                      if (attendance & MEAL.DINNER) {
                        totals.dinner += 1;
                      }

                      return (
                        <Grid.Row key={`${d.day.format('dddd MMM DD')}#${member.memberName}`}>
                          <Grid.Column colsCount={2}>
                            <Text
                              style={{
                                textTransform: 'uppercase',
                              }}
                              ellipsizeMode="tail"
                            >
                              {member.memberName}
                            </Text>
                          </Grid.Column>
                          <Grid.Column colsCount={4} style={{ alignItems: 'center' }}>
                            <Button
                              compact
                              mode="contained"
                              contentStyle={{ flexDirection: 'row-reverse' }}
                              icon={daylyComments.lunch ? 'note-check' : ''}
                              style={{ flexGrow: 1 }}
                              buttonColor={
                                attendance & MEAL.LUNCH ? theme.colors.primary : theme.colors.error
                              }
                              onPress={() =>
                                handlePressMeal(
                                  d.day.format('dddd MMM DD'),
                                  'Lunch',
                                  memberName,
                                  daylyComments.lunch,
                                )
                              }
                            >
                              {attendance & MEAL.LUNCH ? 'PRESENT' : 'ABSENT'}
                            </Button>
                          </Grid.Column>
                          <Grid.Column colsCount={4} style={{ alignItems: 'center' }}>
                            <Button
                              compact
                              mode="contained"
                              contentStyle={{ flexDirection: 'row-reverse' }}
                              icon={daylyComments.dinner ? 'note-check' : ''}
                              style={{ flexGrow: 1 }}
                              buttonColor={
                                attendance & MEAL.DINNER ? theme.colors.primary : theme.colors.error
                              }
                              onPress={() =>
                                handlePressMeal(
                                  d.day.format('dddd MMM DD'),
                                  'Dinner',
                                  memberName,
                                  daylyComments.dinner,
                                )
                              }
                            >
                              {attendance & MEAL.DINNER ? 'PRESENT' : 'ABSENT'}
                            </Button>
                          </Grid.Column>
                        </Grid.Row>
                      );
                    })}
                    <Grid.Row>
                      <Grid.Column colsCount={2}>
                        <Text style={{ fontWeight: 500 }}>Total</Text>
                      </Grid.Column>
                      <Grid.Column colsCount={4} style={{ alignItems: 'center' }}>
                        <Text style={{ fontWeight: 500 }}>{totals.lunch}</Text>
                      </Grid.Column>
                      <Grid.Column colsCount={4} style={{ alignItems: 'center' }}>
                        <Text style={{ fontWeight: 500 }}>{totals.dinner}</Text>
                      </Grid.Column>
                    </Grid.Row>
                  </Grid>
                }
              />
            </List.Accordion>
          );
        })}
      </ScrollView>
    </>
  );
};

export default MembersSchedules;
