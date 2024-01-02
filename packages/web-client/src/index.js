import { createRoot } from 'react-dom/client';

import registerServiceWorker from './serviceWorkerRegistration';
import App from './App';

const root = createRoot(document.getElementById('root'));
root.render(<App />);

registerServiceWorker();
