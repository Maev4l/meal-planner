# DynamoDB table for Meal Planner
# Single-table design with 1 GSI

resource "aws_dynamodb_table" "meal_planner" {
  name         = var.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"
  table_class  = "STANDARD"

  # Primary key
  hash_key  = "PK"
  range_key = "SK"

  # TTL for auto-expiring schedules/comments/notices
  ttl {
    attribute_name = "ExpiresAt"
    enabled        = true
  }

  # Key attributes
  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  # GSI1 attributes - group-centric queries
  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  # GSI1: Group-centric access pattern
  global_secondary_index {
    name            = "GSI1"
    projection_type = "ALL"

    key_schema {
      attribute_name = "GSI1PK"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "GSI1SK"
      key_type       = "RANGE"
    }
  }
}
