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
