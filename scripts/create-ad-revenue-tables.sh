#!/bin/bash

# 创建广告收益相关表
# 日期：2025-10-20
# 说明：包含 ad_spots, ad_contracts, ad_details

set -e  # 遇到错误立即退出

DIRECTUS_URL="${DIRECTUS_URL:-http://localhost:8055}"
DIRECTUS_TOKEN="${DIRECTUS_TOKEN:-sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n}"

echo "=========================================="
echo "创建广告收益相关表"
echo "=========================================="
echo ""
echo "📍 Directus URL: $DIRECTUS_URL"
echo ""
echo "将创建以下表："
echo "  1. ad_spots (广告位主数据表)"
echo "  2. ad_contracts (广告合同表)"
echo "  3. ad_details (广告收益详情表)"
echo ""
read -p "是否继续？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ 操作已取消"
  exit 1
fi

echo ""
echo "=========================================="
echo "第1步：创建ad_spots表（广告位主数据表）"
echo "=========================================="

echo "➡️  创建ad_spots集合..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "ad_spots",
    "meta": {
      "collection": "ad_spots",
      "icon": "ad_units",
      "note": "广告位主数据表 - 所有广告位的档案",
      "display_template": "{{spot_code}} - {{location}}",
      "hidden": false,
      "singleton": false,
      "archive_field": "date_deleted",
      "archive_app_filter": true,
      "accountability": "all",
      "collapse": "open"
    },
    "schema": {
      "name": "ad_spots"
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
  }' > /dev/null 2>&1 && echo "✅ ad_spots集合已创建" || echo "⚠️  ad_spots集合可能已存在"

echo "➡️  添加字段: community_id"
curl -s -X POST "$DIRECTUS_URL/fields/ad_spots" \
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
  }' > /dev/null 2>&1 && echo "✅ community_id" || echo "⚠️  community_id已存在"

