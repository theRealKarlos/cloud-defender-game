# ============================================================================
# TERRAFORM BACKEND CONFIGURATION
# ============================================================================
# Modern S3 backend configuration without deprecated DynamoDB locking
# Terraform 1.6+ uses native state locking mechanisms

terraform {
  backend "s3" {
    bucket = "terraform-state-karl-hitchcock"
    key    = "cloud-defenders/envs/dev/terraform.tfstate"
    region = "eu-west-2"

    # Security settings
    encrypt      = true
    use_lockfile = true
  }
}