# Cloud Defenders Game Infrastructure
# Main Terraform configuration file

# Variables are defined in variables.tf

# Custom domain resources removed - using AWS-generated URLs only

# S3 Static Website Hosting Module
module "s3_game_hosting" {
  source = "./modules/s3_game_hosting"

  project_name = var.project_name
  environment  = var.environment
  common_tags  = local.common_tags
}

# DynamoDB Module
module "dynamodb" {
  source = "./modules/dynamodb"

  project_name = var.project_name
  environment  = var.environment
  common_tags  = local.common_tags
}

# Lambda Function Module
module "lambda_function" {
  source = "./modules/lambda_function"

  project_name        = var.project_name
  environment         = var.environment
  dynamodb_table_name = module.dynamodb.table_name
  dynamodb_table_arn  = module.dynamodb.table_arn
  common_tags         = local.common_tags
}

# API Gateway Module
module "api_gateway" {
  source = "./modules/api_gateway"

  project_name         = var.project_name
  environment          = var.environment
  lambda_function_name = module.lambda_function.function_name
  lambda_invoke_arn    = module.lambda_function.invoke_arn
  common_tags          = local.common_tags
}

# API Domain Module removed - using AWS-generated API Gateway URLs
