// Ardoise chalk re-skin of AccountPage.
// Handlers/state preserved verbatim from the original:
//   - updatePassword({ oldPassword, newPassword }) from aws-amplify/auth
//   - passwordChecks object (minLength, hasUppercase, hasLowercase, hasNumber, hasSpecial)
//   - isPasswordValid, passwordsMatch, canSubmit guards
//   - handleChangePassword (sets error, saving, success; clears fields on success)
//   - handleSignOut (calls signOut() then navigate('/login'))
//   - State: oldPassword, newPassword, confirmPassword, error, saving, success
// Note: show/hide password toggle state from original was kept; Field type prop toggles it.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from 'aws-amplify/auth';
import { useAuth } from '../contexts/AuthContext';
import TopBar from '../components/ui/TopBar';
import IconButton from '../components/ui/IconButton';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import Card from '../components/ui/Card';
import Icon from '../components/Icon';

// A single password-requirement row with chalk/sage styling.
const RequirementRow = ({ met, label }) => (
  <div className={`flex items-center gap-2 text-[13px] mb-1.5 ${met ? 'text-sage' : 'text-chalk-dim'}`}>
    <span className="w-4 text-center flex-none">{met ? '✓' : '✕'}</span>
    {label}
  </div>
);

const AccountPage = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // --- original state & logic (unchanged) ---
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Show/hide toggles — kept from original even though Field uses type prop.
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password complexity validation — identical checks from original.
  const passwordChecks = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[^a-zA-Z0-9]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
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

  // Sign out then redirect to login — same flow as original.
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex flex-col">
      <TopBar
        title="Account"
        left={
          <IconButton
            name="back"
            label="Back"
            onClick={() => navigate(-1)}
            className="ml-0"
          />
        }
      />

      <div className="px-5 pb-6">
        {/* Change password card */}
        <Card className="p-[18px] mb-4">
          {/* Card header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-[40px] h-[40px] rounded-[12px] grid place-items-center bg-coral/15 text-coral flex-none">
              <Icon name="lock" className="w-5 h-5" />
            </div>
            <h3 className="font-hand font-bold text-[24px]">Change password</h3>
          </div>

          {/* Error/success feedback */}
          {error && (
            <div className="text-red text-sm mb-3">{error}</div>
          )}
          {success && (
            <div className="text-sage text-sm mb-3">Password changed successfully.</div>
          )}

          {/* Current password */}
          <Field
            label="Current password"
            type={showOldPassword ? 'text' : 'password'}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowOldPassword((v) => !v)}
                className="text-chalk-faint text-[11px] tracking-wide uppercase cursor-pointer pb-1 flex-none"
              >
                {showOldPassword ? 'hide' : 'show'}
              </button>
            }
          />

          {/* New password */}
          <Field
            label="New password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="text-chalk-faint text-[11px] tracking-wide uppercase cursor-pointer pb-1 flex-none"
              >
                {showNewPassword ? 'hide' : 'show'}
              </button>
            }
          />

          {/* Password requirements */}
          <Card dashed className="p-3.5 my-4">
            <RequirementRow met={passwordChecks.minLength} label="At least 8 characters" />
            <RequirementRow met={passwordChecks.hasUppercase} label="An uppercase letter" />
            <RequirementRow met={passwordChecks.hasLowercase} label="A lowercase letter" />
            <RequirementRow met={passwordChecks.hasNumber} label="A number" />
            <RequirementRow met={passwordChecks.hasSpecial} label="A special character" />
          </Card>

          {/* Confirm password */}
          <Field
            label="Confirm new password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            help={confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match' : undefined}
            helpTone="bad"
            rightSlot={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="text-chalk-faint text-[11px] tracking-wide uppercase cursor-pointer pb-1 flex-none"
              >
                {showConfirmPassword ? 'hide' : 'show'}
              </button>
            }
          />

          <Button
            variant="primary"
            onClick={handleChangePassword}
            disabled={!canSubmit}
          >
            {saving ? 'Changing…' : 'Change password'}
          </Button>
        </Card>

        {/* Sign out */}
        <Button variant="danger" onClick={handleSignOut}>
          <Icon name="logout" className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
};

export default AccountPage;
