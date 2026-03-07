# Meal planner front-end

## Design

- Source code: @../packages/web-client-v2
- The UI is a React based PWA (Progressive Web App), leveraging MUI (Material UI)
- vite is the packager / bundler
- AWS Amplify for Cognito authentication

## Authentication

- Email/password sign-in via Cognito
- Google OAuth sign-in via Cognito hosted UI
- Self-registration with admin approval workflow
- OAuth config in `src/config.js` (domain: `meal-planner-auth.isnan.eu`)

### Key Files

- `src/contexts/AuthContext.jsx` — auth state, signIn, signInWithGoogle, signUp, signOut
- `src/pages/LoginPage.jsx` — login form + Google button
- `src/pages/SignUpPage.jsx` — registration form (pending approval)
- `src/config.js` — Cognito + OAuth configuration