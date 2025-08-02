output "domain_name" {
  description = "Custom domain name (if configured)"
  value       = var.domain_name != null ? aws_apigatewayv2_domain_name.api_domain[0].domain_name : null
}

output "regional_domain_name" {
  description = "Regional domain name for the custom domain"
  value       = var.domain_name != null ? aws_apigatewayv2_domain_name.api_domain[0].domain_name_configuration[0].target_domain_name : null
}

output "custom_domain_url" {
  description = "Custom domain URL (if configured)"
  value       = var.domain_name != null ? "https://${var.domain_name}" : null
}