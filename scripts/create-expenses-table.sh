#!/bin/bash

# 创建 expenses 表（支出记录表 v2.0）
# 基于 docs/tasks/billing/finance-schema-v2.dbml
#
# 使用方法:
# DIRECTUS_ADMIN_TOKEN="your_token" bash scripts/create-expenses-table.sh

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  echo "   示例: DIRECTUS_ADMIN_TOKEN=\"your_token\" bash scripts/create-expenses-table.sh"
  exit 1
fi

echo "🚀 开始创建 expenses 表（支出记录表 v2.0）..."
echo ""

# ===================================================================
# 1. 创建 expenses 集合
# ===================================================================
echo "📦 [1/3] 创建 expenses 集合..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
    "meta": {
      "collection": "expenses",
      "icon": "payments",
      "note": "支出记录表（v2.0 - 工资、维修、公用事业等）",
      "display_template": "{{title}} - ¥{{amount}}",
      "hidden": false,
      "singleton": false,
      "translations": [
        {
          "language": "zh-CN",
          "translation": "支出记录"
        }
      ],
      "archive_field": "date_deleted",
      "archive_app_filter": true,
      "sort_field": "paid_at",
      "accountability": "all",
      "color": "#FF4D4F",
      "item_duplication_fields": null,
      "sort": 5,
      "group": null,
      "collapse": "open"
    },
    "schema": {
      "name": "expenses"
    }
  }' > /dev/null && echo "   ✅ expenses 集合创建成功" || echo "   ⚠️  expenses 集合可能已存在"

echo ""
echo "📝 [2/3] 创建 expenses 字段..."

# 审计字段
echo "   创建审计字段..."
curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
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

curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
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

curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
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

curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
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

# 支出基本信息
echo "   创建基本信息字段..."
curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
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

curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
    "field": "expense_type",
    "type": "string",
    "meta": {
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "员工工资", "value": "salary"},
          {"text": "设施维护", "value": "maintenance"},
          {"text": "公共能耗", "value": "utilities"},
          {"text": "耗材采购", "value": "materials"},
          {"text": "社区活动", "value": "activity"},
          {"text": "业委会经费", "value": "committee_fund"},
          {"text": "维修基金使用", "value": "maintenance_fund"},
          {"text": "其他", "value": "other"}
        ]
      },
      "required": true,
      "note": "支出类型",
      "width": "half"
    },
    "schema": {
      "is_nullable": false
    }
  }' > /dev/null && echo "      ✅ expense_type"

curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
    "field": "title",
    "type": "string",
    "meta": {
      "interface": "input",
      "required": true,
      "note": "支出标题",
      "width": "full"
    },
    "schema": {
      "is_nullable": false,
      "max_length": 255
    }
  }' > /dev/null && echo "      ✅ title"

curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
    "field": "description",
    "type": "text",
    "meta": {
      "interface": "input-multiline",
      "note": "详细说明",
      "width": "full"
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ description"

curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
    "field": "amount",
    "type": "decimal",
    "meta": {
      "interface": "input",
      "required": true,
      "note": "支出金额（元）",
      "width": "half"
    },
    "schema": {
      "is_nullable": false,
      "numeric_precision": 10,
      "numeric_scale": 2
    }
  }' > /dev/null && echo "      ✅ amount"

# 支付信息
echo "   创建支付信息字段..."
curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
    "field": "paid_at",
    "type": "timestamp",
    "meta": {
      "interface": "datetime",
      "required": true,
      "note": "支付时间",
      "width": "half"
    },
    "schema": {
      "is_nullable": false
    }
  }' > /dev/null && echo "      ✅ paid_at"

curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
    "field": "period",
    "type": "string",
    "meta": {
      "interface": "input",
      "note": "所属月份（YYYY-MM），用于月度汇总",
      "width": "half",
      "options": {
        "placeholder": "2024-01"
      }
    },
    "schema": {
      "is_nullable": true,
      "max_length": 7
    }
  }' > /dev/null && echo "      ✅ period"

curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
    "field": "payment_method",
    "type": "string",
    "meta": {
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "微信", "value": "wechat"},
          {"text": "支付宝", "value": "alipay"},
          {"text": "银行转账", "value": "bank"},
          {"text": "现金", "value": "cash"},
          {"text": "POS机刷卡", "value": "pos"},
          {"text": "其他", "value": "other"}
        ]
      },
      "required": true,
      "note": "支付方式",
      "width": "half"
    },
    "schema": {
      "is_nullable": false
    }
  }' > /dev/null && echo "      ✅ payment_method"

