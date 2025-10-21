#!/bin/bash

# 创建收益管理核心表：receivables 和 payments
# 日期：2025-10-20
# 说明：这是混合方案的核心表，用于所有非物业费的收益管理

set -e  # 遇到错误立即退出

DIRECTUS_URL="${DIRECTUS_URL:-http://localhost:8055}"
DIRECTUS_TOKEN="${DIRECTUS_TOKEN:-sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n}"

echo "=========================================="
echo "创建收益管理核心表"
echo "=========================================="
echo ""
echo "📍 Directus URL: $DIRECTUS_URL"
echo ""
read -p "是否继续？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ 操作已取消"
  exit 1
fi

echo ""
echo "=========================================="
echo "第1步：创建receivables表（应收核心表）"
echo "=========================================="

echo "➡️  创建receivables集合..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "receivables",
    "meta": {
      "collection": "receivables",
      "icon": "receipt",
      "note": "应收核心表 - 所有非物业费的应收账单",
      "display_template": null,
      "hidden": false,
      "singleton": false,
      "translations": null,
      "archive_field": "date_deleted",
      "archive_app_filter": true,
      "archive_value": null,
      "unarchive_value": null,
      "sort_field": null,
      "accountability": "all",
      "color": null,
      "item_duplication_fields": null,
      "sort": null,
      "group": null,
      "collapse": "open"
    },
    "schema": {
      "name": "receivables"
    },
    "fields": [
      {
        "field": "id",
        "type": "uuid",
        "schema": {
          "is_primary_key": true,
          "is_nullable": false
        },
        "meta": {
          "interface": "input",
          "readonly": true,
          "hidden": true,
          "special": ["uuid"]
        }
      }
    ]
  }' > /dev/null 2>&1 && echo "✅ receivables集合已创建" || echo "⚠️  receivables集合可能已存在"

