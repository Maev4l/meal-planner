import {
  Typography,
  Stack,
  InputAdornment,
  TextField,
  IconButton,
  Button,
  Icon,
  Box,
} from '@mui/material';
import { Visibility, VisibilityOff, Check, Close } from '@mui/icons-material';
import { useState } from 'react';

import { useAuth } from '../security';
import { useNotification } from '../components';

const COMPLEXITY_CHECK_STATE = {
  UNDEFINED: 1,
  VALID: 2,
  INVALID: 3,
};

const checkPasswordComplexity = (password) => {
  const containsUppercase = (ch) => /[A-Z]/.test(ch);
  const containsLowercase = (ch) => /[a-z]/.test(ch);
  // const containsSpecialChar = (ch) => /[`!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?~ ]/.test(ch);
  const containsSpecialChar = (ch) => /[`!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?~ ]/.test(ch);
  let countOfUpperCase = 0;
  let countOfLowerCase = 0;
  let countOfNumbers = 0;
  let countOfSpecialChar = 0;

  for (let i = 0; i < password.length; i += 1) {
    const ch = password.charAt(i);
    if (!Number.isNaN(+ch)) {
      countOfNumbers += 1;
    } else if (containsUppercase(ch)) {
      countOfUpperCase += 1;
    } else if (containsLowercase(ch)) {
      countOfLowerCase += 1;
    } else if (containsSpecialChar(ch)) {
      countOfSpecialChar += 1;
    }
  }

  return {
    minimumLength:
      password.length > 8 ? COMPLEXITY_CHECK_STATE.VALID : COMPLEXITY_CHECK_STATE.INVALID,
    numbers: countOfNumbers > 0 ? COMPLEXITY_CHECK_STATE.VALID : COMPLEXITY_CHECK_STATE.INVALID,
    upperCases:
      countOfUpperCase > 0 ? COMPLEXITY_CHECK_STATE.VALID : COMPLEXITY_CHECK_STATE.INVALID,
    lowerCases:
      countOfLowerCase > 0 ? COMPLEXITY_CHECK_STATE.VALID : COMPLEXITY_CHECK_STATE.INVALID,
    symbols: countOfSpecialChar > 0 ? COMPLEXITY_CHECK_STATE.VALID : COMPLEXITY_CHECK_STATE.INVALID,
  };
};

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [enableSubmit, setEnableSubmit] = useState(false);
  const [complexityCheck, setComplexityCheck] = useState({
    minimumLength: COMPLEXITY_CHECK_STATE.UNDEFINED,
    numbers: COMPLEXITY_CHECK_STATE.UNDEFINED,
    lowerCases: COMPLEXITY_CHECK_STATE.UNDEFINED,
    symbols: COMPLEXITY_CHECK_STATE.UNDEFINED,
    upperCases: COMPLEXITY_CHECK_STATE.UNDEFINED,
  });

  const { changePassword } = useAuth();
  const notification = useNotification();

  const isSubmitEnabled = (check, p, c) => {
    const { minimumLength, numbers, lowerCases, symbols, upperCases } = check;
    const res =
      minimumLength === COMPLEXITY_CHECK_STATE.VALID &&
      numbers === COMPLEXITY_CHECK_STATE.VALID &&
      lowerCases === COMPLEXITY_CHECK_STATE.VALID &&
      symbols === COMPLEXITY_CHECK_STATE.VALID &&
      upperCases === COMPLEXITY_CHECK_STATE.VALID &&
      p === c;
    return res;
  };

  const onChangeOldPassword = (value) => {
    setOldPassword(value);
  };

  const onChangeNewPassword = (value) => {
    setNewPassword(value);
    let check;
    if (!value) {
      check = {
        minimumLength: COMPLEXITY_CHECK_STATE.UNDEFINED,
        numbers: COMPLEXITY_CHECK_STATE.UNDEFINED,
        lowerCases: COMPLEXITY_CHECK_STATE.UNDEFINED,
        symbols: COMPLEXITY_CHECK_STATE.UNDEFINED,
        upperCases: COMPLEXITY_CHECK_STATE.UNDEFINED,
      };
    } else {
      check = checkPasswordComplexity(value);
    }
    setComplexityCheck(check);
    setEnableSubmit(isSubmitEnabled(check, value, confirm));
  };

  const onChangeConfirm = (value) => {
    setConfirm(value);
    setEnableSubmit(isSubmitEnabled(complexityCheck, newPassword, value));
  };

  const onShowNewPassword = () => {
    setShowNewPassword(!showNewPassword);
  };

  const onShowConfirm = () => {
    setShowConfirm(!showConfirm);
  };

  const onShowOldPassword = () => {
    setShowOldPassword(!showOldPassword);
  };

  const onSubmit = async () => {
    try {
      await changePassword(oldPassword, newPassword);
      notification.success('Password changed.');
    } catch (e) {
      notification.error(e.message);
    }
  };

  const renderComplexityIcon = (state) => {
    if (state === COMPLEXITY_CHECK_STATE.UNDEFINED) {
      return <Icon fontSize="small" />; // Empty icon
    }
    if (state === COMPLEXITY_CHECK_STATE.VALID) {
      return <Check fontSize="small" color="success" />;
    }
    return <Close fontSize="small" color="error" />;
  };

  return (
    <Stack>
      <Typography sx={{ fontWeight: 'bold' }}>Change password</Typography>
      <TextField
        margin="normal"
        required
        fullWidth
        label="Old password"
        autoCapitalize="none"
        type={showOldPassword ? 'text' : 'password'}
        autoComplete="current-password"
        onChange={(e) => onChangeOldPassword(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => onShowOldPassword()}
                onMouseDown={(e) => e.preventDefault()}
                edge="end"
              >
                {showNewPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        label="New password"
        autoCapitalize="none"
        type={showNewPassword ? 'text' : 'password'}
        autoComplete="current-password"
        onChange={(e) => onChangeNewPassword(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => onShowNewPassword()}
                onMouseDown={(e) => e.preventDefault()}
                edge="end"
              >
                {showNewPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Stack sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <Box>
          <Stack direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
            {renderComplexityIcon(complexityCheck.minimumLength)}
            <Typography variant="caption">Minimum 8 characters</Typography>
          </Stack>
          <Stack direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
            {renderComplexityIcon(complexityCheck.upperCases)}
            <Typography variant="caption">Contains uppercase characters</Typography>
          </Stack>
          <Stack direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
            {renderComplexityIcon(complexityCheck.lowerCases)}
            <Typography variant="caption">Contains lower characters</Typography>
          </Stack>
          <Stack direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
            {renderComplexityIcon(complexityCheck.symbols)}
            <Typography variant="caption">Contains specials characters</Typography>
          </Stack>
          <Stack direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
            {renderComplexityIcon(complexityCheck.numbers)}
            <Typography variant="caption">Contains numbers</Typography>
          </Stack>
        </Box>
      </Stack>
      <TextField
        margin="normal"
        required
        fullWidth
        label="Confirm password"
        autoCapitalize="none"
        type={showConfirm ? 'text' : 'password'}
        autoComplete="current-password"
        onChange={(e) => onChangeConfirm(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => onShowConfirm()}
                onMouseDown={(e) => e.preventDefault()}
                edge="end"
              >
                {showConfirm ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Button disabled={!enableSubmit} onClick={onSubmit}>
        Submit new password
      </Button>
    </Stack>
  );
};

export default ChangePassword;
