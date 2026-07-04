# Slack Signup Approval — Design

Date: 2026-07-04

## Problem

Today a self-registration raises a Slack "🔐 Access Request" alert; an admin then
approves the user out-of-band (CLI `users approve`, or the Cognito console). We want
the admin to **approve or reject directly from Slack** via buttons on that alert.

## Solution overview

The `platform/alerter` pipeline already provides the entire Slack-side machinery:
- `notifier` renders action buttons when a `notifications.Message` carries an
  `Interactive` block, embedding `source`/`callbackId`/`payload` in each button value.
- `responder` receives the click over its Function URL, verifies the Slack signature,
  enforces an operator allow-list (SSM), strips the buttons and posts "…by @user",
  then republishes the decision to the **`alerting-responses`** SNS topic with a
  `source` message attribute for filtering.

Meal-planner only implements the two ends: **(a)** attach buttons to the existing
signup alert, and **(b)** a new consumer that applies the decision. No platform change.

## Naming changes

- **Rename** the existing Cognito-trigger lambda `user-management` → **`user-onboarding`**
  (Terraform `meal-planner-user-onboarding`). Its responsibility is onboarding new
  signups (default approval state + raising the Access Request), which "user-management"
  described too vaguely. This aligns with the existing notification `source`
  (`meal-planner-onboard-users`).
- **New** consumer lambda **`user-approval`** (Terraform `meal-planner-user-approval`).

## Data flow

```
signup (Cognito pre_sign_up)
  └─ user-onboarding Lambda ── notifications.Message + Interactive ──▶ SNS alerting-events
                                                                          │
                                          platform notifier ─────────────┘  (renders buttons)
                                                 ▼
                                              Slack  ── admin clicks Approve/Reject ──▶ platform responder
                                                 (verifies sig + operator allow-list,          │
                                                  strips buttons, posts "…by @user")           │
                                                                                               ▼
                                        SNS alerting-responses (attr source=meal-planner-onboard-users)
                                                                                               │
                                        NEW user-approval Lambda ◀─────────────────────────────┘  (filter_policy on source)
                                             ├─ approve → Cognito AdminUpdateUserAttributes custom:Approved=true
                                             ├─ reject  → Cognito AdminDeleteUser
                                             └─ on failure → publish alerting-events "⚠️ Failed to …"
```

## Component 1 — Producer change (`user-onboarding`)

In the `GetNotification` hook, add an `Interactive` block to the returned message:

- `callbackId` = `event.Email` — human-readable label, echoed back for the failure alert.
- `payload` = `event.UserName` — the Cognito username, exactly what `AdminDeleteUser` /
  `AdminUpdateUserAttributes` accept (robust whether it is a UUID or an email).
- `actions`:
  - `{ id: "approve", label: "Approve", style: "primary" }`
  - `{ id: "reject",  label: "Reject",  style: "danger" }`

No other change to the signup path; the `content` (Access Request Markdown) is unchanged.

## Component 2 — New consumer lambda (`user-approval`)

A small self-contained Go Lambda, **SNS-triggered** (not API Gateway), in
`packages/functions/user-approval/cmd`. Deps (aws-sdk-v2 cognito + sns,
`platform/notifications`) already exist in `packages/functions/go.mod` via `api`.

**App filtering (two levels).** The SNS subscription carries
`filter_policy = { source = ["meal-planner-onboard-users"] }` on the `source`
message attribute the responder sets, so AWS only delivers meal-planner's own
signup decisions (never `idp`'s or any other producer's). The handler also
re-checks `decision.source` in code (belt-and-suspenders against a misconfigured
subscription) and ignores anything else.

Handler consumes `events.SNSEvent`; for each record it unmarshals the responder's
`responsePayload` (`action`, `callbackId`=email, `payload`=username):

- `action == "approve"` → `AdminUpdateUserAttributes` set `custom:Approved="true"`.
- `action == "reject"`  → `AdminDeleteUser`.
- unknown action → log and ignore.
- On any Cognito error → publish a fresh `alerting-events` Markdown alert
  (`⚠️ Failed to <action> <email>`) via the shared `notifications.Message` contract,
  and log. Success = log only (the responder already posted the "…by @user" confirmation).

**Reject deletes only the Cognito user.** A fresh self-registrant has no DynamoDB
records yet (they have joined no group), so no table cleanup is required — keeping the
consumer free of the app-id conversion and any DynamoDB dependency.

Idempotency: approving an already-approved user is a Cognito no-op; a reject of an
already-deleted user (`UserNotFoundException`) is treated as success (logged, no alert).

Env vars: `REGION`, `USER_POOL_ID`, `SNS_TOPIC_ARN` (for failure alerts).

## Component 3 — Infrastructure

- **Bump all `terraform-modules` refs `v1.7.1` → `v1.8.0`** across `functions.tf`
  (`api`, `api_trigger`, `user_onboarding`, `user_onboarding_trigger`) so every module
  is on one version. v1.8.0 is purely additive (adds an optional `efs_config` variable,
  default `null`) — no breaking changes, no plan diff from the bump alone. The new
  `lambda-trigger-sns` module is pinned at `v1.8.0` too (matching `platform/alerter`).
- `sns.tf`: add `data "aws_sns_topic" "alerting_responses" { name = "alerting-responses" }`.
- `functions.tf`:
  - Rename `module "user_management"` → `module "user_onboarding"`; set
    `function_name = "meal-planner-user-onboarding"`. Env vars and permissions
    unchanged (the producer does not need `USER_POOL_ID` — the pool id lives on
    **user-approval**).
  - New `module "user_approval"` (`lambda-function`, arm64, 128MB), zip built from
    `../functions/user-approval/dist/bootstrap.zip`, env `REGION`, `USER_POOL_ID`,
    `SNS_TOPIC_ARN`, `additional_policy_arns = [aws_iam_policy.user_approval.arn]`.
  - New `module "user_approval_trigger"` (`lambda-trigger-sns`) →
    `topic_arn = data.aws_sns_topic.alerting_responses.arn`,
    `filter_policy = jsonencode({ source = ["meal-planner-onboard-users"] })`.
  - Rename `module "user_management_trigger"` → `module "user_onboarding_trigger"`.
  - Update `local.user_management_filename` → `user_onboarding_filename`; add
    `user_approval_filename`.
