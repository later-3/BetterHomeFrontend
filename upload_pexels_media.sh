#!/usr/bin/env bash
set -euo pipefail

DIRECTUS_URL="http://localhost:8055"
TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"
OUTPUT_FILE="uploaded_pexels_media.csv"
MEDIA_DIRS=("pexels_images" "pexels_videos")

if ! command -v jq >/dev/null 2>&1; then
  echo "❌ 需要 jq，请先安装 jq" >&2
  exit 1
fi

echo "file_name,file_id" > "$OUTPUT_FILE"

for dir in "${MEDIA_DIRS[@]}"; do
  if [[ ! -d "$dir" ]]; then
    echo "⚠️ 目录 $dir 不存在，跳过"
    continue
  fi

  while IFS= read -r -d '' file; do
    base=$(basename "$file")
    echo "上传 $base ..."
    response=$(curl --silent --show-error --fail-with-body --noproxy '*' \
      -X POST "$DIRECTUS_URL/files" \
      -H "Authorization: Bearer $TOKEN" \
      -F "file=@$file" \
      -F "title=$base" 2>&1 || true)

    file_id=$(echo "$response" | jq -r '.data.id // empty' 2>/dev/null || true)
    if [[ -n "$file_id" ]]; then
      echo "  ✔ 成功: $file_id"
      echo "$base,$file_id" >> "$OUTPUT_FILE"
    else
      err=$(echo "$response" | jq -r '.errors[0].message // .message // .error // .' 2>/dev/null || echo "$response")
      echo "  ✖ 失败: $err" >&2
    fi
  done < <(find "$dir" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.mp4' -o -iname '*.mov' \) -print0)
done

echo "完成，结果写入 $OUTPUT_FILE"
