import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "./Login";

const AuthenticationStack = createNativeStackNavigator();

export const AuthenticationNavigator = () => (
  <AuthenticationStack.Navigator>
    <AuthenticationStack.Screen
      name="SignIn"
      options={{ headerShown: false }}
      component={Login}
    />
  </AuthenticationStack.Navigator>
);
