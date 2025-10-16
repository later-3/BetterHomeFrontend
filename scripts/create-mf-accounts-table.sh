#!/bin/bash

# 创建 maintenance_fund_accounts 表（维修基金账户表 v2.0）
# 基于 docs/tasks/billing/finance-schema-v2.dbml
#
# 使用方法:
# DIRECTUS_ADMIN_TOKEN="your_token" bash scripts/create-mf-accounts-table.sh

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  echo "   示例: DIRECTUS_ADMIN_TOKEN=\"your_token\" bash scripts/create-mf-accounts-table.sh"
  exit 1
fi

echo "🚀 开始创建 maintenance_fund_accounts 表（维修基金账户表 v2.0）..."
echo ""

# ===================================================================
# 1. 创建 maintenance_fund_accounts 集合
# ===================================================================
echo "📦 [1/3] 创建 maintenance_fund_accounts 集合..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_accounts",
    "meta": {
      "collection": "maintenance_fund_accounts",
      "icon": "savings",
      "note": "维修基金账户表（v2.0 - 每户一个账户）",
      "display_template": "{{owner_id.first_name}} {{owner_id.last_name}} - {{unit_number}}",
      "hidden": false,
      "singleton": false,
      "translations": [
        {
          "language": "zh-CN",
          "translation": "维修基金账户"
        }
      ],
      "archive_field": "date_deleted",
      "archive_app_filter": true,
      "sort_field": "date_created",
      "accountability": "all",
      "color": "#52C41A",
      "item_duplication_fields": null,
      "sort": 7,
      "group": null,
      "collapse": "open"
    },
    "schema": {
      "name": "maintenance_fund_accounts"
    }
  }' > /dev/null && echo "   ✅ maintenance_fund_accounts 集合创建成功" || echo "   ⚠️  maintenance_fund_accounts 集合可能已存在"

echo ""
echo "📝 [2/3] 创建 maintenance_fund_accounts 字段..."

# 审计字段
echo "   创建审计字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_accounts",
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

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_accounts",
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

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_accounts",
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

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_accounts",
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

# 账户归属
echo "   创建账户归属字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_accounts",
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

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_accounts",
    "field": "building_id",
    "type": "uuid",
    "meta": {
      "interface": "select-dropdown-m2o",
      "display": "related-values",
      "display_options": {
        "template": "{{name}}"
      },
      "required": true,
      "note": "所属楼栋",
      "width": "half"
    },
    "schema": {
      "is_nullable": false
    }
  }' > /dev/null && echo "      ✅ building_id"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_accounts",
    "field": "owner_id",
    "type": "uuid",
    "meta": {
      "interface": "select-dropdown-m2o",
      "display": "related-values",
      "display_options": {
        "template": "{{first_name}} {{last_name}}"
      },
      "required": true,
      "note": "业主",
      "width": "half"
    },
    "schema": {
      "is_nullable": false
    }
  }' > /dev/null && echo "      ✅ owner_id"

# 房屋信息
echo "   创建房屋信息字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_accounts",
    "field": "house_area",
    "type": "decimal",
    "meta": {
      "interface": "input",
      "note": "房屋面积（m²）",
      "width": "half"
    },
    "schema": {
      "is_nullable": true,
      "numeric_precision": 10,
      "numeric_scale": 2
    }
  }' > /dev/null && echo "      ✅ house_area"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_accounts",
    "field": "unit_number",
    "type": "string",
    "meta": {
      "interface": "input",
      "note": "房号（如：1-101）",
      "width": "half",
      "options": {
        "placeholder": "1-101"
      }
    },
    "schema": {
      "is_nullable": true,
      "max_length": 50
    }
  }' > /dev/null && echo "      ✅ unit_number"

