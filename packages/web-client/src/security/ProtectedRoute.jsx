import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from './helpers';

const ProtectedRoute = () => {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/sign-in" replace />;
  }

  const userId = token.payload.sub.replaceAll('-', '').toUpperCase();

  return <Outlet context={{ userId }} />;
};

export default ProtectedRoute;
