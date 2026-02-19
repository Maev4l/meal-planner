// Edited by Claude.
// Warm Bistro themed about page with elegant info cards
import { Box, Typography, AppBar, Toolbar, IconButton, alpha } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CodeIcon from '@mui/icons-material/Code';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useNavigate } from 'react-router-dom';

const InfoItem = ({ icon: Icon, label, value, delay }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      p: 2,
      borderRadius: 3,
      backgroundColor: 'background.paper',
      mb: 1.5,
      border: (theme) => `1px solid ${alpha(theme.palette.charcoal.main, 0.06)}`,
      animation: 'fadeInUp 0.4s ease-out forwards',
      animationDelay: `${delay}s`,
      opacity: 0,
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: 2.5,
        backgroundColor: (theme) => alpha(theme.palette.burgundy.main, 0.08),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon sx={{ fontSize: 20, color: 'primary.main' }} />
    </Box>
    <Box sx={{ flex: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
        {label}
      </Typography>
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 500,
          color: 'text.primary',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
        }}
      >
        {value}
      </Typography>
    </Box>
  </Box>
);

const AboutPage = () => {
  const navigate = useNavigate();

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
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/settings')}
            sx={{
              '&:hover': {
                backgroundColor: (theme) =>
                  alpha(theme.palette.common.white, 0.1),
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="h1"
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 600,
            }}
          >
            About
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 3,
          backgroundColor: 'background.default',
        }}
      >
        {/* App branding */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 4,
            animation: 'fadeInUp 0.5s ease-out forwards',
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.burgundy.main} 0%, ${theme.palette.burgundy.dark} 100%)`,
              boxShadow: (theme) =>
                `0 8px 32px ${alpha(theme.palette.burgundy.main, 0.35)}`,
              mb: 2,
            }}
          >
            <RestaurantIcon sx={{ fontSize: 40, color: '#FFF8F0' }} />
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 600,
              color: 'text.primary',
              mb: 0.5,
            }}
          >
            Meal Planner
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Plan together, dine together
          </Typography>
        </Box>

        {/* Version info */}
        <InfoItem icon={CodeIcon} label="Version" value={__APP_VERSION__} delay={0.1} />
        <InfoItem icon={GitHubIcon} label="Build" value={__GIT_COMMIT_HASH__} delay={0.15} />

        {/* Footer */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 4,
            color: 'text.disabled',
            animation: 'fadeIn 0.5s ease-out forwards',
            animationDelay: '0.3s',
          }}
        >
          Made with care for shared meals
        </Typography>
      </Box>
    </Box>
  );
};

export default AboutPage;
