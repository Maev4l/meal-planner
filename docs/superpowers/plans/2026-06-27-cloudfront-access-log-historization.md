# CloudFront Access-Log Historization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver every CloudFront request's client IP + metadata for `meal-planner.isnan.eu` to a dedicated S3 bucket as Parquet, retained 90 days, with zero application changes.

**Architecture:** CloudFront standard logging v2 routes access logs through the CloudWatch Logs Delivery API (registered in `us-east-1`) to a new dedicated S3 bucket in `eu-central-1`. Three delivery resources (source → delivery → destination) wire the existing `aws_cloudfront_distribution.main` to the bucket. Logs land under `raw/app/` as Parquet, Hive-partitioned by date (`year=YYYY/month=MM/day=DD/`); an S3 lifecycle rule expires them after 90 days. All work is Terraform in `packages/infrastructure`.

**Tech Stack:** Terraform `>= 1.10.0`, AWS provider `~> 6.0` (locked 6.44.0), resources: `aws_s3_bucket*`, `aws_cloudwatch_log_delivery_source`, `aws_cloudwatch_log_delivery_destination`, `aws_cloudwatch_log_delivery`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-06-27-cloudfront-access-log-historization-design.md`. Every task implicitly inherits its decisions.
- Scope is `packages/infrastructure` only — no application/Lambda/frontend changes.
- All commands run from repo root using `terraform -chdir=packages/infrastructure ...` (never `cd`).
- Bucket name: `meal-planner-cloudfront-logs-<account-id>` (account-id **suffix**), built as `"meal-planner-cloudfront-logs-${local.account_id}"`. `local.account_id` already exists in `iam.tf`.
- Buckets get `force_destroy = true` (repo convention).
- S3 base prefix is `raw/app` (set via the destination ARN), with Hive date partitions appended by `s3_delivery_configuration.suffix_path = "{yyyy}/{MM}/{dd}"` and `enable_hive_compatible_path = true` (flag MUST be true — AWS auto-expands the placeholders into `year=/month=/day=`; a literal `year={yyyy}` is rejected with the flag off). Objects land at `raw/app/year=YYYY/month=MM/day=DD/`. The delivery `depends_on` the bucket policy.
- The 3 delivery resources MUST use `provider = aws.us_east_1` (alias already declared in `main.tf`).
- Record fields — exact 14-field set, names verbatim (validated at apply time):
  `date, time, c-ip, c-country, asn, cs-method, cs-protocol, cs(Host), cs-uri-stem, cs-uri-query, sc-status, x-edge-result-type, x-edge-location, cs(User-Agent)`
- Do NOT commit or push automatically unless the user asks. (Plan shows commit steps; the executor pauses for review per the chosen execution mode.)

---

## File Structure

| File | Responsibility |
|---|---|
| `packages/infrastructure/logs.tf` | **New.** Self-contained logging feature: log bucket + public-access block + SSE + lifecycle + bucket policy, then the 3 v2 delivery resources. |
| `packages/infrastructure/outputs.tf` | **Modify.** Add output for the log bucket name. |
| `.claude/backend.md` | **Modify.** Document the logging setup (no query/Athena docs). |

Rationale: meal-planner has no `s3.tf` (buckets live in `webclient.tf`); a single self-contained `logs.tf` keeps the whole feature's blast radius in one place.

---

### Task 1: S3 log bucket (bucket, security, lifecycle, policy)

Creates the destination bucket and everything that secures and prunes it. The delivery wiring in Task 2 references `aws_s3_bucket.cloudfront_logs.arn`, so this task must land first.

**Files:**
- Create: `packages/infrastructure/logs.tf`

**Interfaces:**
- Consumes: `local.account_id` (from `iam.tf`), `aws_cloudfront_distribution.main.arn` (from `cloudfront.tf` — used in Task 2, not here).
- Produces: `aws_s3_bucket.cloudfront_logs` with `.id`, `.arn`, `.bucket`. Task 2 reads `.arn`; Task 3 reads `.bucket`.

- [ ] **Step 1: Write `logs.tf` with the bucket and its supporting resources**

Create `packages/infrastructure/logs.tf`:

```hcl
# CloudFront access-log historization.
# WHY a dedicated bucket: S3 has no per-bucket fee, so a per-app log bucket costs the
# same as a shared one but gives clean blast-radius isolation — destroying meal-planner
# removes its logs and nothing else.
# See docs/superpowers/specs/2026-06-27-cloudfront-access-log-historization-design.md

