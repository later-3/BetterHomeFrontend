#!/bin/bash

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  echo "示例: DIRECTUS_ADMIN_TOKEN=your_token bash scripts/create-departments.sh"
  exit 1
fi

echo "🚀 创建 property_departments 表..."

curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "property_departments",
    "meta": {
      "collection": "property_departments",
      "icon": "groups",
      "note": "物业部门表",
      "display_template": "{{name}}"
    },
    "schema": {
      "name": "property_departments"
    }
  }' | grep -q '"collection":"property_departments"' && echo "✅ property_departments 表创建成功" || echo "ℹ️  表已存在或创建失败"

echo "📝 创建 property_departments 字段..."

curl -s -X POST "$DIRECTUS_URL/fields/property_departments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection":"property_departments",
    "field":"id",
    "type":"uuid",
    "meta":{"special":["uuid"],"interface":"input","hidden":true},
    "schema":{"is_primary_key":true,"is_unique":true,"is_nullable":false}
  }' > /dev/null

declare -a department_fields=(
  '{"collection":"property_departments","field":"name","type":"string","meta":{"interface":"input","required":true,"note":"部门名称"},"schema":{"is_nullable":false,"max_length":120}}'
  '{"collection":"property_departments","field":"community_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","special":["m2o"],"options":{"template":"{{name}}"},"note":"所属小区"},"schema":{"is_nullable":false}}'
  '{"collection":"property_departments","field":"description","type":"text","meta":{"interface":"input-multiline","note":"部门职责说明"},"schema":{"is_nullable":true}}'
  '{"collection":"property_departments","field":"order","type":"integer","meta":{"interface":"input","note":"排序"},"schema":{"is_nullable":true}}'
  '{"collection":"property_departments","field":"active","type":"boolean","meta":{"interface":"toggle","note":"是否启用","default_value":true},"schema":{"is_nullable":false,"default_value":true}}'
)

for field in "${department_fields[@]}"; do
  name=$(echo "$field" | grep -o '"field":"[^\"]*"' | head -1 | cut -d'"' -f4)
  curl -s -X POST "$DIRECTUS_URL/fields/property_departments" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$field" > /dev/null && echo "  ✅ 字段 $name 创建成功" || echo "  ℹ️  字段 $name 已存在"
done

echo "🎯 创建 property_department_members (部门成员关联表)..."

curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "property_department_members",
    "meta": {
      "collection": "property_department_members",
      "icon": "people_alt",
      "note": "部门成员关联表"
    },
    "schema": {
      "name": "property_department_members"
    }
  }' | grep -q '"collection":"property_department_members"' && echo "✅ 成员关联表创建成功" || echo "ℹ️  成员关联表已存在或创建失败"

declare -a member_fields=(
  '{"collection":"property_department_members","field":"id","type":"integer","meta":{"interface":"input","readonly":true},"schema":{"is_primary_key":true,"has_auto_increment":true,"is_nullable":false}}'
  '{"collection":"property_department_members","field":"department_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","special":["m2o"],"options":{"template":"{{name}}"}},"schema":{"is_nullable":false}}'
  '{"collection":"property_department_members","field":"user_id","type":"uuid","meta":{"interface":"select-dropdown-m2o","special":["m2o"],"options":{"template":"{{first_name}} {{last_name}}"}},"schema":{"is_nullable":false}}'
  '{"collection":"property_department_members","field":"role","type":"string","meta":{"interface":"input","note":"在部门中的角色，如队长/成员"},"schema":{"is_nullable":true,"max_length":60}}'
)

for field in "${member_fields[@]}"; do
  name=$(echo "$field" | grep -o '"field":"[^\"]*"' | head -1 | cut -d'"' -f4)
  curl -s -X POST "$DIRECTUS_URL/fields/property_department_members" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$field" > /dev/null && echo "  ✅ 字段 $name 创建成功" || echo "  ℹ️  字段 $name 已存在"
done

echo "✅ 部门基础结构创建完成"
