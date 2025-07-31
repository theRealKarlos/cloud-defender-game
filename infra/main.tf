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

# Provider for US East 1 (required for CloudFront certificates)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
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

# Data source for existing hosted zone
data "aws_route53_zone" "main" {
  zone_id = var.hosted_zone_id
}

# ACM Certificate for CloudFront (must be in us-east-1)
resource "aws_acm_certificate" "cloudfront_cert" {
  provider          = aws.us_east_1
  domain_name       = "${var.project_name}.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.project_name}-cloudfront-cert"
    Project     = var.project_name
    Environment = var.environment
  }
}

# ACM Certificate for API Gateway (in the main region)
resource "aws_acm_certificate" "api_cert" {
  domain_name       = "${var.project_name}-api.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.project_name}-api-cert"
    Project     = var.project_name
    Environment = var.environment
  }
}

# DNS validation for CloudFront certificate
resource "aws_route53_record" "cloudfront_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cloudfront_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.hosted_zone_id
}

# DNS validation for API certificate
resource "aws_route53_record" "api_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.api_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.hosted_zone_id
}

# Certificate validation
resource "aws_acm_certificate_validation" "cloudfront_cert" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.cloudfront_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cloudfront_cert_validation : record.fqdn]
}

resource "aws_acm_certificate_validation" "api_cert" {
  certificate_arn         = aws_acm_certificate.api_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.api_cert_validation : record.fqdn]
}

# S3 Static Website Hosting Module
module "s3_game_hosting" {
  source = "./modules/s3_game_hosting"

  project_name    = var.project_name
  environment     = var.environment
  domain_name     = "${var.project_name}.${var.domain_name}"
  certificate_arn = aws_acm_certificate_validation.cloudfront_cert.certificate_arn
  hosted_zone_id  = var.hosted_zone_id
}

# DynamoDB Module
module "dynamodb" {
  source = "./modules/dynamodb"

  project_name = var.project_name
  environment  = var.environment
}

# Lambda Function Module
module "lambda_function" {
  source = "./modules/lambda_function"

  project_name         = var.project_name
  environment          = var.environment
  dynamodb_table_name  = module.dynamodb.table_name
  dynamodb_table_arn   = module.dynamodb.table_arn
}

# API Gateway Module
module "api_gateway" {
  source = "./modules/api_gateway"

  project_name         = var.project_name
  environment          = var.environment
  lambda_function_name = module.lambda_function.function_name
  lambda_invoke_arn    = module.lambda_function.invoke_arn
}

# API Domain Module
module "api_domain" {
  source = "./modules/api_domain"

  project_name            = var.project_name
  environment             = var.environment
  domain_name             = "${var.project_name}-api.${var.domain_name}"
  certificate_arn         = aws_acm_certificate_validation.api_cert.certificate_arn
  hosted_zone_id          = var.hosted_zone_id
  api_gateway_id          = module.api_gateway.api_id
  api_gateway_stage_name  = module.api_gateway.stage_name
}

# Outputs
output "s3_bucket_name" {
  description = "S3 bucket name for game hosting"
  value       = module.s3_game_hosting.bucket_name
}

output "website_url" {
  description = "Custom domain website URL"
  value       = "https://${var.project_name}.${var.domain_name}"
}

output "api_url" {
  description = "Custom domain API URL"
  value       = "https://${var.project_name}-api.${var.domain_name}"
}

output "s3_website_url" {
  description = "Website URL via CloudFront CDN"
  value       = module.s3_game_hosting.website_url
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.s3_game_hosting.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.s3_game_hosting.cloudfront_domain_name
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = module.api_gateway.api_url
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = module.lambda_function.function_name
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = module.dynamodb.table_name
}

output "cloudfront_certificate_arn" {
  description = "CloudFront SSL certificate ARN"
  value       = aws_acm_certificate_validation.cloudfront_cert.certificate_arn
}

output "api_certificate_arn" {
  description = "API Gateway SSL certificate ARN"
  value       = aws_acm_certificate_validation.api_cert.certificate_arn
}
