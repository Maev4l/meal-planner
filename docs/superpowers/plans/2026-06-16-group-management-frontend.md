# Group Management — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the React/PWA group-management UI — create/rename/delete group, invite (generate + share + list/revoke), kick members, leave group — plus the public `/invite/:code` landing page and the post-approval redeem handoff.

**Architecture:** New role-adaptive `GroupSettingsPage` reached from the schedule page's gear and the GroupsPage row `⋮` action sheet; focused sub-tasks use the existing `BottomSheet`. A public `InvitePage` (outside both route guards) plus a top-level `PendingInviteHandler` complete the invite handoff after login/approval. All group/role data comes from the already-populated `SchedulesContext` (`group.members[memberId].admin`); mutations call new `api` methods then force a schedules refresh.

**Tech Stack:** React 18, react-router-dom, Tailwind v4 (Ardoise tokens), AWS Amplify (auth). Depends on the **backend plan** being deployed/reachable. Spec: `docs/superpowers/specs/2026-06-16-group-management-design.md`. Mockup: `docs/ui-design/group-mgmt/group-mgmt.html`.

**Conventions (from the existing code):**
- All commands run from `packages/web-client-v2`. Dev server: `yarn --cwd packages/web-client-v2 dev` (fixed port). Lint: `yarn --cwd packages/web-client-v2 lint`. Build: `yarn --cwd packages/web-client-v2 build`.
- No web test harness — each task is verified by **lint/build + manual browser check** (project convention; see spec §9).
- Primitives: `Button` (`primary|ghost|danger`), `IconButton` (`name,label,className,onClick,disabled`), `BottomSheet` (`open,onClose`; has its own grab handle + scrim + Escape + scroll-lock + bottom safe-area), `TopBar` (`title,sub,left,right`), `Icon` (`name,className,title`), `useToast()` → `show(msg)`.
- Role check anywhere: `group.members[user.memberId]?.admin === true` (data already in the schedules payload).
- Toast is `z-50`, BottomSheet `z-40` — toasts already render above sheets (no change needed).

**Commit after every task.** Work on `master`; commits are local (pushing is user-initiated).

---

### Task 1: Add chalk glyphs

**Files:**
- Modify: `src/components/Icon.jsx`

- [ ] **Step 1: Add new symbols to `ChalkSprite`**

Insert these `<symbol>`s inside the `<defs>` of `ChalkSprite` (alongside the existing ones; `gear`, `copy`, `back`, `logout`, `note`, `refresh` already exist):

```jsx
      <symbol id="ic-dots" viewBox="0 0 24 24"><g fill="currentColor" stroke="currentColor" strokeWidth="0.6" filter="url(#chalk)"><circle cx="12" cy="5" r="1.9" /><circle cx="12" cy="12" r="1.9" /><circle cx="12" cy="19" r="1.9" /></g></symbol>
      <symbol id="ic-plus" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" filter="url(#chalk)"><path d="M12 5 V19 M5 12 H19" /></g></symbol>
      <symbol id="ic-trash" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M4.5 7 H19.5 M9 7 V5.6 a1.5 1.5 0 0 1 1.5 -1.5 h3 A1.5 1.5 0 0 1 15 5.6 V7 M6.5 7 l1 12.4 a1.5 1.5 0 0 0 1.5 1.4 h6 a1.5 1.5 0 0 0 1.5 -1.4 L18 7 M10 11 v6 M14 11 v6" /></g></symbol>
      <symbol id="ic-share" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><circle cx="6" cy="12" r="2.4" /><circle cx="18" cy="6" r="2.4" /><circle cx="18" cy="18" r="2.4" /><path d="M8.1 10.9 15.9 7.1 M8.1 13.1 15.9 16.9" /></g></symbol>
      <symbol id="ic-crown" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M4 18 H20 M5 17 L3.4 8 L8.5 11.7 L12 5 L15.5 11.7 L20.6 8 L19 17 Z" /></g></symbol>
      <symbol id="ic-pencil" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M4 20 L4.8 16 L15.5 5.3 a1.8 1.8 0 0 1 2.5 0 l0.7 0.7 a1.8 1.8 0 0 1 0 2.5 L8 19.2 L4 20 Z M14 7 l3 3" /></g></symbol>
      <symbol id="ic-link" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M10 14 a4 4 0 0 0 6 0.5 l2.5 -2.5 a4 4 0 0 0 -5.7 -5.7 L11 8 M14 10 a4 4 0 0 0 -6 -0.5 L5.5 12 a4 4 0 0 0 5.7 5.7 L13 16" /></g></symbol>
      <symbol id="ic-check" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><path d="M5 13 l4 4 10 -11" /></g></symbol>
      <symbol id="ic-clock" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chalk)"><circle cx="12" cy="12" r="8.5" /><path d="M12 7 V12 L15.5 14" /></g></symbol>
```

- [ ] **Step 2: Lint & build**

Run: `yarn --cwd packages/web-client-v2 lint && yarn --cwd packages/web-client-v2 build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add packages/web-client-v2/src/components/Icon.jsx
git commit -m "feat(web): add group-management chalk icons"
```

---

### Task 2: API client methods + status-aware errors + pending-invite storage

**Files:**
- Modify: `src/services/api.js`
- Create: `src/services/pendingInvite.js`

- [ ] **Step 1: Make `fetchWithAuth` surface the HTTP status, and add methods**

Replace the body of `src/services/api.js` with:

```js
import { fetchAuthSession } from 'aws-amplify/auth';

const getToken = async () => {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch {
    return null;
  }
};

// Error carrying the HTTP status, so callers (e.g. InvitePage) can branch
// terminal (404) vs not-approved (403) vs retryable (5xx / network).
export class ApiError extends Error {
  constructor(status, message) {
    super(message || `API error: ${status}`);
    this.name = 'ApiError';
    this.status = status; // 0 = network/transport failure
  }
}

const fetchWithAuth = async (url, options = {}) => {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = token;

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (e) {
    throw new ApiError(0, e?.message || 'Network error');
  }
  if (!response.ok) {
    throw new ApiError(response.status, `API error: ${response.status}`);
  }
  return response;
};

export const api = {
  getSchedules: async (period) => {
    const response = await fetchWithAuth(`/api/schedules/${period}`);
    return response.json();
  },
  createSchedule: async (groupId, data) => {
    await fetchWithAuth(`/api/groups/${groupId}/schedules`, { method: 'POST', body: JSON.stringify(data) });
  },
  createComments: async (groupId, data) => {
    await fetchWithAuth(`/api/groups/${groupId}/comments`, { method: 'POST', body: JSON.stringify(data) });
  },
  createNotice: async (groupId, data) => {
    await fetchWithAuth(`/api/groups/${groupId}/notices`, { method: 'POST', body: JSON.stringify(data) });
  },
  deleteNotice: async (groupId, period) => {
    await fetchWithAuth(`/api/groups/${groupId}/notices/${period}`, { method: 'DELETE' });
  },

  // --- Group management ---
  createGroup: async (name) => {
    const r = await fetchWithAuth('/api/groups', { method: 'POST', body: JSON.stringify({ name }) });
    return r.json(); // { id, name, createdAt }
  },
  renameGroup: async (groupId, name) => {
    const r = await fetchWithAuth(`/api/groups/${groupId}`, { method: 'PUT', body: JSON.stringify({ name }) });
    return r.json();
  },
  deleteGroup: async (groupId) => {
    await fetchWithAuth(`/api/groups/${groupId}`, { method: 'DELETE' });
  },
  createInvite: async (groupId) => {
    const r = await fetchWithAuth(`/api/groups/${groupId}/invites`, { method: 'POST' });
    return r.json(); // { code, expiresAt }
  },
  listInvites: async (groupId) => {
    const r = await fetchWithAuth(`/api/groups/${groupId}/invites`);
    return r.json(); // { invites: [{ code, expiresAt }] }
  },
  getInvite: async (code) => {
    const r = await fetchWithAuth(`/api/invites/${code}`);
    return r.json(); // { groupName, expiresAt }
  },
  redeemInvite: async (code) => {
    const r = await fetchWithAuth(`/api/invites/${code}/redeem`, { method: 'POST' });
    return r.json(); // { groupId, groupName, alreadyMember }
  },
  revokeInvite: async (groupId, code) => {
    await fetchWithAuth(`/api/groups/${groupId}/invites/${code}`, { method: 'DELETE' });
  },
  kickMember: async (groupId, memberId) => {
    await fetchWithAuth(`/api/groups/${groupId}/members/${memberId}`, { method: 'DELETE' });
  },
  // Same route as kickMember; the backend dispatches on caller-id vs path-id
  // (path id == caller → voluntary leave; else → admin kick). Callers pass user.memberId.
  leaveGroup: async (groupId, memberId) => {
    await fetchWithAuth(`/api/groups/${groupId}/members/${memberId}`, { method: 'DELETE' });
  },
};
```

