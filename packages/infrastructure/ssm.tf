# SSM Parameter Store data sources for secrets

data "aws_ssm_parameter" "google_client_id" {
  name            = "meal-planner.google.client.id"
  with_decryption = true
}

data "aws_ssm_parameter" "google_client_secret" {
  name            = "meal-planner.google.client.secret"
  with_decryption = true
}
