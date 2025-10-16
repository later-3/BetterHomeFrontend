# 2025年财务测试数据生成总结

## 生成时间
2025-10-14

## 数据范围
**时间**：2025年1月 - 2025年10月（共10个月）
**社区**：兰庭雅苑

## 数据统计

| 数据类型 | 每月数量 | 总数量 | 说明 |
|---------|---------|--------|------|
| 物业费账单 (billings) | 4 | 40 | 每个业主每月一条 |
| 物业费收款 (billing_payments) | 4 | 40 | 每条账单对应一条收款 |
| 公共收益 (incomes) | 4 | 40 | 4种收益类型各1条 |
| 支出记录 (expenses) | 4 | 40 | 4种支出类型各1条 |
| **总计** | **16** | **160** | - |

## 数据详情

### 1. 业主信息（4位）

| 业主ID | 姓名 | 房屋面积 | 月物业费 |
|--------|------|---------|---------|
| 1030a8c2-888e-4ff9-a9e8-d1b6a7c3d8ea | 徐若楠 | 120 m² | ¥480 |
| 1825ab24-03e2-4bab-891a-53913f43df40 | Bob | 95 m² | ¥380 |
| 26411dae-64fe-40e8-8aa6-35cf1126888d | 林浩然 | 85 m² | ¥340 |
| 4d14cc70-441a-4237-844f-cd29bab97fbe | 陈雅宁 | 110 m² | ¥440 |

**物业费单价**：4元/m²/月

### 2. 物业费账单 (billings)

**特点：**
- ✅ 使用 UUID 主键
- ✅ 包含 `period` 字段（格式：YYYY-MM）
- ✅ 状态全部为 `paid`（已缴）
- ✅ 应缴日期为每月28日

**示例数据：**
```json
{
  "id": "uuid",
  "community_id": "2a5c769e-9909-4331-99b3-983c8b1175c6",
  "owner_id": "1030a8c2-888e-4ff9-a9e8-d1b6a7c3d8ea",
  "period": "2025-01",
  "billing_amount": "480.00",
  "area": "120.00",
  "unit_price": "4.00",
  "status": "paid",
  "paid_amount": "480.00",
  "due_date": "2025-01-28T23:59:59.000Z"
}
```

### 3. 物业费收款 (billing_payments)

**特点：**
- ✅ 使用 UUID 主键
- ✅ **包含 `period` 字段**（从账单继承，用于权责发生制统计）
- ✅ 80% 当月缴费，20% 下月缴费（模拟逾期）
- ✅ 支付方式随机（微信/支付宝/银行转账）

**示例数据：**
```json
{
  "id": "uuid",
  "billing_id": "billing-uuid",
  "community_id": "2a5c769e-9909-4331-99b3-983c8b1175c6",
  "owner_id": "1030a8c2-888e-4ff9-a9e8-d1b6a7c3d8ea",
  "amount": "480.00",
  "paid_at": "2025-01-15T10:23:00.000Z",
  "period": "2025-01",  // ← 重要！用于权责发生制统计
  "payment_method": "wechat",
  "payer_name": "业主本人"
}
```

### 4. 公共收益 (incomes)

**收益类型及金额范围：**

| 类型 | 名称 | 月金额范围 |
|------|------|-----------|
| parking | 车位租金 | ¥1,200 - ¥1,800 |
| advertising | 广告收益 | ¥300 - ¥600 |
| express_locker | 快递柜分成 | ¥200 - ¥400 |
| venue_rental | 场地租赁 | ¥150 - ¥350 |

**特点：**
- ✅ 使用 UUID 主键
- ✅ 包含 `period` 字段
- ✅ 金额随机生成（在范围内）
- ✅ 收入日期在当月随机

