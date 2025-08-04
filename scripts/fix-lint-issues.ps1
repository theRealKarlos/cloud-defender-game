# Script to auto-fix common linting issues
Write-Host "Running ESLint auto-fix on frontend and backend..." -ForegroundColor Green

# Frontend linting
Write-Host ""
Write-Host "Frontend linting..." -ForegroundColor Cyan
Set-Location "frontend"

Write-Host "Applying automatic fixes..." -ForegroundColor Yellow
npm run lint:fix

if ($LASTEXITCODE -eq 0) {
    Write-Host "Frontend auto-fix completed successfully!" -ForegroundColor Green
    
    # Check if there are any remaining issues
    Write-Host "Checking for remaining issues..." -ForegroundColor Yellow
    npm run lint:check
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Frontend linting issues resolved!" -ForegroundColor Green
    }
    else {
        Write-Host "Frontend has issues requiring manual review" -ForegroundColor Yellow
    }
}
else {
    Write-Host "Frontend has issues requiring manual fixing" -ForegroundColor Yellow
    npm run lint:check
}

Set-Location ".."

# Backend linting
Write-Host ""
Write-Host "Backend linting..." -ForegroundColor Cyan
Set-Location "backend"

Write-Host "Applying automatic fixes..." -ForegroundColor Yellow
npx eslint . --fix

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend auto-fix completed successfully!" -ForegroundColor Green
    
    # Check if there are any remaining issues
    Write-Host "Checking for remaining issues..." -ForegroundColor Yellow
    npx eslint .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backend linting issues resolved!" -ForegroundColor Green
    }
    else {
        Write-Host "Backend has issues requiring manual review" -ForegroundColor Yellow
    }
}
else {
    Write-Host "Backend has issues requiring manual fixing" -ForegroundColor Yellow
    npx eslint .
}

Set-Location ".."

Write-Host ""
Write-Host "If manual fixes are needed:" -ForegroundColor Blue
Write-Host "  • Add underscore prefix to unused variables: 'unused' → '_unused'" -ForegroundColor White
Write-Host "  • Add underscore prefix to unused parameters: 'param' → '_param'" -ForegroundColor White
Write-Host "  • Consider extracting magic numbers to constants" -ForegroundColor White