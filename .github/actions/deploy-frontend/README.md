# Deploy Frontend Action

A custom GitHub Action for deploying frontend applications to AWS S3 and CloudFront with optimised caching and verification for the Cloud Defenders project.

## Features

- **Pre-built Artefact Deployment**: Expects pre-built frontend artefacts (no internal build process)
- **Versioned S3 Deployments**: Creates timestamped version folders for rollback capability
- **CloudFront Origin Path Updates**: Updates CloudFront origin to point to new version
- **Automated Rollback**: Reverts CloudFront origin path on deployment failure
- **Asset Optimisation**: Intelligent cache headers for different asset types
- **Deployment Verification**: Health checks and comprehensive reporting
- **Dry-run Support**: Testing capability without actual deployment

## Usage

### Basic Usage

```yaml
- name: Deploy Frontend
  uses: ./.github/actions/deploy-frontend
  with:
    s3-bucket: 'my-frontend-bucket'
    cloudfront-distribution-id: 'E1234567890ABC'
```

### Advanced Usage

```yaml
- name: Deploy Frontend to Production
  uses: ./.github/actions/deploy-frontend
  with:
    s3-bucket: 'clouddefenders-prod-frontend'
    cloudfront-distribution-id: 'E1234567890ABC'
    environment: 'production'
    source-directory: './frontend'
    build-directory: './frontend/dist'
    cache-control: 'public, max-age=86400'
    index-cache-control: 'public, max-age=300, must-revalidate'
```

### Multi-Environment Deployment

```yaml
strategy:
  matrix:
    environment: [development, production]
    include:
      - environment: development
        s3-bucket: 'clouddefenders-dev-frontend'
        distribution-id: 'E1111111111111'
      - environment: production
        s3-bucket: 'clouddefenders-prod-frontend'
        distribution-id: 'E2222222222222'

steps:
  - name: Deploy to ${{ matrix.environment }}
    uses: ./.github/actions/deploy-frontend
    with:
      s3-bucket: ${{ matrix.s3-bucket }}
      cloudfront-distribution-id: ${{ matrix.distribution-id }}
      environment: ${{ matrix.environment }}
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `aws-region` | AWS region for deployment | No | `eu-west-2` |
| `s3-bucket` | S3 bucket name for static assets | Yes | - |
| `cloudfront-distribution-id` | CloudFront distribution ID | No | - |
| `build-directory` | Directory containing built assets | No | `./frontend/dist` |
| `source-directory` | Source directory for frontend code | No | `./frontend` |
| `environment` | Deployment environment | No | `development` |
| `cache-control` | Cache-Control header for static assets | No | `public, max-age=31536000` |
| `index-cache-control` | Cache-Control header for index.html | No | `public, max-age=0, must-revalidate` |
| `dry-run` | Perform dry run without deployment | No | `false` |

## Outputs

| Output | Description |
|--------|-------------|
| `deployment-url` | URL of the deployed application |
| `s3-sync-output` | Output from S3 sync operation |
| `cache-invalidation-id` | CloudFront cache invalidation ID |
| `build-size` | Total size of built assets |

## Deployment Process

The action expects pre-built frontend artefacts and handles deployment:

1. **Artefact Validation**: Verifies build directory exists and contains files
2. **Version Generation**: Creates timestamped version path for rollback capability
3. **S3 Deployment**: Uploads files to versioned S3 path (e.g., `/v20231201-12345678/`)
4. **CloudFront Update**: Updates origin path to point to new version
5. **Health Verification**: Performs health checks on deployed application
6. **Rollback on Failure**: Reverts CloudFront origin path if verification fails

### Pre-built Artefact Requirements

The action expects:
- **Build Directory**: Contains all static assets (HTML, CSS, JS, images)
- **Index File**: Must include `index.html` as entry point
- **Asset Structure**: Properly organised static assets ready for deployment

## Caching Strategy

### Static Assets
- **Cache-Control**: `public, max-age=31536000` (1 year)
- **Files**: JavaScript, CSS, images, fonts
- **Compression**: Gzip compression for JS/CSS files

### HTML Files
- **Cache-Control**: `public, max-age=0, must-revalidate`
- **Files**: index.html, error.html
- **Strategy**: Always revalidate to ensure fresh content

## CloudFront Integration

When `cloudfront-distribution-id` is provided:

1. **Origin Path Update**: Updates CloudFront origin path to point to new version folder
2. **Rollback Capability**: Stores previous origin path for automatic rollback
3. **Health Verification**: Performs health checks on new deployment
4. **Automatic Rollback**: Reverts origin path if health checks fail

## Deployment Verification

The action includes comprehensive verification:

1. **Build Validation**: Ensures build directory exists and contains files
2. **S3 Sync Verification**: Confirms successful upload to S3
3. **Health Check**: Performs HTTP request to deployment URL
4. **Deployment Summary**: Generates detailed report in GitHub Actions

## Error Handling

- **Missing Artefacts**: Fails if build directory doesn't exist or is empty
- **S3 Sync Issues**: Provides detailed AWS CLI output for troubleshooting
- **CloudFront Update Failures**: Handles origin path update errors gracefully
- **Health Check Failures**: Triggers automatic rollback to previous version
- **Rollback Failures**: Provides clear error messages for manual intervention

## Examples

### Complete Deployment Pipeline

```yaml
jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: eu-west-2
      
      - name: Setup Node.js
        uses: ./.github/actions/setup-node
        with:
          working-directory: './frontend'
      
      - name: Deploy Frontend
        uses: ./.github/actions/deploy-frontend
        with:
          s3-bucket: ${{ secrets.S3_BUCKET }}
          cloudfront-distribution-id: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
          environment: 'production'
