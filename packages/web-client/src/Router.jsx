import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { Landing } from './landing';
import { SignIn, ProtectedRoute } from './security';
import { Planning } from './planning';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Landing />}>
      <Route element={<ProtectedRoute />}>
        <Route path="planning" element={<Planning />} />
      </Route>
      <Route path="sign-in" element={<SignIn />} />
      <Route path="*" element={<p>Ooops !!</p>} />
    </Route>,
  ),
);

// export default Router;
export default router;
