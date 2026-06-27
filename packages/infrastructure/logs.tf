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

  # CreateDelivery validates write access against the bucket policy, so the
  # bucket policy above must already exist or delivery creation fails.
  depends_on = [aws_s3_bucket_policy.cloudfront_logs]
}
