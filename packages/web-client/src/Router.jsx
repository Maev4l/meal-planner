import { Route, BrowserRouter, Routes } from 'react-router-dom';

import { Landing } from './landing';
import { SignIn, ProtectedRoute } from './security';
import { Planning } from './planning';

const Router = () => (
  <BrowserRouter>
    <Routes>
      <Route index element={<Landing />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/planning" element={<Planning />} />
      </Route>
      <Route path="*" element={<p>Ooops !!</p>} />
    </Routes>
  </BrowserRouter>
);

// export default Router;
export default Router;
