#!/bin/bash

# 检查 expenses 集合配置
#
# 使用方法:
# DIRECTUS_ADMIN_TOKEN="your_token" bash scripts/check-expenses-collection.sh

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  exit 1
fi

echo "🔍 检查 expenses 集合配置..."
echo ""

# 1. 检查 expenses 集合是否存在
echo "📋 1. 检查 expenses 集合..."
EXPENSES_COLLECTION=$(curl -s "$DIRECTUS_URL/collections/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN")

echo "$EXPENSES_COLLECTION" | jq '.'
echo ""

# 2. 检查集合的 meta 配置
echo "📋 2. 检查 expenses 集合的 meta 配置..."
EXPENSES_META=$(echo "$EXPENSES_COLLECTION" | jq -r '.data.meta')

if [ "$EXPENSES_META" != "null" ]; then
  echo "   Meta 配置:"
  echo "$EXPENSES_META" | jq '.'
  
  # 检查是否配置为 folder
  IS_FOLDER=$(echo "$EXPENSES_META" | jq -r '.singleton')
  ICON=$(echo "$EXPENSES_META" | jq -r '.icon')
  
  echo ""
  echo "   Singleton: $IS_FOLDER"
  echo "   Icon: $ICON"
else
  echo "   ⚠️  没有 meta 配置"
fi

echo ""

# 3. 检查 expenses 表结构
echo "📋 3. 检查 expenses 表结构..."
EXPENSES_FIELDS=$(curl -s "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | jq -r '.data[] | .field')

if [ ! -z "$EXPENSES_FIELDS" ]; then
  echo "   ✅ 找到以下字段:"
  echo "$EXPENSES_FIELDS" | while read field; do
    echo "      - $field"
  done
else
  echo "   ❌ 未找到任何字段"
fi

echo ""

# 4. 检查是否有数据
echo "📋 4. 检查 expenses 表数据..."
EXPENSES_COUNT=$(curl -s "$DIRECTUS_URL/items/expenses?aggregate[count]=*" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | jq -r '.data[0].count')

echo "   记录数: $EXPENSES_COUNT"

echo ""
echo "✅ 检查完成！"
echo ""
echo "📋 诊断结果:"
echo ""

if [ "$ICON" == "folder" ]; then
  echo "   ⚠️  问题: expenses 集合的图标设置为 'folder'"
  echo "   解决方案: 运行修复脚本更改图标"
  echo "   bash scripts/fix-expenses-collection.sh"
fi

if [ "$IS_FOLDER" == "true" ]; then
  echo "   ⚠️  问题: expenses 集合被配置为 singleton"
  echo "   解决方案: 这不应该是 singleton 类型"
fi

if [ -z "$EXPENSES_FIELDS" ]; then
  echo "   ❌ 严重问题: expenses 表没有字段"
  echo "   解决方案: 需要重新创建 expenses 表"
  echo "   bash scripts/create-finance-tables-v2-part2.sh"
fi
