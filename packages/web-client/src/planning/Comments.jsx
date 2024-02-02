import { TextInput, Text, Button } from "react-native-paper";
import { View } from "react-native";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";

import { useAuth, useDispatch, useGroup } from "../store";
import { submitPersonalSchedule } from "./operations";

export const CommentsHeaderBarTitle = ({ route }) => {
  const {
    params: { groupName, day, mealKey },
  } = route;

  const mealDesc = mealKey === "lunch" ? "Lunch" : "Dinner";
  return (
    <View style={{ alignItems: "center" }}>
      <Text variant="titleMedium">{groupName}</Text>
      <View style={{ flexDirection: "row", gap: 5 }}>
        <Text>{day}</Text>
        <Text>({mealDesc})</Text>
      </View>
    </View>
  );
};

const Comments = ({ route }) => {
  const {
    params: { groupId, dayKey, mealKey },
  } = route;
  const group = useGroup(groupId);
  const { members } = group;

  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { userId } = useAuth();
  const member = members[userId];
  const { schedule } = member;
  const day = schedule[dayKey];
  const { comments } = day;

  const [content, setContent] = useState(comments[mealKey]);

  const handleCommentsChange = (v) => {
    setContent(v);
  };

  const onSubmitSuccess = () => {
    navigation.goBack();
  };

  const handleSubmit = () => {
    const newSchedule = { ...schedule };
    newSchedule[dayKey].comments[mealKey] = content;
    dispatch(
      submitPersonalSchedule(groupId, userId, newSchedule, onSubmitSuccess)
    );
  };

  return (
    <View style={{ padding: 10, gap: 10, flex: 1 }}>
      <TextInput
        mode="outlined"
        multiline
        maxLength={100}
        placeholder="Type your comments"
        value={content}
        onChangeText={handleCommentsChange}
        style={{ height: 125 }}
      />
      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <Button mode="contained" onPress={handleSubmit}>
          SUBMIT
        </Button>
      </View>
    </View>
  );
};

export default Comments;
