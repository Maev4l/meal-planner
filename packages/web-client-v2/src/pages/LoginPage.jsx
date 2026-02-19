// Edited by Claude.
// Warm Bistro themed login page with elegant animations
import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  alpha,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { signIn, error: authError } = useAuth();

  const displayError = error || authError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signIn(username, password);
    } catch (err) {
      const message = err.message || err.name || String(err) || 'Failed to sign in';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        mx: -2,
        px: 2,
      }}
    >
      {/* Decorative background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '50%',
          height: '60%',
          background: (theme) =>
            `radial-gradient(circle, ${alpha(theme.palette.burgundy.main, 0.08)} 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-15%',
          left: '-10%',
          width: '60%',
          height: '50%',
          background: (theme) =>
            `radial-gradient(circle, ${alpha(theme.palette.amber.main, 0.1)} 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      <Box
        sx={{
          width: '100%',
          maxWidth: 420,
          position: 'relative',
          zIndex: 1,
          animation: 'fadeInUp 0.6s ease-out forwards',
        }}
      >
        {/* Logo and brand */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 4,
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
              mb: 3,
              animation: 'scaleIn 0.5s ease-out forwards',
              animationDelay: '0.2s',
              opacity: 0,
            }}
          >
            <RestaurantIcon sx={{ fontSize: 40, color: '#FFF8F0' }} />
          </Box>

          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 600,
              color: 'text.primary',
              letterSpacing: '-0.02em',
              mb: 1,
              animation: 'fadeIn 0.5s ease-out forwards',
              animationDelay: '0.3s',
              opacity: 0,
            }}
          >
            Meal Planner
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              animation: 'fadeIn 0.5s ease-out forwards',
              animationDelay: '0.4s',
              opacity: 0,
            }}
          >
            Sign in to plan your meals together
          </Typography>
        </Box>

        {/* Login card */}
        <Box
          sx={{
            backgroundColor: 'background.paper',
            borderRadius: 4,
            p: 4,
            boxShadow: (theme) =>
              `0 20px 60px ${alpha(theme.palette.charcoal.main, 0.1)}`,
            border: (theme) =>
              `1px solid ${alpha(theme.palette.charcoal.main, 0.06)}`,
            animation: 'fadeInUp 0.6s ease-out forwards',
            animationDelay: '0.2s',
            opacity: 0,
          }}
        >
          {displayError && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                animation: 'scaleIn 0.3s ease-out forwards',
              }}
            >
              {displayError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              autoComplete="username"
              autoCapitalize="none"
              autoFocus
              disabled={isSubmitting}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
              autoCapitalize="none"
              disabled={isSubmitting}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                mt: 4,
                py: 1.75,
                fontSize: '1rem',
              }}
              disabled={isSubmitting || !username || !password}
            >
              {isSubmitting ? (
                <CircularProgress size={24} sx={{ color: 'inherit' }} />
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>
        </Box>

        {/* Decorative footer */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 4,
            color: 'text.secondary',
            opacity: 0.6,
            animation: 'fadeIn 0.5s ease-out forwards',
            animationDelay: '0.6s',
          }}
        >
          Plan together, dine together
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;
