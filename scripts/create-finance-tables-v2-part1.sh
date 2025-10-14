#!/bin/bash

# Directus 财务表创建脚本 v2.0 - Part 1: billings & billing_payments
#
# 使用方法:
# DIRECTUS_ADMIN_TOKEN="your_token" bash scripts/create-finance-tables-v2-part1.sh

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  echo ""
  echo "使用方法:"
  echo "DIRECTUS_ADMIN_TOKEN=\"your_token\" bash scripts/create-finance-tables-v2-part1.sh"
  exit 1
fi

echo "🚀 开始创建财务透明功能 v2.0 数据表 (Part 1: billings & billing_payments)..."
echo ""

# ===================================================================
# 创建 billings 表 (v2.0 - 物业费账单，仅记录应收)
# ===================================================================
echo "📦 创建 billings 表 (v2.0)..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "billings",
    "meta": {
      "collection": "billings",
      "icon": "receipt_long",
      "note": "物业费账单（v2.0 - 应收账单）",
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

  # 账单基本信息
  '{"collection":"billings","field":"community_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","display":"related-values","display_options":{"template":"{{name}}"},"required":true,"note":"所属社区"},"schema":{"is_nullable":false}}'
  '{"collection":"billings","field":"building_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","display":"related-values","display_options":{"template":"{{name}}"},"note":"所属楼栋"},"schema":{"is_nullable":true}}'
  '{"collection":"billings","field":"owner_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","display":"related-values","display_options":{"template":"{{first_name}} {{last_name}}"},"required":true,"note":"业主"},"schema":{"is_nullable":false}}'

  # 计费信息
  '{"collection":"billings","field":"period","type":"string","meta":{"interface":"input","required":true,"note":"账期：YYYY-MM 格式"},"schema":{"is_nullable":false,"max_length":7}}'
  '{"collection":"billings","field":"billing_amount","type":"decimal","meta":{"interface":"input","required":true,"note":"应收金额"},"schema":{"is_nullable":false,"numeric_precision":10,"numeric_scale":2}}'
  '{"collection":"billings","field":"area","type":"decimal","meta":{"interface":"input","note":"计费面积（m²）"},"schema":{"is_nullable":true,"numeric_precision":10,"numeric_scale":2}}'
  '{"collection":"billings","field":"unit_price","type":"decimal","meta":{"interface":"input","note":"单价（元/m²）"},"schema":{"is_nullable":true,"numeric_precision":10,"numeric_scale":2}}'

  # 缴费状态
  '{"collection":"billings","field":"status","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"未缴","value":"unpaid"},{"text":"部分缴纳","value":"partial"},{"text":"已缴","value":"paid"},{"text":"逾期","value":"overdue"}]},"required":true},"schema":{"is_nullable":false,"default_value":"unpaid"}}'
  '{"collection":"billings","field":"paid_amount","type":"decimal","meta":{"interface":"input","note":"已缴金额（支持部分缴费）"},"schema":{"is_nullable":true,"numeric_precision":10,"numeric_scale":2,"default_value":0}}'

  # 逾期管理
  '{"collection":"billings","field":"due_date","type":"timestamp","meta":{"interface":"datetime","note":"应缴截止日期"},"schema":{"is_nullable":true}}'
  '{"collection":"billings","field":"late_fee","type":"decimal","meta":{"interface":"input","note":"滞纳金"},"schema":{"is_nullable":true,"numeric_precision":10,"numeric_scale":2,"default_value":0}}'

  '{"collection":"billings","field":"notes","type":"text","meta":{"interface":"input-multiline","note":"备注"},"schema":{"is_nullable":true}}'
  '{"collection":"billings","field":"date_deleted","type":"timestamp","meta":{"interface":"datetime","hidden":true},"schema":{"is_nullable":true}}'
)

for field in "${billing_fields[@]}"; do
  field_name=$(echo "$field" | grep -o '"field":"[^"]*"' | head -1 | cut -d'"' -f4)
  curl -s -X POST "$DIRECTUS_URL/fields/billings" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$field" > /dev/null 2>&1 && echo "  ✅ 字段 $field_name 创建成功" || echo "  ℹ️  字段 $field_name 已存在"
done

# ===================================================================
# 创建 billing_payments 表 (物业费收款记录，记录实收)
# ===================================================================
echo ""
echo "📦 创建 billing_payments 表..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "billing_payments",
    "meta": {
      "collection": "billing_payments",
      "icon": "payments",
      "note": "物业费收款记录（v2.0 - 实际收款）",
      "archive_field": "date_deleted",
      "archive_app_filter": true
    },
    "schema": {
      "name": "billing_payments"
    }
  }' | grep -q '"collection":"billing_payments"' && echo "✅ billing_payments 表创建成功" || echo "ℹ️  billing_payments 表已存在或创建失败"

echo ""
echo "📝 创建 billing_payments 字段..."

