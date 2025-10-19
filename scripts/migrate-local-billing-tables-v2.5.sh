#!/bin/bash

# 本地Directus迁移脚本：将billings和billing_payments表更新到v2.5简化设计
# 日期：2025-10-19
# 说明：
#   - 先清空所有数据
#   - billings: 移除paid_amount/status, 改用is_paid布尔字段
#   - billing_payments: 移除billing_id/period/community_id, 添加paid_periods数组

set -e  # 遇到错误立即退出

DIRECTUS_URL="${DIRECTUS_URL:-http://localhost:8055}"
DIRECTUS_TOKEN="${DIRECTUS_TOKEN:-sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n}"

echo "=========================================="
echo "本地Directus - 迁移billings和billing_payments表到v2.5"
echo "=========================================="
echo ""
echo "⚠️  警告：此操作将："
echo "    1. 删除所有现有数据（billings和billing_payments表）"
echo "    2. 修改表结构"
echo ""
read -p "是否继续？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ 操作已取消"
  exit 1
fi

echo ""
echo "=========================================="
echo "第1步：删除现有数据"
echo "=========================================="

# 统计数据量
BILLINGS_COUNT=$(curl -s "$DIRECTUS_URL/items/billings?limit=1&meta=*" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['meta']['filter_count'])")

PAYMENTS_COUNT=$(curl -s "$DIRECTUS_URL/items/billing_payments?limit=1&meta=*" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['meta']['filter_count'])")

echo "📊 当前数据量："
echo "   - billings: $BILLINGS_COUNT 条"
echo "   - billing_payments: $PAYMENTS_COUNT 条"
echo ""

# 1.1 删除billing_payments数据（先删除，因为可能有外键依赖）
echo "➡️  删除billing_payments表数据..."
curl -s "$DIRECTUS_URL/items/billing_payments" \
  -X DELETE \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": {"filter": {}}}' \
  > /dev/null 2>&1 || echo "   (可能没有数据或已删除)"

# 获取所有billing IDs并删除
BILLING_IDS=$(curl -s "$DIRECTUS_URL/items/billing_payments?fields=id&limit=-1" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | python3 -c "import sys, json; data = json.load(sys.stdin); ids = [item['id'] for item in data.get('data', [])]; print(','.join(ids))")

if [ -n "$BILLING_IDS" ]; then
  IFS=',' read -ra ID_ARRAY <<< "$BILLING_IDS"
  for id in "${ID_ARRAY[@]}"; do
    curl -s -X DELETE "$DIRECTUS_URL/items/billing_payments/$id" \
      -H "Authorization: Bearer $DIRECTUS_TOKEN" > /dev/null 2>&1
  done
fi
echo "✅ billing_payments数据已清空"

# 1.2 删除billings数据
echo "➡️  删除billings表数据..."
BILLING_IDS=$(curl -s "$DIRECTUS_URL/items/billings?fields=id&limit=-1" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | python3 -c "import sys, json; data = json.load(sys.stdin); ids = [item['id'] for item in data.get('data', [])]; print(','.join(ids))")

if [ -n "$BILLING_IDS" ]; then
  IFS=',' read -ra ID_ARRAY <<< "$BILLING_IDS"
  for id in "${ID_ARRAY[@]}"; do
    curl -s -X DELETE "$DIRECTUS_URL/items/billings/$id" \
      -H "Authorization: Bearer $DIRECTUS_TOKEN" > /dev/null 2>&1
  done
fi
echo "✅ billings数据已清空"

echo ""
echo "=========================================="
echo "第2步：修改billings表结构"
echo "=========================================="

# 2.1 添加新字段：is_paid (boolean)
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
      "note": "是否已缴费",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ is_paid字段已添加" || echo "⚠️  is_paid字段可能已存在"

# 2.2 添加新字段：paid_at (timestamp)
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
      "note": "缴费时间",
      "width": "half"
    }
  }' > /dev/null 2>&1 && echo "✅ paid_at字段已添加" || echo "⚠️  paid_at字段可能已存在"

# 2.3 重命名字段：billing_amount -> amount
echo "➡️  重命名字段: billing_amount → amount"
curl -s -X PATCH "$DIRECTUS_URL/fields/billings/billing_amount" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "amount"
  }' > /dev/null 2>&1 && echo "✅ 字段已重命名为amount" || echo "⚠️  字段可能已经是amount"

# 2.4 删除字段：status
echo "➡️  删除字段: status"
curl -s -X DELETE "$DIRECTUS_URL/fields/billings/status" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  > /dev/null 2>&1 && echo "✅ status字段已删除" || echo "⚠️  status字段可能已删除"

# 2.5 删除字段：paid_amount
echo "➡️  删除字段: paid_amount"
curl -s -X DELETE "$DIRECTUS_URL/fields/billings/paid_amount" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  > /dev/null 2>&1 && echo "✅ paid_amount字段已删除" || echo "⚠️  paid_amount字段可能已删除"

echo ""
echo "=========================================="
echo "第3步：修改billing_payments表结构"
echo "=========================================="

# 3.1 添加新字段：paid_periods (json)
echo "➡️  添加字段: paid_periods (json, NOT NULL)"
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
      "note": "缴费账期数组，如 [\"2025-01\",\"2025-02\"]",
      "options": {
        "language": "json",
        "template": "[]"
      },
      "width": "full"
    }
  }' > /dev/null 2>&1 && echo "✅ paid_periods字段已添加" || echo "⚠️  paid_periods字段可能已存在"

# 3.2 删除字段：billing_id (外键)
echo "➡️  删除字段: billing_id"
curl -s -X DELETE "$DIRECTUS_URL/fields/billing_payments/billing_id" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  > /dev/null 2>&1 && echo "✅ billing_id字段已删除" || echo "⚠️  billing_id字段可能已删除"

# 3.3 删除字段：period
echo "➡️  删除字段: period"
curl -s -X DELETE "$DIRECTUS_URL/fields/billing_payments/period" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  > /dev/null 2>&1 && echo "✅ period字段已删除" || echo "⚠️  period字段可能已删除"

# 3.4 删除字段：community_id
echo "➡️  删除字段: community_id"
curl -s -X DELETE "$DIRECTUS_URL/fields/billing_payments/community_id" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  > /dev/null 2>&1 && echo "✅ community_id字段已删除" || echo "⚠️  community_id字段可能已删除"

echo ""
echo "=========================================="
echo "第4步：验证迁移结果"
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
echo "✅ 迁移完成！"
echo "=========================================="
echo ""
echo "📊 billings表已更新："
echo "   - ➕ 添加: is_paid (boolean), paid_at (timestamp)"
echo "   - 🔄 重命名: billing_amount → amount"
echo "   - ❌ 删除: status, paid_amount"
echo ""
echo "📊 billing_payments表已更新："
echo "   - ➕ 添加: paid_periods (json)"
echo "   - ❌ 删除: billing_id, period, community_id"
echo ""
echo "🔗 本地Directus Admin: http://localhost:8055/admin"
echo ""
echo "📝 下一步："
echo "   1. 访问 http://localhost:8055/admin 检查表结构"
echo "   2. 根据新的数据模型导入测试数据"
echo "   3. 参考 docs/finance-transparency/DATA_IMPORT_GUIDE.md"
echo ""
