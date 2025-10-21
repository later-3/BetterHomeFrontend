#!/bin/bash

# 快速导入停车数据脚本
# 使用方法: ./quick-import-parking.sh [local|remote]
# 例如: ./quick-import-parking.sh local  # 导入到本地
#      ./quick-import-parking.sh remote # 导入到远程

set -e  # 遇到错误立即退出

# 获取环境参数
ENV=${1:-local}

# 根据环境设置配置
if [ "$ENV" = "remote" ]; then
    DIRECTUS_URL="https://www.betterhome.ink"
    DIRECTUS_TOKEN="${REMOTE_DIRECTUS_TOKEN}"  # 需要设置环境变量

    if [ -z "$DIRECTUS_TOKEN" ]; then
        echo "❌ 错误：请设置 REMOTE_DIRECTUS_TOKEN 环境变量"
        echo "   export REMOTE_DIRECTUS_TOKEN='your_token_here'"
        exit 1
    fi
elif [ "$ENV" = "local" ]; then
    DIRECTUS_URL="http://localhost:8055"
    DIRECTUS_TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"
else
    echo "❌ 错误：环境参数必须是 'local' 或 'remote'"
    echo "   使用方法: ./quick-import-parking.sh [local|remote]"
    exit 1
fi

echo "=========================================="
echo "停车数据快速导入"
echo "=========================================="
echo ""
echo "📍 环境: $ENV"
echo "📍 Directus URL: $DIRECTUS_URL"
echo ""

# 确认操作
read -p "是否继续导入到 $ENV 环境？(yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "❌ 操作已取消"
  exit 1
fi

echo ""
echo "=========================================="
echo "步骤 1/2: 生成数据"
echo "=========================================="

# 生成数据
node generate-parking-data.js $ENV

if [ $? -ne 0 ]; then
    echo "❌ 数据生成失败"
    exit 1
fi

echo ""
echo "=========================================="
echo "步骤 2/2: 导入数据"
echo "=========================================="

# 导入数据
node import-parking-data.js $ENV

if [ $? -ne 0 ]; then
    echo "❌ 数据导入失败"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ 停车数据导入完成！"
echo "=========================================="
echo ""
echo "🔗 访问 Directus Admin 查看数据:"
echo "   $DIRECTUS_URL/admin"
echo ""