- [ ] **Step 2: Pending-invite localStorage helper**

Create `src/services/pendingInvite.js`:

```js
// Persists an invite code across the login (and admin-approval) gap.
// Stored shape: { code, savedAt }. Ignored/cleared after 7 days so a stale
// invite never hijacks a later, unrelated login.
const KEY = 'pendingInviteCode';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const setPendingInvite = (code) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ code, savedAt: Date.now() }));
  } catch { /* storage unavailable — link still works on re-open */ }
};

export const getPendingInvite = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { code, savedAt } = JSON.parse(raw);
    if (!code || typeof savedAt !== 'number' || Date.now() - savedAt > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return code;
  } catch {
    return null;
  }
};

export const clearPendingInvite = () => {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
};
```

- [ ] **Step 3: Lint & build**

Run: `yarn --cwd packages/web-client-v2 lint && yarn --cwd packages/web-client-v2 build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add packages/web-client-v2/src/services/
git commit -m "feat(web): group-management API methods + pending-invite storage"
```

---

### Task 3: Shared confirmation sheets

**Files:**
- Create: `src/components/ConfirmSheet.jsx`
- Create: `src/components/DeleteGroupSheet.jsx`

- [ ] **Step 1: Generic ConfirmSheet (kick / revoke / leave)**

Create `src/components/ConfirmSheet.jsx`:

```jsx
import BottomSheet from './ui/BottomSheet';
import Button from './ui/Button';
import Icon from './Icon';

// Simple destructive confirm. `iconName` optional; `busy` disables actions.
const ConfirmSheet = ({ open, onClose, title, body, confirmLabel, onConfirm, iconName = 'trash', busy = false }) => (
  <BottomSheet open={open} onClose={busy ? () => {} : onClose}>
    <div className="w-[54px] h-[54px] rounded-[16px] grid place-items-center mb-3.5 bg-red/15 text-red">
      <Icon name={iconName} className="w-[26px] h-[26px]" />
    </div>
    <h2 className="font-hand font-bold text-[30px] leading-none m-0 mb-1.5">{title}</h2>
    <p className="text-[13px] text-chalk-dim leading-relaxed m-0 mb-4">{body}</p>
    <Button variant="danger" onClick={onConfirm} disabled={busy}>{confirmLabel}</Button>
    <button onClick={onClose} disabled={busy}
      className="w-full mt-3 font-body font-bold uppercase tracking-[0.1em] text-[13px] py-[15px] rounded-[14px] bg-transparent text-chalk-dim border border-line hover:text-chalk disabled:opacity-40">
      Cancel
    </button>
  </BottomSheet>
);

export default ConfirmSheet;
```

- [ ] **Step 2: DeleteGroupSheet (type-to-confirm)**

Create `src/components/DeleteGroupSheet.jsx`:

```jsx
import { useState, useEffect } from 'react';
import BottomSheet from './ui/BottomSheet';
import Button from './ui/Button';
import Icon from './Icon';

// Type-to-confirm: the destructive button unlocks only when the typed text
// matches the group name exactly (trimmed).
const DeleteGroupSheet = ({ open, onClose, groupName, memberCount, onConfirm, busy = false }) => {
  const [text, setText] = useState('');
  useEffect(() => { if (open) setText(''); }, [open]);
  const armed = text.trim() === groupName;

  return (
    <BottomSheet open={open} onClose={busy ? () => {} : onClose}>
      <h2 className="font-hand font-bold text-[30px] leading-none m-0 mb-1.5 text-red">Delete {groupName}</h2>
      <p className="text-[13px] text-chalk-dim leading-relaxed m-0 mb-4">
        Permanently deletes the group and all schedules, notes &amp; invites for{' '}
        <b>{memberCount} {memberCount === 1 ? 'member' : 'members'}</b>. This cannot be undone.
      </p>
      <label className="block text-[10.5px] tracking-[0.24em] uppercase text-chalk-dim mb-1.5">
        Type the group name to confirm
      </label>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={groupName}
        className="w-full bg-transparent border-0 border-b-[1.5px] border-line text-chalk text-[15px] py-2 px-0.5 outline-none focus:border-coral mb-4"
      />
      <Button variant="danger" onClick={onConfirm} disabled={!armed || busy}>
        <Icon name="trash" className="w-[17px] h-[17px]" />Delete forever
      </Button>
      <button onClick={onClose} disabled={busy}
        className="w-full mt-3 font-body font-bold uppercase tracking-[0.1em] text-[13px] py-[15px] rounded-[14px] bg-transparent text-chalk-dim border border-line hover:text-chalk disabled:opacity-40">
        Cancel
      </button>
    </BottomSheet>
  );
};

export default DeleteGroupSheet;
```

- [ ] **Step 3: Lint & build**

Run: `yarn --cwd packages/web-client-v2 lint && yarn --cwd packages/web-client-v2 build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add packages/web-client-v2/src/components/ConfirmSheet.jsx packages/web-client-v2/src/components/DeleteGroupSheet.jsx
git commit -m "feat(web): ConfirmSheet and DeleteGroupSheet primitives"
```

---

### Task 4: InviteMemberSheet (generate → share/copy)

**Files:**
- Create: `src/components/InviteMemberSheet.jsx`

- [ ] **Step 1: Create the sheet**

Create `src/components/InviteMemberSheet.jsx`:

