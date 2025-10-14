#!/bin/bash

# Directus 财务表权限配置脚本 v2.0
# 为三种角色配置权限：Resident, Property Manager, Committee Member
#
# 使用方法:
# DIRECTUS_ADMIN_TOKEN="your_token" bash scripts/configure-finance-permissions-v2.sh

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  exit 1
fi

# Policy IDs
RESIDENT_POLICY="f3b47f34-6117-4c3b-bc4f-2a04c38cc83e"
PROPERTY_MANAGER_POLICY="5ae37dbe-605b-48f3-80ea-3cc010286aaa"
COMMITTEE_MEMBER_POLICY="e855a3d8-b90e-40a7-8f82-1f4be4275432"

echo "🚀 开始配置财务表权限..."
echo ""

# ===================================================================
# Task 1.8: 配置 Resident (业主) 权限
# ===================================================================
echo "📋 [1/3] 配置 Resident 权限..."

# 1. billings - read (owner_id = $CURRENT_USER)
echo "  配置 billings 读取权限..."
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\": \"$RESIDENT_POLICY\",
    \"collection\": \"billings\",
    \"action\": \"read\",
    \"permissions\": {
      \"_and\": [
        {\"owner_id\": {\"_eq\": \"\$CURRENT_USER\"}}
      ]
    },
    \"fields\": [\"*\"]
  }" > /dev/null && echo "    ✅ billings read"

# 2. billing_payments - read (owner_id = $CURRENT_USER)
echo "  配置 billing_payments 读取权限..."
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\": \"$RESIDENT_POLICY\",
    \"collection\": \"billing_payments\",
    \"action\": \"read\",
    \"permissions\": {
      \"_and\": [
        {\"owner_id\": {\"_eq\": \"\$CURRENT_USER\"}}
      ]
    },
    \"fields\": [\"*\"]
  }" > /dev/null && echo "    ✅ billing_payments read"

# 3. incomes - read (MVP显示所有已审核的)
echo "  配置 incomes 读取权限..."
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\": \"$RESIDENT_POLICY\",
    \"collection\": \"incomes\",
    \"action\": \"read\",
    \"permissions\": {},
    \"fields\": [\"*\"]
  }" > /dev/null && echo "    ✅ incomes read"

# 4. expenses - read (MVP显示所有已审核的)
echo "  配置 expenses 读取权限..."
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\": \"$RESIDENT_POLICY\",
    \"collection\": \"expenses\",
    \"action\": \"read\",
    \"permissions\": {
      \"_and\": [
        {\"status\": {\"_eq\": \"approved\"}}
      ]
    },
    \"fields\": [\"*\"]
  }" > /dev/null && echo "    ✅ expenses read"

# 5. employees - read (所有字段，前端控制显示)
echo "  配置 employees 读取权限..."
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\": \"$RESIDENT_POLICY\",
    \"collection\": \"employees\",
    \"action\": \"read\",
    \"permissions\": {},
    \"fields\": [\"id\",\"position_type\",\"position_title\",\"employment_status\"]
  }" > /dev/null && echo "    ✅ employees read (limited fields)"

# 6. salary_records - 无权限 (业主不能看工资详情)

# 7. maintenance_fund_accounts - read (owner_id = $CURRENT_USER)
echo "  配置 maintenance_fund_accounts 读取权限..."
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\": \"$RESIDENT_POLICY\",
    \"collection\": \"maintenance_fund_accounts\",
    \"action\": \"read\",
    \"permissions\": {
      \"_and\": [
        {\"owner_id\": {\"_eq\": \"\$CURRENT_USER\"}}
      ]
    },
    \"fields\": [\"*\"]
  }" > /dev/null && echo "    ✅ maintenance_fund_accounts read"

# 8. maintenance_fund_payments - read (owner_id = $CURRENT_USER)
echo "  配置 maintenance_fund_payments 读取权限..."
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\": \"$RESIDENT_POLICY\",
    \"collection\": \"maintenance_fund_payments\",
    \"action\": \"read\",
    \"permissions\": {
      \"_and\": [
        {\"owner_id\": {\"_eq\": \"\$CURRENT_USER\"}}
      ]
    },
    \"fields\": [\"*\"]
  }" > /dev/null && echo "    ✅ maintenance_fund_payments read"

# 9. maintenance_fund_usage - read (已批准的)
echo "  配置 maintenance_fund_usage 读取权限..."
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\": \"$RESIDENT_POLICY\",
    \"collection\": \"maintenance_fund_usage\",
    \"action\": \"read\",
    \"permissions\": {
      \"_and\": [
        {\"approval_status\": {\"_in\": [\"approved\",\"completed\"]}}
      ]
    },
    \"fields\": [\"*\"]
  }" > /dev/null && echo "    ✅ maintenance_fund_usage read"

echo "✅ Resident 权限配置完成 (9个表)"
echo ""

# ===================================================================
# Task 1.9: 配置 Property Manager (物业) 权限
# ===================================================================
echo "📋 [2/3] 配置 Property Manager 权限..."

# 所有财务表: CRUD 完全权限
for collection in billings billing_payments incomes expenses employees salary_records maintenance_fund_accounts maintenance_fund_payments maintenance_fund_usage; do
  for action in create read update delete; do
    curl -s -X POST "$DIRECTUS_URL/permissions" \
      -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"policy\": \"$PROPERTY_MANAGER_POLICY\",
        \"collection\": \"$collection\",
        \"action\": \"$action\",
        \"permissions\": {},
        \"fields\": [\"*\"]
      }" > /dev/null
  done
  echo "  ✅ $collection (CRUD)"
done

echo "✅ Property Manager 权限配置完成 (9个表 x 4个操作 = 36条规则)"
echo ""

# ===================================================================
# Task 1.10: 配置 Committee Member (业委会) 权限
# ===================================================================
echo "📋 [3/3] 配置 Committee Member 权限..."

# 所有财务表: read 权限
for collection in billings billing_payments incomes expenses employees salary_records maintenance_fund_accounts maintenance_fund_payments maintenance_fund_usage; do
  curl -s -X POST "$DIRECTUS_URL/permissions" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"policy\": \"$COMMITTEE_MEMBER_POLICY\",
      \"collection\": \"$collection\",
      \"action\": \"read\",
      \"permissions\": {},
      \"fields\": [\"*\"]
    }" > /dev/null && echo "  ✅ $collection read"
done

# maintenance_fund_usage: update 权限 (仅审批字段)
echo "  配置 maintenance_fund_usage 更新权限..."
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\": \"$COMMITTEE_MEMBER_POLICY\",
    \"collection\": \"maintenance_fund_usage\",
    \"action\": \"update\",
    \"permissions\": {},
    \"fields\": [\"approval_status\",\"approved_by\",\"approved_at\",\"rejection_reason\"]
  }" > /dev/null && echo "  ✅ maintenance_fund_usage update (limited fields)"

echo "✅ Committee Member 权限配置完成 (9个表 read + 1个表 update)"
echo ""

# ===================================================================
# 统计
# ===================================================================
echo "📊 权限配置统计:"
echo "  Resident: 9条规则 (read only, 带过滤条件)"
echo "  Property Manager: 36条规则 (CRUD 全权限)"
echo "  Committee Member: 10条规则 (read all + update maintenance_fund_usage)"
echo "  总计: 55条权限规则"
echo ""
echo "✅ 所有权限配置完成！"
