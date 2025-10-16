#!/bin/bash

# 统计兰亭雅苑的数据（使用不同的查询方法）

DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"
COMMUNITY_ID="2a5c769e-9909-4331-99b3-983c8b1175c6"

echo "📊 统计兰亭雅苑的数据..."
echo ""
echo "社区ID: $COMMUNITY_ID"
echo "社区名称: 兰亭雅苑"
echo "================================================"
echo ""

# 1. 统计所有用户，然后过滤
echo "👥 1. 统计用户数量:"
ALL_USERS=$(curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/users?fields=id,first_name,last_name,email,community_id,user_type&limit=1000" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json")

# 统计兰亭雅苑的用户
LANTINGYAYUAN_USERS=$(echo "$ALL_USERS" | jq -r ".data[] | select(.community_id == \"${COMMUNITY_ID}\")")
TOTAL_USERS=$(echo "$LANTINGYAYUAN_USERS" | jq -s 'length')
RESIDENT_USERS=$(echo "$LANTINGYAYUAN_USERS" | jq -s '[.[] | select(.user_type == "resident")] | length')

echo "   总用户数: $TOTAL_USERS"
echo "   业主数量: $RESIDENT_USERS"
echo ""

# 显示前10个业主
echo "   业主列表（前10个）:"
echo "$LANTINGYAYUAN_USERS" | jq -s '[.[] | select(.user_type == "resident")] | .[0:10] | .[] | "     - \(.first_name // "未设置") (\(.email))"' -r
echo ""

# 2. 统计楼栋
echo "🏢 2. 统计楼栋数量:"
ALL_BUILDINGS=$(curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/buildings?fields=id,name,community_id&limit=1000" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json")

LANTINGYAYUAN_BUILDINGS=$(echo "$ALL_BUILDINGS" | jq -r ".data[] | select(.community_id == \"${COMMUNITY_ID}\")")
TOTAL_BUILDINGS=$(echo "$LANTINGYAYUAN_BUILDINGS" | jq -s 'length')

echo "   楼栋数量: $TOTAL_BUILDINGS"
echo ""
echo "   楼栋列表:"
echo "$LANTINGYAYUAN_BUILDINGS" | jq -s '.[] | "     - \(.name) (ID: \(.id))"' -r
echo ""

# 3. 统计现有财务数据
echo "💰 3. 统计现有财务数据:"

# 物业费账单
BILLINGS_COUNT=$(curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/billings?fields=id,community_id&limit=1000" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | jq -r ".data[] | select(.community_id == \"${COMMUNITY_ID}\")" | jq -s 'length')
echo "   物业费账单: $BILLINGS_COUNT 条"

# 员工
EMPLOYEES_COUNT=$(curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/employees?fields=id,community_id&limit=1000" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | jq -r ".data[] | select(.community_id == \"${COMMUNITY_ID}\")" | jq -s 'length')
echo "   员工记录: $EMPLOYEES_COUNT 条"

# 支出
EXPENSES_COUNT=$(curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/expenses?fields=id,community_id&limit=1000" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | jq -r ".data[] | select(.community_id == \"${COMMUNITY_ID}\")" | jq -s 'length')
echo "   支出记录: $EXPENSES_COUNT 条"

# 公共收益
INCOMES_COUNT=$(curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/incomes?fields=id,community_id&limit=1000" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | jq -r ".data[] | select(.community_id == \"${COMMUNITY_ID}\")" | jq -s 'length')
echo "   公共收益: $INCOMES_COUNT 条"

# 维修基金账户
MF_ACCOUNTS_COUNT=$(curl --noproxy '*' -s -X GET "${DIRECTUS_URL}/items/maintenance_fund_accounts?fields=id,community_id&limit=1000" \
  -H "Authorization: Bearer ${DIRECTUS_TOKEN}" \
  -H "Content-Type: application/json" | jq -r ".data[] | select(.community_id == \"${COMMUNITY_ID}\")" | jq -s 'length')
echo "   维修基金账户: $MF_ACCOUNTS_COUNT 条"

echo ""
echo "================================================"
echo "✅ 统计完成！"
echo ""
echo "📋 数据摘要:"
echo "   - 业主数量: $RESIDENT_USERS 户"
echo "   - 楼栋数量: $TOTAL_BUILDINGS 栋"
echo "   - 现有财务数据: $BILLINGS_COUNT 条账单, $EMPLOYEES_COUNT 名员工, $EXPENSES_COUNT 条支出, $INCOMES_COUNT 条收益"
echo ""
echo "💡 建议方案:"
if [ "$RESIDENT_USERS" -ge 20 ]; then
    echo "   ✅ 业主数量充足（$RESIDENT_USERS 户），推荐方案B（完整演示方案）"
    echo "   - 使用全部 $RESIDENT_USERS 户业主"
    echo "   - 创建 6-8 名虚拟员工"
    echo "   - 生成 12 个月财务数据"
    echo "   - 预计数据量: 约 1,000+ 条记录"
elif [ "$RESIDENT_USERS" -ge 10 ]; then
    echo "   ✅ 业主数量适中（$RESIDENT_USERS 户），推荐方案B（调整版）"
    echo "   - 使用全部 $RESIDENT_USERS 户业主"
    echo "   - 创建 4-6 名虚拟员工"
    echo "   - 生成 6-12 个月财务数据"
    echo "   - 预计数据量: 约 500-800 条记录"
else
    echo "   ✅ 业主数量较少（$RESIDENT_USERS 户），推荐方案A（MVP）"
    echo "   - 使用全部 $RESIDENT_USERS 户业主"
    echo "   - 创建 4 名虚拟员工"
    echo "   - 生成 3-6 个月财务数据"
    echo "   - 预计数据量: 约 200-400 条记录"
fi