```jsx
import { useState, useEffect } from 'react';
import BottomSheet from './ui/BottomSheet';
import Button from './ui/Button';
import Icon from './Icon';
import { api } from '../services/api';
import { useToast } from './ui/Toast';

// Builds the shareable link. The random code is authoritative; ?g= is a
// cosmetic name hint read only by the pre-login InvitePage.
const buildInviteUrl = (code, groupName) =>
  `${window.location.origin}/invite/${code}?g=${encodeURIComponent(groupName)}`;

const fmtDate = (iso) => {
  try { return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return ''; }
};

// Explicit "Generate link" (fetch-or-create on tap) avoids minting invites on
// stray opens and gives a clean place to show errors.
const InviteMemberSheet = ({ open, onClose, groupId, groupName, onCreated }) => {
  const toast = useToast();
  const [state, setState] = useState('idle'); // idle | loading | ready | error
  const [invite, setInvite] = useState(null);  // { code, expiresAt }

  useEffect(() => {
    if (open) { setState('idle'); setInvite(null); }
  }, [open]);

  const generate = async () => {
    setState('loading');
    try {
      const inv = await api.createInvite(groupId);
      setInvite(inv);
      setState('ready');
      onCreated?.();
    } catch {
      setState('error');
    }
  };

  const link = invite ? buildInviteUrl(invite.code, groupName) : '';

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: groupName, text: `Join ${groupName} on Meal Planner`, url: link }); }
      catch { /* user cancelled (AbortError) — no-op */ }
    } else {
      copy();
    }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); toast?.('Invite link copied'); }
    catch { toast?.('Could not copy'); }
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="font-hand font-bold text-[30px] leading-none m-0 mb-1.5">Invite to {groupName}</h2>
      {state === 'ready' ? (
        <>
          <p className="text-[13px] text-chalk-dim leading-relaxed m-0 mb-3.5">Anyone with this link can join the group.</p>
          <div className="flex items-center gap-3 p-3.5 border-[1.5px] border-dashed border-chalk-faint rounded-[14px] bg-chalk/[0.04] mb-2.5">
            <Icon name="link" className="w-[18px] h-[18px] text-coral flex-none" />
            <span className="font-mono text-[13px] text-chalk truncate">{`…/invite/${invite.code.slice(0, 8)}…`}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-chalk-dim mb-1 px-0.5">
            <Icon name="clock" className="w-[13px] h-[13px]" />Expires {fmtDate(invite.expiresAt)}
          </div>
          <Button variant="primary" onClick={share}><Icon name="share" className="w-[17px] h-[17px]" />Share link</Button>
          <div className="mt-3"><Button variant="ghost" onClick={copy}><Icon name="copy" className="w-[17px] h-[17px]" />Copy link</Button></div>
        </>
      ) : state === 'error' ? (
        <>
          <p className="text-red text-[13px] m-0 mb-4">Couldn’t create the link. Try again.</p>
          <Button variant="primary" onClick={generate}>Retry</Button>
        </>
      ) : (
        <>
          <p className="text-[13px] text-chalk-dim leading-relaxed m-0 mb-4">Create a shareable link so people can join {groupName}. It stays valid for 7 days.</p>
          <Button variant="primary" onClick={generate} disabled={state === 'loading'}>
            <Icon name="share" className="w-[17px] h-[17px]" />{state === 'loading' ? 'Creating…' : 'Create invite link'}
          </Button>
        </>
      )}
    </BottomSheet>
  );
};

export default InviteMemberSheet;
```

- [ ] **Step 2: Lint & build**

Run: `yarn --cwd packages/web-client-v2 lint && yarn --cwd packages/web-client-v2 build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add packages/web-client-v2/src/components/InviteMemberSheet.jsx
git commit -m "feat(web): InviteMemberSheet (generate + share/copy)"
```

---

### Task 5: CreateGroupSheet & RenameGroupSheet

**Files:**
- Create: `src/components/CreateGroupSheet.jsx`
- Create: `src/components/RenameGroupSheet.jsx`

- [ ] **Step 1: CreateGroupSheet**

Create `src/components/CreateGroupSheet.jsx`. Reuse the existing initials/colors helpers (`src/constants/colors` — `colorForName`, `initialsOf`, already used by `GroupsPage`):

```jsx
import { useState, useEffect } from 'react';
import BottomSheet from './ui/BottomSheet';
import Button from './ui/Button';
import { colorForName, initialsOf } from '../constants/colors';

// Single-field create with a live initials-avatar preview. onCreated(group)
// is called with the API response { id, name }.
const CreateGroupSheet = ({ open, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setName(''); setBusy(false); } }, [open]);

  const trimmed = name.trim();
  const submit = async () => {
    if (!trimmed || busy) return;
    setBusy(true);
    try { await onCreate(trimmed); }
    finally { setBusy(false); }
  };

  return (
    <BottomSheet open={open} onClose={busy ? () => {} : onClose}>
      <h2 className="font-hand font-bold text-[30px] leading-none m-0 mb-1.5">New group</h2>
      <div className="flex justify-center my-4">
        <span className="w-[74px] h-[74px] rounded-[20px] grid place-items-center font-hand font-bold text-[40px] text-slate-0 -rotate-3"
          style={{ background: colorForName(trimmed || '?') }}>
          {initialsOf(trimmed || '?')}
        </span>
      </div>
      <label className="block text-[10.5px] tracking-[0.24em] uppercase text-chalk-dim mb-1.5">Group name</label>
      <input
        autoFocus value={name} maxLength={40} enterKeyHint="done"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="w-full bg-transparent border-0 border-b-[1.5px] border-line text-chalk text-[15px] py-2 px-0.5 outline-none focus:border-coral mb-4"
      />
      <Button variant="primary" onClick={submit} disabled={!trimmed || busy}>{busy ? 'Creating…' : 'Create group'}</Button>
      <div className="mt-3"><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button></div>
    </BottomSheet>
  );
};

export default CreateGroupSheet;
```

- [ ] **Step 2: RenameGroupSheet**

Create `src/components/RenameGroupSheet.jsx`:

```jsx
import { useState, useEffect } from 'react';
import BottomSheet from './ui/BottomSheet';
import Button from './ui/Button';
import { colorForName, initialsOf } from '../constants/colors';

const RenameGroupSheet = ({ open, onClose, currentName, onRename }) => {
  const [name, setName] = useState(currentName || '');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setName(currentName || ''); setBusy(false); } }, [open, currentName]);

  const trimmed = name.trim();
  const submit = async () => {
    if (!trimmed || busy) return;
    setBusy(true);
    try { await onRename(trimmed); }
    finally { setBusy(false); }
  };

  return (
    <BottomSheet open={open} onClose={busy ? () => {} : onClose}>
      <h2 className="font-hand font-bold text-[30px] leading-none m-0 mb-1.5">Rename group</h2>
      <div className="flex justify-center my-4">
        <span className="w-[74px] h-[74px] rounded-[20px] grid place-items-center font-hand font-bold text-[40px] text-slate-0 -rotate-3"
          style={{ background: colorForName(trimmed || '?') }}>{initialsOf(trimmed || '?')}</span>
      </div>
      <label className="block text-[10.5px] tracking-[0.24em] uppercase text-chalk-dim mb-1.5">Group name</label>
      <input
        autoFocus value={name} maxLength={40} enterKeyHint="done"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="w-full bg-transparent border-0 border-b-[1.5px] border-line text-chalk text-[15px] py-2 px-0.5 outline-none focus:border-coral mb-4"
      />
      <Button variant="primary" onClick={submit} disabled={!trimmed || busy}>{busy ? 'Saving…' : 'Save'}</Button>
      <div className="mt-3"><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button></div>
    </BottomSheet>
  );
};

export default RenameGroupSheet;
```

- [ ] **Step 3: Lint & build**

Run: `yarn --cwd packages/web-client-v2 lint && yarn --cwd packages/web-client-v2 build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add packages/web-client-v2/src/components/CreateGroupSheet.jsx packages/web-client-v2/src/components/RenameGroupSheet.jsx
git commit -m "feat(web): CreateGroupSheet and RenameGroupSheet"
```

---

### Task 6: GroupsPage — `＋` create, empty-state CTAs, row `⋮` action sheet

**Files:**
- Modify: `src/pages/GroupsPage.jsx`
- Create: `src/components/GroupActionSheet.jsx`

- [ ] **Step 1: GroupActionSheet (the row `⋮` sheet)**

Create `src/components/GroupActionSheet.jsx`:

```jsx
import BottomSheet from './ui/BottomSheet';
import Icon from './Icon';

// Per-group action sheet (replaces a floating popover). "Open" is the row tap,
// so it's intentionally omitted here. Members get Leave; admins do not.
const ActionRow = ({ iconName, label, danger, onClick }) => (
  <button onClick={onClick}
    className={`flex items-center gap-3.5 w-full py-4 px-1.5 bg-transparent border-0 text-left cursor-pointer rounded-[12px] hover:bg-chalk/[0.06] ${danger ? 'text-red' : 'text-chalk'}`}>
    <Icon name={iconName} className={`w-5 h-5 ${danger ? 'text-red' : 'text-chalk-dim'}`} />
    <span className="font-body font-semibold text-[15px]">{label}</span>
  </button>
);

const GroupActionSheet = ({ open, onClose, group, isAdmin, onSettings, onLeave }) => (
  <BottomSheet open={open} onClose={onClose}>
    <h2 className="font-hand font-bold text-[26px] leading-none m-0 mb-2 pb-3 border-b-[1.5px] border-dashed border-chalk-faint">
      {group?.groupName}
    </h2>
    <ActionRow iconName="gear" label="Group settings" onClick={onSettings} />
    {!isAdmin && <div className="border-t-[1.5px] border-dashed border-chalk-faint mt-1 pt-1">
      <ActionRow iconName="logout" label="Leave group" danger onClick={onLeave} />
    </div>}
  </BottomSheet>
);

export default GroupActionSheet;
```

