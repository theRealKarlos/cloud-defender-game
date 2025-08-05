#!/bin/bash

# Build script for Cloud Defenders Backend
# Creates a lean deployment package for AWS Lambda
# Linux-compatible version for CI/CD pipelines

set -e  # Exit on any error

echo "Building Cloud Defenders Backend..."

# Determine project root and set paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

BACKEND_DIR="$PROJECT_ROOT/backend"
DIST_DIR="$PROJECT_ROOT/dist"
STAGING_DIR="$DIST_DIR/backend_staging"
OUTPUT_ZIP="$DIST_DIR/score_api.zip"

# Step 1: Clean previous build artifacts
echo "Cleaning previous build artifacts..."
if [ -d "$DIST_DIR" ]; then
    rm -rf "$DIST_DIR"
    echo "   Removed existing dist directory"
fi
if [ -f "$OUTPUT_ZIP" ]; then
    rm -f "$OUTPUT_ZIP"
    echo "   Removed existing zip file"
fi

# Step 2: Create distribution directory
echo "Creating distribution directory..."
mkdir -p "$DIST_DIR"
mkdir -p "$STAGING_DIR"

# Step 3: Copy source files
echo "Copying source files..."
cp "$BACKEND_DIR/index.js" "$STAGING_DIR/"
cp -r "$BACKEND_DIR/src" "$STAGING_DIR/"
cp "$BACKEND_DIR/package.json" "$STAGING_DIR/"

# Step 4: Install production dependencies only
echo "Installing dependencies..."
cd "$STAGING_DIR"
if ! npm install --omit=dev --silent; then
    echo "Failed to install dependencies"
    exit 1
fi
echo "   Dependencies installed successfully"

# Step 4.5: Remove unnecessary files from deployment package
echo "Removing unnecessary files..."
files_to_remove=("package.json" "package-lock.json")
for file in "${files_to_remove[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        echo "   Removed $file"
    fi
done

# Step 5: Create deployment package
echo "Creating deployment package..."
cd "$STAGING_DIR"

# Create zip file (requires zip command - available on Ubuntu CI runners)
if ! zip -r "$OUTPUT_ZIP" . -q; then
    echo "Failed to create zip file"
    echo "Note: This script requires the 'zip' command, which is available on Ubuntu CI runners"
    echo "For local development on Windows, use the PowerShell build script instead"
    exit 1
fi

# Calculate and display package size
zip_size=$(stat -c%s "$OUTPUT_ZIP" 2>/dev/null || stat -f%z "$OUTPUT_ZIP" 2>/dev/null || echo "0")
size_mb=$(echo "scale=2; $zip_size / 1024 / 1024" | bc 2>/dev/null || echo "0")
echo "   Package created: $OUTPUT_ZIP ($size_mb MB)"

# Step 6: Clean up staging directory
echo "Cleaning up staging directory..."
rm -rf "$STAGING_DIR"

# Step 7: Display build summary
echo "Build completed successfully!"
echo "Deployment package: $OUTPUT_ZIP"
echo "Package size: $size_mb MB"
echo "Ready for deployment!" 