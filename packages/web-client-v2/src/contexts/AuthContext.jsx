/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { signIn as cognitoSignIn, signOut as cognitoSignOut, signUp as cognitoSignUp, signInWithRedirect, fetchAuthSession } from 'aws-amplify/auth';

const AuthContext = createContext(null);

// Check URL for OAuth errors (returned after redirect)
const checkOAuthError = () => {
  const params = new URLSearchParams(window.location.search);
  const errorDesc = params.get('error_description');

  if (errorDesc) {
    // Clean up URL
    window.history.replaceState({}, '', window.location.pathname);

    // Check if this is the "linked to existing account" message (success case)
    if (errorDesc.toLowerCase().includes('linked')) {
      return { type: 'linked' };
    }

    // Check for "user already exists" (native signup when federated exists)
    if (errorDesc.toLowerCase().includes('user already exists')) {
      return { type: 'error', message: 'An account with this email already exists.' };
    }

    // Other errors
    return { type: 'error', message: errorDesc };
  }
  return null;
};

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
  const [oauthMessage, setOauthMessage] = useState(null); // { type: 'success' | 'error', text: string }

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
        // Use custom:Id directly (already in correct format)
        const memberId = payload['custom:Id'];
        setUser({
          authenticated: true,
          memberId,
          name: payload.name || payload['cognito:username'],
          email: payload.email || null,
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
    // Check for OAuth callback errors (e.g., account linking)
    const oauthResult = checkOAuthError();
    if (oauthResult?.type === 'linked') {
      setOauthMessage({
        type: 'success',
        text: 'Your Google account has been linked. Please sign in again.',
      });
    } else if (oauthResult?.type === 'error') {
      setOauthMessage({
        type: 'error',
        text: oauthResult.message,
      });
    }
    checkAuth();
  }, [checkAuth]);

  // Clear the OAuth message
  const clearOauthMessage = useCallback(() => {
    setOauthMessage(null);
  }, []);

  // Sign in with Google OAuth
  const signInWithGoogle = useCallback(async () => {
    await signInWithRedirect({ provider: 'Google' });
  }, []);

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

  // Sign up new user - returns without setting user state (pending admin approval)
  const signUp = useCallback(async (email, password, name) => {
    await cognitoSignUp({
      username: email,
      password,
      options: {
        userAttributes: {
          name,
        },
      },
    });
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    oauthMessage,
    clearOauthMessage,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    getToken,
  }), [user, isLoading, error, oauthMessage, clearOauthMessage, signIn, signInWithGoogle, signUp, signOut, getToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
