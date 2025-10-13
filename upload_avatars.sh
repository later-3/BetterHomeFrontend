#!/bin/bash

# Script to upload 20 random avatars to a Directus instance.
#
# USAGE:
# 1. Make sure you have set the environment variables:
#    export DIRECTUS_URL="http://your-directus-instance.com"
#    export DIRECTUS_TOKEN="your-secret-api-token"
# 2. Run the script: ./upload_avatars.sh

# --- Configuration ---
: "${DIRECTUS_URL:=http://localhost:8055}"

if [ -z "$DIRECTUS_TOKEN" ]; then
    echo "Error: Please set the DIRECTUS_TOKEN environment variable."
    exit 1
fi

AVATAR_SOURCE_DIR="random_avatars"
NUMBER_TO_UPLOAD=20

# --- Dependency Check ---
if ! command -v curl &> /dev/null; then
    echo "Error: curl is not installed. Please install it to continue."
    exit 1
fi

# --- Main Logic ---
if [ ! -d "$AVATAR_SOURCE_DIR" ]; then
    echo "Error: Source directory '$AVATAR_SOURCE_DIR' not found."
    exit 1
fi

# Find files, shuffle them, and take the top N
# Using find is safer than ls for filenames with spaces or special characters
FILES_TO_UPLOAD=$(find "$AVATAR_SOURCE_DIR" -type f | head -n "$NUMBER_TO_UPLOAD")

if [ -z "$FILES_TO_UPLOAD" ]; then
    echo "No files found in '$AVATAR_SOURCE_DIR' to upload."
    exit 1
fi

echo "Starting upload of $NUMBER_TO_UPLOAD random avatars..."
echo ""

COUNT=0
for file_path in $FILES_TO_UPLOAD; do
    COUNT=$((COUNT+1))
    echo "($COUNT/$NUMBER_TO_UPLOAD) Uploading: $file_path"
    
    # The -F flag sends a multipart/form-data POST request.
    # The server's JSON response will be printed to the console.
    curl --noproxy '*' -s -X POST \
         -H "Authorization: Bearer $DIRECTUS_TOKEN" \
         -F "file=@$file_path" \
         "$DIRECTUS_URL/files"
    echo ""
    echo "----------------------------------------"
done

echo "Upload script finished."