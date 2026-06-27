# Meal planner backend

## Design

- Source code: @../packages/functions/api
- Infrastructure: @../packages/infrastructure (Terraform)
- The API is an AWS Lambda function, written in Golang
- The directory structure is vaguely inspired by an hexagonal architecture
- Data storage is ensured by AWS DynamoDB, with a single table design approach
- The members are stored in Cognito
- An Open API specs is located in the openapi.yaml file

## Infrastructure

- Domain: `meal-planner.isnan.eu`
- CloudFront serves both frontend (S3) and API (`/api/*` -> API Gateway)
- Terraform modules from `github.com/Maev4l/terraform-modules`

#### Cache-Control (PWA update correctness)

Response-headers policies (`cloudfront.tf`) set the `Cache-Control` the browser sees,
so the stable-named PWA app shell never reinstalls a phantom service worker:
- App shell (default behavior + `/sw.js`): `no-cache` (always revalidate)
- Content-hashed `/assets/*`: `public, max-age=31536000, immutable`
- Deploy invalidates `/*` (`yarn frontend:invalidate`)
- Client polls `registration.update()` hourly + on `visibilitychange` (`UpdatePrompt.jsx`)

#### CloudFront access-log historization

CloudFront standard logging **v2** delivers every request's client IP + metadata to a
dedicated S3 bucket as Parquet, retained 90 days. Observe-only — no WAF, no query layer.

- **Bucket:** `meal-planner-cloudfront-logs-<account-id>` (eu-central-1, dedicated,
  `force_destroy = true`, SSE-S3, all public access blocked).
- **Layout:** Hive date partitions under `raw/app/` — objects land at
  `raw/app/year=YYYY/month=MM/day=DD/<auto>.parquet`. The base `raw/app` prefix comes from
  the destination ARN; the partitions come from `s3_delivery_configuration`
  (`suffix_path = "{yyyy}/{MM}/{dd}"`, `enable_hive_compatible_path = true` — the flag MUST
  be true; AWS auto-expands the bare placeholders into `year=/month=/day=`, and a literal
  `year={yyyy}` is rejected while the flag is off). `<auto>.parquet` leaf names are vended
  by AWS and not controllable.
- **Retention:** whole-bucket S3 lifecycle rule, `expiration = 90 days`.
- **Delivery wiring** (`logs.tf`): `aws_cloudwatch_log_delivery_source` (ACCESS_LOGS on
  `aws_cloudfront_distribution.main`) -> `aws_cloudwatch_log_delivery` ->
  `aws_cloudwatch_log_delivery_destination` (S3, parquet). All three use
  `provider = aws.us_east_1` — the CloudFront Logs Delivery API must be called in
  us-east-1 even though the bucket is in eu-central-1. The delivery `depends_on` the bucket
  policy (CreateDelivery validates write access at creation).
- **Fields (14):** `date, time, c-ip, c-country, asn, cs-method, cs-protocol, cs(Host),
  cs-uri-stem, cs-uri-query, sc-status, x-edge-result-type, x-edge-location,
  cs(User-Agent)`. `c-country`/`asn` come free with v2 (no IP lookup).
- **Silent-failure gotcha:** the bucket policy must grant `delivery.logs.amazonaws.com`
  `s3:PutObject` with `aws:SourceAccount` / `aws:SourceArn` (`...:delivery-source:*`) /
  `s3:x-amz-acl=bucket-owner-full-control` conditions over a whole-bucket `Resource`. If
  any condition or the Resource path is wrong, delivery fails with AccessDenied and no
  logs appear — nothing is surfaced on the distribution.

Design: `docs/superpowers/specs/2026-06-27-cloudfront-access-log-historization-design.md`.

### Cognito Configuration

- User Pool: `meal-planner`
- Auth domain: `meal-planner-auth.isnan.eu` (custom domain with wildcard cert)
- Self-registration enabled (admin approval via `custom:Approved` attribute)
- Google OAuth identity provider
- Lambda triggers: `user-management` (pre_sign_up, post_confirmation)
- Token TTLs: access/ID = 60 min, refresh = 1 year (absolute expiry; re-login required yearly or on explicit sign-out, password change, or admin disable)
- The API Lambda role has `cognito-idp:AdminUpdateUserAttributes` (scoped to the pool, used for invite auto-approval) and `sns:Publish` (alerting topic); the function receives the topic via the `SNS_TOPIC_ARN` env var.

### SSM Parameters (secrets)

Google OAuth credentials stored in SSM Parameter Store:
- `meal-planner.google.client.id` (SecureString)
- `meal-planner.google.client.secret` (SecureString)

### Terraform Files

- `cognito.tf` — User pool, client, domain, Google identity provider
- `route53.tf` — DNS records including `meal-planner-auth.isnan.eu`
- `ssm.tf` — Data sources for Google OAuth secrets

