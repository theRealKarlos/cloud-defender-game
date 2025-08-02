# ============================================================================
# FIX EXISTING RESOURCES SCRIPT
# ============================================================================
# This script handles existing resources by importing them into Terraform state

Write-Host "Fixing existing resource conflicts..." -ForegroundColor Green

# Change to infrastructure directory
Set-Location -Path "infra"

# Check if resources exist in state
$dynamoExists = terraform state show module.dynamodb.aws_dynamodb_table.scores 2>$null
$iamRoleExists = terraform state show module.lambda_function.aws_iam_role.lambda_role 2>$null
$logGroupExists = terraform state show module.lambda_function.aws_cloudwatch_log_group.lambda_logs 2>$null

if (-not $dynamoExists) {
    Write-Host "Importing existing DynamoDB table..." -ForegroundColor Yellow
    terraform import module.dynamodb.aws_dynamodb_table.scores cloud-defenders-dev-scores
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to import DynamoDB table. It may not exist or have a different name." -ForegroundColor Yellow
    }
}

if (-not $iamRoleExists) {
    Write-Host "Importing existing IAM role..." -ForegroundColor Yellow
    terraform import module.lambda_function.aws_iam_role.lambda_role cloud-defenders-dev-lambda-role
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to import IAM role. It may not exist or have a different name." -ForegroundColor Yellow
    }
}

if (-not $logGroupExists) {
    Write-Host "Importing existing CloudWatch Log Group..." -ForegroundColor Yellow
    terraform import module.lambda_function.aws_cloudwatch_log_group.lambda_logs "/aws/lambda/cloud-defenders-dev-score-api"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to import CloudWatch Log Group. It may not exist or have a different name." -ForegroundColor Yellow
    }
}

Write-Host "Attempting deployment..." -ForegroundColor Yellow
terraform apply -target=module.dynamodb -target=module.lambda_function -target=module.api_gateway

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Deployment successful!" -ForegroundColor Green
} else {
    Write-Host "✗ Deployment failed. You may need to manually resolve conflicts." -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual options:" -ForegroundColor Cyan
    Write-Host "1. Delete existing resources in AWS Console"
    Write-Host "2. Use different resource names in variables"
    Write-Host "3. Import resources manually with terraform import"
}

# Return to original directory
Set-Location -Path ".."