import { CssBaseline } from '@mui/material';

import { RouterProvider } from 'react-router-dom';

import router from './Router';
import { AuthProvider } from './security';

const App = () => (
  <AuthProvider>
    <CssBaseline />
    <RouterProvider router={router} />
  </AuthProvider>
);

export default App;
