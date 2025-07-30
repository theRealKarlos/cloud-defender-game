# Outputs for Lambda API Module

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = "https://${aws_api_gateway_rest_api.score_api.id}.execute-api.${var.aws_region}.amazonaws.com/${var.environment}"
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.score_api.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.score_api.arn
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.scores.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.scores.arn
}
