import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from 'aws-amplify/auth';
import { useAuth } from '../contexts/AuthContext';
import TopBar from '../components/ui/TopBar';
import IconButton from '../components/ui/IconButton';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import Reveal from '../components/ui/Reveal';
import Icon from '../components/Icon';

// One requirement. Rendered only once the user starts typing a new password —
// five always-visible rows outweighed the three fields they were guarding.
const Requirement = ({ met, label }) => (
  <li className={`flex items-center gap-2 text-[12.5px] ${met ? 'text-sage' : 'text-chalk-dim'}`}>
    <Icon name={met ? 'check' : 'dots'} className="w-3.5 h-3.5 flex-none" />
    {label}
  </li>
);

const AccountPage = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [shown, setShown] = useState({ old: false, next: false, confirm: false });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const checks = [
    ['At least 8 characters', newPassword.length >= 8],
    ['An uppercase letter', /[A-Z]/.test(newPassword)],
    ['A lowercase letter', /[a-z]/.test(newPassword)],
    ['A number', /[0-9]/.test(newPassword)],
    ['A special character', /[^a-zA-Z0-9]/.test(newPassword)],
  ];
  const isPasswordValid = checks.every(([, met]) => met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = oldPassword && isPasswordValid && passwordsMatch && !saving;

  // A real <form>, so Enter submits — there was no form element at all before.
  const handleChangePassword = async (e) => {
    e?.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSaving(true);
    try {
      await updatePassword({ oldPassword, newPassword });
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || "Couldn't change your password.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex flex-col">
      <TopBar
        title="Account"
        left={<IconButton name="back" label="Back to settings" onClick={() => navigate('/settings')} className="ml-0" />}
      />

      <div className="px-5 pb-6">
        <form onSubmit={handleChangePassword}>
          <h2 className="font-hand font-bold text-[26px] leading-none mb-4">Change password</h2>

          {error && <div className="text-red text-sm mb-3">{error}</div>}
          {success && <div className="text-sage text-sm mb-3">Password changed.</div>}

          <Field
            label="Current password" type={shown.old ? 'text' : 'password'} value={oldPassword}
            autoComplete="current-password" onChange={(e) => setOldPassword(e.target.value)}
            rightSlot={<Reveal shown={shown.old} onToggle={() => setShown((s) => ({ ...s, old: !s.old }))} />}
          />

          <Field
            label="New password" type={shown.next ? 'text' : 'password'} value={newPassword}
            autoComplete="new-password" onChange={(e) => setNewPassword(e.target.value)}
            rightSlot={<Reveal shown={shown.next} onToggle={() => setShown((s) => ({ ...s, next: !s.next }))} />}
          />

          {newPassword.length > 0 && (
            <ul className="list-none m-0 mb-4 -mt-1 grid gap-1.5">
              {checks.map(([label, met]) => <Requirement key={label} met={met} label={label} />)}
            </ul>
          )}

          <Field
            label="Confirm new password" type={shown.confirm ? 'text' : 'password'} value={confirmPassword}
            autoComplete="new-password" onChange={(e) => setConfirmPassword(e.target.value)}
            help={confirmPassword.length > 0 && !passwordsMatch ? "Those don't match." : undefined}
            helpTone="bad"
            rightSlot={<Reveal shown={shown.confirm} onToggle={() => setShown((s) => ({ ...s, confirm: !s.confirm }))} />}
          />

          <Button type="submit" variant="primary" disabled={!canSubmit}>
            {saving ? 'Changing…' : 'Change password'}
          </Button>
        </form>

        <div className="mt-8 pt-5 border-t border-dashed border-chalk-faint">
          <Button variant="ghost" onClick={handleSignOut}>
            <Icon name="logout" className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
