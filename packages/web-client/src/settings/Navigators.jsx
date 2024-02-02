import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Settings from "./Settings";
import Account from "./Account";
import ChangePassword from "./ChangePassword";
import About from "./About";

const SettingsStack = createNativeStackNavigator();

const SettingsNavigator = () => (
  <SettingsStack.Navigator initialRouteName="Settings">
    <SettingsStack.Group screenOptions={{ headerTitleAlign: "center" }}>
      <SettingsStack.Screen
        name="Settings"
        options={{ headerTitle: "Settings" }}
        component={Settings}
      />
      <SettingsStack.Screen
        name="Account"
        options={{ headerTitle: "Account" }}
        component={Account}
      />
      <SettingsStack.Screen
        name="ChangePassword"
        options={{ headerTitle: "Change Password" }}
        component={ChangePassword}
      />
      <SettingsStack.Screen
        name="About"
        options={{ headerTitle: "About" }}
        component={About}
      />
    </SettingsStack.Group>
  </SettingsStack.Navigator>
);

export default SettingsNavigator;
