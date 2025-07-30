# Cloud Defenders Game Infrastructure
# Main Terraform configuration file

terraform {
  required_version = "~> 1.12"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.5"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "eu-west-2"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "cloud-defenders"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# S3 Static Website Hosting Module
module "s3_game_hosting" {
  source = "./modules/s3_game_hosting"

  project_name = var.project_name
  environment  = var.environment
}

# Lambda API Module
module "lambda_api" {
  source = "./modules/lambda_api"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
}

# Outputs
output "s3_bucket_name" {
  description = "S3 bucket name for game hosting"
  value       = module.s3_game_hosting.bucket_name
}

output "s3_website_url" {
  description = "S3 website URL"
  value       = module.s3_game_hosting.website_url
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = module.lambda_api.api_gateway_url
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = module.lambda_api.lambda_function_name
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = module.lambda_api.dynamodb_table_name
}
