#!/bin/bash

# Directus 财务表创建脚本 (Bash版本)
#
# 使用方法：
# 1. 获取 Admin Token（见 docs/tasks/billing/setup-guide.md）
# 2. 运行: DIRECTUS_ADMIN_TOKEN="your_token" bash scripts/create-billing-tables.sh

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  echo ""
  echo "使用方法:"
  echo "DIRECTUS_ADMIN_TOKEN=\"your_token\" bash scripts/create-billing-tables.sh"
  exit 1
fi

echo "🚀 开始创建财务透明功能数据表..."
echo ""

# 创建 billings 表
echo "📦 创建 billings 表..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "billings",
    "meta": {
      "collection": "billings",
      "icon": "attach_money",
      "note": "物业费账单表",
      "archive_field": "date_deleted",
      "archive_app_filter": true
    },
    "schema": {
      "name": "billings"
    }
  }' | grep -q '"collection":"billings"' && echo "✅ billings 表创建成功" || echo "ℹ️  billings 表已存在或创建失败"

echo ""
echo "📝 创建 billings 字段..."

# billings 字段数组
declare -a billing_fields=(
  # 审计字段
  '{"collection":"billings","field":"user_created","type":"uuid","meta":{"special":["user-created"],"interface":"select-dropdown-m2o","readonly":true,"hidden":true},"schema":{"is_nullable":true}}'
  '{"collection":"billings","field":"date_created","type":"timestamp","meta":{"special":["date-created"],"interface":"datetime","readonly":true,"hidden":true},"schema":{"is_nullable":true}}'
  '{"collection":"billings","field":"user_updated","type":"uuid","meta":{"special":["user-updated"],"interface":"select-dropdown-m2o","readonly":true,"hidden":true},"schema":{"is_nullable":true}}'
  '{"collection":"billings","field":"date_updated","type":"timestamp","meta":{"special":["date-updated"],"interface":"datetime","readonly":true,"hidden":true},"schema":{"is_nullable":true}}'
  # 业务字段
  '{"collection":"billings","field":"community_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true},"schema":{"is_nullable":false}}'
  '{"collection":"billings","field":"building_id","type":"uuid","meta":{"interface":"select-dropdown-m2o"},"schema":{"is_nullable":true}}'
  '{"collection":"billings","field":"owner_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true},"schema":{"is_nullable":false}}'
  '{"collection":"billings","field":"amount","type":"decimal","meta":{"interface":"input","required":true},"schema":{"is_nullable":false,"numeric_precision":10,"numeric_scale":2}}'
  '{"collection":"billings","field":"period","type":"string","meta":{"interface":"input","required":true},"schema":{"is_nullable":false,"max_length":7}}'
  '{"collection":"billings","field":"payment_method","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"微信","value":"wechat"},{"text":"支付宝","value":"alipay"},{"text":"银行转账","value":"bank"},{"text":"现金","value":"cash"},{"text":"其他","value":"other"}]}},"schema":{"is_nullable":true,"default_value":"other"}}'
  '{"collection":"billings","field":"status","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"未缴","value":"unpaid"},{"text":"已缴","value":"paid"},{"text":"逾期","value":"overdue"}]},"required":true},"schema":{"is_nullable":false,"default_value":"unpaid"}}'
  '{"collection":"billings","field":"paid_at","type":"timestamp","meta":{"interface":"datetime"},"schema":{"is_nullable":true}}'
  '{"collection":"billings","field":"late_fee","type":"decimal","meta":{"interface":"input"},"schema":{"is_nullable":true,"numeric_precision":10,"numeric_scale":2,"default_value":0}}'
  '{"collection":"billings","field":"notes","type":"text","meta":{"interface":"input-multiline"},"schema":{"is_nullable":true}}'
  '{"collection":"billings","field":"date_deleted","type":"timestamp","meta":{"interface":"datetime","hidden":true},"schema":{"is_nullable":true}}'
)

for field in "${billing_fields[@]}"; do
  field_name=$(echo "$field" | grep -o '"field":"[^"]*"' | head -1 | cut -d'"' -f4)
  curl -s -X POST "$DIRECTUS_URL/fields/billings" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$field" > /dev/null 2>&1 && echo "  ✅ 字段 $field_name 创建成功" || echo "  ℹ️  字段 $field_name 已存在"
done

echo ""
echo "📦 创建 expenses 表..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
    "meta": {
      "collection": "expenses",
      "icon": "payments",
      "note": "物业支出表",
      "archive_field": "date_deleted",
      "archive_app_filter": true
    },
    "schema": {
      "name": "expenses"
    }
  }' | grep -q '"collection":"expenses"' && echo "✅ expenses 表创建成功" || echo "ℹ️  expenses 表已存在或创建失败"

echo ""
echo "📝 创建 expenses 字段..."

