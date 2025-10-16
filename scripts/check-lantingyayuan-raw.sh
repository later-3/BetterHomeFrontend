#!/bin/bash

# 查询兰亭雅苑的现有数据（原始JSON输出）
# 社区ID: 2a5c769e-9909-4331-99b3-983c8b1175c6

DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"
COMMUNITY_ID="2a5c769e-9909-4331-99b3-983c8b1175c6"

echo "🔍 查询兰亭雅苑的现有数据（原始JSON）..."
echo ""
echo "社区ID: $COMMUNITY_ID"
echo "================================================"
echo ""

# 1. 查询业主数量和列表
echo "📊 1. 业主（resident）查询:"
echo "---"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/directus_users?filter[community_id][_eq]=${COMMUNITY_ID}&filter[user_type][_eq]=resident&fields=id,first_name,last_name,email,building_id&limit=10&meta=total_count" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"

echo ""
echo ""

# 2. 查询楼栋
echo "🏢 2. 楼栋查询:"
echo "---"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/buildings?filter[community_id][_eq]=${COMMUNITY_ID}&fields=id,name&limit=20&meta=total_count" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"

echo ""
echo ""

# 3. 查询物业费账单
echo "💰 3. 物业费账单查询:"
echo "---"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/billings?filter[community_id][_eq]=${COMMUNITY_ID}&limit=5&meta=total_count" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"

echo ""
echo ""

# 4. 查询员工
echo "👷 4. 员工查询:"
echo "---"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/employees?filter[community_id][_eq]=${COMMUNITY_ID}&limit=10&meta=total_count" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"

echo ""
echo ""

# 5. 查询支出
echo "💸 5. 支出记录查询:"
echo "---"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/expenses?filter[community_id][_eq]=${COMMUNITY_ID}&limit=5&meta=total_count" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"

echo ""
echo ""

# 6. 查询公共收益
echo "💵 6. 公共收益查询:"
echo "---"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/incomes?filter[community_id][_eq]=${COMMUNITY_ID}&limit=5&meta=total_count" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"

echo ""
echo ""

# 7. 查询维修基金账户
echo "🏦 7. 维修基金账户查询:"
echo "---"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/maintenance_fund_accounts?filter[community_id][_eq]=${COMMUNITY_ID}&limit=5&meta=total_count" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"

echo ""
echo ""
echo "================================================"
echo "✅ 查询完成！"
