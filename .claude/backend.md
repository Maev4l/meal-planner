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
| **Member** | `member#<id>` | `group#<groupId>` | `group#<groupId>` | `member#<id>` |
| **Schedule** | `member#<id>` | `schedule#<schedId>#group#<groupId>` | `group#<groupId>` | `schedule#<schedId>` |
| **Comments** | `member#<id>` | `comments#<weekId>#group#<groupId>` | `group#<groupId>` | `comments#<weekId>` |
| **Notice** | `member#<id>` | `notice#<weekId>#group#<groupId>` | `group#<groupId>` | `notice#<weekId>` |

### Access Patterns

**Primary Index (member-centric):**
- Get member in a group: `PK=member#<id>, SK=group#<groupId>`
- Get member's schedules/comments/notices: `PK=member#<id>, SK begins_with schedule#|comments#|notice#`

**GSI1 (group-centric):**
- List group members: `GSI1PK=group#<id>, GSI1SK begins_with member#`
- Get group schedules for a week: `GSI1PK=group#<id>, GSI1SK=schedule#<year>-<week>`
- Get group comments/notices: same pattern with `comments#` or `notice#`

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

## Future use cases

### Remove member from a given group

**Items to delete:**

| Entity | Key Pattern |
|--------|-------------|
| Member | `PK=member#<memberId>, SK=group#<groupId>` |
| Default Schedule | `PK=member#<memberId>, SK=schedule#default#group#<groupId>` |
| Weekly Schedules | `PK=member#<memberId>, SK=schedule#<year>-<week>#group#<groupId>` |
| Comments | `PK=member#<memberId>, SK=comments#<year>-<week>#group#<groupId>` |
| Notices | `PK=member#<memberId>, SK=notice#<year>-<week>#group#<groupId>` |

**Current key design limitation:**

The `groupId` is at the **end** of the SK (`schedule#2024-15#group#<groupId>`), so `begins_with` cannot target a specific group directly.

**Recommended approach:** Single query + filter
```
PK = member#<memberId>
FilterExpression: contains(SK, "group#<groupId>")
```
- 1 round trip, simpler implementation
- RCUs: Reads all items for this member (all groups), filter discards unwanted
- Acceptable if members typically belong to few groups

**Note:** `FilterExpression` reduces returned data but **not consumed RCUs**.

**Potential optimization (if needed):**

Restructure SK to put groupId first:
```
SK: group#<groupId>#schedule#<schedId>
SK: group#<groupId>#comments#<weekId>
```
Then `SK begins_with group#<groupId>#` would efficiently target all items for that member-group pair in one query.

### Remove a given group

**Authorization:** Only a `GroupAdmin` of this specific group can remove it.

**Items to delete:**

| Entity | Key Pattern |
|--------|-------------|
| Group | `PK=group#<groupId>, SK=group#<groupId>` |
| All Members | `PK=member#<memberId>, SK=group#<groupId>` |
| All Schedules | `PK=member#<memberId>, SK=schedule#<schedId>#group#<groupId>` |
| All Comments | `PK=member#<memberId>, SK=comments#<weekId>#group#<groupId>` |
| All Notices | `PK=member#<memberId>, SK=notice#<weekId>#group#<groupId>` |

**Recommended approach:** Single GSI1 query

GSI1 enables efficient group-scoped queries since all group-related items share `GSI1PK=group#<groupId>`.

**Steps:**
1. Query GSI1: `GSI1PK=group#<groupId>` → returns all members, schedules, comments, notices
2. Extract PK/SK from each returned item
3. BatchWriteItem to delete all items
4. DeleteItem for the Group record: `PK=group#<groupId>, SK=group#<groupId>` (not in GSI1, delete separately)

**Verdict:** This use case is well supported by the current key design.

### Offboard (remove) a user globally

When removing a user from Cognito, all their DynamoDB data must be deleted.

**Items to delete:**

| Entity | Key Pattern |
|--------|-------------|
| All Memberships | `PK=member#<memberId>, SK=group#<groupId>` |
| All Schedules | `PK=member#<memberId>, SK=schedule#<schedId>#group#<groupId>` |
| All Comments | `PK=member#<memberId>, SK=comments#<weekId>#group#<groupId>` |
| All Notices | `PK=member#<memberId>, SK=notice#<weekId>#group#<groupId>` |

**Recommended approach:** Single primary index query

All items share the same PK, so a single query returns everything:
```
PK = member#<memberId>
```

**Steps:**
1. Query primary index: `PK=member#<memberId>` → returns all items across all groups
2. BatchWriteItem to delete all returned items
3. Delete Cognito user (separate operation)

**Why query first?**

DynamoDB requires the **full primary key** (PK + SK) to delete an item. There is no "delete all items in partition" operation. Each delete needs the exact PK+SK combination, so the query step is unavoidable to discover all SK values.

**Verdict:** Most efficient use case — the partition key design makes this a simple, targeted query with zero wasted RCUs.

