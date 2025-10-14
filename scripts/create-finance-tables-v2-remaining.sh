#!/bin/bash

# Directus 财务表创建脚本 v2.0 - Remaining Tables
# Creates: maintenance_fund_accounts, maintenance_fund_payments, expenses, employees, salary_records, maintenance_fund_usage
#
# 使用方法:
# DIRECTUS_ADMIN_TOKEN="your_token" bash scripts/create-finance-tables-v2-remaining.sh

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  exit 1
fi

echo "🚀 开始创建剩余 6 张财务表..."
echo ""

# ===================================================================
# 1. maintenance_fund_accounts (维修基金账户)
# ===================================================================
echo "📦 [1/6] 创建 maintenance_fund_accounts 表..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_accounts",
    "meta": {
      "collection": "maintenance_fund_accounts",
      "icon": "savings",
      "note": "维修基金账户（v2.0）",
      "archive_field": "date_deleted",
      "archive_app_filter": true
    }
  }' > /dev/null && echo "✅ maintenance_fund_accounts 表创建成功"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"user_created","type":"uuid","meta":{"special":["user-created"],"hidden":true}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"date_created","type":"timestamp","meta":{"special":["date-created"],"hidden":true}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"user_updated","type":"uuid","meta":{"special":["user-updated"],"hidden":true}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"date_updated","type":"timestamp","meta":{"special":["date-updated"],"hidden":true}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"community_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"building_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"owner_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"house_area","type":"decimal","meta":{"interface":"input"},"schema":{"numeric_precision":10,"numeric_scale":2}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"unit_number","type":"string","meta":{"interface":"input"},"schema":{"max_length":50}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"total_paid","type":"decimal","meta":{"interface":"input","required":true},"schema":{"is_nullable":false,"numeric_precision":10,"numeric_scale":2,"default_value":0}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"total_used","type":"decimal","meta":{"interface":"input","required":true},"schema":{"is_nullable":false,"numeric_precision":10,"numeric_scale":2,"default_value":0}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"balance","type":"decimal","meta":{"interface":"input","required":true},"schema":{"is_nullable":false,"numeric_precision":10,"numeric_scale":2,"default_value":0}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"last_payment_date","type":"timestamp","meta":{"interface":"datetime"}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"date_deleted","type":"timestamp","meta":{"hidden":true}}' > /dev/null

# ===================================================================
# 2. maintenance_fund_payments (维修基金缴纳记录)
# ===================================================================
echo "📦 [2/6] 创建 maintenance_fund_payments 表..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
    "meta": {
      "collection": "maintenance_fund_payments",
      "icon": "account_balance",
      "note": "维修基金缴纳记录（v2.0）"
    }
  }' > /dev/null && echo "✅ maintenance_fund_payments 表创建成功"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"user_created","type":"uuid","meta":{"special":["user-created"],"hidden":true}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"date_created","type":"timestamp","meta":{"special":["date-created"],"hidden":true}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"user_updated","type":"uuid","meta":{"special":["user-updated"],"hidden":true}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"date_updated","type":"timestamp","meta":{"special":["date-updated"],"hidden":true}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"account_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"community_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"owner_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"amount","type":"decimal","meta":{"interface":"input","required":true},"schema":{"is_nullable":false,"numeric_precision":10,"numeric_scale":2}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"paid_at","type":"timestamp","meta":{"interface":"datetime","required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"payment_method","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"微信","value":"wechat"},{"text":"支付宝","value":"alipay"},{"text":"银行转账","value":"bank"},{"text":"现金","value":"cash"},{"text":"其他","value":"other"}]},"required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"transaction_no","type":"string","meta":{"interface":"input"},"schema":{"max_length":100}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"proof_files","type":"json","meta":{"interface":"list"}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"notes","type":"text","meta":{"interface":"input-multiline"}}' > /dev/null

echo "📦 [3/6] 创建 expenses 表 v2.0..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
    "meta": {
      "collection": "expenses",
      "icon": "money_off",
      "note": "支出记录表（v2.0）"
    }
  }' > /dev/null && echo "✅ expenses 表创建成功"

curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"user_created","type":"uuid","meta":{"special":["user-created"],"hidden":true}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"date_created","type":"timestamp","meta":{"special":["date-created"],"hidden":true}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"user_updated","type":"uuid","meta":{"special":["user-updated"],"hidden":true}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"date_updated","type":"timestamp","meta":{"special":["date-updated"],"hidden":true}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"community_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"expense_type","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"工资","value":"salary"},{"text":"维修","value":"maintenance"},{"text":"公用事业","value":"utilities"},{"text":"物料","value":"materials"},{"text":"活动","value":"activity"},{"text":"业委会经费","value":"committee_fund"},{"text":"维修基金","value":"maintenance_fund"},{"text":"其他","value":"other"}]},"required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"title","type":"string","meta":{"interface":"input","required":true},"schema":{"is_nullable":false,"max_length":255}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"description","type":"text","meta":{"interface":"input-multiline"}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"amount","type":"decimal","meta":{"interface":"input","required":true},"schema":{"is_nullable":false,"numeric_precision":10,"numeric_scale":2}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"paid_at","type":"timestamp","meta":{"interface":"datetime","required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"period","type":"string","meta":{"interface":"input"},"schema":{"max_length":7}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"payment_method","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"微信","value":"wechat"},{"text":"支付宝","value":"alipay"},{"text":"银行转账","value":"bank"},{"text":"现金","value":"cash"},{"text":"其他","value":"other"}]},"required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"category","type":"string","meta":{"interface":"input"},"schema":{"max_length":50}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"related_info","type":"json","meta":{"interface":"input-code","options":{"language":"json"}}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"status","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"待审核","value":"pending"},{"text":"已审核","value":"approved"},{"text":"已拒绝","value":"rejected"}]},"required":true},"schema":{"is_nullable":false,"default_value":"approved"}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"approved_by","type":"uuid","meta":{"interface":"select-dropdown-m2o"}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"approved_at","type":"timestamp","meta":{"interface":"datetime"}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"proof_files","type":"json","meta":{"interface":"list"}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"created_by","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/expenses" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"date_deleted","type":"timestamp","meta":{"hidden":true}}' > /dev/null

echo "📦 [4/6] 创建 employees 表..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "meta": {
      "collection": "employees",
      "icon": "badge",
      "note": "员工信息表（v2.0）"
    }
  }' > /dev/null && echo "✅ employees 表创建成功"

curl -s -X POST "$DIRECTUS_URL/fields/employees" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"user_created","type":"uuid","meta":{"special":["user-created"],"hidden":true}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/employees" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"date_created","type":"timestamp","meta":{"special":["date-created"],"hidden":true}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/employees" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"community_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/employees" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"name","type":"string","meta":{"interface":"input","required":true},"schema":{"is_nullable":false,"max_length":100}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/employees" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"phone","type":"string","meta":{"interface":"input"},"schema":{"max_length":20}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/employees" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"id_card_last4","type":"string","meta":{"interface":"input"},"schema":{"max_length":4}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/employees" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"position_type","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"保安","value":"security"},{"text":"保洁","value":"cleaning"},{"text":"管理","value":"management"},{"text":"电工","value":"electrician"},{"text":"水工","value":"plumber"},{"text":"绿化","value":"gardener"},{"text":"临时工","value":"temp_worker"},{"text":"其他","value":"other"}]},"required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/employees" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"position_title","type":"string","meta":{"interface":"input"},"schema":{"max_length":100}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/employees" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"employment_status","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"在职","value":"active"},{"text":"离职","value":"resigned"},{"text":"停职","value":"suspended"},{"text":"试用","value":"probation"}]},"required":true},"schema":{"is_nullable":false,"default_value":"active"}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/employees" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"hire_date","type":"date","meta":{"interface":"datetime","required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/employees" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"resignation_date","type":"date","meta":{"interface":"datetime"}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/employees" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"base_salary","type":"decimal","meta":{"interface":"input"},"schema":{"numeric_precision":10,"numeric_scale":2}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/employees" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"notes","type":"text","meta":{"interface":"input-multiline"}}' > /dev/null

echo "📦 [5/6] 创建 salary_records 表..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "salary_records",
    "meta": {
      "collection": "salary_records",
      "icon": "paid",
      "note": "工资发放记录表（v2.0）"
    }
  }' > /dev/null && echo "✅ salary_records 表创建成功"

