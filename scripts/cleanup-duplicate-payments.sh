#!/bin/bash

# 清理重复的收款记录

DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="${DIRECTUS_TOKEN:-sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n}"
COMMUNITY_ID="2a5c769e-9909-4331-99b3-983c8b1175c6"

echo "🧹 清理重复的收款记录..."
echo "================================================"

# 1. 获取所有收款记录
FILTER="filter%5Bcommunity_id%5D%5B_eq%5D=$COMMUNITY_ID"
PAYMENTS_JSON=$(curl -s -X GET "$DIRECTUS_URL/items/billing_payments?${FILTER}&fields=id,billing_id,amount,paid_at&sort=id&limit=1000" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN")

echo "$PAYMENTS_JSON" > payments_before_cleanup.json

TOTAL_COUNT=$(echo "$PAYMENTS_JSON" | jq '.data | length')
echo "总收款记录数: $TOTAL_COUNT"

# 2. 找出每个账单的重复收款记录（保留ID最小的，删除其他的）
echo ""
echo "查找重复记录..."

DUPLICATE_IDS=$(echo "$PAYMENTS_JSON" | jq -r '
  .data 
  | group_by(.billing_id) 
  | .[] 
  | select(length > 1) 
  | sort_by(.id) 
  | .[1:] 
  | .[].id
')

if [ -z "$DUPLICATE_IDS" ]; then
    echo "✅ 没有发现重复记录"
    exit 0
fi

DUPLICATE_COUNT=$(echo "$DUPLICATE_IDS" | wc -l | tr -d ' ')
echo "发现 $DUPLICATE_COUNT 条重复记录需要删除"

# 3. 删除重复记录
echo ""
echo "开始删除重复记录..."

DELETED_COUNT=0
FAILED_COUNT=0

while read -r payment_id; do
    if [ -n "$payment_id" ]; then
        RESULT=$(curl -s -X DELETE "$DIRECTUS_URL/items/billing_payments/$payment_id" \
          -H "Authorization: Bearer $DIRECTUS_TOKEN" \
          -w "\nHTTP_STATUS:%{http_code}")
        
        HTTP_STATUS=$(echo "$RESULT" | grep "HTTP_STATUS:" | cut -d: -f2)
        
        if [ "$HTTP_STATUS" = "204" ] || [ "$HTTP_STATUS" = "200" ]; then
            DELETED_COUNT=$((DELETED_COUNT + 1))
            if [ $((DELETED_COUNT % 10)) -eq 0 ]; then
                echo "  已删除 $DELETED_COUNT 条..."
            fi
        else
            echo "  ❌ 删除失败 (ID: $payment_id, HTTP: $HTTP_STATUS)"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
        
        sleep 0.05
    fi
done <<< "$DUPLICATE_IDS"

echo ""
echo "================================================"
echo "清理完成！"
echo "  - 成功删除: $DELETED_COUNT 条"
echo "  - 删除失败: $FAILED_COUNT 条"

# 4. 验证清理结果
echo ""
echo "验证清理结果..."

PAYMENTS_AFTER=$(curl -s -X GET "$DIRECTUS_URL/items/billing_payments?${FILTER}&fields=id,billing_id,amount&limit=1000" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN")

echo "$PAYMENTS_AFTER" > payments_after_cleanup.json

REMAINING_COUNT=$(echo "$PAYMENTS_AFTER" | jq '.data | length')
REMAINING_TOTAL=$(echo "$PAYMENTS_AFTER" | jq '[.data[].amount | tonumber] | add')

echo "  - 剩余收款记录: $REMAINING_COUNT 条"
echo "  - 剩余收款总额: ¥$REMAINING_TOTAL"

# 检查是否还有重复
STILL_DUPLICATE=$(echo "$PAYMENTS_AFTER" | jq -r '.data | group_by(.billing_id) | .[] | select(length > 1) | length' | wc -l | tr -d ' ')

if [ "$STILL_DUPLICATE" = "0" ]; then
    echo "  ✅ 已无重复记录"
else
    echo "  ⚠️  仍有 $STILL_DUPLICATE 个账单存在重复收款"
fi

echo ""
echo "数据已保存到:"
echo "  - payments_before_cleanup.json (清理前)"
echo "  - payments_after_cleanup.json (清理后)"
echo ""
echo "下一步: 运行 bash scripts/verify-billing-simple.sh 验证数据"
