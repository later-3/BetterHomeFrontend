#!/bin/bash

# 修复财务表权限配置
# 使用方法: DIRECTUS_ADMIN_TOKEN="your_token" bash scripts/fix-billing-permissions.sh

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  exit 1
fi

echo "🔐 修复财务表权限配置..."
echo ""

# 角色ID
RESIDENT_ROLE="e30e1f74-dd04-46c6-90ed-4162852b5da4"
PROPERTY_MANAGER_ROLE="6e140b9d-0d9e-4050-8bb1-58ccfa8fba32"
COMMITTEE_MEMBER_ROLE="b3902de4-2dd2-4c3b-891c-ec09d6d23b99"

# 获取 resident 的 policy ID (通过查询获取)
echo "  查询 Resident Policy..."
RESIDENT_POLICY=$(curl -s "$DIRECTUS_URL/policies" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | python3 -c "import sys,json; data=json.load(sys.stdin); policies=[p for p in data['data'] if p.get('name')=='resident']; print(policies[0]['id'] if policies else '')" 2>/dev/null)

if [ -z "$RESIDENT_POLICY" ]; then
  echo "  ❌ 错误: 无法找到 resident policy"
  exit 1
fi

echo "📋 创建或获取 Policy..."

# 为 Property Manager 创建 policy
echo "  创建 Property Manager Policy..."
PM_POLICY_RESULT=$(curl -s -X POST "$DIRECTUS_URL/policies" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Property Manager Policy\",\"icon\":\"admin_panel_settings\",\"description\":\"物业管理员权限策略\",\"app_access\":true,\"admin_access\":false}")

PROPERTY_MANAGER_POLICY=$(echo "$PM_POLICY_RESULT" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data.get('data',{}).get('id',''))" 2>/dev/null)

if [ -z "$PROPERTY_MANAGER_POLICY" ]; then
  echo "  ⚠️  Property Manager Policy 可能已存在，尝试通过名称查询..."
  PROPERTY_MANAGER_POLICY=$(curl -s "$DIRECTUS_URL/policies" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | python3 -c "import sys,json; data=json.load(sys.stdin); policies=[p for p in data['data'] if p.get('name')=='Property Manager Policy']; print(policies[0]['id'] if policies else '')" 2>/dev/null)
fi

# 为 Committee Member 创建 policy
echo "  创建 Committee Member Policy..."
CM_POLICY_RESULT=$(curl -s -X POST "$DIRECTUS_URL/policies" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Committee Member Policy\",\"icon\":\"policy\",\"description\":\"业委会权限策略\",\"app_access\":true,\"admin_access\":false}")

COMMITTEE_MEMBER_POLICY=$(echo "$CM_POLICY_RESULT" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data.get('data',{}).get('id',''))" 2>/dev/null)

if [ -z "$COMMITTEE_MEMBER_POLICY" ]; then
  echo "  ⚠️  Committee Member Policy 可能已存在，尝试通过名称查询..."
  COMMITTEE_MEMBER_POLICY=$(curl -s "$DIRECTUS_URL/policies" -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | python3 -c "import sys,json; data=json.load(sys.stdin); policies=[p for p in data['data'] if p.get('name')=='Committee Member Policy']; print(policies[0]['id'] if policies else '')" 2>/dev/null)
fi

echo "  ✅ Resident Policy: $RESIDENT_POLICY"
echo "  ✅ Property Manager Policy: $PROPERTY_MANAGER_POLICY"
echo "  ✅ Committee Member Policy: $COMMITTEE_MEMBER_POLICY"

# 关联 Policy 到 Role
echo ""
echo "🔗 关联 Policy 到角色..."

if [ -n "$PROPERTY_MANAGER_POLICY" ]; then
  curl -s -X POST "$DIRECTUS_URL/access" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"role\":\"$PROPERTY_MANAGER_ROLE\",\"policy\":\"$PROPERTY_MANAGER_POLICY\"}" > /dev/null
  echo "  ✅ Property Manager 关联成功"
fi

