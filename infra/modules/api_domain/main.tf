# API Domain Module for Cloud Defenders
# Manages custom domain configuration for API Gateway v2 (HTTP API)

# API Gateway v2 custom domain (if provided)
resource "aws_apigatewayv2_domain_name" "api_domain" {
  count       = var.domain_name != null ? 1 : 0
  domain_name = var.domain_name

  domain_name_configuration {
    certificate_arn = var.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-api-domain"
  })
}

# API Gateway v2 API mapping
resource "aws_apigatewayv2_api_mapping" "api_mapping" {
  count       = var.domain_name != null ? 1 : 0
  api_id      = var.api_gateway_id
  domain_name = aws_apigatewayv2_domain_name.api_domain[0].id
  stage       = var.api_gateway_stage_name
}

# Route53 record for API custom domain
resource "aws_route53_record" "api_domain" {
  count   = var.domain_name != null ? 1 : 0
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_apigatewayv2_domain_name.api_domain[0].domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.api_domain[0].domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}