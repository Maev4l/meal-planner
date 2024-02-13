import { Chip, Icon, Badge } from 'react-native-paper';
import { useState } from 'react';
import { View } from 'react-native';

import PersonalSchedule from './PersonalSchedule';
import MembersSchedules from './MembersSchedules';
import DefaultSchedule from './DefaultSchedule';
import Notices from './Notices';

import { useGroup } from '../store';

const SchedulesContainer = ({ route }) => {
  const {
    params: { groupId },
  } = route;

  const [scheduleType, setScheduleType] = useState('personal' /* members, default */);
  const group = useGroup(groupId);

  const getNoticesCount = () => {
    const { members } = group;
    const notices = Object.entries(members)
      .map(([, m]) => m)
      .filter((m) => !!m.notice);
    return notices.length;
  };

  const handleChangeType = (type) => {
    setScheduleType(type);
  };

  const noticesCount = getNoticesCount();

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
        }}
      >
        <Chip
          selected={scheduleType === 'personal'}
          onPress={() => handleChangeType('personal')}
          showSelectedOverlay
          showSelectedCheck={false}
        >
          Personal
        </Chip>
        <Chip
          selected={scheduleType === 'members'}
          onPress={() => handleChangeType('members')}
          showSelectedOverlay
          showSelectedCheck={false}
        >
          Members
        </Chip>
        <Chip
          selected={scheduleType === 'default'}
          onPress={() => handleChangeType('default')}
          showSelectedOverlay
          showSelectedCheck={false}
        >
          Default
        </Chip>
        <View>
          {noticesCount > 0 ? (
            <Badge
              size={16}
              style={{
                position: 'absolute',
                top: -7,
                right: -3,
                zIndex: 10000 /* TODO: Change arbitrary value */,
              }}
            >
              {noticesCount}
            </Badge>
          ) : null}
          <Chip
            selected={scheduleType === 'notices'}
            onPress={() => handleChangeType('notices')}
            showSelectedOverlay
            showSelectedCheck={false}
          >
            <Icon source="email-outline" size={20} />
          </Chip>
        </View>
      </View>
      {scheduleType === 'personal' && <PersonalSchedule groupId={groupId} />}
      {scheduleType === 'members' && <MembersSchedules groupId={groupId} />}
      {scheduleType === 'default' && <DefaultSchedule groupId={groupId} />}
      {scheduleType === 'notices' && <Notices groupId={groupId} />}
    </View>
  );
};

export default SchedulesContainer;
