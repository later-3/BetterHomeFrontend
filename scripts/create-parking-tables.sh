#!/bin/bash

# 创建停车费相关表
# 日期：2025-10-20
# 说明：包含 parking_spots, parking_details, parking_temp_records

set -e  # 遇到错误立即退出

DIRECTUS_URL="${DIRECTUS_URL:-http://localhost:8055}"
DIRECTUS_TOKEN="${DIRECTUS_TOKEN:-sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n}"

echo "=========================================="
echo "创建停车费相关表"
echo "=========================================="
echo ""
echo "📍 Directus URL: $DIRECTUS_URL"
echo ""
echo "将创建以下表："
echo "  1. parking_spots (停车位主数据表)"
echo "  2. parking_details (停车费详情表)"
echo "  3. parking_temp_records (临停费记录表)"
echo ""
read -p "是否继续？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ 操作已取消"
  exit 1
fi

echo ""
echo "=========================================="
echo "第1步：创建parking_spots表（停车位主数据表）"
echo "=========================================="

echo "➡️  创建parking_spots集合..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "parking_spots",
    "meta": {
      "collection": "parking_spots",
      "icon": "local_parking",
      "note": "停车位主数据表 - 所有车位的档案",
      "display_template": "{{spot_number}} - {{location}}",
      "hidden": false,
      "singleton": false,
      "archive_field": "date_deleted",
      "archive_app_filter": true,
      "accountability": "all",
      "collapse": "open"
    },
    "schema": {
      "name": "parking_spots"
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
  }' > /dev/null 2>&1 && echo "✅ parking_spots集合已创建" || echo "⚠️  parking_spots集合可能已存在"

# 添加基本字段
echo "➡️  添加字段: community_id"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
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

echo "➡️  添加字段: building_id (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
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
      "note": "所属楼栋（可选）",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ building_id" || echo "⚠️  building_id已存在"

