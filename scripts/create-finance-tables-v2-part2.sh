#!/bin/bash

# Directus 财务表创建脚本 v2.0 - Part 2: incomes
#
# 使用方法:
# DIRECTUS_ADMIN_TOKEN="your_token" bash scripts/create-finance-tables-v2-part2.sh

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  exit 1
fi

echo "🚀 开始创建财务透明功能 v2.0 数据表 (Part 2: incomes)..."
echo ""

# ===================================================================
# 创建 incomes 表 (公共收益)
# ===================================================================
echo "📦 创建 incomes 表..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "incomes",
    "meta": {
      "collection": "incomes",
      "icon": "account_balance_wallet",
      "note": "公共收益表（v2.0 - 广告、停车、场地租赁等）",
      "archive_field": "date_deleted",
      "archive_app_filter": true
    },
    "schema": {
      "name": "incomes"
    }
  }' | grep -q '"collection":"incomes"' && echo "✅ incomes 表创建成功" || echo "ℹ️  incomes 表已存在或创建失败"

echo ""
echo "📝 创建 incomes 字段..."

# incomes 字段数组
declare -a income_fields=(
  # 审计字段
  '{"collection":"incomes","field":"user_created","type":"uuid","meta":{"special":["user-created"],"interface":"select-dropdown-m2o","readonly":true,"hidden":true},"schema":{"is_nullable":true}}'
  '{"collection":"incomes","field":"date_created","type":"timestamp","meta":{"special":["date-created"],"interface":"datetime","readonly":true,"hidden":true},"schema":{"is_nullable":true}}'
  '{"collection":"incomes","field":"user_updated","type":"uuid","meta":{"special":["user-updated"],"interface":"select-dropdown-m2o","readonly":true,"hidden":true},"schema":{"is_nullable":true}}'
  '{"collection":"incomes","field":"date_updated","type":"timestamp","meta":{"special":["date-updated"],"interface":"datetime","readonly":true,"hidden":true},"schema":{"is_nullable":true}}'

  # 收入基本信息
  '{"collection":"incomes","field":"community_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","display":"related-values","display_options":{"template":"{{name}}"},"required":true,"note":"所属社区"},"schema":{"is_nullable":false}}'
  '{"collection":"incomes","field":"income_type","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"广告收入","value":"advertising"},{"text":"停车收入","value":"parking"},{"text":"场地租赁","value":"venue_rental"},{"text":"自动售货","value":"vending"},{"text":"快递柜","value":"express_locker"},{"text":"废品回收","value":"recycling"},{"text":"其他","value":"other"}]},"required":true},"schema":{"is_nullable":false}}'

  # 详细信息
  '{"collection":"incomes","field":"title","type":"string","meta":{"interface":"input","required":true,"note":"收入标题"},"schema":{"is_nullable":false,"max_length":255}}'
  '{"collection":"incomes","field":"description","type":"text","meta":{"interface":"input-multiline","note":"详细说明"},"schema":{"is_nullable":true}}'
  '{"collection":"incomes","field":"amount","type":"decimal","meta":{"interface":"input","required":true,"note":"收入金额"},"schema":{"is_nullable":false,"numeric_precision":10,"numeric_scale":2}}'

  # 时间信息
  '{"collection":"incomes","field":"income_date","type":"timestamp","meta":{"interface":"datetime","required":true,"note":"收入日期"},"schema":{"is_nullable":false}}'
  '{"collection":"incomes","field":"period","type":"string","meta":{"interface":"input","note":"账期（YYYY-MM），用于月度汇总"},"schema":{"is_nullable":true,"max_length":7}}'

  # 支付信息
  '{"collection":"incomes","field":"payment_method","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"微信","value":"wechat"},{"text":"支付宝","value":"alipay"},{"text":"银行转账","value":"bank"},{"text":"现金","value":"cash"},{"text":"其他","value":"other"}]},"required":true},"schema":{"is_nullable":false}}'
  '{"collection":"incomes","field":"transaction_no","type":"string","meta":{"interface":"input","note":"交易流水号"},"schema":{"is_nullable":true,"max_length":100}}'

  # 关联信息（JSON 存储灵活数据）
  '{"collection":"incomes","field":"related_info","type":"json","meta":{"interface":"input-code","options":{"language":"json"},"note":"关联信息（广告商、车位号、租户等）"},"schema":{"is_nullable":true}}'
  '{"collection":"incomes","field":"proof_files","type":"json","meta":{"interface":"list","note":"凭证文件ID数组"},"schema":{"is_nullable":true}}'
  '{"collection":"incomes","field":"notes","type":"text","meta":{"interface":"input-multiline","note":"备注"},"schema":{"is_nullable":true}}'
  '{"collection":"incomes","field":"date_deleted","type":"timestamp","meta":{"interface":"datetime","hidden":true},"schema":{"is_nullable":true}}'
)

for field in "${income_fields[@]}"; do
  field_name=$(echo "$field" | grep -o '"field":"[^"]*"' | head -1 | cut -d'"' -f4)
  curl -s -X POST "$DIRECTUS_URL/fields/incomes" \
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
  # incomes 关系
  '{"collection":"incomes","field":"community_id","related_collection":"communities","meta":{"many_collection":"incomes","many_field":"community_id","one_collection":"communities"},"schema":{"on_delete":"SET NULL"}}'
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
echo "✅ Part 2 完成！已创建 incomes 表"
echo ""
echo "📋 下一步:"
echo "1. 运行 Part 3 脚本创建维修基金表"
echo "2. 运行 Part 4 脚本创建支出和员工表"
