import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { SchedulesProvider } from './contexts/SchedulesContext';
import { PWAProvider } from './contexts/PWAContext';
import { ToastProvider } from './components/ui/Toast';
import { ChalkSprite } from './components/Icon';
import BottomNav from './components/ui/BottomNav';
import GroupsPage from './pages/GroupsPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import SettingsPage from './pages/SettingsPage';
import AccountPage from './pages/AccountPage';
import AboutPage from './pages/AboutPage';
import GroupSchedulePage from './pages/GroupSchedulePage';
import DefaultSchedulePage from './pages/DefaultSchedulePage';
import GroupSettingsPage from './pages/GroupSettingsPage';
import InvitePage from './pages/InvitePage';
import UpdatePrompt from './components/UpdatePrompt';
import SplashScreen from './components/SplashScreen';
import PendingInviteHandler from './components/PendingInviteHandler';
import PendingApprovalPage from './pages/PendingApprovalPage';

const MIN_SPLASH_DURATION = 2000;

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isApproved, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Authenticated but not yet approved (e.g. fresh Google signup): show the
  // pending screen instead of an approval-gated page that would 403.
  if (!isApproved) return <PendingApprovalPage />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

const App = () => {
  const { isAuthenticated, isApproved, isLoading } = useAuth();
  const [minElapsed, setMinElapsed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_SPLASH_DURATION);
    return () => clearTimeout(t);
  }, []);

  if (isLoading || !minElapsed) return <SplashScreen />;

  return (
    <PWAProvider>
      <ToastProvider>
      <ChalkSprite />
      <div className="mx-auto w-full max-w-md min-h-dvh pb-[90px]">
        <SchedulesProvider>
          <PendingInviteHandler />
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
            <Route path="/groups/:groupId/:groupName" element={<ProtectedRoute><GroupSchedulePage /></ProtectedRoute>} />
            <Route path="/groups/:groupId/:groupName/default" element={<ProtectedRoute><DefaultSchedulePage /></ProtectedRoute>} />
            <Route path="/groups/:groupId/settings" element={<ProtectedRoute><GroupSettingsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/settings/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
            <Route path="/settings/about" element={<ProtectedRoute><AboutPage /></ProtectedRoute>} />
            <Route path="/invite/:code" element={<InvitePage />} />
          </Routes>
        </SchedulesProvider>
      </div>
      {!isLoading && isAuthenticated && isApproved && <BottomNav />}
      <UpdatePrompt />
      </ToastProvider>
    </PWAProvider>
  );
};

export default App;
