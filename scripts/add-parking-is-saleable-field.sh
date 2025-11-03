#!/bin/bash

# 添加 is_saleable 字段到 parking_spots 表

DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"

echo "📝 添加 is_saleable 字段到 parking_spots 表..."

# 添加字段
curl -X POST "$DIRECTUS_URL/fields/parking_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "is_saleable",
    "type": "boolean",
    "meta": {
      "interface": "boolean",
      "display": "boolean",
      "note": "是否可售（有产权可售 vs 无产权只租）",
      "options": {
        "label": "仅当 ownership=public 时有意义"
      }
    },
    "schema": {
      "default_value": false
    }
  }' | python3 -m json.tool

echo ""
echo "✅ 字段添加完成"
