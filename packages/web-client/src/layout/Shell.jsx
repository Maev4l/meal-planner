import { Outlet, useOutletContext } from 'react-router-dom';
import { Fragment } from 'react';

import { useAuth } from '../security';
import Header from './Header';

const Shell = () => {
  const {
    token: { payload },
  } = useAuth();
  const { userId } = useOutletContext();

  const userName = payload['cognito:username'];

  return (
    <Fragment>
      <Header userName={userName} />
      <Outlet context={{ userId }} />
    </Fragment>
  );
};

export default Shell;