# 资金信息
echo "   创建资金信息字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_accounts",
    "field": "total_paid",
    "type": "decimal",
    "meta": {
      "interface": "input",
      "required": true,
      "note": "累计缴纳金额（元）",
      "width": "half"
    },
    "schema": {
      "is_nullable": false,
      "numeric_precision": 10,
      "numeric_scale": 2,
      "default_value": 0
    }
  }' > /dev/null && echo "      ✅ total_paid"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_accounts",
    "field": "total_used",
    "type": "decimal",
    "meta": {
      "interface": "input",
      "required": true,
      "note": "累计使用金额（元）",
      "width": "half"
    },
    "schema": {
      "is_nullable": false,
      "numeric_precision": 10,
      "numeric_scale": 2,
      "default_value": 0
    }
  }' > /dev/null && echo "      ✅ total_used"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_accounts",
    "field": "balance",
    "type": "decimal",
    "meta": {
      "interface": "input",
      "required": true,
      "note": "当前余额（元）= 累计缴纳 - 累计使用",
      "width": "half"
    },
    "schema": {
      "is_nullable": false,
      "numeric_precision": 10,
      "numeric_scale": 2,
      "default_value": 0
    }
  }' > /dev/null && echo "      ✅ balance"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_accounts",
    "field": "last_payment_date",
    "type": "timestamp",
    "meta": {
      "interface": "datetime",
      "note": "最后缴纳日期",
      "width": "half"
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ last_payment_date"

# 软删除
echo "   创建软删除字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_accounts" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_accounts",
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
    "collection": "maintenance_fund_accounts",
    "field": "community_id",
    "related_collection": "communities",
    "meta": {
      "many_collection": "maintenance_fund_accounts",
      "many_field": "community_id",
      "one_collection": "communities",
      "one_field": null,
      "junction_field": null
    },
    "schema": {
      "on_delete": "SET NULL"
    }
  }' > /dev/null && echo "   ✅ maintenance_fund_accounts.community_id -> communities"

# building_id -> buildings
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_accounts",
    "field": "building_id",
    "related_collection": "buildings",
    "meta": {
      "many_collection": "maintenance_fund_accounts",
      "many_field": "building_id",
      "one_collection": "buildings",
      "one_field": null,
      "junction_field": null
    },
    "schema": {
      "on_delete": "SET NULL"
    }
  }' > /dev/null && echo "   ✅ maintenance_fund_accounts.building_id -> buildings"

# owner_id -> directus_users
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_accounts",
    "field": "owner_id",
    "related_collection": "directus_users",
    "meta": {
      "many_collection": "maintenance_fund_accounts",
      "many_field": "owner_id",
      "one_collection": "directus_users",
      "one_field": null,
      "junction_field": null
    },
    "schema": {
      "on_delete": "SET NULL"
    }
  }' > /dev/null && echo "   ✅ maintenance_fund_accounts.owner_id -> directus_users"

echo ""
echo "✅ maintenance_fund_accounts 表创建完成！"
echo ""
echo "📋 表结构摘要:"
echo "   - 集合名称: maintenance_fund_accounts"
echo "   - 图标: 🏦 (savings)"
echo "   - 字段数: 13 个业务字段 + 4 个审计字段"
echo "   - 关系: 3 个（community_id, building_id, owner_id）"
echo ""
echo "📋 核心字段说明:"
echo "   - total_paid: 累计缴纳金额"
echo "   - total_used: 累计使用金额"
echo "   - balance: 当前余额 = total_paid - total_used"
echo "   - 每个业主在每个社区只能有一个账户（唯一索引）"
echo ""
echo "📋 下一步操作:"
echo "1. 在 Directus Admin 中验证"
echo "   访问: $DIRECTUS_URL/admin/content/maintenance_fund_accounts"
echo "   检查: 表图标显示为 🏦 (savings)"
echo "   检查: 字段列表完整（17个字段）"
echo ""
echo "2. 创建测试账户"
echo "   - 选择社区、楼栋、业主"
echo "   - 输入房屋面积和房号"
echo "   - 设置初始余额（total_paid = 10000, balance = 10000）"
echo ""
echo "3. 继续创建下一个表"
echo "   bash scripts/create-mf-payments-table.sh"
echo ""
