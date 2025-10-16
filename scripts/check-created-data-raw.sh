#!/bin/bash

# 检查已创建的数据（原始JSON）

DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"
COMMUNITY_ID="2a5c769e-9909-4331-99b3-983c8b1175c6"

echo "🔍 检查已创建的数据..."
echo ""

# 1. 员工
echo "👷 1. 员工数据:"
echo "---"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/employees?filter[community_id][_eq]=${COMMUNITY_ID}&fields=id,name,position_title,base_salary&limit=5" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""
echo ""

# 2. 物业费账单（查看ID格式）
echo "💰 2. 物业费账单（前3条，查看ID格式）:"
echo "---"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/billings?filter[community_id][_eq]=${COMMUNITY_ID}&fields=id,period,billing_amount,status&limit=3" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""
echo ""

# 3. 维修基金账户（查看ID格式）
echo "🏦 3. 维修基金账户（前3个，查看ID格式）:"
echo "---"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/maintenance_fund_accounts?filter[community_id][_eq]=${COMMUNITY_ID}&fields=id,unit_number,balance&limit=3" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""
echo ""

# 4. 统计数量
echo "📊 4. 数据统计:"
echo "---"

echo -n "员工: "
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/employees?filter[community_id][_eq]=${COMMUNITY_ID}&aggregate[count]=id" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""

echo -n "物业费账单: "
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/billings?filter[community_id][_eq]=${COMMUNITY_ID}&aggregate[count]=id" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""

echo -n "公共收益: "
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/incomes?filter[community_id][_eq]=${COMMUNITY_ID}&aggregate[count]=id" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""

echo -n "支出记录: "
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/expenses?filter[community_id][_eq]=${COMMUNITY_ID}&aggregate[count]=id" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""

echo -n "维修基金账户: "
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/maintenance_fund_accounts?filter[community_id][_eq]=${COMMUNITY_ID}&aggregate[count]=id" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""

echo ""
echo "================================================"
echo "✅ 检查完成！"
echo ""
echo "请查看上面的输出："
echo "1. 员工、账单、账户的 ID 是什么格式？（UUID 还是整数）"
echo "2. 数据数量是否正确？"
