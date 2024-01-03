import { Navigate, Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

import { useAuth } from './helpers';
import Header from './Header';

const ProtectedRoute = () => {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/sign-in" replace />;
  }
  return (
    <Box>
      <Header />
      <Outlet />
    </Box>
  );
};

export default ProtectedRoute;
