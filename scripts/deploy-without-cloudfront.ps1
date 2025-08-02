# ============================================================================
# DEPLOY INFRASTRUCTURE WITHOUT CLOUDFRONT
# ============================================================================
# This script deploys all infrastructure except CloudFront distribution

Write-Host "Deploying Cloud Defenders infrastructure (excluding CloudFront)..." -ForegroundColor Green

# Change to infrastructure directory
Set-Location -Path "infra"

# Check if Terraform is initialized
if (-not (Test-Path ".terraform")) {
    Write-Host "Initializing Terraform..." -ForegroundColor Yellow
    terraform init
}

# Plan the deployment (excluding CloudFront)
Write-Host "Planning deployment..." -ForegroundColor Yellow
$targets = @(
    "-target=module.dynamodb",
    "-target=module.lambda_function", 
    "-target=module.api_gateway",
    "-target=module.api_domain",
    "-target=aws_acm_certificate.api_cert",
    "-target=aws_acm_certificate_validation.api_cert",
    "-target=aws_route53_record.api_cert_validation"
)

terraform plan @targets -out=tfplan-no-cloudfront

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Planning failed" -ForegroundColor Red
    exit 1
}

# Apply the plan
Write-Host "Applying infrastructure changes..." -ForegroundColor Yellow
terraform apply tfplan-no-cloudfront

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Infrastructure deployed successfully (without CloudFront)!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Deployed components:" -ForegroundColor Cyan
    Write-Host "- DynamoDB table for scores"
    Write-Host "- Lambda function for API"
    Write-Host "- API Gateway v2 (HTTP API)"
    Write-Host "- API custom domain"
    Write-Host "- SSL certificates for API"
    Write-Host ""
    Write-Host "To deploy CloudFront later, run:" -ForegroundColor Yellow
    Write-Host "terraform apply -target=module.s3_game_hosting"
}
else {
    Write-Host "✗ Deployment failed" -ForegroundColor Red
    exit 1
}

# Clean up plan file
Remove-Item -Path "tfplan-no-cloudfront" -ErrorAction SilentlyContinue

# Return to original directory
Set-Location -Path ".."