curl -s -X POST "$DIRECTUS_URL/fields/salary_records" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"user_created","type":"uuid","meta":{"special":["user-created"],"hidden":true}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"date_created","type":"timestamp","meta":{"special":["date-created"],"hidden":true}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"employee_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"community_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"period","type":"string","meta":{"interface":"input","required":true},"schema":{"is_nullable":false,"max_length":7}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"base_salary","type":"decimal","meta":{"interface":"input","required":true},"schema":{"is_nullable":false,"numeric_precision":10,"numeric_scale":2}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"bonus","type":"decimal","meta":{"interface":"input"},"schema":{"numeric_precision":10,"numeric_scale":2,"default_value":0}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"subsidy","type":"decimal","meta":{"interface":"input"},"schema":{"numeric_precision":10,"numeric_scale":2,"default_value":0}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"deduction","type":"decimal","meta":{"interface":"input"},"schema":{"numeric_precision":10,"numeric_scale":2,"default_value":0}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"social_security","type":"decimal","meta":{"interface":"input"},"schema":{"numeric_precision":10,"numeric_scale":2,"default_value":0}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"housing_fund","type":"decimal","meta":{"interface":"input"},"schema":{"numeric_precision":10,"numeric_scale":2,"default_value":0}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"actual_amount","type":"decimal","meta":{"interface":"input","required":true},"schema":{"is_nullable":false,"numeric_precision":10,"numeric_scale":2}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"payment_date","type":"timestamp","meta":{"interface":"datetime","required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"payment_method","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"微信","value":"wechat"},{"text":"支付宝","value":"alipay"},{"text":"银行转账","value":"bank"},{"text":"现金","value":"cash"},{"text":"其他","value":"other"}]},"required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"expense_id","type":"uuid","meta":{"interface":"select-dropdown-m2o"}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"proof_files","type":"json","meta":{"interface":"list"}}' > /dev/null

echo "📦 [6/6] 创建 maintenance_fund_usage 表..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "meta": {
      "collection": "maintenance_fund_usage",
      "icon": "construction",
      "note": "维修基金使用记录表（v2.0）"
    }
  }' > /dev/null && echo "✅ maintenance_fund_usage 表创建成功"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"user_created","type":"uuid","meta":{"special":["user-created"],"hidden":true}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"date_created","type":"timestamp","meta":{"special":["date-created"],"hidden":true}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"work_order_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"community_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"project_name","type":"string","meta":{"interface":"input","required":true},"schema":{"is_nullable":false,"max_length":255}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"project_type","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"屋面维修","value":"roof_repair"},{"text":"电梯维修","value":"elevator_repair"},{"text":"外墙维修","value":"exterior_wall_repair"},{"text":"管道维修","value":"pipe_repair"},{"text":"公共设施维修","value":"facility_repair"},{"text":"消防设施维修","value":"fire_system_repair"},{"text":"其他维修","value":"other_repair"},{"text":"其他","value":"other"}]},"required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"description","type":"text","meta":{"interface":"input-multiline","required":true},"schema":{"is_nullable":false}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"contractor","type":"string","meta":{"interface":"input"},"schema":{"max_length":255}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"contract_no","type":"string","meta":{"interface":"input"},"schema":{"max_length":100}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"estimated_amount","type":"decimal","meta":{"interface":"input"},"schema":{"numeric_precision":10,"numeric_scale":2}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"actual_amount","type":"decimal","meta":{"interface":"input"},"schema":{"numeric_precision":10,"numeric_scale":2}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"approval_status","type":"string","meta":{"interface":"select-dropdown","options":{"choices":[{"text":"待审批","value":"pending"},{"text":"已批准","value":"approved"},{"text":"已拒绝","value":"rejected"},{"text":"已完成","value":"completed"}]},"required":true},"schema":{"is_nullable":false,"default_value":"pending"}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"approved_by","type":"uuid","meta":{"interface":"select-dropdown-m2o"}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"approved_at","type":"timestamp","meta":{"interface":"datetime"}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"rejection_reason","type":"text","meta":{"interface":"input-multiline"}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"usage_date","type":"timestamp","meta":{"interface":"datetime"}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"expense_id","type":"uuid","meta":{"interface":"select-dropdown-m2o"}}' > /dev/null
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"field":"proof_files","type":"json","meta":{"interface":"list"}}' > /dev/null

echo ""
echo "✅ 所有剩余表创建完成！"
echo ""
echo "📋 下一步:"
echo "1. 配置权限规则"
echo "2. 更新 TypeScript 类型定义"