## DynamoDB Data Model

### Table Structure
- **Table**: `meal-planner-data` (on-demand billing)
- **Primary Key**: PK (String) + SK (String)
- **GSI1**: GSI1PK + GSI1SK
- **TTL**: `ExpiresAt` field for auto-expiring time-bound data

### Entity Types & Key Patterns

| Entity | PK | SK | GSI1PK | GSI1SK |
|--------|----|----|--------|--------|
| **Group** | `group#<id>` | `group#<id>` | — | — |
| **Invite** | `invite#<code>` | `invite#<code>` | `group#<groupId>` | `invite#<code>` |
| **Member** | `member#<id>` | `group#<groupId>` | `group#<groupId>` | `member#<id>` |
| **Schedule** | `member#<id>` | `schedule#<schedId>#group#<groupId>` | `group#<groupId>` | `schedule#<schedId>` |
| **Comments** | `member#<id>` | `comments#<weekId>#group#<groupId>` | `group#<groupId>` | `comments#<weekId>` |
| **Notice** | `member#<id>` | `notice#<weekId>#group#<groupId>` | `group#<groupId>` | `notice#<weekId>` |

### Entity Attributes

**Group:**
- `GroupName`, `AdminId`, `CreatedAt`

**Invite:**
- `GroupId`, `GroupName`, `CreatedBy`, `CreatedAt`, `ExpiresAt` (TTL: 7 days)

### Access Patterns

**Primary Index (member-centric):**
- Get member in a group: `PK=member#<id>, SK=group#<groupId>`
- Get member's schedules/comments/notices: `PK=member#<id>, SK begins_with schedule#|comments#|notice#`

**GSI1 (group-centric):**
- List group members: `GSI1PK=group#<id>, GSI1SK begins_with member#`
- List group invites: `GSI1PK=group#<id>, GSI1SK begins_with invite#`
- Get group schedules for a week: `GSI1PK=group#<id>, GSI1SK=schedule#<year>-<week>`
- Get group comments/notices: same pattern with `comments#` or `notice#`

**Invite lookup:**
- Get invite by code: `PK=invite#<code>, SK=invite#<code>`

### Schedule Values
Meal attendance encoding:
- `0` = no lunch, no dinner
- `1` = lunch only
- `2` = dinner only
- `3` = lunch and dinner

Default schedule uses `scheduleId = "default"` (Year=0, Week=0)

### Data Lifecycle
- Schedules, comments, and notices auto-expire 14 days after their week via TTL
- Week identifiers format: `<year>-<week>` (e.g., `2024-15`)

## Gotchas
- Cognito users identifiers are a uuid, but in the application, it is the same id, but with dash removed and in upper case.

## API Endpoints

All group-management endpoints below are **implemented** (shipped with the group-management feature).

### Groups

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/groups` | Authenticated | Create group (creator becomes admin) |
| `PUT` | `/api/groups/{groupId}` | GroupAdmin | Update group (rename) |
| `DELETE` | `/api/groups/{groupId}` | GroupAdmin | Delete group and all related data |

### Invites

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/groups/{groupId}/invites` | GroupAdmin | Create invite, returns code |
| `GET` | `/api/groups/{groupId}/invites` | GroupAdmin | List active invites for the group |
| `GET` | `/api/invites/{code}` | Authenticated (not approval-gated) | Get invite details (group name, validity) |
| `POST` | `/api/invites/{code}/redeem` | Authenticated (not approval-gated) | Join the group (auto-approves an unapproved caller) |
| `DELETE` | `/api/groups/{groupId}/invites/{code}` | GroupAdmin | Revoke an invite |

**Auth gates:** the two redeem-side routes (`GET /api/invites/{code}`, `POST /api/invites/{code}/redeem`) sit behind a pass-through `RequireAuthenticated` middleware so an unapproved-but-authenticated user can follow an invite link. All other `/api` routes — including invite create/list/revoke — stay behind `RequireApproved`. Authentication itself is enforced for every `/api` route by the API Gateway JWT authorizer.

### Members

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `DELETE` | `/api/groups/{groupId}/members/{memberId}` | Member/GroupAdmin | Remove member — self-id => leave (sole admin blocked); other id => kick (admin only) |

**Note:** Admin cannot leave/be kicked if they are the only admin.

### Schedules, Comments, Notices

Existing endpoints unchanged.

## Group Management

### Roles
- **GroupAdmin**: Creator of the group. Only 1 admin per group. Can invite, kick, rename, delete group.
- **Member**: Can view schedules, set own attendance, add comments/notices.

### Create Group
1. Create Group record with `AdminId` = requester
2. Create Member record for admin (Role = GroupAdmin)
3. Create default schedule for admin

### Delete Group
**Authorization:** Only GroupAdmin can delete.

