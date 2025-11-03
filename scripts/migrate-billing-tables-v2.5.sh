#!/bin/bash

# 迁移脚本：将billings和billing_payments表更新到v2.5简化设计
# 日期：2025-10-19
# 说明：
#   - billings: 移除paid_amount/status, 改用is_paid布尔字段
#   - billing_payments: 移除billing_id/period/community_id, 添加paid_periods数组

set -e  # 遇到错误立即退出

DIRECTUS_URL="${DIRECTUS_URL:-https://www.betterhome.ink}"
DIRECTUS_TOKEN="${DIRECTUS_TOKEN:-sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n}"

echo "=========================================="
echo "开始迁移billings和billing_payments表到v2.5"
echo "=========================================="
echo ""
echo "⚠️  警告：此操作将修改表结构并删除某些字段！"
echo "⚠️  请确保已经备份数据库！"
echo ""
read -p "是否继续？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ 操作已取消"
  exit 1
fi

echo ""
echo "==========================================  "
echo "第1步：修改billings表"
echo "=========================================="

# 1.1 添加新字段：is_paid (boolean)
echo "➡️  添加字段: is_paid (boolean, DEFAULT false)"
curl -s -X POST "$DIRECTUS_URL/fields/billings" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "is_paid",
    "type": "boolean",
    "schema": {
      "default_value": false,
      "is_nullable": false
    },
    "meta": {
      "interface": "boolean",
      "special": null,
      "note": "是否已缴费"
    }
  }' | python3 -c "import sys, json; print('✅ is_paid字段已添加' if 'data' in json.load(sys.stdin) else '❌ 添加失败')"

# 1.2 添加新字段：paid_at (timestamp)
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
      "special": null,
      "note": "缴费时间"
    }
  }' | python3 -c "import sys, json; print('✅ paid_at字段已添加' if 'data' in json.load(sys.stdin) else '❌ 添加失败')"

# 1.3 重命名字段：billing_amount -> amount
echo "➡️  重命名字段: billing_amount → amount"
curl -s -X PATCH "$DIRECTUS_URL/fields/billings/billing_amount" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "amount"
  }' | python3 -c "import sys, json; print('✅ 字段已重命名为amount' if 'data' in json.load(sys.stdin) else '❌ 重命名失败')"

# 1.4 删除字段：status
echo "➡️  删除字段: status"
curl -s -X DELETE "$DIRECTUS_URL/fields/billings/status" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | python3 -c "import sys; print('✅ status字段已删除')"

# 1.5 删除字段：paid_amount
echo "➡️  删除字段: paid_amount"
curl -s -X DELETE "$DIRECTUS_URL/fields/billings/paid_amount" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | python3 -c "import sys; print('✅ paid_amount字段已删除')"

echo ""
echo "=========================================="
echo "第2步：修改billing_payments表"
echo "=========================================="

# 2.1 添加新字段：paid_periods (json)
echo "➡️  添加字段: paid_periods (json, NOT NULL)"
curl -s -X POST "$DIRECTUS_URL/fields/billing_payments" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "paid_periods",
    "type": "json",
    "schema": {
      "is_nullable": false
    },
    "meta": {
      "interface": "input-code",
      "special": ["cast-json"],
      "note": "缴费账期数组，如 [\"2025-01\",\"2025-02\"]",
      "options": {
        "language": "json"
      }
    }
  }' | python3 -c "import sys, json; print('✅ paid_periods字段已添加' if 'data' in json.load(sys.stdin) else '❌ 添加失败')"

# 2.2 删除字段：billing_id (外键)
echo "➡️  删除字段: billing_id"
curl -s -X DELETE "$DIRECTUS_URL/fields/billing_payments/billing_id" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | python3 -c "import sys; print('✅ billing_id字段已删除')"

# 2.3 删除字段：period
echo "➡️  删除字段: period"
curl -s -X DELETE "$DIRECTUS_URL/fields/billing_payments/period" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | python3 -c "import sys; print('✅ period字段已删除')"

# 2.4 删除字段：community_id
echo "➡️  删除字段: community_id"
curl -s -X DELETE "$DIRECTUS_URL/fields/billing_payments/community_id" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | python3 -c "import sys; print('✅ community_id字段已删除')"

echo ""
echo "=========================================="
echo "迁移完成！"
echo "=========================================="
echo ""
echo "✅ billings表已更新："
echo "   - 添加: is_paid (boolean)"
echo "   - 添加: paid_at (timestamp)"
echo "   - 重命名: billing_amount → amount"
echo "   - 删除: status, paid_amount"
echo ""
echo "✅ billing_payments表已更新："
echo "   - 添加: paid_periods (json)"
echo "   - 删除: billing_id, period, community_id"
echo ""
echo "⚠️  注意："
echo "   1. 现有数据需要手动迁移（is_paid默认为false）"
echo "   2. billing_payments表中现有记录缺少paid_periods数据"
echo "   3. 建议清空测试数据后重新导入"
echo ""
