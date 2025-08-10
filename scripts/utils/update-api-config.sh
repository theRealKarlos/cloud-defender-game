#!/bin/bash

# Update frontend/config.json baseUrl from environment variable or Terraform output
# Usage: scripts/utils/update-api-config.sh [ENVIRONMENT]
# ENVIRONMENT defaults to value in infra/variables.tf (dev) unless provided
# 
# For CI/CD: Set API_GATEWAY_URL environment variable
# For local: Script will attempt to get URL from terraform output

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
INFRA_DIR="$PROJECT_ROOT/infra"
FRONTEND_CONFIG="$PROJECT_ROOT/frontend/config.json"

ENVIRONMENT="${1:-}" # optional positional arg

echo "Generating API configuration in frontend/config.json..."

# Check if API_GATEWAY_URL is provided as environment variable (CI/CD mode)
if [ -n "${API_GATEWAY_URL:-}" ]; then
    echo "Using API Gateway URL from environment variable: $API_GATEWAY_URL"
    API_URL="$API_GATEWAY_URL"
else
    echo "No API_GATEWAY_URL environment variable found, attempting to get from Terraform..."
    
    # Fallback to local Terraform execution (for local development)
    pushd "$INFRA_DIR" >/dev/null
    
    # If ENVIRONMENT provided, ensure terraform init/apply was run for that env (backend key not required here)
    API_URL=$(terraform output -raw api_gateway_url 2>/dev/null || echo "")
    
    popd >/dev/null
    
    if [ -z "$API_URL" ]; then
        echo "❌ Error: Could not retrieve API Gateway URL from Terraform"
        echo "   Make sure to run 'terraform apply' first, or set API_GATEWAY_URL environment variable"
        exit 1
    fi
    
    echo "Retrieved API URL from Terraform: $API_URL"
fi

# Generate config.json using cat and here document
cat > "$FRONTEND_CONFIG" << EOF
{
  "apiBaseUrl": "$API_URL",
  "timeout": 10000,
  "version": "1.0.0",
  "features": {
    "scoreValidation": true,
    "leaderboard": true,
    "realTimeUpdates": false
  }
}
EOF

echo "Generated config.json at $FRONTEND_CONFIG"
echo "API configuration updated successfully."