echo "➡️  添加字段: spot_number"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "spot_number",
    "type": "string",
    "schema": {
      "is_nullable": false,
      "max_length": 50
    },
    "meta": {
      "interface": "input",
      "note": "车位编号，如 A-101",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ spot_number" || echo "⚠️  spot_number已存在"

echo "➡️  添加字段: location"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "location",
    "type": "string",
    "schema": {
      "is_nullable": true,
      "max_length": 100
    },
    "meta": {
      "interface": "input",
      "note": "位置描述，如 地下1层A区",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ location" || echo "⚠️  location已存在"

echo "➡️  添加字段: type"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "type",
    "type": "string",
    "schema": {
      "is_nullable": false,
      "max_length": 20
    },
    "meta": {
      "interface": "select-dropdown",
      "note": "车位类型：fixed=有产权的固定车位，public=无产权的公共车位。临停不在此表，在parking_temp_records表",
      "options": {
        "choices": [
          {"text": "固定车位（有产权）", "value": "fixed"},
          {"text": "公共车位（无产权）", "value": "public"}
        ]
      },
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ type" || echo "⚠️  type已存在"

echo "➡️  添加字段: ownership"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "ownership",
    "type": "string",
    "schema": {
      "is_nullable": false,
      "max_length": 20
    },
    "meta": {
      "interface": "select-dropdown",
      "note": "产权类型",
      "options": {
        "choices": [
          {"text": "业主已购买", "value": "owned"},
          {"text": "公共车位", "value": "public"}
        ]
      },
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ ownership" || echo "⚠️  ownership已存在"

echo "➡️  添加字段: is_sold"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "is_sold",
    "type": "boolean",
    "schema": {
      "is_nullable": false,
      "default_value": false
    },
    "meta": {
      "interface": "boolean",
      "note": "是否已出售",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ is_sold" || echo "⚠️  is_sold已存在"

echo "➡️  添加字段: is_rented"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "is_rented",
    "type": "boolean",
    "schema": {
      "is_nullable": false,
      "default_value": false
    },
    "meta": {
      "interface": "boolean",
      "note": "是否已出租",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ is_rented" || echo "⚠️  is_rented已存在"

echo "➡️  添加字段: owner_id (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
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
      "note": "产权业主ID",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ owner_id" || echo "⚠️  owner_id已存在"

echo "➡️  添加字段: renter_id (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "renter_id",
    "type": "uuid",
    "schema": {
      "is_nullable": true,
      "foreign_key_table": "directus_users",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "note": "租户ID",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ renter_id" || echo "⚠️  renter_id已存在"

echo "➡️  添加字段: license_plate"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "license_plate",
    "type": "string",
    "schema": {
      "is_nullable": true,
      "max_length": 20
    },
    "meta": {
      "interface": "input",
      "note": "绑定车牌号",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ license_plate" || echo "⚠️  license_plate已存在"

echo "➡️  添加字段: monthly_management_fee"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "monthly_management_fee",
    "type": "decimal",
    "schema": {
      "is_nullable": true,
      "numeric_precision": 10,
      "numeric_scale": 2
    },
    "meta": {
      "interface": "input",
      "note": "月管理费",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ monthly_management_fee" || echo "⚠️  monthly_management_fee已存在"

echo "➡️  添加字段: monthly_rent"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "monthly_rent",
    "type": "decimal",
    "schema": {
      "is_nullable": true,
      "numeric_precision": 10,
      "numeric_scale": 2
    },
    "meta": {
      "interface": "input",
      "note": "月租金标准",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ monthly_rent" || echo "⚠️  monthly_rent已存在"

echo "➡️  添加字段: rent_contract_start"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "rent_contract_start",
    "type": "date",
    "schema": {
      "is_nullable": true
    },
    "meta": {
      "interface": "datetime",
      "display": "date",
      "note": "租赁合同开始日期",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ rent_contract_start" || echo "⚠️  rent_contract_start已存在"

echo "➡️  添加字段: rent_contract_end"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "rent_contract_end",
    "type": "date",
    "schema": {
      "is_nullable": true
    },
    "meta": {
      "interface": "datetime",
      "display": "date",
      "note": "租赁合同结束日期",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ rent_contract_end" || echo "⚠️  rent_contract_end已存在"

echo "➡️  添加字段: purchase_contract_files (json)"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "purchase_contract_files",
    "type": "json",
    "schema": {
      "is_nullable": true
    },
    "meta": {
      "interface": "input-code",
      "special": ["cast-json"],
      "note": "购买合同文件ID数组",
      "options": {
        "language": "json",
        "template": "[]"
      },
      "width": "full"
    }
  }' > /dev/null 2>&1 && echo "✅ purchase_contract_files" || echo "⚠️  purchase_contract_files已存在"

echo "➡️  添加字段: rent_contract_files (json)"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "rent_contract_files",
    "type": "json",
    "schema": {
      "is_nullable": true
    },
    "meta": {
      "interface": "input-code",
      "special": ["cast-json"],
      "note": "租赁合同文件ID数组",
      "options": {
        "language": "json",
        "template": "[]"
      },
      "width": "full"
    }
  }' > /dev/null 2>&1 && echo "✅ rent_contract_files" || echo "⚠️  rent_contract_files已存在"

echo "➡️  添加字段: status"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
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
      "note": "车位状态",
      "options": {
        "choices": [
          {"text": "正常", "value": "active"},
          {"text": "停用", "value": "inactive"},
          {"text": "维护中", "value": "maintenance"}
        ]
      },
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ status" || echo "⚠️  status已存在"

echo "➡️  添加字段: notes"
curl -s -X POST "$DIRECTUS_URL/fields/parking_spots" \
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
echo "第2步：创建parking_details表（停车费详情表）"
echo "=========================================="

echo "➡️  创建parking_details集合..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "parking_details",
    "meta": {
      "collection": "parking_details",
      "icon": "description",
      "note": "停车费详情表 - 连接receivables和parking_spots",
      "hidden": false,
      "singleton": false,
      "accountability": "all",
      "collapse": "open"
    },
    "schema": {
      "name": "parking_details"
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
  }' > /dev/null 2>&1 && echo "✅ parking_details集合已创建" || echo "⚠️  parking_details集合可能已存在"

echo "➡️  添加字段: parking_spot_id"
curl -s -X POST "$DIRECTUS_URL/fields/parking_details" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "parking_spot_id",
    "type": "uuid",
    "schema": {
      "is_nullable": false,
      "foreign_key_table": "parking_spots",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "note": "关联停车位",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ parking_spot_id" || echo "⚠️  parking_spot_id已存在"

echo "➡️  添加字段: fee_type"
curl -s -X POST "$DIRECTUS_URL/fields/parking_details" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "fee_type",
    "type": "string",
    "schema": {
      "is_nullable": false,
      "max_length": 20
    },
    "meta": {
      "interface": "select-dropdown",
      "note": "费用类型",
      "options": {
        "choices": [
          {"text": "管理费", "value": "management"},
          {"text": "租金", "value": "rent"}
        ]
      },
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ fee_type" || echo "⚠️  fee_type已存在"

echo "➡️  添加字段: contract_no"
curl -s -X POST "$DIRECTUS_URL/fields/parking_details" \
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
      "note": "合同编号（可选）",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ contract_no" || echo "⚠️  contract_no已存在"

echo ""
echo "=========================================="
echo "第3步：创建parking_temp_records表（临停费记录表）"
echo "=========================================="

echo "➡️  创建parking_temp_records集合..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "parking_temp_records",
    "meta": {
      "collection": "parking_temp_records",
      "icon": "directions_car",
      "note": "临停费记录表 - 临时停车的入场出场记录",
      "display_template": "{{license_plate}} - {{entry_time}}",
      "hidden": false,
      "singleton": false,
      "accountability": "all",
      "collapse": "open"
    },
    "schema": {
      "name": "parking_temp_records"
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
  }' > /dev/null 2>&1 && echo "✅ parking_temp_records集合已创建" || echo "⚠️  parking_temp_records集合可能已存在"

echo "➡️  添加字段: community_id"
curl -s -X POST "$DIRECTUS_URL/fields/parking_temp_records" \
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

echo "➡️  添加字段: payment_id (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/parking_temp_records" \
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

echo "➡️  添加字段: license_plate"
curl -s -X POST "$DIRECTUS_URL/fields/parking_temp_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "license_plate",
    "type": "string",
    "schema": {
      "is_nullable": false,
      "max_length": 20
    },
    "meta": {
      "interface": "input",
      "note": "车牌号",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ license_plate" || echo "⚠️  license_plate已存在"

echo "➡️  添加字段: entry_time"
curl -s -X POST "$DIRECTUS_URL/fields/parking_temp_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "entry_time",
    "type": "timestamp",
    "schema": {
      "is_nullable": false
    },
    "meta": {
      "interface": "datetime",
      "note": "入场时间",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ entry_time" || echo "⚠️  entry_time已存在"

echo "➡️  添加字段: exit_time (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/parking_temp_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "exit_time",
    "type": "timestamp",
    "schema": {
      "is_nullable": true
    },
    "meta": {
      "interface": "datetime",
      "note": "出场时间",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ exit_time" || echo "⚠️  exit_time已存在"

echo "➡️  添加字段: duration_minutes (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/parking_temp_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "duration_minutes",
    "type": "integer",
    "schema": {
      "is_nullable": true
    },
    "meta": {
      "interface": "input",
      "note": "停车时长（分钟）",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ duration_minutes" || echo "⚠️  duration_minutes已存在"

echo "➡️  添加字段: parking_spot_number (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/parking_temp_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "parking_spot_number",
    "type": "string",
    "schema": {
      "is_nullable": true,
      "max_length": 50
    },
    "meta": {
      "interface": "input",
      "note": "临停车位号",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ parking_spot_number" || echo "⚠️  parking_spot_number已存在"

echo "➡️  添加字段: calculated_amount"
curl -s -X POST "$DIRECTUS_URL/fields/parking_temp_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "calculated_amount",
    "type": "decimal",
    "schema": {
      "is_nullable": false,
      "numeric_precision": 10,
      "numeric_scale": 2
    },
    "meta": {
      "interface": "input",
      "note": "计算应收金额",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ calculated_amount" || echo "⚠️  calculated_amount已存在"

echo "➡️  添加字段: actual_amount (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/parking_temp_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "actual_amount",
    "type": "decimal",
    "schema": {
      "is_nullable": true,
      "numeric_precision": 10,
      "numeric_scale": 2
    },
    "meta": {
      "interface": "input",
      "note": "实际收费金额",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ actual_amount" || echo "⚠️  actual_amount已存在"

echo "➡️  添加字段: is_paid"
curl -s -X POST "$DIRECTUS_URL/fields/parking_temp_records" \
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
  }' > /dev/null 2>&1 && echo "✅ is_paid" || echo "⚠️  is_paid已存在"

echo "➡️  添加字段: payment_method (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/parking_temp_records" \
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
          {"text": "支付宝", "value": "alipay"}
        ]
      },
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ payment_method" || echo "⚠️  payment_method已存在"

echo "➡️  添加字段: gate_system_id (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/parking_temp_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "gate_system_id",
    "type": "string",
    "schema": {
      "is_nullable": true,
      "max_length": 100
    },
    "meta": {
      "interface": "input",
      "note": "闸机系统记录ID",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ gate_system_id" || echo "⚠️  gate_system_id已存在"

echo "➡️  添加字段: operator_id (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/parking_temp_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "operator_id",
    "type": "uuid",
    "schema": {
      "is_nullable": true,
      "foreign_key_table": "directus_users",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "note": "操作员（人工收费时）",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ operator_id" || echo "⚠️  operator_id已存在"

echo "➡️  添加字段: proof_files (json, nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/parking_temp_records" \
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
      "note": "凭证文件ID数组（支付凭证、入场/出场照片）",
      "options": {
        "language": "json",
        "template": "[]"
      },
      "width": "full"
    }
  }' > /dev/null 2>&1 && echo "✅ proof_files" || echo "⚠️  proof_files已存在"

echo "➡️  添加字段: notes (nullable)"
curl -s -X POST "$DIRECTUS_URL/fields/parking_temp_records" \
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
echo "第4步：创建外键关系"
echo "=========================================="

echo "➡️  创建parking_spots.community_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "parking_spots",
    "field": "community_id",
    "related_collection": "communities"
  }' > /dev/null 2>&1 && echo "✅ parking_spots.community_id" || echo "⚠️  parking_spots.community_id已存在"

echo "➡️  创建parking_spots.building_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "parking_spots",
    "field": "building_id",
    "related_collection": "buildings"
  }' > /dev/null 2>&1 && echo "✅ parking_spots.building_id" || echo "⚠️  parking_spots.building_id已存在"

echo "➡️  创建parking_spots.owner_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "parking_spots",
    "field": "owner_id",
    "related_collection": "directus_users"
  }' > /dev/null 2>&1 && echo "✅ parking_spots.owner_id" || echo "⚠️  parking_spots.owner_id已存在"

echo "➡️  创建parking_spots.renter_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "parking_spots",
    "field": "renter_id",
    "related_collection": "directus_users"
  }' > /dev/null 2>&1 && echo "✅ parking_spots.renter_id" || echo "⚠️  parking_spots.renter_id已存在"

echo "➡️  创建parking_details.parking_spot_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "parking_details",
    "field": "parking_spot_id",
    "related_collection": "parking_spots"
  }' > /dev/null 2>&1 && echo "✅ parking_details.parking_spot_id" || echo "⚠️  parking_details.parking_spot_id已存在"

echo "➡️  创建parking_temp_records.community_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "parking_temp_records",
    "field": "community_id",
    "related_collection": "communities"
  }' > /dev/null 2>&1 && echo "✅ parking_temp_records.community_id" || echo "⚠️  parking_temp_records.community_id已存在"

echo "➡️  创建parking_temp_records.payment_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "parking_temp_records",
    "field": "payment_id",
    "related_collection": "payments"
  }' > /dev/null 2>&1 && echo "✅ parking_temp_records.payment_id" || echo "⚠️  parking_temp_records.payment_id已存在"

echo "➡️  创建parking_temp_records.operator_id关系..."
curl -s -X POST "$DIRECTUS_URL/relations" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "parking_temp_records",
    "field": "operator_id",
    "related_collection": "directus_users"
  }' > /dev/null 2>&1 && echo "✅ parking_temp_records.operator_id" || echo "⚠️  parking_temp_records.operator_id已存在"

echo ""
echo "=========================================="
echo "✅ 停车费相关表创建完成！"
echo "=========================================="
echo ""
echo "📊 已创建的表："
echo "   1. parking_spots (20个字段)"
echo "   2. parking_details (3个字段)"
echo "   3. parking_temp_records (16个字段)"
echo ""
echo "🔗 Directus Admin: $DIRECTUS_URL/admin"
echo ""
echo "📝 下一步："
echo "   bash scripts/create-ad-revenue-tables.sh"
echo ""
