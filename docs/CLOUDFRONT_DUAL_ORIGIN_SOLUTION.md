# CloudFront Dual-Origin Solution for Config.json Access

## Problem Statement

The Cloud Defenders Game was experiencing persistent `403 Forbidden` errors when attempting to access `/config.json` through CloudFront. This occurred because:

1. **Single Origin Limitation**: The original CloudFront configuration used a single S3 origin with a dynamic `origin_path` that pointed to versioned deployment folders (e.g., `/v20250109-195355-50caffbf/`).

2. **Architectural Mismatch**: The application requires two different file serving patterns:
   - `config.json` must always be accessible from the S3 bucket root for consistent configuration access
   - Application assets (HTML, CSS, JS) must be served from versioned deployment folders

3. **CI/CD Pipeline Impact**: Every deployment updated the single origin's path, making `config.json` inaccessible from its expected location.

## Solution: Dual-Origin Architecture

### Overview

The solution implements a **dual-origin architecture** in CloudFront that separates concerns and provides dedicated origins for different file types:

- **S3-Root Origin**: Serves `config.json` from the bucket root
- **S3-Versioned Origin**: Serves application assets from versioned deployment folders

### Technical Implementation

#### 1. Terraform Configuration (`infra/modules/s3_game_hosting/main.tf`)

```terraform
# Origin 1: S3 Bucket Root (for config.json)
origin {
  domain_name              = aws_s3_bucket.game_hosting.bucket_regional_domain_name
  origin_access_control_id = aws_cloudfront_origin_access_control.game_hosting.id
  origin_id                = "S3-Root"
  # No origin_path - serves from bucket root
}

# Origin 2: S3 Versioned Assets
origin {
  domain_name              = aws_s3_bucket.game_hosting.bucket_regional_domain_name
  origin_access_control_id = aws_cloudfront_origin_access_control.game_hosting.id
  origin_id                = "S3-Versioned"
  origin_path              = "/v20250109-195355-50caffbf" # Default path, updated by CI/CD
}
```

#### 2. Cache Behaviour Configuration

**Config.json Cache Behaviour**:
```terraform
ordered_cache_behavior {
  path_pattern     = "config.json"
  target_origin_id = "S3-Root" # Serve from bucket root
  min_ttl          = 0
  default_ttl      = 0   # Never cache - always fetch fresh
  max_ttl          = 0   # Prevent any caching at edge locations
}
```

**Default Cache Behaviour**:
```terraform
default_cache_behavior {
  target_origin_id = "S3-Versioned" # Serve from versioned assets
  default_ttl      = 3600
  max_ttl          = 86400
}
```

#### 3. CI/CD Pipeline Updates

Both the GitHub Actions workflow (`.github/actions/deploy-frontend/action.yml`) and local PowerShell script (`scripts/deploy/deploy-frontend.ps1`) now intelligently update only the `S3-Versioned` origin:

```bash
# Update the origin_path for the S3-Versioned origin only
# This preserves the S3-Root origin for config.json
updated_config=$(echo "$distribution_config" | jq --arg path "/$versionFolder" '
  .Origins.Items |= map(
    if .Id == "S3-Versioned" then
      . + {OriginPath: $path}
    else
      .
    end
  )
')
```

## Benefits of This Solution

### 1. **Reliability**
- `config.json` is always accessible from the root URL
- No more 403 errors due to versioned deployment paths
- Consistent configuration access regardless of deployment state

### 2. **Performance**
- Config.json has zero caching (TTL=0) for immediate updates
- Application assets maintain appropriate caching for optimal performance
- Separate cache behaviours allow fine-tuned control

### 3. **Maintainability**
- Clear separation of concerns between configuration and application assets
- CI/CD pipeline is aware of the dual-origin structure
- Terraform configuration is self-documenting with extensive comments

### 4. **Security**
- Both origins use the same Origin Access Control (OAC) for S3 access
- Security headers are consistently applied across all origins
- No public access to S3 bucket - all access through CloudFront

## Deployment Process

### 1. **Infrastructure Deployment**
```bash
cd infra
terraform plan
terraform apply
```

### 2. **Frontend Deployment**
The deployment process now:
1. Uploads versioned assets to S3 subfolder
2. Uploads `config.json` to S3 bucket root
3. Updates CloudFront `S3-Versioned` origin path
4. Preserves `S3-Root` origin for config.json access

### 3. **Verification**
- `config.json` should be accessible at `https://[cloudfront-domain]/config.json`
- Application assets should load from versioned paths
- No more 403 errors in browser console

## File Structure

```
S3 Bucket: cloud-defenders-game-prod-game-hosting
├── config.json                    ← Served by S3-Root origin
├── v20250109-195355-50caffbf/    ← Served by S3-Versioned origin
│   ├── index.html
│   ├── js/
│   ├── css/
│   └── assets/
└── v20250110-120000-abc123/      ← Future deployments
    ├── index.html
    ├── js/
    ├── css/
    └── assets/
```

## Troubleshooting

### Common Issues

1. **403 Error Still Occurs**
   - Verify `config.json` exists in S3 bucket root
   - Check CloudFront cache invalidation includes `/config.json`
   - Ensure S3 bucket policy allows CloudFront OAC access

2. **Assets Not Loading**
   - Verify `S3-Versioned` origin path is correctly set
   - Check that versioned folder exists in S3
   - Ensure CloudFront distribution is fully deployed

3. **Cache Issues**
   - `config.json` should never be cached (TTL=0)
   - Application assets follow standard caching rules
   - Use CloudFront invalidation for forced updates

### Debug Commands

```bash
# Check CloudFront distribution origins
aws cloudfront get-distribution-config --id [DISTRIBUTION_ID] --query 'DistributionConfig.Origins.Items'

# Verify S3 bucket contents
aws s3 ls s3://[BUCKET_NAME] --recursive

# Test config.json access
curl -I https://[CLOUDFRONT_DOMAIN]/config.json
```

## Conclusion

The dual-origin architecture provides a robust, scalable solution that addresses the fundamental architectural mismatch between versioned deployments and consistent configuration access. This solution ensures that:

- Configuration files remain accessible at predictable URLs
- Application assets are properly versioned and cached
- The CI/CD pipeline can safely update deployment paths
- CloudFront serves the correct content from the appropriate S3 locations

This approach follows AWS best practices and provides a foundation for future enhancements while maintaining backward compatibility.
