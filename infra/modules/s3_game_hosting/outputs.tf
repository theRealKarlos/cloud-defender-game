output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.game_hosting.bucket
}

output "bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.game_hosting.bucket_domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.game_hosting.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.game_hosting.domain_name
}

output "website_url" {
  description = "Complete website URL (CloudFront HTTPS)"
  value       = "https://${aws_cloudfront_distribution.game_hosting.domain_name}"
}

output "cloudfront_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.game_hosting.arn
}
