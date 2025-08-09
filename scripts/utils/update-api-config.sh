#!/bin/bash

# Update frontend/js/config.js baseUrl from Terraform output (Linux/CI friendly)
# Usage: scripts/utils/update-api-config.sh [ENVIRONMENT]
# ENVIRONMENT defaults to value in infra/variables.tf (dev) unless provided

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
INFRA_DIR="$PROJECT_ROOT/infra"
FRONTEND_CONFIG="$PROJECT_ROOT/frontend/config.json"

ENVIRONMENT="${1:-}" # optional positional arg

echo "Generating API configuration in frontend/config.json..."

pushd "$INFRA_DIR" >/dev/null

# If ENVIRONMENT provided, ensure terraform init/apply was run for that env (backend key not required here)
API_URL=$(terraform output -raw api_gateway_url)

popd >/dev/null

echo "Found API URL: $API_URL"

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


