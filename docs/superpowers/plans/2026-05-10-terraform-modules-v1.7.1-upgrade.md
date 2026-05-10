# terraform-modules v1.7.1 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bump `Maev4l/terraform-modules` from v1.6.0 → v1.7.1 in `packages/infrastructure`, like-for-like, preserving all live AWS resources via `terraform state mv`.

**Architecture:** Single file edit (`functions.tf`) covering 4 module ref bumps and a structural change to `module "api_trigger"` (the new v1.7.1 interface uses an `integrations` map). State migration commands rewire 3 resource addresses that gain `for_each` keys. `terraform plan` showing **no changes** is the acceptance criterion before apply.

**Tech Stack:** Terraform 1.10+, AWS provider 6.x, S3 backend (`global-tf-states`), HTTP API Gateway v2.

**Spec:** [`docs/superpowers/specs/2026-05-10-terraform-modules-v1.7.1-upgrade-design.md`](../specs/2026-05-10-terraform-modules-v1.7.1-upgrade-design.md)

**User instruction:** Do NOT run `git commit` or `terraform apply` — the user handles both manually. Stop after verifying `terraform plan` is clean.

---

## File Structure

Only one source file is modified. No new files. No tests (infrastructure code; verification is `terraform plan`).

| File | Change |
|---|---|
| `packages/infrastructure/functions.tf` | Bump 4 `?ref` tags; restructure `module "api_trigger"` block |

State changes (no file changes):
- `terraform.tfstate` (remote, S3) — 3 resource addresses rewritten via `terraform state mv`

---

### Task 1: Edit `functions.tf`

**Files:**
- Modify: `packages/infrastructure/functions.tf` (entire file rewritten — lines 1-85)

This single edit covers all four `?ref` bumps plus the `module "api_trigger"` interface change. Doing them together avoids an intermediate broken state where some modules reference v1.6.0 and others v1.7.1.

- [ ] **Step 1: Replace the entire `functions.tf` file content**

Final content:

```hcl
# Lambda function and API Gateway trigger

locals {
  api_filename             = "../functions/api/dist/bootstrap.zip"
  user_management_filename = "../functions/user-management/dist/bootstrap.zip"
}

module "api" {
  source = "github.com/Maev4l/terraform-modules//modules/lambda-function?ref=v1.7.1"

  function_name = "meal-planner-api"
  architecture  = "arm64"
  memory_size   = 128
  timeout       = 7

  additional_policy_arns = [aws_iam_policy.api.arn]

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
  }
}

module "api_trigger" {
  source = "github.com/Maev4l/terraform-modules//modules/lambda-trigger-apigw?ref=v1.7.1"

  # api_name produces "meal-planner-api-http-api" — byte-identical to the v1.6.0
  # default (which was "${function_name}-http-api"). Keeping this value avoids
  # API Gateway rename/recreation.
  api_name = "meal-planner-api"

  cors                         = false
  disable_execute_api_endpoint = false

  # JWT Authorizer integrated with Cognito User Pool
  authorizer = {
    name     = "meal-planner-cognito-authorizer"
    issuer   = "https://cognito-idp.${var.region}.amazonaws.com/${aws_cognito_user_pool.meal_planner.id}"
    audience = [aws_cognito_user_pool_client.meal_planner.id]
  }

  # v1.7.1 supports multiple integrations behind one HTTP API. Single entry "api"
  # for now; key becomes part of state addresses (see state mv in Task 4).
  integrations = {
    api = {
      function_name = module.api.function_name
      function_arn  = module.api.function_arn
      invoke_arn    = module.api.invoke_arn
      routes        = ["ANY /api/{proxy+}"]
    }
  }
}

module "user_management" {
  source = "github.com/Maev4l/terraform-modules//modules/lambda-function?ref=v1.7.1"

  function_name = "meal-planner-user-management"
  architecture  = "arm64"
  memory_size   = 128

  additional_policy_arns = [aws_iam_policy.user_management.arn]

  zip = {
    filename = local.user_management_filename
    runtime  = "provided.al2023"
    handler  = "bootstrap"
    hash     = filebase64sha256("../functions/user-management/bin/bootstrap")
  }

  environment_variables = {
    REGION        = var.region
    SNS_TOPIC_ARN = data.aws_sns_topic.alerting.arn
  }
}

module "user_management_trigger" {
  source = "github.com/Maev4l/terraform-modules//modules/lambda-trigger-cognito?ref=v1.7.1"

  function_name = module.user_management.function_name
  function_arn  = module.user_management.function_arn

  user_pool_id = aws_cognito_user_pool.meal_planner.id
}
```

- [ ] **Step 2: Verify the diff**

