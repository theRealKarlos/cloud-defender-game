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

# No module-specific variables - using AWS-generated URLs only