# Deploy Backend Components
# Consolidates Lambda and API Gateway deployment

param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Profile,
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
& $buildScript

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
        $awsArgs = @(
            "lambda", "update-function-code",
            "--function-name", $lambdaFunctionName,
            "--zip-file", "fileb://$zipPath",
            "--region", $Region,
            "--profile", $Profile
        )
        
        aws @awsArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Lambda function updated successfully" -ForegroundColor Green
            
            # Publish an immutable version and move alias atomically
            Write-Host "Publishing new Lambda version..." -ForegroundColor Yellow
            $publishArgs = @(
                "lambda", "publish-version",
                "--function-name", $lambdaFunctionName,
                "--description", "CI $(Get-Date -Format o)",
                "--region", $Region,
                "--profile", $Profile
            )
            $publishJson = aws @publishArgs
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Failed to publish Lambda version" -ForegroundColor Red
                exit 1
            }
            $newVersion = ($publishJson | ConvertFrom-Json).Version
            Write-Host "Published version: $newVersion" -ForegroundColor Green

            # Capture current alias version (for potential rollback)
            Write-Host "Fetching current 'live' alias version..." -ForegroundColor Yellow
            $getAliasArgs = @(
                "lambda", "get-alias",
                "--function-name", $lambdaFunctionName,
                "--name", "live",
                "--region", $Region,
                "--profile", $Profile
            )
            $aliasJson = aws @getAliasArgs 2>$null
            $prevVersion = if ($LASTEXITCODE -eq 0 -and $aliasJson) { ($aliasJson | ConvertFrom-Json).FunctionVersion } else { "$LATEST" }
            Write-Host "Previous alias version: $prevVersion" -ForegroundColor Cyan

            # Move alias to the new version
            Write-Host "Updating 'live' alias to version $newVersion..." -ForegroundColor Yellow
            $updateAliasArgs = @(
                "lambda", "update-alias",
                "--function-name", $lambdaFunctionName,
                "--name", "live",
                "--function-version", $newVersion,
                "--region", $Region,
                "--profile", $Profile
            )
            aws @updateAliasArgs
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Failed to update alias to version $newVersion" -ForegroundColor Red
                exit 1
            }
            Write-Host "Alias 'live' now points to version $newVersion" -ForegroundColor Green
        }
        else {
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
        # Get the API Gateway v2 ID
        $apiName = "cloud-defenders-$Environment-api"
        $getApiArgs = @(
            "apigatewayv2", "get-apis",
            "--query", "Items[?Name=='$apiName'].ApiId",
            "--output", "text",
            "--region", $Region,
            "--profile", $Profile
        )
        
        Write-Host "Searching for API Gateway: $apiName" -ForegroundColor Yellow
        $apiId = aws @getApiArgs
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Error: AWS CLI command failed" -ForegroundColor Red
            exit 1
        }
        
        # Debug: Show what we got back
        Write-Host "Raw API ID result: '$apiId'" -ForegroundColor Yellow
        
        if ([string]::IsNullOrWhiteSpace($apiId) -or $apiId -eq "None") {
            Write-Host "Error: API Gateway v2 '$apiName' not found" -ForegroundColor Red
            Write-Host "Available APIs:" -ForegroundColor Yellow
            aws apigatewayv2 get-apis --query "items[].{Name:name,Id:apiId}" --output table --region $Region --profile $Profile
            exit 1
        }
        
        Write-Host "API Gateway v2 found with ID: $apiId" -ForegroundColor Green
        Write-Host "Note: HTTP API deployments are automatic with auto_deploy=true" -ForegroundColor Cyan
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