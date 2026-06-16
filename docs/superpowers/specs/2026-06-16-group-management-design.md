# Group Management — Design Spec

**Date:** 2026-06-16
**Status:** Approved for planning
**Scope:** Create group · rename group · invite people (reusable link + revoke) · kick member · leave group · delete group
**UX reference:** `docs/ui-design/group-mgmt/group-mgmt.html` (Ardoise mockup, all screens)

---

## 1. Overview

Today the app can create a group (`POST /api/groups`) and add a member by Cognito username (`CreateMember`), but there is **no user-facing group-management UI** and no invite/kick/leave/delete/rename endpoints. This release delivers the full group-management surface: a role-adaptive **Group Settings** page, a self-service **invite-link** flow with a public landing page, and the supporting backend endpoints — with the security hardening agreed during review folded in.

The original ask was "invites"; exploration widened it to the whole group-management feature set, so the spec is scoped accordingly.

## 2. Role model (fixed)

- Each group has **exactly one GroupAdmin** (its creator). Everyone else is a regular **Member**.
- **Admin** can: rename, invite, revoke invites, kick members, delete the group. Admin **cannot leave** their own group (sole admin) — they delete it instead. (Transfer-admin is future, out of scope.)
- **Member** can: view/set own schedule, add comments/notices, and **leave** the group.
- The per-member `admin` boolean is already present in the group schedule payload (`MemberScheduleResponse.admin`), so the frontend can role-gate without a new endpoint.

## 3. Locked decisions

| Topic | Decision |
|---|---|
| Invite reuse | **Reusable link**, valid 7 days; redeeming makes a regular Member. Not consumed on redeem. |
| Invite code | Random, **crypto-strong**, **~128-bit** (reuse `google/uuid` source via `helper.NewId`); opaque. |
| Group-name preview pre-login | Carried in the link as a **cosmetic `?g=` query hint** (untrusted, display-only). **No public API endpoint.** |
| Guests | Out of scope — redeem always creates a regular Member (`SystemDefaultWeeklySchedule`). |
| Invite management UI | **List + revoke** in the admin panel. |
| Post-create | Creating a group **navigates to the new group's Settings page** (Invites section) — no invite sheet. |
| Rename | **Included.** |
| Row secondary actions | Per-row **gear** button navigates directly to the Group Settings page — no intermediate bottom action sheet. "Open" = row tap. Leave group lives in the settings danger zone. |
| Destructive confirmations | Kick / revoke / leave → simple `ConfirmSheet`. Delete group → **type-to-confirm**. No undo. |
| Deferred | Rate limiting; max-uses cap + join provenance; transfer-admin; FAB. (See §8.) |

## 4. Backend

### 4.1 New `Invite` entity (DynamoDB, single-table)

| Field | PK | SK | GSI1PK | GSI1SK |
|---|---|---|---|---|
| Invite | `invite#<code>` | `invite#<code>` | `group#<groupId>` | `invite#<code>` |

Attributes: `GroupId, GroupName, CreatedBy, CreatedAt, ExpiresAt`.
- `code`: generated via new `helper.NewInviteCode()` using a crypto-strong source (reuse `google/uuid`), ~128-bit; **get-before-save retry** on the (negligible) collision.
- `ExpiresAt = now + 7d`, written to the table's existing TTL attribute. **TTL deletion is lazy → `GetInvite`/`RedeemInvite`/`ListInvites` MUST also check `ExpiresAt` in code.**

### 4.2 Endpoints

All under the authenticated+approved `/api` group.

| Method | Path | Authz | Result |
|---|---|---|---|
| `POST` | `/api/groups` | Authenticated | *(exists)* create group, creator = admin |
| `PUT` | `/api/groups/:groupId` | GroupAdmin | rename group |
| `DELETE` | `/api/groups/:groupId` | GroupAdmin | delete group + all related data |
| `POST` | `/api/groups/:groupId/invites` | GroupAdmin | create invite → `{code, expiresAt}` |
| `GET` | `/api/groups/:groupId/invites` | GroupAdmin | list active (non-expired) invites |
| `GET` | `/api/invites/:code` | Authenticated | invite details → `{groupName, expiresAt}` (used for logged-in Join confirm) |
| `POST` | `/api/invites/:code/redeem` | Authenticated | join group → `{groupId, groupName}` |
| `DELETE` | `/api/groups/:groupId/invites/:code` | GroupAdmin | revoke invite |
| `DELETE` | `/api/groups/:groupId/members/:memberId` | Member/GroupAdmin | remove member — self-id => leave (sole admin blocked); other id => kick (admin only) |

**Response codes:** these endpoints use **proper HTTP status codes** (200/201/204, 403, 404, 409) — a deliberate, localized improvement over the existing handlers' 500-for-all convention, because `InvitePage` must distinguish *invalid/expired* (terminal) from *server error* (retryable). The frontend API client is extended to surface the status (see §5.5).

### 4.3 Service logic

