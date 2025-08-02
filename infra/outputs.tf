# Outputs
output "s3_bucket_name" {
  description = "S3 bucket name for game hosting"
  value       = module.s3_game_hosting.bucket_name
}

output "website_url" {
  description = "CloudFront website URL"
  value       = module.s3_game_hosting.website_url
}

output "api_url" {
  description = "API Gateway URL"
  value       = module.api_gateway.api_url
}

output "s3_website_url" {
  description = "Website URL via CloudFront CDN"
  value       = module.s3_game_hosting.website_url
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.s3_game_hosting.cloudfront_distribution_id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.s3_game_hosting.cloudfront_domain_name
}

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = module.api_gateway.api_url
}

output "api_id" {
  description = "API Gateway ID"
  value       = module.api_gateway.api_id
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = module.lambda_function.function_name
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = module.dynamodb.table_name
}

# Certificate outputs removed - using AWS-managed certificates
