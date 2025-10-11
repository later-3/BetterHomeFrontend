#!/usr/bin/env bash
set -euo pipefail

DIRECTUS_URL="http://localhost:8055"
TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"

echo "重新上传 Pexels Video 1526909..."
response=$(curl --silent --show-error --noproxy '*' \
  -X POST "$DIRECTUS_URL/files" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@pexels_videos/pexels_video_1526909.mp4" \
  -F "title=Pexels Video 1526909")

video_id=$(echo "$response" | jq -r '.data.id // empty')
if [[ -n "$video_id" ]]; then
  echo "  ✔ 视频上传成功: $video_id"
  echo "  视频 URL: $DIRECTUS_URL/assets/$video_id"
else
  echo "  ✖ 视频上传失败"
  echo "$response" | jq '.'
fi

echo ""
echo "重新上传 Pexels Photo 33786122..."
response=$(curl --silent --show-error --noproxy '*' \
  -X POST "$DIRECTUS_URL/files" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@pexels_images/pexels_photo_33786122.jpeg" \
  -F "title=Pexels Photo 33786122")

photo_id=$(echo "$response" | jq -r '.data.id // empty')
if [[ -n "$photo_id" ]]; then
  echo "  ✔ 照片上传成功: $photo_id"
  echo "  照片 URL: $DIRECTUS_URL/assets/$photo_id"
else
  echo "  ✖ 照片上传失败"
  echo "$response" | jq '.'
fi

echo ""
echo "完成！"
