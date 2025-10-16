#!/bin/bash

# 创建 maintenance_fund_payments 表（维修基金缴纳记录表 v2.0）
# 基于 docs/tasks/billing/finance-schema-v2.dbml
#
# 使用方法:
# DIRECTUS_ADMIN_TOKEN="your_token" bash scripts/create-mf-payments-table.sh

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  echo "   示例: DIRECTUS_ADMIN_TOKEN=\"your_token\" bash scripts/create-mf-payments-table.sh"
  exit 1
fi

echo "🚀 开始创建 maintenance_fund_payments 表（维修基金缴纳记录表 v2.0）..."
echo ""

# ===================================================================
# 1. 创建 maintenance_fund_payments 集合
# ===================================================================
echo "📦 [1/3] 创建 maintenance_fund_payments 集合..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
    "meta": {
      "collection": "maintenance_fund_payments",
      "icon": "account_balance",
      "note": "维修基金缴纳记录表（v2.0 - 记录每次缴纳）",
      "display_template": "{{owner_id.first_name}} {{owner_id.last_name}} - ¥{{amount}}",
      "hidden": false,
      "singleton": false,
      "translations": [
        {
          "language": "zh-CN",
          "translation": "维修基金缴纳记录"
        }
      ],
      "archive_field": "date_deleted",
      "archive_app_filter": true,
      "sort_field": "paid_at",
      "accountability": "all",
      "color": "#52C41A",
      "item_duplication_fields": null,
      "sort": 8,
      "group": null,
      "collapse": "open"
    },
    "schema": {
      "name": "maintenance_fund_payments"
    }
  }' > /dev/null && echo "   ✅ maintenance_fund_payments 集合创建成功" || echo "   ⚠️  maintenance_fund_payments 集合可能已存在"

echo ""
echo "📝 [2/3] 创建 maintenance_fund_payments 字段..."

# 审计字段
echo "   创建审计字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
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

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
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

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
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

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
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

# 关联账户
echo "   创建关联账户字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
    "field": "account_id",
    "type": "uuid",
    "meta": {
      "interface": "select-dropdown-m2o",
      "display": "related-values",
      "display_options": {
        "template": "{{owner_id.first_name}} {{owner_id.last_name}} - {{unit_number}}"
      },
      "required": true,
      "note": "关联的维修基金账户",
      "width": "half"
    },
    "schema": {
      "is_nullable": false
    }
  }' > /dev/null && echo "      ✅ account_id"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
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

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
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

# 缴纳信息
echo "   创建缴纳信息字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
    "field": "payment_type",
    "type": "string",
    "meta": {
      "interface": "select-dropdown",
      "options": {
        "choices": [
          {"text": "首次缴纳", "value": "initial"},
          {"text": "续筹", "value": "replenishment"},
          {"text": "补缴", "value": "supplement"}
        ]
      },
      "required": true,
      "note": "缴纳类型",
      "width": "half"
    },
    "schema": {
      "is_nullable": false
    }
  }' > /dev/null && echo "      ✅ payment_type"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
    "field": "amount",
    "type": "decimal",
    "meta": {
      "interface": "input",
      "required": true,
      "note": "缴纳金额（元）",
      "width": "half"
    },
    "schema": {
      "is_nullable": false,
      "numeric_precision": 10,
      "numeric_scale": 2
    }
  }' > /dev/null && echo "      ✅ amount"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
    "field": "paid_at",
    "type": "timestamp",
    "meta": {
      "interface": "datetime",
      "required": true,
      "note": "缴纳时间",
      "width": "half"
    },
    "schema": {
      "is_nullable": false
    }
  }' > /dev/null && echo "      ✅ paid_at"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
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

