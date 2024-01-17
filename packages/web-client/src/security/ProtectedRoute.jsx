import { Navigate, Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

import { useAuth } from './helpers';
import Header from './Header';

const ProtectedRoute = () => {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/sign-in" replace />;
  }

  const userId = token.payload.sub.replaceAll('-', '').toUpperCase();
  return (
    <Box>
      <Header />
      <Outlet context={{ userId }} />
    </Box>
  );
};

export default ProtectedRoute;
