#!/bin/bash

# 检查所有数据（不带过滤）

DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"

echo "🔍 检查所有财务数据（不带过滤）..."
echo ""

# 1. 员工
echo "👷 1. 所有员工（前5个）:"
echo "---"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/employees?fields=id,name,position_title,base_salary,community_id&limit=5" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""
echo ""

# 2. 物业费账单
echo "💰 2. 所有物业费账单（前5条）:"
echo "---"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/billings?fields=id,period,billing_amount,status,community_id&limit=5" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""
echo ""

# 3. 公共收益
echo "💵 3. 所有公共收益（前5条）:"
echo "---"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/incomes?fields=id,title,amount,community_id&limit=5" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""
echo ""

# 4. 支出
echo "💸 4. 所有支出（前5条）:"
echo "---"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/expenses?fields=id,title,amount,community_id&limit=5" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""
echo ""

# 5. 维修基金账户
echo "🏦 5. 所有维修基金账户（前5个）:"
echo "---"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/maintenance_fund_accounts?fields=id,unit_number,balance,community_id&limit=5" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""
echo ""

echo "================================================"
echo "✅ 检查完成！"
echo ""
echo "请查看："
echo "1. 是否有数据返回？"
echo "2. ID 格式是什么？（UUID 还是整数）"
echo "3. community_id 的值是什么？"