- [ ] **Step 2: Rewrite GroupsPage — split row, add `＋`, empty-state CTAs, sheets**

Replace `src/pages/GroupsPage.jsx` with:

```jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchedules } from '../contexts/SchedulesContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { colorForName, colorsForNames, initialsOf } from '../constants/colors';
import Icon from '../components/Icon';
import TopBar from '../components/ui/TopBar';
import IconButton from '../components/ui/IconButton';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import CreateGroupSheet from '../components/CreateGroupSheet';
import InviteMemberSheet from '../components/InviteMemberSheet';
import GroupActionSheet from '../components/GroupActionSheet';
import ConfirmSheet from '../components/ConfirmSheet';
import { useToast } from '../components/ui/Toast';

// Row body navigates; the trailing ⋮ is a SIBLING button (no nested buttons).
const GroupRow = ({ group, onOpen, onMenu }) => {
  const members = Object.values(group.members);
  const avatarColors = colorsForNames(members.map((m) => m.memberName));
  return (
    <div className="flex items-center gap-4 py-[18px] border-b border-dashed border-chalk-faint">
      <button onClick={onOpen} className="group flex items-center gap-4 flex-1 min-w-0 text-left bg-transparent border-0 cursor-pointer">
        <span className="flex-none w-[52px] h-[52px] rounded-[14px] grid place-items-center font-hand font-bold text-[30px] text-slate-0 -rotate-3"
          style={{ background: colorForName(group.groupName) }}>{initialsOf(group.groupName)}</span>
        <span className="min-w-0">
          <span className="block font-hand font-bold text-[27px] leading-none group-hover:text-mustard transition-colors truncate">{group.groupName}</span>
          <span className="flex items-center gap-2 text-xs text-chalk-dim mt-1">
            {members.length} {members.length === 1 ? 'member' : 'members'}
            <span className="flex flex-wrap gap-y-1">
              {members.map((m, i) => (
                <span key={i} className="w-6 h-6 rounded-full border-2 border-slate-1 grid place-items-center text-[9.5px] font-bold text-[#1b1f1c] -ml-[7px] first:ml-0"
                  style={{ background: avatarColors[i] }}>{initialsOf(m.memberName)}</span>
              ))}
            </span>
          </span>
        </span>
      </button>
      <button onClick={onMenu} aria-label={`${group.groupName} actions`}
        className="flex-none w-9 h-9 rounded-full grid place-items-center text-chalk-faint bg-transparent border-0 cursor-pointer hover:text-chalk hover:bg-chalk/[0.07]">
        <Icon name="dots" className="w-[18px] h-[18px]" />
      </button>
    </div>
  );
};

const GroupsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { schedules: groups, loading, error, fetchSchedules } = useSchedules();
  const toast = useToast();
  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const [createOpen, setCreateOpen] = useState(false);
  const [inviteFor, setInviteFor] = useState(null);   // { id, name } after create
  const [menuFor, setMenuFor] = useState(null);        // group object
  const [leaveFor, setLeaveFor] = useState(null);      // group object
  const [busy, setBusy] = useState(false);

  const openGroup = (g) => navigate(`/groups/${g.groupId}/${encodeURIComponent(g.groupName)}`);

  const handleCreate = async (name) => {
    const g = await api.createGroup(name);
    await fetchSchedules(true);
    setCreateOpen(false);
    setInviteFor({ id: g.id, name: g.name }); // auto-open invite sheet
  };

  const handleLeave = async () => {
    if (!leaveFor) return;
    setBusy(true);
    try {
      await api.leaveGroup(leaveFor.groupId, user.memberId);
      await fetchSchedules(true);
      toast?.('You left the group');
      setLeaveFor(null);
    } catch {
      toast?.('Could not leave the group');
    } finally { setBusy(false); }
  };

  return (
    <div>
      <TopBar title="Your groups" sub={`${groups.length} ${groups.length === 1 ? 'group' : 'groups'}`}
        right={<IconButton name="plus" label="New group" onClick={() => setCreateOpen(true)} />} />
      <div className="px-5 pb-6">
        {loading ? (
          <Spinner label="Loading your groups…" />
        ) : error ? (
          <div className="text-red text-sm py-4">{error}</div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-12 px-2">
            <div className="w-28 h-28 rounded-full border-2 border-dashed border-chalk-faint grid place-items-center mb-6 text-chalk-faint">
              <Icon name="meal" className="w-[52%] h-[52%]" />
            </div>
            <h2 className="font-hand font-bold text-[34px] m-0 mb-2 text-chalk">No groups yet</h2>
            <p className="text-chalk-dim text-[13.5px] leading-relaxed max-w-[235px] m-0 mb-5">
              Start a group for your household, or join one with an invite link to begin planning meals together.
            </p>
            <div className="w-full max-w-[230px]">
              <Button variant="primary" onClick={() => setCreateOpen(true)}><Icon name="plus" className="w-[17px] h-[17px]" />New group</Button>
            </div>
          </div>
        ) : (
          groups.map((g) => (
            <GroupRow key={g.groupId} group={g} onOpen={() => openGroup(g)} onMenu={() => setMenuFor(g)} />
          ))
        )}
      </div>

      <CreateGroupSheet open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
      <InviteMemberSheet open={inviteFor !== null} onClose={() => setInviteFor(null)}
        groupId={inviteFor?.id} groupName={inviteFor?.name} />
      <GroupActionSheet open={menuFor !== null} onClose={() => setMenuFor(null)} group={menuFor}
        isAdmin={menuFor ? menuFor.members[user.memberId]?.admin === true : false}
        onSettings={() => { const g = menuFor; setMenuFor(null); navigate(`/groups/${g.groupId}/settings`); }}
        onLeave={() => { const g = menuFor; setMenuFor(null); setLeaveFor(g); }} />
      <ConfirmSheet open={leaveFor !== null} onClose={() => setLeaveFor(null)}
        iconName="logout" title={`Leave ${leaveFor?.groupName}?`}
        body="Your schedules and notes for this group will be removed. You can rejoin later with an invite link."
        confirmLabel="Leave group" onConfirm={handleLeave} busy={busy} />
    </div>
  );
};

export default GroupsPage;
```

- [ ] **Step 3: Lint, build, manual check**

Run: `yarn --cwd packages/web-client-v2 lint && yarn --cwd packages/web-client-v2 build`, then `yarn --cwd packages/web-client-v2 dev`.
Manual: the list shows a `＋` in the bar; each row has a `⋮` opening the action sheet; tapping the row body still opens the schedule; the empty state (an account in no groups) shows "New group"; creating a group opens the invite sheet.
Expected: all behave as described; no nested-button warnings in the console.

- [ ] **Step 4: Commit**

```bash
git add packages/web-client-v2/src/pages/GroupsPage.jsx packages/web-client-v2/src/components/GroupActionSheet.jsx
git commit -m "feat(web): GroupsPage create + row action sheet + empty-state CTA"
```

---

### Task 7: MemberRow + GroupSettingsPage scaffold (identity + rename) + route + gear

**Files:**
- Create: `src/components/MemberRow.jsx`
- Create: `src/pages/GroupSettingsPage.jsx`
- Modify: `src/App.jsx` (route)
- Modify: `src/pages/GroupSchedulePage.jsx` (gear)

- [ ] **Step 1: MemberRow**

Create `src/components/MemberRow.jsx`:

