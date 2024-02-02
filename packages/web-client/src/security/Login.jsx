import { View } from "react-native";
import { Button, TextInput, Text } from "react-native-paper";
import { useState } from "react";

import { useDispatch } from "../store";
import { signin } from "./operations";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();

  const handleChangeUsername = (val) => setUsername(val);
  const handleChangePassword = (val) => setPassword(val);
  const onPressEye = () => setShowPassword(!showPassword);

  const handleSignIn = async () => {
    dispatch(signin(username, password));
  };

  return (
    <View
      w="100%"
      h="100%"
      style={{
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text variant="headlineMedium" style={{ fontWeight: 500 }}>
        MEAL PLANNER
      </Text>
      <TextInput
        autoCorrect={false}
        autoCapitalize="none"
        value={username}
        mode="outlined"
        label="Username"
        placeholder="Enter username"
        onChangeText={handleChangeUsername}
        style={{ marginBottom: 10, width: "80%" }}
      />
      <TextInput
        autoCorrect={false}
        autoCapitalize="none"
        secureTextEntry={!showPassword}
        value={password}
        mode="outlined"
        label="Password"
        placeholder="Enter password"
        onChangeText={handleChangePassword}
        style={{ marginBottom: 10, width: "80%" }}
        right={
          <TextInput.Icon
            icon={showPassword ? "eye-outline" : "eye-off-outline"}
            onPress={onPressEye}
          />
        }
      />
      <Button mode="contained" onPress={handleSignIn}>
        SIGN IN
      </Button>
    </View>
  );
};

export default Login;
