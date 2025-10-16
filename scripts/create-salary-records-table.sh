#!/bin/bash

# 创建 salary_records 表（工资记录）

set -e

DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="${DIRECTUS_TOKEN:-sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n}"

echo "📋 创建 salary_records 表..."
echo "================================================"

# 1. 创建集合（作为数据表，不是文件夹）
echo ""
echo "1️⃣ 创建集合..."
curl -s -X POST "$DIRECTUS_URL/collections" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "salary_records",
    "meta": {
      "collection": "salary_records",
      "icon": "payments",
      "note": "员工工资记录",
      "display_template": "{{employee_id}} - {{period}}",
      "hidden": false,
      "singleton": false,
      "translations": [
        {
          "language": "zh-CN",
          "translation": "工资记录"
        }
      ],
      "archive_field": null,
      "archive_app_filter": true,
      "archive_value": null,
      "unarchive_value": null,
      "sort_field": null
    },
    "schema": {
      "schema": "public",
      "name": "salary_records"
    },
    "fields": [
      {
        "field": "id",
        "type": "integer",
        "schema": {
          "data_type": "integer",
          "is_primary_key": true,
          "has_auto_increment": true,
          "is_nullable": false
        },
        "meta": {
          "hidden": true,
          "interface": "input",
          "readonly": true
        }
      }
    ]
  }' | jq -r '.data.collection // "失败"'

sleep 1

# 2. 创建字段
echo ""
echo "2️⃣ 创建字段..."

# employee_id (员工ID - 外键)
echo "   - employee_id (员工ID)"
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "employee_id",
    "type": "integer",
    "schema": {
      "data_type": "integer",
      "is_nullable": false,
      "foreign_key_table": "employees",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "display": "related-values",
      "display_options": {
        "template": "{{name}}"
      },
      "required": true,
      "translations": [
        {
          "language": "zh-CN",
          "translation": "员工"
        }
      ]
    }
  }' > /dev/null

sleep 0.5

# community_id (小区ID - 外键)
echo "   - community_id (小区ID)"
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "community_id",
    "type": "uuid",
    "schema": {
      "data_type": "uuid",
      "is_nullable": false,
      "foreign_key_table": "communities",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "display": "related-values",
      "display_options": {
        "template": "{{name}}"
      },
      "required": true,
      "translations": [
        {
          "language": "zh-CN",
          "translation": "小区"
        }
      ]
    }
  }' > /dev/null

sleep 0.5

# period (工资月份)
echo "   - period (工资月份)"
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "period",
    "type": "string",
    "schema": {
      "data_type": "varchar",
      "max_length": 7,
      "is_nullable": false
    },
    "meta": {
      "interface": "input",
      "width": "half",
      "required": true,
      "note": "格式: YYYY-MM",
      "translations": [
        {
          "language": "zh-CN",
          "translation": "工资月份"
        }
      ]
    }
  }' > /dev/null

sleep 0.5

# base_salary (基本工资)
echo "   - base_salary (基本工资)"
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "base_salary",
    "type": "decimal",
    "schema": {
      "data_type": "decimal",
      "numeric_precision": 10,
      "numeric_scale": 2,
      "is_nullable": false,
      "default_value": "0"
    },
    "meta": {
      "interface": "input",
      "width": "half",
      "required": true,
      "translations": [
        {
          "language": "zh-CN",
          "translation": "基本工资"
        }
      ]
    }
  }' > /dev/null

sleep 0.5

# bonus (奖金)
echo "   - bonus (奖金)"
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "bonus",
    "type": "decimal",
    "schema": {
      "data_type": "decimal",
      "numeric_precision": 10,
      "numeric_scale": 2,
      "is_nullable": true,
      "default_value": "0"
    },
    "meta": {
      "interface": "input",
      "width": "half",
      "translations": [
        {
          "language": "zh-CN",
          "translation": "奖金"
        }
      ]
    }
  }' > /dev/null

sleep 0.5

# subsidy (补贴)
echo "   - subsidy (补贴)"
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "subsidy",
    "type": "decimal",
    "schema": {
      "data_type": "decimal",
      "numeric_precision": 10,
      "numeric_scale": 2,
      "is_nullable": true,
      "default_value": "0"
    },
    "meta": {
      "interface": "input",
      "width": "half",
      "translations": [
        {
          "language": "zh-CN",
          "translation": "补贴"
        }
      ]
    }
  }' > /dev/null

sleep 0.5

# deduction (扣款)
echo "   - deduction (扣款)"
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "deduction",
    "type": "decimal",
    "schema": {
      "data_type": "decimal",
      "numeric_precision": 10,
      "numeric_scale": 2,
      "is_nullable": true,
      "default_value": "0"
    },
    "meta": {
      "interface": "input",
      "width": "half",
      "translations": [
        {
          "language": "zh-CN",
          "translation": "扣款"
        }
      ]
    }
  }' > /dev/null

sleep 0.5

