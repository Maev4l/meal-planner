import { CssBaseline } from '@mui/material';

import Router from './Router';
import { AuthProvider } from './security';
import { NotificationProvider, NotificationBar } from './components';

const App = () => (
  <NotificationProvider>
    <AuthProvider>
      <CssBaseline />
      <NotificationBar />
      <Router />
    </AuthProvider>
  </NotificationProvider>
);

export default App;
