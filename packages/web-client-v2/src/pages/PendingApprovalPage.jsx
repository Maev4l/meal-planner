import { useState } from 'react';
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

  const handleCheck = async () => {
    setChecking(true);
    try {
      await refreshSession();
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center text-center px-8">
      <div className="w-[84px] h-[84px] rounded-full border-2 border-mustard grid place-items-center mb-6 text-mustard">
        <Icon name="clock" className="w-[46%] h-[46%]" />
      </div>
      <h1 className="font-hand font-bold text-[52px] leading-none m-0">Pending<br />approval</h1>
      <p className="text-chalk-dim text-sm leading-relaxed max-w-[260px] my-3 mb-7">
        Your account is awaiting an administrator's approval. You'll get access as soon as it's granted.
      </p>
      <div className="w-full max-w-[240px] flex flex-col gap-3">
        <Button onClick={handleCheck} disabled={checking}>
          {checking ? 'Checking…' : 'Check again'}
        </Button>
        <Button variant="ghost" onClick={signOut}>Sign out</Button>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
