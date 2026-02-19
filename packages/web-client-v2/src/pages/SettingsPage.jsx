// Edited by Claude.
// Warm Bistro themed settings page with elegant list design
import { useState } from 'react';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  Snackbar,
  Avatar,
  alpha,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Generate consistent color from string for avatar backgrounds
const stringToColor = (str) => {
  const colors = [
    '#722F37', // burgundy
    '#D4A373', // amber
    '#87A878', // sage
    '#C9705E', // terracotta
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const SettingsItem = ({ icon: Icon, title, subtitle, onClick, action }) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 3,
        backgroundColor: 'background.paper',
        mb: 1.5,
        border: (theme) =>
          `1px solid ${alpha(theme.palette.charcoal.main, 0.06)}`,
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick
          ? {
              transform: 'translateY(-1px)',
              boxShadow: (theme) =>
                `0 4px 16px ${alpha(theme.palette.charcoal.main, 0.08)}`,
            }
          : {},
        animation: 'fadeInUp 0.4s ease-out forwards',
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2.5,
          backgroundColor: (theme) =>
            alpha(theme.palette.burgundy.main, 0.08),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 22, color: 'primary.main' }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 500,
            color: 'text.primary',
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {action || (
        <ChevronRightIcon sx={{ color: 'text.disabled', fontSize: 22 }} />
      )}
    </Box>
  );
};

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

  const userColor = user?.name ? stringToColor(user.name) : '#722F37';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 68px)',
        mx: -2,
      }}
    >
      <AppBar position="static" sx={{ width: '100%' }}>
        <Toolbar sx={{ justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SettingsIcon sx={{ fontSize: 24 }} />
            <Typography
              variant="h6"
              component="h1"
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 600,
                letterSpacing: '0.02em',
              }}
            >
              Settings
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          backgroundColor: 'background.default',
        }}
      >
        {/* User profile card */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2.5,
            borderRadius: 3,
            backgroundColor: 'background.paper',
            mb: 3,
            border: (theme) =>
              `1px solid ${alpha(theme.palette.charcoal.main, 0.06)}`,
            boxShadow: (theme) =>
              `0 4px 16px ${alpha(theme.palette.charcoal.main, 0.06)}`,
            animation: 'fadeInUp 0.4s ease-out forwards',
          }}
        >
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: userColor,
              fontSize: '1.4rem',
              fontWeight: 600,
            }}
          >
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 600,
                color: 'text.primary',
              }}
            >
              {user?.name || 'Unknown'}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                mt: 0.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'text.disabled',
                  fontFamily: 'monospace',
                  fontSize: '0.7rem',
                }}
              >
                {user?.memberId?.substring(0, 12)}...
              </Typography>
              <Box
                onClick={handleCopyUserId}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: (theme) =>
                      alpha(theme.palette.charcoal.main, 0.08),
                  },
                }}
              >
                <ContentCopyIcon
                  sx={{ fontSize: 14, color: 'text.disabled' }}
                />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Settings items */}
        <Typography
          variant="subtitle2"
          sx={{
            color: 'text.secondary',
            mb: 1.5,
            px: 0.5,
            animation: 'fadeIn 0.3s ease-out forwards',
          }}
        >
          ACCOUNT
        </Typography>

        <SettingsItem
          icon={AccountCircleIcon}
          title="Account Details"
          subtitle="Manage your profile and preferences"
          onClick={() => navigate('/settings/account')}
        />

        <Typography
          variant="subtitle2"
          sx={{
            color: 'text.secondary',
            mb: 1.5,
            mt: 3,
            px: 0.5,
            animation: 'fadeIn 0.3s ease-out forwards',
            animationDelay: '0.1s',
          }}
        >
          APP
        </Typography>

        <SettingsItem
          icon={InfoOutlinedIcon}
          title="About"
          subtitle="Version and app information"
          onClick={() => navigate('/settings/about')}
        />
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        message="User ID copied to clipboard"
      />
    </Box>
  );
};

export default SettingsPage;