Run:
```bash
cd /Users/jrsue/dev/repos/meal-planner
git diff packages/infrastructure/functions.tf
```

Expected (in summary):
- 4 lines changed: `?ref=v1.6.0` → `?ref=v1.7.1` on the `source` of each module
- `module "api_trigger"` body: `function_name`/`function_arn`/`invoke_arn`/`routes` removed from top level; `api_name = "meal-planner-api"` added; `integrations = { api = { ... } }` block added wrapping the four moved fields

No other modules' bodies should change.

- [ ] **Step 3: Validate HCL syntax**

Run:
```bash
cd /Users/jrsue/dev/repos/meal-planner/packages/infrastructure
terraform fmt -check -diff functions.tf
```

Expected: exit code 0, no output. If it reformats, run `terraform fmt functions.tf` and re-verify the diff is purely whitespace.

- [ ] **Step 4: Skip commit**

Do NOT commit. The user commits manually after the migration is verified.

---

### Task 2: Re-fetch modules at v1.7.1

**Files:** None modified directly. Updates `.terraform/modules/` and `.terraform.lock.hcl` may be touched.

- [ ] **Step 1: Run init -upgrade**

Run:
```bash
cd /Users/jrsue/dev/repos/meal-planner/packages/infrastructure
terraform init -upgrade
```

Expected output (excerpts):
```
Upgrading modules...
Downloading git::https://github.com/Maev4l/terraform-modules.git?ref=v1.7.1 for api...
- api in .terraform/modules/api/modules/lambda-function
Downloading git::https://github.com/Maev4l/terraform-modules.git?ref=v1.7.1 for api_trigger...
- api_trigger in .terraform/modules/api_trigger/modules/lambda-trigger-apigw
Downloading git::https://github.com/Maev4l/terraform-modules.git?ref=v1.7.1 for user_management...
Downloading git::https://github.com/Maev4l/terraform-modules.git?ref=v1.7.1 for user_management_trigger...
...
Terraform has been successfully initialized!
```

If init fails: re-read the error. Most likely cause is HCL syntax in `functions.tf` — go back to Task 1 Step 3.

---

### Task 3: Pre-migration plan (diagnostic — DO NOT APPLY)

This is a sanity check. With v1.7.1 code but pre-migration state, Terraform will propose destroying and recreating the API Gateway integration, route, and lambda permission. Seeing this confirms our state mv plan is targeting the right resources.

- [ ] **Step 1: Run terraform plan**

Run:
```bash
cd /Users/jrsue/dev/repos/meal-planner/packages/infrastructure
terraform plan -no-color 2>&1 | tee /tmp/tf-plan-pre-migration.txt
```

- [ ] **Step 2: Inspect output**

Expected: plan proposes destroying these old addresses and creating new ones:

| Destroy (old address) | Create (new address) |
|---|---|
| `module.api_trigger.aws_apigatewayv2_integration.this` | `module.api_trigger.aws_apigatewayv2_integration.this["api"]` |
| `module.api_trigger.aws_apigatewayv2_route.this["ANY /api/{proxy+}"]` | `module.api_trigger.aws_apigatewayv2_route.this["api:ANY /api/{proxy+}"]` |
| `module.api_trigger.aws_lambda_permission.this` | `module.api_trigger.aws_lambda_permission.this["api"]` |

The summary line should be approximately: `Plan: 3 to add, 0 to change, 3 to destroy.`

The `aws_apigatewayv2_api.this` and `aws_apigatewayv2_stage.this` should NOT appear (no recreation, no rename — `meal-planner-api-http-api` stays).

If any other resource appears in the plan (e.g. one of the `lambda-function` modules or the cognito trigger), STOP — investigate before continuing. The other modules' interfaces are unchanged, so they should not diff.

- [ ] **Step 3: Do NOT apply**

This plan is diagnostic only. Proceed to Task 4 to migrate state.

---

### Task 4: State migration

Rewrite the 3 resource addresses to match the v1.7.1 `for_each` structure. Each command moves a single resource within the remote state.

- [ ] **Step 1: Move the integration**

Run:
```bash
cd /Users/jrsue/dev/repos/meal-planner/packages/infrastructure
terraform state mv \
  'module.api_trigger.aws_apigatewayv2_integration.this' \
  'module.api_trigger.aws_apigatewayv2_integration.this["api"]'
```

Expected output:
```
Move "module.api_trigger.aws_apigatewayv2_integration.this" to "module.api_trigger.aws_apigatewayv2_integration.this[\"api\"]"
Successfully moved 1 object(s).
```

- [ ] **Step 2: Move the route**

