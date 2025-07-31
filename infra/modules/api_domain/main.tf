# API Domain Module for Cloud Defenders
# Manages custom domain configuration for API Gateway

# API Gateway custom domain (if provided)
resource "aws_api_gateway_domain_name" "api_domain" {
  count           = var.domain_name != null ? 1 : 0
  domain_name     = var.domain_name
  certificate_arn = var.certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "Cloud Defenders API Domain"
    Environment = var.environment
    Project     = var.project_name
  }
}

# API Gateway base path mapping
resource "aws_api_gateway_base_path_mapping" "api_mapping" {
  count       = var.domain_name != null ? 1 : 0
  api_id      = var.api_gateway_id
  stage_name  = var.api_gateway_stage_name
  domain_name = aws_api_gateway_domain_name.api_domain[0].domain_name
}

# Route53 record for API custom domain
resource "aws_route53_record" "api_domain" {
  count   = var.domain_name != null ? 1 : 0
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_api_gateway_domain_name.api_domain[0].regional_domain_name
    zone_id                = aws_api_gateway_domain_name.api_domain[0].regional_zone_id
    evaluate_target_health = true
  }
}