output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.game_hosting.bucket
}

output "bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.game_hosting.bucket_domain_name
}

output "website_endpoint" {
  description = "Website endpoint of the S3 bucket"
  value       = aws_s3_bucket_website_configuration.game_site.website_endpoint
}

output "website_url" {
  description = "Complete website URL"
  value       = "http://${aws_s3_bucket_website_configuration.game_site.website_endpoint}"
}

# Dummy outputs for compatibility (will be empty in S3 mode)
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (not available in S3 mode)"
  value       = "N/A - S3 Website Mode"
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name (not available in S3 mode)"
  value       = "N/A - S3 Website Mode"
}
