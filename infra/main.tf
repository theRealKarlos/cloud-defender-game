# Cloud Defenders Game Infrastructure
# Main Terraform configuration file

# Variables are defined in variables.tf

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

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-cloudfront-cert"
  })
}

# ACM Certificate for API Gateway (in the main region)
resource "aws_acm_certificate" "api_cert" {
  domain_name       = "${var.project_name}-api.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-api-cert"
  })
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
  common_tags     = local.common_tags
}

# DynamoDB Module
module "dynamodb" {
  source = "./modules/dynamodb"

  project_name = var.project_name
  environment  = var.environment
  common_tags  = local.common_tags
}

# Lambda Function Module
module "lambda_function" {
  source = "./modules/lambda_function"

  project_name        = var.project_name
  environment         = var.environment
  dynamodb_table_name = module.dynamodb.table_name
  dynamodb_table_arn  = module.dynamodb.table_arn
  common_tags         = local.common_tags
}

# API Gateway Module
module "api_gateway" {
  source = "./modules/api_gateway"

  project_name         = var.project_name
  environment          = var.environment
  lambda_function_name = module.lambda_function.function_name
  lambda_invoke_arn    = module.lambda_function.invoke_arn
  common_tags          = local.common_tags
}

# API Domain Module
module "api_domain" {
  source = "./modules/api_domain"

  project_name           = var.project_name
  environment            = var.environment
  domain_name            = "${var.project_name}-api.${var.domain_name}"
  certificate_arn        = aws_acm_certificate_validation.api_cert.certificate_arn
  hosted_zone_id         = var.hosted_zone_id
  api_gateway_id         = module.api_gateway.api_id
  api_gateway_stage_name = module.api_gateway.stage_name
  common_tags            = local.common_tags
}
