// Edited by Claude.
// Warm Bistro themed app with elegant bottom navigation
import { useState, useEffect } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  Container,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  alpha,
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from './contexts/AuthContext';
import { SchedulesProvider } from './contexts/SchedulesContext';
import GroupsPage from './pages/GroupsPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import AccountPage from './pages/AccountPage';
import AboutPage from './pages/AboutPage';
import GroupSchedulePage from './pages/GroupSchedulePage';
import DefaultSchedulePage from './pages/DefaultSchedulePage';
import CommentsPage from './pages/CommentsPage';
import UpdatePrompt from './components/UpdatePrompt';
import SplashScreen from './components/SplashScreen';

// Minimum splash screen duration in milliseconds
const MIN_SPLASH_DURATION = 2000;

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Splash screen handles loading state at app level
  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Splash screen handles loading state at app level
  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathToValue = {
    '/': 0,
    '/settings': 1,
  };

  const valueToPath = ['/', '/settings'];

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: 0,
        borderTop: (theme) =>
          `1px solid ${alpha(theme.palette.charcoal.main, 0.08)}`,
      }}
      elevation={0}
    >
      <BottomNavigation
        value={pathToValue[location.pathname] ?? 0}
        onChange={(_, newValue) => navigate(valueToPath[newValue])}
        showLabels
        sx={{
          height: 68,
          '& .MuiBottomNavigationAction-root': {
            py: 1,
            minWidth: 80,
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              fontWeight: 500,
              mt: 0.5,
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                fontSize: '0.7rem',
                fontWeight: 600,
              },
            },
          },
        }}
      >
        <BottomNavigationAction
          label="Groups"
          icon={<RestaurantIcon sx={{ fontSize: 24 }} />}
        />
        <BottomNavigationAction
          label="Settings"
          icon={<SettingsIcon sx={{ fontSize: 24 }} />}
        />
      </BottomNavigation>
    </Paper>
  );
};

const App = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Ensure splash screen shows for at least MIN_SPLASH_DURATION
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, MIN_SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, []);

  // Show splash screen until both auth check completes AND minimum time elapsed
  const showSplash = isLoading || !minTimeElapsed;

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <>
      <Container maxWidth="lg" sx={{ pb: 10 }}>
        <SchedulesProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <GroupsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:groupId/:groupName"
              element={
                <ProtectedRoute>
                  <GroupSchedulePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:groupId/:groupName/default"
              element={
                <ProtectedRoute>
                  <DefaultSchedulePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:groupId/:groupName/day/:day"
              element={
                <ProtectedRoute>
                  <CommentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/account"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/about"
              element={
                <ProtectedRoute>
                  <AboutPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </SchedulesProvider>
      </Container>
      {!isLoading && isAuthenticated && <BottomNav />}
      <UpdatePrompt />
    </>
  );
};

export default App;
