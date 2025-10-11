#!/bin/bash

# Shell script to download all files listed in used_files_ids.txt from Directus.
#
# USAGE:
# 1. Make sure you have set the environment variable for the Directus URL:
#    export DIRECTUS_URL="http://your-directus-instance.com"
# 2. Run the script: ./download_used_files.sh

# --- Configuration ---
# Use environment variable for URL, with a default for convenience.
: "${DIRECTUS_URL:="http://localhost:8055"}"

USED_IDS_FILE="used_files_ids.txt"
DOWNLOAD_DIR="downloaded_assets"

# --- Dependency Check ---
if ! command -v curl &> /dev/null; then
    echo "Error: curl is not installed. Please install it to continue."
    exit 1
fi

# --- Main Logic ---
if [ ! -f "$USED_IDS_FILE" ]; then
    echo "Error: The file '$USED_IDS_FILE' was not found."
    exit 1
fi

# Create download directory if it doesn't exist
mkdir -p "$DOWNLOAD_DIR"
echo "Files will be downloaded to the '$DOWNLOAD_DIR' directory."
echo ""

# Read each line from the file and download the asset
while IFS= read -r file_id || [[ -n "$file_id" ]]; do
    # Skip empty lines
    if [ -z "$file_id" ]; then
        continue
    fi

    # Construct the asset URL. Appending "?download" encourages the server
    # to send the Content-Disposition header needed for the original filename.
    ASSET_URL="$DIRECTUS_URL/assets/$file_id?download"

    echo "Downloading asset: $file_id"
    
    # Use curl to download the file.
    # -L: Follow redirects.
    # -J: Use the Content-Disposition header for the filename.
    # -O: Save the file with the name determined by the server.
    # We change into the download directory to ensure files are saved there.
    (cd "$DOWNLOAD_DIR" && curl --noproxy '*' -L -J -O "$ASSET_URL")

done < "$USED_IDS_FILE"

echo ""
echo "Download process finished."
