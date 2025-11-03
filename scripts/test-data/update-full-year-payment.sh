#!/bin/bash

# 更新指定业主为一次性缴费12个月
# 用于测试月份标签显示逻辑

set -e

DIRECTUS_URL="https://www.betterhome.ink"
DIRECTUS_TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"

# 业主ID和缴费记录ID
OWNER_ID="1825ab24-03e2-4bab-891a-53913f43df40"
PAYMENT_ID="03666bb5-1291-4d5c-8e21-0371ea40a683"

echo "=========================================="
echo "更新业主缴费记录为全年缴费"
echo "=========================================="
echo ""
echo "业主ID: $OWNER_ID"
echo "缴费记录ID: $PAYMENT_ID"
echo ""

# 获取该业主的月物业费
MONTHLY_AMOUNT=$(curl -s "$DIRECTUS_URL/items/billings?filter[owner_id][_eq]=$OWNER_ID&limit=1&fields=amount" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['data'][0]['amount'])")

echo "月物业费: ¥$MONTHLY_AMOUNT"

# 计算12个月总额
TOTAL_AMOUNT=$(python3 -c "print(float('$MONTHLY_AMOUNT') * 12)")
echo "12个月总额: ¥$TOTAL_AMOUNT"
echo ""

# 步骤1: 更新缴费记录
echo "步骤1: 更新缴费记录为12个月..."
curl -s -X PATCH "$DIRECTUS_URL/items/billing_payments/$PAYMENT_ID" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": '"$TOTAL_AMOUNT"',
    "paid_periods": [
      "2025-01", "2025-02", "2025-03", "2025-04",
      "2025-05", "2025-06", "2025-07", "2025-08",
      "2025-09", "2025-10", "2025-11", "2025-12"
    ]
  }' > /dev/null 2>&1

echo "✅ 缴费记录已更新"
echo ""

# 步骤2: 更新所有12个月的账单为已缴费
echo "步骤2: 更新所有账单为已缴费..."

# 获取该业主所有账单ID
BILLING_IDS=$(curl -s "$DIRECTUS_URL/items/billings?filter[owner_id][_eq]=$OWNER_ID&fields=id,period&sort=period" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | python3 -c "import sys, json; data = json.load(sys.stdin); print(','.join([item['id'] for item in data.get('data', [])]))")

# 将逗号分隔的ID转换为数组
IFS=',' read -ra ID_ARRAY <<< "$BILLING_IDS"

# 更新每个账单
PAID_AT=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
count=0
for billing_id in "${ID_ARRAY[@]}"; do
  curl -s -X PATCH "$DIRECTUS_URL/items/billings/$billing_id" \
    -H "Authorization: Bearer $DIRECTUS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "is_paid": true,
      "paid_at": "'"$PAID_AT"'"
    }' > /dev/null 2>&1
  count=$((count + 1))
done

echo "✅ 已更新 $count 条账单记录"
echo ""

# 验证结果
echo "=========================================="
echo "验证更新结果"
echo "=========================================="
echo ""

# 验证缴费记录
PAYMENT_INFO=$(curl -s "$DIRECTUS_URL/items/billing_payments/$PAYMENT_ID?fields=amount,paid_periods" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN")

echo "缴费记录:"
echo "$PAYMENT_INFO" | python3 -c "
import sys, json
data = json.load(sys.stdin)['data']
print(f\"  金额: ¥{data['amount']}\")
print(f\"  缴费月份: {', '.join([p.split('-')[1] + '月' for p in data['paid_periods']])}\" if data['paid_periods'] else '  缴费月份: 无')
"

echo ""

# 验证账单
BILLINGS_INFO=$(curl -s "$DIRECTUS_URL/items/billings?filter[owner_id][_eq]=$OWNER_ID&fields=period,is_paid&sort=period" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN")

echo "账单状态:"
echo "$BILLINGS_INFO" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for item in data.get('data', []):
    status = '✅已缴' if item['is_paid'] else '❌欠费'
    print(f\"  {item['period']}: {status}\")
"

echo ""
echo "=========================================="
echo "✅ 更新完成！"
echo "=========================================="
echo ""
echo "现在可以在小程序中查看该业主的缴费详情"
echo "应该看到12个月都是绿色标签"
echo ""
