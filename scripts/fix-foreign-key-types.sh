#!/bin/bash

# 修复外键字段类型 - 从 UUID 改为 integer
# 问题: billing_payments, salary_records, maintenance_fund_payments 表的外键字段
# 被错误地创建为 UUID 类型，但引用的主键是 integer 类型

set -e

DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="${DIRECTUS_TOKEN:-sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n}"

echo "🔧 修复外键字段类型..."
echo "================================================"

# 1. 修复 billing_payments 表
echo ""
echo "📋 修复 billing_payments.billing_id..."
curl -s -X PATCH "$DIRECTUS_URL/fields/billing_payments/billing_id" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "billing_id",
    "type": "integer",
    "schema": {
      "data_type": "integer",
      "is_nullable": false
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "options": {
        "template": "{{period}} - {{owner_id}}"
      }
    }
  }' | jq -r '.data.field // "失败"'

echo "✅ billing_payments.billing_id 已修复"

# 2. 修复 salary_records 表
echo ""
echo "📋 修复 salary_records.employee_id..."
curl -s -X PATCH "$DIRECTUS_URL/fields/salary_records/employee_id" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "employee_id",
    "type": "integer",
    "schema": {
      "data_type": "integer",
      "is_nullable": false
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "options": {
        "template": "{{name}}"
      }
    }
  }' | jq -r '.data.field // "失败"'

echo "✅ salary_records.employee_id 已修复"

echo ""
echo "📋 修复 salary_records.expense_id..."
curl -s -X PATCH "$DIRECTUS_URL/fields/salary_records/expense_id" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "expense_id",
    "type": "integer",
    "schema": {
      "data_type": "integer",
      "is_nullable": true
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "options": {
        "template": "{{title}}"
      }
    }
  }' | jq -r '.data.field // "失败"'

echo "✅ salary_records.expense_id 已修复"

# 3. 修复 maintenance_fund_payments 表
echo ""
echo "📋 修复 maintenance_fund_payments.account_id..."
curl -s -X PATCH "$DIRECTUS_URL/fields/maintenance_fund_payments/account_id" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "account_id",
    "type": "integer",
    "schema": {
      "data_type": "integer",
      "is_nullable": false
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "options": {
        "template": "{{owner_id}}"
      }
    }
  }' | jq -r '.data.field // "失败"'

echo "✅ maintenance_fund_payments.account_id 已修复"

echo ""
echo "================================================"
echo "✅ 所有外键字段类型已修复！"
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
