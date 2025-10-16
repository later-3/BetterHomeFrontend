#!/bin/bash

# 简化版验证脚本 - 用于调试

DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="${DIRECTUS_TOKEN:-sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n}"
COMMUNITY_ID="2a5c769e-9909-4331-99b3-983c8b1175c6"
OWNER_ID="${1:-}"

echo "🔍 验证账单数据（简化版）..."
echo "================================================"

# 1. 获取账单数据
echo ""
echo "1️⃣ 获取账单数据..."

if [ -n "$OWNER_ID" ]; then
    FILTER="filter[owner_id][_eq]=$OWNER_ID&filter[community_id][_eq]=$COMMUNITY_ID"
    echo "   过滤条件: 业主ID=$OWNER_ID"
else
    FILTER="filter[community_id][_eq]=$COMMUNITY_ID"
    echo "   过滤条件: 社区ID=$COMMUNITY_ID"
fi

# URL 编码方括号: [ = %5B, ] = %5D
ENCODED_FILTER=$(echo "$FILTER" | sed 's/\[/%5B/g' | sed 's/\]/%5D/g')
URL="$DIRECTUS_URL/items/billings?${ENCODED_FILTER}&fields=id,owner_id,period,billing_amount,paid_amount,status&limit=1000"
echo "   请求 URL: $URL"

BILLINGS_JSON=$(curl -s -X GET "$URL" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" 2>&1)

# 保存原始数据
echo "$BILLINGS_JSON" > billings_raw.json
echo "   原始数据已保存到: billings_raw.json"

# 显示前几行用于调试
echo "   响应前100字符: $(echo "$BILLINGS_JSON" | head -c 100)"

# 检查响应
if [ -z "$BILLINGS_JSON" ]; then
    echo "   ❌ 响应为空"
elif echo "$BILLINGS_JSON" | grep -q "curl:"; then
    echo "   ❌ Curl 错误:"
    echo "$BILLINGS_JSON"
elif echo "$BILLINGS_JSON" | grep -q '"errors"'; then
    echo "   ❌ API 错误:"
    echo "$BILLINGS_JSON" | jq '.errors' 2>/dev/null || echo "$BILLINGS_JSON"
elif echo "$BILLINGS_JSON" | grep -q '"data"'; then
    echo "   ✅ API 响应正常"
    
    # 使用 jq 统计
    BILLING_COUNT=$(echo "$BILLINGS_JSON" | jq '.data | length')
    echo "   账单数量: $BILLING_COUNT"
    
    if [ "$BILLING_COUNT" -gt 0 ]; then
        # 计算总金额
        TOTAL_BILLING=$(echo "$BILLINGS_JSON" | jq '[.data[].billing_amount | tonumber] | add')
        TOTAL_PAID=$(echo "$BILLINGS_JSON" | jq '[.data[].paid_amount // 0 | tonumber] | add')
        
        echo ""
        echo "2️⃣ 汇总数据..."
        echo "   总应缴: ¥$TOTAL_BILLING"
        echo "   总已缴: ¥$TOTAL_PAID"
        
        # 计算待缴
        TOTAL_UNPAID=$(echo "$TOTAL_BILLING - $TOTAL_PAID" | bc)
        echo "   总待缴: ¥$TOTAL_UNPAID"
        
        # 按状态统计
        echo ""
        echo "3️⃣ 按状态统计..."
        echo "$BILLINGS_JSON" | jq -r '.data | group_by(.status) | .[] | "\(.[0].status): \(length) 条"'
        
        # 显示前3条
        echo ""
        echo "4️⃣ 账单示例（前3条）..."
        echo "$BILLINGS_JSON" | jq -r '.data[0:3][] | "ID:\(.id) | 账期:\(.period) | 应缴:¥\(.billing_amount) | 已缴:¥\(.paid_amount // 0) | 状态:\(.status)"'
    else
        echo "   ⚠️  没有找到账单数据"
    fi
else
    echo "   ❌ API 响应异常"
    echo "$BILLINGS_JSON" | head -20
fi

# 2. 获取收款记录
echo ""
echo "5️⃣ 获取收款记录..."

if [ -n "$OWNER_ID" ]; then
    PAYMENT_FILTER="filter[owner_id][_eq]=$OWNER_ID&filter[community_id][_eq]=$COMMUNITY_ID"
else
    PAYMENT_FILTER="filter[community_id][_eq]=$COMMUNITY_ID"
fi

# URL 编码方括号
ENCODED_PAYMENT_FILTER=$(echo "$PAYMENT_FILTER" | sed 's/\[/%5B/g' | sed 's/\]/%5D/g')
PAYMENT_URL="$DIRECTUS_URL/items/billing_payments?${ENCODED_PAYMENT_FILTER}&fields=id,billing_id,amount,paid_at&limit=1000"
PAYMENTS_JSON=$(curl -s -X GET "$PAYMENT_URL" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" 2>&1)

echo "$PAYMENTS_JSON" > payments_raw.json
echo "   原始数据已保存到: payments_raw.json"
echo "   响应前100字符: $(echo "$PAYMENTS_JSON" | head -c 100)"

if [ -z "$PAYMENTS_JSON" ]; then
    echo "   ❌ 响应为空"
elif echo "$PAYMENTS_JSON" | grep -q "curl:"; then
    echo "   ❌ Curl 错误:"
    echo "$PAYMENTS_JSON"
elif echo "$PAYMENTS_JSON" | grep -q '"errors"'; then
    echo "   ❌ API 错误:"
    echo "$PAYMENTS_JSON" | jq '.errors' 2>/dev/null || echo "$PAYMENTS_JSON"
elif echo "$PAYMENTS_JSON" | grep -q '"data"'; then
    PAYMENT_COUNT=$(echo "$PAYMENTS_JSON" | jq '.data | length')
    echo "   收款记录数量: $PAYMENT_COUNT"
    
    if [ "$PAYMENT_COUNT" -gt 0 ]; then
        PAYMENT_TOTAL=$(echo "$PAYMENTS_JSON" | jq '[.data[].amount | tonumber] | add')
        echo "   收款总额: ¥$PAYMENT_TOTAL"
        
        # 显示前3条
        echo ""
        echo "6️⃣ 收款记录示例（前3条）..."
        echo "$PAYMENTS_JSON" | jq -r '.data[0:3][] | "ID:\(.id) | 账单ID:\(.billing_id) | 金额:¥\(.amount) | 时间:\(.paid_at)"'
    fi
else
    echo "   ❌ API 响应异常"
fi

echo ""
echo "================================================"
echo "✅ 完成！"
