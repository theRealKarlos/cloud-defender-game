variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name for the Lambda function"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "DynamoDB table ARN for IAM permissions"
  type        = string
}