#!/bin/bash

# Sync finance-related Directus collections from local (UUID schema) to remote.
# Steps:
#   1. Delete remote collections (billings, billing_payments, expenses, incomes, salary_records, employees).
#   2. Snapshot the local collections into a JSON file.
#   3. Copy the snapshot to the remote server via scp.
#
# Required environment variables:
#   REMOTE_DIRECTUS_TOKEN  - Admin token for https://www.betterhome.ink
#   LOCAL_DIRECTUS_TOKEN   - Admin token for http://localhost:8055 (or override LOCAL_DIRECTUS_URL)
#
# Optional environment overrides:
#   REMOTE_DIRECTUS_URL    - Defaults to https://www.betterhome.ink
#   LOCAL_DIRECTUS_URL     - Defaults to http://localhost:8055
#   FINANCE_SCHEMA_FILE    - Defaults to tmp/finance-schema-local.json
#   SYNC_SSH_KEY           - Defaults to $HOME/Downloads/BetterHomeKey.pem
#   SYNC_SSH_HOST          - Defaults to ubuntu@139.155.26.118
#   SYNC_SSH_PATH          - Defaults to /home/ubuntu/

set -euo pipefail
IFS=$'\n\t'

TABLES=(billings billing_payments expenses incomes salary_records employees)

REMOTE_URL="${REMOTE_DIRECTUS_URL:-https://www.betterhome.ink}"
DEFAULT_TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"

REMOTE_TOKEN="${REMOTE_DIRECTUS_TOKEN:-$DEFAULT_TOKEN}"

LOCAL_URL="${LOCAL_DIRECTUS_URL:-http://localhost:8055}"
LOCAL_TOKEN="${LOCAL_DIRECTUS_TOKEN:-$DEFAULT_TOKEN}"

OUTPUT_FILE="${FINANCE_SCHEMA_FILE:-tmp/finance-schema-local.json}"
OUTPUT_DIR="$(dirname "$OUTPUT_FILE")"

SSH_KEY="${SYNC_SSH_KEY:-$HOME/Downloads/BetterHomeKey.pem}"
SSH_HOST="${SYNC_SSH_HOST:-ubuntu@139.155.26.118}"
SSH_PATH="${SYNC_SSH_PATH:-/home/ubuntu/}"

mkdir -p "$OUTPUT_DIR"

echo "==> Deleting remote finance collections on ${REMOTE_URL}"
for collection in "${TABLES[@]}"; do
  printf '   - %s ... ' "$collection"
  status_code=$(curl --noproxy '*' -s -o /dev/null -w "%{http_code}" \
    -X DELETE "${REMOTE_URL}/collections/${collection}" \
    -H "Authorization: Bearer ${REMOTE_TOKEN}" \
    -H "Content-Type: application/json")

  case "$status_code" in
    204|200)
      echo "deleted"
      ;;
    404)
      echo "not present (skipped)"
      ;;
    *)
      echo "failed (HTTP ${status_code})"
      exit 1
      ;;
  esac
done

echo ""
echo "==> Snapshotting local collections from ${LOCAL_URL}"
NPX_OPTS="${NPX_OPTS:---yes}"

if [[ -n "${DIRECTUS_CLI:-}" ]]; then
  IFS=' ' read -r -a DIRECTUS_CLI_CMD <<< "${DIRECTUS_CLI}"
  DIRECTUS_CLI_STR="${DIRECTUS_CLI}"
else
  DIRECTUS_CLI_CMD=(npx ${NPX_OPTS} directus)
  DIRECTUS_CLI_STR="npx ${NPX_OPTS} directus"
fi

"${DIRECTUS_CLI_CMD[@]}" schema snapshot \
  --url "${LOCAL_URL}" \
  --token "${LOCAL_TOKEN}" \
  --collections "$(IFS=,; echo "${TABLES[*]}")" \
  --file "${OUTPUT_FILE}"

echo ""
echo "==> Copying snapshot to ${SSH_HOST}:${SSH_PATH}"
scp -i "${SSH_KEY}" "${OUTPUT_FILE}" "${SSH_HOST}:${SSH_PATH}"

echo ""
cat <<INSTRUCTIONS
✅ Done.

Next steps to apply on remote (run on your machine):
  1. SSH to the server: ssh -i "${SSH_KEY}" ${SSH_HOST}
  2. Apply the schema snapshot:
       ${DIRECTUS_CLI_STR} schema apply \\
         --url "${REMOTE_URL}" \\
         --token "${REMOTE_TOKEN}" \\
         ${SSH_PATH%/}/$(basename "${OUTPUT_FILE}")
     (override --token if you rotate credentials)

After apply, double-check the collections via Directus admin UI or API.

💡 If your Directus CLI runs inside Docker, rerun this script with:
     DIRECTUS_CLI="docker compose exec directus npx --yes directus" bash scripts/reset-remote-finance-schema.sh
INSTRUCTIONS
