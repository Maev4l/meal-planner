import { Route, BrowserRouter, Routes } from 'react-router-dom';

import { SignIn, ProtectedRoute } from './security';
import { Planning } from './planning';

const Router = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Planning />} />
      </Route>
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="*" element={<p>Ooops !!</p>} />
    </Routes>
  </BrowserRouter>
);

// export default Router;
export default Router;
