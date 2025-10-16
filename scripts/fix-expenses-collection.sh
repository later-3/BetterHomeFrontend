#!/bin/bash

# 修复 expenses 集合的显示问题（从文件夹改为表）
#
# 使用方法:
# DIRECTUS_ADMIN_TOKEN="your_token" bash scripts/fix-expenses-collection.sh

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  exit 1
fi

echo "🔧 修复 expenses 集合显示问题..."
echo ""

# 1. 更新 expenses 集合的 meta 配置
echo "📋 1. 更新 expenses 集合配置..."

curl -s -X PATCH "$DIRECTUS_URL/collections/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "meta": {
      "collection": "expenses",
      "icon": "payments",
      "note": "支出记录表",
      "display_template": "{{title}} - {{amount}}",
      "hidden": false,
      "singleton": false,
      "translations": [
        {
          "language": "zh-CN",
          "translation": "支出记录"
        }
      ],
      "archive_field": null,
      "archive_app_filter": true,
      "archive_value": null,
      "unarchive_value": null,
      "sort_field": "date_created",
      "accountability": "all",
      "color": "#FF4D4F",
      "item_duplication_fields": null,
      "sort": 5,
      "group": null,
      "collapse": "open"
    }
  }' | jq '.'

echo ""
echo "✅ expenses 集合配置已更新！"
echo ""
echo "📋 下一步操作:"
echo "1. 刷新 Directus Admin 页面"
echo "2. 检查 expenses 是否显示为正常的表图标（💳）"
echo "3. 如果仍然显示为文件夹，清除浏览器缓存后重试"
echo ""
echo "如果问题仍然存在，可能需要检查表结构:"
echo "bash scripts/check-expenses-collection.sh"
