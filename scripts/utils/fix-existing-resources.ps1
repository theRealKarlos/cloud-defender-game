# ============================================================================
# FIX EXISTING RESOURCES SCRIPT
# ============================================================================
# This script handles existing resources by importing them into Terraform state

param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Profile,
    [Parameter(Mandatory = $false)]
    [string]$Environment = "dev"
)

Write-Host "Fixing existing resource conflicts..." -ForegroundColor Green

# Set AWS profile environment variable
$env:AWS_PROFILE = $Profile
Write-Host "Using AWS Profile: $Profile" -ForegroundColor Yellow

# Change to infrastructure directory
$infraDir = Join-Path $PSScriptRoot ".." ".." "infra"
Set-Location -Path $infraDir

# Check if resources exist in state
$dynamoExists = terraform state show module.dynamodb.aws_dynamodb_table.scores 2>$null
$iamRoleExists = terraform state show module.lambda_function.aws_iam_role.lambda_role 2>$null
$logGroupExists = terraform state show module.lambda_function.aws_cloudwatch_log_group.lambda_logs 2>$null
$s3BucketExists = terraform state show module.s3_game_hosting.aws_s3_bucket.game_hosting 2>$null
$oacExists = terraform state show module.s3_game_hosting.aws_cloudfront_origin_access_control.game_hosting 2>$null

if (-not $dynamoExists) {
    Write-Host "Importing existing DynamoDB table..." -ForegroundColor Yellow
    terraform import module.dynamodb.aws_dynamodb_table.scores cloud-defenders-$Environment-scores
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to import DynamoDB table. It may not exist or have a different name." -ForegroundColor Yellow
    }
}

if (-not $iamRoleExists) {
    Write-Host "Importing existing IAM role..." -ForegroundColor Yellow
    terraform import module.lambda_function.aws_iam_role.lambda_role cloud-defenders-$Environment-lambda-role
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to import IAM role. It may not exist or have a different name." -ForegroundColor Yellow
    }
}

if (-not $logGroupExists) {
    Write-Host "Importing existing CloudWatch Log Group..." -ForegroundColor Yellow
    terraform import module.lambda_function.aws_cloudwatch_log_group.lambda_logs "/aws/lambda/cloud-defenders-$Environment-score-api"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to import CloudWatch Log Group. It may not exist or have a different name." -ForegroundColor Yellow
    }
}

if (-not $s3BucketExists) {
    Write-Host "Importing existing S3 bucket..." -ForegroundColor Yellow
    terraform import module.s3_game_hosting.aws_s3_bucket.game_hosting cloud-defenders-$Environment-game-hosting
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to import S3 bucket. It may not exist or have a different name." -ForegroundColor Yellow
    }
}

if (-not $oacExists) {
    Write-Host "Importing existing CloudFront Origin Access Control..." -ForegroundColor Yellow
    # Get the OAC ID from AWS CLI
    $oacId = aws cloudfront list-origin-access-controls --query "OriginAccessControlList.Items[?Name=='cloud-defenders-$Environment-oac'].Id" --output text --profile $Profile
    if ($oacId -and $oacId -ne "None") {
        terraform import module.s3_game_hosting.aws_cloudfront_origin_access_control.game_hosting $oacId
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to import CloudFront OAC. It may not exist or have a different name." -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "CloudFront OAC not found in AWS." -ForegroundColor Yellow
    }
}

Write-Host "Attempting deployment..." -ForegroundColor Yellow
terraform apply -auto-approve -var="aws_profile=$Profile" -var="environment=$Environment"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Deployment successful!" -ForegroundColor Green
}
else {
    Write-Host "✗ Deployment failed. You may need to manually resolve conflicts." -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual options:" -ForegroundColor Cyan
    Write-Host "1. Delete existing resources in AWS Console"
    Write-Host "2. Use different resource names in variables"
    Write-Host "3. Import resources manually with terraform import"
}

# Return to original directory
Set-Location -Path (Join-Path $PSScriptRoot ".." "..")