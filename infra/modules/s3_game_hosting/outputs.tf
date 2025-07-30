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
