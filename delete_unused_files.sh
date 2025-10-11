#!/bin/bash

# Shell script to delete unused files from Directus
#
# REQUIRED TOOLS: curl, jq
#
# USAGE:
# 1. Make sure you have set the environment variables:
#    export DIRECTUS_URL="http://your-directus-instance.com"
#    export DIRECTUS_TOKEN="your-secret-api-token"
# 2. Run the script: ./delete_unused_files.sh

# --- Configuration ---
# Using environment variables for security. Default URL is set for convenience.
: "${DIRECTUS_URL:="http://localhost:8055"}"

if [ -z "$DIRECTUS_TOKEN" ]; then
    echo "Error: Please set the DIRECTUS_TOKEN environment variable."
    exit 1
fi

USED_IDS_FILE="used_files_ids.txt"
ALL_FILES_TMP=$(mktemp)
USED_FILES_TMP=$(mktemp)
UNUSED_FILES_TMP=$(mktemp)

# Cleanup temporary files on exit
trap 'rm -f "$ALL_FILES_TMP" "$USED_FILES_TMP" "$UNUSED_FILES_TMP"' EXIT

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

echo "$API_RESPONSE" | jq -r '.data[].id' | sort > "$ALL_FILES_TMP"
ALL_COUNT=$(wc -l < "$ALL_FILES_TMP")
echo "Found $ALL_COUNT total files in Directus."

# --- Step 2: Prepare used file IDs ---
if [ ! -f "$USED_IDS_FILE" ]; then
    echo "Error: The file '$USED_IDS_FILE' was not found."
    exit 1
fi
sort "$USED_IDS_FILE" > "$USED_FILES_TMP"
USED_COUNT=$(wc -l < "$USED_FILES_TMP")
echo "Found $USED_COUNT used file IDs."

# --- Step 3: Determine which files are unused ---
# comm -23 shows lines unique to the first file
comm -23 "$ALL_FILES_TMP" "$USED_FILES_TMP" > "$UNUSED_FILES_TMP"
UNUSED_COUNT=$(wc -l < "$UNUSED_FILES_TMP")

if [ "$UNUSED_COUNT" -eq 0 ]; then
    echo "No unused files to delete. Everything is up to date."
    exit 0
fi

# --- Step 4: Confirmation Step ---
echo ""
echo "--- Files to be Deleted ---"
cat "$UNUSED_FILES_TMP"
echo "--------------------------"
echo "Total files to delete: $UNUSED_COUNT"
echo ""

read -p "Are you sure you want to delete these files? (yes/no): " CONFIRM

# --- Step 5: Deletion Step ---
if [ "$CONFIRM" = "yes" ]; then
    echo ""
    echo "Starting deletion process..."
    while read -r file_id; do
        if [ -n "$file_id" ]; then
            echo "Deleting file: $file_id"
            curl --noproxy '*' -s -X DELETE -H "Authorization: Bearer $DIRECTUS_TOKEN" "$DIRECTUS_URL/files/$file_id"
        fi
    done < "$UNUSED_FILES_TMP"
    echo ""
    echo "Deletion process finished."
else
    echo ""
    echo "Deletion cancelled."
fi
