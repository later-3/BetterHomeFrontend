#!/bin/bash

# 部署停车功能到远程环境
# 包括：创建表结构 + 导入测试数据

set -e

DIRECTUS_URL="https://www.betterhome.ink"
DIRECTUS_TOKEN="${REMOTE_DIRECTUS_TOKEN}"

if [ -z "$DIRECTUS_TOKEN" ]; then
    echo "❌ 错误：请设置 REMOTE_DIRECTUS_TOKEN 环境变量"
    echo "   export REMOTE_DIRECTUS_TOKEN='your_token_here'"
    exit 1
fi

echo "=========================================="
echo "部署停车功能到远程环境"
echo "=========================================="
echo ""
echo "📍 Directus URL: $DIRECTUS_URL"
echo ""
echo "将执行以下步骤："
echo "  1. 创建收益核心表（revenues）"
echo "  2. 创建停车相关表（parking_spots, parking_details, parking_temp_records）"
echo "  3. 创建广告收益表（ad_spots, ad_contracts, ad_revenues）"
echo "  4. 生成并导入测试数据"
echo ""

read -p "是否继续？(yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "❌ 操作已取消"
  exit 1
fi

echo ""
echo "=========================================="
echo "步骤 1/4: 创建收益核心表"
echo "=========================================="

DIRECTUS_URL=$DIRECTUS_URL DIRECTUS_TOKEN=$DIRECTUS_TOKEN bash scripts/create-revenue-core-tables.sh

echo ""
echo "=========================================="
echo "步骤 2/4: 创建停车相关表"
echo "=========================================="

DIRECTUS_URL=$DIRECTUS_URL DIRECTUS_TOKEN=$DIRECTUS_TOKEN bash scripts/create-parking-tables.sh

echo ""
echo "=========================================="
echo "步骤 3/4: 创建广告收益表"
echo "=========================================="

DIRECTUS_URL=$DIRECTUS_URL DIRECTUS_TOKEN=$DIRECTUS_TOKEN bash scripts/create-ad-revenue-tables.sh

echo ""
echo "=========================================="
echo "步骤 4/4: 导入测试数据"
echo "=========================================="

cd scripts/test-data
./quick-import-parking.sh remote

echo ""
echo "=========================================="
echo "✅ 部署完成！"
echo "=========================================="
echo ""
echo "🔗 访问 Directus Admin 查看:"
echo "   $DIRECTUS_URL/admin"
echo ""
