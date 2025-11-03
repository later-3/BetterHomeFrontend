#!/bin/bash

# 修复billings表的billing_amount字段重命名

DIRECTUS_URL="http://localhost:8055"
DIRECTUS_TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"

echo "尝试重命名 billing_amount → amount..."

curl -X PATCH "$DIRECTUS_URL/fields/billings/billing_amount" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"field":"amount"}' \
  -v

echo ""
echo "验证结果..."

curl -s "$DIRECTUS_URL/fields/billings" \
  -H "Authorization: Bearer $DIRECTUS_TOKEN" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
fields = [f['field'] for f in data.get('data', []) if f['field'] not in ['id', 'user_created', 'date_created', 'user_updated', 'date_updated', 'date_deleted']]
print('当前billings表字段:', ', '.join(sorted(fields)))
if 'amount' in fields and 'billing_amount' not in fields:
    print('✅ 重命名成功！')
elif 'billing_amount' in fields:
    print('❌ billing_amount还存在')
"
