import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../security';

const Landing = () => {
  const { token } = useAuth();

  const { pathname } = useLocation();

  if (pathname === '/') {
    return token ? <Navigate to="planning" replace /> : <Navigate to="sign-in" replace />;
  }

  return token ? <Outlet /> : <Navigate to="sign-in" replace />;
};

export default Landing;