# 分类和关联信息
echo "   创建分类和关联字段..."
curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
    "field": "category",
    "type": "string",
    "meta": {
      "interface": "input",
      "note": "细分类别（如：工资-保安、维护-电梯）",
      "width": "half"
    },
    "schema": {
      "is_nullable": true,
      "max_length": 50
    }
  }' > /dev/null && echo "      ✅ category"

curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
    "field": "related_info",
    "type": "json",
    "meta": {
      "interface": "input-code",
      "options": {
        "language": "json",
        "lineNumber": true
      },
      "note": "关联信息（JSON格式）：工资记录ID、维修基金使用ID、合同信息等",
      "width": "full"
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ related_info"

# 审核流程
echo "   创建审核流程字段..."
curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
    "field": "status",
    "type": "string",
    "meta": {
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "待审核", "value": "pending"},
          {"text": "已审核", "value": "approved"},
          {"text": "已拒绝", "value": "rejected"}
        ]
      },
      "required": true,
      "note": "审核状态",
      "width": "half"
    },
    "schema": {
      "is_nullable": false,
      "default_value": "approved"
    }
  }' > /dev/null && echo "      ✅ status"

curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
    "field": "approved_by",
    "type": "uuid",
    "meta": {
      "interface": "select-dropdown-m2o",
      "display": "related-values",
      "display_options": {
        "template": "{{first_name}} {{last_name}}"
      },
      "note": "审批人",
      "width": "half"
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ approved_by"

curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
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

# 凭证和备注
echo "   创建凭证和备注字段..."
curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
    "field": "proof_files",
    "type": "json",
    "meta": {
      "interface": "list",
      "note": "凭证文件ID数组（发票、合同、转账记录等）",
      "width": "full"
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ proof_files"

curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
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

# 创建人和软删除
echo "   创建创建人和软删除字段..."
curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
    "field": "created_by",
    "type": "uuid",
    "meta": {
      "interface": "select-dropdown-m2o",
      "display": "related-values",
      "display_options": {
        "template": "{{first_name}} {{last_name}}"
      },
      "required": true,
      "note": "创建人（录入人）",
      "width": "half"
    },
    "schema": {
      "is_nullable": false
    }
  }' > /dev/null && echo "      ✅ created_by"

curl -s -X POST "$DIRECTUS_URL/fields/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
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
    "collection": "expenses",
    "field": "community_id",
    "related_collection": "communities",
    "meta": {
      "many_collection": "expenses",
      "many_field": "community_id",
      "one_collection": "communities",
      "one_field": null,
      "junction_field": null
    },
    "schema": {
      "on_delete": "SET NULL"
    }
  }' > /dev/null && echo "   ✅ expenses.community_id -> communities"

# created_by -> directus_users
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
    "field": "created_by",
    "related_collection": "directus_users",
    "meta": {
      "many_collection": "expenses",
      "many_field": "created_by",
      "one_collection": "directus_users",
      "one_field": null,
      "junction_field": null
    },
    "schema": {
      "on_delete": "SET NULL"
    }
  }' > /dev/null && echo "   ✅ expenses.created_by -> directus_users"

# approved_by -> directus_users
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "expenses",
    "field": "approved_by",
    "related_collection": "directus_users",
    "meta": {
      "many_collection": "expenses",
      "many_field": "approved_by",
      "one_collection": "directus_users",
      "one_field": null,
      "junction_field": null
    },
    "schema": {
      "on_delete": "SET NULL"
    }
  }' > /dev/null && echo "   ✅ expenses.approved_by -> directus_users"

echo ""
echo "✅ expenses 表创建完成！"
echo ""
echo "📋 表结构摘要:"
echo "   - 集合名称: expenses"
echo "   - 图标: 💳 (payments)"
echo "   - 字段数: 18 个业务字段 + 4 个审计字段"
echo "   - 关系: 3 个（community_id, created_by, approved_by）"
echo ""
echo "📋 下一步操作:"
echo "1. 在 Directus Admin 中检查表结构"
echo "   访问: $DIRECTUS_URL/admin/content/expenses"
echo ""
echo "2. 配置权限（如果还没配置）"
echo "   bash scripts/fix-resident-billing-permissions.sh"
echo ""
echo "3. 测试插入数据"
echo "   在 Directus Admin 中手动创建一条测试记录"
echo ""
echo "4. 在应用中验证"
echo "   访问财务总览页面，查看支出数据是否正常显示"
echo ""
