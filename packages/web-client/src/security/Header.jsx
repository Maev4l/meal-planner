import { AppBar, Box, Toolbar, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from './helpers';

const Header = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const onSignOut = async () => {
    await signOut();
    navigate('/sign-in', { replace: true });
  };

  return (
    <AppBar position="static" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'space-between' }}>
          <Typography component="h1" variant="h5">
            MEAL PLANNER
          </Typography>
          <Button onClick={onSignOut} variant="contained" color="success">
            Sign Out
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
