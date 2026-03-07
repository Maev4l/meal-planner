# Terraform configuration for Meal Planner infrastructure
# Single domain: meal-planner.isnan.eu serves both frontend (S3) and API (/api/*)

terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket       = "global-tf-states"
    key          = "meal-planner/terraform.tfstate"
    region       = "eu-central-1"
    use_lockfile = true
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      application = "meal-planner"
      owner       = "terraform"
    }
  }
}

# Provider alias for CloudFront certificate (must be in us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      application = "meal-planner"
      owner       = "terraform"
    }
  }
}
