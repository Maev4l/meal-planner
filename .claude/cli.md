# Meal planner CLI

## Design

- Source code: @../packages/cli
- Admin CLI tool written in Golang, using cobra
- Built for the current platform (not Lambda)
- Config from JSON file (`--config`, defaults to `config.json` next to binary)
- Uses AWS IAM credentials (env vars, AWS profile, or instance role)

## Structure

- `cmd/root.go` — root command with `--config` persistent flag
- `cmd/users.go` — users subcommands (list, inspect, delete)
- `cmd/groups.go` — groups subcommands (list, inspect, delete)
- `internal/config/` — config file loader (JSON → userPoolId, region, tableName)
- `internal/cognito/` — Cognito client (ListUsers, GetUser, DeleteUser)
- `internal/dynamodb/` — DynamoDB client (QueryByPK, QueryByGSI1, ScanGroups, DeleteItems)

## Configuration

The CLI reads a JSON config file (`--config`, defaults to `config.json` next to binary):

```json
{
  "userPoolId": "Cognito user pool ID (e.g. eu-central-1_XXXXXXX)",
  "region": "AWS region (e.g. eu-central-1)",
  "tableName": "DynamoDB table name (e.g. meal-planner-data)"
}
```

## Authentication

The CLI uses AWS IAM credentials to access Cognito and DynamoDB directly. Credentials are resolved via the standard AWS SDK chain:

1. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. AWS credentials file (`~/.aws/credentials`)
3. IAM instance role (when running on EC2/Lambda)

## Commands

### Users
- `users list` — lists all users (ID, NAME, APPROVED, CREATED AT) from Cognito
- `users inspect <id>` — shows all DynamoDB items for a user (memberships, schedules, comments, notices)
- `users approve <id>` — approve a user (set custom:Approved = true)
- `users unapprove <id>` — unapprove a user (set custom:Approved = false)
- `users delete <id>` — deletes all DynamoDB items and removes user from Cognito
  - `--dry-run` — show what would be deleted without making changes
  - `-f, --force` — skip confirmation prompt

### Groups
- `groups list` — lists all groups (ID, NAME, CREATED AT) from DynamoDB
- `groups inspect <id>` — shows group members and weekly schedules
- `groups delete <id>` — deletes group and all associated data (memberships, schedules, comments, notices)
  - `--dry-run` — show what would be deleted without making changes
  - `-f, --force` — skip confirmation prompt

## Tasks

- [x] Scaffold CLI package as yarn workspace
- [x] Refactor to use AWS SDK directly instead of HTTP API
- [x] Add `users list` command
- [x] Add `users inspect` command
- [x] Add `users delete` command with dry-run
- [x] Add `groups list` command
- [x] Add `groups inspect` command
- [x] Add `groups delete` command with dry-run
- [ ] Add more admin commands (TBD)
