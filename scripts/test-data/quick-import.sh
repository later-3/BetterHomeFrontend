#!/bin/bash

# 快捷脚本：一键生成并导入财务测试数据
# 用法：
#   ./quick-import.sh local          # 导入到本地Directus
#   ./quick-import.sh remote         # 导入到远程Directus
#   ./quick-import.sh local --clear  # 清空后导入

set -e

ENV=${1:-local}
CLEAR_FLAG=$2

cd "$(dirname "$0")"

echo "=========================================="
echo "财务测试数据 - 快速导入"
echo "=========================================="
echo ""
echo "环境: $ENV"
if [ "$CLEAR_FLAG" = "--clear" ]; then
  echo "模式: 清空现有数据后导入"
else
  echo "模式: 追加导入"
fi
echo ""

# Step 1: 生成数据
echo "Step 1: 生成测试数据..."
node generate-billing-data.js $ENV

if [ $? -ne 0 ]; then
  echo "❌ 数据生成失败"
  exit 1
fi

echo ""

# Step 2: 导入数据
echo "Step 2: 导入数据到Directus..."
if [ "$CLEAR_FLAG" = "--clear" ]; then
  node import-billing-data.js $ENV --clear
else
  node import-billing-data.js $ENV
fi

if [ $? -ne 0 ]; then
  echo "❌ 数据导入失败"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ 全部完成！"
echo "=========================================="
