import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Container, Box, CircularProgress, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
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

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
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
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
      <BottomNavigation
        value={pathToValue[location.pathname] ?? 0}
        onChange={(_, newValue) => navigate(valueToPath[newValue])}
        showLabels
      >
        <BottomNavigationAction label="Home" icon={<HomeIcon />} />
        <BottomNavigationAction label="Settings" icon={<SettingsIcon />} />
      </BottomNavigation>
    </Paper>
  );
};

const App = () => {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <Container maxWidth="lg" sx={{ pb: 8 }}>
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
    </>
  );
};

export default App;
