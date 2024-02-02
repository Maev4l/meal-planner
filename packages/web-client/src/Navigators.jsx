import { createMaterialBottomTabNavigator } from "react-native-paper/react-navigation";
import { Icon } from "react-native-paper";

import { PlanningNavigator } from "./planning";
import { SettingsNavigator } from "./settings";

const AppBottomTabs = createMaterialBottomTabNavigator();

const AppNavigator = () => (
  <AppBottomTabs.Navigator initialRouteName="Groups">
    <AppBottomTabs.Screen
      name="Home"
      options={{
        title: "Home",
        tabBarIcon: ({ color }) => (
          <Icon source="home" color={color} size={20} />
        ),
      }}
      component={PlanningNavigator}
    />
    <AppBottomTabs.Screen
      name="Settings"
      options={{
        title: "Settings",
        tabBarIcon: ({ color }) => (
          <Icon source="cog-outline" color={color} size={20} />
        ),
      }}
      component={SettingsNavigator}
    />
  </AppBottomTabs.Navigator>
);

export default AppNavigator;
