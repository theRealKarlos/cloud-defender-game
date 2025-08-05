output "function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.score_api.function_name
}

output "function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.score_api.arn
}

output "invoke_arn" {
  description = "Lambda function invoke ARN"
  value       = aws_lambda_function.score_api.invoke_arn
}

output "alias_name" {
  description = "Lambda alias name"
  value       = aws_lambda_alias.live.name
}