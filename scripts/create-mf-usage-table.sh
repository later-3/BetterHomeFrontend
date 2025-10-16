#!/bin/bash

# 创建 maintenance_fund_usage 表（维修基金使用记录表 v2.0）
# 基于 docs/tasks/billing/finance-schema-v2.dbml
#
# 使用方法:
# DIRECTUS_ADMIN_TOKEN="your_token" bash scripts/create-mf-usage-table.sh

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  echo "   示例: DIRECTUS_ADMIN_TOKEN=\"your_token\" bash scripts/create-mf-usage-table.sh"
  exit 1
fi

echo "🚀 开始创建 maintenance_fund_usage 表（维修基金使用记录表 v2.0）..."
echo ""

# ===================================================================
# 1. 创建 maintenance_fund_usage 集合
# ===================================================================
echo "📦 [1/3] 创建 maintenance_fund_usage 集合..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "meta": {
      "collection": "maintenance_fund_usage",
      "icon": "construction",
      "note": "维修基金使用记录表（v2.0 - 关联工单，需业委会审批）",
      "display_template": "{{project_name}} - ¥{{actual_amount}}",
      "hidden": false,
      "singleton": false,
      "translations": [
        {
          "language": "zh-CN",
          "translation": "维修基金使用记录"
        }
      ],
      "archive_field": "date_deleted",
      "archive_app_filter": true,
      "sort_field": "date_created",
      "accountability": "all",
      "color": "#FA8C16",
      "item_duplication_fields": null,
      "sort": 9,
      "group": null,
      "collapse": "open"
    },
    "schema": {
      "name": "maintenance_fund_usage"
    }
  }' > /dev/null && echo "   ✅ maintenance_fund_usage 集合创建成功" || echo "   ⚠️  maintenance_fund_usage 集合可能已存在"

echo ""
echo "📝 [2/3] 创建 maintenance_fund_usage 字段..."

# 审计字段
echo "   创建审计字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
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

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
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

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
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

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
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

# 关联工单和社区
echo "   创建关联字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "work_order_id",
    "type": "uuid",
    "meta": {
      "interface": "select-dropdown-m2o",
      "display": "related-values",
      "display_options": {
        "template": "{{title}}"
      },
      "required": true,
      "note": "关联工单（类型：maintenance_fund_application）",
      "width": "half"
    },
    "schema": {
      "is_nullable": false
    }
  }' > /dev/null && echo "      ✅ work_order_id"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
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

# 项目信息
echo "   创建项目信息字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "project_name",
    "type": "string",
    "meta": {
      "interface": "input",
      "required": true,
      "note": "项目名称",
      "width": "full"
    },
    "schema": {
      "is_nullable": false,
      "max_length": 255
    }
  }' > /dev/null && echo "      ✅ project_name"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "project_type",
    "type": "string",
    "meta": {
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "电梯更换/维修", "value": "elevator"},
          {"text": "外墙维修", "value": "exterior_wall"},
          {"text": "屋顶防水", "value": "roof"},
          {"text": "管道更换", "value": "pipeline"},
          {"text": "消防系统", "value": "fire_system"},
          {"text": "安防系统", "value": "security_system"},
          {"text": "道路维修", "value": "road"},
          {"text": "其他", "value": "other"}
        ]
      },
      "required": true,
      "note": "项目类型",
      "width": "half"
    },
    "schema": {
      "is_nullable": false
    }
  }' > /dev/null && echo "      ✅ project_type"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "description",
    "type": "text",
    "meta": {
      "interface": "input-multiline",
      "required": true,
      "note": "详细说明",
      "width": "full"
    },
    "schema": {
      "is_nullable": false
    }
  }' > /dev/null && echo "      ✅ description"

# 施工信息
echo "   创建施工信息字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "contractor",
    "type": "string",
    "meta": {
      "interface": "input",
      "note": "施工单位",
      "width": "half"
    },
    "schema": {
      "is_nullable": true,
      "max_length": 255
    }
  }' > /dev/null && echo "      ✅ contractor"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "contract_no",
    "type": "string",
    "meta": {
      "interface": "input",
      "note": "合同编号",
      "width": "half"
    },
    "schema": {
      "is_nullable": true,
      "max_length": 100
    }
  }' > /dev/null && echo "      ✅ contract_no"

# 金额信息
echo "   创建金额信息字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "estimated_amount",
    "type": "decimal",
    "meta": {
      "interface": "input",
      "note": "预算金额（元）",
      "width": "half"
    },
    "schema": {
      "is_nullable": true,
      "numeric_precision": 10,
      "numeric_scale": 2
    }
  }' > /dev/null && echo "      ✅ estimated_amount"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "actual_amount",
    "type": "decimal",
    "meta": {
      "interface": "input",
      "note": "实际使用金额（元）",
      "width": "half"
    },
    "schema": {
      "is_nullable": true,
      "numeric_precision": 10,
      "numeric_scale": 2
    }
  }' > /dev/null && echo "      ✅ actual_amount"

