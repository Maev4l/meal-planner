import { useState } from 'react';
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
  Snackbar,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleCopyUserId = (e) => {
    e.stopPropagation();
    if (user?.memberId) {
      navigator.clipboard.writeText(user.memberId);
      setSnackbarOpen(true);
    }
  };

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
            <ListItemText
              primary="Account"
              secondary={
                <>
                  <Typography component="span" variant="body2">{user?.name || '—'}</Typography>
                  <br />
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ color: 'text.disabled', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                  >
                    {user?.memberId}
                    <ContentCopyIcon sx={{ fontSize: 12, cursor: 'pointer' }} onClick={handleCopyUserId} />
                  </Typography>
                </>
              }
            />
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
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        message="User ID copied"
      />
    </Box>
  );
};

export default SettingsPage;
