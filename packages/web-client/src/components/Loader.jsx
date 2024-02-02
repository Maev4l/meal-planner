import { View, Modal } from "react-native";
import { ActivityIndicator } from "react-native-paper";

import { useSelector } from "../store";

const Loader = () => {
  const loading = useSelector((state) => state.loading);
  return (
    <Modal
      transparent
      animationType="none"
      visible={loading}
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
        <ActivityIndicator animating size="large" />
      </View>
    </Modal>
  );
};

export default Loader;
