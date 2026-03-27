// Edited by Claude.
// Warm Bistro themed account page with elegant form design
import { useState } from 'react';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  TextField,
  Button,
  Alert,
  Snackbar,
  InputAdornment,
  alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from 'aws-amplify/auth';
import { useAuth } from '../contexts/AuthContext';

const AccountPage = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password complexity validation
  const passwordChecks = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch =
    newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = oldPassword && isPasswordValid && passwordsMatch && !saving;

  const handleChangePassword = async () => {
    setError(null);
    setSaving(true);

    try {
      await updatePassword({ oldPassword, newPassword });
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const CheckItem = ({ checked, label }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 0.75,
      }}
    >
      <Box
        sx={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: (theme) =>
            checked
              ? alpha(theme.palette.sage.main, 0.15)
              : alpha(theme.palette.charcoal.main, 0.06),
          border: (theme) =>
            `1.5px solid ${checked ? theme.palette.sage.main : alpha(theme.palette.charcoal.main, 0.2)}`,
        }}
      >
        {checked ? (
          <CheckIcon sx={{ fontSize: 12, color: 'success.main' }} />
        ) : (
          <CloseIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
        )}
      </Box>
      <Typography
        variant="body2"
        sx={{
          color: checked ? 'success.main' : 'text.secondary',
          fontWeight: checked ? 500 : 400,
          fontSize: '0.8rem',
        }}
      >
        {label}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'var(--vh-with-nav)',
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
            Account
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
        {/* Change Password Section */}
        <Box
          sx={{
            backgroundColor: 'background.paper',
            borderRadius: 3,
            p: 3,
            mb: 3,
            border: (theme) =>
              `1px solid ${alpha(theme.palette.charcoal.main, 0.06)}`,
            animation: 'fadeInUp 0.4s ease-out forwards',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                backgroundColor: (theme) =>
                  alpha(theme.palette.burgundy.main, 0.08),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LockIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 600,
              }}
            >
              Change Password
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                animation: 'scaleIn 0.3s ease-out forwards',
              }}
            >
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            type={showOldPassword ? 'text' : 'password'}
            label="Current Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      edge="end"
                      size="small"
                      sx={{ color: 'text.secondary' }}
                    >
                      {showOldPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            fullWidth
            type={showNewPassword ? 'text' : 'password'}
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                      size="small"
                      sx={{ color: 'text.secondary' }}
                    >
                      {showNewPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {/* Password requirements */}
          <Box
            sx={{
              mb: 2.5,
              p: 2,
              borderRadius: 2,
              backgroundColor: (theme) =>
                alpha(theme.palette.charcoal.main, 0.03),
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: 'text.secondary',
                mb: 1.5,
                fontSize: '0.75rem',
              }}
            >
              PASSWORD REQUIREMENTS
            </Typography>
            <CheckItem
              checked={passwordChecks.minLength}
              label="At least 8 characters"
            />
            <CheckItem
              checked={passwordChecks.hasUppercase}
              label="At least 1 uppercase letter"
            />
            <CheckItem
              checked={passwordChecks.hasLowercase}
              label="At least 1 lowercase letter"
            />
            <CheckItem
              checked={passwordChecks.hasNumber}
              label="At least 1 number"
            />
            <CheckItem
              checked={passwordChecks.hasSpecial}
              label="At least 1 special character"
            />
          </Box>

          <TextField
            fullWidth
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmPassword.length > 0 && !passwordsMatch}
            helperText={
              confirmPassword.length > 0 && !passwordsMatch
                ? 'Passwords do not match'
                : ''
            }
            sx={{ mb: 3 }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
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
            variant="contained"
            fullWidth
            size="large"
            onClick={handleChangePassword}
            disabled={!canSubmit}
          >
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </Box>

        {/* Sign Out Section */}
        <Box
          sx={{
            animation: 'fadeInUp 0.4s ease-out forwards',
            animationDelay: '0.1s',
            opacity: 0,
          }}
        >
          <Button
            variant="outlined"
            color="error"
            fullWidth
            size="large"
            startIcon={<LogoutIcon />}
            onClick={handleSignOut}
            sx={{
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              },
            }}
          >
            Sign Out
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={() => setSuccess(false)}
        message="Password changed successfully"
      />
    </Box>
  );
};

export default AccountPage;
