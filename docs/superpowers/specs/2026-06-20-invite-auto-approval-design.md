# Invite auto-approval — skip admin approval for invited users

**Date:** 2026-06-20
**Status:** Approved for planning
**Scope:** Let a user who redeems a valid invite be **auto-approved** (no manual admin gate). Keep the manual approval gate for everyone who self-registers **without** an invite.

> ⚠️ **This spec supersedes parts of `2026-06-16-group-management-design.md`.** See the [Supersedes](#supersedes-prior-spec) section for the exact statements replaced; inline ⚠️ markers flag them at the point of change.

---

## 1. Problem & context

App access is gated by `RequireApproved`, which reads `custom:Approved` from the ID-token claim (`api/.../handlers/helper.go`). Today **every** new account — invited or not — lands `custom:Approved="false"` (set by the `user-management` Lambda's `post_confirmation` trigger) and must be manually approved (CLI `users approve`, on a Slack ping). Invited newcomers therefore wait for the owner before they can even redeem.

We want to remove that friction **only** for people holding a real invite, while preserving the gate — and the Slack-alert visibility — for random self-registrants. The explicit constraint: **the app must not be floodable with uninvited users without the owner's knowledge.**

A crucial finding from exploration: **all** `/api` routes, including `GET /api/invites/:code` and `POST /api/invites/:code/redeem`, currently sit behind `RequireApproved` (`api/cmd/api/main.go:29-30`). So an unapproved invitee cannot redeem at all today.

## 2. Locked decisions

| Decision | Choice |
|----------|--------|
| **Who gets auto-approved** | **Any unapproved user** who redeems a valid, unexpired invite — whether they just signed up via the link or self-registered earlier and are still waiting. Holding a valid invite *is* the authorization. |
| **Slack visibility** | **Keep** the existing signup alert (#1, "Awaiting registration for …") **and add** a 2nd alert from the API at redeem time: "*{name} auto-approved via invite → {group}*". This is the "without my knowledge" guard. |
| **Where approval is written** | In the **API Lambda**, inside the redeem handler. Not in the Cognito triggers (see §3 rationale). |
| **Invite model** | Unchanged: **reusable**, 7-day TTL, revoke + 2nd-alert as the flood guard. No max-uses cap. |
| **`fetchWithAuth` 403-retry hardening** | Out of scope (orthogonal). |

## 3. Approach

**Chosen — flip `custom:Approved` on redeem (server-side).** Drop the *approval* check (keep authentication) from the two redeem-side endpoints only. On a validated redeem, the API calls Cognito `AdminUpdateUserAttributes` to set `custom:Approved="true"` for the caller, then publishes the 2nd Slack alert.

**Rejected:**
- **Gate on "approved OR is-a-member"** — taxes every API request with a DynamoDB membership lookup; "approved" stops being the single source of truth.
- **Validate invite in `pre_sign_up`/`post_confirmation`** — cannot satisfy "any unapproved user" (the Cognito triggers fire once at confirmation and never re-fire for an existing user who redeems later); needs DynamoDB in an auth-critical trigger; the Google-OAuth federated path has no `clientMetadata` plumbing; would push invite logic into the shared `Maev4l/platform/users-management` package.

**The trust invariant the whole design rests on:**

> `custom:Approved="true"` is written by **exactly one** code path: the API Lambda, inside a redeem that validated a real, unexpired invite, for the caller's **own** JWT-derived `sub`.

No client path can assert approval → a flood of uninvited self-registrants stays `false` and keeps hitting the existing gate.

## 4. Backend — gate change + auto-approval

### 4.1 Middleware
- Add `RequireAuthenticated()` beside `RequireApproved()` in `handlers/helper.go`: same JWT parse (populates requester id / `sub` / name into context), **skips** the `approved` check.
- In `main.go`, move **only** `GET /api/invites/:code` and `POST /api/invites/:code/redeem` onto a sub-group using `RequireAuthenticated()`. All other `/api` routes — including invite **create/list/revoke** — stay on `RequireApproved`.
  - ⚠️ **Supersedes** `2026-06-16-group-management-design.md` §5.1 line 52 ("*All under the authenticated+approved `/api` group*") and the implementation that placed the redeem pair behind `RequireApproved`. The redeem pair is now genuinely authenticated-only.
- No regression to the LWA readiness fix: both sub-groups remain under `/api`; the `/` health path LWA probes is untouched.

### 4.2 Auto-approval in the redeem service
`services/invites.go RedeemInvite` gains the caller's `approved` bool (from the token) and, after validating invite + group and ensuring membership:

```
1. GetInvite + IsExpired            invalid/expired → ErrNotFound (404)
2. GetGroup                         missing → ErrNotFound (404)
3. GetMember (idempotency probe)
4. CreateMemberIfNotExists          conditional PutItem (race-safe) + default schedule
5. if caller.approved == false:
     cognito.ApproveUser(sub)       AdminUpdateUserAttributes custom:Approved="true"
     notifier.Publish(alert #2)
6. return (group, alreadyMember)
```

**Flip + alert gating:** keyed on the **token's** `approved` claim.
- `false` → call `ApproveUser` **and** publish alert #2 (genuine gate-skip; the only case worth notifying).
- `true` (already-approved member joining another group) → skip both (no noise).
- `ApproveUser` is idempotent, so a stale-`false` token only causes a harmless redundant write + (rarely) one extra alert.

**Cognito username:** `AdminUpdateUserAttributes` needs the Cognito `Username` (the `sub`/`cognito:username`), not `custom:Id` (uppercased/dash-stripped → lossy). Carry `sub` from the JWT through the middleware. *(Confirm pool's exact username form in planning.)*

**Failure semantics (ordering matters):**
1. `CreateMemberIfNotExists` first — source-of-truth, conditional/race-safe.
2. `ApproveUser` second — failure → return 5xx; client retries; redeem idempotent (membership already exists → `alreadyMember` path re-attempts the flip). Safe.
3. SNS publish last — failure **logged only, non-fatal**. A missed Slack ping must never block a join.

### 4.3 New ports (hexagonal, for testability)
- `ApproveUser(username string) error` on the Cognito port (implemented via the existing `cognitoidentityprovider.Client` in `repositories/cognito.go` — direct AWS SDK call; **no** `Maev4l/platform` change).
- A **notifier port** (SNS publish) so the alert is mockable. The adapter marshals the **shared `cognito.NotificationPayload`** struct (`github.com/Maev4l/platform/users-management@v1.x/pkg/cognito`) — reused, **not** re-declared, so the wire shape can't drift from the consumer. Confirmed shape: JSON tags are **lowercase** (`source`, `sourceDescription`, `target`, `content`); the consumer routes on the body's `target` field; published as the SNS message **body** via `Publish` with `TargetArn` set to the topic (no MessageAttributes). The library's own publisher (`sendNotification`) is unexported, so the API writes its own one-line `sns.Publish` — but over the shared struct. No `Maev4l/platform` modification, and **zero new module deps** (api + user-management share `packages/functions/go.mod`, which already imports this package). The API sets `source="meal-planner-api"`, `target="slack"`.

## 5. Frontend — token refresh after redeem

**Why required:** Cognito stamps `custom:Approved` into the idToken **at issuance**. `ApproveUser` flips the attribute server-side, but the browser's in-hand idToken still says `false`. `getToken()` (`services/api.js`) calls `fetchAuthSession()` **without** `forceRefresh`, so without intervention the post-redeem `fetchSchedules`/navigate calls would fire with the stale token → 403.

**Edits:**
1. `AuthContext.jsx` — expose `refreshSession()`:
   ```js
   const refreshSession = useCallback(async () => {
     await fetchAuthSession({ forceRefresh: true }); // new idToken carries approved:true
     await checkAuth();                              // keep in-memory user state consistent
   }, [checkAuth]);
   ```
   (`custom:Approved` is in the pool's `read_attributes`, so the refreshed token carries it.)
2. `InvitePage.join()` — `await refreshSession()` **between** redeem-success and `fetchSchedules`/navigate. Runs **unconditionally** on success (harmless remint if already approved; correct when a flip occurred).
3. **Retire "awaiting approval" in `InvitePage`.** With the gate open, `getInvite`/`redeemInvite` no longer 403 for *approval* reasons; an invited newcomer goes straight to the **confirm** screen and joins immediately. A residual 403 now means a genuinely rejected token → route to `error`, not `awaiting`.
   - ⚠️ **Supersedes** `2026-06-16-group-management-design.md` §5.4 line 111 ("*403-not-approved → awaiting-approval state … 'Awaiting approval — you'll join {group} automatically once approved'*") and the `awaiting` UI state (its lines 103-108). This is a deliberate, visible behavior change — invited users never see "Awaiting approval."

**Staleness window:**
```
redeem 200 (server: approved=true)        ← attribute flipped
  │ browser idToken still approved=false   ← STALE gap
  ▼
refreshSession() forceRefresh              ← new idToken approved=true; Amplify store updated
  ▼
fetchSchedules / navigate → /api …         ← RequireApproved ✓
```

## 6. Infrastructure (Terraform)

Three additive changes; **no new resources** (reuse the existing `data.aws_sns_topic.alerting`).

1. **API policy** (`iam.tf`) — add `cognito-idp:AdminUpdateUserAttributes` to the existing Cognito statement, scoped to `aws_cognito_user_pool.meal_planner.arn` (least-privilege; *not* the `userpool/*` wildcard `user_management` uses).
2. **API policy** — new statement: `sns:Publish` on `data.aws_sns_topic.alerting.arn`.
3. **API env var** (`functions.tf`, `module.api`) — `SNS_TOPIC_ARN = data.aws_sns_topic.alerting.arn` (mirrors `user_management`); read via `os.Getenv`.

No module bumps, no API Gateway change. **Defense in depth:** the APIGW Cognito JWT authorizer on `ANY /api/{proxy+}` already rejects tokenless requests at the edge for **all** `/api/*` routes — so opening the Gin approval gate loosens *approval*, never *authentication*. The `user-management` Lambda and `Maev4l/platform` are untouched.

## 7. Security analysis

| # | Threat | Outcome |
|---|--------|---------|
| 1 | **Mass self-registration, no invite** (core fear) | `approved=false`; can call only `getInvite`/`redeem`; `redeem` 404s without a real code → **stays gated, zero access**. Unchanged from today; feature does not make uninvited flooding easier. |
| 2 | **Brute-force invite codes** | 128-bit codes (`helper.NewInviteCode`); 2^128 space → infeasible even unthrottled. |
| 3 | **Leaked/over-shared reusable invite** | The real residual (below). Bounded by 7-day TTL + revoke; **every** auto-approval fires alert #2 → owner sees a flood and revokes. |
| 4 | **Client forges approval** | Impossible — no client IAM; `approved` claim is Cognito-signed, APIGW-verified. |
| 5 | **Approve someone else (IDOR)** | `ApproveUser` uses the caller's own `sub`; only ever self-approval, only via redeem. |
| 6 | **Redeem expired/revoked code** | `IsExpired` checked in code (not lazy TTL); revoke deletes record → 404 → no approval. |
| 7 | **Escalate to admin** | `CreateMemberIfNotExists` always `Role=Member`, conditional put never upgrades. Approval ≠ admin. |

**Accepted residual — leaked reusable invite.** A leaked code now grants approval (previously only membership). It lands inside the stated guard: a leaked code *is* a real invite (uninvited strangers still blocked, #1), and alert #2 is the knowledge+revoke mechanism for *"without my knowledge."* Each redeemer also had to create **and email-confirm** a Cognito account first. Owner chose to keep reusable/7-day/revoke + alert as sufficient (no max-uses cap).

> ⚠️ **Supersedes** `2026-06-16-group-management-design.md` §5.4 line 115 ("*Boundary: invites never grant app access … the owner remains sole approver*") and §5.4 line 107 (the "*sign up → wait for owner approval → return → redeem*" model). A valid invite now **does** grant app access; for invited users the owner is **no longer the sole approver** — redeeming a valid invite self-approves. The owner retains control via revoke + alert #2. The uninvited path remains owner-gated.
>
> ⚠️ Also relaxes the motivation for the deferred **pending-join (option #3)**, `2026-06-16-group-management-design.md` §8 line 150: the "B must return after approval" step and the slow-approval-vs-7-day-expiry race (§5.4 line 114) are **eliminated** for invited users (they join on first authenticated redeem, no approval wait). Option #3 is no longer needed for this purpose.

## 8. Testing

**Backend — service unit tests** (`services/invites_test.go`, mocked Cognito + notifier ports; `RedeemInvite` takes caller `approved` bool):
- valid invite + `approved=false` → member created, `ApproveUser` ×1, alert published
- valid invite + `approved=true` → member created, **no** approve, **no** alert
- already-member + `approved=false` → approval still flipped, `alreadyMember=true`
- expired / revoked / missing invite / missing group → 404, no approve, no alert
- `ApproveUser` fails → returns error (membership persisted → retry-safe)
- SNS publish fails → redeem still succeeds (non-fatal)
- second redeem by same member → `alreadyMember=true`, no duplicate

**Backend — middleware:** `RequireAuthenticated` accepts valid token, rejects garbage; **regression guard** asserting only the redeem pair sits off `RequireApproved`.

**Frontend — manual E2E** (no web test harness):
1. New user via link → signup → confirm → **confirm** screen (never "awaiting") → join → in group, **no 403 flash** → both Slack alerts fire
2. Uninvited self-register → blocked (403), only alert #1, no group access
3. Existing **unapproved** user given a link → joins + auto-approved
4. Already-approved member redeems another group → joins, **no** alert #2
5. Expired/revoked code → expired screen, no approval
6. No 403 flash after join (staleness window closed)

Spot-check `custom:Approved` flipped via Cognito console / `cli users list`.

## 9. Out of scope

- Max-uses cap / recording the joining invite code (reusable link is deliberate; revoke + 7-day TTL + alert #2 suffice).
- `fetchWithAuth` 403-retry-with-refresh hardening (orthogonal; would heal any stale-claim window, e.g. CLI approval while holding an old token).
- Cognito-level signup-flooding controls (WAF / CAPTCHA / advanced security) — pre-existing concern, neither worsened nor fixed here.

## 10. Docs to update on implementation

- `backend.md` — gate split (redeem pair authenticated-only), auto-approval on redeem, 2nd Slack alert, new IAM (`AdminUpdateUserAttributes`, `sns:Publish`) + `SNS_TOPIC_ARN` env.
- `ui.md` — `InvitePage` no longer has an "awaiting approval" state for invited users; `AuthContext.refreshSession`.
- Memory index — note this spec supersedes the approval-gap model in the group-management spec.

## Supersedes (prior spec)

This design replaces the following statements in **`docs/superpowers/specs/2026-06-16-group-management-design.md`**:

| Old location | Old statement | Replaced by |
|--------------|---------------|-------------|
| §5.1 line 52 | "All under the authenticated+approved `/api` group" | Redeem pair (`GET /invites/:code`, `POST /invites/:code/redeem`) is now **authenticated-only** (`RequireAuthenticated`); §4.1. |
| §5.4 line 107 | Invitee must "sign up → wait for owner approval (manual …) → return … → redeem" | Invited users are **auto-approved on redeem**; no wait, no manual step; §4.2. |
| §5.4 line 111 + lines 103-108 | "403-not-approved → awaiting-approval state" UI | **Retired**; invited users go straight to confirm/join; §5 edit 3. |
| §5.4 line 115 | "invites never grant app access … the owner remains sole approver" | A valid invite **now grants app access** via self-approval on redeem; owner control shifts to revoke + alert #2; §7. |
| §8 line 150 (+ §5.4 line 114) | Pending-join (option #3) deferred to solve the approval gap / expiry race | The gap/race is **eliminated** for invited users by auto-approval; option #3 no longer needed for this purpose; §7. |

Unchanged / reaffirmed: reusable invites, 7-day TTL, revoke, no max-uses cap (§2; old §3 line 27, §8 lines 147-148); 128-bit code entropy; idempotent conditional-write redeem.