**Steps:**
1. Query GSI1: `GSI1PK=group#<groupId>` → returns all members, schedules, comments, notices, invites
2. BatchWriteItem to delete all items
3. Delete Group record: `PK=group#<groupId>, SK=group#<groupId>`

### Remove Member (or Leave Group)
**Authorization:** GroupAdmin can remove any member. Any member can leave (self-remove). Admin cannot leave.

**Items to delete:**

| Entity | Key Pattern |
|--------|-------------|
| Member | `PK=member#<memberId>, SK=group#<groupId>` |
| Default Schedule | `PK=member#<memberId>, SK=schedule#default#group#<groupId>` |
| Weekly Schedules | `PK=member#<memberId>, SK=schedule#<year>-<week>#group#<groupId>` |
| Comments | `PK=member#<memberId>, SK=comments#<year>-<week>#group#<groupId>` |
| Notices | `PK=member#<memberId>, SK=notice#<year>-<week>#group#<groupId>` |

**Implementation:**
```
Query: PK = member#<memberId>   (KeyConditionExpression on PK only)
```
Then keep only items whose SK contains `group#<groupId>`, filtered **in code** — NOT via a DynamoDB FilterExpression. SK is the table's sort key, and DynamoDB rejects primary-key attributes in a FilterExpression (`ValidationException: Filter Expression can only contain non-primary key attributes`). BatchWriteItem to delete the matching items.

## Invite Flow

### Create Invite
1. Validate requester is GroupAdmin
2. Generate crypto-strong 32-char code via `helper.NewInviteCode()` (UUID-derived, normalized uppercase)
3. Save Invite record with TTL = 7 days
4. Return code (frontend builds shareable link)

### Redeem Invite
1. Lookup invite by code
2. Validate not expired (checked in `domain.Invite.IsExpired` — DynamoDB TTL is lazy; code-level check is the source of truth)
3. If requester is already a member, return `alreadyMember=true` (idempotent — no error)
4. Create Member record via conditional `PutItem` (`CreateMemberIfNotExists`) — atomic, never downgrades an existing admin
5. Create default schedule
6. Auto-approve: if the caller's token claim `custom:Approved` is false, flip it to `"true"` via `idp.ApproveUser(cognitoUsername)` (`cognito-idp:AdminUpdateUserAttributes`), then publish a 2nd "auto-approved via invite to &lt;group&gt;" Slack alert to the `alerting-events` SNS topic (shared `notifications.Message` contract). Already-approved callers are not re-approved and produce no alert.

### Invite URL Format
```
https://meal-planner.isnan.eu/invite/{code}
```

### Implementation Notes

- **Invite codes** are crypto-strong 32-char strings (UUID-derived, uppercase hex via `helper.NewInviteCode()`).
- **Invites are reusable** — multiple members can redeem the same code until it expires (7-day TTL) or is explicitly revoked.
- **Expiry is enforced in code** (`domain.Invite.IsExpired`) on every GetInvite / RedeemInvite / ListInvites call. DynamoDB TTL is opportunistic cleanup only, NOT relied on for correctness.
- **Redeem is idempotent**: if the caller is already a member, the handler returns `alreadyMember=true` (HTTP 200) instead of an error.
- **Conditional write on redeem**: `CreateMemberIfNotExists` uses a DynamoDB condition expression to prevent overwriting an existing member record (TOCTOU-safe, admin-role preserved).
- **Revoke authorization**: the handler cross-checks the invite's stored `GroupId` against the URL `{groupId}` parameter to prevent IDOR (path/stored mismatch → 403).
- **Auto-approval on redeem**: redeeming a valid invite auto-approves an unapproved caller, gated on the token's `custom:Approved` claim — `AdminUpdateUserAttributes` sets `custom:Approved="true"`, then a 2nd "auto-approved via invite" Slack alert is published to `alerting-events` via the shared `notifications.Message` contract. **Approval failure is surfaced** to the client (the idempotent redeem can be retried); **alert failure is best-effort** (logged, non-fatal). Uninvited self-registrants remain `custom:Approved=false`, blocked by `RequireApproved`, and still get the existing signup Slack alert.
- **Rename (PUT /api/groups/{groupId})**: updates only the Group record. Denormalized `GroupName` on member/schedule records is intentionally left stale (read-time join not required by current access patterns).
- **LeaveGroup**: the sole admin cannot leave (`ErrSoleAdmin` → 403); they must delete the group instead.
- **HTTP status codes**: these endpoints return proper codes (200/201/204/403/404/409). Older handlers returned 500 for all errors — this behavior is unchanged for those.
- **Rate limiting** on invite lookup/redeem is deferred (accepted risk: 128-bit code space + approved-only access makes brute-force impractical).

## CLI Operations (unchanged)

Offboarding a user globally (via CLI) deletes all their DynamoDB data:
```
Query: PK = member#<memberId>
```
Returns all items across all groups → BatchWriteItem to delete.

