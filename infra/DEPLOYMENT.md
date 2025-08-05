# Cloud Defenders Deployment Guide

This guide explains how to deploy Cloud Defenders with custom domains using your existing `lucky4some.com` hosted zone.

## Custom Domain Configuration

The infrastructure is configured to use:

- **Website**: `cloud-defenders.lucky4some.com`
- **API**: `cloud-defenders-api.lucky4some.com`

## Prerequisites

1. AWS CLI configured with appropriate permissions
2. Terraform installed (version ~> 1.12)
3. Existing Route53 hosted zone for your domain
4. Copy `terraform.tfvars.example` to `terraform.tfvars` and configure your values

### Configuration Setup

```bash
# Copy the example configuration
cp terraform.tfvars.example terraform.tfvars

# Edit with your actual values
# Note: hosted_zone_id is not sensitive but is environment-specific
# Find yours in AWS Console: Route53 > Hosted zones > [your domain]
```

## Deployment Steps

### Automated Deployment (Recommended)

The project uses GitHub Actions for automated deployment:

1. **Push to Development Branch**: Automatically deploys to development environment
2. **Push to Master Branch**: Automatically deploys to production environment
3. **Manual Deployment**: Use GitHub Actions UI for manual deployments

### Manual Deployment

If you prefer manual deployment:

#### 1. Initialize Terraform

```bash
cd infra
terraform init
```

#### 2. Plan the Deployment

```bash
terraform plan
```

This will show you all the resources that will be created, including:

- SSL certificates for both domains
- CloudFront distribution with custom domain
- API Gateway with custom domain
- Route53 records

#### 3. Deploy the Infrastructure

```bash
terraform apply
```

**Note**: The deployment will take 15-20 minutes due to:

- SSL certificate validation (2-5 minutes)
- CloudFront distribution creation (10-15 minutes)

#### 4. Deploy Applications

The CI/CD pipeline handles application deployment automatically, but you can deploy manually:

```bash
# Deploy backend
cd backend
npm install --production
zip -r ../dist/score_api.zip . -x "*.test.js" "__tests__/*" ".env*"

aws lambda update-function-code \
  --function-name cloud-defenders-api \
  --zip-file fileb://../dist/score_api.zip

# Deploy frontend
cd ../frontend
npm run build
aws s3 sync dist/ s3://$(cd ../infra && terraform output -raw s3_bucket_name)/ --delete
```

## Custom Domain URLs

After deployment, your game will be available at:

- **Game Website**: https://cloud-defenders.lucky4some.com
- **API Endpoint**: https://cloud-defenders-api.lucky4some.com

## Environment Variables

You can customise the deployment by setting these variables:

```bash
# Deploy to different environment
terraform apply -var="environment=prod"

# Use different project name
terraform apply -var="project_name=my-game"

# This would create:
# - Website: my-game.lucky4some.com
# - API: my-game-api.lucky4some.com
```

## Terraform Outputs

After deployment, you'll see these important outputs:

```bash
terraform output
```

Key outputs:

- `website_url`: Your custom domain website URL
- `api_url`: Your custom domain API URL
- `cloudfront_distribution_id`: For cache invalidation and CI/CD pipeline
- `s3_bucket_name`: For uploading files and CI/CD pipeline
- `lambda_function_name`: Lambda function name for CI/CD pipeline
- `lambda_alias_name`: Lambda alias name for rollback management

## SSL Certificates

The infrastructure automatically creates and validates SSL certificates:

- CloudFront certificate (in us-east-1 region)
- API Gateway certificate (in your deployment region)

Both certificates are validated via DNS using your existing hosted zone.

## Monitoring and Logs

- **CloudWatch Logs**: Lambda function logs are available in CloudWatch
- **API Gateway Logs**: Can be enabled in the AWS console if needed
- **CloudFront Logs**: Can be configured for detailed access logging

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all data including scores in DynamoDB.

## Troubleshooting

### Certificate Validation Issues

If certificate validation fails:

1. Check that the hosted zone ID is correct
2. Ensure DNS propagation has completed (can take up to 48 hours)
3. Verify Route53 permissions

### CloudFront Distribution Issues

- CloudFront distributions can take 15-20 minutes to deploy
- Changes to CloudFront require cache invalidation
- Custom domains require certificates in us-east-1

### API Gateway Custom Domain Issues

- Ensure the certificate is in the same region as API Gateway
- Custom domain mapping can take a few minutes to become active
- Check Route53 record creation

## Security Considerations

- S3 bucket is private with CloudFront OAC access only
- API Gateway has CORS configured for web access
- DynamoDB uses IAM roles for Lambda access
- All traffic uses HTTPS with modern TLS versions
