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
variable "dynamodb_table_name" {
  description = "DynamoDB table name for the Lambda function"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "DynamoDB table ARN for IAM permissions"
  type        = string
}