- `cognito.tf`: repoint `lambda_config` (pre_sign_up / post_confirmation) and the
  renamed `module.user_onboarding_trigger` references to `module.user_onboarding`.
- `iam.tf`:
  - Rename policy: resource label `aws_iam_policy.user_management` →
    `aws_iam_policy.user_onboarding`, its `name` → `"meal-planner-user-onboarding"`,
    and the `data.aws_iam_policy_document.user_management` → `..._onboarding`
    (statements unchanged).
  - New policy `aws_iam_policy.user_approval` (`name = "meal-planner-user-approval"`)
    + `data.aws_iam_policy_document.user_approval`:
    `cognito-idp:AdminUpdateUserAttributes` + `cognito-idp:AdminDeleteUser` (scoped to
    the pool ARN) and `sns:Publish` (alerting topic, for failure alerts).

### Terraform resource-name alignment

Rename every Terraform identifier consistently — not just `function_name`. Nothing
should keep the `user_management` label:

| Kind | Old | New |
|------|-----|-----|
| lambda module | `module.user_management` | `module.user_onboarding` |
| sns/cognito trigger module | `module.user_management_trigger` | `module.user_onboarding_trigger` |
| iam policy resource | `aws_iam_policy.user_management` | `aws_iam_policy.user_onboarding` |
| iam policy doc data | `data.aws_iam_policy_document.user_management` | `..._onboarding` |
| iam policy `name` attr | `meal-planner-user-management` | `meal-planner-user-onboarding` |
| local | `local.user_management_filename` | `local.user_onboarding_filename` |

Because the Lambda `function_name` and IAM policy `name` change, Terraform will
**recreate** those resources (destroy + create) rather than update in place; the
Cognito trigger rewires to the new function ARN. Acceptable — the function is
stateless. New resources for user-approval: `module.user_approval`,
`module.user_approval_trigger`, `aws_iam_policy.user_approval`,
`data.aws_iam_policy_document.user_approval`, `data.aws_sns_topic.alerting_responses`.

## Rename mechanics — files to touch

Living code/config (rename `user-management` → `user-onboarding`):
- `packages/functions/user-management/` → `packages/functions/user-onboarding/` (dir).
- `packages/functions/Makefile`: `build-user-management`/`package-user-management`
  targets → `-user-onboarding`, `./user-management/cmd` build path → `./user-onboarding/cmd`,
  `clean` paths.
- Root `Makefile`: any `user-management` reference (none currently in build/deploy
  targets beyond the delegated `make package`; verify).
- `packages/infrastructure/functions.tf`, `cognito.tf`, `iam.tf` (as above).
- `packages/functions/user-onboarding/cmd/main.go`: stale header comment
  ("Alexandria Cognito Lambda") → meal-planner user-onboarding.

Living docs:
- `.claude/backend.md`: update the two `user-management` mentions (Lambda triggers list,
  invite-auto-approval note) to `user-onboarding`; document the new `user-approval`
  lambda + the Slack approve/reject flow.
- `.claude/CLAUDE.md` / memory index: only if they name the lambda (verify).

Historical, **do not rewrite** (point-in-time records): the `user-management` mentions in
`docs/superpowers/plans/*` and prior `docs/superpowers/specs/*` describe past state and
stay as-is.

## Assumptions / prerequisites

- The `platform/alerter` **responder** is deployed and wired into Slack:
  - Slack app **Interactivity → Request URL** = the responder's CloudFront custom
    domain **`https://platform-slack-responder.isnan.eu/`** (the `responder_public_url`
    output), NOT the raw `*.lambda-url…on.aws` Function URL.
  - The responder Function URL is **`AuthType = NONE`** (public), authenticated in-code
    by the Slack signing-secret HMAC + operator allow-list. It must NOT be `AWS_IAM`
    behind CloudFront OAC: OAC cannot SigV4-sign a POST *body* to a Lambda Function URL,
    so every Slack interactivity POST 403s with `InvalidSignatureException`. This was a
    real bug found during rollout and fixed in `platform/alerter` (`functions.tf`/`cdn.tf`).
  - SSM `slack.alerting.signing_secret` + `slack.alerting.operators` populated.
- The `alerting-responses` SNS topic exists (created by `alerter` infra).

## Known edge case (accepted)

For email/password signups the alert fires at `pre_sign_up`, while
`custom:Approved="false"` is written at `post_confirmation`. If an admin clicks Approve
in the seconds between signup and the user confirming their email, `post_confirmation`
would overwrite the flag back to `false`. Realistically the admin approves much later.
Documented, not engineered around.

## Testing

- **user-approval** unit tests (fakes for Cognito + SNS, mirroring `api`'s
  `fakes_test.go`): approve path, reject path, unknown-action ignored,
  `UserNotFoundException` on reject treated as success, Cognito error → failure alert
  published with the email.
- **user-onboarding**: assert `GetNotification` returns the expected `Interactive`
  block (two actions, callbackId=email, payload=username).

## Out of scope

- Rate limiting / audit log of decisions (the responder already records who acted in
  Slack + CloudWatch).
- Soft-reject (marking without deleting) — reject is a hard Cognito delete.
- Any change to the CLI approval path (remains available).
