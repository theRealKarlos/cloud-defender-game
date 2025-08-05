#!/bin/bash

# Health check script for deployed services
# Linux-compatible version for CI/CD pipelines
#
# Performs health checks on frontend and backend services to verify deployment success.
# This script is designed to be called from GitHub Actions workflows.
#
# Usage:
#   bash scripts/health-check.sh [--frontend-url URL] [--backend-url URL] [--timeout SECONDS]
#
# Example:
#   bash scripts/health-check.sh --frontend-url "https://example.com" --backend-url "https://api.example.com"

set -e  # Exit on any error

# Default values
FRONTEND_URL=""
BACKEND_URL=""
TIMEOUT=30

# Function to display usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  --frontend-url URL    URL of the frontend service to check"
    echo "  --backend-url URL     URL of the backend service to check"
    echo "  --timeout SECONDS     Timeout in seconds for health check requests (default: 30)"
    echo "  -h, --help           Show this help message"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend-url)
            FRONTEND_URL="$2"
            shift 2
            ;;
        --backend-url)
            BACKEND_URL="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Function to perform health check
test_service_health() {
    local url="$1"
    local service_name="$2"
    local health_endpoint="$3"
    
    if [ -z "$url" ]; then
        echo "⚠️  $service_name URL not provided, skipping health check"
        return 0
    fi
    
    local full_url
    if [ -n "$health_endpoint" ]; then
        full_url="${url}${health_endpoint}"
    else
        full_url="$url"
    fi
    
    echo "🔍 Checking $service_name health at: $full_url"
    
    # Use curl for HTTP requests
    if curl -f -s --max-time "$TIMEOUT" "$full_url" > /dev/null 2>&1; then
        echo "✅ $service_name health check passed"
        return 0
    else
        echo "❌ $service_name health check failed"
        return 1
    fi
}

# Main execution
echo "🏥 Starting health checks..."
overall_success=true

# Frontend health check
if [ -n "$FRONTEND_URL" ]; then
    if ! test_service_health "$FRONTEND_URL" "Frontend"; then
        overall_success=false
    fi
fi

# Backend health check
if [ -n "$BACKEND_URL" ]; then
    if ! test_service_health "$BACKEND_URL" "Backend" "/health"; then
        overall_success=false
    fi
fi

if [ "$overall_success" = true ]; then
    echo "🎉 All health checks passed!"
    exit 0
else
    echo "💀 Some health checks failed!"
    exit 1
fi 