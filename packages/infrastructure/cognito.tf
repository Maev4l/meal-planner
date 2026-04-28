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

  # Cognito refresh tokens have absolute (non-sliding) expiry. 1 year keeps users
  # signed in long enough for daily-use scenarios while still rotating credentials yearly.
  refresh_token_validity = 365
  access_token_validity  = 60
  id_token_validity      = 60
  token_validity_units {
    refresh_token = "days"
    access_token  = "minutes"
    id_token      = "minutes"
  }

  # OAuth configuration
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  supported_identity_providers         = ["COGNITO", "Google"]

  callback_urls = [
    "https://meal-planner.isnan.eu/",
    "http://localhost:3000/"
  ]
  logout_urls = [
    "https://meal-planner.isnan.eu/login",
    "http://localhost:3000/login"
  ]

  # Attributes included in ID token
  read_attributes = [
    "custom:Id",
    "custom:Approved",
    "email",
    "name"
  ]

  write_attributes = []

  depends_on = [aws_cognito_identity_provider.google]
}

# Cognito domain for hosted UI (custom domain)
resource "aws_cognito_user_pool_domain" "meal_planner_domain" {
  domain          = "meal-planner-auth.isnan.eu"
  user_pool_id    = aws_cognito_user_pool.meal_planner.id
  certificate_arn = data.aws_acm_certificate.wildcard_isnan.arn
}

# Google Identity Provider
resource "aws_cognito_identity_provider" "google" {
  user_pool_id  = aws_cognito_user_pool.meal_planner.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id        = data.aws_ssm_parameter.google_client_id.value
    client_secret    = data.aws_ssm_parameter.google_client_secret.value
    authorize_scopes = "openid email profile"
  }

  attribute_mapping = {
    email    = "email"
    name     = "name"
    username = "sub"
  }

  # AWS auto-populates additional OIDC fields in provider_details
  lifecycle {
    ignore_changes = [provider_details]
  }
}
