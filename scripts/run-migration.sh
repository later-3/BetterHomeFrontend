#!/bin/bash

# ============================================================
# 财务表迁移脚本 - 从 INTEGER 到 UUID
# ============================================================

set -e  # 遇到错误立即退出

echo "============================================================"
echo "财务表迁移：INTEGER -> UUID"
echo "⚠️  警告：此操作将删除所有现有财务数据！"
echo "============================================================"
echo ""

# 数据库连接信息
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="directus"
DB_USER="postgres"
DB_PASSWORD="postgres"

# Directus 配置
DIRECTUS_URL="http://localhost:8055"
ADMIN_TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"

# 确认操作
read -p "确认要继续吗？所有财务数据将被删除！(yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "迁移已取消"
  exit 0
fi

echo ""
echo "步骤 1/4: 备份当前数据库结构..."
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME --schema-only > backup_schema_$(date +%Y%m%d_%H%M%S).sql
echo "✓ 备份完成"

echo ""
echo "步骤 2/4: 执行数据库迁移..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/migrate-finance-to-uuid.sql

if [ $? -eq 0 ]; then
  echo "✓ 数据库迁移完成"
else
  echo "✗ 数据库迁移失败"
  exit 1
fi

echo ""
echo "步骤 3/4: 更新 Directus 元数据..."
node scripts/update-directus-metadata.js

if [ $? -eq 0 ]; then
  echo "✓ Directus 元数据更新完成"
else
  echo "✗ Directus 元数据更新失败"
  exit 1
fi

echo ""
echo "步骤 4/4: 验证迁移..."

# 验证表结构
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'billings', 'billing_payments', 'incomes', 'expenses',
    'employees', 'salary_records',
    'maintenance_fund_accounts', 'maintenance_fund_payments', 'maintenance_fund_usage'
  )
  AND column_name = 'id'
ORDER BY table_name;
"

# 验证 period 字段
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'billing_payments'
  AND column_name = 'period';
"

echo ""
echo "============================================================"
echo "✓ 迁移完成！"
echo "============================================================"
echo ""
echo "下一步："
echo "1. 访问 $DIRECTUS_URL/admin 检查字段类型"
echo "2. 更新 TypeScript 类型定义（src/@types/directus-schema.ts）"
echo "3. 运行 scripts/generate-finance-data.js 生成测试数据"
echo ""
