#!/bin/bash

# 批量创建 expenses 和 employees 表
# 基于 docs/tasks/billing/finance-schema-v2.dbml
#
# 使用方法:
# DIRECTUS_ADMIN_TOKEN="your_token" bash scripts/create-expenses-and-employees.sh

DIRECTUS_URL="http://localhost:8055"

if [ -z "$DIRECTUS_ADMIN_TOKEN" ]; then
  echo "❌ 错误: 请设置 DIRECTUS_ADMIN_TOKEN 环境变量"
  echo "   示例: DIRECTUS_ADMIN_TOKEN=\"your_token\" bash scripts/create-expenses-and-employees.sh"
  exit 1
fi

echo "🚀 批量创建财务表（expenses + employees）..."
echo ""
echo "================================================"
echo "  第 1 步: 创建 expenses 表（支出记录）"
echo "================================================"
echo ""

bash scripts/create-expenses-table.sh

echo ""
echo "================================================"
echo "  第 2 步: 创建 employees 表（员工信息）"
echo "================================================"
echo ""

bash scripts/create-employees-table.sh

echo ""
echo "================================================"
echo "  ✅ 批量创建完成！"
echo "================================================"
echo ""
echo "📋 已创建的表:"
echo "   1. expenses  - 支出记录表（22个字段）"
echo "   2. employees - 员工信息表（17个字段）"
echo ""
echo "📋 下一步操作:"
echo ""
echo "1. 在 Directus Admin 中验证"
echo "   访问: $DIRECTUS_URL/admin"
echo "   检查: Content → Expenses"
echo "   检查: Content → Employees"
echo ""
echo "2. 配置权限"
echo "   bash scripts/fix-resident-billing-permissions.sh"
echo ""
echo "3. 创建测试数据"
echo "   - 在 Directus Admin 中手动创建几条测试记录"
echo "   - 或使用 API 批量导入数据"
echo ""
echo "4. 在应用中测试"
echo "   - 登录应用"
echo "   - 访问 Profile → 查看小区收支情况"
echo "   - 验证数据显示正常"
echo ""
