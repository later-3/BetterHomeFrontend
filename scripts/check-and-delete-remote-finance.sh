#!/bin/bash

# Check finance-related collections on the remote Directus instance and delete them if present.
# If all target collections are already absent, the script exits without making changes.
#
# Collections covered:
#   billings, billing_payments, expenses, incomes, salary_records, employees
#
# Optional environment overrides:
#   REMOTE_DIRECTUS_URL   - Base URL of the Directus instance (default: https://www.betterhome.ink)
#   REMOTE_DIRECTUS_TOKEN - Admin token; defaults to the known finance token if unset.

set -euo pipefail
IFS=$'\n\t'

TABLES=(billings billing_payments expenses incomes salary_records employees)

REMOTE_URL="${REMOTE_DIRECTUS_URL:-https://www.betterhome.ink}"
REMOTE_TOKEN="${REMOTE_DIRECTUS_TOKEN:-sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n}"

echo "==> Inspecting remote collections via directus_collections on ${REMOTE_URL}"

raw_response=$(curl --noproxy '*' -s \
  -w '\n%{http_code}' \
  -H "Authorization: Bearer ${REMOTE_TOKEN}" \
  -H "Content-Type: application/json" \
  "${REMOTE_URL}/items/directus_collections?limit=-1")

http_status=${raw_response##*$'\n'}
json_body=${raw_response%$'\n'$http_status}

if [[ "$http_status" != "200" ]]; then
  echo "❌ Failed to inspect collections (HTTP ${http_status})"
  echo "Response: ${json_body}"
  exit 1
fi

all_collections=$(printf '%s\n' "$json_body" | jq -r '.data[].collection' | awk 'NF')
declare -a existing=()

if [[ -n "${all_collections:-}" ]]; then
  mapfile -t all_list <<< "$all_collections"
  for name in "${all_list[@]}"; do
    for target in "${TABLES[@]}"; do
      if [[ "$name" == "$target" ]]; then
        existing+=("$name")
        break
      fi
    done
  done
fi

if [[ ${#existing[@]} -eq 0 ]]; then
  echo "✅ All target collections are already deleted. Nothing to do."
  exit 0
fi

if [[ -z "${existing_names:-}" ]]; then
  echo "✅ All target collections are already deleted. Nothing to do."
  exit 0
fi

mapfile -t existing <<< "$existing_names"

echo "➡️  Collections detected: ${existing[*]}"
echo ""
echo "==> Deleting ${#existing[@]} collection(s)..."

for collection in "${existing[@]}"; do
  status_code=$(curl --noproxy '*' -s -o /dev/null -w "%{http_code}" \
    -X DELETE "${REMOTE_URL}/collections/${collection}" \
    -H "Authorization: Bearer ${REMOTE_TOKEN}" \
    -H "Content-Type: application/json")

  case "$status_code" in
    200|204)
      echo "   - ${collection}: deleted"
      ;;
    404)
      echo "   - ${collection}: already gone (skipped)"
      ;;
    *)
      echo "   - ${collection}: delete failed (HTTP ${status_code})"
      exit 1
      ;;
  esac
done

echo ""
echo "✅ Deletion complete."
