# S3 + CloudFront Static Website Hosting with Private Bucket
# Uses CloudFront with Origin Access Control for secure content delivery

# Private S3 bucket for storing static assets
resource "aws_s3_bucket" "game_hosting" {
  bucket = "${var.project_name}-${var.environment}-game-hosting"

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-game-hosting"
  })
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

# =================================================================
# CLOUDFRONT SECURITY HEADERS POLICY
# =================================================================
# This policy adds essential security headers to all responses served
# through CloudFront. These headers help protect against common web
# vulnerabilities and provide defense-in-depth for the browser.
#
# Headers included:
# - X-Content-Type-Options: Prevents MIME type sniffing attacks
# - X-Frame-Options: Prevents clickjacking by blocking iframe embedding
# - Referrer-Policy: Controls how much referrer information is shared
# - Strict-Transport-Security: Enforces HTTPS connections
# - X-XSS-Protection: Enables browser XSS filtering (legacy browsers)
# - Content-Security-Policy: Restricts resource loading to prevent XSS
# - Permissions-Policy: Controls browser feature access
#
# The CSP is configured for this specific game application and may need
# adjustment if you add third-party scripts, fonts, or API endpoints.
# =================================================================
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name = "${var.project_name}-${var.environment}-security-headers"

  security_headers_config {
    # Prevent MIME type sniffing attacks
    content_type_options {
      override = true
    }

    # Prevent clickjacking by blocking iframe embedding
    frame_options {
      frame_option = "DENY"
      override     = true
    }

    # Control referrer information sharing
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    # Enforce HTTPS connections (HSTS)
    strict_transport_security {
      access_control_max_age_sec = 31536000 # 1 year
      include_subdomains         = true
      preload                    = false # Set to true if you want HSTS preload
      override                   = true
    }

    # Enable XSS protection for legacy browsers
    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }

    # Content Security Policy - restricts resource loading
    # Configured for the game's specific requirements:
    # - 'self': Allow resources from the same origin
    # - 'unsafe-inline' for style-src: Required for inline CSS in the game
    # - data: for img-src: Allows data URLs for images/icons
    # - API endpoint: Allows connections to the game's API
    content_security_policy {
      content_security_policy = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://*.execute-api.eu-west-2.amazonaws.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
      override                = true
    }
  }

  # Additional security-related headers
  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      override = true
      # Disable potentially sensitive browser features
      value = "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()"
    }
  }
}

# =================================================================
# RELAXED SECURITY HEADERS POLICY FOR DIAGNOSTICS
# =================================================================
# This policy is specifically for development/diagnostics pages that
# require inline scripts to function properly. It maintains most security
# protections but relaxes CSP to allow inline scripts and styles.
#
# Applied only to: api-diagnostics.html, debug.html, icon-test.html
# =================================================================
resource "aws_cloudfront_response_headers_policy" "diagnostics_headers" {
  name = "${var.project_name}-${var.environment}-diagnostics-headers"

  security_headers_config {
    # Prevent MIME type sniffing attacks
    content_type_options {
      override = true
    }

    # Prevent clickjacking by blocking iframe embedding
    frame_options {
      frame_option = "DENY"
      override     = true
    }

    # Control referrer information sharing
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    # Enforce HTTPS connections (HSTS)
    strict_transport_security {
      access_control_max_age_sec = 31536000 # 1 year
      include_subdomains         = true
      preload                    = false
      override                   = true
    }

    # Enable XSS protection for legacy browsers
    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }

    # Relaxed CSP for diagnostics pages - allows inline scripts and styles
    # This is less secure but necessary for development/diagnostics tools
    content_security_policy {
      content_security_policy = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.execute-api.eu-west-2.amazonaws.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
      override                = true
    }
  }

  # Additional security-related headers
  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      override = true
      # Disable potentially sensitive browser features
      value = "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()"
    }
  }
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

  # =================================================================
  # ORDERED CACHE BEHAVIORS FOR DIAGNOSTICS PAGES
  # =================================================================
  # These behaviors have higher precedence (lower numbers) than the
  # default behavior and apply relaxed security headers to development
  # and diagnostics pages that require inline scripts to function.
  # =================================================================

  # API diagnostics page - relaxed CSP for inline scripts
  ordered_cache_behavior {
    path_pattern     = "api-diagnostics.html"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.game_hosting.bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy     = "redirect-to-https"
    min_ttl                    = 0
    default_ttl                = 300 # Shorter cache for dev tools
    max_ttl                    = 3600
    compress                   = true
    response_headers_policy_id = aws_cloudfront_response_headers_policy.diagnostics_headers.id
  }

  # Debug page - relaxed CSP for inline scripts
  ordered_cache_behavior {
    path_pattern     = "debug.html"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.game_hosting.bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy     = "redirect-to-https"
    min_ttl                    = 0
    default_ttl                = 300 # Shorter cache for dev tools
    max_ttl                    = 3600
    compress                   = true
    response_headers_policy_id = aws_cloudfront_response_headers_policy.diagnostics_headers.id
  }

  # Icon test page - relaxed CSP for inline scripts
  ordered_cache_behavior {
    path_pattern     = "icon-test.html"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.game_hosting.bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy     = "redirect-to-https"
    min_ttl                    = 0
    default_ttl                = 300 # Shorter cache for dev tools
    max_ttl                    = 3600
    compress                   = true
    response_headers_policy_id = aws_cloudfront_response_headers_policy.diagnostics_headers.id
  }

  # =================================================================
  # RUNTIME CONFIGURATION CACHE BEHAVIOUR
  # =================================================================
  # This behaviour handles the `/config.json` file which contains
  # runtime configuration for the frontend application. Unlike the
  # versioned application assets, this file must always be served
  # from the root of the S3 bucket (not from versioned folders).
  #
  # Key characteristics:
  # - Zero caching (TTL=0) to ensure configuration updates are immediate
  # - Served from bucket root whilst other assets come from versioned paths
  # - Uses strict security headers (same as main application)
  # - Essential for the application's runtime configuration system
  #
  # This solves the architectural challenge where versioned deployments
  # live in subfolders but configuration must remain at a consistent URL.
  # =================================================================

  # Runtime configuration file - no caching, served from bucket root
  ordered_cache_behavior {
    path_pattern     = "config.json"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.game_hosting.bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy     = "redirect-to-https"
    min_ttl                    = 0
    default_ttl                = 0 # Never cache - always fetch fresh
    max_ttl                    = 0 # Prevent any caching at edge locations
    compress                   = true
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

  # Cache behavior for SPA routing (main game and other pages)
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

    viewer_protocol_policy     = "redirect-to-https"
    min_ttl                    = 0
    default_ttl                = 3600
    max_ttl                    = 86400
    compress                   = true
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
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

  # Using CloudFront default certificate (no custom domain)
  aliases = []

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-${var.environment}-cloudfront"
  })
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

# Route53 record removed - using CloudFront default domain
