import { TextInput, Text, Button } from 'react-native-paper';
import { View } from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';

import { useGroup, useAuth, useDispatch } from '../store';
import { submitNotice } from './operations';

export const WeeklyNoticeHeaderBarTitle = ({ route }) => {
  const {
    params: { groupName, year, weekNumber },
  } = route;

  return (
    <View style={{ alignItems: 'center' }}>
      <Text variant="titleMedium">{groupName}</Text>
      <Text>
        Add a notice for week {year} - {String(weekNumber).padStart(2, '0')}
      </Text>
    </View>
  );
};

const WeeklyNotice = ({ route }) => {
  const {
    params: { groupId, year, weekNumber },
  } = route;

  const navigation = useNavigation();
  const dispatch = useDispatch();
  const group = useGroup(groupId);
  const { members } = group;
  const { userId } = useAuth();

  const c = members[userId].notice ? members[userId].notice.content : '';

  const [content, setContent] = useState(c);

  const handleNoticeChange = (v) => {
    setContent(v);
  };

  const onSubmitSuccess = () => {
    navigation.goBack();
  };

  const handleSubmit = () => {
    const notice = {
      year,
      weekNumber,
      content,
    };
    dispatch(submitNotice(groupId, userId, notice, onSubmitSuccess));
  };

  return (
    <View style={{ padding: 10, gap: 10, flex: 1 }}>
      <TextInput
        mode="outlined"
        multiline
        maxLength={100}
        placeholder="Type your notice for other members"
        value={content}
        onChangeText={handleNoticeChange}
        style={{ height: 125 }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Button mode="contained" onPress={handleSubmit}>
          SUBMIT
        </Button>
      </View>
    </View>
  );
};

export default WeeklyNotice;