resource "aws_s3_bucket" "cloudfront_logs" {
  bucket = "meal-planner-cloudfront-logs-${local.account_id}"
  # Allow `terraform destroy` to remove the bucket even when log objects remain.
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# SSE-S3 (AES256). WHY not KMS: v2 log delivery to S3 supports SSE-S3 out of the box;
# SSE-KMS would require extra key-policy grants for the delivery service — out of scope.
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Whole-bucket 90-day expiration. WHY whole-bucket (no prefix filter): the bucket is
# dedicated to these logs (everything lives under raw/), so expiring everything is
# correct and simplest.
resource "aws_s3_bucket_lifecycle_configuration" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    id     = "expire-logs-90d"
    status = "Enabled"

    filter {}

    expiration {
      days = 90
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 3
    }
  }
}

# Grant the CloudWatch Logs delivery service write access (AWS's documented
# AWSLogsDeliveryWrite statement).
# WHY whole-bucket Resource + all three conditions: if aws:SourceAccount / aws:SourceArn /
# s3:x-amz-acl are missing or the Resource path doesn't cover where logs land, delivery
# SILENTLY fails with AccessDenied — nothing surfaces on the distribution. Whole-bucket
# Resource sidesteps the prefix-mismatch trap.
data "aws_iam_policy_document" "cloudfront_logs" {
  statement {
    sid    = "AWSLogsDeliveryWrite"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["delivery.logs.amazonaws.com"]
    }

    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.cloudfront_logs.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [local.account_id]
    }

    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = ["arn:aws:logs:us-east-1:${local.account_id}:delivery-source:*"]
    }
  }
}

resource "aws_s3_bucket_policy" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id
  policy = data.aws_iam_policy_document.cloudfront_logs.json
}
```

- [ ] **Step 2: Format**

Run: `terraform -chdir=packages/infrastructure fmt logs.tf`
Expected: prints `logs.tf` if it reformatted, or nothing if already formatted. Exit 0.

- [ ] **Step 3: Validate the configuration**

Run: `terraform -chdir=packages/infrastructure validate`
Expected: `Success! The configuration is valid.`

- [ ] **Step 4: Plan and review the bucket resources**

Run: `terraform -chdir=packages/infrastructure plan`
Expected: plan shows **5 resources to add** from this task — `aws_s3_bucket.cloudfront_logs`, `aws_s3_bucket_public_access_block.cloudfront_logs`, `aws_s3_bucket_server_side_encryption_configuration.cloudfront_logs`, `aws_s3_bucket_lifecycle_configuration.cloudfront_logs`, `aws_s3_bucket_policy.cloudfront_logs`. Confirm bucket name renders as `meal-planner-cloudfront-logs-<your-account-id>` and no other resources are unexpectedly changed/destroyed.

- [ ] **Step 5: Commit**

```bash
git add packages/infrastructure/logs.tf
git commit -m "feat(infra): add S3 bucket for CloudFront access logs

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: CloudFront log-delivery wiring (v2, us-east-1)

Adds the three CloudWatch Logs Delivery resources that connect the distribution to the bucket. Splittable from Task 1: a reviewer could accept the bucket but reject the delivery field set / prefix.

**Files:**
- Modify: `packages/infrastructure/logs.tf` (append)

**Interfaces:**
- Consumes: `aws_s3_bucket.cloudfront_logs.arn` (Task 1), `aws_cloudfront_distribution.main.arn` (`cloudfront.tf`), `provider = aws.us_east_1` (`main.tf`).
- Produces: a working delivery pipeline. No Terraform attributes consumed by later tasks.

- [ ] **Step 1: Append the three delivery resources to `logs.tf`**

Append to `packages/infrastructure/logs.tf`:

