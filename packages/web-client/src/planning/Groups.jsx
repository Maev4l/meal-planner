import { Text, Card } from 'react-native-paper';
import { ScrollView } from 'react-native';

import { useSelector } from '../store';

const Group = ({ group, navigation }) => {
  const { groupName, groupId, members } = group;
  return (
    <Card
      style={{ margin: 10 }}
      mode="elevated"
      accessible
      onPress={() => {
        navigation.navigate('Schedules', { groupName, groupId });
      }}
    >
      <Card.Title titleVariant="labelLarge" title={groupName} />
      <Card.Content>
        <Text>Members: {Object.keys(members).length}</Text>
      </Card.Content>
    </Card>
  );
};

const Groups = ({ navigation }) => {
  const groups = useSelector((state) => state.schedules);

  return (
    <ScrollView style={{ padding: 10, flexWrap: 'wrap', flexDirection: 'row' }}>
      {groups &&
        groups.map((group) => {
          const { groupId } = group;
          return <Group key={groupId} group={group} navigation={navigation} />;
        })}
    </ScrollView>
  );
};

export default Groups;
