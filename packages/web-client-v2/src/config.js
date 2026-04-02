import outputConfig from '../output.json';

// OAuth redirect URLs based on environment
const isDev = window.location.hostname === 'localhost';
const redirectUrl = isDev ? 'http://localhost:3000/' : 'https://meal-planner.isnan.eu/';
const logoutUrl = isDev ? 'http://localhost:3000/login' : 'https://meal-planner.isnan.eu/login';

export const config = {
  cognito: {
    userPoolId: outputConfig.cognito_user_pool_id.value,
    userPoolClientId: outputConfig.cognito_user_pool_client_id.value,
    region: outputConfig.region.value,
  },
  // OAuth configuration for Google sign-in
  oauth: {
    domain: 'meal-planner-auth.isnan.eu',
    scopes: ['openid', 'email', 'profile'],
    redirectSignIn: redirectUrl,
    redirectSignOut: logoutUrl,
    responseType: 'code',
  },
};
