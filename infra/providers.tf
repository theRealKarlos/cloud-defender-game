# ============================================================================
# PROVIDER CONFIGURATIONS - DEV ENVIRONMENT (AWS)
# ============================================================================
provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile != null ? var.aws_profile : null
}

# Provider for US East 1 (required for CloudFront certificates)
provider "aws" {
  alias   = "us-east-1"
  region  = "us-east-1"
  profile = var.aws_profile != null ? var.aws_profile : null
}
