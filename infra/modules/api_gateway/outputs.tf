output "api_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.score_api.id
}

output "api_execution_arn" {
  description = "API Gateway execution ARN"
  value       = aws_api_gateway_rest_api.score_api.execution_arn
}

output "stage_name" {
  description = "API Gateway stage name"
  value       = aws_api_gateway_stage.score_api_stage.stage_name
}

output "api_url" {
  description = "API Gateway URL"
  value       = "https://${aws_api_gateway_rest_api.score_api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.score_api_stage.stage_name}"
}

data "aws_region" "current" {}