```hcl
# --- Standard logging v2 delivery: CloudFront -> S3 (Parquet) ---
# WHY us-east-1: the CloudWatch Logs Delivery API for CloudFront must be called in
# us-east-1 even though the destination bucket is in eu-central-1 (cross-region delivery
# is allowed). The aws.us_east_1 alias already exists in main.tf (used for the ACM cert).
# NOTE: these are named aws_cloudwatch_log_delivery_* but nothing is stored in CloudWatch —
# "log delivery" is the generic subsystem CloudFront's docs call "standard logging v2";
# logs land as Parquet in S3.

resource "aws_cloudwatch_log_delivery_source" "cloudfront" {
  provider     = aws.us_east_1
  name         = "meal-planner-cloudfront"
  log_type     = "ACCESS_LOGS"
  resource_arn = aws_cloudfront_distribution.main.arn
}

resource "aws_cloudwatch_log_delivery_destination" "cloudfront_s3" {
  provider      = aws.us_east_1
  name          = "meal-planner-cloudfront-s3"
  output_format = "parquet"

  # output_format is creation-only; changing the destination ARN requires deleting the
  # referencing delivery first (AWS rejects in-place updates while a delivery references
  # it). Not a concern for a fresh create — noted for future edits.
  delivery_destination_configuration {
    # The /raw/app prefix in the ARN suppresses CloudFront's default
    # AWSLogs/aws-account-id=<id>/CloudFront/ path; logs land under raw/app/. The "app"
    # segment namespaces this distribution so other sources can use sibling prefixes later.
    destination_resource_arn = "${aws_s3_bucket.cloudfront_logs.arn}/raw/app"
  }
}

resource "aws_cloudwatch_log_delivery" "cloudfront" {
  provider                 = aws.us_east_1
  delivery_source_name     = aws_cloudwatch_log_delivery_source.cloudfront.name
  delivery_destination_arn = aws_cloudwatch_log_delivery_destination.cloudfront_s3.arn

  # Exact field names are validated at apply time. date/time (no single "timestamp"
  # field); cs(Host)/cs(User-Agent) use the W3C parenthesized form; rest are
  # hyphenated lowercase. c-country + asn come free with v2 (no IP lookup needed).
  record_fields = [
    "date",
    "time",
    "c-ip",
    "c-country",
    "asn",
    "cs-method",
    "cs-protocol",
    "cs(Host)",
    "cs-uri-stem",
    "cs-uri-query",
    "sc-status",
    "x-edge-result-type",
    "x-edge-location",
    "cs(User-Agent)",
  ]

  # Hive-style date partitioning UNDER the raw/app prefix => objects land at
  # raw/app/year=YYYY/month=MM/day=DD/. enable_hive_compatible_path MUST be true: only
  # then does AWS allow the key=value layout, and it auto-expands the bare {yyyy}/{MM}/{dd}
  # placeholders into year=/month=/day= (writing "year={yyyy}" literally is rejected with
  # "Provided suffixPath is invalid" while the flag is off).
  s3_delivery_configuration {
    suffix_path                 = "{yyyy}/{MM}/{dd}"
    enable_hive_compatible_path = true
  }

  # CreateDelivery validates write access against the bucket policy, so the policy
  # (Task 1) must already exist or delivery creation fails.
  depends_on = [aws_s3_bucket_policy.cloudfront_logs]
}
```

- [ ] **Step 2: Format**

Run: `terraform -chdir=packages/infrastructure fmt logs.tf`
Expected: prints `logs.tf` if reformatted, or nothing. Exit 0.

- [ ] **Step 3: Validate**

Run: `terraform -chdir=packages/infrastructure validate`
Expected: `Success! The configuration is valid.`

- [ ] **Step 4: Plan and review the delivery resources**

Run: `terraform -chdir=packages/infrastructure plan`
Expected: plan now adds **3 more resources** (total 8 new with Task 1) — `aws_cloudwatch_log_delivery_source.cloudfront`, `aws_cloudwatch_log_delivery_destination.cloudfront_s3`, `aws_cloudwatch_log_delivery.cloudfront`, all in the us-east-1 provider. Confirm `destination_resource_arn` ends with `/raw/app`, the `s3_delivery_configuration` shows `suffix_path = "{yyyy}/{MM}/{dd}"` + `enable_hive_compatible_path = true`, and `record_fields` lists exactly the 14 fields above.

- [ ] **Step 5: Commit**

