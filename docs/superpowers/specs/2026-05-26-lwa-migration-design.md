# Migrate `api` Lambda from `aws-lambda-go-api-proxy` to AWS Lambda Web Adapter

**Status:** Design approved
**Date:** 2026-05-26
**Scope:** `packages/functions/api` only

## Problem

The `api` Lambda uses `github.com/awslabs/aws-lambda-go-api-proxy/gin` to bridge API Gateway HTTP API v2 events to a Gin router. The library is sunset (GitHub repo archived, no releases ever published, last commit 2024-12-11). AWS now publishes and recommends [AWS Lambda Web Adapter (LWA)](https://github.com/aws/aws-lambda-web-adapter) as the supported way to run web frameworks on Lambda. LWA is distributed as a public Lambda Layer and lets the function run as a normal HTTP server with no code coupling to Lambda's runtime API.

## Scope

Only the `api` Lambda (`packages/functions/api/cmd/api/main.go`) is affected. The `user-management` Lambda is Cognito-trigger-driven and never used the proxy library — untouched.

Bundled cleanup: delete `packages/functions/api/cmd/authorizer/` (unbuilt by the Makefile, unreferenced by Terraform — API GW uses a native Cognito JWT authorizer). The folder is dead code.

The migration includes an ergonomics win: the rewritten `main.go` becomes a plain Gin HTTP server, runnable locally with `go run ./api/cmd/api`. No Lambda emulator needed.

## Goals

1. Remove `github.com/awslabs/aws-lambda-go-api-proxy` from `go.mod`.
2. Replace it with the LWA Lambda Layer (arm64, version 27).
3. Make the `api` lambda runnable locally as a standard HTTP server.
4. Preserve all existing behavior: routes, auth, response shapes, API Gateway integration.

## Non-goals

- Moving the `api` Lambda to a container image.
- Touching the `user-management` Lambda.
- Introducing integration tests (none exist today; orthogonal initiative).
- LocalStack or any AWS-services stub for offline development. Local runs hit real AWS (dev account).

## Verified facts

- Only `packages/functions/api/cmd/api/main.go:8` imports `aws-lambda-go-api-proxy`.
- `RequireApproved` reads the JWT from `c.Request.Header.Get("Authorization")` (`packages/functions/api/internal/core/handlers/helper.go:47`). Auth does **not** rely on API Gateway request-context injection → migration is transparent at the auth layer.
- `github.com/Maev4l/terraform-modules//modules/lambda-function?ref=v1.7.1` already exposes `var.layers` (`list(string)`). No module bump required.
- LWA on zip works via the **Lambda Extension** mechanism: the layer installs `/opt/extensions/lambda-adapter`, which Lambda auto-loads. No `AWS_LAMBDA_EXEC_WRAPPER` needed.
- LWA layer ARN (arm64): `arn:aws:lambda:<region>:753240598075:layer:LambdaAdapterLayerArm64:27`. Account `753240598075` is AWS's public LWA publisher.
- `cmd/authorizer/main.go` is not built by `packages/functions/Makefile` and is not referenced by Terraform — the API Gateway in `packages/infrastructure/functions.tf` uses a native Cognito JWT authorizer.

## Architecture

### Before

```
API GW HTTP API v2 (JWT authorizer, Cognito)
  → invokes Lambda with events.APIGatewayV2HTTPRequest
  → main() calls lambda.Start(handler)
  → handler delegates to ginadapter.GinLambdaV2.ProxyWithContext()
  → adapter synthesizes a net/http request → Gin router
```

### After

```
API GW HTTP API v2 (JWT authorizer, Cognito)            (unchanged)
  → invokes Lambda; LWA Extension on the layer intercepts the runtime API
  → LWA translates the event → real HTTP request on 127.0.0.1:$PORT
  → main() previously called gin.Engine.Run(":$PORT"); serves the request
  → LWA translates the response back to APIGatewayV2HTTPResponse
```

Consequences:

- Gin code is a normal HTTP server. `go run ./api/cmd/api` works locally.
- The `init()` + global `ginLambda` pattern goes away. Wiring moves into `main()`.
- Deprecated proxy package and the synthetic-request shim disappear from the call path.
- Cold start adds a small one-time cost (extension spin-up + child-process readiness) — typically a few tens of ms. Negligible for this app's interactive UX.

## Code changes

### `packages/functions/api/cmd/api/main.go` — full rewrite

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

	router.POST("/api/groups", h.CreateGroup)
	router.POST("/api/groups/:groupId/members", h.CreateMember)
	router.POST("/api/groups/:groupId/schedules", h.CreateSchedule)
	router.POST("/api/groups/:groupId/comments", h.CreateComments)
	router.POST("/api/groups/:groupId/notices", h.CreateNotice)
	router.DELETE("/api/groups/:groupId/notices/:period", h.DeleteNotice)
	router.GET("/api/schedules/:period", h.GetSchedules)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	_ = router.Run(":" + port)
}
```

### `packages/functions/api/internal/core/handlers/logger.go` — new file

Replaces `gin.Default()`'s built-in Logger. Uses zerolog (already imported elsewhere in the project) for structured logs that match the rest of the codebase.

```go
package handlers

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

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

