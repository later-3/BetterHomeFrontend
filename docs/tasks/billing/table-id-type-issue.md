# 表 ID 类型不匹配问题

## 问题描述

创建财务数据时遇到错误：
- `billing_payments` 表无法插入数据（billing_id 类型错误）
- `salary_records` 表无法插入数据（employee_id 类型错误）
- `maintenance_fund_payments` 表无法插入数据（account_id 类型错误）

## 根本原因

**主键 ID 类型不一致**：

| 表名 | 主键 ID 类型 | 关系字段类型 | 是否匹配 |
|-----|------------|------------|---------|
| billings | integer | - | - |
| billing_payments | integer | billing_id: **uuid** | ❌ 不匹配 |
| employees | integer | - | - |
| salary_records | integer | employee_id: **uuid** | ❌ 不匹配 |
| maintenance_fund_accounts | integer | - | - |
| maintenance_fund_payments | integer | account_id: **uuid** | ❌ 不匹配 |

**问题**: 关系字段被创建为 UUID 类型，但实际引用的主键是整数类型。

## 为什么会这样？

在创建表的脚本中，我们使用了：

```bash
curl -X POST "$DIRECTUS_URL/fields/billing_payments" \
  -d '{"field":"billing_id","type":"uuid",...}'
```

但 Directus 在创建 billings 表时，默认使用了整数自增 ID，而不是 UUID。

## 解决方案

### 方案A: 修改关系字段类型（推荐）

将关系字段从 UUID 改为 integer：

1. 删除现有的关系字段
2. 重新创建为 integer 类型
3. 重新创建关系

### 方案B: 修改主键类型

将主键从 integer 改为 UUID：

1. 删除所有数据
2. 删除表
3. 重新创建表（指定 UUID 主键）
4. 重新生成数据

**不推荐**，因为已经有数据了。

## 推荐操作步骤

### 步骤1: 删除并重新创建 billing_payments 表

```bash
# 1. 在 Directus Admin 中删除 billing_payments 表
# 2. 重新创建（使用整数类型的 billing_id）
bash scripts/create-billing-payments-table-fixed.sh
```

### 步骤2: 删除并重新创建 salary_records 表

```bash
bash scripts/create-salary-records-table-fixed.sh
```

### 步骤3: 删除并重新创建 maintenance_fund_payments 表

```bash
bash scripts/create-mf-payments-table-fixed.sh
```

### 步骤4: 重新运行数据生成

```bash
node scripts/fix-missing-data.js
```

## 预防措施

在创建新表时，确保：

1. **统一 ID 类型**: 所有表使用相同的 ID 类型（全部 UUID 或全部 integer）
2. **关系字段匹配**: 关系字段类型必须与引用表的主键类型一致
3. **测试验证**: 创建表后立即测试插入数据

## 下一步

我会为你创建修复脚本，重新创建这三个表（使用正确的字段类型）。
