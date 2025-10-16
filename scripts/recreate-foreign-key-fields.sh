#!/bin/bash

# 重新创建外键字段 - 删除 UUID 类型的字段，重新创建为 integer 类型
# 注意: 这会删除这些字段中的所有数据！

set -e

DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="${DIRECTUS_TOKEN:-sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n}"

echo "🔧 重新创建外键字段..."
echo "⚠️  警告: 这将删除相关字段的所有数据！"
echo "================================================"

# 1. billing_payments.billing_id
echo ""
echo "📋 处理 billing_payments.billing_id..."
echo "   删除旧字段..."
curl -s -X DELETE "$DIRECTUS_URL/fields/billing_payments/billing_id" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" > /dev/null

sleep 1

echo "   创建新字段 (integer)..."
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "billing_id",
    "type": "integer",
    "schema": {
      "data_type": "integer",
      "is_nullable": false,
      "foreign_key_table": "billings",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "display": "related-values",
      "display_options": {
        "template": "{{period}}"
      },
      "required": true
    }
  }' | jq -r '.data.field // "失败"'

echo "✅ billing_payments.billing_id 已重新创建"

# 2. salary_records.employee_id
echo ""
echo "📋 处理 salary_records.employee_id..."
echo "   删除旧字段..."
curl -s -X DELETE "$DIRECTUS_URL/fields/salary_records/employee_id" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" > /dev/null

sleep 1

echo "   创建新字段 (integer)..."
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "employee_id",
    "type": "integer",
    "schema": {
      "data_type": "integer",
      "is_nullable": false,
      "foreign_key_table": "employees",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "display": "related-values",
      "display_options": {
        "template": "{{name}}"
      },
      "required": true
    }
  }' | jq -r '.data.field // "失败"'

echo "✅ salary_records.employee_id 已重新创建"

# 3. salary_records.expense_id
echo ""
echo "📋 处理 salary_records.expense_id..."
echo "   删除旧字段..."
curl -s -X DELETE "$DIRECTUS_URL/fields/salary_records/expense_id" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" > /dev/null

sleep 1

echo "   创建新字段 (integer)..."
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "expense_id",
    "type": "integer",
    "schema": {
      "data_type": "integer",
      "is_nullable": true,
      "foreign_key_table": "expenses",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "display": "related-values",
      "display_options": {
        "template": "{{title}}"
      }
    }
  }' | jq -r '.data.field // "失败"'

echo "✅ salary_records.expense_id 已重新创建"

# 4. maintenance_fund_payments.account_id
echo ""
echo "📋 处理 maintenance_fund_payments.account_id..."
echo "   删除旧字段..."
curl -s -X DELETE "$DIRECTUS_URL/fields/maintenance_fund_payments/account_id" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" > /dev/null

sleep 1

echo "   创建新字段 (integer)..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "account_id",
    "type": "integer",
    "schema": {
      "data_type": "integer",
      "is_nullable": false,
      "foreign_key_table": "maintenance_fund_accounts",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "display": "related-values",
      "display_options": {
        "template": "账户 #{{id}}"
      },
      "required": true
    }
  }' | jq -r '.data.field // "失败"'

echo "✅ maintenance_fund_payments.account_id 已重新创建"

echo ""
echo "================================================"
echo "✅ 所有外键字段已重新创建！"
echo ""
echo "📋 已修复的字段:"
echo "   - billing_payments.billing_id: UUID → integer"
echo "   - salary_records.employee_id: UUID → integer"
echo "   - salary_records.expense_id: UUID → integer"
echo "   - maintenance_fund_payments.account_id: UUID → integer"
echo ""
echo "📋 下一步:"
echo "   1. 重新运行数据生成脚本: node scripts/fix-missing-data.js"
echo "   2. 验证数据是否正确创建"
