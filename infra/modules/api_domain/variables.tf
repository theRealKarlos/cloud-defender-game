variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "domain_name" {
  description = "Custom domain name for the API"
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

variable "api_gateway_id" {
  description = "API Gateway REST API ID"
  type        = string
}

variable "api_gateway_stage_name" {
  description = "API Gateway stage name"
  type        = string
}