```jsx
import Icon from './Icon';
import { colorForName, initialsOf } from '../constants/colors';

// One roster row. `onRemove` (admin, non-self, non-admin targets) renders a trash button.
const MemberRow = ({ name, isAdmin, isYou, onRemove }) => (
  <div className="flex items-center gap-3.5 py-3 border-b border-line last:border-b-0">
    <span className="w-[38px] h-[38px] rounded-full grid place-items-center text-[13px] font-bold text-[#1b1f1c] flex-none"
      style={{ background: colorForName(name) }}>{initialsOf(name)}</span>
    <div className="flex-1 min-w-0 text-[15px] font-semibold flex items-center gap-2 flex-wrap">
      {name}
      {isAdmin && (
        <span className="inline-flex items-center gap-1.5 font-body font-bold text-[9.5px] tracking-[0.12em] uppercase text-mustard bg-mustard/15 border border-mustard/40 py-0.5 pl-1.5 pr-2 rounded-full">
          <Icon name="crown" className="w-[11px] h-[11px]" />Admin
        </span>
      )}
      {isYou && <span className="text-[9.5px] tracking-[0.12em] uppercase text-chalk-faint">· You</span>}
    </div>
    {onRemove && (
      <button onClick={onRemove} aria-label={`Remove ${name}`}
        className="w-[34px] h-[34px] rounded-[9px] grid place-items-center text-chalk-faint bg-transparent border border-transparent cursor-pointer hover:text-red hover:border-red/40 hover:bg-red/[0.08]">
        <Icon name="trash" className="w-[17px] h-[17px]" />
      </button>
    )}
  </div>
);

export default MemberRow;
```

- [ ] **Step 2: GroupSettingsPage scaffold — identity + rename (members/invites/danger added next tasks)**

Create `src/pages/GroupSettingsPage.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSchedules } from '../contexts/SchedulesContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import TopBar from '../components/ui/TopBar';
import IconButton from '../components/ui/IconButton';
import Spinner from '../components/ui/Spinner';
import Icon from '../components/Icon';
import RenameGroupSheet from '../components/RenameGroupSheet';
import { colorForName, initialsOf } from '../constants/colors';
import { useToast } from '../components/ui/Toast';

const SectionLabel = ({ children, danger }) => (
  <div className={`text-[10.5px] tracking-[0.24em] uppercase mt-[22px] mb-2.5 ${danger ? 'text-red' : 'text-chalk-faint'}`}>{children}</div>
);

const GroupSettingsPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { schedules, loading, fetchSchedules, getGroup } = useSchedules();
  const toast = useToast();
  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const [renameOpen, setRenameOpen] = useState(false);

  const group = getGroup(groupId);
  if (loading && !group) {
    return (<div><TopBar title="Group settings" left={<IconButton name="back" label="Back" onClick={() => navigate('/')} className="ml-0" />} /><div className="px-5"><Spinner label="Loading…" /></div></div>);
  }
  if (!group) {
    return (<div><TopBar title="Group settings" left={<IconButton name="back" label="Back" onClick={() => navigate('/')} className="ml-0" />} /><div className="px-5 text-red text-sm py-4">Group not found.</div></div>);
  }

  const isAdmin = group.members[user.memberId]?.admin === true;
  const memberCount = Object.keys(group.members).length;

  const handleRename = async (name) => {
    try { await api.renameGroup(groupId, name); await fetchSchedules(true); setRenameOpen(false); toast?.('Group renamed'); }
    catch { toast?.('Could not rename'); }
  };

  return (
    <div className="min-h-dvh">
      <TopBar title={group.groupName} sub="Group settings"
        left={<IconButton name="back" label="Back" onClick={() => navigate('/')} className="ml-0" />} />
      <div className="px-5 pb-10">
        {/* Identity */}
        <div className="flex items-center gap-4 pt-1.5">
          <span className="w-16 h-16 rounded-[18px] grid place-items-center font-hand font-bold text-[36px] text-slate-0 -rotate-3 flex-none"
            style={{ background: colorForName(group.groupName) }}>{initialsOf(group.groupName)}</span>
          <div className="flex-1 min-w-0">
            <div className="font-hand font-bold text-[30px] leading-none truncate">{group.groupName}</div>
            <div className="text-xs text-chalk-dim mt-1">{memberCount} {memberCount === 1 ? 'member' : 'members'}</div>
          </div>
          {isAdmin && <IconButton name="pencil" label="Rename group" onClick={() => setRenameOpen(true)} />}
        </div>

        {/* Members / Invites / Danger zone are added in Tasks 8–10, gated by isAdmin. */}
        <SectionLabel>Members · {memberCount}</SectionLabel>
        {/* placeholder list rendered in Task 8 */}
      </div>

      <RenameGroupSheet open={renameOpen} onClose={() => setRenameOpen(false)} currentName={group.groupName} onRename={handleRename} />
    </div>
  );
};

export default GroupSettingsPage;
```

> Note: the `SectionLabel` "Members" header with no list is a deliberate scaffold seam — Task 8 fills it. (Not a placeholder requirement: the page renders and is navigable now.)

- [ ] **Step 3: Add the route (protected)**

In `src/App.jsx`: import the page and add the route inside the existing `<Routes>` (after the schedule routes):

```jsx
import GroupSettingsPage from './pages/GroupSettingsPage';
```
```jsx
            <Route path="/groups/:groupId/settings" element={<ProtectedRoute><GroupSettingsPage /></ProtectedRoute>} />
```

- [ ] **Step 4: Add the gear to GroupSchedulePage**

In `src/pages/GroupSchedulePage.jsx`, the `TopBar` currently has a single `right` IconButton (Default schedule). Replace the `right={...}` prop with both the gear and the existing repeat button:

```jsx
        right={<>
          <IconButton name="gear" label="Group settings" onClick={() => navigate(`/groups/${groupId}/settings`)} />
          <IconButton name="repeat" label="Default schedule" onClick={() => navigate(`/groups/${groupId}/${groupName}/default`)} />
        </>}
```

(`TopBar` already wraps `right` in a flex row, so the fragment renders both.)

- [ ] **Step 5: Lint, build, manual check**

Run lint+build, then `dev`. Manual: open a group → tap the gear → lands on Group Settings showing identity + member count; admins see the rename pencil and can rename; back button returns home.
Expected: as described.

- [ ] **Step 6: Commit**

```bash
git add packages/web-client-v2/src/components/MemberRow.jsx packages/web-client-v2/src/pages/GroupSettingsPage.jsx packages/web-client-v2/src/App.jsx packages/web-client-v2/src/pages/GroupSchedulePage.jsx
git commit -m "feat(web): GroupSettingsPage scaffold + rename + gear entry"
```

---

### Task 8: GroupSettingsPage — Members section + kick

**Files:**
- Modify: `src/pages/GroupSettingsPage.jsx`

- [ ] **Step 1: Render the roster and wire kick**

In `GroupSettingsPage.jsx`: import `MemberRow` and `ConfirmSheet`, add kick state, and replace the `{/* placeholder list rendered in Task 8 */}` seam with the roster.

Add imports:
```jsx
import MemberRow from '../components/MemberRow';
import ConfirmSheet from '../components/ConfirmSheet';
```
Add state (near `renameOpen`):
```jsx
  const [kickFor, setKickFor] = useState(null); // { id, name }
  const [busy, setBusy] = useState(false);
```
Add handler (near `handleRename`):
```jsx
  const handleKick = async () => {
    if (!kickFor) return;
    setBusy(true);
    try { await api.kickMember(groupId, kickFor.id); await fetchSchedules(true); toast?.(`${kickFor.name} removed`); setKickFor(null); }
    catch { toast?.('Could not remove member'); }
    finally { setBusy(false); }
  };
```
Replace the seam with:
```jsx
        <SectionLabel>Members · {memberCount}</SectionLabel>
        {Object.entries(group.members).map(([memberId, m]) => (
          <MemberRow key={memberId} name={m.memberName} isAdmin={m.admin === true}
            isYou={memberId === user.memberId}
            onRemove={isAdmin && !m.admin && memberId !== user.memberId ? () => setKickFor({ id: memberId, name: m.memberName }) : undefined} />
        ))}
```
Add the sheet before the closing `</div>` that wraps the page (next to `RenameGroupSheet`):
```jsx
      <ConfirmSheet open={kickFor !== null} onClose={() => setKickFor(null)}
        iconName="trash" title={`Remove ${kickFor?.name}?`}
        body={`This deletes all of ${kickFor?.name}'s schedules and notes in ${group.groupName}. They can be re-invited later.`}
        confirmLabel="Remove" onConfirm={handleKick} busy={busy} />