```bash
git add packages/infrastructure/logs.tf
git commit -m "feat(infra): wire CloudFront standard logging v2 to S3 (parquet)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Output + documentation

Exposes the bucket name as a Terraform output and documents the feature in `backend.md`.

**Files:**
- Modify: `packages/infrastructure/outputs.tf` (append)
- Modify: `.claude/backend.md`

**Interfaces:**
- Consumes: `aws_s3_bucket.cloudfront_logs.bucket` (Task 1).
- Produces: `cloudfront_logs_bucket` output. Terminal — nothing consumes it downstream.

- [ ] **Step 1: Add the output**

Append to `packages/infrastructure/outputs.tf`:

```hcl
output "cloudfront_logs_bucket" {
  description = "S3 bucket name holding CloudFront access logs"
  value       = aws_s3_bucket.cloudfront_logs.bucket
}
```

- [ ] **Step 2: Validate the output**

Run: `terraform -chdir=packages/infrastructure validate`
Expected: `Success! The configuration is valid.`

- [ ] **Step 3: Document in `backend.md`**

In `.claude/backend.md`, under the `## Infrastructure` section, after the existing `#### Cache-Control (PWA update correctness)` block, add a new subsection:

```markdown
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
```

- [ ] **Step 4: Commit**

```bash
git add packages/infrastructure/outputs.tf .claude/backend.md
git commit -m "feat(infra): output log bucket name + document CloudFront logging

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Apply and verify delivery

The deliverable is logs actually landing in S3. Because delivery can fail silently, post-apply verification is a required task, not an afterthought.

**Files:** none (operational).

**Interfaces:**
- Consumes: the applied infrastructure from Tasks 1–2.
- Produces: confirmation that Parquet objects with a populated `c-ip` appear under `raw/app/`.

- [ ] **Step 1: Apply**

Run: `terraform -chdir=packages/infrastructure apply`
Review the plan (8 new resources), then approve.
Expected: `Apply complete!` with the 8 resources created and the `cloudfront_logs_bucket` output printed.

- [ ] **Step 2: Generate traffic**

Make a few requests against the live site:

Run: `for i in 1 2 3 4 5; do curl -s -o /dev/null -w "%{http_code}\n" https://meal-planner.isnan.eu/; done`
Expected: prints HTTP status codes (e.g. `200`).

- [ ] **Step 3: Wait, then list delivered objects**

Delivery latency is minutes, not real-time. Wait ~15 minutes, then:

Run: `aws s3 ls s3://meal-planner-cloudfront-logs-$(aws sts get-caller-identity --query Account --output text)/raw/app/ --recursive`
Expected: one or more `*.parquet` objects under `raw/app/year=YYYY/month=MM/day=DD/` partition folders. If empty after ~15 min, the bucket policy conditions / `Resource` are the first suspect (silent AccessDenied) — re-check Task 1 Step 1.

- [ ] **Step 4: Spot-check a file has a populated client IP**

Download the newest object and confirm `c-ip` / `c-country` are populated. Replace `<key>` with a key from Step 3:

```bash
ACCT=$(aws sts get-caller-identity --query Account --output text)
aws s3 cp s3://meal-planner-cloudfront-logs-$ACCT/<key> /tmp/cf-log-sample.parquet
# Inspect with whatever Parquet reader is available, e.g. duckdb:
duckdb -c "SELECT \"c-ip\", \"c-country\", \"cs-uri-stem\", \"sc-status\" FROM '/tmp/cf-log-sample.parquet' LIMIT 5;"
```
Expected: rows with non-empty `c-ip` values and 2-letter `c-country` codes. (If `duckdb` is unavailable, any Parquet reader — `parquet-tools`, a Python `pandas.read_parquet` one-liner — works; the only assertion is that `c-ip` is populated.)

- [ ] **Step 5: Confirm verification complete**

No commit (operational task). Report: bucket name, number of Parquet objects observed, and a sample `c-ip`/`c-country` row. The feature is done when logs are confirmed landing.

---

## Notes for the executor

- **Apply requires AWS credentials** with permission to create S3 + CloudWatch Logs delivery resources in this account, in both eu-central-1 and us-east-1. The standard AWS SDK credential chain applies.
- **Tasks 1–3 are pure config** and gate on `validate` + `plan`. **Task 4 mutates AWS** (`apply`) and needs the user's go-ahead per the repo rule "never commit/push/apply automatically unless asked" — treat the `apply` as the point to confirm with the user.
