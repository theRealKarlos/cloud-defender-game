# Root-level variables - shared across all modules
# This eliminates duplication by defining common variables once

# Shared variables used by all modules
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

# Project-specific variables
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "eu-west-2"
}

variable "aws_profile" {
  description = "AWS profile for deployment"
  type        = string
}

variable "domain_name" {
  description = "Base domain name"
  type        = string
  default     = "lucky4some.com"
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for the domain (not sensitive but environment-specific)"
  type        = string
  # No default - must be provided via terraform.tfvars
  # Find this in AWS Console: Route53 > Hosted zones > [your domain] > Hosted zone ID
}

# Common tags - defined once, used everywhere
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
