#!/bin/bash

# 清理广告收益测试数据
# 使用方法: bash clean-ad-data.sh

set -e

DIRECTUS_ADMIN_TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"
DIRECTUS_URL="http://localhost:8055"

echo "========================================"
echo "清理广告收益测试数据"
echo "========================================"
echo ""

# 删除 receivables (ad_revenue)
echo "1. 删除 receivables (ad_revenue)..."
RECV_IDS=$(curl -s "$DIRECTUS_URL/items/receivables?filter%5Btype_code%5D%5B_eq%5D=ad_revenue&fields=id&limit=-1" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(','.join([r['id'] for r in data['data']]))" 2>/dev/null || echo "")

if [ -n "$RECV_IDS" ]; then
  curl -s -X DELETE "$DIRECTUS_URL/items/receivables" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"keys\": [\"$RECV_IDS\"]}" > /dev/null
  echo "   ✅ 已删除"
else
  echo "   ⏭️  无数据"
fi

# 删除 payments (ad_revenue)
echo "2. 删除 payments (ad_revenue)..."
PAY_IDS=$(curl -s "$DIRECTUS_URL/items/payments?filter%5Btype_code%5D%5B_eq%5D=ad_revenue&fields=id&limit=-1" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(','.join([r['id'] for r in data['data']]))" 2>/dev/null || echo "")

if [ -n "$PAY_IDS" ]; then
  curl -s -X DELETE "$DIRECTUS_URL/items/payments" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"keys\": [\"$PAY_IDS\"]}" > /dev/null
  echo "   ✅ 已删除"
else
  echo "   ⏭️  无数据"
fi

# 删除 ad_details
echo "3. 删除 ad_details..."
DETAIL_IDS=$(curl -s "$DIRECTUS_URL/items/ad_details?fields=id&limit=-1" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(','.join([r['id'] for r in data['data']]))" 2>/dev/null || echo "")

if [ -n "$DETAIL_IDS" ]; then
  curl -s -X DELETE "$DIRECTUS_URL/items/ad_details" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"keys\": [\"$DETAIL_IDS\"]}" > /dev/null
  echo "   ✅ 已删除"
else
  echo "   ⏭️  无数据"
fi

# 删除 ad_contracts
echo "4. 删除 ad_contracts..."
CONTRACT_IDS=$(curl -s "$DIRECTUS_URL/items/ad_contracts?fields=id&limit=-1" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(','.join([r['id'] for r in data['data']]))" 2>/dev/null || echo "")

if [ -n "$CONTRACT_IDS" ]; then
  curl -s -X DELETE "$DIRECTUS_URL/items/ad_contracts" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"keys\": [\"$CONTRACT_IDS\"]}" > /dev/null
  echo "   ✅ 已删除"
else
  echo "   ⏭️  无数据"
fi

# 删除 ad_spots
echo "5. 删除 ad_spots..."
SPOT_IDS=$(curl -s "$DIRECTUS_URL/items/ad_spots?fields=id&limit=-1" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(','.join([r['id'] for r in data['data']]))" 2>/dev/null || echo "")

if [ -n "$SPOT_IDS" ]; then
  curl -s -X DELETE "$DIRECTUS_URL/items/ad_spots" \
    -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"keys\": [\"$SPOT_IDS\"]}" > /dev/null
  echo "   ✅ 已删除"
else
  echo "   ⏭️  无数据"
fi

echo ""
echo "========================================"
echo "✅ 清理完成！"
echo "========================================"
