#!/bin/bash

# 验证已创建的数据

DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"
COMMUNITY_ID="2a5c769e-9909-4331-99b3-983c8b1175c6"

echo "🔍 验证已创建的数据..."
echo ""

# 1. 验证员工
echo "👷 1. 员工数据:"
EMPLOYEES=$(curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/employees?filter[community_id][_eq]=${COMMUNITY_ID}&fields=id,name,position_title,base_salary&limit=10" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json")

echo "$EMPLOYEES" | jq -r '.data[] | "   ✅ \(.name) - \(.position_title) - \(.base_salary)元"'
EMPLOYEE_COUNT=$(echo "$EMPLOYEES" | jq -r '.data | length')
echo "   总计: $EMPLOYEE_COUNT 人"
echo ""

# 2. 验证物业费账单（查看ID类型）
echo "💰 2. 物业费账单（前3条）:"
BILLINGS=$(curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/billings?filter[community_id][_eq]=${COMMUNITY_ID}&fields=id,period,billing_amount,status&limit=3" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json")

echo "$BILLINGS" | jq -r '.data[] | "   ID: \(.id) | 账期: \(.period) | 金额: \(.billing_amount) | 状态: \(.status)"'
BILLING_COUNT=$(curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/billings?filter[community_id][_eq]=${COMMUNITY_ID}&aggregate[count]=id" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.data[0].count // 0')
echo "   总计: $BILLING_COUNT 条"
echo ""

# 3. 验证公共收益
echo "💵 3. 公共收益:"
INCOME_COUNT=$(curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/incomes?filter[community_id][_eq]=${COMMUNITY_ID}&aggregate[count]=id" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.data[0].count // 0')
echo "   总计: $INCOME_COUNT 条"
echo ""

# 4. 验证支出
echo "💸 4. 支出记录:"
EXPENSE_COUNT=$(curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/expenses?filter[community_id][_eq]=${COMMUNITY_ID}&aggregate[count]=id" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.data[0].count // 0')
echo "   总计: $EXPENSE_COUNT 条"
echo ""

# 5. 验证维修基金账户（查看ID类型）
echo "🏦 5. 维修基金账户（前3个）:"
MF_ACCOUNTS=$(curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/maintenance_fund_accounts?filter[community_id][_eq]=${COMMUNITY_ID}&fields=id,unit_number,balance&limit=3" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json")

echo "$MF_ACCOUNTS" | jq -r '.data[] | "   ID: \(.id) | 房号: \(.unit_number) | 余额: \(.balance)"'
MF_ACCOUNT_COUNT=$(curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/maintenance_fund_accounts?filter[community_id][_eq]=${COMMUNITY_ID}&aggregate[count]=id" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.data[0].count // 0')
echo "   总计: $MF_ACCOUNT_COUNT 个"
echo ""

echo "================================================"
echo "📊 数据摘要:"
echo "   ✅ 员工: $EMPLOYEE_COUNT 人"
echo "   ✅ 物业费账单: $BILLING_COUNT 条"
echo "   ✅ 公共收益: $INCOME_COUNT 条"
echo "   ✅ 支出记录: $EXPENSE_COUNT 条"
echo "   ✅ 维修基金账户: $MF_ACCOUNT_COUNT 个"
echo ""
echo "   ❌ 物业费收款: 0 条（需要修复）"
echo "   ❌ 工资记录: 0 条（需要修复）"
echo "   ❌ 维修基金缴纳: 0 条（需要修复）"
echo ""
echo "💡 下一步:"
echo "   1. 检查 ID 类型（UUID 还是整数）"
echo "   2. 修复脚本中的 ID 引用问题"
echo "   3. 修复工资总额计算问题"
echo "   4. 重新运行失败的部分"
