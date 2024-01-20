import { AppBar, Toolbar, Typography, IconButton, Stack, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from '@mui/icons-material';
import { Fragment } from 'react';

import { useAuth } from '../security';
import SignOut from './SignOut';
import ChangePassword from './ChangePassword';
import Version from './Version';

const Settings = () => {
  const navigate = useNavigate();
  const {
    token: { payload },
  } = useAuth();
  const username = payload['cognito:username'];
  return (
    <Fragment>
      <AppBar position="static" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton sx={{ p: 0 }} onClick={() => navigate('/')}>
            <ChevronLeft sx={{ color: 'white' }} />
          </IconButton>

          <Typography component="h1" variant="h5" width="100%" align="center">
            {username.toUpperCase()}
          </Typography>
        </Toolbar>
      </AppBar>
      <Stack
        spacing={2}
        sx={{ display: 'flex', alignItems: 'center', width: '100%', pl: 1, pr: 1 }}
        divider={<Divider variant="middle" flexItem />}
      >
        <SignOut />
        <ChangePassword />
        <Version />
      </Stack>
    </Fragment>
  );
};

export default Settings;
