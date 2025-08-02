# ============================================================================
# DEPLOY INFRASTRUCTURE WITHOUT CLOUDFRONT (SIMPLE VERSION)
# ============================================================================
# This script deploys all infrastructure except CloudFront distribution

Write-Host "Deploying Cloud Defenders infrastructure (excluding CloudFront)..." -ForegroundColor Green

# Change to infrastructure directory
Set-Location -Path "infra"

# Check if Terraform is initialized
if (-not (Test-Path ".terraform")) {
    Write-Host "Initializing Terraform..." -ForegroundColor Yellow
    terraform init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Terraform init failed" -ForegroundColor Red
        exit 1
    }
}

# Define targets to deploy (everything except CloudFront)
$targets = @(
    "module.dynamodb",
    "module.lambda_function", 
    "module.api_gateway"
)

# Build the terraform command
$terraformArgs = @("apply", "-auto-approve")
foreach ($target in $targets) {
    $terraformArgs += "-target=$target"
}

Write-Host "Deploying the following components:" -ForegroundColor Cyan
foreach ($target in $targets) {
    Write-Host "  - $target" -ForegroundColor White
}
Write-Host ""

# Execute terraform apply
Write-Host "Running terraform apply..." -ForegroundColor Yellow
& terraform @terraformArgs

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
    Write-Host "terraform apply -target=module.s3_game_hosting -target=aws_acm_certificate.cloudfront_cert -target=aws_acm_certificate_validation.cloudfront_cert -target=aws_route53_record.cloudfront_cert_validation"
} else {
    Write-Host "✗ Deployment failed" -ForegroundColor Red
    exit 1
}

# Return to original directory
Set-Location -Path ".."