### What disappears

- `import ginadapter "github.com/awslabs/aws-lambda-go-api-proxy/gin"`
- `import "github.com/aws/aws-lambda-go/events"`
- `import "github.com/aws/aws-lambda-go/lambda"`
- `import "github.com/gin-contrib/cors"`
- The `init()` function (logic merges into `main()`).
- `var ginLambda *ginadapter.GinLambdaV2`.
- The `handler(ctx, req)` adapter function.
- `lambda.Start(handler)`.
- CORS middleware setup. CloudFront fronts the API on the same origin; CORS headers were dead.

### What stays bit-for-bit identical

- Every route registration (`POST /api/groups`, `POST /api/groups/:groupId/members`, schedules, comments, notices, etc.).
- The `/api/` base path. API GW route `ANY /api/{proxy+}` still matches.
- `RequireApproved` middleware behavior — still reads `Authorization` header, doesn't depend on Lambda event context.
- Handler signatures — they only depend on `*gin.Context`, never on Lambda events.
- All repository and service wiring.

### Cleanup

- Delete `packages/functions/api/cmd/authorizer/` (entire folder).

### `go.mod`

- Remove `github.com/awslabs/aws-lambda-go-api-proxy v0.16.0`.
- Remove `github.com/gin-contrib/cors v1.5.0`.
- Keep `github.com/aws/aws-lambda-go v1.47.0` — `user-management` still needs it.
- Run `go mod tidy` to flush transitive deps the proxy and cors libs uniquely pulled in.

### Build pipeline

`packages/functions/Makefile` is unchanged. Still:

```makefile
GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o api/bin/bootstrap ./api/cmd/api
```

The output binary just happens to be an HTTP server instead of a Lambda handler. `provided.al2023` doesn't care what `bootstrap` does internally — it's the layer's Extension that intercepts events.

## Terraform changes

File: `packages/infrastructure/functions.tf`. Only `module "api"` is touched.

### LWA layer pinning (new locals)

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

### `module "api"` diff (additive)

```hcl
module "api" {
  source = "github.com/Maev4l/terraform-modules//modules/lambda-function?ref=v1.7.1"

  function_name = "meal-planner-api"
  architecture  = "arm64"
  memory_size   = 128
  timeout       = 7

  additional_policy_arns = [aws_iam_policy.api.arn]

  layers = [local.lwa_layer_arn]   # NEW

  zip = {
    filename = local.api_filename
    runtime  = "provided.al2023"   # unchanged
    handler  = "bootstrap"         # unchanged
    hash     = filebase64sha256("../functions/api/bin/bootstrap")
  }

  environment_variables = {
    DYNAMODB_TABLE_NAME = aws_dynamodb_table.meal_planner.name
    REGION              = var.region
    USER_POOL_ID        = aws_cognito_user_pool.meal_planner.id

    # NEW: LWA-specific
    PORT                = "8080"     # port the Go HTTP server binds to
    AWS_LWA_INVOKE_MODE = "buffered" # default; explicit for clarity (vs response_stream)
  }
}
```

### What does not change

- `module "api_trigger"`: API GW HTTP API v2, JWT Cognito authorizer, route `ANY /api/{proxy+}`. LWA is transparent.
- `module "user_management"` and its Cognito trigger.
- IAM policies, DynamoDB, CloudFront, Route 53, ACM, SSM.
- `timeout = 7`. LWA forwards the request and waits on the HTTP response; Lambda's clock still bounds the whole interaction.

### Expected `terraform plan` shape

