# Shared variables template for all modules
# This file defines the common variables that all modules accept
# Copy this content to each module's variables.tf file

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