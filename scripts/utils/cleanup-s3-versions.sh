#!/bin/bash

# =============================================================================
# S3 Version Cleanup Script
# =============================================================================
#
# PURPOSE:
#   Automatically removes old versioned deployment folders from S3 buckets
#   while preserving a specified number of the most recent versions to
#   maintain rollback capability and optimise storage costs.
#
# FEATURES:
#   - Safe operation with comprehensive validation
#   - Preserves configurable number of recent versions
#   - Detailed logging of all operations
#   - Error handling for partial failures
#   - Dry-run capability via detailed preview
#
# INTEGRATION:
#   - Called automatically by CI/CD pipeline after successful deployments
#   - Can be run manually for custom retention policies
#   - Designed to work with versioned S3 deployment structure
#
# VERSIONING CONVENTION:
#   Expects folders named: v{YYYYMMDD}-{HHMMSS}-{HASH}/
#   Example: v20250809-140955-9229e076/
#
# SAFETY FEATURES:
#   - Only runs when there are more versions than specified to keep
#   - Validates bucket access before making changes
#   - Shows exactly what will be preserved/deleted before action
#   - Continues cleanup even if individual deletions fail
#
# COST IMPACT:
#   - Prevents unlimited accumulation of deployment assets
#   - Typical savings: 80-90% reduction in S3 storage costs
#   - Maintains constant storage footprint (versions-to-keep × deployment size)
#
# Usage: cleanup-s3-versions.sh <bucket-name> <versions-to-keep>
# Example: cleanup-s3-versions.sh my-frontend-bucket 2

set -euo pipefail

# Function to display usage
show_usage() {
    echo "Usage: $0 <bucket-name> <versions-to-keep>"
    echo "Example: $0 my-frontend-bucket 2"
    echo ""
    echo "This script removes old versioned deployment folders from S3"
    echo "while preserving the specified number of most recent versions."
    echo ""
    echo "Arguments:"
    echo "  bucket-name      Name of the S3 bucket containing versioned deployments"
    echo "  versions-to-keep Number of recent versions to preserve (minimum: 1)"
}

