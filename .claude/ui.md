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

- `src/contexts/AuthContext.jsx` — auth state, signIn, signInWithGoogle, signUp, signOut, `refreshSession()` (forces a Cognito token refresh so a freshly-flipped approval claim is picked up — used after invite auto-approval and by the pending-approval screen). `checkAuth` reads `custom:Approved` from the id token into `user.approved`; `isApproved` (approved only when the claim is exactly `"true"`, mirroring the backend `RequireApproved` gate) drives the `ProtectedRoute` approval gate — an authenticated-but-unapproved user is shown `PendingApprovalPage` instead of an approval-gated page
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
│  Bottom Nav: Groups | Settings                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Pages

### Implemented Pages

- `LoginPage.jsx` — crest, Google (ghost), email form with a coral-filled Sign in, then a "New here? Create account" foot link. Sign up is a task change, not a peer action, so it is a link rather than a third full-width button
- `SignUpPage.jsx` — registration (pending approval)
- `NotFoundPage.jsx` — any unmatched route (stale bookmark, removed route). Renders `ErrorState` with "Go to your groups"; previously an unmatched path rendered the app shell with an empty body
- `PendingApprovalPage.jsx` — shown by `ProtectedRoute` for an authenticated-but-unapproved user (e.g. a fresh Google signup, which creates a session immediately, before an admin clicks Approve). "Check again" calls `refreshSession()`; once the admin approves (`custom:Approved` → `"true"`) the refreshed claim lets the app render. Prevents the raw 403 an unapproved user used to hit on GroupsPage.
- `GroupsPage.jsx` — lists user's groups; `＋` TopBar button + empty-state CTA to create a group; per-row gear button navigates directly to `GroupSettingsPage`; after creating a group, navigates to that group's `GroupSettingsPage` (Invites section) so the new admin can create + share an invite inline
- `GroupSchedulePage.jsx` — weekly schedule with "My week" / "Everyone" toggle:
  - **My week** → `UsualStatus` row (says whether this week is running on the member's default or has been adjusted, with Edit usual / Reset week) above `PersonalScheduleView`: one-tap `MealTile` grid + note trigger per day
  - **Everyone** → `MembersScheduleView`: day-centric view — week board (7 day columns, each showing its own lunch/dinner headcount), then the selected day's Lunch/Dinner badge blocks and inline Notes block
  - Shared `WeekNavigator` for week navigation
  - `CommentEditorSheet` — autosave bottom sheet for editing notes
  - TopBar: back button (left) + "Default schedule" repeat button (right); no settings gear
- `DefaultSchedulePage.jsx` — default ("the usual") schedule settings
- `AccountPage.jsx` — change password (three fields, requirements revealed only once a new password is typed, eye reveal toggles) + sign out. No cards: the form is the page
- `SettingsPage.jsx` — identity (avatar, name, email + copy), one hairline row to Account, then a foot carrying the wordmark, `v<version> · <build>`, the update check and "à table."
- `GroupSettingsPage.jsx` — role-adaptive group admin panel:
  - **All members**: identity block (avatar, name, member count); roster of members with Admin/You badges
  - **Admin only**: rename (pencil), members section with per-row kick (trash), invites section (create invite inline; each active-invite row carries Share / Copy / Revoke icon buttons), danger zone (type-to-confirm delete)
  - **Non-admin**: danger zone shows "Leave group" only
- `InvitePage.jsx` — public invite landing (`/invite/:code`); outside both route guards; branches on auth state: `anon` (sign in / create account) → `confirm` (join) → `already` / `expired` / `error`; stores code to `localStorage` via `pendingInvite.js` to survive the login gap. An invited user is auto-approved by the API on redeem, so there is no "awaiting approval" state; `join()` calls `refreshSession()` after a successful redeem (so the flipped approval claim takes effect) before loading the schedule / navigating

## Components

### UI Primitives (`src/components/ui/`)

Hand-built, Tailwind-based primitives replacing MUI:

- `Button` — primary / secondary / danger variants
- `IconButton` — icon-only button
- `Spinner` — loading indicator
- `Reveal` — password show/hide eye toggle, 44px hit area; shared by LoginPage and AccountPage so the same control is never an icon on one screen and the word "show" on another
- `Field` — labelled input wrapper
- `Textarea` — multiline text input
- `Card` — surface container
- `Avatar` — user avatar
- `Badge` — attendee chip (avatar + name)
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
- `UsualStatus` — "My week" only: names whether the week is served from the member's default ("On the usual") or has been edited ("Adjusted this week — N days differ"). Action is `Edit usual` → `DefaultSchedulePage` or `Reset week` → rewrites the default into this week. Compares **values**, not the API's `overriden` flag (a reset week stays flagged as overridden), and only over days that are still editable, so a reset can always reach its goal
- `MembersScheduleView` — "Everyone" tab: week board (7 columns of L/D headcounts, no horizontal scroll; column = day selector) + selected-day heading with full date + Lunch/Dinner badge blocks + inline Notes block. Selection re-anchors to today (or Monday) when the week changes
- `CommentEditorSheet` — bottom sheet for editing a meal note; autosaves on close
- `ErrorState` — shared failed-load block: message + "Try again". Used by GroupsPage, GroupSchedulePage, DefaultSchedulePage and NotFoundPage. Copy comes from `errorMessage(err, overrides)` in `services/api.js`, never from `err.message` (which is always the diagnostic `API error: <status>`)

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
| `/groups/:groupId/:groupName` | GroupSchedulePage | Required | Weekly schedule (My week / Everyone) |
| `/groups/:groupId/:groupName/default` | DefaultSchedulePage | Required | Default schedule ("the usual") |
| `/groups/:groupId/settings` | GroupSettingsPage | Required | Group admin panel (role-adaptive) |
| `/settings` | SettingsPage | Required | Identity, Account row, and the version/update foot |
| `/settings/account` | AccountPage | Required | Change password + sign out |
| `*` | NotFoundPage | Public | Catch-all for unmatched paths; explains the dead link instead of bouncing to /login |

**Removed route (periphery distill):**
- `/settings/about` (AboutPage) — deleted. Its crest, two boxed info rows, update button and tagline
  collapsed into the foot of `SettingsPage`: wordmark, one mono `v<version> · <build>` line, the
  update button, and "à table.". Nothing was lost; a bookmarked `/settings/about` now hits
  `NotFoundPage`.

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
- **My week**: `UsualStatus` row first — the API serves an untouched week from the member's default, so this row is what tells them the week is on autopilot rather than a set of choices they made; then the grid of `MealTile`s (one-tap to toggle lunch/dinner); tap note icon to open `CommentEditorSheet`
- **Everyone**: week board across the top — every day shows its lunch and dinner headcount at once, so the whole week reads without a tap; tapping a column drills into that day's Lunch and Dinner attendee names plus an inline Notes block

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
- Authenticated (approved or unapproved): confirm screen → join → navigates to the group schedule. The API auto-approves an unapproved invitee on redeem, so there is no "awaiting approval" wait; `join()` calls `refreshSession()` right after the successful redeem so the freshly-flipped approval claim is picked up before navigating
- Expired / revoked: terminal expired state; clears localStorage