if [ -n "$COMMITTEE_MEMBER_POLICY" ]; then
  curl -s -X POST "$DIRECTUS_URL/access" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"role\":\"$COMMITTEE_MEMBER_ROLE\",\"policy\":\"$COMMITTEE_MEMBER_POLICY\"}" > /dev/null
  echo "  ✅ Committee Member 关联成功"
fi

echo ""
echo "🔑 配置 billings 表权限..."

# Resident - billings 只读自己的
echo "  配置 resident 对 billings 的权限..."
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"policy\":\"$RESIDENT_POLICY\",\"collection\":\"billings\",\"action\":\"read\",\"permissions\":{\"_and\":[{\"owner_id\":{\"_eq\":\"\$CURRENT_USER\"}}]},\"fields\":[\"*\"]}" > /dev/null
echo "    ✅ resident read 权限配置成功"

# Property Manager - billings 全部权限
if [ -n "$PROPERTY_MANAGER_POLICY" ]; then
  echo "  配置 property_manager 对 billings 的权限..."
  for action in create read update delete; do
    curl -s -X POST "$DIRECTUS_URL/permissions" \
      -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"policy\":\"$PROPERTY_MANAGER_POLICY\",\"collection\":\"billings\",\"action\":\"$action\",\"permissions\":{},\"fields\":[\"*\"]}" > /dev/null
    echo "    ✅ property_manager $action 权限配置成功"
  done
fi

# Committee Member - billings 只读
if [ -n "$COMMITTEE_MEMBER_POLICY" ]; then
  echo "  配置 committee_member 对 billings 的权限..."
  curl -s -X POST "$DIRECTUS_URL/permissions" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"policy\":\"$COMMITTEE_MEMBER_POLICY\",\"collection\":\"billings\",\"action\":\"read\",\"permissions\":{},\"fields\":[\"*\"]}" > /dev/null
  echo "    ✅ committee_member read 权限配置成功"
fi

echo ""
echo "🔑 配置 expenses 表权限..."

# Resident - expenses 只读已审核的
echo "  配置 resident 对 expenses 的权限..."
curl -s -X POST "$DIRECTUS_URL/permissions" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"policy\":\"$RESIDENT_POLICY\",\"collection\":\"expenses\",\"action\":\"read\",\"permissions\":{\"_and\":[{\"community_id\":{\"_eq\":\"\$CURRENT_USER.community_id\"}},{\"status\":{\"_eq\":\"approved\"}}]},\"fields\":[\"*\"]}" > /dev/null
echo "    ✅ resident read 权限配置成功"

# Property Manager - expenses 全部权限
if [ -n "$PROPERTY_MANAGER_POLICY" ]; then
  echo "  配置 property_manager 对 expenses 的权限..."
  for action in create read update delete; do
    curl -s -X POST "$DIRECTUS_URL/permissions" \
      -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"policy\":\"$PROPERTY_MANAGER_POLICY\",\"collection\":\"expenses\",\"action\":\"$action\",\"permissions\":{},\"fields\":[\"*\"]}" > /dev/null
    echo "    ✅ property_manager $action 权限配置成功"
  done
fi

# Committee Member - expenses 读取和更新审核字段
if [ -n "$COMMITTEE_MEMBER_POLICY" ]; then
  echo "  配置 committee_member 对 expenses 的权限..."
  curl -s -X POST "$DIRECTUS_URL/permissions" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"policy\":\"$COMMITTEE_MEMBER_POLICY\",\"collection\":\"expenses\",\"action\":\"read\",\"permissions\":{},\"fields\":[\"*\"]}" > /dev/null
  echo "    ✅ committee_member read 权限配置成功"

  curl -s -X POST "$DIRECTUS_URL/permissions" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"policy\":\"$COMMITTEE_MEMBER_POLICY\",\"collection\":\"expenses\",\"action\":\"update\",\"permissions\":{},\"fields\":[\"status\",\"approved_by\",\"approved_at\"]}" > /dev/null
  echo "    ✅ committee_member update 权限（仅审核字段）配置成功"
fi

echo ""
echo "✅ 权限配置完成！"
echo ""
echo "📋 验证:"
echo "访问 http://localhost:8055/admin/settings/roles 检查权限"