# expenses 字段数组
declare -a expense_fields=(
  # 审计字段
  '{"collection":"expenses","field":"user_created","type":"uuid","meta":{"special":["user-created"],"interface":"select-dropdown-m2o","readonly":true,"hidden":true},"schema":{"is_nullable":true}}'
  '{"collection":"expenses","field":"date_created","type":"timestamp","meta":{"special":["date-created"],"interface":"datetime","readonly":true,"hidden":true},"schema":{"is_nullable":true}}'
  '{"collection":"expenses","field":"user_updated","type":"uuid","meta":{"special":["user-updated"],"interface":"select-dropdown-m2o","readonly":true,"hidden":true},"schema":{"is_nullable":true}}'
  '{"collection":"expenses","field":"date_updated","type":"timestamp","meta":{"special":["date-updated"],"interface":"datetime","readonly":true,"hidden":true},"schema":{"is_nullable":true}}'
  # 业务字段
  '{"collection":"expenses","field":"community_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true},"schema":{"is_nullable":false}}'
  '{"collection":"expenses","field":"title","type":"string","meta":{"interface":"input","required":true},"schema":{"is_nullable":false,"max_length":255}}'
  '{"collection":"expenses","field":"description","type":"text","meta":{"interface":"input-multiline"},"schema":{"is_nullable":true}}'
  '{"collection":"expenses","field":"amount","type":"decimal","meta":{"interface":"input","required":true},"schema":{"is_nullable":false,"numeric_precision":10,"numeric_scale":2}}'
  '{"collection":"expenses","field":"category","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"维修","value":"repair"},{"text":"工资","value":"salary"},{"text":"清洁","value":"cleaning"},{"text":"保安","value":"security"},{"text":"公共水电","value":"utilities"},{"text":"绿化","value":"greening"},{"text":"电梯维护","value":"elevator"},{"text":"其他","value":"other"}]},"required":true},"schema":{"is_nullable":false}}'
  '{"collection":"expenses","field":"paid_at","type":"timestamp","meta":{"interface":"datetime","required":true},"schema":{"is_nullable":false}}'
  '{"collection":"expenses","field":"payment_method","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"微信","value":"wechat"},{"text":"支付宝","value":"alipay"},{"text":"银行转账","value":"bank"},{"text":"现金","value":"cash"},{"text":"其他","value":"other"}]}},"schema":{"is_nullable":true,"default_value":"other"}}'
  '{"collection":"expenses","field":"status","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"待审核","value":"pending"},{"text":"已审核","value":"approved"},{"text":"已拒绝","value":"rejected"}]},"required":true},"schema":{"is_nullable":false,"default_value":"approved"}}'
  '{"collection":"expenses","field":"approved_by","type":"uuid","meta":{"interface":"select-dropdown-m2o"},"schema":{"is_nullable":true}}'
  '{"collection":"expenses","field":"approved_at","type":"timestamp","meta":{"interface":"datetime"},"schema":{"is_nullable":true}}'
  '{"collection":"expenses","field":"proof_files","type":"json","meta":{"interface":"input-code","options":{"language":"json"}},"schema":{"is_nullable":true}}'
  '{"collection":"expenses","field":"created_by","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true},"schema":{"is_nullable":false}}'
  '{"collection":"expenses","field":"date_deleted","type":"timestamp","meta":{"interface":"datetime","hidden":true},"schema":{"is_nullable":true}}'
)

for field in "${expense_fields[@]}"; do
  field_name=$(echo "$field" | grep -o '"field":"[^"]*"' | head -1 | cut -d'"' -f4)
  curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$field" > /dev/null 2>&1 && echo "  ✅ 字段 $field_name 创建成功" || echo "  ℹ️  字段 $field_name 已存在"
done

echo ""
echo "🔗 创建表关系..."

# 关系数组
declare -a relations=(
  '{"collection":"billings","field":"community_id","related_collection":"communities","meta":{"many_collection":"billings","many_field":"community_id","one_collection":"communities"},"schema":{"on_delete":"SET NULL"}}'
  '{"collection":"billings","field":"building_id","related_collection":"buildings","meta":{"many_collection":"billings","many_field":"building_id","one_collection":"buildings"},"schema":{"on_delete":"SET NULL"}}'
  '{"collection":"billings","field":"owner_id","related_collection":"directus_users","meta":{"many_collection":"billings","many_field":"owner_id","one_collection":"directus_users"},"schema":{"on_delete":"SET NULL"}}'
  '{"collection":"expenses","field":"community_id","related_collection":"communities","meta":{"many_collection":"expenses","many_field":"community_id","one_collection":"communities"},"schema":{"on_delete":"SET NULL"}}'
  '{"collection":"expenses","field":"created_by","related_collection":"directus_users","meta":{"many_collection":"expenses","many_field":"created_by","one_collection":"directus_users"},"schema":{"on_delete":"SET NULL"}}'
  '{"collection":"expenses","field":"approved_by","related_collection":"directus_users","meta":{"many_collection":"expenses","many_field":"approved_by","one_collection":"directus_users"},"schema":{"on_delete":"SET NULL"}}'
)

for relation in "${relations[@]}"; do
  collection=$(echo "$relation" | grep -o '"collection":"[^"]*"' | head -1 | cut -d'"' -f4)
  field=$(echo "$relation" | grep -o '"field":"[^"]*"' | head -1 | cut -d'"' -f4)
  related=$(echo "$relation" | grep -o '"related_collection":"[^"]*"' | head -1 | cut -d'"' -f4)
  curl -s -X POST "$DIRECTUS_URL/relations" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$relation" > /dev/null 2>&1 && echo "  ✅ 关系 $collection.$field -> $related 创建成功" || echo "  ℹ️  关系 $collection.$field 已存在"
done

echo ""
echo "✅ 所有表创建完成！"
echo ""
echo "📋 下一步:"
echo "1. 在 Directus Admin 中配置权限规则（见 docs/tasks/billing/setup-guide.md）"
echo "2. 更新 TypeScript 类型定义"
echo "3. 封装 Directus SDK API"
