#!/usr/bin/env bash
set -euo pipefail

DIRECTUS_URL="http://localhost:8055"
TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"
CSV_FILE="octet-stream.csv"

if [[ ! -f "$CSV_FILE" ]]; then
  echo "❌ 找不到 $CSV_FILE，请先生成该文件" >&2
  exit 1
fi

map_extension_to_mime() {
  local ext="$(printf '%s' "$1" | tr 'A-Z' 'a-z')"
  case "$ext" in
    mp4) echo "video/mp4" ;;
    mov) echo "video/quicktime" ;;
    mkv) echo "video/x-matroska" ;;
    avi) echo "video/x-msvideo" ;;
    webm) echo "video/webm" ;;
    *) echo "" ;;
  esac
}

while IFS="," read -r filename file_id; do
  [[ -n "$file_id" ]] || continue
  file_id=$(echo "$file_id" | tr -d '\r\n')
  filename=$(echo "$filename" | tr -d '\r\n')

  ext=${filename##*.}
  mime=$(map_extension_to_mime "$ext")

  if [[ -z "$mime" ]]; then
    echo "跳过 $filename (未知 MIME)"
    continue
  fi

  echo "修复 $filename ($file_id) -> $mime"
  payload=$(jq -n --arg type "$mime" --arg title "$filename" '{ type: $type, title: $title }')

  curl --silent --show-error --fail-with-body --noproxy '*' \
    -X PATCH "$DIRECTUS_URL/files/$file_id" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload"
done < "$CSV_FILE"

echo "完成所有修复"
