#!/bin/bash

# 验证账单数据 - 获取数据并计算汇总值，检查是否符合预期

set -e

DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="${DIRECTUS_TOKEN:-sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n}"
COMMUNITY_ID="2a5c769e-9909-4331-99b3-983c8b1175c6"

# 测试用户（业主）- 如果不指定，则获取所有账单
OWNER_ID="${1:-}"  # 可以通过命令行参数传入业主ID

echo "🔍 验证账单数据..."
echo "================================================"
echo "社区ID: $COMMUNITY_ID"
if [ -n "$OWNER_ID" ]; then
    echo "业主ID: $OWNER_ID"
else
    echo "业主ID: 全部业主"
fi
echo ""

# 1. 获取该业主的所有账单
echo "1️⃣ 获取账单数据..."

# 构建过滤条件
if [ -n "$OWNER_ID" ]; then
    FILTER="filter[owner_id][_eq]=$OWNER_ID&filter[community_id][_eq]=$COMMUNITY_ID"
else
    FILTER="filter[community_id][_eq]=$COMMUNITY_ID"
fi

BILLINGS_JSON=$(curl -s -X GET "$DIRECTUS_URL/items/billings?${FILTER}&fields=id,owner_id,period,billing_amount,paid_amount,status,area,unit_price,due_date,late_fee&limit=1000" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN")

# 检查是否有错误
if echo "$BILLINGS_JSON" | jq -e '.errors' > /dev/null 2>&1; then
    echo "❌ API 错误:"
    echo "$BILLINGS_JSON" | jq '.errors'
    exit 1
fi

# 保存到项目目录
echo "$BILLINGS_JSON" > billings_data.json

# 统计账单数量
BILLING_COUNT=$(echo "$BILLINGS_JSON" | jq '.data | length // 0')
echo "   找到 $BILLING_COUNT 条账单"

# 2. 计算汇总数据
echo ""
echo "2️⃣ 计算汇总数据..."

# 总应缴金额
TOTAL_BILLING=$(echo "$BILLINGS_JSON" | jq '[.data[].billing_amount] | add // 0')
echo "   总应缴: ¥$TOTAL_BILLING"

# 总已缴金额
TOTAL_PAID=$(echo "$BILLINGS_JSON" | jq '[.data[].paid_amount // 0] | add // 0')
echo "   总已缴: ¥$TOTAL_PAID"

# 总待缴金额
TOTAL_UNPAID=$(echo "$TOTAL_BILLING - $TOTAL_PAID" | bc)
echo "   总待缴: ¥$TOTAL_UNPAID"

# 3. 按状态统计
echo ""
echo "3️⃣ 按状态统计..."

UNPAID_COUNT=$(echo "$BILLINGS_JSON" | jq '[.data[] | select(.status == "unpaid")] | length')
PAID_COUNT=$(echo "$BILLINGS_JSON" | jq '[.data[] | select(.status == "paid")] | length')
PARTIAL_COUNT=$(echo "$BILLINGS_JSON" | jq '[.data[] | select(.status == "partial")] | length')
OVERDUE_COUNT=$(echo "$BILLINGS_JSON" | jq '[.data[] | select(.status == "overdue")] | length')

echo "   未缴: $UNPAID_COUNT 条"
echo "   已缴: $PAID_COUNT 条"
echo "   部分缴纳: $PARTIAL_COUNT 条"
echo "   逾期: $OVERDUE_COUNT 条"

# 4. 获取收款记录
echo ""
echo "4️⃣ 获取收款记录..."

# 构建过滤条件
if [ -n "$OWNER_ID" ]; then
    PAYMENT_FILTER="filter[owner_id][_eq]=$OWNER_ID&filter[community_id][_eq]=$COMMUNITY_ID"
else
    PAYMENT_FILTER="filter[community_id][_eq]=$COMMUNITY_ID"
fi

PAYMENTS_JSON=$(curl -s -X GET "$DIRECTUS_URL/items/billing_payments?${PAYMENT_FILTER}&fields=id,billing_id,amount,paid_at,payment_method&limit=1000" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN")

# 检查是否有错误
if echo "$PAYMENTS_JSON" | jq -e '.errors' > /dev/null 2>&1; then
    echo "❌ API 错误:"
    echo "$PAYMENTS_JSON" | jq '.errors'
    PAYMENT_COUNT=0
    PAYMENT_TOTAL=0
else
    PAYMENT_COUNT=$(echo "$PAYMENTS_JSON" | jq '.data | length // 0')
    PAYMENT_TOTAL=$(echo "$PAYMENTS_JSON" | jq '[.data[].amount] | add // 0')
fi

echo "   收款记录: $PAYMENT_COUNT 条"
echo "   收款总额: ¥$PAYMENT_TOTAL"

# 5. 数据验证
echo ""
echo "5️⃣ 数据验证..."
echo "================================================"

# 验证1: 收款总额应该等于已缴总额
DIFF=$(echo "$PAYMENT_TOTAL - $TOTAL_PAID" | bc)
if [ "$DIFF" == "0" ] || [ "$DIFF" == "0.00" ]; then
    echo "✅ 验证通过: 收款总额 = 已缴总额"
else
    echo "❌ 验证失败: 收款总额($PAYMENT_TOTAL) ≠ 已缴总额($TOTAL_PAID), 差额: $DIFF"
fi

# 验证2: 总应缴 = 总已缴 + 总待缴
CALCULATED_BILLING=$(echo "$TOTAL_PAID + $TOTAL_UNPAID" | bc)
DIFF2=$(echo "$TOTAL_BILLING - $CALCULATED_BILLING" | bc)
if [ "$DIFF2" == "0" ] || [ "$DIFF2" == "0.00" ]; then
    echo "✅ 验证通过: 总应缴 = 总已缴 + 总待缴"
else
    echo "❌ 验证失败: 总应缴($TOTAL_BILLING) ≠ 总已缴($TOTAL_PAID) + 总待缴($TOTAL_UNPAID)"
fi

# 验证3: 已缴账单的paid_amount应该等于billing_amount
echo ""
echo "检查已缴账单的金额..."
PAID_BILLINGS=$(echo "$BILLINGS_JSON" | jq -r '.data[] | select(.status == "paid") | "\(.id)|\(.billing_amount)|\(.paid_amount)"')

if [ -z "$PAID_BILLINGS" ]; then
    echo "   没有已缴账单"
else
    MISMATCH_COUNT=0
    while IFS='|' read -r id billing_amt paid_amt; do
        if [ "$billing_amt" != "$paid_amt" ]; then
            echo "   ❌ 账单 $id: 应缴=$billing_amt, 已缴=$paid_amt (不匹配)"
            MISMATCH_COUNT=$((MISMATCH_COUNT + 1))
        fi
    done <<< "$PAID_BILLINGS"
    
    if [ $MISMATCH_COUNT -eq 0 ]; then
        echo "   ✅ 所有已缴账单的金额都匹配"
    else
        echo "   ❌ 发现 $MISMATCH_COUNT 条账单金额不匹配"
    fi
fi

# 6. 显示前5条账单详情
echo ""
echo "6️⃣ 账单详情示例（前5条）..."
echo "================================================"
echo "$BILLINGS_JSON" | jq -r '.data[0:5][] | "账期: \(.period) | 应缴: ¥\(.billing_amount) | 已缴: ¥\(.paid_amount // 0) | 状态: \(.status) | 面积: \(.area)㎡ | 单价: ¥\(.unit_price // 0)/㎡"'

# 7. 显示前5条收款记录
echo ""
echo "7️⃣ 收款记录示例（前5条）..."
echo "================================================"
echo "$PAYMENTS_JSON" | jq -r '.data[0:5][] | "账单ID: \(.billing_id) | 金额: ¥\(.amount) | 时间: \(.paid_at) | 方式: \(.payment_method)"'

# 8. 按月份统计
echo ""
echo "8️⃣ 按月份统计..."
echo "================================================"
echo "$BILLINGS_JSON" | jq -r '.data | group_by(.period) | .[] | {
  period: .[0].period,
  count: length,
  total_billing: ([.[].billing_amount] | add),
  total_paid: ([.[].paid_amount // 0] | add),
  paid_count: ([.[] | select(.status == "paid")] | length)
} | "账期: \(.period) | 账单数: \(.count) | 应缴: ¥\(.total_billing) | 已缴: ¥\(.total_paid) | 已缴数: \(.paid_count)"'

echo ""
echo "================================================"
echo "✅ 验证完成！"
echo ""
echo "📋 数据已保存到: billings_data.json"
echo "   可以使用 jq 命令查看详细数据"
echo "   例如: cat billings_data.json | jq '.data[0]'"
