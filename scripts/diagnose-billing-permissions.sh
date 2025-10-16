#!/bin/bash

# Directus 财务权限诊断脚本
#
# 使用方法:
# DIRECTUS_ADMIN_TOKEN="your_token" bash scripts/diagnose-billing-permissions.sh

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  echo "   示例: DIRECTUS_ADMIN_TOKEN=\"your_token\" bash scripts/diagnose-billing-permissions.sh"
  exit 1
fi

echo "🔍 开始诊断 billing 表权限问题..."
echo ""

# 1. 检查 resident 角色
echo "📋 1. 检查 resident 角色配置..."
RESIDENT_ROLE=$(curl -s "$DIRECTUS_URL/roles?filter[name][_eq]=resident" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | jq -r '.data[0]')

if [ "$RESIDENT_ROLE" == "null" ]; then
  echo "   ❌ 未找到 resident 角色"
  exit 1
fi

RESIDENT_ROLE_ID=$(echo $RESIDENT_ROLE | jq -r '.id')
RESIDENT_POLICIES=$(echo $RESIDENT_ROLE | jq -r '.policies[]' 2>/dev/null)

echo "   ✅ Resident 角色 ID: $RESIDENT_ROLE_ID"
echo "   📝 关联的 Policies: $RESIDENT_POLICIES"
echo ""

# 2. 检查 billings 表权限
echo "📋 2. 检查 billings 表权限..."
BILLING_PERMISSIONS=$(curl -s "$DIRECTUS_URL/permissions?filter[collection][_eq]=billings" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | jq -r '.data[]')

if [ -z "$BILLING_PERMISSIONS" ] || [ "$BILLING_PERMISSIONS" == "null" ]; then
  echo "   ❌ 未找到 billings 表的任何权限配置"
else
  echo "   ✅ 找到 billings 表权限配置:"
  echo "$BILLING_PERMISSIONS" | jq -r '. | "      - Policy: \(.policy) | Action: \(.action) | Fields: \(.fields | length) 个字段"'
fi
echo ""

# 3. 检查关联表权限
echo "📋 3. 检查关联表权限..."

for table in "communities" "buildings" "directus_users"; do
  echo "   检查 $table 表..."
  PERMS=$(curl -s "$DIRECTUS_URL/permissions?filter[collection][_eq]=$table" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | jq -r '.data[]')
  
  if [ -z "$PERMS" ] || [ "$PERMS" == "null" ]; then
    echo "      ❌ 未找到 $table 表的权限配置"
  else
    echo "      ✅ 找到 $table 表权限配置"
  fi
done
echo ""

# 4. 测试 API 访问
echo "📋 4. 测试 API 访问（需要 resident 用户的 token）..."
echo "   ⚠️  请手动测试："
echo "   1. 使用 resident 用户登录获取 token"
echo "   2. 执行以下命令测试："
echo ""
echo "   curl -s \"$DIRECTUS_URL/items/billings?limit=1\" \\"
echo "     -H \"Authorization: Bearer <resident_token>\" | jq"
echo ""

# 5. 输出建议
echo "📋 5. 诊断建议..."
echo ""
echo "   如果看到以下问题，请按照建议修复："
echo ""
echo "   ❌ 未找到 billings 表权限配置"
echo "      → 运行: bash scripts/fix-billing-permissions.sh"
echo ""
echo "   ❌ 未找到关联表权限配置"
echo "      → 需要为 resident 角色添加 communities, buildings, directus_users 的读权限"
echo ""
echo "   ❌ API 返回 403 Forbidden"
echo "      → 检查 policy 是否正确关联到 resident 角色"
echo "      → 检查权限规则中的 filter 是否正确（owner_id = \$CURRENT_USER）"
echo ""

echo "✅ 诊断完成！"