- **RenameGroup** — verify GroupAdmin; update `GroupName` on the Group record. (Member/schedule records denormalize `GroupName`; updating those is **out of scope** — display name is read from the Group record / live payload. Note this in code.)
- **DeleteGroup** — verify GroupAdmin; query GSI1 `group#<groupId>` → BatchWriteItem delete all members/schedules/comments/notices/invites; delete the Group record.
- **CreateInvite** — verify GroupAdmin of path `:groupId`; generate unique code; save with TTL; return.
- **ListInvites** — verify GroupAdmin; query GSI1 `group#<groupId>` `begins_with invite#`; filter out expired in code.
- **GetInvite** — lookup by code; nil or past `ExpiresAt` → not-found. Returns group name only (minimal disclosure).
- **RedeemInvite** — validate code + not-expired; **strict idempotent no-op**: if caller is already a member, return group info with **zero writes** (never rewrite an existing membership → an admin redeeming their own link can't be downgraded). Else create Member (role `Member`) + default schedule, written with a **conditional `PutItem` (`attribute_not_exists(PK) AND attribute_not_exists(SK)`)** so concurrent/double redeems can't create duplicate/partial state; on `ConditionalCheckFailed`, treat as the already-member path. (Also resolves the existing `// FIXME: needs a transaction` in `groups.go`.)
- **RevokeInvite** — load invite by `code` first; verify caller is GroupAdmin of the invite's **stored `GroupId`**, and assert `storedGroupId == path :groupId` (reject mismatch → no cross-group IDOR); delete.
- **KickMember** — verify requester is GroupAdmin; reject kicking self / the admin; query `PK=member#<memberId>` filter `contains(SK, "group#<groupId>")` → BatchWriteItem delete all that member's group data.
- **LeaveGroup** — requester removes self; reject if requester is the sole admin (must delete instead); same data-deletion as kick.

Identity always derived from the verified token claim (`parseAuthHeader`), never from the request body.

## 5. Frontend

### 5.1 Information architecture

- **GroupSettingsPage** (`/groups/:groupId/settings`) — one **role-adaptive** page. Reached by tapping the **per-row gear button** on GroupsPage directly — no intermediate action sheet. The GroupSchedulePage TopBar has no settings gear.
- **GroupsPage**: `＋` in TopBar (create); per-row **gear button** navigates straight to settings; empty state becomes the first-run launchpad (Create / I-have-an-invite).
- Sub-tasks are `BottomSheet`s (create, rename, invite, confirms).

### 5.2 GroupSettingsPage sections

- **Identity** — group avatar + name + meta; admin gets a Rename pencil (`RenameGroupSheet`).
- **Members** — `MemberRow` list; admin badge with `crown`; admin sees a trash affordance on every non-self, non-admin row (`ConfirmSheet`); members see read-only.
- **Invites** (admin only) — "Create invite link" creates an invite **inline** (no sheet) and it appears in the active-invite list; each active-invite row (code + relative expiry) carries its own **Share / Copy / Revoke** icon buttons (revoke via `ConfirmSheet`).
- **Danger zone** — admin: Delete group (`DeleteGroupSheet`, type-to-confirm); member: Leave group (`ConfirmSheet`).

### 5.3 Invite link & landing

- Link: `https://meal-planner.isnan.eu/invite/<code>?g=<url-encoded group name>`. The GroupSettings **invite rows** build it (group name known locally); each row's **Share** uses the **Web Share API primary** on mobile with **Copy** as fallback (`AbortError` on share = no-op), plus an explicit **Copy** action; rows show **relative expiry**.
- **`InvitePage`** (route `/invite/:code`, **outside both `ProtectedRoute` and `PublicRoute`**; branch internally after auth-loading settles):
  - *Anonymous*: show group name from `?g=` (length-capped, **escaped text only — never `dangerouslySetInnerHTML`**); generic fallback if absent. Offer **Sign in** *and* **Create account**, both stashing the code. Store `{code, savedAt}` in `localStorage.pendingInviteCode`.
  - *Authenticated*: `GET /api/invites/:code` → render "Join \<server group name\>?" (authoritative name, not `?g=`) → redeem → navigate into the group.
  - States: loading, anonymous(named/generic), confirm, joining, **already-member** (idempotent 200 → "you're already in"), **awaiting-approval** (redeem 403-not-approved — see §5.4), **expired/invalid/revoked**, **network-retry** (distinct from invalid).

### 5.4 localStorage handoff & approval gap (new invitees)

App access is gated by `RequireApproved`, which reads `custom:Approved` **from the ID-token claim** (`helper.go`), so approval only takes effect on a user's **next token issuance** (re-login or the ~60-min refresh). A brand-new invitee must therefore: sign up → wait for owner approval (manual, via the `users approve` CLI on a Slack ping) → return with an approved token → redeem. Approving a user does **not** auto-join them — they must come back; the redeem completes the join.

Handling (option **#2** — keep the 7-day invite, no server-side pending-join):
- **Robust redeem trigger:** attempt redeem of a stored `pendingInviteCode` on **any** authenticated session resolving (a top-level effect after auth-loading settles), *not only* on an explicit login submit — so a background token refresh after approval still completes the join. Clear the code **after** a successful navigation.
- **403-not-approved → awaiting-approval state:** keep the code, show *"Awaiting approval — you'll join \<group\> automatically once approved"*, retry on the next session. (The client need not track approval itself; it branches on the 403.)
- **Expired/invalid → dead-end with recovery:** show *"This invite has expired — ask the group admin for a fresh link"*, clear the stale code, land on Groups. Admin re-shares (links are reusable/regenerable).
- Entry carries `savedAt`; **ignore/clear after 7 days**. A dead/failed invite **never blocks a normal login**.
- **Accepted limitations of #2:** the 7-day expiry can lose the race against a slow approval+return (mitigated by messaging + easy re-share, not eliminated); localStorage is per-device, but the **link is the source of truth** so re-opening it on the logged-in device works. Eliminating both (auto-join on approval) is option **#3**, deferred (§8).
- **Boundary:** invites never grant app access — a group admin (not the owner) cannot approve users by inviting them; the owner remains sole approver.

### 5.5 API client & components

- `api.js`: add `createGroup`, `renameGroup`, `deleteGroup`, `createInvite`, `listInvites`, `getInvite`, `redeemInvite`, `revokeInvite`, `kickMember`, `leaveGroup`. Extend `fetchWithAuth` to **surface HTTP status** (throw an error carrying `status`) so `InvitePage` can branch terminal vs retryable.
- New components: `GroupSettingsPage`, `MemberRow`, `CreateGroupSheet`, `RenameGroupSheet`, `InvitePage`, `ConfirmSheet`, `DeleteGroupSheet`. Invites are created and shared **inline** in the GroupSettings Invites section (no `InviteMemberSheet`). `GroupRow` trailing button is a gear that navigates directly to settings — no `GroupActionSheet`.
- **Toast z-index above `BottomSheet`** (bump Toast to clear the sheet; keep `bottom-[96px]`).

### 5.6 Accessibility / PWA

`aria-label` on all icon-only buttons (include the group/member name); focus first field (or Cancel for confirms — never a `danger` button) on sheet open, restore on close; focus trap in sheets; safe-area padding on `InvitePage` (standalone public route); respect `prefers-reduced-motion`.

## 6. Security findings — disposition (all adopted)

| # | Finding | How addressed |
|---|---|---|
| 1 | Code entropy / RNG | crypto-strong, ~128-bit code (§4.1). Rate limiting **deferred** (accepted risk, §8). |
| 2 | Non-atomic membership write | conditional `PutItem` on redeem (§4.3). |
| 3 | `?g=` phishing / XSS | escaped-text-only; authoritative server name post-login (§5.3). |
| 4 | Reusable link, no max-uses / provenance | **deferred** (TTL + revoke sufficient, §8). |
| 5 | Idempotent redeem downgrade | strict no-op, zero writes for existing members (§4.3). |
| 6 | `GET /invites/:code` oracle | minimal disclosure (group name only); entropy mitigates (§4.3). |
| 7 | Revoke IDOR | authorize on stored `GroupId` + assert path match (§4.3). |
| 8 | Revoke/redeem TOCTOU | folded into the conditional write (§4.3). |
| 9 | localStorage / token hygiene | clear after redeem; identity from token claim (§4.3, §5.4). |

## 7. Docs to update on implementation

`backend.md` (mark endpoints implemented; reusable/lazy-TTL/idempotent/atomic notes; rename caveat), `ui.md` (GroupSettingsPage, InvitePage, new sheets, routes, action sheet), `cli.md` (unchanged this release), memory index.

## 8. Out of scope / deferred

- Rate limiting / lockout on invite lookup+redeem (accepted risk: requires an approved account; entropy makes enumeration infeasible).
- Max-uses cap + recording joining invite code (reusable link is deliberate; revoke + 7-day TTL suffice).
- Transfer-admin (design leaves room: sole admin sees Delete, not Leave).
- **Server-side pending-join (option #3)** — a `PendingJoin` entity + an authenticated-but-unapproved route to register intent + a hook on the `users approve` path to auto-complete the join on approval. Would remove the "B must return" step and eliminate the expiry race, but adds a new entity, an auth-group carve-out, and shared membership-creation logic between API and CLI. Future enhancement.
- FAB; QR codes; per-invite naming; updating denormalized `GroupName` on member/schedule records after rename.

## 9. Testing / verification

- Go unit tests for invite/membership service logic: code generation, expiry check, **idempotent redeem (admin keeps Admin)**, conditional-write duplicate prevention, revoke IDOR (stored vs path group), kick/leave authorization (sole-admin can't leave), delete cascade.
- `make run-api-local` + curl for endpoint smoke tests.
- Frontend: manual verification per the redesign convention (no web test harness); verify route guards, anonymous→login→redeem handoff, toast over sheet.

## 10. Open questions

None — all behavioral, UX, and security decisions are resolved.
