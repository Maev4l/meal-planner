import { AppRegistry } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Amplify } from 'aws-amplify';

import { Loader, NotificationBar, AppPreferencesProvider } from './components';
import { StoreProvider } from './store';

import App from './App';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.userPoolId,
      userPoolClientId: process.env.clientId,
    },
  },
});

const Main = () => (
  <StoreProvider>
    <SafeAreaProvider>
      <AppPreferencesProvider>
        <NotificationBar />
        <Loader />
        <App />
      </AppPreferencesProvider>
    </SafeAreaProvider>
  </StoreProvider>
);

AppRegistry.registerComponent('Main', () => Main);

AppRegistry.runApplication('Main', {
  rootTag: document.getElementById('root'),
});
