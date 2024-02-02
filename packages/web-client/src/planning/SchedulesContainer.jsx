import { Chip } from "react-native-paper";
import { useState } from "react";
import { View } from "react-native";

import PersonalSchedule from "./PersonalSchedule";
import MembersSchedules from "./MembersSchedules";
import DefaultSchedule from "./DefaultSchedule";

const SchedulesContainer = ({ route }) => {
  const {
    params: { groupId },
  } = route;

  const [scheduleType, setScheduleType] = useState(
    "personal" /* members, default */
  );

  const handleChangeType = (type) => {
    setScheduleType(type);
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <View
        style={{
          alignItems: "center",
          flexDirection: "row",
          gap: 10,
        }}
      >
        <Chip
          selected={scheduleType === "personal"}
          onPress={() => handleChangeType("personal")}
          showSelectedOverlay
          showSelectedCheck={false}
        >
          Personal
        </Chip>
        <Chip
          selected={scheduleType === "members"}
          onPress={() => handleChangeType("members")}
          showSelectedOverlay
          showSelectedCheck={false}
        >
          Members
        </Chip>
        <Chip
          selected={scheduleType === "default"}
          onPress={() => handleChangeType("default")}
          showSelectedOverlay
          showSelectedCheck={false}
        >
          Default
        </Chip>
      </View>
      {scheduleType === "personal" && <PersonalSchedule groupId={groupId} />}
      {scheduleType === "members" && <MembersSchedules groupId={groupId} />}
      {scheduleType === "default" && <DefaultSchedule groupId={groupId} />}
    </View>
  );
};

export default SchedulesContainer;
