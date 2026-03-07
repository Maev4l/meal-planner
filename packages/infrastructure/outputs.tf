# Outputs for frontend config and deployment scripts

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.meal_planner.id
}

output "cognito_user_pool_client_id" {
  description = "ID of the Cognito User Pool Client"
  value       = aws_cognito_user_pool_client.meal_planner.id
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution for cache invalidation"
  value       = aws_cloudfront_distribution.main.id
}

output "webclient_bucket" {
  description = "S3 bucket name for web client deployment"
  value       = aws_s3_bucket.webclient.id
}

output "region" {
  description = "AWS region"
  value       = data.aws_region.current.id
}

output "dynamodb_table_name" {
  description = "DynamoDB table name (for CLI config)"
  value       = aws_dynamodb_table.meal_planner.name
}
