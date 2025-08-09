#!/bin/bash

# Update frontend/js/config.js baseUrl from Terraform output (Linux/CI friendly)
# Usage: scripts/utils/update-api-config.sh [ENVIRONMENT]
# ENVIRONMENT defaults to value in infra/variables.tf (dev) unless provided

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
INFRA_DIR="$PROJECT_ROOT/infra"
FRONTEND_CONFIG="$PROJECT_ROOT/frontend/js/config.js"

ENVIRONMENT="${1:-}" # optional positional arg

echo "Updating API configuration in frontend/js/config.js..."

if [[ ! -f "$FRONTEND_CONFIG" ]]; then
  echo "config.js not found at $FRONTEND_CONFIG" >&2
  exit 1
fi

pushd "$INFRA_DIR" >/dev/null

# If ENVIRONMENT provided, ensure terraform init/apply was run for that env (backend key not required here)
API_URL=$(terraform output -raw api_gateway_url)

popd >/dev/null

echo "Found API URL: $API_URL"

# Replace baseUrl in config.js using sed (GNU sed on Ubuntu runners)
# We use '#' as a delimiter to avoid conflicts with '/' in the URL.
sed -i -E "s#baseUrl:\s*['\"][^'\"]*['\"]#baseUrl: '$API_URL'#" "$FRONTEND_CONFIG"

echo "Updated baseUrl in $FRONTEND_CONFIG"
echo "API configuration updated successfully."


