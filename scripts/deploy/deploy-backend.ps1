# Deploy Backend Components
# Consolidates Lambda and API Gateway deployment

param(
    [string]$Environment = "dev",
    [string]$Region = "eu-west-2",
    [switch]$LambdaOnly,
    [switch]$ApiOnly,
    [switch]$Force
)

Write-Host "Deploying Cloud Defenders Backend Components..." -ForegroundColor Green

# Validate parameters
if ($LambdaOnly -and $ApiOnly) {
    Write-Host "Error: Cannot specify both LambdaOnly and ApiOnly" -ForegroundColor Red
    exit 1
}

# Build the backend package first
Write-Host "Building backend deployment package..." -ForegroundColor Yellow
$buildScript = Join-Path $PSScriptRoot "..\build\build-backend.ps1"
& $buildScript -Environment $Environment

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend build failed!" -ForegroundColor Red
    exit 1
}

# Deploy Lambda function
if (-not $ApiOnly) {
    Write-Host "Deploying Lambda function..." -ForegroundColor Yellow
    
    $lambdaFunctionName = "cloud-defenders-$Environment-score-api"
    $zipPath = Join-Path $PSScriptRoot "..\..\dist\score_api.zip"
    
    if (-not (Test-Path $zipPath)) {
        Write-Host "Error: Deployment package not found at $zipPath" -ForegroundColor Red
        exit 1
    }
    
    try {
        aws lambda update-function-code `
            --function-name $lambdaFunctionName `
            --zip-file "fileb://$zipPath" `
            --region $Region
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Lambda function updated successfully" -ForegroundColor Green
        } else {
            Write-Host "Lambda deployment failed!" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "Error deploying Lambda: $_" -ForegroundColor Red
        exit 1
    }
}

# Deploy API Gateway
if (-not $LambdaOnly) {
    Write-Host "Deploying API Gateway..." -ForegroundColor Yellow
    
    try {
        # Get the API Gateway ID
        $apiName = "cloud-defenders-$Environment-api"
        $apiId = aws apigateway get-rest-apis --query "items[?name=='$apiName'].id" --output text --region $Region
        
        if (-not $apiId) {
            Write-Host "Error: API Gateway '$apiName' not found" -ForegroundColor Red
            exit 1
        }
        
        # Create deployment
        $deploymentId = aws apigateway create-deployment `
            --rest-api-id $apiId `
            --stage-name $Environment `
            --region $Region `
            --query 'id' `
            --output text
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "API Gateway deployed successfully (Deployment ID: $deploymentId)" -ForegroundColor Green
        } else {
            Write-Host "API Gateway deployment failed!" -ForegroundColor Red
            exit 1
        }
    }
    catch {
        Write-Host "Error deploying API Gateway: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Backend deployment completed successfully!" -ForegroundColor Green

# Display endpoints
if (-not $LambdaOnly) {
    Write-Host "`nAPI Endpoints:" -ForegroundColor Cyan
    Write-Host "  Base URL: https://$apiId.execute-api.$Region.amazonaws.com/$Environment" -ForegroundColor White
    Write-Host "  Submit Score: POST /api/scores" -ForegroundColor White
    Write-Host "  Leaderboard: GET /api/leaderboard" -ForegroundColor White
} 