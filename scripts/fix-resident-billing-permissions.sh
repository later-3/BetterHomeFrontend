#!/bin/bash

# 修复 resident 角色访问 billing 表的权限问题
#
# 使用方法:
# DIRECTUS_ADMIN_TOKEN="your_token" bash scripts/fix-resident-billing-permissions.sh

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  echo "   示例: DIRECTUS_ADMIN_TOKEN=\"your_token\" bash scripts/fix-resident-billing-permissions.sh"
  exit 1
fi

echo "🔧 开始修复 resident 角色的 billing 权限..."
echo ""

# 1. 获取 resident 角色
echo "📋 1. 获取 resident 角色..."
RESIDENT_ROLE=$(curl -s "$DIRECTUS_URL/roles?filter[name][_eq]=resident" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | jq -r '.data[0]')

if [ "$RESIDENT_ROLE" == "null" ]; then
  echo "   ❌ 未找到 resident 角色"
  exit 1
fi

RESIDENT_ROLE_ID=$(echo $RESIDENT_ROLE | jq -r '.id')
echo "   ✅ Resident 角色 ID: $RESIDENT_ROLE_ID"

# 2. 获取或创建 policy
echo ""
echo "📋 2. 获取或创建 resident policy..."
RESIDENT_POLICIES=$(echo $RESIDENT_ROLE | jq -r '.policies[]' 2>/dev/null)

if [ -z "$RESIDENT_POLICIES" ] || [ "$RESIDENT_POLICIES" == "null" ]; then
  echo "   创建新的 resident policy..."
  POLICY_RESPONSE=$(curl -s -X POST "$DIRECTUS_URL/policies" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Resident Policy\",
      \"icon\": \"person\",
      \"description\": \"业主/住户权限策略\",
      \"admin_access\": false,
      \"app_access\": true
    }")
  
  RESIDENT_POLICY=$(echo $POLICY_RESPONSE | jq -r '.data.id')
  
  # 关联 policy 到 role
  curl -s -X PATCH "$DIRECTUS_URL/roles/$RESIDENT_ROLE_ID" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"policies\": [\"$RESIDENT_POLICY\"]}" > /dev/null
  
  echo "   ✅ 创建并关联 policy: $RESIDENT_POLICY"
else
  RESIDENT_POLICY=$(echo $RESIDENT_POLICIES | head -n 1)
  echo "   ✅ 使用现有 policy: $RESIDENT_POLICY"
fi

# 3. 删除旧的 billings 权限（避免冲突）
echo ""
echo "📋 3. 清理旧的 billings 权限..."
OLD_PERMS=$(curl -s "$DIRECTUS_URL/permissions?filter[collection][_eq]=billings&filter[policy][_eq]=$RESIDENT_POLICY" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | jq -r '.data[].id')

if [ ! -z "$OLD_PERMS" ]; then
  for perm_id in $OLD_PERMS; do
    curl -s -X DELETE "$DIRECTUS_URL/permissions/$perm_id" \
      -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" > /dev/null
    echo "   🗑️  删除旧权限: $perm_id"
  done
fi

# 4. 创建 billings 表读权限
echo ""
echo "📋 4. 创建 billings 表读权限..."
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
  }" > /dev/null && echo "   ✅ billings 读权限配置成功"

# 5. 配置关联表权限
echo ""
echo "📋 5. 配置关联表权限..."

# communities 表
echo "   配置 communities 表..."
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\": \"$RESIDENT_POLICY\",
    \"collection\": \"communities\",
    \"action\": \"read\",
    \"permissions\": {
      \"_and\": [
        {\"id\": {\"_eq\": \"\$CURRENT_USER.community_id\"}}
      ]
    },
    \"fields\": [\"id\", \"name\"]
  }" > /dev/null && echo "      ✅ communities 读权限配置成功"

# buildings 表
echo "   配置 buildings 表..."
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\": \"$RESIDENT_POLICY\",
    \"collection\": \"buildings\",
    \"action\": \"read\",
    \"permissions\": {
      \"_and\": [
        {\"community_id\": {\"_eq\": \"\$CURRENT_USER.community_id\"}}
      ]
    },
    \"fields\": [\"id\", \"name\", \"community_id\"]
  }" > /dev/null && echo "      ✅ buildings 读权限配置成功"

# directus_users 表（只能读自己的信息）
echo "   配置 directus_users 表..."
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\": \"$RESIDENT_POLICY\",
    \"collection\": \"directus_users\",
    \"action\": \"read\",
    \"permissions\": {
      \"_and\": [
        {\"id\": {\"_eq\": \"\$CURRENT_USER\"}}
      ]
    },
    \"fields\": [\"id\", \"first_name\", \"last_name\", \"email\"]
  }" > /dev/null && echo "      ✅ directus_users 读权限配置成功"

# 6. 配置 billing_payments 表权限（如果存在）
echo ""
echo "📋 6. 配置 billing_payments 表权限..."
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
  }" > /dev/null && echo "   ✅ billing_payments 读权限配置成功"

# 7. 配置 incomes 表权限
echo ""
echo "📋 7. 配置 incomes 表权限..."
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\": \"$RESIDENT_POLICY\",
    \"collection\": \"incomes\",
    \"action\": \"read\",
    \"permissions\": {
      \"_and\": [
        {\"community_id\": {\"_eq\": \"\$CURRENT_USER.community_id\"}}
      ]
    },
    \"fields\": [\"*\"]
  }" > /dev/null && echo "   ✅ incomes 读权限配置成功"

# 8. 配置 expenses 表权限
echo ""
echo "📋 8. 配置 expenses 表权限..."
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\": \"$RESIDENT_POLICY\",
    \"collection\": \"expenses\",
    \"action\": \"read\",
    \"permissions\": {
      \"_and\": [
        {\"community_id\": {\"_eq\": \"\$CURRENT_USER.community_id\"}},
        {\"status\": {\"_eq\": \"approved\"}}
      ]
    },
    \"fields\": [\"*\"]
  }" > /dev/null && echo "   ✅ expenses 读权限配置成功"

echo ""
echo "✅ 权限修复完成！"
echo ""
echo "📋 下一步操作："
echo "1. 在 Directus Admin 中检查权限配置"
echo "   访问: $DIRECTUS_URL/admin/settings/roles/$RESIDENT_ROLE_ID"
echo ""
echo "2. 使用 resident 用户登录测试"
echo "   - 登录应用"
echo "   - 访问 Profile 页面"
echo "   - 点击 '查看小区收支情况'"
echo "   - 应该能正常显示数据"
echo ""
echo "3. 如果仍然有问题，运行诊断脚本："
echo "   bash scripts/diagnose-billing-permissions.sh"
echo ""
