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
│     │                                                                       │
│     ├──> [FAB +] ──> CreateGroupDialog                                      │
│     │                                                                       │
│     ├──> [Group Card] ──> GroupSchedulePage                                 │
│     │                        │                                              │
│     │                        ├──> DefaultSchedulePage                       │
│     │                        └──> CommentsPage                              │
│     │                                                                       │
│     └──> [Group Card ⚙️] ──> GroupSettingsPage (admin only)                  │
│                                 │                                           │
│                                 ├──> InviteMemberDialog                     │
│                                 ├──> RemoveMemberDialog                     │
│                                 ├──> RenameGroupDialog                      │
│                                 └──> DeleteGroupDialog                      │
│                                                                             │
│  Bottom Nav: Groups | Account | Settings | About                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              INVITE FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  External link: /invite/{code}                                              │
│     │                                                                       │
│     ├──> [Not logged in] ──> LoginPage ──> (store code) ──> InvitePage      │
│     │                                                                       │
│     └──> [Logged in] ──> InvitePage                                         │
│                             │                                               │
│                             ├──> [Join] ──> GroupsPage (refreshed)          │
│                             └──> [Cancel] ──> GroupsPage                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Pages

### Existing Pages
- `LoginPage.jsx` — login form + Google OAuth
- `SignUpPage.jsx` — registration (pending approval)
- `GroupsPage.jsx` — list user's groups
- `GroupSchedulePage.jsx` — weekly meal attendance grid
- `DefaultSchedulePage.jsx` — default schedule settings
- `CommentsPage.jsx` — meal comments
- `AccountPage.jsx` — user account info
- `SettingsPage.jsx` — app settings
- `AboutPage.jsx` — app info

### New Pages (group management)
- `GroupSettingsPage.jsx` — group admin panel (members, invites, danger zone)
- `InvitePage.jsx` — invite redemption page (`/invite/:code`)

## Components

### New Components (group management)

**Group Creation:**
- `CreateGroupDialog.jsx` — modal with group name input

**Group Settings (admin only):**
- `GroupSettingsPage.jsx` — main settings page with sections:
  - Members list with remove buttons
  - Invite section with create/copy/revoke
  - Rename group
  - Delete group (danger zone)

**Dialogs:**
- `InviteMemberDialog.jsx` — generates invite link, copy to clipboard
- `RemoveMemberDialog.jsx` — confirmation dialog for removing member
- `RenameGroupDialog.jsx` — rename group form
- `DeleteGroupDialog.jsx` — type group name to confirm deletion

**Invite Flow:**
- `InvitePage.jsx` — displays group info, join/cancel buttons

## Routes

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/login` | LoginPage | Public | Login form |
| `/signup` | SignUpPage | Public | Registration |
| `/` | GroupsPage | Required | Groups list (home) |
| `/groups/:groupId` | GroupSchedulePage | Required | Weekly schedule |
| `/groups/:groupId/default` | DefaultSchedulePage | Required | Default schedule |
| `/groups/:groupId/comments` | CommentsPage | Required | Meal comments |
| `/groups/:groupId/settings` | GroupSettingsPage | GroupAdmin | Group admin panel |
| `/invite/:code` | InvitePage | Required | Join group via invite |
| `/account` | AccountPage | Required | User account |
| `/settings` | SettingsPage | Required | App settings |
| `/about` | AboutPage | Required | App info |

## State Management

### Invite Code Persistence
When user clicks invite link while not logged in:
1. Store invite code in `localStorage` (`pendingInviteCode`)
2. Redirect to `/login`
3. After successful login, check `localStorage` for pending invite
4. If found, redirect to `/invite/:code` and clear storage

## UX Guidelines

### Group Card (GroupsPage)
- Show group name, member count
- Settings icon (⚙️) visible only to admin
- Tap card → GroupSchedulePage
- Tap ⚙️ → GroupSettingsPage

### GroupSettingsPage Layout
```
┌─────────────────────────────────────┐
│ ← Group Settings: "Family Meals"    │
├─────────────────────────────────────┤
│ Members (3)                [Invite] │
│ ┌─────────────────────────────────┐ │
│ │ 👤 John Doe (Admin)        —    │ │
│ │ 👤 Jane Doe           [Remove]  │ │
│ │ 👤 Bob Smith          [Remove]  │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Group Name                          │
│ ┌─────────────────────────────────┐ │
│ │ Family Meals            [Save]  │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Danger Zone                         │
│ ┌─────────────────────────────────┐ │
│ │ [Delete Group]                  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### InviteMemberDialog
```
┌─────────────────────────────────────┐
│ Invite to "Family Meals"        [×] │
├─────────────────────────────────────┤
│                                     │
│ Share this link:                    │
│ ┌─────────────────────────────────┐ │
│ │ https://meal-planner.isnan.eu/  │ │
│ │ invite/ABC123XY          [Copy] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Link expires in 7 days              │
│                                     │
│              [Done]                 │
└─────────────────────────────────────┘
```

### InvitePage (`/invite/:code`)
```
┌─────────────────────────────────────┐
│         Join "Family Meals"?        │
├─────────────────────────────────────┤
│                                     │
│   You've been invited to join       │
│   the group "Family Meals"          │
│                                     │
│   [Join Group]    [Cancel]          │
│                                     │
└─────────────────────────────────────┘
```

### DeleteGroupDialog
```
┌─────────────────────────────────────┐
│ Delete "Family Meals"?          [×] │
├─────────────────────────────────────┤
│                                     │
│ ⚠️ This will permanently delete:    │
│ • All members and their schedules   │
│ • All comments and notices          │
│ • All pending invites               │
│                                     │
│ Type "Family Meals" to confirm:     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│              [Delete]               │
└─────────────────────────────────────┘
```

### RemoveMemberDialog
```
┌─────────────────────────────────────┐
│ Remove Jane Doe?                [×] │
├─────────────────────────────────────┤
│                                     │
│ This will remove Jane Doe from      │
│ "Family Meals" and delete their:    │
│ • Schedules                         │
│ • Comments                          │
│ • Notices                           │
│                                     │
│     [Remove]      [Cancel]          │
└─────────────────────────────────────┘
```