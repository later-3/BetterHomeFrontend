#!/bin/bash

# DANGEROUS SCRIPT!
# This script will delete ALL files from the configured Directus instance.
# Please double-check your environment variables before running.
#
# USAGE:
# 1. Make sure you have set the environment variables:
#    export DIRECTUS_URL="http://your-directus-instance.com"
#    export DIRECTUS_TOKEN="your-secret-api-token"
# 2. Run the script: ./dangerously_delete_all_files.sh

# --- Configuration ---
: "${DIRECTUS_URL:="http://localhost:8055"}"

if [ -z "$DIRECTUS_TOKEN" ]; then
    echo "Error: Please set the DIRECTUS_TOKEN environment variable."
    exit 1
fi

ALL_FILES_TMP=$(mktemp)

# Cleanup temporary files on exit
trap 'rm -f "$ALL_FILES_TMP"' EXIT

# --- Dependency Check ---
if ! command -v curl &> /dev/null; then
    echo "Error: curl is not installed. Please install it to continue."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. Please install it to continue."
    echo "On macOS, you can run: brew install jq"
    exit 1
fi

# --- Step 1: Fetch all file IDs from Directus ---
echo "Fetching all file IDs from Directus..."
API_RESPONSE=$(curl --noproxy '*' -s -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/files?fields=id&limit=-1")

if [ $? -ne 0 ]; then
    echo "Error: curl command failed to fetch files from Directus."
    exit 1
fi

# Check for authentication errors or other API issues
if echo "$API_RESPONSE" | jq -e '.errors' &> /dev/null; then
    echo "Error: Received an error from the Directus API."
    echo "$API_RESPONSE" | jq '.errors'
    exit 1
fi

echo "$API_RESPONSE" | jq -r '.data[].id' > "$ALL_FILES_TMP"
ALL_COUNT=$(wc -l < "$ALL_FILES_TMP")

if [ "$ALL_COUNT" -eq 0 ]; then
    echo "No files found in Directus to delete."
    exit 0
fi

# --- Step 2: Confirmation Step ---
echo ""

echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
echo "                          DANGER ZONE                         "
echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"

echo "This script is about to permanently delete $ALL_COUNT files from Directus at $DIRECTUS_URL"
echo "This action CANNOT be undone."
echo ""

read -p "Are you absolutely sure you want to proceed? (yes/no): " CONFIRM

# --- Step 3: Deletion Step ---
if [ "$CONFIRM" = "yes" ]; then
    echo ""
    echo "Starting deletion process..."
    while read -r file_id; do
        if [ -n "$file_id" ]; then
            echo "Deleting file: $file_id"
            curl --noproxy '*' -s -X DELETE -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/files/$file_id"
        fi
    done < "$ALL_FILES_TMP"
    echo ""
    echo "Deletion process finished."
else
    echo ""
    echo "Deletion cancelled. No files were deleted."
fi
