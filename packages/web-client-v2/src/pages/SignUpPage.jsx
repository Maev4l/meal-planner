// Warm Bistro themed sign up page with elegant animations
import { useState } from 'react';
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
  alpha,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useAuth } from '../contexts/AuthContext';

// Password validation - returns error message or null if valid
const validatePassword = (pw) => {
  if (pw.length < 8) return 'Must be at least 8 characters';
  if (!/[a-z]/.test(pw)) return 'Must include a lowercase letter';
  if (!/[A-Z]/.test(pw)) return 'Must include an uppercase letter';
  if (!/[0-9]/.test(pw)) return 'Must include a number';
  if (!/[^a-zA-Z0-9]/.test(pw)) return 'Must include a symbol';
  return null;
};

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const passwordError = password.length > 0 ? validatePassword(password) : null;
  const passwordValid = password.length > 0 && !passwordError;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const nameValid = name.length > 0 && name.length <= 20;
  const canSubmit = email && nameValid && passwordValid && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await signUp(email, password, name);
      setSuccess(true);
    } catch (err) {
      if (err.name === 'UsernameExistsException') {
        setError('An account with this email already exists');
      } else if (err.name === 'InvalidParameterException') {
        setError(err.message || 'Invalid input');
      } else {
        setError(err.message || 'Sign up failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state - show pending approval message
  if (success) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'var(--vh-full)',
          position: 'relative',
          overflow: 'hidden',
          mx: -2,
          px: 2,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 420,
            position: 'relative',
            zIndex: 1,
            animation: 'fadeInUp 0.6s ease-out forwards',
          }}
        >
          <Box
            sx={{
              backgroundColor: 'background.paper',
              borderRadius: 4,
              p: 4,
              boxShadow: (theme) =>
                `0 20px 60px ${alpha(theme.palette.charcoal.main, 0.1)}`,
              border: (theme) =>
                `1px solid ${alpha(theme.palette.charcoal.main, 0.06)}`,
              textAlign: 'center',
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
                  `linear-gradient(135deg, ${theme.palette.sage.main} 0%, ${theme.palette.sage.dark} 100%)`,
                mb: 3,
              }}
            >
              <CheckCircleOutlineIcon sx={{ fontSize: 32, color: '#FFF8F0' }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 600,
                color: 'text.primary',
                mb: 1,
              }}
            >
              Account Created
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Your registration is pending approval. An administrator will review your request.
            </Typography>
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              fullWidth
              sx={{ py: 1.5 }}
            >
              Back to Sign In
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'var(--vh-full)',
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
            mb: 3,
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
            }}
          >
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign up to plan your meals together
          </Typography>
        </Box>

        {/* Sign up card */}
        <Box
          sx={{
            backgroundColor: 'background.paper',
            borderRadius: 4,
            p: 4,
            boxShadow: (theme) =>
              `0 20px 60px ${alpha(theme.palette.charcoal.main, 0.1)}`,
            border: (theme) =>
              `1px solid ${alpha(theme.palette.charcoal.main, 0.06)}`,
          }}
        >
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                animation: 'scaleIn 0.3s ease-out forwards',
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              margin="normal"
              required
              autoCapitalize="words"
              disabled={isSubmitting}
              helperText={`${name.length}/20`}
              inputProps={{ maxLength: 20 }}
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
              autoComplete="new-password"
              autoCapitalize="none"
              disabled={isSubmitting}
              error={password.length > 0 && !!passwordError}
              helperText={password.length > 0 ? (passwordError || 'Password meets requirements') : ' '}
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
              sx={{ mb: 1 }}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="new-password"
              autoCapitalize="none"
              disabled={isSubmitting}
              error={confirmPassword.length > 0 && !passwordsMatch}
              helperText={confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match' : ' '}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
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
                mt: 3,
                py: 1.75,
                fontSize: '1rem',
              }}
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting ? (
                <CircularProgress size={24} sx={{ color: 'inherit' }} />
              ) : (
                'Create Account'
              )}
            </Button>
          </Box>
        </Box>

        {/* Link to sign in */}
        <Typography
          variant="body2"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 3,
            color: 'text.secondary',
          }}
        >
          Already have an account?{' '}
          <Typography
            component={Link}
            to="/login"
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
            Sign in
          </Typography>
        </Typography>
      </Box>
    </Box>
  );
};

export default SignUpPage;
