#!/bin/bash

# 更新 parking_spots 表的 type 字段选项
# 从 fixed/temp 改为 fixed/public

DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"

echo "📝 更新 parking_spots.type 字段选项..."

curl -X PATCH "$DIRECTUS_URL/fields/parking_spots/type" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "meta": {
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {
            "text": "固定车位（有产权）",
            "value": "fixed"
          },
          {
            "text": "公共车位（无产权）",
            "value": "public"
          }
        ]
      },
      "note": "车位类型：fixed=有产权的固定车位，public=无产权的公共车位。临停不在此表，在parking_temp_records表"
    }
  }' | python3 -m json.tool

echo ""
echo "✅ 字段选项已更新为 fixed/public"