echo "➡️  添加字段: community_id (uuid, FK to communities)"
curl -s -X POST "$DIRECTUS_URL/fields/receivables" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "community_id",
    "type": "uuid",
    "schema": {
      "is_nullable": false,
      "foreign_key_table": "communities",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "note": "所属小区",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ community_id字段已添加" || echo "⚠️  community_id字段已存在"

echo "➡️  添加字段: type_code (string)"
curl -s -X POST "$DIRECTUS_URL/fields/receivables" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "type_code",
    "type": "string",
    "schema": {
      "is_nullable": false,
      "max_length": 50
    },
    "meta": {
      "interface": "select-dropdown",
      "note": "收益类型代码",
      "options": {
        "choices": [
          {"text": "车位管理费", "value": "parking_management"},
          {"text": "车位租金", "value": "parking_rent"},
          {"text": "广告收益", "value": "ad_revenue"}
        ]
      },
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ type_code字段已添加" || echo "⚠️  type_code字段已存在"

echo "➡️  添加字段: type_detail_id (uuid, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/receivables" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "type_detail_id",
    "type": "uuid",
    "schema": {
      "is_nullable": true
    },
    "meta": {
      "interface": "input",
      "note": "详情表ID（如parking_details.id或ad_details.id）",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ type_detail_id字段已添加" || echo "⚠️  type_detail_id字段已存在"

echo "➡️  添加字段: owner_id (uuid, FK to directus_users, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/receivables" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "owner_id",
    "type": "uuid",
    "schema": {
      "is_nullable": true,
      "foreign_key_table": "directus_users",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "note": "关联用户（业主/租户）",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ owner_id字段已添加" || echo "⚠️  owner_id字段已存在"

echo "➡️  添加字段: period (string, YYYY-MM)"
curl -s -X POST "$DIRECTUS_URL/fields/receivables" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "period",
    "type": "string",
    "schema": {
      "is_nullable": false,
      "max_length": 7
    },
    "meta": {
      "interface": "input",
      "note": "账期，格式：2025-01",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ period字段已添加" || echo "⚠️  period字段已存在"

echo "➡️  添加字段: amount (decimal)"
curl -s -X POST "$DIRECTUS_URL/fields/receivables" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "amount",
    "type": "decimal",
    "schema": {
      "is_nullable": false,
      "numeric_precision": 10,
      "numeric_scale": 2
    },
    "meta": {
      "interface": "input",
      "note": "应收金额",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ amount字段已添加" || echo "⚠️  amount字段已存在"

echo "➡️  添加字段: due_date (timestamp, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/receivables" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "due_date",
    "type": "timestamp",
    "schema": {
      "is_nullable": true
    },
    "meta": {
      "interface": "datetime",
      "note": "应缴日期",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ due_date字段已添加" || echo "⚠️  due_date字段已存在"

echo "➡️  添加字段: status (string)"
curl -s -X POST "$DIRECTUS_URL/fields/receivables" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "status",
    "type": "string",
    "schema": {
      "is_nullable": false,
      "default_value": "unpaid",
      "max_length": 20
    },
    "meta": {
      "interface": "select-dropdown",
      "note": "状态",
      "options": {
        "choices": [
          {"text": "未缴费", "value": "unpaid"},
          {"text": "已缴费", "value": "paid"},
          {"text": "已取消", "value": "cancelled"}
        ]
      },
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ status字段已添加" || echo "⚠️  status字段已存在"

echo "➡️  添加字段: paid_at (timestamp, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/receivables" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "paid_at",
    "type": "timestamp",
    "schema": {
      "is_nullable": true
    },
    "meta": {
      "interface": "datetime",
      "note": "缴费时间",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ paid_at字段已添加" || echo "⚠️  paid_at字段已存在"

echo "➡️  添加字段: payment_id (uuid, FK to payments, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/receivables" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "payment_id",
    "type": "uuid",
    "schema": {
      "is_nullable": true,
      "foreign_key_table": "payments",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "note": "关联缴费记录",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ payment_id字段已添加" || echo "⚠️  payment_id字段已存在"

echo "➡️  添加字段: late_fee (decimal)"
curl -s -X POST "$DIRECTUS_URL/fields/receivables" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "late_fee",
    "type": "decimal",
    "schema": {
      "is_nullable": true,
      "default_value": 0,
      "numeric_precision": 10,
      "numeric_scale": 2
    },
    "meta": {
      "interface": "input",
      "note": "滞纳金",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ late_fee字段已添加" || echo "⚠️  late_fee字段已存在"

echo "➡️  添加字段: notes (text, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/receivables" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "notes",
    "type": "text",
    "schema": {
      "is_nullable": true
    },
    "meta": {
      "interface": "input-multiline",
      "note": "备注信息",
      "width": "full"
    }
  }' > /dev/null 2>&1 && echo "✅ notes字段已添加" || echo "⚠️  notes字段已存在"

echo ""
echo "=========================================="
echo "第2步：创建payments表（实收核心表）"
echo "=========================================="

echo "➡️  创建payments集合..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "payments",
    "meta": {
      "collection": "payments",
      "icon": "payments",
      "note": "实收核心表 - 所有非物业费的缴费记录",
      "display_template": null,
      "hidden": false,
      "singleton": false,
      "translations": null,
      "archive_field": "date_deleted",
      "archive_app_filter": true,
      "archive_value": null,
      "unarchive_value": null,
      "sort_field": null,
      "accountability": "all",
      "color": null,
      "item_duplication_fields": null,
      "sort": null,
      "group": null,
      "collapse": "open"
    },
    "schema": {
      "name": "payments"
    },
    "fields": [
      {
        "field": "id",
        "type": "uuid",
        "schema": {
          "is_primary_key": true,
          "is_nullable": false
        },
        "meta": {
          "interface": "input",
          "readonly": true,
          "hidden": true,
          "special": ["uuid"]
        }
      }
    ]
  }' > /dev/null 2>&1 && echo "✅ payments集合已创建" || echo "⚠️  payments集合可能已存在"

echo "➡️  添加字段: community_id (uuid, FK to communities)"
curl -s -X POST "$DIRECTUS_URL/fields/payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "community_id",
    "type": "uuid",
    "schema": {
      "is_nullable": false,
      "foreign_key_table": "communities",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "note": "所属小区",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ community_id字段已添加" || echo "⚠️  community_id字段已存在"

echo "➡️  添加字段: type_code (string)"
curl -s -X POST "$DIRECTUS_URL/fields/payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "type_code",
    "type": "string",
    "schema": {
      "is_nullable": false,
      "max_length": 50
    },
    "meta": {
      "interface": "select-dropdown",
      "note": "收益类型代码",
      "options": {
        "choices": [
          {"text": "车位管理费", "value": "parking_management"},
          {"text": "车位租金", "value": "parking_rent"},
          {"text": "临时停车费", "value": "parking_temp"},
          {"text": "广告收益", "value": "ad_revenue"}
        ]
      },
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ type_code字段已添加" || echo "⚠️  type_code字段已存在"

echo "➡️  添加字段: owner_id (uuid, FK to directus_users, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "owner_id",
    "type": "uuid",
    "schema": {
      "is_nullable": true,
      "foreign_key_table": "directus_users",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "note": "关联用户（业主/租户）",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ owner_id字段已添加" || echo "⚠️  owner_id字段已存在"

echo "➡️  添加字段: amount (decimal)"
curl -s -X POST "$DIRECTUS_URL/fields/payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "amount",
    "type": "decimal",
    "schema": {
      "is_nullable": false,
      "numeric_precision": 10,
      "numeric_scale": 2
    },
    "meta": {
      "interface": "input",
      "note": "实缴金额",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ amount字段已添加" || echo "⚠️  amount字段已存在"

echo "➡️  添加字段: paid_at (timestamp)"
curl -s -X POST "$DIRECTUS_URL/fields/payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "paid_at",
    "type": "timestamp",
    "schema": {
      "is_nullable": false
    },
    "meta": {
      "interface": "datetime",
      "note": "缴费时间",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ paid_at字段已添加" || echo "⚠️  paid_at字段已存在"

echo "➡️  添加字段: paid_periods (json, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "paid_periods",
    "type": "json",
    "schema": {
      "is_nullable": true
    },
    "meta": {
      "interface": "input-code",
      "special": ["cast-json"],
      "note": "缴费账期数组，如 [\"2025-01\", \"2025-02\"]",
      "options": {
        "language": "json",
        "template": "[]"
      },
      "width": "full"
    }
  }' > /dev/null 2>&1 && echo "✅ paid_periods字段已添加" || echo "⚠️  paid_periods字段已存在"

echo "➡️  添加字段: payment_method (string, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "payment_method",
    "type": "string",
    "schema": {
      "is_nullable": true,
      "max_length": 50
    },
    "meta": {
      "interface": "select-dropdown",
      "note": "支付方式",
      "options": {
        "choices": [
          {"text": "微信支付", "value": "wechat"},
          {"text": "支付宝", "value": "alipay"},
          {"text": "银行转账", "value": "bank_transfer"},
          {"text": "现金", "value": "cash"}
        ]
      },
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ payment_method字段已添加" || echo "⚠️  payment_method字段已存在"

echo "➡️  添加字段: payer_name (string, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "payer_name",
    "type": "string",
    "schema": {
      "is_nullable": true,
      "max_length": 100
    },
    "meta": {
      "interface": "input",
      "note": "缴费人姓名",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ payer_name字段已添加" || echo "⚠️  payer_name字段已存在"

echo "➡️  添加字段: payer_phone (string, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "payer_phone",
    "type": "string",
    "schema": {
      "is_nullable": true,
      "max_length": 20
    },
    "meta": {
      "interface": "input",
      "note": "缴费人电话",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ payer_phone字段已添加" || echo "⚠️  payer_phone字段已存在"

echo "➡️  添加字段: transaction_no (string, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "transaction_no",
    "type": "string",
    "schema": {
      "is_nullable": true,
      "max_length": 100
    },
    "meta": {
      "interface": "input",
      "note": "交易单号",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ transaction_no字段已添加" || echo "⚠️  transaction_no字段已存在"

echo "➡️  添加字段: proof_files (json, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "proof_files",
    "type": "json",
    "schema": {
      "is_nullable": true
    },
    "meta": {
      "interface": "input-code",
      "special": ["cast-json"],
      "note": "缴费凭证文件ID数组",
      "options": {
        "language": "json",
        "template": "[]"
      },
      "width": "full"
    }
  }' > /dev/null 2>&1 && echo "✅ proof_files字段已添加" || echo "⚠️  proof_files字段已存在"

echo "➡️  添加字段: notes (text, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "notes",
    "type": "text",
    "schema": {
      "is_nullable": true
    },
    "meta": {
      "interface": "input-multiline",
      "note": "备注信息",
      "width": "full"
    }
  }' > /dev/null 2>&1 && echo "✅ notes字段已添加" || echo "⚠️  notes字段已存在"

echo ""
echo "=========================================="
echo "第3步：创建外键关系"
echo "=========================================="

echo "➡️  创建receivables.community_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "receivables",
    "field": "community_id",
    "related_collection": "communities"
  }' > /dev/null 2>&1 && echo "✅ receivables.community_id" || echo "⚠️  receivables.community_id已存在"

echo "➡️  创建receivables.owner_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "receivables",
    "field": "owner_id",
    "related_collection": "directus_users"
  }' > /dev/null 2>&1 && echo "✅ receivables.owner_id" || echo "⚠️  receivables.owner_id已存在"

echo "➡️  创建receivables.payment_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "receivables",
    "field": "payment_id",
    "related_collection": "payments"
  }' > /dev/null 2>&1 && echo "✅ receivables.payment_id" || echo "⚠️  receivables.payment_id已存在"

echo "➡️  创建payments.community_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "payments",
    "field": "community_id",
    "related_collection": "communities"
  }' > /dev/null 2>&1 && echo "✅ payments.community_id" || echo "⚠️  payments.community_id已存在"

echo "➡️  创建payments.owner_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "payments",
    "field": "owner_id",
    "related_collection": "directus_users"
  }' > /dev/null 2>&1 && echo "✅ payments.owner_id" || echo "⚠️  payments.owner_id已存在"

echo ""
echo "=========================================="
echo "第4步：验证创建结果"
echo "=========================================="

# 验证receivables表字段
echo "➡️  验证receivables表字段..."
RECEIVABLES_FIELDS=$(curl -s "$DIRECTUS_URL/fields/receivables" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | python3 -c "import sys, json; data = json.load(sys.stdin); fields = [f['field'] for f in data.get('data', []) if f['field'] not in ['id', 'user_created', 'date_created', 'user_updated', 'date_updated', 'date_deleted']]; print(', '.join(sorted(fields)))" 2>/dev/null || echo "无法验证")

echo "   当前字段: $RECEIVABLES_FIELDS"

# 验证payments表字段
echo "➡️  验证payments表字段..."
PAYMENTS_FIELDS=$(curl -s "$DIRECTUS_URL/fields/payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | python3 -c "import sys, json; data = json.load(sys.stdin); fields = [f['field'] for f in data.get('data', []) if f['field'] not in ['id', 'user_created', 'date_created', 'user_updated', 'date_updated', 'date_deleted']]; print(', '.join(sorted(fields)))" 2>/dev/null || echo "无法验证")

echo "   当前字段: $PAYMENTS_FIELDS"

echo ""
echo "=========================================="
echo "✅ 核心表创建完成！"
echo "=========================================="
echo ""
echo "📊 receivables表字段："
echo "   - community_id, type_code, type_detail_id, owner_id"
echo "   - period, amount, due_date, status"
echo "   - paid_at, payment_id, late_fee, notes"
echo ""
echo "📊 payments表字段："
echo "   - community_id, type_code, owner_id"
echo "   - amount, paid_at, paid_periods"
echo "   - payment_method, payer_name, payer_phone"
echo "   - transaction_no, proof_files, notes"
echo ""
echo "📝 type_code可选值："
echo "   receivables: parking_management, parking_rent, ad_revenue"
echo "   payments: parking_management, parking_rent, parking_temp, ad_revenue"
echo ""
echo "🔗 Directus Admin: $DIRECTUS_URL/admin"
echo ""
echo "📝 下一步："
echo "   bash scripts/create-parking-tables.sh"
echo ""