echo "➡️  添加字段: spot_code"
curl -s -X POST "$DIRECTUS_URL/fields/ad_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "spot_code",
    "type": "string",
    "schema": {
      "is_nullable": false,
      "max_length": 50
    },
    "meta": {
      "interface": "input",
      "note": "广告位编号，如 AD-1-1-ELEVATOR",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ spot_code" || echo "⚠️  spot_code已存在"

echo "➡️  添加字段: spot_type"
curl -s -X POST "$DIRECTUS_URL/fields/ad_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "spot_type",
    "type": "string",
    "schema": {
      "is_nullable": false,
      "max_length": 20
    },
    "meta": {
      "interface": "select-dropdown",
      "note": "广告位类型",
      "options": {
        "choices": [
          {"text": "电梯广告", "value": "elevator"},
          {"text": "闸机广告", "value": "gate"}
        ]
      },
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ spot_type" || echo "⚠️  spot_type已存在"

echo "➡️  添加字段: location"
curl -s -X POST "$DIRECTUS_URL/fields/ad_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "location",
    "type": "string",
    "schema": {
      "is_nullable": false,
      "max_length": 100
    },
    "meta": {
      "interface": "input",
      "note": "位置描述，如 1号楼1单元电梯",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ location" || echo "⚠️  location已存在"

echo "➡️  添加字段: floor (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/ad_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "floor",
    "type": "string",
    "schema": {
      "is_nullable": true,
      "max_length": 20
    },
    "meta": {
      "interface": "input",
      "note": "楼层（仅电梯广告），如 1-18层",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ floor" || echo "⚠️  floor已存在"

echo "➡️  添加字段: size_spec (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/ad_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "size_spec",
    "type": "string",
    "schema": {
      "is_nullable": true,
      "max_length": 50
    },
    "meta": {
      "interface": "input",
      "note": "尺寸规格，如 60cm×90cm",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ size_spec" || echo "⚠️  size_spec已存在"

echo "➡️  添加字段: base_price_monthly"
curl -s -X POST "$DIRECTUS_URL/fields/ad_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "base_price_monthly",
    "type": "decimal",
    "schema": {
      "is_nullable": false,
      "numeric_precision": 10,
      "numeric_scale": 2
    },
    "meta": {
      "interface": "input",
      "note": "月租金参考价",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ base_price_monthly" || echo "⚠️  base_price_monthly已存在"

echo "➡️  添加字段: status"
curl -s -X POST "$DIRECTUS_URL/fields/ad_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "status",
    "type": "string",
    "schema": {
      "is_nullable": false,
      "default_value": "available",
      "max_length": 20
    },
    "meta": {
      "interface": "select-dropdown",
      "note": "广告位状态",
      "options": {
        "choices": [
          {"text": "空闲可出租", "value": "available"},
          {"text": "已出租", "value": "rented"},
          {"text": "维护中不可用", "value": "maintenance"}
        ]
      },
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ status" || echo "⚠️  status已存在"

echo "➡️  添加字段: current_contract_id (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/ad_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "current_contract_id",
    "type": "uuid",
    "schema": {
      "is_nullable": true,
      "foreign_key_table": "ad_contracts",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "note": "当前合同ID",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ current_contract_id" || echo "⚠️  current_contract_id已存在"

echo "➡️  添加字段: notes (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/ad_spots" \
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
  }' > /dev/null 2>&1 && echo "✅ notes" || echo "⚠️  notes已存在"

echo ""
echo "=========================================="
echo "第2步：创建ad_contracts表（广告合同表）"
echo "=========================================="

echo "➡️  创建ad_contracts集合..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "ad_contracts",
    "meta": {
      "collection": "ad_contracts",
      "icon": "description",
      "note": "广告合同表 - 每次签约的合同记录",
      "display_template": "{{contract_no}} - {{advertiser_name}}",
      "hidden": false,
      "singleton": false,
      "archive_field": "date_deleted",
      "archive_app_filter": true,
      "accountability": "all",
      "collapse": "open"
    },
    "schema": {
      "name": "ad_contracts"
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
  }' > /dev/null 2>&1 && echo "✅ ad_contracts集合已创建" || echo "⚠️  ad_contracts集合可能已存在"

echo "➡️  添加字段: community_id"
curl -s -X POST "$DIRECTUS_URL/fields/ad_contracts" \
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
  }' > /dev/null 2>&1 && echo "✅ community_id" || echo "⚠️  community_id已存在"

echo "➡️  添加字段: spot_id"
curl -s -X POST "$DIRECTUS_URL/fields/ad_contracts" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "spot_id",
    "type": "uuid",
    "schema": {
      "is_nullable": false,
      "foreign_key_table": "ad_spots",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "note": "关联广告位",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ spot_id" || echo "⚠️  spot_id已存在"

echo "➡️  添加字段: contract_no (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/ad_contracts" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "contract_no",
    "type": "string",
    "schema": {
      "is_nullable": true,
      "max_length": 50
    },
    "meta": {
      "interface": "input",
      "note": "合同编号，如 AD-2025-001",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ contract_no" || echo "⚠️  contract_no已存在"

echo "➡️  添加字段: advertiser_name"
curl -s -X POST "$DIRECTUS_URL/fields/ad_contracts" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "advertiser_name",
    "type": "string",
    "schema": {
      "is_nullable": false,
      "max_length": 100
    },
    "meta": {
      "interface": "input",
      "note": "广告主姓名/联系人",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ advertiser_name" || echo "⚠️  advertiser_name已存在"

echo "➡️  添加字段: advertiser_company (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/ad_contracts" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "advertiser_company",
    "type": "string",
    "schema": {
      "is_nullable": true,
      "max_length": 200
    },
    "meta": {
      "interface": "input",
      "note": "广告公司名称",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ advertiser_company" || echo "⚠️  advertiser_company已存在"

echo "➡️  添加字段: advertiser_phone"
curl -s -X POST "$DIRECTUS_URL/fields/ad_contracts" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "advertiser_phone",
    "type": "string",
    "schema": {
      "is_nullable": false,
      "max_length": 20
    },
    "meta": {
      "interface": "input",
      "note": "广告主电话",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ advertiser_phone" || echo "⚠️  advertiser_phone已存在"

echo "➡️  添加字段: advertiser_email (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/ad_contracts" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "advertiser_email",
    "type": "string",
    "schema": {
      "is_nullable": true,
      "max_length": 100
    },
    "meta": {
      "interface": "input",
      "note": "广告主邮箱",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ advertiser_email" || echo "⚠️  advertiser_email已存在"

echo "➡️  添加字段: contract_start"
curl -s -X POST "$DIRECTUS_URL/fields/ad_contracts" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "contract_start",
    "type": "date",
    "schema": {
      "is_nullable": false
    },
    "meta": {
      "interface": "datetime",
      "display": "date",
      "note": "合同开始日期",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ contract_start" || echo "⚠️  contract_start已存在"

echo "➡️  添加字段: contract_end"
curl -s -X POST "$DIRECTUS_URL/fields/ad_contracts" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "contract_end",
    "type": "date",
    "schema": {
      "is_nullable": false
    },
    "meta": {
      "interface": "datetime",
      "display": "date",
      "note": "合同结束日期",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ contract_end" || echo "⚠️  contract_end已存在"

echo "➡️  添加字段: monthly_rent"
curl -s -X POST "$DIRECTUS_URL/fields/ad_contracts" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "monthly_rent",
    "type": "decimal",
    "schema": {
      "is_nullable": false,
      "numeric_precision": 10,
      "numeric_scale": 2
    },
    "meta": {
      "interface": "input",
      "note": "月租金",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ monthly_rent" || echo "⚠️  monthly_rent已存在"

echo "➡️  添加字段: total_amount"
curl -s -X POST "$DIRECTUS_URL/fields/ad_contracts" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "total_amount",
    "type": "decimal",
    "schema": {
      "is_nullable": false,
      "numeric_precision": 10,
      "numeric_scale": 2
    },
    "meta": {
      "interface": "input",
      "note": "合同总金额",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ total_amount" || echo "⚠️  total_amount已存在"

echo "➡️  添加字段: deposit"
curl -s -X POST "$DIRECTUS_URL/fields/ad_contracts" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "deposit",
    "type": "decimal",
    "schema": {
      "is_nullable": true,
      "default_value": 0,
      "numeric_precision": 10,
      "numeric_scale": 2
    },
    "meta": {
      "interface": "input",
      "note": "押金",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ deposit" || echo "⚠️  deposit已存在"

echo "➡️  添加字段: deposit_status"
curl -s -X POST "$DIRECTUS_URL/fields/ad_contracts" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "deposit_status",
    "type": "string",
    "schema": {
      "is_nullable": true,
      "default_value": "none",
      "max_length": 20
    },
    "meta": {
      "interface": "select-dropdown",
      "note": "押金状态",
      "options": {
        "choices": [
          {"text": "无押金", "value": "none"},
          {"text": "押金已缴纳", "value": "paid"},
          {"text": "押金已退还", "value": "refunded"}
        ]
      },
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ deposit_status" || echo "⚠️  deposit_status已存在"

echo "➡️  添加字段: status"
curl -s -X POST "$DIRECTUS_URL/fields/ad_contracts" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "status",
    "type": "string",
    "schema": {
      "is_nullable": false,
      "default_value": "active",
      "max_length": 20
    },
    "meta": {
      "interface": "select-dropdown",
      "note": "合同状态",
      "options": {
        "choices": [
          {"text": "合同有效期内", "value": "active"},
          {"text": "合同正常到期结束", "value": "completed"},
          {"text": "合同提前终止", "value": "terminated"}
        ]
      },
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ status" || echo "⚠️  status已存在"

echo "➡️  添加字段: contract_files (json, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/ad_contracts" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "contract_files",
    "type": "json",
    "schema": {
      "is_nullable": true
    },
    "meta": {
      "interface": "input-code",
      "special": ["cast-json"],
      "note": "合同文件ID数组",
      "options": {
        "language": "json",
        "template": "[]"
      },
      "width": "full"
    }
  }' > /dev/null 2>&1 && echo "✅ contract_files" || echo "⚠️  contract_files已存在"

echo "➡️  添加字段: notes (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/ad_contracts" \
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
      "note": "备注",
      "width": "full"
    }
  }' > /dev/null 2>&1 && echo "✅ notes" || echo "⚠️  notes已存在"

echo ""
echo "=========================================="
echo "第3步：创建ad_details表（广告收益详情表）"
echo "=========================================="

echo "➡️  创建ad_details集合..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "ad_details",
    "meta": {
      "collection": "ad_details",
      "icon": "link",
      "note": "广告收益详情表 - 连接receivables和ad_contracts",
      "hidden": false,
      "singleton": false,
      "accountability": "all",
      "collapse": "open"
    },
    "schema": {
      "name": "ad_details"
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
  }' > /dev/null 2>&1 && echo "✅ ad_details集合已创建" || echo "⚠️  ad_details集合可能已存在"

echo "➡️  添加字段: spot_id"
curl -s -X POST "$DIRECTUS_URL/fields/ad_details" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "spot_id",
    "type": "uuid",
    "schema": {
      "is_nullable": false,
      "foreign_key_table": "ad_spots",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "note": "关联广告位",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ spot_id" || echo "⚠️  spot_id已存在"

echo "➡️  添加字段: contract_id"
curl -s -X POST "$DIRECTUS_URL/fields/ad_details" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "contract_id",
    "type": "uuid",
    "schema": {
      "is_nullable": false,
      "foreign_key_table": "ad_contracts",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "note": "关联合同",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ contract_id" || echo "⚠️  contract_id已存在"

echo "➡️  添加字段: receivable_id (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/ad_details" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "receivable_id",
    "type": "uuid",
    "schema": {
      "is_nullable": true,
      "foreign_key_table": "receivables",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "note": "关联应收账单",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ receivable_id" || echo "⚠️  receivable_id已存在"

echo "➡️  添加字段: payment_id (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/ad_details" \
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
  }' > /dev/null 2>&1 && echo "✅ payment_id" || echo "⚠️  payment_id已存在"

echo ""
echo "=========================================="
echo "第4步：创建外键关系"
echo "=========================================="

echo "➡️  创建ad_spots.community_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "ad_spots",
    "field": "community_id",
    "related_collection": "communities"
  }' > /dev/null 2>&1 && echo "✅ ad_spots.community_id" || echo "⚠️  ad_spots.community_id已存在"

echo "➡️  创建ad_spots.current_contract_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "ad_spots",
    "field": "current_contract_id",
    "related_collection": "ad_contracts"
  }' > /dev/null 2>&1 && echo "✅ ad_spots.current_contract_id" || echo "⚠️  ad_spots.current_contract_id已存在"

echo "➡️  创建ad_contracts.community_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "ad_contracts",
    "field": "community_id",
    "related_collection": "communities"
  }' > /dev/null 2>&1 && echo "✅ ad_contracts.community_id" || echo "⚠️  ad_contracts.community_id已存在"

echo "➡️  创建ad_contracts.spot_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "ad_contracts",
    "field": "spot_id",
    "related_collection": "ad_spots"
  }' > /dev/null 2>&1 && echo "✅ ad_contracts.spot_id" || echo "⚠️  ad_contracts.spot_id已存在"

echo "➡️  创建ad_details.spot_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "ad_details",
    "field": "spot_id",
    "related_collection": "ad_spots"
  }' > /dev/null 2>&1 && echo "✅ ad_details.spot_id" || echo "⚠️  ad_details.spot_id已存在"

echo "➡️  创建ad_details.contract_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "ad_details",
    "field": "contract_id",
    "related_collection": "ad_contracts"
  }' > /dev/null 2>&1 && echo "✅ ad_details.contract_id" || echo "⚠️  ad_details.contract_id已存在"

echo "➡️  创建ad_details.receivable_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "ad_details",
    "field": "receivable_id",
    "related_collection": "receivables"
  }' > /dev/null 2>&1 && echo "✅ ad_details.receivable_id" || echo "⚠️  ad_details.receivable_id已存在"

echo "➡️  创建ad_details.payment_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "ad_details",
    "field": "payment_id",
    "related_collection": "payments"
  }' > /dev/null 2>&1 && echo "✅ ad_details.payment_id" || echo "⚠️  ad_details.payment_id已存在"

echo ""
echo "=========================================="
echo "✅ 广告收益相关表创建完成！"
echo "=========================================="
echo ""
echo "📊 已创建的表："
echo "   1. ad_spots (10个字段)"
echo "   2. ad_contracts (16个字段)"
echo "   3. ad_details (4个字段)"
echo ""
echo "🔗 Directus Admin: $DIRECTUS_URL/admin"
echo ""
echo "🎉 所有收益管理表创建完成！"
echo ""
echo "📊 表结构总览："
echo "   核心表："
echo "     - receivables (应收核心表)"
echo "     - payments (实收核心表)"
echo ""
echo "   停车费相关："
echo "     - parking_spots (停车位主数据表)"
echo "     - parking_details (停车费详情表)"
echo "     - parking_temp_records (临停费记录表)"
echo ""
echo "   广告收益相关："
echo "     - ad_spots (广告位主数据表)"
echo "     - ad_contracts (广告合同表)"
echo "     - ad_details (广告收益详情表)"
echo ""
