import { createRoot } from 'react-dom/client';
import { Amplify } from 'aws-amplify';

import registerServiceWorker from './serviceWorkerRegistration';
import App from './App';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.userPoolId,
      userPoolClientId: process.env.clientId,
    },
  },
});

const root = createRoot(document.getElementById('root'));
root.render(<App />);

registerServiceWorker();
