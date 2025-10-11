
import os
import requests

# --- Configuration ---
# It's recommended to set these as environment variables for security
DIRECTUS_URL = os.getenv('DIRECTUS_URL', 'http://localhost:8055')
DIRECTUS_TOKEN = os.getenv('DIRECTUS_TOKEN')
USED_IDS_FILE = 'used_files_ids.txt'

def get_all_file_ids():
    """Fetches all file IDs from the Directus API."""
    if not DIRECTUS_URL or not DIRECTUS_TOKEN:
        print("Error: Please set DIRECTUS_URL and DIRECTUS_TOKEN environment variables.")
        exit(1)

    headers = {'Authorization': f'Bearer {DIRECTUS_TOKEN}'}
    # Use limit=-1 to retrieve all files without pagination
    url = f'{DIRECTUS_URL}/files?fields=id&limit=-1'
    
    try:
        print(f"Fetching files from {url}")
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raises an exception for bad status codes (4xx or 5xx)
        files = response.json().get('data', [])
        return {file['id'] for file in files}
    except requests.exceptions.RequestException as e:
        print(f"Error fetching files from Directus: {e}")
        return None

def get_used_file_ids():
    """Reads the list of used file IDs from the local file."""
    try:
        with open(USED_IDS_FILE, 'r') as f:
            return {line.strip() for line in f if line.strip()}
    except FileNotFoundError:
        print(f"Error: The file '{USED_IDS_FILE}' was not found.")
        return None

def delete_files(file_ids):
    """Deletes the specified files from Directus."""
    headers = {'Authorization': f'Bearer {DIRECTUS_TOKEN}'}
    for file_id in file_ids:
        url = f'{DIRECTUS_URL}/files/{file_id}'
        try:
            response = requests.delete(url, headers=headers)
            if response.status_code == 204:
                print(f"Successfully deleted file: {file_id}")
            else:
                print(f"Failed to delete file: {file_id}. Status: {response.status_code}, Response: {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"Error deleting file {file_id}: {e}")

def main():
    """Main function to find and delete unused files."""
    print("Fetching all file IDs from Directus...")
    all_ids = get_all_file_ids()
    if all_ids is None:
        return

    print(f"Found {len(all_ids)} total files in Directus.")

    print(f"Reading used file IDs from '{USED_IDS_FILE}'...")
    used_ids = get_used_file_ids()
    if used_ids is None:
        return
        
    print(f"Found {len(used_ids)} used file IDs.")

    # Determine which files are unused
    unused_ids = all_ids - used_ids
    
    if not unused_ids:
        print("No unused files to delete. Everything is up to date.")
        return

    print("\n--- Files to be Deleted ---")
    for file_id in sorted(list(unused_ids)):
        print(file_id)
    print("--------------------------")
    print(f"Total files to delete: {len(unused_ids)}")

    # Confirmation step
    confirm = input("\nAre you sure you want to delete these files? (yes/no): ").lower()
    
    if confirm == 'yes':
        print("\nStarting deletion process...")
        delete_files(unused_ids)
        print("\nDeletion process finished.")
    else:
        print("\nDeletion cancelled.")

if __name__ == "__main__":
    main()