```

### Dry Run Testing

```yaml
- name: Test Deployment (Dry Run)
  uses: ./.github/actions/deploy-frontend
  with:
    s3-bucket: 'test-bucket'
    dry-run: 'true'
```

### Custom Cache Headers

```yaml
- name: Deploy with Custom Caching
  uses: ./.github/actions/deploy-frontend
  with:
    s3-bucket: 'my-bucket'
    cache-control: 'public, max-age=86400, immutable'
    index-cache-control: 'public, max-age=300, s-maxage=600'
```

### Without CloudFront

```yaml
- name: Deploy to S3 Only
  uses: ./.github/actions/deploy-frontend
  with:
    s3-bucket: 'my-static-website-bucket'
    # cloudfront-distribution-id omitted
```

## Required AWS Permissions

The action requires the following AWS permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:PutBucketWebsite"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetDistribution",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

## Troubleshooting

### Build Failures

1. **No build script**: Ensure `package.json` contains build scripts
2. **Environment variables**: Check if build requires specific env vars
3. **Dependencies**: Verify all dependencies are listed in `package.json`

### S3 Sync Issues

1. **Permissions**: Verify AWS credentials have S3 access
2. **Bucket exists**: Ensure S3 bucket is created and accessible
3. **Region mismatch**: Check AWS region configuration

### CloudFront Issues

1. **Distribution ID**: Verify CloudFront distribution exists
2. **Permissions**: Ensure CloudFront invalidation permissions
3. **Propagation delay**: Allow time for CloudFront updates

### Health Check Failures

Health check failures are common and usually resolve automatically:

- **DNS propagation**: New deployments may take time to propagate
- **CloudFront caching**: Previous versions may be cached
- **SSL certificates**: HTTPS endpoints may need certificate validation

## Performance Optimisations

- **Parallel operations**: S3 sync and build run efficiently
- **Incremental sync**: Only changed files are uploaded
- **Compression**: Gzip compression reduces transfer time
- **Cache headers**: Optimised caching reduces future load times

## Security Considerations

- **IAM roles**: Use OIDC with least-privilege IAM roles
- **Secrets management**: Store sensitive values in GitHub Secrets
- **Asset integrity**: Checksums verify asset integrity
- **HTTPS enforcement**: Always use HTTPS for production deployments