@echo off
REM Cloud Defenders Game - Development Environment Setup (Batch Wrapper)
REM This batch file runs the PowerShell setup script with proper execution policy

echo 🎮 Cloud Defenders - Development Environment Setup
echo =================================================

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PowerShell is not available on this system
    echo Please install PowerShell and try again
    pause
    exit /b 1
)

REM Run the PowerShell script with bypass execution policy
echo Running PowerShell setup script...
powershell -ExecutionPolicy Bypass -File "%~dp0setup-dev-env.ps1" %*

if %errorlevel% neq 0 (
    echo ❌ Setup script failed
    pause
    exit /b 1
)

echo ✅ Setup completed successfully
pause