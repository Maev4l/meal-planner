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

### Cognito Configuration

- User Pool: `meal-planner`
- Auth domain: `meal-planner-auth.isnan.eu` (custom domain with wildcard cert)
- Self-registration enabled (admin approval via `custom:Approved` attribute)
- Google OAuth identity provider
- Lambda triggers: `user-management` (pre_sign_up, post_confirmation)
- Token TTLs: access/ID = 60 min, refresh = 1 year (absolute expiry; re-login required yearly or on explicit sign-out, password change, or admin disable)

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
| `GET` | `/api/invites/{code}` | Authenticated | Get invite details (group name, validity) |
| `POST` | `/api/invites/{code}/redeem` | Authenticated | Join the group |
| `DELETE` | `/api/groups/{groupId}/invites/{code}` | GroupAdmin | Revoke an invite |

### Members

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `DELETE` | `/api/groups/{groupId}/members/{memberId}` | GroupAdmin | Remove member (delete all their group data) |
| `DELETE` | `/api/groups/{groupId}/members/me` | Member | Leave group (self-remove) |

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
Query: PK = member#<memberId>
FilterExpression: contains(SK, "group#<groupId>")
```
Then BatchWriteItem to delete all matching items.

## Invite Flow

### Create Invite
1. Validate requester is GroupAdmin
2. Generate unique code (e.g., 8-char alphanumeric)
3. Save Invite record with TTL = 7 days
4. Return code (frontend builds shareable link)

### Redeem Invite
1. Lookup invite by code
2. Validate not expired
3. Check user not already member of group
4. Create Member record (Role = Member)
5. Create default schedule
6. (Optional) Delete invite after redemption or keep for reuse

### Invite URL Format
```
https://meal-planner.isnan.eu/invite/{code}
```

## CLI Operations (unchanged)

Offboarding a user globally (via CLI) deletes all their DynamoDB data:
```
Query: PK = member#<memberId>
```
Returns all items across all groups → BatchWriteItem to delete.

