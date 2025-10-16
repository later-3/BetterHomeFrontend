# 财务表 UUID 迁移总结

## 迁移完成时间
2025-10-14

## 迁移内容

### 1. 主键类型迁移（INTEGER → UUID）

所有财务相关表的主键已从 `INTEGER` 迁移到 `UUID`：

✅ **已迁移的表：**
- billings (物业费账单)
- billing_payments (物业费收款)
- incomes (公共收益)
- expenses (支出记录)
- employees (员工信息)
- salary_records (工资发放记录)
- maintenance_fund_accounts (维修基金账户)
- maintenance_fund_payments (维修基金缴纳)
- maintenance_fund_usage (维修基金使用)

### 2. 外键类型迁移

所有相关外键字段也已迁移到 `UUID`：

- ✅ billing_payments.billing_id → billings.id
- ✅ salary_records.employee_id → employees.id
- ✅ salary_records.expense_id → expenses.id
- ✅ maintenance_fund_payments.account_id → maintenance_fund_accounts.id
- ✅ maintenance_fund_usage.expense_id → expenses.id

### 3. 新增 period 字段

✅ **billing_payments 表新增字段：**
- 字段名：`period`
- 类型：`VARCHAR(7)`
- 格式：`YYYY-MM`（如 "2025-01"）
- 可空：`TRUE`
- 用途：所属账期，从关联的 billing 记录继承，用于**权责发生制**财务统计

## 数据状态

⚠️ **所有现有数据已被清空**（按照迁移要求）

原有数据均为测试数据，已在迁移过程中删除。

## 财务统计逻辑（企业级标准）

### 推荐方案：权责发生制（Accrual Accounting）

根据企业级会计准则，推荐使用**权责发生制**进行财务统计：

```typescript
// 查询 2025年1-10月 的总收入
const periods = ['2025-01', '2025-02', ..., '2025-10'];

// 1. 物业费实收（按账期）
const propertyFeeIncome = await fetchBillingPaymentsByPeriods(periods);
// WHERE period IN ('2025-01', '2025-02', ..., '2025-10')

// 2. 公共收益（按账期）
const publicIncome = await fetchIncomesByPeriods(periods);
// WHERE period IN ('2025-01', '2025-02', ..., '2025-10')

// 总收入 = 物业费实收 + 公共收益
const totalIncome = propertyFeeIncome + publicIncome;
```

### 三个时间字段的含义

| 字段 | 含义 | 用途 |
|------|------|------|
| `paid_at` | 业主实际缴费时间 | 收付实现制统计、现金流分析 |
| `period` | 所属账期（从billing继承） | **权责发生制统计**（推荐） |
| `date_created` | 物业录入系统时间 | 审计追踪、工作量统计 |

### 示例场景

```
业务场景：
- 2025-07月账单，业主在2025-08月才缴费

billings:
  id: uuid-1
  period: "2025-07"
  billing_amount: 500

billing_payments:
  id: uuid-2
  billing_id: uuid-1
  period: "2025-07"     ← 从billing继承
  paid_at: "2025-08-15" ← 实际缴费日期
  amount: 500

财务统计：
- 7月应收：500元（billings.period = "2025-07"）
- 7月实收：500元（billing_payments.period = "2025-07"）✅ 权责发生制
- 8月现金流入：500元（billing_payments.paid_at in 8月）✅ 收付实现制
```

## 优势

### 1. 安全性
- UUID 全局唯一，避免ID猜测攻击
- 符合企业级安全标准

### 2. 可扩展性
- 支持分布式系统
- 便于数据迁移和合并

### 3. 业务准确性
- period 字段支持权责发生制统计
- 符合会计准则
- 业主更容易理解"7月账期收了多少钱"

## 下一步

1. ✅ 数据库迁移完成
2. ✅ Directus 元数据同步完成
3. ⏳ 更新 TypeScript 类型定义
4. ⏳ 生成 2025年测试数据
5. ⏳ 实现财务透明功能数据获取

## 验证结果

```bash
# 主键类型
billings.id: uuid ✅
billing_payments.id: uuid ✅
incomes.id: uuid ✅
expenses.id: uuid ✅

# 外键类型
billing_payments.billing_id: uuid ✅

# 新增字段
billing_payments.period: varchar(7), nullable ✅
```

## 迁移脚本位置

- SQL 脚本：`scripts/migrate-finance-to-uuid.sql`
- Metadata 更新：`scripts/update-directus-metadata.js`
- 执行脚本：`scripts/run-migration.sh`

## 回滚方案

⚠️ **不支持回滚**

由于已删除所有数据，无法回滚到之前的状态。如需恢复 INTEGER 主键，需要重新创建表结构和数据。
