#!/bin/bash

# 快速导入广告收益数据
# 用法：./quick-import-ad.sh [local|remote]

set -e

ENV="${1:-local}"

echo "========================================"
echo "广告收益数据快速导入"
echo "========================================"
echo ""
echo "环境: $ENV"
echo ""

# 进入脚本所在目录
cd "$(dirname "$0")"

# 1. 生成数据
echo "步骤1: 生成广告收益测试数据..."
echo "----------------------------------------"
node generate-ad-data.js "$ENV"
echo ""

# 2. 导入数据
echo "步骤2: 导入广告收益数据到Directus..."
echo "----------------------------------------"
node import-ad-data.js "$ENV"
echo ""

echo "========================================"
echo "✅ 广告收益数据导入完成！"
echo "========================================"
echo ""

if [ "$ENV" = "local" ]; then
  echo "🔗 本地环境: http://localhost:8055/admin"
else
  echo "🔗 远程环境: https://www.betterhome.ink/admin"
fi

echo ""
