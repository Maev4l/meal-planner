import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { signIn as cognitoSignIn, signOut as cognitoSignOut, fetchAuthSession } from 'aws-amplify/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getToken = useCallback(async () => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
    } catch {
      return null;
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const session = await fetchAuthSession();
      if (session.tokens?.idToken) {
        const payload = session.tokens.idToken.payload;
        // Convert UUID from lowercase with dashes to uppercase without dashes
        const memberId = payload.sub.replace(/-/g, '').toUpperCase();
        setUser({
          authenticated: true,
          memberId,
          name: payload.name || payload['cognito:username'],
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const signIn = useCallback(async (username, password) => {
    setError(null);
    setIsLoading(true);
    try {
      await cognitoSignIn({ username, password });
      await checkAuth();
    } catch (err) {
      // If user is already authenticated, just check auth state
      if (err?.name === 'UserAlreadyAuthenticatedException' || err?.message?.includes('already')) {
        await checkAuth();
        return;
      }
      const message = err?.message || err?.name || 'Sign in failed';
      setError(message);
      setIsLoading(false);
      const error = new Error(message);
      error.cause = err;
      throw error;
    }
  }, [checkAuth]);

  const signOut = useCallback(async () => {
    try {
      await cognitoSignOut();
      setUser(null);
    } catch (err) {
      setError(err.message || 'Sign out failed');
    }
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    signIn,
    signOut,
    getToken,
  }), [user, isLoading, error, signIn, signOut, getToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
