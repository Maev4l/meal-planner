import { CssBaseline } from '@mui/material';

import Router from './Router';
import { AuthProvider } from './security';

const App = () => (
  <AuthProvider>
    <CssBaseline />
    <Router />
  </AuthProvider>
);

export default App;