# billing_payments 字段数组
declare -a payment_fields=(
  # 审计字段
  '{"collection":"billing_payments","field":"user_created","type":"uuid","meta":{"special":["user-created"],"interface":"select-dropdown-m2o","readonly":true,"hidden":true},"schema":{"is_nullable":true}}'
  '{"collection":"billing_payments","field":"date_created","type":"timestamp","meta":{"special":["date-created"],"interface":"datetime","readonly":true,"hidden":true},"schema":{"is_nullable":true}}'
  '{"collection":"billing_payments","field":"user_updated","type":"uuid","meta":{"special":["user-updated"],"interface":"select-dropdown-m2o","readonly":true,"hidden":true},"schema":{"is_nullable":true}}'
  '{"collection":"billing_payments","field":"date_updated","type":"timestamp","meta":{"special":["date-updated"],"interface":"datetime","readonly":true,"hidden":true},"schema":{"is_nullable":true}}'

  # 关联账单
  '{"collection":"billing_payments","field":"billing_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","display":"related-values","display_options":{"template":"{{period}} - {{owner_id.first_name}}"},"required":true,"note":"关联账单"},"schema":{"is_nullable":false}}'
  '{"collection":"billing_payments","field":"community_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","display":"related-values","display_options":{"template":"{{name}}"},"required":true,"note":"所属社区"},"schema":{"is_nullable":false}}'
  '{"collection":"billing_payments","field":"owner_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","display":"related-values","display_options":{"template":"{{first_name}} {{last_name}}"},"required":true,"note":"业主"},"schema":{"is_nullable":false}}'

  # 缴费信息
  '{"collection":"billing_payments","field":"amount","type":"decimal","meta":{"interface":"input","required":true,"note":"实收金额"},"schema":{"is_nullable":false,"numeric_precision":10,"numeric_scale":2}}'
  '{"collection":"billing_payments","field":"paid_at","type":"timestamp","meta":{"interface":"datetime","required":true,"note":"缴费时间"},"schema":{"is_nullable":false}}'
  '{"collection":"billing_payments","field":"payment_method","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"微信","value":"wechat"},{"text":"支付宝","value":"alipay"},{"text":"银行转账","value":"bank"},{"text":"现金","value":"cash"},{"text":"其他","value":"other"}]},"required":true},"schema":{"is_nullable":false}}'

  # 缴费人信息
  '{"collection":"billing_payments","field":"payer_name","type":"string","meta":{"interface":"input","note":"缴费人姓名（可能代缴）"},"schema":{"is_nullable":true,"max_length":100}}'
  '{"collection":"billing_payments","field":"payer_phone","type":"string","meta":{"interface":"input","note":"缴费人电话"},"schema":{"is_nullable":true,"max_length":20}}'
  '{"collection":"billing_payments","field":"transaction_no","type":"string","meta":{"interface":"input","note":"交易流水号"},"schema":{"is_nullable":true,"max_length":100}}'

  # 凭证
  '{"collection":"billing_payments","field":"proof_files","type":"json","meta":{"interface":"list","note":"凭证文件ID数组"},"schema":{"is_nullable":true}}'
  '{"collection":"billing_payments","field":"notes","type":"text","meta":{"interface":"input-multiline","note":"备注"},"schema":{"is_nullable":true}}'
  '{"collection":"billing_payments","field":"date_deleted","type":"timestamp","meta":{"interface":"datetime","hidden":true},"schema":{"is_nullable":true}}'
)

for field in "${payment_fields[@]}"; do
  field_name=$(echo "$field" | grep -o '"field":"[^"]*"' | head -1 | cut -d'"' -f4)
  curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$field" > /dev/null 2>&1 && echo "  ✅ 字段 $field_name 创建成功" || echo "  ℹ️  字段 $field_name 已存在"
done

# ===================================================================
# 创建表关系
# ===================================================================
echo ""
echo "🔗 创建表关系..."

declare -a relations=(
  # billings 关系
  '{"collection":"billings","field":"community_id","related_collection":"communities","meta":{"many_collection":"billings","many_field":"community_id","one_collection":"communities"},"schema":{"on_delete":"SET NULL"}}'
  '{"collection":"billings","field":"building_id","related_collection":"buildings","meta":{"many_collection":"billings","many_field":"building_id","one_collection":"buildings"},"schema":{"on_delete":"SET NULL"}}'
  '{"collection":"billings","field":"owner_id","related_collection":"directus_users","meta":{"many_collection":"billings","many_field":"owner_id","one_collection":"directus_users"},"schema":{"on_delete":"SET NULL"}}'

  # billing_payments 关系
  '{"collection":"billing_payments","field":"billing_id","related_collection":"billings","meta":{"many_collection":"billing_payments","many_field":"billing_id","one_collection":"billings"},"schema":{"on_delete":"CASCADE"}}'
  '{"collection":"billing_payments","field":"community_id","related_collection":"communities","meta":{"many_collection":"billing_payments","many_field":"community_id","one_collection":"communities"},"schema":{"on_delete":"SET NULL"}}'
  '{"collection":"billing_payments","field":"owner_id","related_collection":"directus_users","meta":{"many_collection":"billing_payments","many_field":"owner_id","one_collection":"directus_users"},"schema":{"on_delete":"SET NULL"}}'
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
echo "✅ Part 1 完成！已创建 billings 和 billing_payments 表"
echo ""
echo "📋 下一步:"
echo "1. 运行 Part 2 脚本创建其他表"
echo "2. 配置权限规则"
echo "3. 更新 TypeScript 类型定义"
