# Meal planner front-end

## Design

- Source code: @../packages/web-client-v2
- The UI is a React-based PWA (Progressive Web App) styled with **Tailwind CSS v4** (dark-only "Ardoise" chalkboard theme)
- No MUI / Emotion — replaced entirely by Tailwind utility classes + hand-built primitives (see Components below)
- Theme tokens defined in `src/index.css` via `@theme` (CSS custom properties); `theme.js` no longer exists
- Chalk SVG icon system via `src/components/Icon.jsx` (symbols: `gear, copy, back, logout, note, refresh, dots, plus, trash, share, crown, pencil, link, check, clock`)
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
│     │  (＋ TopBar button + empty-state CTA to create; per-row gear button   │
│     │   navigates directly to settings; group-management fully implemented) │
│     │                                                                       │
│     ├──> [Group Row] ──> GroupSchedulePage                                  │
│     │                       │                                               │
│     │                       └──> DefaultSchedulePage                        │
│     │                                                                       │
│     ├──> [Row gear] ──> GroupSettingsPage (directly, no action sheet)       │
│     │                                                                       │
│     └──> (create group) ──> GroupSettingsPage (navigates after create)      │
│                                                                             │
│  Bottom Nav: Groups | Account | Settings | About                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Pages

### Implemented Pages

- `LoginPage.jsx` — login form + Google OAuth
- `SignUpPage.jsx` — registration (pending approval)
- `GroupsPage.jsx` — lists user's groups; `＋` TopBar button + empty-state CTA to create a group; per-row gear button navigates directly to `GroupSettingsPage`; after creating a group, navigates to that group's `GroupSettingsPage` (Invites section) so the new admin can create + share an invite inline
- `GroupSchedulePage.jsx` — weekly schedule with "My week" / "Everyone" toggle:
  - **My week** → `PersonalScheduleView`: one-tap `MealTile` grid + note trigger per day
  - **Everyone** → `MembersScheduleView`: day-centric view — day strip, Lunch/Dinner badge blocks, inline Notes block
  - Shared `WeekNavigator` for week navigation
  - `CommentEditorSheet` — autosave bottom sheet for editing notes
  - TopBar: back button (left) + "Default schedule" repeat button (right); no settings gear
- `DefaultSchedulePage.jsx` — default ("the usual") schedule settings
- `AccountPage.jsx` — user account info
- `SettingsPage.jsx` — app settings
- `AboutPage.jsx` — app info
- `GroupSettingsPage.jsx` — role-adaptive group admin panel:
  - **All members**: identity block (avatar, name, member count); roster of members with Admin/You badges
  - **Admin only**: rename (pencil), members section with per-row kick (trash), invites section (create invite inline; each active-invite row carries Share / Copy / Revoke icon buttons), danger zone (type-to-confirm delete)
  - **Non-admin**: danger zone shows "Leave group" only
- `InvitePage.jsx` — public invite landing (`/invite/:code`); outside both route guards; branches on auth state: `anon` (sign in / create account) → `confirm` (join) → `awaiting` (unapproved account) → `already` / `expired` / `error`; stores code to `localStorage` via `pendingInvite.js` to survive the login/approval gap

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
- `Toast` — transient notification; `show(message, type)` with `success` (sage + check icon) / `error` (red + info icon) / neutral variants
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

### Group Management Components

- `CreateGroupSheet` — single-field create with live initials-avatar preview; calls `onCreate(name)` then closes
- `RenameGroupSheet` — same layout as create; pre-filled with current name; calls `onRename(name)`
- `ConfirmSheet` — generic destructive confirm (icon, title, body, confirm label); used for kick / revoke / leave
- `DeleteGroupSheet` — type-to-confirm variant; destructive button unlocks only when typed text matches group name
- `MemberRow` — roster row: avatar, name, Admin badge (`crown` icon), "You" annotation, optional trash button (admin only, non-admin non-self targets)
- `PendingInviteHandler` — zero-render component mounted inside `SchedulesProvider`; on any authenticated session resolves, checks `localStorage` for a pending invite code and navigates to `/invite/:code`