Diffs against `aws_lambda_function.meal-planner-api`:

1. `layers` adds the LWA arm64 ARN (version 27).
2. `environment.variables` gains `PORT` and `AWS_LWA_INVOKE_MODE`.
3. Source code hash changes (new `bootstrap` binary).

No other diffs anywhere in the plan.

## Local development

### Running the API locally

From `packages/functions/`:

```bash
REGION=eu-central-1 \
USER_POOL_ID=<dev-pool-id> \
DYNAMODB_TABLE_NAME=meal-planner-data \
go run ./api/cmd/api
```

Server listens at `http://localhost:8080/api/...`. AWS SDK calls pick up credentials from the shell environment (e.g. `aws sso login` or `~/.aws/credentials`), same way the Lambda picks up its execution-role credentials.

### Makefile target

```makefile
# Run the API lambda locally as a plain HTTP server (Web Adapter mode).
# Requires AWS credentials in the environment (e.g. `aws sso login`)
# and env vars sourced from .env.local (gitignored).
run-api-local:
	@set -a && . ./api/.env.local && set +a && go run ./api/cmd/api
```

### Env file pattern

- `packages/functions/api/.env.local` — gitignored, holds real dev values.
- `packages/functions/api/.env.local.example` — committed template documenting the required variables for new contributors.
- `.gitignore` addition: `packages/functions/api/.env.local`.

### Hitting the local API with auth

`RequireApproved` parses the Cognito ID token from the `Authorization` header and checks `custom:Approved`. Use a real dev-pool JWT (sign in via the dev web client, copy the `idToken` from devtools, send as `Authorization: Bearer <jwt>`). Do not add a "skip auth in dev" code path — code branches that exist only for local development violate the project's guidance against fallbacks that can't happen in prod.

## Rollout

Small blast radius (one lambda, additive Terraform diff). Single straight-line cutover.

### Order of operations

1. **Code change** — rewrite `api/cmd/api/main.go`, add `handlers/logger.go`, drop deprecated imports, delete `cmd/authorizer/`, `go mod tidy`.
2. **Terraform change** — add LWA layer locals + `layers` arg + `PORT`/`AWS_LWA_INVOKE_MODE` env vars on `module "api"`.
3. **Deploy** — `yarn backend:deploy`. Builds, packages, and `terraform apply -auto-approve` in one step.
4. **Post-deploy verification** (below). On failure: revert the commit and re-run `yarn backend:deploy`. Single-step rollback since no schema/auth changes.

### Post-deploy verification checklist

Exercise representative routes from the production web client:

- `GET /api/schedules/<period>` — read path, JWT auth, query a real week.
- `POST /api/groups` — write path, JSON body parsing.
- `POST /api/groups/{groupId}/schedules` — path params + body.
- `DELETE /api/groups/{groupId}/notices/{period}` — DELETE method.
- An unapproved-user request — confirm `RequireApproved` still returns 403.

CloudWatch checks:

- Cold-start log line shows the Gin server starting (e.g. `Listening and serving HTTP on :8080`).
- No `panic` or `connection refused` errors (would indicate LWA forwarded before Gin bound the port — unlikely at 128MB on arm64 but worth confirming on first cold start).
- p50 / p99 latency roughly unchanged vs. pre-migration baseline.

### Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| LWA layer version `:27` not available in `eu-central-1` | Low | Verify with `aws lambda list-layer-versions --layer-name LambdaAdapterLayerArm64 --region eu-central-1` before deploying. AWS publishes to all standard regions. |
| Cold-start race: LWA forwards before Gin listens on `:8080` | Very low at 128MB on arm64 | If observed: add `AWS_LWA_READINESS_CHECK_PATH=/health` env var + a `GET /health` route returning 200. Not included by default — YAGNI. |
| Memory creep from running the LWA extension | Low (~10 MB) | Function is at 128 MB; bump to 192 MB if RSS climbs. Measure post-deploy first. |
| CORS removal breaks a direct caller of the API GW execute-api URL | Very low | Web client goes through CloudFront on the same origin; CORS headers were dead. No external caller is known. |
| Lost behavior in the old proxy library's request synthesis (e.g. path/query encoding) | Low | Smoke-test the route set post-deploy. Handler signatures depend only on `*gin.Context`, so behavioral parity is high. |

## Open questions

None at the time of writing. The LWA layer version (`:27`) is pinned per current release.