# social_security (社保)
echo "   - social_security (社保)"
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "social_security",
    "type": "decimal",
    "schema": {
      "data_type": "decimal",
      "numeric_precision": 10,
      "numeric_scale": 2,
      "is_nullable": true,
      "default_value": "0"
    },
    "meta": {
      "interface": "input",
      "width": "half",
      "translations": [
        {
          "language": "zh-CN",
          "translation": "社保"
        }
      ]
    }
  }' > /dev/null

sleep 0.5

# housing_fund (公积金)
echo "   - housing_fund (公积金)"
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "housing_fund",
    "type": "decimal",
    "schema": {
      "data_type": "decimal",
      "numeric_precision": 10,
      "numeric_scale": 2,
      "is_nullable": true,
      "default_value": "0"
    },
    "meta": {
      "interface": "input",
      "width": "half",
      "translations": [
        {
          "language": "zh-CN",
          "translation": "公积金"
        }
      ]
    }
  }' > /dev/null

sleep 0.5

# actual_amount (实发金额)
echo "   - actual_amount (实发金额)"
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "actual_amount",
    "type": "decimal",
    "schema": {
      "data_type": "decimal",
      "numeric_precision": 10,
      "numeric_scale": 2,
      "is_nullable": false,
      "default_value": "0"
    },
    "meta": {
      "interface": "input",
      "width": "half",
      "required": true,
      "translations": [
        {
          "language": "zh-CN",
          "translation": "实发金额"
        }
      ]
    }
  }' > /dev/null

sleep 0.5

# payment_date (发放日期)
echo "   - payment_date (发放日期)"
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "payment_date",
    "type": "timestamp",
    "schema": {
      "data_type": "timestamp",
      "is_nullable": true
    },
    "meta": {
      "interface": "datetime",
      "width": "half",
      "translations": [
        {
          "language": "zh-CN",
          "translation": "发放日期"
        }
      ]
    }
  }' > /dev/null

sleep 0.5

# payment_method (支付方式)
echo "   - payment_method (支付方式)"
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "payment_method",
    "type": "string",
    "schema": {
      "data_type": "varchar",
      "max_length": 50,
      "is_nullable": true
    },
    "meta": {
      "interface": "select-dropdown",
      "width": "half",
      "options": {
        "choices": [
          {"text": "银行转账", "value": "bank"},
          {"text": "现金", "value": "cash"}
        ]
      },
      "translations": [
        {
          "language": "zh-CN",
          "translation": "支付方式"
        }
      ]
    }
  }' > /dev/null

sleep 0.5

# expense_id (关联支出记录)
echo "   - expense_id (关联支出记录)"
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "expense_id",
    "type": "integer",
    "schema": {
      "data_type": "integer",
      "is_nullable": true,
      "foreign_key_table": "expenses",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["m2o"],
      "display": "related-values",
      "display_options": {
        "template": "{{title}}"
      },
      "translations": [
        {
          "language": "zh-CN",
          "translation": "关联支出"
        }
      ]
    }
  }' > /dev/null

sleep 0.5

# remark (备注)
echo "   - remark (备注)"
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "remark",
    "type": "text",
    "schema": {
      "data_type": "text",
      "is_nullable": true
    },
    "meta": {
      "interface": "input-multiline",
      "width": "full",
      "translations": [
        {
          "language": "zh-CN",
          "translation": "备注"
        }
      ]
    }
  }' > /dev/null

sleep 0.5

# date_created (创建时间)
echo "   - date_created (创建时间)"
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "date_created",
    "type": "timestamp",
    "schema": {
      "data_type": "timestamp",
      "is_nullable": true,
      "default_value": "CURRENT_TIMESTAMP"
    },
    "meta": {
      "interface": "datetime",
      "readonly": true,
      "hidden": true,
      "special": ["date-created"]
    }
  }' > /dev/null

sleep 0.5

# user_created (创建人)
echo "   - user_created (创建人)"
curl -s -X POST "$DIRECTUS_URL/fields/salary_records" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "user_created",
    "type": "uuid",
    "schema": {
      "data_type": "uuid",
      "is_nullable": true,
      "foreign_key_table": "directus_users",
      "foreign_key_column": "id"
    },
    "meta": {
      "interface": "select-dropdown-m2o",
      "special": ["user-created"],
      "readonly": true,
      "hidden": true
    }
  }' > /dev/null

echo ""
echo "================================================"
echo "✅ salary_records 表创建完成！"
echo ""
echo "📋 表结构:"
echo "   - id: 主键"
echo "   - employee_id: 员工ID (外键 → employees)"
echo "   - community_id: 小区ID (外键 → communities)"
echo "   - period: 工资月份 (YYYY-MM)"
echo "   - base_salary: 基本工资"
echo "   - bonus: 奖金"
echo "   - subsidy: 补贴"
echo "   - deduction: 扣款"
echo "   - social_security: 社保"
echo "   - housing_fund: 公积金"
echo "   - actual_amount: 实发金额"
echo "   - payment_date: 发放日期"
echo "   - payment_method: 支付方式"
echo "   - expense_id: 关联支出记录 (外键 → expenses)"
echo "   - remark: 备注"
echo "   - date_created: 创建时间"
echo "   - user_created: 创建人"
