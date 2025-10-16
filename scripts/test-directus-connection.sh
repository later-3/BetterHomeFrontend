#!/bin/bash

# 测试 Directus 连接和查询

DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"
COMMUNITY_ID="2a5c769e-9909-4331-99b3-983c8b1175c6"

echo "🔍 测试 Directus 连接..."
echo ""

# 测试1: 检查服务器是否运行
echo "1️⃣ 测试服务器连接:"
curl --noproxy '*' -s -o /dev/null -w "HTTP Status: %{http_code}\n" "${DIRECTUS_URL}/server/ping"
echo ""

# 测试2: 测试 token 是否有效
echo "2️⃣ 测试 Token 有效性:"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/users/me" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | head -c 200
echo ""
echo ""

# 测试3: 查询所有社区（不带过滤）
echo "3️⃣ 查询所有社区:"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/communities?fields=id,name&limit=10" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""
echo ""

# 测试4: 查询指定社区
echo "4️⃣ 查询兰亭雅苑社区信息:"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/communities/${COMMUNITY_ID}?fields=id,name" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""
echo ""

# 测试5: 查询所有用户（不带过滤）
echo "5️⃣ 查询所有用户（前5个）:"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/users?fields=id,first_name,last_name,email,community_id&limit=5" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""
echo ""

# 测试6: 查询该社区的用户（使用 users 端点）
echo "6️⃣ 查询兰亭雅苑的用户（使用 users 端点）:"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/users?filter[community_id][_eq]=${COMMUNITY_ID}&fields=id,first_name,last_name,email&limit=10" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""
echo ""

# 测试7: 查询所有楼栋（不带过滤）
echo "7️⃣ 查询所有楼栋（前5个）:"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/buildings?fields=id,name,community_id&limit=5" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""
echo ""

# 测试8: 查询该社区的楼栋
echo "8️⃣ 查询兰亭雅苑的楼栋:"
curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/buildings?filter[community_id][_eq]=${COMMUNITY_ID}&fields=id,name&limit=10" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json"
echo ""
echo ""

echo "================================================"
echo "✅ 测试完成！"
echo ""
echo "📋 请检查上面的输出："
echo "   - 如果看到 HTTP Status: 200，说明服务器正常"
echo "   - 如果看到用户信息，说明 token 有效"
echo "   - 如果看到社区列表，说明可以访问数据"
echo "   - 如果某些查询返回空数组 []，说明该社区确实没有数据"
