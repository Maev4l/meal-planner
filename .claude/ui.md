# Meal planner front-end

## Design

- Source code: @../packages/web-client-v2
- The UI is a React-based PWA (Progressive Web App) styled with **Tailwind CSS v4** (dark-only "Ardoise" chalkboard theme)
- No MUI / Emotion — replaced entirely by Tailwind utility classes + hand-built primitives (see Components below)
- Theme tokens defined in `src/index.css` via `@theme` (CSS custom properties); `theme.js` no longer exists
- Chalk SVG icon system via `src/components/Icon.jsx`
- Vite is the packager / bundler
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

## Screen Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AUTHENTICATION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LoginPage ─────────────────┬──────────────────> GroupsPage (home)          │
│     │                       │                                               │
│     └──> SignUpPage ────────┘ (after approval)                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              MAIN NAVIGATION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  GroupsPage (home)                                                          │
│     │  (informational empty state when user has no groups;                  │
│     │   group-management UI is not implemented — see Planned section)       │
│     │                                                                       │
│     └──> [Group Card] ──> GroupSchedulePage                                 │
│                              │                                              │
│                              └──> DefaultSchedulePage                       │
│                                                                             │
│  Bottom Nav: Groups | Account | Settings | About                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Pages

### Implemented Pages

- `LoginPage.jsx` — login form + Google OAuth
- `SignUpPage.jsx` — registration (pending approval)
- `GroupsPage.jsx` — lists user's groups; informational empty state when none exist
- `GroupSchedulePage.jsx` — weekly schedule with "My week" / "Everyone" toggle:
  - **My week** → `PersonalScheduleView`: one-tap `MealTile` grid + note trigger per day
  - **Everyone** → `MembersScheduleView`: day-centric view — day strip, Lunch/Dinner badge blocks, inline Notes block
  - Shared `WeekNavigator` for week navigation
  - `CommentEditorSheet` — autosave bottom sheet for editing notes
- `DefaultSchedulePage.jsx` — default ("the usual") schedule settings
- `AccountPage.jsx` — user account info
- `SettingsPage.jsx` — app settings
- `AboutPage.jsx` — app info

### Planned / not implemented (out of scope for the Ardoise redesign)

The following pages are designed but have not been built:

- `GroupSettingsPage.jsx` — group admin panel (members, invites, danger zone)
- `InvitePage.jsx` — invite redemption page (`/invite/:code`)

## Components

### UI Primitives (`src/components/ui/`)

Hand-built, Tailwind-based primitives replacing MUI:

- `Button` — primary / secondary / danger variants
- `IconButton` — icon-only button
- `Spinner` — loading indicator
- `Field` — labelled input wrapper
- `Textarea` — multiline text input
- `Card` — surface container
- `Avatar` — user avatar
- `Badge` — lunch / dinner status badge
- `Toast` — transient notification
- `BottomSheet` — modal sheet sliding up from bottom (used by `CommentEditorSheet`)
- `TopBar` — page-level app bar
- `BottomNav` — bottom navigation bar
- `MealTile` — one-tap meal attendance toggle tile

### Icon System

- `src/components/Icon.jsx` — chalk SVG icon wrapper; all icons rendered via this component

### Schedule Components

- `WeekNavigator` — prev/next week controls, shared between views
- `PersonalScheduleView` — "My week" tab: grid of `MealTile`s + per-day note trigger
- `MembersScheduleView` — "Everyone" tab: day strip + Lunch/Dinner badge blocks + inline Notes block
- `CommentEditorSheet` — bottom sheet for editing a meal note; autosaves on close

### Planned / not implemented (out of scope for the Ardoise redesign)

- `CreateGroupDialog.jsx` — modal with group name input
- `GroupSettingsPage.jsx` components: members list, invite section, rename, danger zone
- `InviteMemberDialog.jsx` — generates invite link, copy to clipboard
- `RemoveMemberDialog.jsx` — confirmation for removing a member
- `RenameGroupDialog.jsx` — rename group form
- `DeleteGroupDialog.jsx` — type group name to confirm deletion

## Routes

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/login` | LoginPage | Public | Login form |
| `/signup` | SignUpPage | Public | Registration |
| `/` | GroupsPage | Required | Groups list (home) |
| `/groups/:groupId` | GroupSchedulePage | Required | Weekly schedule (My week / Everyone) |
| `/groups/:groupId/default` | DefaultSchedulePage | Required | Default schedule |
| `/account` | AccountPage | Required | User account |
| `/settings` | SettingsPage | Required | App settings |
| `/about` | AboutPage | Required | App info |

**Removed routes (Ardoise redesign):**
- `/groups/:groupId/comments` (CommentsPage) — deleted; comments now inline in GroupSchedulePage
- `/groups/:groupId/:groupName/day/:day` — deleted

**Planned routes (not implemented):**
- `/groups/:groupId/settings` — GroupSettingsPage (group admin panel)
- `/invite/:code` — InvitePage (join group via invite)

## State Management

### Invite Code Persistence (planned, not implemented)

When a user clicks an invite link while not logged in:
1. Store invite code in `localStorage` (`pendingInviteCode`)
2. Redirect to `/login`
3. After successful login, check `localStorage` for pending invite
4. If found, redirect to `/invite/:code` and clear storage

## UX Guidelines

### GroupsPage
- Show group name and member count per card
- Tap card → GroupSchedulePage
- Informational empty state shown when user belongs to no groups (no create-group UI yet)

### GroupSchedulePage
- "My week" / "Everyone" tab toggle at top
- Shared `WeekNavigator` (prev / next week arrows)
- **My week**: grid of `MealTile`s (one-tap to toggle lunch/dinner); tap note icon to open `CommentEditorSheet`
- **Everyone**: day strip across the top; below each day, Lunch block and Dinner block list members attending; inline Notes block shows comments for that day

### CommentEditorSheet
- Slides up from bottom
- Autosaves when dismissed (no explicit save button needed)