**示例数据：**
```json
{
  "id": "uuid",
  "community_id": "2a5c769e-9909-4331-99b3-983c8b1175c6",
  "income_type": "parking",
  "title": "2025-01 车位租金",
  "description": "兰庭雅苑2025-01月车位租金",
  "amount": "1684.00",
  "income_date": "2025-01-12T14:30:00.000Z",
  "period": "2025-01",
  "payment_method": "bank",
  "transaction_no": "INCOME2025015826"
}
```

### 5. 支出记录 (expenses)

**支出类型及金额范围：**

| 类型 | 名称 | 月金额 |
|------|------|--------|
| salary | 人员工资 | ¥23,000（固定） |
| utilities | 水电费 | ¥800 - ¥1,200 |
| maintenance | 维修保养 | ¥500 - ¥1,000 |
| materials | 物料采购 | ¥200 - ¥500 |

**特点：**
- ✅ 使用 UUID 主键
- ✅ 包含 `period` 字段
- ✅ 状态全部为 `approved`（已审核）
- ✅ 人员工资固定，其他支出随机

**示例数据：**
```json
{
  "id": "uuid",
  "community_id": "2a5c769e-9909-4331-99b3-983c8b1175c6",
  "expense_type": "salary",
  "title": "2025-01 人员工资",
  "description": "兰庭雅苑2025-01月人员工资",
  "amount": "23000.00",
  "paid_at": "2025-01-15T10:00:00.000Z",
  "period": "2025-01",
  "payment_method": "bank",
  "status": "approved",
  "created_by": "4241c424-0bd4-4f85-90b6-31cb57d31b8e"
}
```

## 权责发生制示例

以 2025-01月 为例，演示权责发生制统计：

### 应收（billings）
```sql
-- 2025-01 月应收物业费
SELECT SUM(billing_amount) FROM billings WHERE period = '2025-01'
-- 结果：480 + 380 + 340 + 440 = ¥1,640
```

### 实收（billing_payments）
```sql
-- 2025-01 月账期的实收（权责发生制）
SELECT SUM(amount) FROM billing_payments WHERE period = '2025-01'
-- 结果：¥1,640（即使有些是2月才付的）

-- 2025-01 月实际到账的收款（收付实现制）
SELECT SUM(amount) FROM billing_payments
WHERE paid_at >= '2025-01-01' AND paid_at < '2025-02-01'
-- 结果：可能少于 ¥1,640（因为有20%逾期到2月）
```

### 总收入
```sql
-- 2025-01 月总收入（权责发生制）
SELECT
  (SELECT SUM(amount) FROM billing_payments WHERE period = '2025-01') +
  (SELECT SUM(amount) FROM incomes WHERE period = '2025-01')
-- 结果：物业费实收 + 公共收益
```

## 数据质量

✅ **UUID 主键**：所有表使用 UUID 作为主键
✅ **period 字段**：所有核心表都包含 period 字段
✅ **外键完整性**：所有外键引用真实存在的记录
✅ **时间合理性**：日期时间在合理范围内
✅ **金额合理性**：金额在预设范围内
✅ **跨月缴费**：20% 的物业费收款是下月缴纳，模拟真实场景

## 使用说明

### 查看数据
访问 Directus Admin：http://localhost:8055/admin

### 重新生成数据
```bash
# 清空现有数据并重新生成
node scripts/generate-test-data-2025.js
```

### 查询示例

**查询某月收入：**
```bash
curl "http://localhost:8055/items/billing_payments?filter[period]=2025-01" \
  -H "Authorization: Bearer sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"

curl "http://localhost:8055/items/incomes?filter[period]=2025-01" \
  -H "Authorization: Bearer sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"
```

**查询某月支出：**
```bash
curl "http://localhost:8055/items/expenses?filter[period]=2025-01" \
  -H "Authorization: Bearer sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"
```

## 下一步

1. ✅ 数据已生成
2. ⏳ 在 finance.ts 中实现数据获取方法
3. ⏳ 在 finance-v2.vue 中集成真实数据
4. ⏳ 测试财务透明功能

## 脚本位置

`scripts/generate-test-data-2025.js`
