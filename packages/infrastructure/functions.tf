# Lambda function and API Gateway trigger

locals {
  api_filename             = "../functions/api/dist/bootstrap.zip"
  user_management_filename = "../functions/user-management/dist/bootstrap.zip"

  # AWS Lambda Web Adapter (arm64) - publisher account 753240598075.
  # Bump intentionally; release notes:
  # https://github.com/aws/aws-lambda-web-adapter/releases
  lwa_layer_version = 27
  lwa_layer_arn     = "arn:aws:lambda:${var.region}:753240598075:layer:LambdaAdapterLayerArm64:${local.lwa_layer_version}"
}

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
    SNS_TOPIC_ARN       = data.aws_sns_topic.alerting.arn

    # AWS Lambda Web Adapter forwards events to this port on 127.0.0.1.
    # Must match the port the Gin server binds to in api/cmd/api/main.go.
    PORT                = "8080"
    AWS_LWA_INVOKE_MODE = "buffered"
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