Run:
```bash
terraform state mv \
  'module.api_trigger.aws_apigatewayv2_route.this["ANY /api/{proxy+}"]' \
  'module.api_trigger.aws_apigatewayv2_route.this["api:ANY /api/{proxy+}"]'
```

Expected output:
```
Move "module.api_trigger.aws_apigatewayv2_route.this[\"ANY /api/{proxy+}\"]" to "module.api_trigger.aws_apigatewayv2_route.this[\"api:ANY /api/{proxy+}\"]"
Successfully moved 1 object(s).
```

- [ ] **Step 3: Move the lambda permission**

Run:
```bash
terraform state mv \
  'module.api_trigger.aws_lambda_permission.this' \
  'module.api_trigger.aws_lambda_permission.this["api"]'
```

Expected output:
```
Move "module.api_trigger.aws_lambda_permission.this" to "module.api_trigger.aws_lambda_permission.this[\"api\"]"
Successfully moved 1 object(s).
```

- [ ] **Step 4: Verify state addresses**

Run:
```bash
terraform state list | grep -E '(apigatewayv2|lambda_permission)' | sort
```

Expected output (exactly):
```
module.api_trigger.aws_apigatewayv2_api.this
module.api_trigger.aws_apigatewayv2_integration.this["api"]
module.api_trigger.aws_apigatewayv2_route.this["api:ANY /api/{proxy+}"]
module.api_trigger.aws_apigatewayv2_stage.this
module.api_trigger.aws_lambda_permission.this["api"]
```

If any line is missing the `["api"]` key (other than `.api.this` and `.stage.this` which stay un-keyed), the corresponding mv was not run or failed silently — re-run that step.

---

### Task 5: Post-migration plan (acceptance criterion)

- [ ] **Step 1: Run terraform plan**

Run:
```bash
cd /Users/jrsue/dev/repos/meal-planner/packages/infrastructure
terraform plan -no-color 2>&1 | tee /tmp/tf-plan-post-migration.txt
```

- [ ] **Step 2: Verify the only diff is the lambda permission statement_id**

Expected summary line:
```
Plan: 1 to add, 0 to change, 1 to destroy.
```

The single diff must be:

```
# module.api_trigger.aws_lambda_permission.this["api"] must be replaced
  ~ statement_id = "AllowAPIGatewayInvoke" -> "AllowAPIGatewayInvoke-api"  # forces replacement
```

This is unavoidable — v1.7.1 templated `statement_id` to include the integration key as a suffix; `statement_id` is `ForceNew` in the AWS provider. Spec section "Residual recreation" documents this. User accepts a sub-second permission gap during apply.

If the plan proposes ANY OTHER change (especially to `aws_apigatewayv2_integration`, `aws_apigatewayv2_route`, or any of the routes / `aws_apigatewayv2_api` / `aws_apigatewayv2_stage`):
- A state mv key is wrong. Compare `terraform state list` output (Task 4 Step 4) against the expected list character-by-character.
- The route key uses a literal space (`api:ANY /api/{proxy+}`), not URL-encoded. Quote the whole address in single quotes to protect the braces and space from the shell.

If the plan proposes changes to unrelated resources (lambda function source hash, IAM policy, DynamoDB, Cognito, CloudFront, etc.):
- That diff is unrelated to this migration — it was probably already pending. Do NOT apply as part of this migration. Investigate separately.

- [ ] **Step 3: Stop**

Do NOT run `terraform apply`. Hand back to the user with a summary of:
- The post-migration plan output (zero changes confirmed)
- The git diff still uncommitted
- Reminder that `terraform apply` and `git commit` are user-controlled

---

## Rollback (if needed at any point before user applies)

Symmetric reverse:

```bash
cd /Users/jrsue/dev/repos/meal-planner/packages/infrastructure

# Reverse the state mv commands (swap source and destination)
terraform state mv \
  'module.api_trigger.aws_apigatewayv2_integration.this["api"]' \
  'module.api_trigger.aws_apigatewayv2_integration.this'

terraform state mv \
  'module.api_trigger.aws_apigatewayv2_route.this["api:ANY /api/{proxy+}"]' \
  'module.api_trigger.aws_apigatewayv2_route.this["ANY /api/{proxy+}"]'

terraform state mv \
  'module.api_trigger.aws_lambda_permission.this["api"]' \
  'module.api_trigger.aws_lambda_permission.this'

# Revert the file
cd /Users/jrsue/dev/repos/meal-planner
git checkout -- packages/infrastructure/functions.tf

# Re-pin modules at v1.6.0
cd packages/infrastructure
terraform init -upgrade

# Confirm
terraform plan   # should show "No changes"
```
