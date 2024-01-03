import { useAuth } from '../security';

const Planning = () => {
  const { token } = useAuth();
  return <div>Planning !! {`${token}`}</div>;
};

export default Planning;
