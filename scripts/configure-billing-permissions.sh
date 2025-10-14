#!/bin/bash

# Directus 财务表权限配置脚本
#
# 使用方法:
# DIRECTUS_ADMIN_TOKEN="your_token" bash scripts/configure-billing-permissions.sh

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  exit 1
fi

echo "🔐 开始配置财务表权限..."
echo ""

# 角色ID（从API查询获得）
RESIDENT_ROLE="e30e1f74-dd04-46c6-90ed-4162852b5da4"
PROPERTY_MANAGER_ROLE="6e140b9d-0d9e-4050-8bb1-58ccfa8fba32"
COMMITTEE_MEMBER_ROLE="b3902de4-2dd2-4c3b-891c-ec09d6d23b99"

# 获取角色的policy ID
echo "📋 获取角色策略ID..."

RESIDENT_POLICY=$(curl -s "http://localhost:8055/roles/$RESIDENT_ROLE" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | grep -o '"policies":\["[^"]*"' | cut -d'"' -f4)

PROPERTY_MANAGER_POLICY=$(curl -s "http://localhost:8055/roles/$PROPERTY_MANAGER_ROLE" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | grep -o '"policies":\["[^"]*"' | cut -d'"' -f4)

COMMITTEE_MEMBER_POLICY=$(curl -s "http://localhost:8055/roles/$COMMITTEE_MEMBER_ROLE" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | grep -o '"policies":\["[^"]*"' | cut -d'"' -f4)

# 如果没有policy，创建一个
if [ -z "$PROPERTY_MANAGER_POLICY" ]; then
  echo "  创建 Property Manager 策略..."
  PROPERTY_MANAGER_POLICY=$(curl -s -X POST "http://localhost:8055/policies" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Property Manager Policy\",\"icon\":\"admin_panel_settings\",\"description\":\"物业管理员权限策略\",\"roles\":[\"$PROPERTY_MANAGER_ROLE\"]}" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$COMMITTEE_MEMBER_POLICY" ]; then
  echo "  创建 Committee Member 策略..."
  COMMITTEE_MEMBER_POLICY=$(curl -s -X POST "http://localhost:8055/policies" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Committee Member Policy\",\"icon\":\"policy\",\"description\":\"业委会权限策略\",\"roles\":[\"$COMMITTEE_MEMBER_ROLE\"]}" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
fi

echo "  ✅ Resident Policy: $RESIDENT_POLICY"
echo "  ✅ Property Manager Policy: $PROPERTY_MANAGER_POLICY"
echo "  ✅ Committee Member Policy: $COMMITTEE_MEMBER_POLICY"

echo ""
echo "🔑 配置 billings 表权限..."

# Resident - billings 只读自己的
echo "  配置 resident 对 billings 的权限..."
curl -s -X POST "http://localhost:8055/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\":\"$RESIDENT_POLICY\",
    \"collection\":\"billings\",
    \"action\":\"read\",
    \"permissions\":{\"_and\":[{\"owner_id\":{\"_eq\":\"\$CURRENT_USER\"}}]},
    \"fields\":[\"*\"]
  }" > /dev/null && echo "    ✅ resident 读取权限配置成功"

# Property Manager - billings 全部权限
echo "  配置 property_manager 对 billings 的权限..."
for action in create read update delete; do
  curl -s -X POST "http://localhost:8055/permissions" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"policy\":\"$PROPERTY_MANAGER_POLICY\",
      \"collection\":\"billings\",
      \"action\":\"$action\",
      \"permissions\":{},
      \"fields\":[\"*\"]
    }" > /dev/null && echo "    ✅ property_manager $action 权限配置成功"
done

# Committee Member - billings 只读
echo "  配置 committee_member 对 billings 的权限..."
curl -s -X POST "http://localhost:8055/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\":\"$COMMITTEE_MEMBER_POLICY\",
    \"collection\":\"billings\",
    \"action\":\"read\",
    \"permissions\":{},
    \"fields\":[\"*\"]
  }" > /dev/null && echo "    ✅ committee_member 读取权限配置成功"

echo ""
echo "🔑 配置 expenses 表权限..."

# Resident - expenses 只读已审核的
echo "  配置 resident 对 expenses 的权限..."
curl -s -X POST "http://localhost:8055/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\":\"$RESIDENT_POLICY\",
    \"collection\":\"expenses\",
    \"action\":\"read\",
    \"permissions\":{\"_and\":[{\"community_id\":{\"_eq\":\"\$CURRENT_USER.community_id\"}},{\"status\":{\"_eq\":\"approved\"}}]},
    \"fields\":[\"*\"]
  }" > /dev/null && echo "    ✅ resident 读取权限配置成功"

# Property Manager - expenses 全部权限
echo "  配置 property_manager 对 expenses 的权限..."
for action in create read update delete; do
  curl -s -X POST "http://localhost:8055/permissions" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"policy\":\"$PROPERTY_MANAGER_POLICY\",
      \"collection\":\"expenses\",
      \"action\":\"$action\",
      \"permissions\":{},
      \"fields\":[\"*\"]
    }" > /dev/null && echo "    ✅ property_manager $action 权限配置成功"
done

# Committee Member - expenses 读取和更新（审核）
echo "  配置 committee_member 对 expenses 的权限..."
curl -s -X POST "http://localhost:8055/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\":\"$COMMITTEE_MEMBER_POLICY\",
    \"collection\":\"expenses\",
    \"action\":\"read\",
    \"permissions\":{},
    \"fields\":[\"*\"]
  }" > /dev/null && echo "    ✅ committee_member 读取权限配置成功"

curl -s -X POST "http://localhost:8055/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"policy\":\"$COMMITTEE_MEMBER_POLICY\",
    \"collection\":\"expenses\",
    \"action\":\"update\",
    \"permissions\":{},
    \"fields\":[\"status\",\"approved_by\",\"approved_at\"]
  }" > /dev/null && echo "    ✅ committee_member 更新权限（仅审核字段）配置成功"

echo ""
echo "✅ 权限配置完成！"
echo ""
echo "📋 验证权限:"
echo "1. 访问 http://localhost:8055/admin/settings/roles"
echo "2. 检查每个角色的 Permissions"
echo "3. 确认 billings 和 expenses 的权限设置正确"
