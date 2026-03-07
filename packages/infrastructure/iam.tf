# IAM policies for Lambda functions

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.id
}

# API Lambda Policy
data "aws_iam_policy_document" "api" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:BatchExecuteStatement",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:DeleteItem",
      "dynamodb:ExecuteStatement",
      "dynamodb:ExecuteTransaction",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:TransactGetItems",
      "dynamodb:TransactWriteItems",
      "dynamodb:UpdateItem",
    ]
    resources = [
      aws_dynamodb_table.meal_planner.arn,
      "${aws_dynamodb_table.meal_planner.arn}/index/*",
    ]
  }

  statement {
    effect    = "Allow"
    actions   = ["cognito-idp:AdminGetUser"]
    resources = [aws_cognito_user_pool.meal_planner.arn]
  }
}

resource "aws_iam_policy" "api" {
  name   = "meal-planner-api"
  policy = data.aws_iam_policy_document.api.json
}

#
# User Management Policy (role managed by lambda-function module)
#
data "aws_iam_policy_document" "user_management" {
  statement {
    effect    = "Allow"
    actions   = ["sns:Publish"]
    resources = [data.aws_sns_topic.alerting.arn]
  }

  statement {
    effect = "Allow"
    actions = [
      "cognito-idp:AdminGetUser",
      "cognito-idp:AdminUpdateUserAttributes",
      "cognito-idp:AdminLinkProviderForUser",
      "cognito-idp:ListUsers",
    ]
    resources = ["arn:aws:cognito-idp:${local.region}:${local.account_id}:userpool/*"]
  }
}

resource "aws_iam_policy" "user_management" {
  name   = "meal-planner-user-management"
  policy = data.aws_iam_policy_document.user_management.json
}
