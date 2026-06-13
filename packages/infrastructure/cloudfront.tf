# CloudFront distribution for meal-planner.isnan.eu
# Routes: /* -> S3 (frontend), /api/* -> API Gateway

# Managed cache policies
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

# Use managed policy that forwards all viewer headers except Host (for API Gateway)
data "aws_cloudfront_origin_request_policy" "all_viewer_except_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

# Response-headers policies control the Cache-Control header sent to the BROWSER
# (independent of CloudFront's own cache TTL). The PWA app shell uses stable
# filenames (index.html, sw.js, registerSW.js, *.webmanifest, workbox-*.js), so it
# must always revalidate — otherwise a browser/edge holding a stale-but-different
# copy installs it as a "new" waiting service worker and the update banner nags
# even though nothing was deployed. Content-hashed /assets/* can be cached forever
# since their filename changes whenever their content does.
resource "aws_cloudfront_response_headers_policy" "webclient_no_cache" {
  name = "meal-planner-webclient-no-cache"
  custom_headers_config {
    items {
      header   = "Cache-Control"
      value    = "no-cache"
      override = true
    }
  }
}

resource "aws_cloudfront_response_headers_policy" "webclient_immutable" {
  name = "meal-planner-webclient-immutable"
  custom_headers_config {
    items {
      header   = "Cache-Control"
      value    = "public, max-age=31536000, immutable"
      override = true
    }
  }
}

# Origin Access Control for S3
resource "aws_cloudfront_origin_access_control" "webclient" {
  name                              = "meal-planner-webclient-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  default_root_object = "index.html"
  aliases             = ["meal-planner.isnan.eu"]
  price_class         = "PriceClass_100"

  # S3 Origin (frontend)
  origin {
    domain_name              = aws_s3_bucket.webclient.bucket_regional_domain_name
    origin_id                = "s3-webclient"
    origin_access_control_id = aws_cloudfront_origin_access_control.webclient.id
  }

  # API Gateway Origin
  origin {
    domain_name = replace(module.api_trigger.api_endpoint, "https://", "")
    origin_id   = "api-gateway"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Default -> S3 (frontend). This serves the app shell (index.html, registerSW.js,
  # *.webmanifest, workbox-*.js). Tell the browser to always revalidate so a stale
  # shell never reinstalls a phantom service worker.
  default_cache_behavior {
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "s3-webclient"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_optimized.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.webclient_no_cache.id
  }

  # Service worker - no caching (must always fetch fresh for PWA updates).
  # Also send Cache-Control: no-cache to the browser so it revalidates the script.
  ordered_cache_behavior {
    path_pattern               = "/sw.js"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "s3-webclient"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_disabled.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.webclient_no_cache.id
  }

  # /api/* -> API Gateway
  ordered_cache_behavior {
    path_pattern             = "/api/*"
    allowed_methods          = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods           = ["GET", "HEAD"]
    target_origin_id         = "api-gateway"
    viewer_protocol_policy   = "redirect-to-https"
    compress                 = true
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
  }

  # Content-hashed build assets (/assets/*): filename changes with content, so they
  # are safe to cache forever. Declared last because path patterns don't overlap, so
  # precedence is irrelevant and appending keeps the Terraform plan clean (the AWS
  # provider matches ordered_cache_behavior blocks positionally).
  ordered_cache_behavior {
    path_pattern               = "/assets/*"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "s3-webclient"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_optimized.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.webclient_immutable.id
  }

  # SPA fallback: return index.html for 404 only
  # Note: Do NOT add 403 here - it would mask API Gateway auth errors
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.wildcard_isnan.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
