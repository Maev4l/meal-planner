// Edited by Claude.
// Warm Bistro themed update prompt with elegant styling
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Snackbar, Box, Typography, alpha } from '@mui/material';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';

// Background safety-net poll interval. Hourly (not 60s): visibilitychange below
// covers the common open/background/return pattern, so a tighter interval would
// only re-fetch sw.js more often — maximizing the chance of catching a divergent
// edge copy and re-showing a phantom "update available" banner — without
// delivering new versions any faster.
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000;

/**
 * PWA update prompt - shows a clickable banner when a new version is available.
 * Clicking anywhere on the banner triggers the update and page reload.
 * Periodically checks for updates in the background.
 */
const UpdatePrompt = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        // Background safety net: catch a deploy while the app sits open and idle.
        setInterval(() => {
          registration.update();
        }, UPDATE_CHECK_INTERVAL);

        // Primary trigger: re-check the instant the user returns to the app. This
        // is what makes a fresh deploy show up quickly for normal usage.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update();
          }
        });
      }
    },
  });

  if (!needRefresh) return null;

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  return (
    <Snackbar
      open
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 82, sm: 24 } }} // Above bottom nav on mobile (adjusted for new nav height)
    >
      <Box
        onClick={handleUpdate}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          py: 2,
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.burgundy.main} 0%, ${theme.palette.burgundy.dark} 100%)`,
          color: '#FFF8F0',
          borderRadius: 3,
          cursor: 'pointer',
          boxShadow: (theme) =>
            `0 8px 32px ${alpha(theme.palette.burgundy.main, 0.4)}`,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: (theme) =>
              `0 12px 40px ${alpha(theme.palette.burgundy.main, 0.5)}`,
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
          animation: 'scaleIn 0.3s ease-out forwards',
        }}
      >
        <SystemUpdateIcon sx={{ fontSize: 22 }} />
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
          }}
        >
          Update available — tap to refresh
        </Typography>
      </Box>
    </Snackbar>
  );
};

export default UpdatePrompt;
