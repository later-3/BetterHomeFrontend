#!/bin/bash

# 重新创建 billing_payments 表（修复 billing_id 字段类型）
# billing_id 应该是 integer 而不是 uuid
#
# 使用方法:
# 1. 先在 Directus Admin 中删除 billing_payments 表
# 2. DIRECTUS_ADMIN_TOKEN="your_token" bash scripts/recreate-billing-payments-table.sh

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  exit 1
fi

echo "🚀 重新创建 billing_payments 表（修复字段类型）..."
echo ""

# ===================================================================
# 1. 创建 billing_payments 集合
# ===================================================================
echo "📦 [1/3] 创建 billing_payments 集合..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "billing_payments",
    "meta": {
      "collection": "billing_payments",
      "icon": "receipt",
      "note": "物业费收款记录表（v2.0）",
      "display_template": "{{payer_name}} - ¥{{amount}}",
      "hidden": false,
      "singleton": false,
      "translations": [
        {
          "language": "zh-CN",
          "translation": "物业费收款记录"
        }
      ],
      "sort_field": "paid_at",
      "accountability": "all",
      "color": "#52C41A",
      "sort": 2,
      "group": null,
      "collapse": "open"
    },
    "schema": {
      "name": "billing_payments"
    }
  }' > /dev/null && echo "   ✅ billing_payments 集合创建成功"

echo ""
echo "📝 [2/3] 创建 billing_payments 字段..."

# 审计字段
echo "   创建审计字段..."
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"user_created","type":"uuid","meta":{"special":["user-created"],"hidden":true}}' > /dev/null && echo "      ✅ user_created"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"date_created","type":"timestamp","meta":{"special":["date-created"],"hidden":true}}' > /dev/null && echo "      ✅ date_created"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"user_updated","type":"uuid","meta":{"special":["user-updated"],"hidden":true}}' > /dev/null && echo "      ✅ user_updated"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"date_updated","type":"timestamp","meta":{"special":["date-updated"],"hidden":true}}' > /dev/null && echo "      ✅ date_updated"

# 关联字段 - 使用 integer 类型
echo "   创建关联字段（integer类型）..."
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "billing_id",
    "type": "integer",
    "meta": {
      "interface": "select-dropdown-m2o",
      "required": true,
      "note": "关联账单ID（整数）",
      "width": "half"
    },
    "schema": {
      "is_nullable": false
    }
  }' > /dev/null && echo "      ✅ billing_id (integer)"

curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"community_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true,"width":"half"},"schema":{"is_nullable":false}}' > /dev/null && echo "      ✅ community_id"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"owner_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true,"width":"half"},"schema":{"is_nullable":false}}' > /dev/null && echo "      ✅ owner_id"

# 缴费信息
echo "   创建缴费信息字段..."
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"amount","type":"decimal","meta":{"interface":"input","required":true,"width":"half"},"schema":{"is_nullable":false,"numeric_precision":10,"numeric_scale":2}}' > /dev/null && echo "      ✅ amount"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"paid_at","type":"timestamp","meta":{"interface":"datetime","required":true,"width":"half"},"schema":{"is_nullable":false}}' > /dev/null && echo "      ✅ paid_at"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"payment_method","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"微信","value":"wechat"},{"text":"支付宝","value":"alipay"},{"text":"银行转账","value":"bank"},{"text":"现金","value":"cash"}]},"required":true,"width":"half"},"schema":{"is_nullable":false}}' > /dev/null && echo "      ✅ payment_method"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"payer_name","type":"string","meta":{"interface":"input","width":"half"},"schema":{"max_length":100}}' > /dev/null && echo "      ✅ payer_name"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"payer_phone","type":"string","meta":{"interface":"input","width":"half"},"schema":{"max_length":20}}' > /dev/null && echo "      ✅ payer_phone"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"transaction_no","type":"string","meta":{"interface":"input","width":"half"},"schema":{"max_length":100}}' > /dev/null && echo "      ✅ transaction_no"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"proof_files","type":"json","meta":{"interface":"list","width":"full"}}' > /dev/null && echo "      ✅ proof_files"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"notes","type":"text","meta":{"interface":"input-multiline","width":"full"}}' > /dev/null && echo "      ✅ notes"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"date_deleted","type":"timestamp","meta":{"hidden":true}}' > /dev/null && echo "      ✅ date_deleted"

# ===================================================================
# 3. 创建表关系
# ===================================================================
echo ""
echo "🔗 [3/3] 创建表关系..."

# billing_id -> billings (integer to integer)
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "billing_payments",
    "field": "billing_id",
    "related_collection": "billings",
    "meta": {
      "many_collection": "billing_payments",
      "many_field": "billing_id",
      "one_collection": "billings"
    },
    "schema": {
      "on_delete": "SET NULL"
    }
  }' > /dev/null && echo "   ✅ billing_payments.billing_id -> billings"

curl -s -X POST "$DIRECTUS_URL/relations" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"collection":"billing_payments","field":"community_id","related_collection":"communities","schema":{"on_delete":"SET NULL"}}' > /dev/null && echo "   ✅ billing_payments.community_id -> communities"
curl -s -X POST "$DIRECTUS_URL/relations" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"collection":"billing_payments","field":"owner_id","related_collection":"directus_users","schema":{"on_delete":"SET NULL"}}' > /dev/null && echo "   ✅ billing_payments.owner_id -> directus_users"

echo ""
echo "✅ billing_payments 表重新创建完成！"
echo ""
echo "📋 关键修复:"
echo "   - billing_id 字段类型: uuid → integer ✅"
echo ""
echo "📋 下一步:"
echo "   1. 重新创建 salary_records 表"
echo "   2. 重新创建 maintenance_fund_payments 表"
echo "   3. 重新运行数据生成脚本"
