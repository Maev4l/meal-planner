# Common variables for Meal Planner infrastructure

variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  type        = string
  default     = "meal-planner-data"
}
