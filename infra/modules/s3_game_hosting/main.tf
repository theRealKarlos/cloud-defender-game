# S3 + CloudFront Static Website Hosting with Private Bucket
# Uses CloudFront with Origin Access Control for secure content delivery

# Private S3 bucket for storing static assets
resource "aws_s3_bucket" "game_hosting" {
  bucket = "${var.project_name}-${var.environment}-game-hosting"

  tags = {
    Name        = "Cloud Defenders Game Hosting"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Block all public access to S3 bucket
resource "aws_s3_bucket_public_access_block" "game_hosting" {
  bucket = aws_s3_bucket.game_hosting.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket versioning (security best practice)
resource "aws_s3_bucket_versioning" "game_hosting" {
  bucket = aws_s3_bucket.game_hosting.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "game_hosting" {
  bucket = aws_s3_bucket.game_hosting.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CloudFront Origin Access Control (OAC) - modern replacement for OAI
resource "aws_cloudfront_origin_access_control" "game_hosting" {
  name                              = "${var.project_name}-${var.environment}-oac"
  description                       = "OAC for Cloud Defenders Game"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "game_hosting" {
  origin {
    domain_name              = aws_s3_bucket.game_hosting.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.game_hosting.id
    origin_id                = "S3-${aws_s3_bucket.game_hosting.bucket}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Cloud Defenders Game CDN"
  default_root_object = "index.html"

  # Cache behavior for SPA routing
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.game_hosting.bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  # Custom error page for SPA routing
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  price_class = "PriceClass_100" # Use only North America and Europe edge locations

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Custom domain configuration
  aliases = var.domain_name != null ? [var.domain_name] : []

  viewer_certificate {
    cloudfront_default_certificate = var.domain_name == null
    acm_certificate_arn            = var.certificate_arn
    ssl_support_method             = var.domain_name != null ? "sni-only" : null
    minimum_protocol_version       = var.domain_name != null ? "TLSv1.2_2021" : null
  }

  tags = {
    Name        = "Cloud Defenders Game CDN"
    Environment = var.environment
    Project     = var.project_name
  }
}

# S3 bucket policy to allow CloudFront OAC access
resource "aws_s3_bucket_policy" "game_hosting" {
  bucket = aws_s3_bucket.game_hosting.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.game_hosting.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.game_hosting.arn
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.game_hosting]
}

# Route53 record for custom domain (if provided)
resource "aws_route53_record" "website" {
  count   = var.domain_name != null ? 1 : 0
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.game_hosting.domain_name
    zone_id                = aws_cloudfront_distribution.game_hosting.hosted_zone_id
    evaluate_target_health = false
  }
}
