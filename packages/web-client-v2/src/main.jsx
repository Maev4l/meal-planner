import '@fontsource/caveat/400.css';
import '@fontsource/caveat/600.css';
import '@fontsource/caveat/700.css';
import '@fontsource/archivo/400.css';
import '@fontsource/archivo/500.css';
import '@fontsource/archivo/600.css';
import '@fontsource/archivo/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { config } from './config';
import { AuthProvider } from './contexts/AuthContext';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: config.cognito.userPoolId,
      userPoolClientId: config.cognito.userPoolClientId,
      loginWith: {
        oauth: {
          domain: config.oauth.domain,
          scopes: config.oauth.scopes,
          redirectSignIn: [config.oauth.redirectSignIn],
          redirectSignOut: [config.oauth.redirectSignOut],
          responseType: config.oauth.responseType,
        },
      },
    },
  },
});

// ThemeProvider/CssBaseline removed — Tailwind + Ardoise tokens handle styling
const Root = () => (
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
