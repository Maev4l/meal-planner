// Edited by Claude.
// Warm Bistro themed login page with elegant animations
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider,
  alpha,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { useAuth } from '../contexts/AuthContext';

// Google logo SVG component
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { signIn, signInWithGoogle, oauthMessage, clearOauthMessage, error: authError } = useAuth();

  const displayError = error || authError;

  // Show OAuth message if present (account linked or error)
  useEffect(() => {
    if (oauthMessage) {
      if (oauthMessage.type === 'success') {
        setSuccessMessage(oauthMessage.text);
        setError(null);
      } else {
        setError(oauthMessage.text);
        setSuccessMessage(null);
      }
      clearOauthMessage();
    }
  }, [oauthMessage, clearOauthMessage]);

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Google sign in failed');
    }
  };

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
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.burgundy.main} 0%, ${theme.palette.burgundy.dark} 100%)`,
              boxShadow: (theme) =>
                `0 8px 32px ${alpha(theme.palette.burgundy.main, 0.35)}`,
              mb: 2,
              animation: 'scaleIn 0.5s ease-out forwards',
              animationDelay: '0.2s',
              opacity: 0,
            }}
          >
            <RestaurantIcon sx={{ fontSize: 32, color: '#FFF8F0' }} />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontWeight: 600,
              color: 'text.primary',
              letterSpacing: '-0.02em',
              mb: 0.5,
              animation: 'fadeIn 0.5s ease-out forwards',
              animationDelay: '0.3s',
              opacity: 0,
            }}
          >
            Meal Planner
          </Typography>
          <Typography
            variant="body2"
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
            borderRadius: 3,
            p: 3,
            boxShadow: (theme) =>
              `0 20px 60px ${alpha(theme.palette.charcoal.main, 0.1)}`,
            border: (theme) =>
              `1px solid ${alpha(theme.palette.charcoal.main, 0.06)}`,
            animation: 'fadeInUp 0.6s ease-out forwards',
            animationDelay: '0.2s',
            opacity: 0,
          }}
        >
          {successMessage && (
            <Alert
              severity="success"
              sx={{
                mb: 2,
                animation: 'scaleIn 0.3s ease-out forwards',
              }}
            >
              {successMessage}
            </Alert>
          )}
          {displayError && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                animation: 'scaleIn 0.3s ease-out forwards',
              }}
            >
              {displayError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              autoCapitalize="none"
              autoFocus
              disabled={isSubmitting}
              sx={{ mb: 1 }}
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
                mt: 2,
                py: 1.25,
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

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Or continue with
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            startIcon={<GoogleIcon />}
            sx={{
              py: 1,
              borderColor: (theme) => alpha(theme.palette.charcoal.main, 0.2),
              '&:hover': {
                borderColor: (theme) => alpha(theme.palette.charcoal.main, 0.4),
                backgroundColor: (theme) => alpha(theme.palette.charcoal.main, 0.04),
              },
            }}
          >
            Google
          </Button>
        </Box>

        {/* Link to sign up */}
        <Typography
          variant="body2"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 2,
            color: 'text.secondary',
            animation: 'fadeIn 0.5s ease-out forwards',
            animationDelay: '0.6s',
          }}
        >
          Don&apos;t have an account?{' '}
          <Typography
            component={Link}
            to="/signup"
            variant="body2"
            sx={{
              color: 'primary.main',
              textDecoration: 'none',
              fontWeight: 500,
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Create account
          </Typography>
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;
