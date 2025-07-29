# S3 Static Website Hosting Module for Cloud Defenders Game

resource "aws_s3_bucket" "game_hosting" {
  bucket = "${var.project_name}-${var.environment}-game-hosting"
  
  tags = {
    Name        = "Cloud Defenders Game Hosting"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_s3_bucket_website_configuration" "game_site" {
  bucket = aws_s3_bucket.game_hosting.id
  
  index_document {
    suffix = "index.html"
  }
  
  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_public_access_block" "game_hosting" {
  bucket = aws_s3_bucket.game_hosting.id
  
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

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
      }
    ]
  })
  
  depends_on = [aws_s3_bucket_public_access_block.game_hosting]
}