/* eslint-disable global-require */
import { Platform, AppRegistry } from "react-native";
import {
  PaperProvider,
  adaptNavigationTheme,
  MD3DarkTheme,
  MD3LightTheme,
} from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  NavigationContainer,
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
import { Amplify } from "aws-amplify";

import { Loader, NotificationBar } from "./components";
import { StoreProvider } from "./store";

import App from "./App";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.userPoolId,
      userPoolClientId: process.env.clientId,
    },
  },
});

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const CombinedDefaultTheme = {
  ...MD3LightTheme,
  ...LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...LightTheme.colors,
  },
};
// eslint-disable-next-line no-unused-vars
const CombinedDarkTheme = {
  ...MD3DarkTheme,
  ...DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...DarkTheme.colors,
  },
};

const Main = () => (
  <StoreProvider>
    <SafeAreaProvider>
      <PaperProvider theme={CombinedDefaultTheme}>
        {Platform.OS === "web" ? (
          <style type="text/css">{`
    @font-face {
      font-family: 'MaterialCommunityIcons';
      src: url(${require("react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf")}) format('truetype');
    }
  `}</style>
        ) : null}
        <NotificationBar />
        <NavigationContainer theme={CombinedDefaultTheme}>
          <Loader />
          <App />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  </StoreProvider>
);

AppRegistry.registerComponent("Main", () => Main);

AppRegistry.runApplication("Main", {
  rootTag: document.getElementById("root"),
});
