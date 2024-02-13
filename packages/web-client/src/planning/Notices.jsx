import { ScrollView, View } from 'react-native';
import { Card, List, Button, Text, Divider, useTheme, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';

import { useGroup, useSelector, useAuth, useDispatch } from '../store';
import { deleteNotice } from './operations';

import WeekSelector from './WeekSelector';

const AddNotice = ({ onAdd }) => (
  <List.Item
    titleStyle={{ alignSelf: 'center' }}
    style={{ marginTop: 5, marginBottom: 5 }}
    title={
      <Button icon="plus-thick" compact mode="contained" onPress={onAdd}>
        Add notice
      </Button>
    }
  />
);

const Notice = ({ notice, year, weekNumber, owned }) => {
  const { memberName, memberId, groupId, content, createdAt, groupName } = notice;
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const handleDelete = () => dispatch(deleteNotice(groupId, memberId, `${year}-${weekNumber}`));

  const handleEdit = () =>
    navigation.navigate('Notice', {
      groupId,
      groupName,
      year,
      weekNumber,
    });

  return (
    <Card style={{ marginTop: 5, marginBottom: 5 }} onPress={owned ? handleEdit : null}>
      <Card.Title
        title={
          <View
            style={{
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row' }}>
              <Text>From:</Text>
              <Text style={{ paddingLeft: 5, fontWeight: 500, textTransform: 'uppercase' }}>
                {memberName}
              </Text>
            </View>
            <View>
              <Text variant="bodyMedium">
                {moment(createdAt).local().format('dddd, MMM DD @ HH:mm')}
              </Text>
            </View>
          </View>
        }
      />
      <Card.Content>
        <Divider />
        <Text style={{ marginTop: 5 }}>{content}</Text>
      </Card.Content>
      <Card.Actions>
        {owned ? (
          <IconButton
            mode="contained"
            icon="close-thick"
            size={12}
            iconColor={theme.colors.error}
            onPress={handleDelete}
          />
        ) : null}
      </Card.Actions>
    </Card>
  );
};

const Notices = ({ groupId }) => {
  const group = useGroup(groupId);
  const weekCursor = useSelector((state) => state.weekCursor);
  const { userId } = useAuth();
  const navigation = useNavigation();

  const { members, groupName } = group;

  const year = weekCursor.year();
  const weekNumber = weekCursor.isoWeek();

  // Extract all notices
  const notices = Object.entries(members)
    .map(([, m]) => m)
    .filter((m) => !!m.notice)
    .map((m) => ({
      groupId,
      memberId: m.memberId,
      memberName: m.memberName,
      groupName: m.groupName,
      content: m.notice.content,
      createdAt: m.notice.createdAt,
    }))
    .sort((a, b) => moment(b.createdAt) - moment(a.createdAt));

  // Find if a personal notice exists, ih there is no personal notice
  // than display an "Add notice" button
  const [personalNotice] = notices.filter((n) => n.memberId === userId);

  const handlePressAddNotice = () => {
    navigation.navigate('Notice', {
      groupId,
      groupName,
      year,
      weekNumber,
    });
  };

  return (
    <>
      <WeekSelector weekStartDay={weekCursor} />
      <ScrollView>
        {!personalNotice && <AddNotice onAdd={handlePressAddNotice} />}
        {notices.map((n) => {
          const owned = n.memberId === userId;
          return (
            <Notice key={n.memberId} notice={n} owned={owned} year={year} weekNumber={weekNumber} />
          );
        })}
      </ScrollView>
    </>
  );
};

export default Notices;
