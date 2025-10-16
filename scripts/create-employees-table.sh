#!/bin/bash

# 创建 employees 表（员工信息表 v2.0）
# 基于 docs/tasks/billing/finance-schema-v2.dbml
#
# 使用方法:
# DIRECTUS_ADMIN_TOKEN="your_token" bash scripts/create-employees-table.sh

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  echo "   示例: DIRECTUS_ADMIN_TOKEN=\"your_token\" bash scripts/create-employees-table.sh"
  exit 1
fi

echo "🚀 开始创建 employees 表（员工信息表 v2.0）..."
echo ""

# ===================================================================
# 1. 创建 employees 集合
# ===================================================================
echo "📦 [1/3] 创建 employees 集合..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "meta": {
      "collection": "employees",
      "icon": "badge",
      "note": "员工信息表（v2.0 - 保安、保洁、管理人员等）",
      "display_template": "{{name}} - {{position_title}}",
      "hidden": false,
      "singleton": false,
      "translations": [
        {
          "language": "zh-CN",
          "translation": "员工信息"
        }
      ],
      "archive_field": "date_deleted",
      "archive_app_filter": true,
      "sort_field": "hire_date",
      "accountability": "all",
      "color": "#1890FF",
      "item_duplication_fields": null,
      "sort": 6,
      "group": null,
      "collapse": "open"
    },
    "schema": {
      "name": "employees"
    }
  }' > /dev/null && echo "   ✅ employees 集合创建成功" || echo "   ⚠️  employees 集合可能已存在"

echo ""
echo "📝 [2/3] 创建 employees 字段..."

# 审计字段
echo "   创建审计字段..."
curl -s -X POST "$DIRECTUS_URL/fields/employees" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "field": "user_created",
    "type": "uuid",
    "meta": {
      "special": ["user-created"],
      "interface": "select-dropdown-m2o",
      "options": {
        "template": "{{first_name}} {{last_name}}"
      },
      "display": "related-values",
      "readonly": true,
      "hidden": true,
      "width": "half"
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ user_created"

curl -s -X POST "$DIRECTUS_URL/fields/employees" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "field": "date_created",
    "type": "timestamp",
    "meta": {
      "special": ["date-created"],
      "interface": "datetime",
      "readonly": true,
      "hidden": true,
      "width": "half",
      "display": "datetime",
      "display_options": {
        "relative": true
      }
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ date_created"

curl -s -X POST "$DIRECTUS_URL/fields/employees" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "field": "user_updated",
    "type": "uuid",
    "meta": {
      "special": ["user-updated"],
      "interface": "select-dropdown-m2o",
      "options": {
        "template": "{{first_name}} {{last_name}}"
      },
      "display": "related-values",
      "readonly": true,
      "hidden": true,
      "width": "half"
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ user_updated"

curl -s -X POST "$DIRECTUS_URL/fields/employees" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "field": "date_updated",
    "type": "timestamp",
    "meta": {
      "special": ["date-updated"],
      "interface": "datetime",
      "readonly": true,
      "hidden": true,
      "width": "half",
      "display": "datetime",
      "display_options": {
        "relative": true
      }
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ date_updated"

# 基本信息
echo "   创建基本信息字段..."
curl -s -X POST "$DIRECTUS_URL/fields/employees" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "field": "community_id",
    "type": "uuid",
    "meta": {
      "interface": "select-dropdown-m2o",
      "display": "related-values",
      "display_options": {
        "template": "{{name}}"
      },
      "required": true,
      "note": "所属社区",
      "width": "half"
    },
    "schema": {
      "is_nullable": false
    }
  }' > /dev/null && echo "      ✅ community_id"

curl -s -X POST "$DIRECTUS_URL/fields/employees" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "field": "name",
    "type": "string",
    "meta": {
      "interface": "input",
      "required": true,
      "note": "员工姓名",
      "width": "half"
    },
    "schema": {
      "is_nullable": false,
      "max_length": 100
    }
  }' > /dev/null && echo "      ✅ name"

curl -s -X POST "$DIRECTUS_URL/fields/employees" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "field": "phone",
    "type": "string",
    "meta": {
      "interface": "input",
      "note": "联系电话",
      "width": "half",
      "options": {
        "placeholder": "13800138000"
      }
    },
    "schema": {
      "is_nullable": true,
      "max_length": 20
    }
  }' > /dev/null && echo "      ✅ phone"

curl -s -X POST "$DIRECTUS_URL/fields/employees" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "field": "id_card_last4",
    "type": "string",
    "meta": {
      "interface": "input",
      "note": "身份证后4位（隐私保护）",
      "width": "half",
      "options": {
        "placeholder": "1234"
      }
    },
    "schema": {
      "is_nullable": true,
      "max_length": 4
    }
  }' > /dev/null && echo "      ✅ id_card_last4"

