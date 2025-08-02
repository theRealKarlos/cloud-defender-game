# Shared variables (defined in _shared_variables.tf)
variable "project_name" {
  description = "Name of the project (passed from root)"
  type        = string
}

variable "environment" {
  description = "Environment (passed from root)"
  type        = string
}

variable "common_tags" {
  description = "Common tags (passed from root)"
  type        = map(string)
  default     = {}
}

# Module-specific variables
variable "lambda_function_name" {
  description = "Lambda function name for API Gateway integration"
  type        = string
}

variable "lambda_invoke_arn" {
  description = "Lambda function invoke ARN for API Gateway integration"
  type        = string
}