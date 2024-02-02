import { View, Modal } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { useEffect } from "react";

import { AuthenticationNavigator, getToken } from "./security";
import AppNavigator from "./Navigators";
import { useSelector, useDispatch } from "./store";

const Splash = () => (
  <Modal
    transparent
    animationType="none"
    visible
    onRequestClose={() => {} /* Required for Android. */}
  >
    <View
      style={{
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        adjustsFontSizeToFit
        variant="displayMedium"
        style={{ marginBottom: 10 }}
      >
        MEAL PLANNER
      </Text>
      <ActivityIndicator animating size="large" />
    </View>
  </Modal>
);

const App = () => {
  const authState = useSelector((state) => state.authn.state);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getToken());
  }, []);

  if (authState === "FETCHING_TOKEN") {
    return <Splash />;
  }
  if (authState === "LOGGED_OUT") {
    return <AuthenticationNavigator />;
  }

  return <AppNavigator />;
};

export default App;
