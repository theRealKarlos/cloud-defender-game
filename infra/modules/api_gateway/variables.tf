variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "lambda_function_name" {
  description = "Lambda function name for API Gateway integration"
  type        = string
}

variable "lambda_invoke_arn" {
  description = "Lambda function invoke ARN for API Gateway integration"
  type        = string
}