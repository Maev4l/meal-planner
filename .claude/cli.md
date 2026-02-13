# Meal planner CLI

## Design

- Source code: @../packages/cli
- Admin CLI tool written in Golang, using cobra
- Built for the current platform (not Lambda)
- Config from JSON file (`--config`, defaults to `./config.json`), same format as serverless output.json
- Auth via Cognito (`--username` / `--password` persistent flags on root command)

## Structure

- `cmd/root.go` — root command with persistent flags (config, username, password)
- `cmd/users.go` — `users list` subcommand
- `internal/config/` — config file loader (JSON → apiURL, region, userPoolId, clientId)
- `internal/auth/` — Cognito authentication (USER_PASSWORD_AUTH flow → IdToken)
- `internal/api/` — API client and response models

## Configuration

The CLI reads a JSON config file (`--config`, defaults to `./config.json`):

```json
{
  "clientId": "Cognito app client ID",
  "userPoolId": "Cognito user pool ID (e.g. eu-west-1_XXXXXXX)",
  "region": "AWS region (e.g. eu-west-1)",
  "url": "Full API URL (e.g. https://api-meal-planner.isnan.eu)"
}
```

## Authentication

Cognito credentials can be provided via flags or environment variables. Flags take precedence.

| Method | Username | Password |
|--------|----------|----------|
| Flag | `--username` | `--password` |
| Env var | `MPCLI_USERNAME` | `MPCLI_PASSWORD` |

## Commands

- `users list` — lists all users (ID, NAME, ROLE, CREATED AT) via `GET /api/appadmin/users`

## Tasks

- [x] Scaffold CLI package as yarn workspace
- [x] Add `users list` command
- [ ] Add more admin commands (TBD)
