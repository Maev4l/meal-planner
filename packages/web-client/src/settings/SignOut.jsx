import { Button, Box } from '@mui/material';
import { Logout } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../security';

const SignOut = () => {
  const { signOut } = useAuth();

  const navigate = useNavigate();

  const handleSignOut = async () => {
    signOut();
    navigate('/sign-in');
  };

  return (
    <Box sx={{ pt: 2 }}>
      <Button color="warning" variant="contained" endIcon={<Logout />} onClick={handleSignOut}>
        SignOut
      </Button>
    </Box>
  );
};

export default SignOut;
