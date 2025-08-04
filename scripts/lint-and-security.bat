@echo off
REM Batch wrapper for lint-and-security.ps1

echo Running lint and security checks...
powershell -ExecutionPolicy Bypass -File "%~dp0lint-and-security.ps1" %*

if %ERRORLEVEL% neq 0 (
    echo.
    echo Failed with exit code %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo All checks completed successfully!
pause