```

- [ ] **Step 2: Lint, build, manual check**

Manual: admin sees a trash button on every non-admin, non-self row; tapping it confirms then removes the member (list refreshes). A non-admin member sees the roster with no trash buttons. The admin's own row and other admins (n/a — single admin) show no trash.
Expected: as described.

- [ ] **Step 3: Commit**

```bash
git add packages/web-client-v2/src/pages/GroupSettingsPage.jsx
git commit -m "feat(web): members roster + kick in GroupSettingsPage"
```

---

### Task 9: GroupSettingsPage — Invites section (create / list / revoke)

**Files:**
- Modify: `src/pages/GroupSettingsPage.jsx`

- [ ] **Step 1: Add invites state + loader (admin only)**

Add imports:
```jsx
import Button from '../components/ui/Button';
import InviteMemberSheet from '../components/InviteMemberSheet';
```
Add state:
```jsx
  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [revokeFor, setRevokeFor] = useState(null); // code
```
Add a loader effect (only when admin) — place after the early returns is not possible (hooks rule), so guard inside:
```jsx
  useEffect(() => {
    let active = true;
    const g = getGroup(groupId);
    if (!g || g.members[user.memberId]?.admin !== true) return;
    setInvitesLoading(true);
    api.listInvites(groupId)
      .then((r) => { if (active) setInvites(r.invites || []); })
      .catch(() => { if (active) setInvites([]); })
      .finally(() => { if (active) setInvitesLoading(false); });
    return () => { active = false; };
  }, [groupId, getGroup, user.memberId, schedules]);
```
Add handlers:
```jsx
  const reloadInvites = async () => {
    try { const r = await api.listInvites(groupId); setInvites(r.invites || []); } catch { /* keep */ }
  };
  const handleRevoke = async () => {
    if (!revokeFor) return;
    setBusy(true);
    try { await api.revokeInvite(groupId, revokeFor); await reloadInvites(); toast?.('Invite revoked'); setRevokeFor(null); }
    catch { toast?.('Could not revoke'); }
    finally { setBusy(false); }
  };
  const relExpiry = (iso) => {
    const days = Math.max(0, Math.ceil((new Date(iso) - Date.now()) / 86400000));
    return days <= 1 ? 'expires soon' : `expires in ${days}d`;
  };
