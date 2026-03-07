# Cognito User Pool for Meal Planner authentication

resource "aws_cognito_user_pool" "meal_planner" {
  name = "meal-planner"

  # Allow self-registration (pending admin approval via custom:Approved)
  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  username_configuration {
    case_sensitive = false
  }

  # Lambda triggers for user management
  lambda_config {
    pre_sign_up       = module.user_management.function_arn
    post_confirmation = module.user_management.function_arn
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "admin_only"
      priority = 1
    }
  }

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  user_pool_add_ons {
    advanced_security_mode = "OFF"
  }

  # Custom attributes
  schema {
    name                = "Id"
    attribute_data_type = "String"
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }

  schema {
    name                = "Approved"
    attribute_data_type = "String"
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 5
    }
  }
}

resource "aws_cognito_user_pool_client" "meal_planner" {
  name         = "meal-planner-auth-client"
  user_pool_id = aws_cognito_user_pool.meal_planner.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]
}
