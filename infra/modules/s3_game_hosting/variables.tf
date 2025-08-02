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
variable "domain_name" {
  description = "Custom domain name for the website"
  type        = string
  default     = null
}

variable "certificate_arn" {
  description = "ACM certificate ARN for the custom domain"
  type        = string
  default     = null
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for the domain"
  type        = string
  default     = null
}