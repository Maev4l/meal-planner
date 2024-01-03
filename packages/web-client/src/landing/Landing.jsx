import { Navigate } from 'react-router-dom';

import { useAuth } from '../security';

const Landing = () => {
  const { token } = useAuth();

  return token ? <Navigate to="/planning" replace /> : <Navigate to="/sign-in" replace />;
};

export default Landing;
