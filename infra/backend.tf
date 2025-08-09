# ============================================================================
# TERRAFORM BACKEND CONFIGURATION
# ============================================================================
# Modern S3 backend configuration without deprecated DynamoDB locking
# Terraform 1.10+ uses native state locking mechanisms
#
# IMPORTANT: This backend configuration uses a generic key that is dynamically
# overridden during initialisation. The actual environment-specific state file
# path is provided via the -backend-config flag during terraform init.
#
# This approach ensures:
# 1. Environment isolation (dev/production use separate state files)
# 2. Prevents accidental deployments to wrong environments
# 3. Maintains compatibility with both local and CI/CD workflows
# 4. Follows Terraform best practices for multi-environment deployments

terraform {
  backend "s3" {
    bucket = "terraform-state-karl-hitchcock"
    key    = "cloud-defenders/terraform.tfstate"
    region = "eu-west-2"

    # Security settings
    encrypt      = true
    use_lockfile = true
  }
}

# ============================================================================
# DYNAMIC BACKEND CONFIGURATION
# ============================================================================
# The environment-specific state file path is provided dynamically during
# terraform init using the -backend-config flag. This prevents accidental
# deployments to the wrong environment and ensures proper state isolation.
#
# Local Development:
#   terraform init -backend-config="key=cloud-defenders/envs/dev/terraform.tfstate"
#
# CI/CD Pipeline:
#   terraform init -backend-config="key=cloud-defenders/envs/${{ inputs.environment }}/terraform.tfstate"
#
# This ensures each environment (dev, production) uses its own isolated state file
# and prevents state corruption from concurrent deployments.
