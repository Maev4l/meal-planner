import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPendingInvite } from '../services/pendingInvite';

// When an authenticated session resolves (login OR a silent token refresh after
// admin approval) and a pending invite code is stored, route the user to the
// invite page so the redeem completes. Runs for ANY authenticated session, not
// just an explicit login submit. InvitePage clears the code on success.
const PendingInviteHandler = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (location.pathname.startsWith('/invite/')) return; // already there
    const code = getPendingInvite();
    if (code) navigate(`/invite/${code}`, { replace: true });
  }, [isLoading, isAuthenticated, location.pathname, navigate]);

  return null;
};

export default PendingInviteHandler;
