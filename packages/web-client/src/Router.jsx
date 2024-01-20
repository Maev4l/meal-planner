import { Route, BrowserRouter, Routes } from 'react-router-dom';

import { SignIn, ProtectedRoute } from './security';
import { Shell } from './layout';
import { Planning } from './planning';
import { Settings } from './settings';

const Router = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<Shell />}>
          <Route path="/" element={<Planning />} />
        </Route>
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="*" element={<p>Ooops !!</p>} />
    </Routes>
  </BrowserRouter>
);

// export default Router;
export default Router;
