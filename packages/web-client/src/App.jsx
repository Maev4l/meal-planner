import { CssBaseline } from '@mui/material';
import AppRoutes from './AppRoutes';
import { AuthProvider } from './security';

const App = () => (
  <AuthProvider>
    <CssBaseline />
    <AppRoutes />
  </AuthProvider>
);

export default App;