# 岗位信息
echo "   创建岗位信息字段..."
curl -s -X POST "$DIRECTUS_URL/fields/employees" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "field": "position_type",
    "type": "string",
    "meta": {
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "保安", "value": "security"},
          {"text": "保洁", "value": "cleaning"},
          {"text": "管理人员", "value": "management"},
          {"text": "水电工", "value": "electrician"},
          {"text": "管道工", "value": "plumber"},
          {"text": "绿化工", "value": "gardener"},
          {"text": "临时工", "value": "temp_worker"},
          {"text": "其他", "value": "other"}
        ]
      },
      "required": true,
      "note": "岗位类型",
      "width": "half"
    },
    "schema": {
      "is_nullable": false
    }
  }' > /dev/null && echo "      ✅ position_type"

curl -s -X POST "$DIRECTUS_URL/fields/employees" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "field": "position_title",
    "type": "string",
    "meta": {
      "interface": "input",
      "note": "岗位名称（如：保安队长、保洁主管）",
      "width": "half",
      "options": {
        "placeholder": "保安队长"
      }
    },
    "schema": {
      "is_nullable": true,
      "max_length": 100
    }
  }' > /dev/null && echo "      ✅ position_title"

# 雇佣信息
echo "   创建雇佣信息字段..."
curl -s -X POST "$DIRECTUS_URL/fields/employees" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "field": "employment_status",
    "type": "string",
    "meta": {
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "在职", "value": "active"},
          {"text": "离职", "value": "resigned"},
          {"text": "休假", "value": "on_leave"},
          {"text": "停职", "value": "suspended"}
        ]
      },
      "required": true,
      "note": "在职状态",
      "width": "half"
    },
    "schema": {
      "is_nullable": false,
      "default_value": "active"
    }
  }' > /dev/null && echo "      ✅ employment_status"

curl -s -X POST "$DIRECTUS_URL/fields/employees" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "field": "hire_date",
    "type": "date",
    "meta": {
      "interface": "datetime",
      "required": true,
      "note": "入职日期",
      "width": "half"
    },
    "schema": {
      "is_nullable": false
    }
  }' > /dev/null && echo "      ✅ hire_date"

curl -s -X POST "$DIRECTUS_URL/fields/employees" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "field": "resignation_date",
    "type": "date",
    "meta": {
      "interface": "datetime",
      "note": "离职日期",
      "width": "half"
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ resignation_date"

# 薪资信息
echo "   创建薪资信息字段..."
curl -s -X POST "$DIRECTUS_URL/fields/employees" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "field": "base_salary",
    "type": "decimal",
    "meta": {
      "interface": "input",
      "note": "基本工资（元/月）",
      "width": "half"
    },
    "schema": {
      "is_nullable": true,
      "numeric_precision": 10,
      "numeric_scale": 2
    }
  }' > /dev/null && echo "      ✅ base_salary"

# 其他信息
echo "   创建其他字段..."
curl -s -X POST "$DIRECTUS_URL/fields/employees" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "field": "notes",
    "type": "text",
    "meta": {
      "interface": "input-multiline",
      "note": "备注",
      "width": "full"
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ notes"

curl -s -X POST "$DIRECTUS_URL/fields/employees" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "field": "date_deleted",
    "type": "timestamp",
    "meta": {
      "interface": "datetime",
      "hidden": true,
      "note": "软删除时间"
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ date_deleted"

# ===================================================================
# 3. 创建表关系
# ===================================================================
echo ""
echo "🔗 [3/3] 创建表关系..."

# community_id -> communities
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "employees",
    "field": "community_id",
    "related_collection": "communities",
    "meta": {
      "many_collection": "employees",
      "many_field": "community_id",
      "one_collection": "communities",
      "one_field": null,
      "junction_field": null
    },
    "schema": {
      "on_delete": "SET NULL"
    }
  }' > /dev/null && echo "   ✅ employees.community_id -> communities"

echo ""
echo "✅ employees 表创建完成！"
echo ""
echo "📋 表结构摘要:"
echo "   - 集合名称: employees"
echo "   - 图标: 🎫 (badge)"
echo "   - 字段数: 13 个业务字段 + 4 个审计字段"
echo "   - 关系: 1 个（community_id）"
echo ""
echo "📋 岗位类型:"
echo "   - security（保安）"
echo "   - cleaning（保洁）"
echo "   - management（管理人员）"
echo "   - electrician（水电工）"
echo "   - plumber（管道工）"
echo "   - gardener（绿化工）"
echo "   - temp_worker（临时工）"
echo "   - other（其他）"
echo ""
echo "📋 在职状态:"
echo "   - active（在职，默认）"
echo "   - resigned（离职）"
echo "   - on_leave（休假）"
echo "   - suspended（停职）"
echo ""
echo "📋 下一步操作:"
echo "1. 在 Directus Admin 中检查表结构"
echo "   访问: $DIRECTUS_URL/admin/content/employees"
echo ""
echo "2. 测试创建员工记录"
echo "   姓名: 张三"
echo "   岗位类型: security（保安）"
echo "   岗位名称: 保安队长"
echo "   入职日期: 2024-01-01"
echo "   基本工资: 5000.00"
echo ""
echo "3. 配置权限（如果还没配置）"
echo "   bash scripts/fix-resident-billing-permissions.sh"
echo ""
