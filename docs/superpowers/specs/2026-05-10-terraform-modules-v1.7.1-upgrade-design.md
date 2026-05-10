# terraform-modules v1.6.0 → v1.7.1 upgrade

**Date:** 2026-05-10
**Scope:** `packages/infrastructure/functions.tf` (Lambda-related modules only)
**Intent:** Like-for-like migration. Preserve all live resources via `terraform state mv`. One unavoidable resource recreation — see "Residual recreation" below.

## Residual recreation (discovered during migration)

v1.7.1 templated the `aws_lambda_permission` `statement_id` from a literal `"AllowAPIGatewayInvoke"` (v1.6.0) to `"AllowAPIGatewayInvoke-${each.key}"` (v1.7.1). `statement_id` is a `ForceNew` attribute in the AWS provider, so the permission is destroyed and recreated on apply — no in-place mutation possible, no state surgery can fix it (the value is baked into the live Lambda resource policy).

**Impact:** sub-second window during apply where API Gateway lacks permission to invoke the Lambda. Requests landing in that gap get 5xx. Accepted as negligible for meal-planner traffic.

**Final post-migration `terraform plan`:** `Plan: 1 to add, 0 to change, 1 to destroy` (the one permission only — all other resources unchanged).

## Why upgrade

v1.7.1's `lambda-trigger-apigw` module supports multiple Lambda integrations behind a single HTTP API. The interface was reshaped (breaking change) to make integrations a map. Adopting v1.7.1 now keeps the codebase aligned with the latest module release and unlocks adding more integrations later without another breaking bump.

The other two modules in use (`lambda-function`, `lambda-trigger-cognito`) have no interface changes between v1.6.0 and v1.7.1 — only the `?ref` tag changes.

## Module changes

### `lambda-trigger-apigw` (breaking)

| v1.6.0 (top-level) | v1.7.1 (inside `integrations` map) |
|---|---|
| `function_name` | `integrations.<key>.function_name` |
| `function_arn` | `integrations.<key>.function_arn` |
| `invoke_arn` | `integrations.<key>.invoke_arn` |
| `routes` | `integrations.<key>.routes` |
| (api name = `${function_name}-http-api`) | new top-level `api_name` (renders as `${api_name}-http-api`) |

All other variables (`stage_name`, `custom_domain`, `authorizer`, `cors`, `disable_execute_api_endpoint`, `tags`) are unchanged.

All outputs (`api_id`, `api_endpoint`, `execution_arn`, `stage_id`, `custom_domain_url`, `authorizer_id`) are preserved. New `integration_ids` output is added but not needed here.

### `lambda-function`, `lambda-trigger-cognito`

No interface change. Only `?ref=v1.6.0` → `?ref=v1.7.1`.

## Migration steps

### 1. Edit `packages/infrastructure/functions.tf`

Bump `?ref` for `module.api`, `module.user_management`, `module.user_management_trigger` to `v1.7.1` (mechanical replacement).

Restructure `module "api_trigger"`:

```hcl
module "api_trigger" {
  source = "github.com/Maev4l/terraform-modules//modules/lambda-trigger-apigw?ref=v1.7.1"

  # api_name produces "meal-planner-api-http-api" — same as the v1.6.0 default
  # (which used function_name). Keeping this exact value avoids API rename/recreation.
  api_name = "meal-planner-api"

  cors                         = false
  disable_execute_api_endpoint = false

  authorizer = {
    name     = "meal-planner-cognito-authorizer"
    issuer   = "https://cognito-idp.${var.region}.amazonaws.com/${aws_cognito_user_pool.meal_planner.id}"
    audience = [aws_cognito_user_pool_client.meal_planner.id]
  }

  integrations = {
    api = {
      function_name = module.api.function_name
      function_arn  = module.api.function_arn
      invoke_arn    = module.api.invoke_arn
      routes        = ["ANY /api/{proxy+}"]
    }
  }
}
```

Integration key `api` was chosen as a short, generic logical name that leaves room for future additions (e.g. `webhook`, `admin`).

### 2. State migration

Run before `terraform plan` to preserve resources. The v1.7.1 module uses `for_each` on integration key, which changes resource addresses:

```bash
cd packages/infrastructure

terraform state mv \
  'module.api_trigger.aws_apigatewayv2_integration.this' \
  'module.api_trigger.aws_apigatewayv2_integration.this["api"]'

terraform state mv \
  'module.api_trigger.aws_apigatewayv2_route.this["ANY /api/{proxy+}"]' \
  'module.api_trigger.aws_apigatewayv2_route.this["api:ANY /api/{proxy+}"]'

terraform state mv \
  'module.api_trigger.aws_lambda_permission.this' \
  'module.api_trigger.aws_lambda_permission.this["api"]'
```

Resources whose addresses do **not** change (no mv needed):
- `module.api_trigger.aws_apigatewayv2_api.this`
- `module.api_trigger.aws_apigatewayv2_stage.this`
- Anything in `module.api`, `module.user_management`, `module.user_management_trigger`.

### 3. Verify

```bash
terraform init -upgrade   # refetches modules at v1.7.1
terraform plan
```

**Acceptance criterion:** `terraform plan` shows **no changes** (or only inert metadata diffs).

If the plan proposes destroy/create on any `aws_apigatewayv2_*` or `aws_lambda_permission` resource, a state mv was missed or has a wrong key — **abort and investigate**, do not apply.

### 4. Apply

`terraform apply` once the plan is clean.

## Downstream impact check

- `cloudfront.tf:41` references `module.api_trigger.api_endpoint`. Output preserved in v1.7.1 → no change required.
- No other files reference `module.api_trigger` outputs.

## Rollback

If anything goes wrong before apply:

1. Revert `functions.tf` to v1.6.0 form.
2. Reverse the three `terraform state mv` commands (swap source/destination).

State is preserved through both directions; the rollback is symmetric.

## Out of scope

- v1.7.1 also includes "Enable force delete flag for S3 bucket" — irrelevant to this migration (Lambda modules only). The webclient S3 bucket already has `force_destroy = true` per project convention.
- Adding a second Lambda integration to the API gateway. The new `integrations` map makes this easy later (one more entry in the map), but it's not part of this work.
