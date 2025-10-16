#!/bin/bash

# 查询兰亭雅苑的现有数据
# 社区ID: 2a5c769e-9909-4331-99b3-983c8b1175c6

DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"
COMMUNITY_ID="2a5c769e-9909-4331-99b3-983c8b1175c6"

echo "🔍 查询兰亭雅苑的现有数据..."
echo ""
echo "社区ID: $COMMUNITY_ID"
echo "================================================"
echo ""

# 1. 查询业主数量
echo "📊 1. 业主（resident）数量:"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/directus_users?filter[community_id][_eq]=${COMMUNITY_ID}&filter[user_type][_eq]=resident&aggregate[count]=id" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.data[0].count // 0'

echo ""

# 2. 查询业主列表（前10个）
echo "📋 2. 业主列表（前10个）:"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/directus_users?filter[community_id][_eq]=${COMMUNITY_ID}&filter[user_type][_eq]=resident&fields=id,first_name,last_name,email,building_id&limit=10" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.data[] | "  - \(.first_name // "未设置") \(.last_name // "未设置") (\(.email))"'

echo ""

# 3. 查询楼栋数量
echo "🏢 3. 楼栋数量:"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/buildings?filter[community_id][_eq]=${COMMUNITY_ID}&aggregate[count]=id" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.data[0].count // 0'

echo ""

# 4. 查询楼栋列表
echo "🏢 4. 楼栋列表:"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/buildings?filter[community_id][_eq]=${COMMUNITY_ID}&fields=id,name&limit=20" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.data[] | "  - \(.name) (ID: \(.id))"'

echo ""

# 5. 查询现有的物业费账单数量
echo "💰 5. 现有物业费账单数量:"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/billings?filter[community_id][_eq]=${COMMUNITY_ID}&aggregate[count]=id" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.data[0].count // 0'

echo ""

# 6. 查询现有的员工数量
echo "👷 6. 现有员工数量:"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/employees?filter[community_id][_eq]=${COMMUNITY_ID}&aggregate[count]=id" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.data[0].count // 0'

echo ""

# 7. 查询现有的支出记录数量
echo "💸 7. 现有支出记录数量:"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/expenses?filter[community_id][_eq]=${COMMUNITY_ID}&aggregate[count]=id" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.data[0].count // 0'

echo ""

# 8. 查询现有的公共收益数量
echo "💵 8. 现有公共收益数量:"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/incomes?filter[community_id][_eq]=${COMMUNITY_ID}&aggregate[count]=id" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.data[0].count // 0'

echo ""

# 9. 查询现有的维修基金账户数量
echo "🏦 9. 现有维修基金账户数量:"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/maintenance_fund_accounts?filter[community_id][_eq]=${COMMUNITY_ID}&aggregate[count]=id" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | jq -r '.data[0].count // 0'

echo ""
echo "================================================"
echo "✅ 查询完成！"
echo ""
echo "📋 根据以上数据，我会为你推荐合适的数据生成方案。"