```

- [ ] **Step 2: Render the section (admin only) + sheets**

Add after the Members block:
```jsx
        {isAdmin && (
          <>
            <SectionLabel>Invite people</SectionLabel>
            <Button variant="primary" onClick={() => setInviteOpen(true)}><Icon name="share" className="w-[17px] h-[17px]" />Create invite link</Button>
            <div className="mt-3.5">
              {invitesLoading ? (
                <Spinner label="Loading invites…" />
              ) : invites.length === 0 ? (
                <div className="text-chalk-faint italic font-hand text-[18px] px-0.5 py-1.5">No active invite links — create one to add people.</div>
              ) : invites.map((inv) => (
                <div key={inv.code} className="flex items-center gap-3 py-2.5 px-3 border border-line rounded-[13px] bg-chalk/[0.04] mb-2.5">
                  <Icon name="link" className="w-4 h-4 text-coral flex-none" />
                  <span className="font-mono text-[13px] truncate">{inv.code.slice(0, 8)}…</span>
                  <span className="text-[11px] text-chalk-dim ml-auto">{relExpiry(inv.expiresAt)}</span>
                  <button onClick={() => setRevokeFor(inv.code)} aria-label="Revoke invite"
                    className="w-[34px] h-[34px] rounded-[9px] grid place-items-center text-chalk-faint bg-transparent border border-transparent cursor-pointer hover:text-red hover:border-red/40 hover:bg-red/[0.08]">
                    <Icon name="trash" className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
```
Add sheets (next to the others):
```jsx
      <InviteMemberSheet open={inviteOpen} onClose={() => { setInviteOpen(false); reloadInvites(); }}
        groupId={groupId} groupName={group.groupName} onCreated={reloadInvites} />
      <ConfirmSheet open={revokeFor !== null} onClose={() => setRevokeFor(null)}
        iconName="trash" title="Revoke this invite?"
        body="The link stops working immediately. People who already joined stay in the group."
        confirmLabel="Revoke link" onConfirm={handleRevoke} busy={busy} />
```

- [ ] **Step 2b: Reconcile the duplicate `InviteMemberSheet` import**

`GroupsPage` and `GroupSettingsPage` each import `InviteMemberSheet` independently — that's fine (separate files). Within `GroupSettingsPage`, ensure `InviteMemberSheet` is imported exactly once (Step 1 of this task).

- [ ] **Step 3: Lint, build, manual check**

Manual: admin sees "Create invite link" → opens sheet → "Create invite link" mints + shows Share/Copy → closing refreshes the active list, which shows the new code + expiry + a revoke trash; revoke confirms then removes it. A non-admin member does not see the Invites section at all.
Expected: as described.

- [ ] **Step 4: Commit**

```bash
git add packages/web-client-v2/src/pages/GroupSettingsPage.jsx
git commit -m "feat(web): invites section (create/list/revoke) in GroupSettingsPage"
```

---

### Task 10: GroupSettingsPage — Danger zone (delete / leave)

**Files:**
- Modify: `src/pages/GroupSettingsPage.jsx`

- [ ] **Step 1: Add delete/leave state + handlers**

Add import:
```jsx
import DeleteGroupSheet from '../components/DeleteGroupSheet';
```
Add state:
```jsx
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
```
Add handlers:
```jsx
  const handleDelete = async () => {
    setBusy(true);
    try { await api.deleteGroup(groupId); await fetchSchedules(true); toast?.('Group deleted'); navigate('/'); }
    catch { toast?.('Could not delete group'); setBusy(false); }
  };
  const handleLeave = async () => {
    setBusy(true);
    try { await api.leaveGroup(groupId, user.memberId); await fetchSchedules(true); toast?.('You left the group'); navigate('/'); }
    catch { toast?.('Could not leave the group'); setBusy(false); }
  };
```

- [ ] **Step 2: Render the danger zone + sheets**

Add after the Invites block:
```jsx
        <SectionLabel danger>Danger zone</SectionLabel>
        <div className="border-[1.5px] border-dashed border-red/50 rounded-[16px] p-4 bg-red/[0.05]">
          {isAdmin ? (
            <>
              <p className="text-[12.5px] text-chalk-dim leading-relaxed m-0 mb-1">Deletes the group and all schedules, notes &amp; invites for everyone. This can’t be undone.</p>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}><Icon name="trash" className="w-[17px] h-[17px]" />Delete group</Button>
            </>
          ) : (
            <>
              <p className="text-[12.5px] text-chalk-dim leading-relaxed m-0 mb-1">Leaving removes your schedules &amp; notes from {group.groupName}. You can rejoin with an invite link.</p>
              <Button variant="danger" onClick={() => setLeaveOpen(true)}><Icon name="logout" className="w-[17px] h-[17px]" />Leave group</Button>
            </>
          )}
        </div>
```
Add sheets:
```jsx
      <DeleteGroupSheet open={deleteOpen} onClose={() => setDeleteOpen(false)}
        groupName={group.groupName} memberCount={memberCount} onConfirm={handleDelete} busy={busy} />
      <ConfirmSheet open={leaveOpen} onClose={() => setLeaveOpen(false)}
        iconName="logout" title={`Leave ${group.groupName}?`}
        body="Your schedules and notes for this group will be removed. You can rejoin later with an invite link."
        confirmLabel="Leave group" onConfirm={handleLeave} busy={busy} />
```

- [ ] **Step 3: Lint, build, manual check**

Manual: admin sees "Delete group" → type-to-confirm unlocks the red button → deletes → returns home (group gone). Member sees "Leave group" → confirm → leaves → returns home. The sole admin never sees "Leave".
Expected: as described.

- [ ] **Step 4: Commit**

```bash
git add packages/web-client-v2/src/pages/GroupSettingsPage.jsx
git commit -m "feat(web): danger zone (delete/leave) in GroupSettingsPage"
```

---

### Task 11: InvitePage (public landing) + route

**Files:**
- Create: `src/pages/InvitePage.jsx`
- Modify: `src/App.jsx` (unguarded route)

- [ ] **Step 1: Create InvitePage**

Create `src/pages/InvitePage.jsx`:

```jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSchedules } from '../contexts/SchedulesContext';
import { api, ApiError } from '../services/api';
import { setPendingInvite, clearPendingInvite } from '../services/pendingInvite';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Icon from '../components/Icon';
import { colorForName, initialsOf } from '../constants/colors';

// States: loading | anon | confirm | awaiting | joining | already | expired | error
const InvitePage = () => {
  const { code } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { fetchSchedules } = useSchedules();

  // ?g= is a cosmetic hint only; render as plain (auto-escaped) text.
  const hintName = (params.get('g') || '').slice(0, 60);

  const [state, setState] = useState('loading');
  const [groupName, setGroupName] = useState(hintName);

  // Load the authoritative invite (authenticated + approved only).
  const load = useCallback(async () => {
    setState('loading');
    try {
      const inv = await api.getInvite(code);
      setGroupName(inv.groupName);
      setState('confirm');
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) { setState('awaiting'); return; }   // not approved yet
      if (e instanceof ApiError && e.status === 404) { clearPendingInvite(); setState('expired'); return; }
      setState('error');
    }
  }, [code]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      setPendingInvite(code);   // bridge across login/approval
      setState('anon');
      return;
    }
    load();
  }, [isLoading, isAuthenticated, code, load]);

  const join = async () => {
    setState('joining');
    try {
      const res = await api.redeemInvite(code);
      clearPendingInvite();
      await fetchSchedules(true);
      if (res.alreadyMember) { setGroupName(res.groupName); setState('already'); return; }
      navigate(`/groups/${res.groupId}/${encodeURIComponent(res.groupName)}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) { setState('awaiting'); return; }
      if (e instanceof ApiError && e.status === 404) { clearPendingInvite(); setState('expired'); return; }
      setState('error');
    }
  };

  const Crest = ({ children, tone }) => (
    <div className={`w-24 h-24 rounded-full grid place-items-center mb-6 ${tone || 'border-2 border-dashed border-coral'}`}>{children}</div>
  );
  const Mark = ({ name }) => (
    <span className="w-[74px] h-[74px] rounded-[20px] grid place-items-center font-hand font-bold text-[40px] text-slate-0 -rotate-3"
      style={{ background: colorForName(name || '?') }}>{initialsOf(name || '?')}</span>
  );

  const wrap = (children) => (
    <div className="min-h-dvh flex flex-col items-center justify-center text-center px-8 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
  );

  if (state === 'loading' || isLoading) return wrap(<Spinner label="Checking invite…" />);

  if (state === 'anon') return wrap(<>
    <Crest><Mark name={groupName} /></Crest>
    <div className="font-body font-semibold tracking-[0.28em] uppercase text-[11px] text-coral mb-2.5">You’ve been invited</div>
    <h2 className="font-hand font-bold text-[46px] leading-[0.9] m-0 mb-1.5">{groupName ? <>Join<br /><span className="text-mustard">{groupName}</span></> : <>Join a group<br />on Meal&nbsp;Planner</>}</h2>
    <p className="text-chalk-dim text-[13.5px] leading-relaxed max-w-[250px] m-0 mb-6">Sign in or create an account to start planning meals with the group.</p>
    <div className="w-full max-w-[250px]">
      <Button variant="primary" onClick={() => navigate('/login')}>Sign in to join</Button>
      <div className="mt-3"><Button variant="ghost" onClick={() => navigate('/signup')}>Create account</Button></div>
    </div>
  </>);

  if (state === 'confirm') return wrap(<>
    <Crest><Mark name={groupName} /></Crest>
    <div className="font-body font-semibold tracking-[0.28em] uppercase text-[11px] text-coral mb-2.5">Invitation</div>
    <h2 className="font-hand font-bold text-[46px] leading-[0.9] m-0 mb-1.5">Join<br /><span className="text-mustard">{groupName}</span>?</h2>
    <p className="text-chalk-dim text-[13.5px] leading-relaxed max-w-[250px] m-0 mb-6">You’ll join as a member and can set your meals straight away.</p>
    <div className="w-full max-w-[250px]">
      <Button variant="primary" onClick={join}><Icon name="check" className="w-[17px] h-[17px]" />Join group</Button>
      <div className="mt-3"><Button variant="ghost" onClick={() => navigate('/')}>Not now</Button></div>
    </div>
  </>);

  if (state === 'joining') return wrap(<Spinner label="Joining…" />);

  if (state === 'awaiting') return wrap(<>
    <Crest tone="border-2 border-dashed border-mustard"><Icon name="clock" className="w-[46%] h-[46%] text-mustard" /></Crest>
    <h2 className="font-hand font-bold text-[40px] leading-[0.9] m-0 mb-2">Awaiting<br />approval</h2>
    <p className="text-chalk-dim text-[13.5px] leading-relaxed max-w-[250px] m-0 mb-6">Your account is pending approval. You’ll join {groupName || 'the group'} automatically once an administrator approves you.</p>
    <div className="w-full max-w-[250px]"><Button variant="ghost" onClick={() => navigate('/')}>Back to your groups</Button></div>
  </>);

  if (state === 'already') return wrap(<>
    <Crest tone="border-2 border-sage"><Icon name="check" className="w-[46%] h-[46%] text-sage" /></Crest>
    <h2 className="font-hand font-bold text-[40px] leading-[0.9] m-0 mb-2">You’re already in <span className="text-mustard">{groupName}</span></h2>
    <div className="w-full max-w-[250px]"><Button variant="primary" onClick={() => navigate('/')}>Open your groups</Button></div>
  </>);

  if (state === 'expired') return wrap(<>
    <Crest tone="border-2 border-red"><Icon name="clock" className="w-[46%] h-[46%] text-red" /></Crest>
    <h2 className="font-hand font-bold text-[40px] leading-[0.9] m-0 mb-2">Invite<br />expired</h2>
    <p className="text-chalk-dim text-[13.5px] leading-relaxed max-w-[250px] m-0 mb-6">This invite link has expired or was revoked. Ask the group admin for a fresh one.</p>
    <div className="w-full max-w-[250px]"><Button variant="ghost" onClick={() => navigate('/')}>Back to your groups</Button></div>
  </>);

  // error / network
  return wrap(<>
    <Crest tone="border-2 border-dashed border-chalk-faint"><Icon name="refresh" className="w-[46%] h-[46%] text-chalk-faint" /></Crest>
    <h2 className="font-hand font-bold text-[40px] leading-[0.9] m-0 mb-2">Something<br />went wrong</h2>
    <p className="text-chalk-dim text-[13.5px] leading-relaxed max-w-[250px] m-0 mb-6">Couldn’t reach the server. Check your connection and try again.</p>
    <div className="w-full max-w-[250px]"><Button variant="primary" onClick={load}>Try again</Button></div>
  </>);
};

export default InvitePage;
```

- [ ] **Step 2: Register the route OUTSIDE both guards**

In `src/App.jsx`: import and add a bare route (not wrapped in `ProtectedRoute`/`PublicRoute`) — `InvitePage` branches on auth itself:

```jsx
import InvitePage from './pages/InvitePage';
```
```jsx
            <Route path="/invite/:code" element={<InvitePage />} />
```

- [ ] **Step 3: Lint, build, manual check**

Manual:
- Logged out: open `/invite/SOMECODE?g=Family%20Table` → "Join Family Table" with Sign in / Create account; the code is stored in `localStorage.pendingInviteCode`.
- Logged in + approved, valid code: shows "Join \<server name\>?" → Join → lands in the group (or "already in" if a member).
- Expired/revoked code: shows the expired card.
Expected: as described. (The approved/unapproved 403 branch is exercised in Task 13's verification.)

- [ ] **Step 4: Commit**

```bash
git add packages/web-client-v2/src/pages/InvitePage.jsx packages/web-client-v2/src/App.jsx
git commit -m "feat(web): public InvitePage + /invite/:code route"
```

---

### Task 12: PendingInviteHandler — return to the invite after login/approval

**Files:**
- Create: `src/components/PendingInviteHandler.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create the handler**

Create `src/components/PendingInviteHandler.jsx`:

```jsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPendingInvite } from '../services/pendingInvite';

// When an authenticated session resolves (login OR a silent token refresh after
// admin approval) and a pending invite code is stored, route the user to the
// invite page so the redeem completes. Runs for ANY authenticated session, not
// just an explicit login submit. InvitePage clears the code on success.
const PendingInviteHandler = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (location.pathname.startsWith('/invite/')) return; // already there
    const code = getPendingInvite();
    if (code) navigate(`/invite/${code}`, { replace: true });
  }, [isLoading, isAuthenticated, location.pathname, navigate]);

  return null;
};

export default PendingInviteHandler;
```

- [ ] **Step 2: Mount it inside the Router/auth tree**

In `src/App.jsx`, render `<PendingInviteHandler />` inside `<SchedulesProvider>`, just above `<Routes>`:

```jsx
import PendingInviteHandler from './components/PendingInviteHandler';
```
```jsx
        <SchedulesProvider>
          <PendingInviteHandler />
          <Routes>
            {/* …existing routes… */}
          </Routes>
        </SchedulesProvider>
```

- [ ] **Step 3: Lint, build, manual check**

Manual (full handoff): log out; open `/invite/CODE?g=Test`; tap "Sign in to join"; complete login → you are redirected to `/invite/CODE` and (if approved) see the Join confirm. For the approval case: with an **unapproved** test account, after login the invite page shows **"Awaiting approval"** and the code remains stored; once approved and the token refreshes (re-open the app), the handler routes back and the join completes.
Expected: as described.

- [ ] **Step 4: Commit**

```bash
git add packages/web-client-v2/src/components/PendingInviteHandler.jsx packages/web-client-v2/src/App.jsx
git commit -m "feat(web): PendingInviteHandler routes to invite after login/approval"
```

---

### Task 13: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Lint + build clean**

Run: `yarn --cwd packages/web-client-v2 lint && yarn --cwd packages/web-client-v2 build`
Expected: no errors/warnings.

- [ ] **Step 2: End-to-end manual matrix (dev server against the deployed/local API)**

Verify each, as admin and as a member where relevant:
- Create group (TopBar `＋` and empty-state CTA) → lands → invite sheet auto-opens → generate → Share (native sheet on mobile) / Copy (toast appears above the sheet).
- Group row `⋮` → action sheet → Group settings; member also sees Leave.
- Settings: rename (admin), kick a member (admin), member sees read-only roster + Leave.
- Invites: create, the active list shows it with expiry, revoke removes it; non-admin sees no Invites section.
- Delete group (admin, type-to-confirm) → home; Leave group (member) → home; sole admin sees Delete only.
- `/invite/:code`: anonymous (named via `?g=`, and generic with no `?g=`), logged-in confirm/join, already-member, expired, awaiting-approval (unapproved account), network-retry (stop the API, tap Try again).
- Route guard: a logged-in user opening `/invite/:code` is NOT bounced to `/` (it’s outside `PublicRoute`).

- [ ] **Step 3: Commit any fixes**

```bash
git add -A && git commit -m "fix(web): group-management verification fixes"
```

---

### Task 14: Update frontend docs

**Files:**
- Modify: `.claude/ui.md`

- [ ] **Step 1: Move group-management items from "Planned" to implemented**

In `.claude/ui.md`:
- Add `GroupSettingsPage.jsx` (role-adaptive admin panel) and `InvitePage.jsx` (`/invite/:code`) to Implemented Pages; remove them from "Planned / not implemented".
- Add components: `CreateGroupSheet`, `RenameGroupSheet`, `InviteMemberSheet`, `GroupActionSheet`, `ConfirmSheet`, `DeleteGroupSheet`, `MemberRow`, `PendingInviteHandler`.
- Add routes: `/groups/:groupId/settings` (Required) and `/invite/:code` (Public, outside both guards).
- Note: GroupsPage now has a `＋` create + per-row `⋮` action sheet + functional empty-state CTA; invite-code persistence (`pendingInvite.js`) is implemented; new chalk icons added (`dots, plus, trash, share, crown, pencil, link, check, clock`).

- [ ] **Step 2: Commit**

```bash
git add .claude/ui.md
git commit -m "docs: mark group-management UI implemented in ui.md"
```

---

## Self-Review

**Spec coverage (§5 of the spec):**
- IA: role-adaptive GroupSettingsPage via gear + row `⋮` action sheet → Tasks 6, 7. ✅
- Create group (`＋` + empty-state CTA + sheet + auto-open invite) → Tasks 5, 6. ✅
- Settings sections (identity/rename, members/kick, invites create/list/revoke, danger delete/leave) → Tasks 7–10. ✅
- Invite link `?g=` + Web Share + Copy + absolute expiry → Task 4. ✅
- InvitePage outside both guards, branch after auth-loading; states incl. anon(named/generic)/confirm/joining/already/expired/network-retry/**awaiting-approval** → Tasks 11, 12. ✅
- `?g=` escaped text only (React default; no `dangerouslySetInnerHTML`) → Task 11. ✅
- localStorage handoff + 7-day TTL + robust redeem on any session + never block login → Tasks 2, 11, 12. ✅
- API client surfaces status (ApiError) → Task 2. ✅
- Components inventory + GroupRow refactor (sibling `⋮`) → Tasks 3–7. ✅
- Toast above sheet → already satisfied (`z-50`/`z-40`); noted, no task needed. ✅
- a11y (aria-labels, safe-area on InvitePage, focus) → Tasks 6/7/11 (aria-labels + safe-area padding present). ✅
- Docs → Task 14. ✅

**Deferred (correctly absent):** `⋮` popover (replaced by sheet), max-uses, rate limiting, transfer-admin, server-side pending-join (#3).

**Type/name consistency:** `api` methods (`createGroup/renameGroup/deleteGroup/createInvite/listInvites/getInvite/redeemInvite/revokeInvite/kickMember/leaveGroup`) defined in Task 2 and used in Tasks 4,6–11. `ApiError.status` (Task 2) consumed in Task 11. Role check `group.members[user.memberId]?.admin` used identically in Tasks 6, 7, 9. Sheets' prop shapes (`open,onClose,onConfirm,busy`) consistent across Tasks 3,6,8–10. `pendingInvite` API (`setPendingInvite/getPendingInvite/clearPendingInvite`) defined in Task 2, used in Tasks 11, 12.

**Placeholder scan:** the only intentional "seam" (Members header in Task 7) is filled in Task 8 and explicitly annotated; no TODO/TBD; every code step is complete; every verify step lists concrete expected behavior.
