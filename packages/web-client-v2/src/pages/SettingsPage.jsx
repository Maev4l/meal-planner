import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 56px)',
        mx: -2,
      }}
    >
      <AppBar position="static" sx={{ width: '100%' }}>
        <Toolbar>
          <Typography
            variant="h6"
            component="h1"
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            Settings
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List disablePadding>
          {/* Account Section */}
          <ListItem onClick={() => navigate('/settings/account')} sx={{ cursor: 'pointer' }}>
            <ListItemIcon>
              <AccountCircleIcon />
            </ListItemIcon>
            <ListItemText primary="Account" secondary={user?.name || '—'} />
            <ChevronRightIcon color="action" />
          </ListItem>
          <Divider />

          {/* About Section */}
          <ListItem onClick={() => navigate('/settings/about')} sx={{ cursor: 'pointer' }}>
            <ListItemIcon>
              <InfoOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary="About" />
            <ChevronRightIcon color="action" />
          </ListItem>
        </List>
      </Box>
    </Box>
  );
};

export default SettingsPage;
