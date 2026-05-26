# AWS Lambda Web Adapter Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the `meal-planner-api` Lambda from the deprecated `aws-lambda-go-api-proxy` library to AWS Lambda Web Adapter (LWA) via a Lambda Layer, so the binary runs as a normal HTTP server both in AWS and locally.

**Architecture:** Replace the `init()`-style proxy adapter with a plain `gin.Engine.Run(":$PORT")` in `main()`. Add the public LWA layer (arm64 `:27`) to the Lambda; LWA's extension intercepts the runtime API and forwards events to `127.0.0.1:8080`. Terraform diff is additive; API Gateway, IAM, Cognito unchanged.

**Tech Stack:** Go 1.25, Gin, zerolog, AWS Lambda (provided.al2023, arm64), AWS Lambda Web Adapter (layer), Terraform, yarn workspaces.

**Spec:** `docs/superpowers/specs/2026-05-26-lwa-migration-design.md`

---

## File Structure

**Create:**
- `packages/functions/api/internal/core/handlers/logger.go` — `HttpLogger` Gin middleware (zerolog-based; replaces `gin.Default()`'s built-in Logger).
- `packages/functions/api/.env.local.example` — committed template documenting required env vars for local runs.

**Modify:**
- `packages/functions/api/cmd/api/main.go` — full rewrite. `gin.New()` + middlewares + routes + `router.Run(":$PORT")`. Drops Lambda-handler imports and the CORS middleware.
- `packages/functions/go.mod` / `packages/functions/go.sum` — flushed by `go mod tidy` after the rewrite. Drops `aws-lambda-go-api-proxy` and `gin-contrib/cors`.
- `packages/functions/Makefile` — adds `run-api-local` target.
- `packages/infrastructure/functions.tf` — new LWA layer locals; `layers` arg + two env vars on `module "api"`.
- `.gitignore` — append `packages/functions/api/.env.local`.

**Delete:**
- `packages/functions/api/cmd/authorizer/` — entire folder. Not built by the Makefile, not referenced by Terraform (API GW uses a native Cognito JWT authorizer).

---

## Task ordering rationale

Code lands first, then Terraform, then deploy. Reasoning: `yarn backend:deploy` always rebuilds and applies in one shot, so we must not run it until *both* code and Terraform are committed. Intermediate commits are safe — nothing deploys to AWS until Task 8.

---

### Task 1: Add `HttpLogger` middleware

**Files:**
- Create: `packages/functions/api/internal/core/handlers/logger.go`

- [ ] **Step 1: Write the middleware**

Create `packages/functions/api/internal/core/handlers/logger.go`:

```go
package handlers

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// HttpLogger logs each request with method, path, status, and latency using
// zerolog. It replaces gin.Default()'s built-in Logger so the API's request
// logs match the project's structured-logging style.
func HttpLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		log.Info().
			Str("method", c.Request.Method).
			Str("path", c.Request.URL.Path).
			Int("status", c.Writer.Status()).
			Dur("latency", time.Since(start)).
			Msg("request")
	}
}
```

- [ ] **Step 2: Verify the package compiles**

Run from `packages/functions/`:

```bash
go build ./api/...
```

Expected: succeeds with no output. (The new symbol is unused at this point — Go allows unused exported functions.)

- [ ] **Step 3: Commit**

```bash
git add packages/functions/api/internal/core/handlers/logger.go
git commit -m "feat: add HttpLogger zerolog Gin middleware"
```

---

### Task 2: Rewrite `cmd/api/main.go` to a plain HTTP server

**Files:**
- Modify: `packages/functions/api/cmd/api/main.go` (full rewrite)

- [ ] **Step 1: Replace `main.go` contents**

Replace the entire contents of `packages/functions/api/cmd/api/main.go` with:

```go
package main

import (
	"os"

	"github.com/gin-gonic/gin"
	"isnan.eu/meal-planner/functions/api/internal/core/handlers"
	"isnan.eu/meal-planner/functions/api/internal/core/repositories"
	"isnan.eu/meal-planner/functions/api/internal/core/services"
)

func main() {
	gin.SetMode(gin.ReleaseMode)

	router := gin.New()
	router.Use(handlers.HttpLogger())
	router.Use(gin.Recovery())
	router.Use(handlers.RequireApproved())

	r := repositories.NewDynamoDB()
	c := repositories.NewCognito()
	s := services.New(r, c)
	h := handlers.NewHTTPHandler(s)

	// Routes — preserved bit-for-bit from the previous main.go.
	router.POST("/api/groups", h.CreateGroup)
	router.POST("/api/groups/:groupId/members", h.CreateMember)
	router.POST("/api/groups/:groupId/schedules", h.CreateSchedule)
	router.POST("/api/groups/:groupId/comments", h.CreateComments)
	router.POST("/api/groups/:groupId/notices", h.CreateNotice)
	router.DELETE("/api/groups/:groupId/notices/:period", h.DeleteNotice)
	router.GET("/api/schedules/:period", h.GetSchedules)

	// PORT is injected by the LWA layer in AWS; defaults to 8080 for local runs.
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	_ = router.Run(":" + port)
}
```

- [ ] **Step 2: Verify the package compiles**

Run from `packages/functions/`:

```bash
go build ./api/cmd/api
```

Expected: succeeds with no output. (`go.mod` still lists the dropped libs but nothing imports them — Go is happy.)

- [ ] **Step 3: Verify the Lambda-target build still works**

Run from `packages/functions/`:

```bash
make build-api
```

Expected: produces `api/bin/bootstrap`. No errors.

- [ ] **Step 4: Commit**

```bash
git add packages/functions/api/cmd/api/main.go
git commit -m "refactor: rewrite api main.go as plain Gin HTTP server"
```

---

### Task 3: Run `go mod tidy` to drop unused dependencies

**Files:**
- Modify: `packages/functions/go.mod`, `packages/functions/go.sum`

- [ ] **Step 1: Run tidy**

Run from `packages/functions/`:

```bash
go mod tidy
```

- [ ] **Step 2: Verify the deprecated libs are gone**

Run from `packages/functions/`:

```bash
grep -E "aws-lambda-go-api-proxy|gin-contrib/cors" go.mod
```

Expected: no matches (exit code 1).

Then verify `aws-lambda-go` remains (still used by `user-management`):

```bash
grep "aws-lambda-go " go.mod
```

Expected: one match (`github.com/aws/aws-lambda-go vX.Y.Z`).

- [ ] **Step 3: Verify the full build still succeeds**

Run from `packages/functions/`:

```bash
make build
```

Expected: produces both `api/bin/bootstrap` and `user-management/bin/bootstrap`. No errors.

- [ ] **Step 4: Commit**

```bash
git add packages/functions/go.mod packages/functions/go.sum
git commit -m "chore: drop aws-lambda-go-api-proxy and gin-contrib/cors"
```

---

### Task 4: Delete dead `cmd/authorizer/` folder

**Files:**
- Delete: `packages/functions/api/cmd/authorizer/` (entire folder)

- [ ] **Step 1: Delete the folder**

```bash
rm -rf packages/functions/api/cmd/authorizer
```

- [ ] **Step 2: Verify no references exist**

```bash
grep -rn "cmd/authorizer" packages/ Makefile 2>/dev/null || true
grep -rn "authorizer" packages/functions/Makefile packages/infrastructure/*.tf 2>/dev/null || true
```

Expected: no matches against `cmd/authorizer` paths. (The infrastructure does reference an `authorizer` block on the API Gateway module — that's the native JWT authorizer config, unrelated.)

- [ ] **Step 3: Verify the build still succeeds**

Run from `packages/functions/`:

```bash
make build
```

Expected: produces both binaries. No errors.

- [ ] **Step 4: Commit**

```bash
git add -A packages/functions/api/cmd/authorizer
git commit -m "chore: remove unused cmd/authorizer folder"
```

(Note: `git add -A` on a deleted directory stages the deletions.)

---

### Task 5: Add LWA layer to Terraform

**Files:**
- Modify: `packages/infrastructure/functions.tf`

- [ ] **Step 1: Add LWA layer locals**

In `packages/infrastructure/functions.tf`, replace the existing `locals` block (lines 3-6) with:

```hcl
locals {
  api_filename             = "../functions/api/dist/bootstrap.zip"
  user_management_filename = "../functions/user-management/dist/bootstrap.zip"

  # AWS Lambda Web Adapter (arm64) - publisher account 753240598075.
  # Bump intentionally; release notes:
  # https://github.com/aws/aws-lambda-web-adapter/releases
  lwa_layer_version = 27
  lwa_layer_arn     = "arn:aws:lambda:${var.region}:753240598075:layer:LambdaAdapterLayerArm64:${local.lwa_layer_version}"
}
```

- [ ] **Step 2: Add `layers` arg and LWA env vars to `module "api"`**

In `packages/infrastructure/functions.tf`, modify `module "api"` (currently lines 8-30) to add the `layers` argument after `additional_policy_arns`, and add `PORT` + `AWS_LWA_INVOKE_MODE` to `environment_variables`. The full module should read:

```hcl
module "api" {
  source = "github.com/Maev4l/terraform-modules//modules/lambda-function?ref=v1.7.1"

  function_name = "meal-planner-api"
  architecture  = "arm64"
  memory_size   = 128
  timeout       = 7

  additional_policy_arns = [aws_iam_policy.api.arn]

  # AWS Lambda Web Adapter (arm64). The layer's Extension intercepts the
  # Lambda runtime API and forwards events as HTTP requests to PORT.
  layers = [local.lwa_layer_arn]

  zip = {
    filename = local.api_filename
    runtime  = "provided.al2023"
    handler  = "bootstrap"
    hash     = filebase64sha256("../functions/api/bin/bootstrap")
  }

  environment_variables = {
    DYNAMODB_TABLE_NAME = aws_dynamodb_table.meal_planner.name
    REGION              = var.region
    USER_POOL_ID        = aws_cognito_user_pool.meal_planner.id

    # AWS Lambda Web Adapter forwards events to this port on 127.0.0.1.
    # Must match the port the Gin server binds to in api/cmd/api/main.go.
    PORT                = "8080"
    AWS_LWA_INVOKE_MODE = "buffered"
  }
}
```

- [ ] **Step 3: Format and validate**

Run from `packages/infrastructure/`:

```bash
terraform fmt -check
terraform validate
```

Expected: `fmt -check` exits 0 (no changes needed). `validate` reports `Success! The configuration is valid.`

If `fmt -check` reports diffs, run `terraform fmt` to apply them.

- [ ] **Step 4: Verify the LWA layer ARN resolves in eu-central-1**

```bash
aws lambda list-layer-versions \
  --layer-name LambdaAdapterLayerArm64 \
  --region eu-central-1 \
  --query "LayerVersions[?Version==\`27\`].LayerVersionArn" \
  --output text
```

Expected: prints `arn:aws:lambda:eu-central-1:753240598075:layer:LambdaAdapterLayerArm64:27`. If empty, the layer is not yet published in eu-central-1 — stop and investigate before deploying.

- [ ] **Step 5: Commit**

```bash
git add packages/infrastructure/functions.tf
git commit -m "feat: add AWS Lambda Web Adapter layer to api lambda"
```

---

### Task 6: Add `run-api-local` Makefile target and `.env.local` pattern

**Files:**
- Modify: `packages/functions/Makefile`
- Create: `packages/functions/api/.env.local.example`
- Modify: `.gitignore`

- [ ] **Step 1: Update `.PHONY` and add the Makefile target**

In `packages/functions/Makefile`:

1. On line 1, append `run-api-local` to the `.PHONY` list:

```makefile
.PHONY: build build-api build-user-management package package-api package-user-management clean test run-api-local
```

2. Append this target at the end of the file:

```makefile
# Run the API lambda locally as a plain HTTP server (Web Adapter mode).
# Requires AWS credentials in the environment (e.g. `aws sso login`)
# and env vars sourced from api/.env.local (gitignored).
run-api-local:
	@set -a && . ./api/.env.local && set +a && go run ./api/cmd/api
```

- [ ] **Step 2: Create the env file template**

Create `packages/functions/api/.env.local.example`:

```bash
# Copy to .env.local and fill in real dev values.
# .env.local is gitignored; this template is committed.

# AWS region for the dev environment.
REGION=eu-central-1

# Cognito user pool id for the dev environment (e.g. eu-central-1_XXXXXXX).
USER_POOL_ID=

# DynamoDB table name for the dev environment.
DYNAMODB_TABLE_NAME=meal-planner-data

# Optional: override the HTTP port the Gin server binds to. Defaults to 8080.
# PORT=8080
```

- [ ] **Step 3: Add `.env.local` to `.gitignore`**

Append to `.gitignore`:

```
# Local dev env file for the api lambda (gitignored on purpose; see api/.env.local.example).
packages/functions/api/.env.local
```

- [ ] **Step 4: Sanity-check the Makefile syntax**

Run from `packages/functions/`:

```bash
make -n run-api-local
```

Expected: prints the command (`@set -a && . ./api/.env.local ...`) without executing. No "missing separator" or other Makefile errors.

- [ ] **Step 5: Commit**

```bash
git add packages/functions/Makefile packages/functions/api/.env.local.example .gitignore
git commit -m "feat: add run-api-local Makefile target and env template"
```

---

### Task 7: Pre-deploy review

- [ ] **Step 1: Inspect the diff that will be applied**

```bash
git log --oneline master..HEAD
git diff master..HEAD -- packages/infrastructure/functions.tf
```

Expected: a handful of commits from Tasks 1-6, and the Terraform diff shows only the new `locals`, the new `layers` arg, and the two new env vars on `module "api"`.

- [ ] **Step 2: Confirm the build artifact is fresh**

Run from `packages/functions/`:

```bash
make package
```

Expected: produces `api/dist/bootstrap.zip` and `user-management/dist/bootstrap.zip`. No errors.

---

### Task 8: Deploy

**STOP before this task — confirm with the user.** Deployment is a non-reversible side effect on AWS.

- [ ] **Step 1: Deploy**

Run from the repo root:

```bash
yarn backend:deploy
```

Expected: `make package` runs, then `terraform apply -auto-approve` runs and reports the in-place update of `module.api.aws_lambda_function.this` (or equivalent address) with three attribute diffs: `layers`, `environment.variables`, `source_code_hash`. No other resource diffs.

- [ ] **Step 2: Confirm the apply completed**

The final line should read `Apply complete! Resources: 0 added, 1 changed, 0 destroyed.`

---

### Task 9: Post-deploy verification

These checks confirm behavioral parity. Execute from the production web client signed in as an approved user (use a real Cognito ID token in the `Authorization: Bearer <jwt>` header for direct curl calls).

- [ ] **Step 1: Exercise routes through the web client**

Sign in to `https://meal-planner.isnan.eu` and:
- Open a group's weekly schedule — exercises `GET /api/schedules/:period`.
- Create a new group via the UI — exercises `POST /api/groups`.
- Update your schedule for a meal — exercises `POST /api/groups/:groupId/schedules`.
- Add and then reset a notice — exercises `POST /api/groups/:groupId/notices` and `DELETE /api/groups/:groupId/notices/:period`.

Expected: each action succeeds in the UI; no error toasts; data round-trips correctly.

- [ ] **Step 2: Confirm `RequireApproved` still gates unapproved users**

Using an unapproved-user JWT (or sign up a new user that hasn't been approved yet):

```bash
curl -i -H "Authorization: Bearer <unapproved-jwt>" \
  https://meal-planner.isnan.eu/api/schedules/2026-21
```

Expected: HTTP 403 with body `{"message":"User not approved."}`.

- [ ] **Step 3: Check CloudWatch logs for the cold-start signature**

In the AWS console, open the `/aws/lambda/meal-planner-api` log group and inspect the most recent log stream (cold start).

Expected:
- A log line from Gin similar to `Listening and serving HTTP on :8080`.
- One or more structured `"message":"request"` log lines from the new `HttpLogger`.
- No `panic`, `connection refused`, or `EOF` errors.

- [ ] **Step 4: Spot-check latency**

In the AWS Lambda console for `meal-planner-api`, open the **Monitoring** tab and compare the last hour of `Duration` metrics (p50, p95) against the same time window the previous day.

Expected: same order of magnitude. A small cold-start uplift (~tens of ms) is expected; sustained warm latency should be unchanged.

- [ ] **Step 5: Rollback plan (only if verification fails)**

If any of the above fail in a way that suggests the migration is at fault:

```bash
# Verify the 6 task commits to revert (one per Task 1-6).
git log --oneline master..HEAD

# Revert them as a single new commit on top of the current branch.
git revert --no-commit HEAD~6..HEAD
git commit -m "revert: roll back LWA migration"

# Redeploy the reverted code (restores previous binary, drops the layer).
yarn backend:deploy
```

Single-step rollback is safe because no schema, IAM, or auth changes were made.

---

## Notes

- The `aws-lambda-go` module stays in `go.mod` even after `go mod tidy` — `user-management` still imports it.
- The `cmd/authorizer/` deletion is unrelated to the LWA migration but bundled here because it's a tiny one-shot cleanup discovered during the audit.
- No new unit or integration tests are written by this plan. The spec scopes that out as an orthogonal initiative; the verification checklist is the migration's test.
