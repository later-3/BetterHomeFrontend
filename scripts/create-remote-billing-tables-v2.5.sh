#!/bin/bash

# 创建远端Directus的billings和billing_payments表 (v2.5设计)
# 日期：2025-10-20
# 前提：请先手动删除远端的billings和billing_payments表

set -e  # 遇到错误立即退出

DIRECTUS_URL="${DIRECTUS_URL:-https://www.betterhome.ink}"
DIRECTUS_TOKEN="${DIRECTUS_TOKEN:-sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n}"

echo "=========================================="
echo "远端Directus - 创建billings和billing_payments表 v2.5"
echo "=========================================="
echo ""
echo "⚠️  前提条件："
echo "    请确保已手动删除远端的 billings 和 billing_payments 表"
echo ""
read -p "已删除旧表，是否继续？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ 操作已取消"
  exit 1
fi

echo ""
echo "=========================================="
echo "第1步：创建billings表"
echo "=========================================="

echo "➡️  创建billings集合..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "billings",
    "meta": {
      "collection": "billings",
      "icon": "receipt_long",
      "note": "物业费账单表",
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
      "name": "billings"
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
  }' > /dev/null 2>&1 && echo "✅ billings集合已创建" || echo "⚠️  billings集合可能已存在"

echo "➡️  添加字段: community_id (uuid, FK to communities)"
curl -s -X POST "$DIRECTUS_URL/fields/billings" \
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

echo "➡️  添加字段: building_id (uuid, FK to buildings, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/billings" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "building_id",
    "type": "uuid",
    "schema": {
      "is_nullable": true,
      "foreign_key_table": "buildings",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "note": "所属楼栋",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ building_id字段已添加" || echo "⚠️  building_id字段已存在"

echo "➡️  添加字段: owner_id (uuid, FK to directus_users)"
curl -s -X POST "$DIRECTUS_URL/fields/billings" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "owner_id",
    "type": "uuid",
    "schema": {
      "is_nullable": false,
      "foreign_key_table": "directus_users",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "note": "业主用户",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ owner_id字段已添加" || echo "⚠️  owner_id字段已存在"

echo "➡️  添加字段: period (string, YYYY-MM)"
curl -s -X POST "$DIRECTUS_URL/fields/billings" \
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

echo "➡️  添加字段: amount (decimal, 月物业费)"
curl -s -X POST "$DIRECTUS_URL/fields/billings" \
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
      "note": "月物业费金额",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ amount字段已添加" || echo "⚠️  amount字段已存在"

echo "➡️  添加字段: is_paid (boolean)"
curl -s -X POST "$DIRECTUS_URL/fields/billings" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "is_paid",
    "type": "boolean",
    "schema": {
      "is_nullable": false,
      "default_value": false
    },
    "meta": {
      "interface": "boolean",
      "note": "是否已缴费",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ is_paid字段已添加" || echo "⚠️  is_paid字段已存在"

echo "➡️  添加字段: paid_at (timestamp, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/billings" \
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

echo "➡️  添加字段: area (decimal, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/billings" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "area",
    "type": "decimal",
    "schema": {
      "is_nullable": true,
      "numeric_precision": 10,
      "numeric_scale": 2
    },
    "meta": {
      "interface": "input",
      "note": "房屋面积（平方米）",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ area字段已添加" || echo "⚠️  area字段已存在"

echo "➡️  添加字段: unit_price (decimal, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/billings" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "unit_price",
    "type": "decimal",
    "schema": {
      "is_nullable": true,
      "numeric_precision": 10,
      "numeric_scale": 2
    },
    "meta": {
      "interface": "input",
      "note": "物业费单价（元/平方米）",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ unit_price字段已添加" || echo "⚠️  unit_price字段已存在"

echo "➡️  添加字段: due_date (timestamp, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/billings" \
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

echo "➡️  添加字段: late_fee (decimal, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/billings" \
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
curl -s -X POST "$DIRECTUS_URL/fields/billings" \
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
echo "第2步：创建billing_payments表"
echo "=========================================="

echo "➡️  创建billing_payments集合..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "billing_payments",
    "meta": {
      "collection": "billing_payments",
      "icon": "payments",
      "note": "物业费缴费记录表",
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
      "name": "billing_payments"
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
  }' > /dev/null 2>&1 && echo "✅ billing_payments集合已创建" || echo "⚠️  billing_payments集合可能已存在"

echo "➡️  添加字段: owner_id (uuid, FK to directus_users)"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "owner_id",
    "type": "uuid",
    "schema": {
      "is_nullable": false,
      "foreign_key_table": "directus_users",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "note": "业主用户",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ owner_id字段已添加" || echo "⚠️  owner_id字段已存在"

echo "➡️  添加字段: amount (decimal)"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" \
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
      "note": "缴费金额",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ amount字段已添加" || echo "⚠️  amount字段已存在"

echo "➡️  添加字段: paid_at (timestamp)"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" \
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

echo "➡️  添加字段: paid_periods (json)"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" \
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

echo "➡️  添加字段: payment_method (string)"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" \
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
          {"text": "银行转账", "value": "bank"},
          {"text": "现金", "value": "cash"}
        ]
      },
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ payment_method字段已添加" || echo "⚠️  payment_method字段已存在"

echo "➡️  添加字段: payer_name (string, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" \
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
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" \
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
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" \
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
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" \
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
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" \
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
echo "第3步：验证创建结果"
echo "=========================================="

# 验证billings表字段
echo "➡️  验证billings表字段..."
BILLINGS_FIELDS=$(curl -s "$DIRECTUS_URL/fields/billings" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | python3 -c "import sys, json; data = json.load(sys.stdin); fields = [f['field'] for f in data.get('data', []) if f['field'] not in ['id', 'user_created', 'date_created', 'user_updated', 'date_updated', 'date_deleted']]; print(', '.join(sorted(fields)))")

echo "   当前字段: $BILLINGS_FIELDS"

# 验证billing_payments表字段
echo "➡️  验证billing_payments表字段..."
PAYMENTS_FIELDS=$(curl -s "$DIRECTUS_URL/fields/billing_payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | python3 -c "import sys, json; data = json.load(sys.stdin); fields = [f['field'] for f in data.get('data', []) if f['field'] not in ['id', 'user_created', 'date_created', 'user_updated', 'date_updated', 'date_deleted']]; print(', '.join(sorted(fields)))")

echo "   当前字段: $PAYMENTS_FIELDS"

echo ""
echo "=========================================="
echo "✅ 创建完成！"
echo "=========================================="
echo ""
echo "📊 billings表字段："
echo "   - community_id, building_id, owner_id, period"
echo "   - amount, is_paid, paid_at"
echo "   - area, unit_price, due_date, late_fee, notes"
echo ""
echo "📊 billing_payments表字段："
echo "   - owner_id, amount, paid_at, paid_periods"
echo "   - payment_method, payer_name, payer_phone"
echo "   - transaction_no, proof_files, notes"
echo ""
echo "🔗 远端Directus Admin: https://www.betterhome.ink/admin"
echo ""
echo "📝 下一步："
echo "   1. 访问 https://www.betterhome.ink/admin 检查表结构"
echo "   2. 使用测试数据脚本生成远端数据："
echo "      cd scripts/test-data"
echo "      DIRECTUS_URL=https://www.betterhome.ink ./quick-import.sh"
echo ""
