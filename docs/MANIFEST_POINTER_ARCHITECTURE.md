# Manifest Pointer Architecture

## Overview

The Manifest Pointer architecture is a deployment strategy that eliminates the need to update CloudFront configuration on every deployment. Instead of dynamically modifying CloudFront's `origin_path`, the system uses a static manifest file to direct the frontend to the correct versioned assets.

## Problem Solved

### Previous Approach: Dynamic CloudFront Updates

- **Issue**: CloudFront's `origin_path` was updated on every deployment via CI/CD
- **Problems**:
  - Deployment delays (CloudFront propagation takes 5-15 minutes)
  - Risk of deployment failures if CloudFront updates fail
  - Infrastructure state drift between Terraform and live AWS
  - Brittle deployment process with multiple moving parts

### New Approach: Static Infrastructure + Client-Side Versioning

- **Solution**: CloudFront configuration remains completely static
- **Benefits**:
  - Instant deployments (no CloudFront propagation delays)
  - Predictable infrastructure state
  - Terraform remains the single source of truth
  - Robust and reliable deployment process

## How It Works

### 1. Static CloudFront Configuration

The CloudFront distribution uses a single, static S3 origin pointing to the bucket root:

```terraform
origin {
  domain_name              = aws_s3_bucket.game_hosting.bucket_regional_domain_name
  origin_access_control_id = aws_cloudfront_origin_access_control.game_hosting.id
  origin_id                = "S3-Bucket-Root" // Simplified static ID
}
```

### 2. Cache Behaviours

Three specialised cache behaviours handle different file types:

#### Configuration Files (No Caching)

```terraform
ordered_cache_behavior {
  path_pattern     = "config.json"
  target_origin_id = "S3-Bucket-Root"
  min_ttl                    = 0
  default_ttl                = 0   // Never cache
  max_ttl                    = 0
}

ordered_cache_behavior {
  path_pattern     = "manifest.json"
  target_origin_id = "S3-Bucket-Root"
  min_ttl                    = 0
  default_ttl                = 0   // Never cache
  max_ttl                    = 0
}
```

#### Application Assets (Standard Caching)

```terraform
default_cache_behavior {
  target_origin_id = "S3-Bucket-Root"
  min_ttl                    = 3600
  default_ttl                = 3600
  max_ttl                    = 86400
}
```

### 3. Bootstrap Loader

The `index.html` contains a bootstrap loader that:

1. **Fetches Configuration**: Loads `manifest.json` and `config.json` in parallel
2. **Determines Version**: Extracts the current version from `manifest.json`
3. **Dynamic Asset Loading**: Injects all application scripts and stylesheets with versioned paths
4. **Error Handling**: Provides user-friendly error messages if loading fails

```javascript
// Example bootstrap loader flow
const manifest = await fetch("/manifest.json").then((r) => r.json());
const config = await fetch("/config.json").then((r) => r.json());

const versionPath = manifest.version; // e.g., "v20250109-195355-50caffbf"

// Dynamically load versioned assets
const script = document.createElement("script");
script.src = `/${versionPath}/js/main.js`;
document.body.appendChild(script);
```

## Security Considerations

### Content Security Policy (CSP)

The Manifest Pointer architecture requires careful consideration of Content Security Policy:

#### Bootstrap Loader Security

- **`index.html`** contains an inline bootstrap script that dynamically loads assets
- **Security Risk**: Inline scripts can be vulnerable to XSS attacks if not properly controlled
- **Mitigation**: Applied relaxed CSP headers specifically for `index.html` via CloudFront cache behaviour

```terraform
// Bootstrap loader page - requires relaxed CSP for inline script
ordered_cache_behavior {
  path_pattern     = "index.html"
  response_headers_policy_id = aws_cloudfront_response_headers_policy.diagnostics_headers.id
}
```

#### Asset Security

- **All other assets** (JS, CSS, images) use strict CSP headers via `default_cache_behavior`
- **Protection**: Prevents XSS, clickjacking, and other security vulnerabilities
- **Isolation**: Bootstrap loader's relaxed CSP is isolated to only the entry point

#### Security Headers Applied

**Strict Security (Default):**

- `script-src 'self'` - Only allows scripts from same origin
- `style-src 'self' 'unsafe-inline'` - Allows inline styles (required for game)
- `frame-ancestors 'none'` - Prevents clickjacking
- HSTS, XSS protection, content type options

**Relaxed Security (Bootstrap & Diagnostics):**

- `script-src 'self' 'unsafe-inline'` - Allows inline scripts for bootstrap
- Maintains all other security protections
- Applied only to pages that require inline scripts

