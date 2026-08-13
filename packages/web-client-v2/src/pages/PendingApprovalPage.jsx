import { useState } from 'react';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';
import Button from '../components/ui/Button';

// Shown for an authenticated-but-unapproved user (e.g. a fresh Google signup
// before an admin clicks Approve). Google OAuth creates a session immediately,
// so without this gate the user would land on approval-gated pages and see a raw
// 403. "Check again" forces a token refresh: once an admin approves (custom:Approved
// flips to "true"), the refreshed claim lets ProtectedRoute render the app.
const PendingApprovalPage = () => {
  const { refreshSession, signOut } = useAuth();
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [failed, setFailed] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    setFailed(false);
    try {
      await refreshSession();
    } catch {
      setFailed(true);
    } finally {
      setChecking(false);
      // Approval landing unmounts this page, so anything rendered after a check
      // is by definition "still pending". Without it the button looked broken:
      // it produced no message, no toast and no change on the likely path.
      setLastChecked(dayjs());
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center text-center px-8">
      <div className="w-[84px] h-[84px] rounded-full border-2 border-mustard grid place-items-center mb-6 text-mustard">
        <Icon name="clock" className="w-[46%] h-[46%]" />
      </div>
      <h1 className="font-hand font-bold text-[52px] leading-none m-0">Pending<br />approval</h1>
      {/* Factually true rather than reassuring noise: signing up raises a Slack
          alert to an administrator from the user-onboarding lambda, so anyone
          seeing this screen has already triggered one. Saying so removes the
          worst part of the wait — not knowing whether anybody knows. */}
      <p className="text-chalk-dim text-sm leading-relaxed max-w-[260px] my-3 mb-7">
        An administrator has already been notified. You&apos;ll get access as soon as they approve your account.
      </p>
      <div className="w-full max-w-[240px] flex flex-col gap-3">
        <Button onClick={handleCheck} disabled={checking}>
          {checking ? 'Checking…' : 'Check again'}
        </Button>
        <Button variant="ghost" onClick={signOut}>Sign out</Button>
      </div>

      {/* Reserve the line so the buttons never jump when it appears. */}
      <div className="mt-4 h-5 text-[12px]" aria-live="polite">
        {failed ? (
          <span className="text-red">Couldn&apos;t check just now — try again in a moment.</span>
        ) : lastChecked ? (
          <span className="text-chalk-dim">Still pending — checked at {lastChecked.format('HH:mm')}</span>
        ) : null}
      </div>
    </div>
  );
};

export default PendingApprovalPage;
