#!/bin/bash

# 分析账单和收款记录不匹配的问题

DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="${DIRECTUS_TOKEN:-sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n}"
COMMUNITY_ID="2a5c769e-9909-4331-99b3-983c8b1175c6"

echo "🔍 分析账单和收款记录不匹配问题..."
echo "================================================"

# 1. 获取所有账单
FILTER="filter%5Bcommunity_id%5D%5B_eq%5D=$COMMUNITY_ID"
BILLINGS_JSON=$(curl -s -X GET "$DIRECTUS_URL/items/billings?${FILTER}&fields=id,period,billing_amount,paid_amount,status&limit=1000" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN")

echo "$BILLINGS_JSON" > billings_analysis.json

BILLING_COUNT=$(echo "$BILLINGS_JSON" | jq '.data | length')
TOTAL_BILLING=$(echo "$BILLINGS_JSON" | jq '[.data[].billing_amount | tonumber] | add')
TOTAL_PAID=$(echo "$BILLINGS_JSON" | jq '[.data[].paid_amount // 0 | tonumber] | add')

echo "账单统计:"
echo "  - 账单数量: $BILLING_COUNT"
echo "  - 总应缴: ¥$TOTAL_BILLING"
echo "  - 总已缴: ¥$TOTAL_PAID"

# 2. 获取所有收款记录
PAYMENTS_JSON=$(curl -s -X GET "$DIRECTUS_URL/items/billing_payments?${FILTER}&fields=id,billing_id,amount&limit=1000" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN")

echo "$PAYMENTS_JSON" > payments_analysis.json

PAYMENT_COUNT=$(echo "$PAYMENTS_JSON" | jq '.data | length')
PAYMENT_TOTAL=$(echo "$PAYMENTS_JSON" | jq '[.data[].amount | tonumber] | add')

echo ""
echo "收款记录统计:"
echo "  - 收款记录数量: $PAYMENT_COUNT"
echo "  - 收款总额: ¥$PAYMENT_TOTAL"

# 3. 按账单ID分组统计收款
echo ""
echo "================================================"
echo "按账单ID分组的收款统计:"
echo "================================================"

echo "$PAYMENTS_JSON" | jq -r '.data | group_by(.billing_id) | .[] | {
  billing_id: .[0].billing_id,
  count: length,
  total: ([.[].amount | tonumber] | add)
} | "账单ID:\(.billing_id) | 收款次数:\(.count) | 收款总额:¥\(.total)"' | head -20

# 4. 找出有多次收款的账单
echo ""
echo "================================================"
echo "有多次收款的账单（可能重复）:"
echo "================================================"

DUPLICATE_PAYMENTS=$(echo "$PAYMENTS_JSON" | jq -r '.data | group_by(.billing_id) | .[] | select(length > 1) | {
  billing_id: .[0].billing_id,
  count: length,
  total: ([.[].amount | tonumber] | add)
} | "账单ID:\(.billing_id) | 收款次数:\(.count) | 收款总额:¥\(.total)"')

if [ -z "$DUPLICATE_PAYMENTS" ]; then
    echo "  没有重复收款"
else
    echo "$DUPLICATE_PAYMENTS"
    DUPLICATE_COUNT=$(echo "$DUPLICATE_PAYMENTS" | wc -l)
    echo ""
    echo "  共 $DUPLICATE_COUNT 个账单有多次收款"
fi

# 5. 对比账单的 paid_amount 和实际收款总额
echo ""
echo "================================================"
echo "验证账单 paid_amount 是否正确:"
echo "================================================"

# 创建临时文件存储对比结果
echo "$BILLINGS_JSON" | jq -r '.data[] | "\(.id)|\(.paid_amount // 0)"' > /tmp/billing_paid.txt
echo "$PAYMENTS_JSON" | jq -r '.data | group_by(.billing_id) | .[] | "\(.[0].billing_id)|\(([.[].amount | tonumber] | add))"' > /tmp/payment_totals.txt

MISMATCH_COUNT=0
while IFS='|' read -r billing_id billing_paid; do
    # 查找该账单的实际收款总额
    actual_paid=$(grep "^${billing_id}|" /tmp/payment_totals.txt | cut -d'|' -f2)
    
    if [ -z "$actual_paid" ]; then
        actual_paid=0
    fi
    
    # 比较
    if [ "$billing_paid" != "$actual_paid" ]; then
        echo "  ❌ 账单 $billing_id: paid_amount=¥$billing_paid, 实际收款=¥$actual_paid"
        MISMATCH_COUNT=$((MISMATCH_COUNT + 1))
    fi
done < /tmp/billing_paid.txt

if [ $MISMATCH_COUNT -eq 0 ]; then
    echo "  ✅ 所有账单的 paid_amount 都正确"
else
    echo ""
    echo "  ❌ 发现 $MISMATCH_COUNT 个账单的 paid_amount 不正确"
fi

# 6. 总结
echo ""
echo "================================================"
echo "问题总结:"
echo "================================================"

DIFF=$(echo "$PAYMENT_TOTAL - $TOTAL_PAID" | bc)
echo "收款总额 - 账单已缴总额 = ¥$DIFF"

if [ "$DIFF" != "0" ] && [ "$DIFF" != "0.00" ]; then
    echo ""
    echo "⚠️  可能的原因:"
    echo "  1. 收款记录重复创建（同一个账单多次收款）"
    echo "  2. 账单的 paid_amount 字段没有更新"
    echo "  3. 收款记录的 billing_id 关联错误"
    echo ""
    echo "建议操作:"
    echo "  1. 检查重复的收款记录"
    echo "  2. 删除重复的收款记录"
    echo "  3. 重新计算并更新账单的 paid_amount"
fi

echo ""
echo "数据已保存到:"
echo "  - billings_analysis.json"
echo "  - payments_analysis.json"