# 审批流程
echo "   创建审批流程字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "approval_status",
    "type": "string",
    "meta": {
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "待审批", "value": "pending"},
          {"text": "已批准", "value": "approved"},
          {"text": "已拒绝", "value": "rejected"},
          {"text": "已完成", "value": "completed"}
        ]
      },
      "required": true,
      "note": "审批状态",
      "width": "half"
    },
    "schema": {
      "is_nullable": false,
      "default_value": "pending"
    }
  }' > /dev/null && echo "      ✅ approval_status"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "approved_by",
    "type": "uuid",
    "meta": {
      "interface": "select-dropdown-m2o",
      "display": "related-values",
      "display_options": {
        "template": "{{first_name}} {{last_name}}"
      },
      "note": "审批人（业委会成员）",
      "width": "half"
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ approved_by"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "approved_at",
    "type": "timestamp",
    "meta": {
      "interface": "datetime",
      "note": "审批时间",
      "width": "half"
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ approved_at"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "rejection_reason",
    "type": "text",
    "meta": {
      "interface": "input-multiline",
      "note": "拒绝原因",
      "width": "full"
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ rejection_reason"

# 使用信息
echo "   创建使用信息字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "usage_date",
    "type": "timestamp",
    "meta": {
      "interface": "datetime",
      "note": "实际使用日期（审批通过后）",
      "width": "half"
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ usage_date"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "expense_id",
    "type": "uuid",
    "meta": {
      "interface": "select-dropdown-m2o",
      "display": "related-values",
      "display_options": {
        "template": "{{title}}"
      },
      "note": "关联支出记录",
      "width": "half"
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ expense_id"

# 凭证和备注
echo "   创建凭证和备注字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "proof_files",
    "type": "json",
    "meta": {
      "interface": "list",
      "note": "凭证文件ID数组（申请单、审批单、合同、发票、施工记录）",
      "width": "full"
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ proof_files"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
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

# 软删除
echo "   创建软删除字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_usage" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
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

# work_order_id -> work_orders
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "work_order_id",
    "related_collection": "work_orders",
    "meta": {
      "many_collection": "maintenance_fund_usage",
      "many_field": "work_order_id",
      "one_collection": "work_orders",
      "one_field": null,
      "junction_field": null
    },
    "schema": {
      "on_delete": "SET NULL"
    }
  }' > /dev/null && echo "   ✅ maintenance_fund_usage.work_order_id -> work_orders"

# community_id -> communities
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "community_id",
    "related_collection": "communities",
    "meta": {
      "many_collection": "maintenance_fund_usage",
      "many_field": "community_id",
      "one_collection": "communities",
      "one_field": null,
      "junction_field": null
    },
    "schema": {
      "on_delete": "SET NULL"
    }
  }' > /dev/null && echo "   ✅ maintenance_fund_usage.community_id -> communities"

# approved_by -> directus_users
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "approved_by",
    "related_collection": "directus_users",
    "meta": {
      "many_collection": "maintenance_fund_usage",
      "many_field": "approved_by",
      "one_collection": "directus_users",
      "one_field": null,
      "junction_field": null
    },
    "schema": {
      "on_delete": "SET NULL"
    }
  }' > /dev/null && echo "   ✅ maintenance_fund_usage.approved_by -> directus_users"

# expense_id -> expenses
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_usage",
    "field": "expense_id",
    "related_collection": "expenses",
    "meta": {
      "many_collection": "maintenance_fund_usage",
      "many_field": "expense_id",
      "one_collection": "expenses",
      "one_field": null,
      "junction_field": null
    },
    "schema": {
      "on_delete": "SET NULL"
    }
  }' > /dev/null && echo "   ✅ maintenance_fund_usage.expense_id -> expenses"

echo ""
echo "✅ maintenance_fund_usage 表创建完成！"
echo ""
echo "📋 表结构摘要:"
echo "   - 集合名称: maintenance_fund_usage"
echo "   - 图标: 🏗️ (construction)"
echo "   - 字段数: 21 个业务字段 + 4 个审计字段"
echo "   - 关系: 4 个（work_order_id, community_id, approved_by, expense_id）"
echo ""
echo "📋 项目类型:"
echo "   - elevator（电梯更换/维修）"
echo "   - exterior_wall（外墙维修）"
echo "   - roof（屋顶防水）"
echo "   - pipeline（管道更换）"
echo "   - fire_system（消防系统）"
echo "   - security_system（安防系统）"
echo "   - road（道路维修）"
echo "   - other（其他）"
echo ""
echo "📋 审批状态:"
echo "   - pending（待审批，默认）"
echo "   - approved（已批准）"
echo "   - rejected（已拒绝）"
echo "   - completed（已完成）"
echo ""
echo "📋 核心流程说明:"
echo "   1. 物业创建工单（类型：maintenance_fund_application）"
echo "   2. 创建 maintenance_fund_usage 记录（关联工单）"
echo "   3. 业委会审批（approved_by, approved_at）"
echo "   4. 审批通过后实际使用（usage_date, actual_amount）"
echo "   5. 创建支出记录（expense_id）"
echo "   6. 更新账户余额（total_used, balance）"
echo ""
echo "🎉 所有维修基金表创建完成！"
echo ""
echo "📋 已创建的表:"
echo "   1. ✅ maintenance_fund_accounts（维修基金账户）"
echo "   2. ✅ maintenance_fund_payments（维修基金缴纳记录）"
echo "   3. ✅ maintenance_fund_usage（维修基金使用记录）"
echo ""
echo "📋 下一步操作:"
echo "1. 在 Directus Admin 中验证所有表"
echo "   访问: $DIRECTUS_URL/admin"
echo "   检查: Content → Maintenance Fund Accounts"
echo "   检查: Content → Maintenance Fund Payments"
echo "   检查: Content → Maintenance Fund Usage"
echo ""
echo "2. 配置权限"
echo "   bash scripts/fix-resident-billing-permissions.sh"
echo ""
echo "3. 创建测试数据流程"
echo "   a. 创建维修基金账户"
echo "   b. 创建缴纳记录（更新账户余额）"
echo "   c. 创建工单（类型：maintenance_fund_application）"
echo "   d. 创建使用记录（关联工单）"
echo "   e. 业委会审批"
echo "   f. 创建支出记录"
echo ""
