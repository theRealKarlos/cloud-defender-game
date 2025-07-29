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
  default     = "us-east-1"
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

# Module declarations (to be implemented in future tasks)
# module "s3_game_hosting" {
#   source = "./modules/s3_game_hosting"
#   
#   project_name = var.project_name
#   environment  = var.environment
# }

# Outputs
output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = "placeholder-domain.cloudfront.net"
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = "https://placeholder-api.execute-api.us-east-1.amazonaws.com"
}
