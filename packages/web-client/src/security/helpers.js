import {
  signIn as cognitoSignIn,
  signOut as cognitoSignOut,
  fetchAuthSession,
} from 'aws-amplify/auth';
import { useState, createContext, useContext, useMemo, useEffect } from 'react';
import log from 'loglevel';

import { Progress } from '../components';

// see: https://www.robinwieruch.de/react-router-authentication/
const AuthContext = createContext(null);

export const fetchToken = async () => {
  const { tokens } = await fetchAuthSession();
  if (tokens) {
    const { idToken } = tokens;
    return idToken;
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [fetching, setFetching] = useState(true);

  const readToken = async () => {
    try {
      const idToken = await fetchToken();

      setToken(idToken);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    readToken();
  }, []);

  const signIn = async ({ username, password }) => {
    try {
      await cognitoSignIn({ username, password });
    } catch (e) {
      if (e.name !== 'UserAlreadyAuthenticatedException') {
        log.error(`Sign in error: ${e.name} - ${e.message}`);
        throw e;
      }
    }
    const {
      tokens: { idToken },
    } = await fetchAuthSession();
    setToken(idToken);
  };

  const signOut = async () => {
    try {
      await cognitoSignOut();
    } catch (e) {
      log.error(`Sign out error: ${e.message}`);
      throw e;
    }
  };

  const value = useMemo(
    () => ({
      token,
      signIn,
      signOut,
    }),
    [token],
  );

  return (
    <div>
      <Progress open={fetching} />
      {fetching ? null : <AuthContext.Provider value={value}>{children}</AuthContext.Provider>}
    </div>
  );
};

export const useAuth = () => useContext(AuthContext);
