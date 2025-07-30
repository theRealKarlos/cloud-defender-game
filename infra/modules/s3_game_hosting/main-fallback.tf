# S3 Secure Static Website Hosting (Fallback without CloudFront)
# This provides better security than the original public bucket approach

# Private S3 bucket for storing static assets
resource "aws_s3_bucket" "game_hosting" {
  bucket = "${var.project_name}-${var.environment}-game-hosting"

  tags = {
    Name        = "Cloud Defenders Game Hosting"
    Environment = var.environment
    Project     = var.project_name
  }
}

# S3 bucket website configuration
resource "aws_s3_bucket_website_configuration" "game_site" {
  bucket = aws_s3_bucket.game_hosting.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html" # SPA fallback
  }
}

# Controlled public access (more secure than original)
resource "aws_s3_bucket_public_access_block" "game_hosting" {
  bucket = aws_s3_bucket.game_hosting.id

  # Allow public read access but block public write
  block_public_acls       = true
  block_public_policy     = false # Allow bucket policy
  ignore_public_acls      = true
  restrict_public_buckets = false # Allow website hosting
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

# Secure bucket policy - only allow GET requests to website content
resource "aws_s3_bucket_policy" "game_hosting" {
  bucket = aws_s3_bucket.game_hosting.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.game_hosting.arn}/*"
        Condition = {
          StringEquals = {
            "s3:ExistingObjectTag/Environment" = var.environment
          }
        }
      },
      {
        Sid       = "DenyDirectAccess"
        Effect    = "Deny"
        Principal = "*"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.game_hosting.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.game_hosting]
}

# CORS configuration for API calls
resource "aws_s3_bucket_cors_configuration" "game_hosting" {
  bucket = aws_s3_bucket.game_hosting.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
