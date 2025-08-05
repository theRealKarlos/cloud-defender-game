output "api_id" {
  description = "API Gateway v2 HTTP API ID"
  value       = aws_apigatewayv2_api.score_api.id
}

output "api_execution_arn" {
  description = "API Gateway v2 execution ARN"
  value       = aws_apigatewayv2_api.score_api.execution_arn
}

output "stage_name" {
  description = "API Gateway v2 stage name"
  value       = aws_apigatewayv2_stage.score_api_stage.name
}

output "api_url" {
  description = "API Gateway v2 URL"
  value       = aws_apigatewayv2_stage.score_api_stage.invoke_url
}

output "api_endpoint" {
  description = "API Gateway v2 API endpoint"
  value       = aws_apigatewayv2_api.score_api.api_endpoint
}

data "aws_region" "current" {}