### Security Best Practices

1. **Minimal Inline Scripts**: Only the bootstrap loader contains inline scripts
2. **Strict Asset Loading**: All application code is loaded from external files
3. **CSP Isolation**: Relaxed CSP is limited to specific pages, not globally applied
4. **Regular Audits**: Security headers are version-controlled and auditable

## File Structure

```
S3 Bucket Root
├── index.html              # Bootstrap loader (static)
├── config.json            # Runtime configuration (no cache)
├── manifest.json          # Current version pointer (no cache)
└── v20250109-195355-50caffbf/  # Versioned deployment
    ├── css/
    ├── js/
    └── assets/
```

## Deployment Process

### 1. Asset Deployment

- Application files are deployed to versioned folders (e.g., `v20250109-195355-50caffbf/`)
- `config.json` is deployed to bucket root with no-cache headers
- `manifest.json` is created and deployed to bucket root with no-cache headers

### 2. No CloudFront Updates

- **Before**: CI/CD updated CloudFront `origin_path` on every deploy
- **Now**: CloudFront configuration remains completely static
- **Result**: Instant deployments with no propagation delays

### 3. Cache Invalidation

- Only essential files are invalidated: `index.html`, `config.json`, `manifest.json`
- Versioned assets use standard caching rules
- Reduced CloudFront costs and faster content delivery

## Benefits

### Performance

- **Instant Deployments**: No waiting for CloudFront propagation
- **Efficient Caching**: Versioned assets can be cached aggressively
- **Reduced Latency**: No CloudFront API calls during deployment

### Reliability

- **Predictable State**: Infrastructure state never drifts from Terraform
- **Fault Tolerance**: Deployment failures don't affect CloudFront configuration
- **Rollback Safety**: Easy to revert to previous versions

### Maintainability

- **Single Source of Truth**: Terraform defines all infrastructure
- **Simplified CI/CD**: No complex CloudFront update logic
- **Standard Patterns**: Follows industry best practices for static hosting

## Migration from Dual-Origin

### What Changed

1. **Removed**: Dynamic CloudFront `origin_path` updates
2. **Simplified**: Single S3 origin instead of dual origins
3. **Enhanced**: Bootstrap loader for dynamic asset loading
4. **Streamlined**: Deployment scripts no longer touch CloudFront

### What Stayed the Same

1. **File Structure**: Versioned deployments still work the same way
2. **Configuration**: `config.json` still serves from bucket root
3. **Security**: All security headers and policies remain unchanged
4. **Functionality**: Game functionality is completely unaffected

## Troubleshooting

### Common Issues

#### Manifest Not Found

- **Symptom**: `Failed to load manifest.json` error
- **Cause**: `manifest.json` not deployed to bucket root
- **Solution**: Check deployment logs for manifest creation step

#### Assets Not Loading

- **Symptom**: Scripts or stylesheets fail to load
- **Cause**: Incorrect version path in manifest or missing files
- **Solution**: Verify version folder exists and contains expected assets

#### Configuration Errors

- **Symptom**: `Failed to load config.json` error
- **Cause**: `config.json` not accessible or has incorrect permissions
- **Solution**: Check S3 bucket permissions and CloudFront cache behaviours

### Debugging Steps

1. **Check S3 Bucket**: Verify `manifest.json` and `config.json` exist at root
2. **Verify CloudFront**: Ensure cache behaviours are correctly configured
3. **Check Browser Console**: Look for network errors and JavaScript errors
4. **Validate Terraform**: Run `terraform plan` to verify configuration

## Future Enhancements

### Potential Improvements

1. **Multiple Environment Support**: Different manifests for staging/production
2. **Asset Preloading**: Preload critical assets for better performance
3. **Version Validation**: Verify manifest version matches deployed files
4. **Health Checks**: Monitor manifest and config accessibility

### Scalability Considerations

1. **CDN Distribution**: Works with any CDN that supports S3 origins
2. **Multi-Region**: Can be extended to support global deployments
3. **Asset Optimization**: Supports advanced caching strategies
4. **Monitoring**: Easy to add CloudWatch metrics and alarms

## Conclusion

The Manifest Pointer architecture transforms our deployment process from a complex, state-mutating system to a simple, static infrastructure with client-side versioning. This approach provides:

- **Instant Deployments**: No more waiting for CloudFront propagation
- **Predictable Infrastructure**: Terraform remains the single source of truth
- **Robust Operations**: Fewer moving parts mean fewer failure points
- **Industry Standards**: Follows established patterns for static hosting

This architecture represents a significant improvement in deployment reliability and maintainability whilst preserving all existing functionality.
