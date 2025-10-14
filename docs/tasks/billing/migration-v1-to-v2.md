# 财务功能迁移指南 (v1.0 → v2.0)

## 迁移概述

**目的**: 从 v1.0 (2张表) 升级到 v2.0 (9张表)

**状态**: ✅ 准备完成 (无生产数据需要迁移)

**迁移日期**: 2025-10-07

## 数据检查结果

### 当前数据状态
- **billings 表**: 0 条记录 ✅
- **expenses 表**: 0 条记录 ✅
- **结论**: 无生产数据，可以安全删除旧表

## 迁移步骤

### Phase 0: 准备工作 ✅

#### Task 0.1: 数据清理和迁移准备 ✅
- [x] 检查生产数据 (已确认：billings 0条，expenses 0条)
- [x] 确认无需备份 (表为空)
- [x] 创建迁移文档 (本文档)

#### Task 0.2: 更新工单系统枚举 ✅
- [x] 更新 DBML 文档 (docs/betterhome.dbml)
- [x] 更新 TypeScript 类型 (src/@types/directus-schema.d.ts)
- [x] 更新显示工具 (src/utils/workOrderDisplay.ts)
- [x] 更新 Directus 枚举 (work_orders.category)
- [x] 验证 TypeScript 编译通过

### Phase 1: 数据层建设 (待执行)

#### Task 1.1: 删除旧表
由于表为空，可以直接删除：
```bash
# 通过 Directus API 删除
curl -X DELETE "http://localhost:8055/collections/billings" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN"

curl -X DELETE "http://localhost:8055/collections/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN"
```

#### Task 1.2-1.7: 创建新表
参考 finance-schema-v2.dbml 创建以下表：
1. billings (v2.0) - 物业费账单
2. billing_payments - 收款记录
3. incomes - 公共收益
4. maintenance_fund_accounts - 维修基金账户
5. maintenance_fund_payments - 维修基金缴纳
6. maintenance_fund_usage - 维修基金使用
7. expenses (v2.0) - 支出记录
8. employees - 员工信息
9. salary_records - 工资记录

#### Task 1.8-1.10: 配置权限
为三种角色配置权限：
- Resident (业主)
- Property Manager (物业)
- Committee Member (业委会)

## 如果未来有数据需要迁移

### v1.0 → v2.0 数据映射

#### billings 表迁移
```sql
-- v1.0 billings → v2.0 billings + billing_payments
--
-- 将 v1.0 的 billings (混合了账单和缴费) 拆分为:
-- 1. v2.0 billings: 账单 (应收)
-- 2. billing_payments: 缴费记录 (实收)
--
-- 迁移规则:
-- - 每条 v1.0 billing 生成 1 条 v2.0 billing
-- - 如果 status = 'paid'，额外生成 1 条 billing_payment
```

#### expenses 表迁移
```sql
-- v1.0 expenses → v2.0 expenses
--
-- 字段映射:
-- v1.0.category → v2.0.expense_type (需要类型转换)
-- v1.0.payment_method → v2.0.payment_method (保持一致)
--
-- 新增字段:
-- - period: 从 paid_at 提取 (YYYY-MM)
-- - related_info: 设置为 null
-- - expense_id: 如果是工资类别，后续关联 salary_records
```

### 备份脚本 (仅供参考)
```bash
#!/bin/bash
# 备份 v1.0 数据 (如果将来需要)

DIRECTUS_URL="http://localhost:8055"
BACKUP_DIR="./backups/finance-v1-$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

echo "备份 billings 表..."
curl -s "$DIRECTUS_URL/items/billings?limit=-1" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  > "$BACKUP_DIR/billings.json"

echo "备份 expenses 表..."
curl -s "$DIRECTUS_URL/items/expenses?limit=-1" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  > "$BACKUP_DIR/expenses.json"

echo "备份完成: $BACKUP_DIR"
```

## 回滚计划

如果迁移失败，回滚步骤：

1. **停止使用 v2.0 功能**
2. **删除 v2.0 表** (9张表)
3. **恢复 v1.0 表** (从备份恢复，如果有数据)
4. **恢复权限规则**
5. **回退代码** (git revert)

## 风险评估

| 风险 | 等级 | 缓解措施 | 状态 |
|------|------|----------|------|
| 数据丢失 | 低 | 表为空，无数据 | ✅ 无风险 |
| 权限配置错误 | 中 | 使用脚本批量配置，逐步验证 | 待执行 |
| TypeScript 类型不匹配 | 低 | 已验证编译通过 | ✅ 已验证 |
| API 调用失败 | 中 | 完整的错误处理和测试 | 待执行 |

## 验收标准

### Phase 1 完成标准
- [ ] 旧表已删除 (billings, expenses)
- [ ] 9张新表已创建
- [ ] 所有枚举已配置
- [ ] 所有关系已建立
- [ ] 所有索引已创建
- [ ] 权限规则已配置 (3种角色)
- [ ] 测试数据插入成功

### Phase 2 完成标准
- [ ] TypeScript 类型已更新
- [ ] Directus SDK API 已封装
- [ ] Pinia Store 已重构
- [ ] 所有 getters 正常工作
- [ ] 所有 actions 正常工作
- [ ] 测试覆盖率 > 80%

## 时间表

| 阶段 | 预计工时 | 开始时间 | 完成时间 |
|------|----------|----------|----------|
| Phase 0 (准备) | 3h | 2025-10-07 | ✅ 完成 |
| Phase 1 (数据层) | 12h | 待开始 | - |
| Phase 2 (Store层) | 10h | 待开始 | - |
| Phase 3 (UI层) | 20h | 待开始 | - |

## 联系人

- **开发者**: Claude Code
- **项目负责人**: [待填写]
- **技术文档**: docs/tasks/billing/

## 更新日志

- 2025-10-07: 创建迁移文档，完成 Phase 0
- 2025-10-07: Task 0.1 完成 (确认无数据需迁移)
- 2025-10-07: Task 0.2 完成 (工单枚举更新)