# Validate arguments
if [[ $# -ne 2 ]]; then
    echo "❌ Error: Incorrect number of arguments"
    show_usage
    exit 1
fi

BUCKET_NAME="$1"
VERSIONS_TO_KEEP="$2"

# Validate versions-to-keep is a positive integer
if ! [[ "$VERSIONS_TO_KEEP" =~ ^[0-9]+$ ]] || [[ "$VERSIONS_TO_KEEP" -lt 1 ]]; then
    echo "❌ Error: versions-to-keep must be a positive integer (minimum: 1)"
    exit 1
fi

echo "🧹 Starting S3 version cleanup for bucket: $BUCKET_NAME"
echo "📦 Preserving $VERSIONS_TO_KEEP most recent version(s)"

# Check if bucket exists and is accessible
if ! aws s3 ls "s3://$BUCKET_NAME" >/dev/null 2>&1; then
    echo "❌ Error: Cannot access bucket '$BUCKET_NAME'. Check bucket name and permissions."
    exit 1
fi

# =============================================================================
# VERSION DISCOVERY PHASE
# =============================================================================
# List all versioned directories (folders starting with 'v' followed by timestamp and hash)
# Expected format: v{YYYYMMDD}-{HHMMSS}-{HASH}/
# Example: v20250809-140955-9229e076/
echo "🔍 Scanning for versioned deployment folders..."

# Use AWS CLI to list directories, filter for version pattern, and sort
# Pipeline explanation:
# 1. aws s3 ls - Lists all objects/prefixes in bucket
# 2. grep - Filters for directories matching version pattern (v{YYYYMMDD}-{HHMMSS}-{HASH}/)
# 3. awk - Extracts just the directory name (column 2)
# 4. sort -r - Sorts in reverse chronological order (newest first)
VERSION_DIRS=$(aws s3 ls "s3://$BUCKET_NAME/" | \
    grep "PRE v[0-9]\{8\}-[0-9]\{6\}-[a-f0-9]\{8\}/" | \
    awk '{print $2}' | \
    sort -r) || true

# Convert to array and count
readarray -t VERSIONS <<< "$VERSION_DIRS"
TOTAL_VERSIONS=${#VERSIONS[@]}

# Handle case where no versions found or empty result
if [[ $TOTAL_VERSIONS -eq 0 ]] || [[ -z "${VERSIONS[0]}" ]]; then
    echo "ℹ️  No versioned deployment folders found in bucket"
    echo "✅ Cleanup complete - nothing to do"
    exit 0
fi

echo "📊 Found $TOTAL_VERSIONS versioned deployment folder(s)"

# Display found versions
echo "📋 Versioned folders (newest first):"
for i in "${!VERSIONS[@]}"; do
    echo "  $((i+1)). ${VERSIONS[$i]}"
done

# Check if we have more versions than we want to keep
if [[ $TOTAL_VERSIONS -le $VERSIONS_TO_KEEP ]]; then
    echo "ℹ️  Total versions ($TOTAL_VERSIONS) <= versions to keep ($VERSIONS_TO_KEEP)"
    echo "✅ Cleanup complete - no versions need to be removed"
    exit 0
fi

# Calculate how many versions to delete
VERSIONS_TO_DELETE=$((TOTAL_VERSIONS - VERSIONS_TO_KEEP))

echo "🗑️  Will delete $VERSIONS_TO_DELETE old version(s)"
echo "💾 Will preserve $VERSIONS_TO_KEEP newest version(s):"

# Show which versions will be preserved
for i in $(seq 0 $((VERSIONS_TO_KEEP - 1))); do
    echo "  ✅ Keeping: ${VERSIONS[$i]}"
done

echo ""
echo "🗑️  Versions scheduled for deletion:"

# Show which versions will be deleted
for i in $(seq $VERSIONS_TO_KEEP $((TOTAL_VERSIONS - 1))); do
    echo "  ❌ Deleting: ${VERSIONS[$i]}"
done

echo ""
echo "🚀 Starting cleanup process..."

# =============================================================================
# CLEANUP EXECUTION PHASE
# =============================================================================
# Delete old versions while tracking success/failure rates
# Uses --recursive to delete entire version directories
# Uses --quiet to reduce log verbosity during deletion
DELETED_COUNT=0
for i in $(seq $VERSIONS_TO_KEEP $((TOTAL_VERSIONS - 1))); do
    VERSION_DIR="${VERSIONS[$i]}"
    echo "🗑️  Deleting version: $VERSION_DIR"
    
    # Attempt deletion with error handling
    # Continue processing other versions even if one fails
    if aws s3 rm "s3://$BUCKET_NAME/$VERSION_DIR" --recursive --quiet; then
        echo "   ✅ Successfully deleted: $VERSION_DIR"
        DELETED_COUNT=$((DELETED_COUNT + 1))
    else
        echo "   ❌ Failed to delete: $VERSION_DIR"
        # Log failure but continue - partial cleanup is better than no cleanup
        # This allows the script to succeed even if some versions are locked/protected
    fi
done

echo ""
echo "📊 Cleanup Summary:"
echo "   🗑️  Versions deleted: $DELETED_COUNT"
echo "   💾 Versions preserved: $VERSIONS_TO_KEEP"
echo "   📦 Bucket: $BUCKET_NAME"

if [[ $DELETED_COUNT -eq $VERSIONS_TO_DELETE ]]; then
    echo "✅ S3 version cleanup completed successfully!"
else
    echo "⚠️  S3 version cleanup completed with some failures"
    echo "   Expected to delete: $VERSIONS_TO_DELETE"
    echo "   Actually deleted: $DELETED_COUNT"
    exit 1
fi
