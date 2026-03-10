# Lambda function and API Gateway trigger

locals {
  api_filename             = "../functions/api/dist/bootstrap.zip"
  user_management_filename = "../functions/user-management/dist/bootstrap.zip"
}

module "api" {
  source = "github.com/Maev4l/terraform-modules//modules/lambda-function?ref=v1.5.1"

  function_name = "meal-planner-api"
  architecture  = "arm64"
  memory_size   = 128
  timeout       = 7

  additional_policy_arns = [aws_iam_policy.api.arn]

  zip = {
    filename = local.api_filename
    runtime  = "provided.al2023"
    handler  = "bootstrap"
  }

  environment_variables = {
    DYNAMODB_TABLE_NAME = aws_dynamodb_table.meal_planner.name
    REGION              = var.region
    USER_POOL_ID        = aws_cognito_user_pool.meal_planner.id
  }
}

module "api_trigger" {
  source = "github.com/Maev4l/terraform-modules//modules/lambda-trigger-apigw?ref=v1.5.1"

  function_name = module.api.function_name
  function_arn  = module.api.function_arn
  invoke_arn    = module.api.invoke_arn
  cors          = false

  # Allow CloudFront to reach the API Gateway via execute-api endpoint
  disable_execute_api_endpoint = false

  # JWT Authorizer integrated with Cognito User Pool
  authorizer = {
    name     = "meal-planner-cognito-authorizer"
    issuer   = "https://cognito-idp.${var.region}.amazonaws.com/${aws_cognito_user_pool.meal_planner.id}"
    audience = [aws_cognito_user_pool_client.meal_planner.id]
  }

  routes = [
    "ANY /api/{proxy+}"
  ]
}

module "user_management" {
  source = "github.com/Maev4l/terraform-modules//modules/lambda-function?ref=v1.5.1"

  function_name = "meal-planner-user-management"
  architecture  = "arm64"
  memory_size   = 128

  additional_policy_arns = [aws_iam_policy.user_management.arn]

  zip = {
    filename = local.user_management_filename
    runtime  = "provided.al2023"
    handler  = "bootstrap"
  }

  environment_variables = {
    REGION        = var.region
    SNS_TOPIC_ARN = data.aws_sns_topic.alerting.arn
  }
}

module "user_management_trigger" {
  source = "github.com/Maev4l/terraform-modules//modules/lambda-trigger-cognito?ref=v1.5.1"

  function_name = module.user_management.function_name
  function_arn  = module.user_management.function_arn

  user_pool_id = aws_cognito_user_pool.meal_planner.id
}