# 计算依据
echo "   创建计算依据字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
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

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
    "field": "unit_price",
    "type": "decimal",
    "meta": {
      "interface": "input",
      "note": "单价（元/m²）",
      "width": "half"
    },
    "schema": {
      "is_nullable": true,
      "numeric_precision": 10,
      "numeric_scale": 2
    }
  }' > /dev/null && echo "      ✅ unit_price"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
    "field": "transaction_no",
    "type": "string",
    "meta": {
      "interface": "input",
      "note": "交易流水号",
      "width": "half"
    },
    "schema": {
      "is_nullable": true,
      "max_length": 100
    }
  }' > /dev/null && echo "      ✅ transaction_no"

# 凭证和备注
echo "   创建凭证和备注字段..."
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
    "field": "proof_files",
    "type": "json",
    "meta": {
      "interface": "list",
      "note": "凭证文件ID数组",
      "width": "full"
    },
    "schema": {
      "is_nullable": true
    }
  }' > /dev/null && echo "      ✅ proof_files"

curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
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
curl -s -X POST "$DIRECTUS_URL/fields/maintenance_fund_payments" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
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

# account_id -> maintenance_fund_accounts
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
    "field": "account_id",
    "related_collection": "maintenance_fund_accounts",
    "meta": {
      "many_collection": "maintenance_fund_payments",
      "many_field": "account_id",
      "one_collection": "maintenance_fund_accounts",
      "one_field": null,
      "junction_field": null
    },
    "schema": {
      "on_delete": "SET NULL"
    }
  }' > /dev/null && echo "   ✅ maintenance_fund_payments.account_id -> maintenance_fund_accounts"

# community_id -> communities
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
    "field": "community_id",
    "related_collection": "communities",
    "meta": {
      "many_collection": "maintenance_fund_payments",
      "many_field": "community_id",
      "one_collection": "communities",
      "one_field": null,
      "junction_field": null
    },
    "schema": {
      "on_delete": "SET NULL"
    }
  }' > /dev/null && echo "   ✅ maintenance_fund_payments.community_id -> communities"

# owner_id -> directus_users
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "maintenance_fund_payments",
    "field": "owner_id",
    "related_collection": "directus_users",
    "meta": {
      "many_collection": "maintenance_fund_payments",
      "many_field": "owner_id",
      "one_collection": "directus_users",
      "one_field": null,
      "junction_field": null
    },
    "schema": {
      "on_delete": "SET NULL"
    }
  }' > /dev/null && echo "   ✅ maintenance_fund_payments.owner_id -> directus_users"

echo ""
echo "✅ maintenance_fund_payments 表创建完成！"
echo ""
echo "📋 表结构摘要:"
echo "   - 集合名称: maintenance_fund_payments"
echo "   - 图标: 🏦 (account_balance)"
echo "   - 字段数: 16 个业务字段 + 4 个审计字段"
echo "   - 关系: 3 个（account_id, community_id, owner_id）"
echo ""
echo "📋 缴纳类型:"
echo "   - initial（首次缴纳）"
echo "   - replenishment（续筹）"
echo "   - supplement（补缴）"
echo ""
echo "📋 核心字段说明:"
echo "   - account_id: 关联到 maintenance_fund_accounts 表"
echo "   - amount: 本次缴纳金额"
echo "   - house_area × unit_price = amount（计算依据）"
echo "   - 每次缴纳会更新账户的 total_paid 和 balance"
echo ""
echo "📋 下一步操作:"
echo "1. 在 Directus Admin 中验证"
echo "   访问: $DIRECTUS_URL/admin/content/maintenance_fund_payments"
echo "   检查: 表图标显示为 🏦 (account_balance)"
echo "   检查: 字段列表完整（20个字段）"
echo ""
echo "2. 创建测试缴纳记录"
echo "   - 选择已创建的账户（account_id）"
echo "   - 缴纳类型: initial（首次缴纳）"
echo "   - 金额: 10000.00"
echo "   - 缴纳时间: 选择日期"
echo "   - 支付方式: bank"
echo ""
echo "3. 继续创建最后一个表"
echo "   bash scripts/create-mf-usage-table.sh"
echo ""
