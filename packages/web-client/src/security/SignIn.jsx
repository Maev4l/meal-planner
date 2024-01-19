import {
  Container,
  Button,
  TextField,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './helpers';

// see: https://frontendshape.com/post/react-mui-5-login-page-example
const SignIn = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(null);

  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    try {
      await signIn(credentials);
      navigate('/');
    } catch (e) {
      setAuthError(e.message);
    }
  };

  const onShowPassword = () => setShowPassword((show) => !show);

  const onChange = (field, e) => {
    const val = { ...credentials };
    val[field] = e.target.value;
    setCredentials(val);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          boxShadow: 3,
          borderRadius: 2,
          px: 4,
          py: 6,
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          MEAL PLANNER
        </Typography>
        <Box component="form" noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Username"
            autoFocus
            autoCapitalize="none"
            onChange={(e) => onChange('username', e)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            autoCapitalize="none"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            onChange={(e) => onChange('password', e)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={onShowPassword}
                    onMouseDown={(e) => e.preventDefault()}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button onClick={handleSignIn} fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Sign In
          </Button>
          {authError && <Alert severity="error">{authError}</Alert>}
          {/* 
          <Grid container>
            <Grid item xs>
              <Link href="#" variant="body2">
                Forgot password?
              </Link>
            </Grid>
            <Grid item>
              <Link href="#" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
    */}
        </Box>
      </Box>
    </Container>
  );
};

export default SignIn;