## Routes

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/login` | LoginPage | Public | Login form |
| `/signup` | SignUpPage | Public | Registration |
| `/invite/:code` | InvitePage | Public (no guard) | Invite landing; branches on auth state internally |
| `/` | GroupsPage | Required | Groups list (home) |
| `/groups/:groupId` | GroupSchedulePage | Required | Weekly schedule (My week / Everyone) |
| `/groups/:groupId/default` | DefaultSchedulePage | Required | Default schedule |
| `/groups/:groupId/settings` | GroupSettingsPage | Required | Group admin panel (role-adaptive) |
| `/account` | AccountPage | Required | User account |
| `/settings` | SettingsPage | Required | App settings |
| `/about` | AboutPage | Required | App info |

**Removed routes (Ardoise redesign):**
- `/groups/:groupId/comments` (CommentsPage) — deleted; comments now inline in GroupSchedulePage
- `/groups/:groupId/:groupName/day/:day` — deleted

## State Management

### Invite Code Persistence

`src/services/pendingInvite.js` — localStorage helper (`setPendingInvite / getPendingInvite / clearPendingInvite`). Stored shape: `{ code, savedAt }`; auto-expires after 7 days so a stale invite never hijacks a later login.

When a user clicks an invite link while not logged in:
1. `InvitePage` calls `setPendingInvite(code)` and shows "Sign in to join"
2. After login (or admin approval), `PendingInviteHandler` detects the stored code and navigates to `/invite/:code`
3. `InvitePage` calls `clearPendingInvite()` on a successful redeem or expired/revoked code

### API Client

`src/services/api.js` — all requests go through `fetchWithAuth`. Errors surface as `ApiError` (exported class) carrying `.status` (HTTP code; `0` = network failure), allowing callers like `InvitePage` to branch on terminal (404), unapproved (403), or retryable (5xx/network) outcomes.

## UX Guidelines

### GroupsPage
- Show group name and member count per row, with stacked member avatars
- Tap row body → GroupSchedulePage; tap gear button → GroupSettingsPage directly (no action sheet)
- `＋` in TopBar and empty-state "New group" CTA open `CreateGroupSheet`; after creation, navigates to the new group's `GroupSettingsPage` (Invites section)

### GroupSchedulePage
- "My week" / "Everyone" tab toggle at top
- Shared `WeekNavigator` (prev / next week arrows)
- **My week**: grid of `MealTile`s (one-tap to toggle lunch/dinner); tap note icon to open `CommentEditorSheet`
- **Everyone**: day strip across the top; below each day, Lunch block and Dinner block list members attending; inline Notes block shows comments for that day

### CommentEditorSheet
- Slides up from bottom
- Autosaves when dismissed (no explicit save button needed)

### GroupSettingsPage
- Role-adaptive: admin sees rename pencil, members roster with kick buttons, invites section, and "Delete group" danger zone; member sees read-only roster and "Leave group" danger zone
- Invites are created **inline**: "Create invite link" mints an invite immediately and it appears in the active-invite list; each invite row has its own **Share** (Web Share API, Copy fallback), **Copy**, and **Revoke** (`ConfirmSheet`) icon buttons — no invite bottom sheet
- Member removal uses a single route `DELETE /api/groups/{groupId}/members/{memberId}`; frontend sends caller's own id for self-leave (`api.leaveGroup`) or another member's id for kick (`api.kickMember`)
- Sole admin cannot leave (API returns 403); they must delete the group instead

### InvitePage
- Public route outside both `ProtectedRoute` and `PublicRoute` guards — `InvitePage` handles its own auth branching
- Anonymous: shows group name (from `?g=` hint) + "Sign in to join" / "Create account"; stores invite code via `pendingInvite.js`
- Authenticated + approved: confirm screen → join → navigates to the group schedule
- Authenticated + unapproved: "Awaiting approval" state; code stays in localStorage until approval completes
- Expired / revoked: terminal expired state; clears localStorage
