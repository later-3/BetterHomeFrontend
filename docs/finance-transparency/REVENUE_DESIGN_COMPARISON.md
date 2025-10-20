# 收支管理系统设计方案对比

## 业务场景分析

### 核心需求
1. **总收益、总支出统计** - 物业公司整体财务状况
2. **按时间维度查询** - 月度、季度、年度报表
3. **按收益类型查询** - 单独查看物业费、停车费、广告收益等
4. **财务透明公示** - 业主可查看小区整体财务状况
5. **业主个人查询** - 业主查看自己的缴费情况
6. **经营分析报表** - 物业公司管理层决策支持

### 收益/支出类型
**收益类型**：
- 物业费
- 停车费（车位管理费、车位租金）
- 广告收益
- 公共区域租金（商铺、会所）
- 维修基金利息
- 其他收入

**支出类型**：
- 员工工资
- 维修支出
- 公共设施维护
- 水电费
- 安保费用
- 其他支出

---

## 方案A：多表方案（你的初始方案）

### 表结构

```sql
-- 收益类型主表
revenue_types (
  id, code, name,
  receivable_table, payment_table
)

-- 物业费
property_billings (应收)
property_payments (实收)

-- 停车费
parking_billings (应收)
parking_payments (实收)

-- 广告收益
ad_billings (应收)
ad_payments (实收)

-- ...每种收益都有两张表
```

### 优点 ✅

1. **字段专用化**：每种收益的特殊字段都可以直接定义
   ```sql
   parking_billings: spot_number, license_plate
   ad_billings: location, advertiser_name
   ```

2. **性能优异**：单表查询快，不需要type过滤

3. **类型安全**：PostgreSQL的强类型约束，字段错误在数据库层面就能拦截

4. **易于理解**：业务人员一看表名就知道是什么

### 缺点 ❌

1. **场景1 - 总收益统计**（查询复杂）
   ```sql
   -- 需要UNION多张表
   SELECT SUM(total) FROM (
     SELECT SUM(amount) as total FROM property_payments WHERE ...
     UNION ALL
     SELECT SUM(amount) as total FROM parking_payments WHERE ...
     UNION ALL
     SELECT SUM(amount) as total FROM ad_payments WHERE ...
     -- ...每种收益都要写一遍
   )
   ```

2. **场景2 - 月度财务报表**（代码重复）
   ```typescript
   // 每个表都要写一遍查询逻辑
   const propertyRevenue = await propertyPaymentsApi.readMany(...)
   const parkingRevenue = await parkingPaymentsApi.readMany(...)
   const adRevenue = await adPaymentsApi.readMany(...)
   // ...
   ```

3. **场景3 - 新增收益类型**（维护成本高）
   - 需要创建2张新表
   - 需要更新所有汇总查询
   - 需要更新前端代码
   - 需要更新权限配置

4. **场景4 - 通用功能**（重复实现）
   - 审核流程：每种收益都要实现一遍
   - 催缴通知：每种收益都要实现一遍
   - 权限控制：每种收益都要配置一遍

---

## 方案B：统一表方案

### 表结构

```sql
-- 只需2张表
receivables (应收统一表)
  id, community_id, owner_id, amount, period,
  type: 'property' | 'parking' | 'ad' | ...,
  type_data: JSONB,  -- 存储类型特定数据
  is_paid, paid_at

payments (实收统一表)
  id, community_id, owner_id, amount,
  type: 'property' | 'parking' | 'ad' | ...,
  receivable_id, paid_at
```

### 优点 ✅

1. **场景1 - 总收益统计**（查询简单）
   ```sql
   SELECT SUM(amount) FROM payments
   WHERE community_id = ? AND paid_at BETWEEN ? AND ?
   ```

2. **场景2 - 月度报表**（代码统一）
   ```typescript
   // 一个查询搞定
   const revenue = await paymentsApi.readMany({
     filter: { community_id, paid_at: { _gte: startDate, _lte: endDate } },
     groupBy: ['type'],
     aggregate: { sum: ['amount'] }
   })
   ```

3. **场景3 - 新增收益类型**（零代码改动）
   - 只需在revenue_types表加一行配置
   - 查询、统计逻辑无需修改

4. **场景4 - 通用功能**（一次实现）
   - 审核流程：统一处理所有类型
   - 催缴通知：统一逻辑
   - 权限控制：统一配置

### 缺点 ❌

1. **类型特定字段**（JSONB性能和类型安全）
   ```sql
   -- 停车费的车牌号存在JSONB里
   type_data: { "license_plate": "京A12345", "spot_number": "A-101" }
   ```
   - ❌ 无法添加数据库约束
   - ❌ 查询性能不如真实列
   - ❌ TypeScript类型检查弱化

2. **字段冗余**
   ```sql
   -- 广告收益没有owner_id，但字段还在
   owner_id: null
   ```

---

## 方案C：混合方案 ⭐ 推荐

### 核心思路

**通用逻辑统一，特殊数据分离**

```
核心表（统一查询、统计）
  ↓
receivables / payments
  ↓
通过 type_detail_id 关联
  ↓
类型详情表（特殊字段）
  ↓
parking_details / ad_details
```

### 表结构

```sql
-- 收益类型配置表
revenue_types (
  id, code, name,
  detail_table,  -- 'parking_details', 'ad_details'
  has_owner,     -- 是否关联业主
  ...
)

-- 核心应收表（通用字段）
receivables (
  id, community_id,
  type_code,           -- 'property', 'parking', 'ad'
  type_detail_id,      -- UUID，指向具体类型详情表

  -- 通用财务字段
  owner_id,            -- 可选，某些收益没有业主
  period,              -- 账期
  amount,              -- 金额
  is_paid,
  paid_at,

  -- 通用业务字段
  status,              -- 'pending', 'approved', 'cancelled'
  created_at, updated_at
)

-- 核心实收表（通用字段）
payments (
  id, community_id,
  type_code,
  receivable_id,       -- 关联到receivables

  -- 通用财务字段
  owner_id,
  amount,
  paid_at,
  paid_periods,        -- ['2025-01', '2025-02']
  payment_method,

  -- 通用业务字段
  payer_name,
  transaction_no,
  proof_files,
  notes
)

-- 停车费详情表（特殊字段）
parking_details (
  id,
  parking_spot_id,     -- FK to parking_spots
  monthly_fee,
  contract_start,
  contract_end
)

-- 停车位主数据表
parking_spots (
  id, community_id,
  spot_number,         -- 'A-101'
  location,            -- '地下1层'
  type,                -- 'fixed', 'temp'
  is_sold,
  owner_id,
  license_plate,
  monthly_management_fee,
  monthly_rent
)

-- 广告详情表（特殊字段）
ad_details (
  id,
  ad_spot_id,          -- FK to ad_spots
  advertiser_name,
  ad_content,
  contract_start,
  contract_end
)

-- 广告位主数据表
ad_spots (
  id, community_id,
  location,            -- '小区大门右侧'
  type,                -- 'billboard', 'led', 'elevator'
  size,
  monthly_price
)
```

---

## 混合方案的优势详解

### 场景1：总收益统计

**需求**：查看2025年第一季度所有收益

```typescript
// ✅ 一个查询搞定
const totalRevenue = await paymentsApi.readMany({
  filter: {
    community_id: communityId,
    paid_at: {
      _gte: '2025-01-01',
      _lte: '2025-03-31'
    }
  },
  aggregate: {
    sum: ['amount']
  }
})
// 结果：{ sum: { amount: 1250000 } }
```

**对比多表方案**：
```typescript
// ❌ 需要查询N张表再汇总
const p1 = await propertyPaymentsApi.readMany(filter)
const p2 = await parkingPaymentsApi.readMany(filter)
const p3 = await adPaymentsApi.readMany(filter)
const total = p1.sum + p2.sum + p3.sum
```

---

### 场景2：按收益类型统计

**需求**：查看2025年1月各类收益占比

```typescript
// ✅ 单个GroupBy查询
const revenueByType = await paymentsApi.readMany({
  filter: {
    community_id: communityId,
    paid_at: { _gte: '2025-01-01', _lte: '2025-01-31' }
  },
  groupBy: ['type_code'],
  aggregate: { sum: ['amount'], count: ['*'] }
})

// 结果：
// [
//   { type_code: 'property', sum: 850000, count: 320 },
//   { type_code: 'parking', sum: 280000, count: 156 },
//   { type_code: 'ad', sum: 45000, count: 3 }
// ]
```

前端渲染饼图/柱状图：
```typescript
const chartData = revenueByType.map(item => ({
  name: getTypeName(item.type_code),  // '物业费', '停车费', '广告'
  value: item.sum.amount,
  percentage: (item.sum.amount / totalRevenue) * 100
}))
```

---

### 场景3：月度财务报表

**需求**：生成2025年每月收支对比表

```typescript
// ✅ 收入：一个查询
const revenues = await paymentsApi.readMany({
  filter: {
    community_id,
    paid_at: { _gte: '2025-01-01', _lte: '2025-12-31' }
  },
  groupBy: ['DATE_TRUNC(\'month\', paid_at)'],
  aggregate: { sum: ['amount'] }
})

// ✅ 支出：同样的查询（假设支出也用payments表，type_code区分）
const expenses = await paymentsApi.readMany({
  filter: {
    community_id,
    type_code: { _in: ['salary', 'maintenance', 'utilities'] },
    paid_at: { _gte: '2025-01-01', _lte: '2025-12-31' }
  },
  groupBy: ['DATE_TRUNC(\'month\', paid_at)'],
  aggregate: { sum: ['amount'] }
})

// 生成报表
const report = months.map(month => ({
  month,
  revenue: revenues[month] || 0,
  expense: expenses[month] || 0,
  profit: (revenues[month] || 0) - (expenses[month] || 0)
}))
```

---

### 场景4：业主个人查询

**需求**：张三查看自己的所有缴费记录（物业费+停车费）

```typescript
// ✅ 一个查询搞定
const myPayments = await paymentsApi.readMany({
  filter: {
    owner_id: currentUserId
  },
  fields: [
    '*',
    'receivable.*',           // 关联应收信息
    'receivable.type_detail'  // 关联类型详情
  ],
  sort: ['-paid_at']
})

// 前端显示
myPayments.forEach(payment => {
  if (payment.type_code === 'property') {
    console.log(`物业费: ${payment.paid_periods.join(',')} - ¥${payment.amount}`)
  } else if (payment.type_code === 'parking') {
    const detail = payment.receivable.type_detail  // parking_details
    console.log(`停车费: ${detail.parking_spot.spot_number} - ¥${payment.amount}`)
  }
})
```

**对比多表方案**：
```typescript
// ❌ 需要查询多张表再合并
const propertyPayments = await propertyPaymentsApi.readMany(...)
const parkingPayments = await parkingPaymentsApi.readMany(...)
const allPayments = [...propertyPayments, ...parkingPayments]
  .sort((a, b) => b.paid_at - a.paid_at)
```

---

### 场景5：停车费特殊查询

**需求**：查询所有未缴费的车位，按欠费金额降序

```typescript
// ✅ 联表查询，保留类型安全
const unpaidParking = await receivablesApi.readMany({
  filter: {
    community_id,
    type_code: 'parking',
    is_paid: false
  },
  fields: [
    '*',
    'parking_detail.*',              // parking_details的所有字段
    'parking_detail.parking_spot.*'  // parking_spots的所有字段
  ],
  sort: ['-amount']
})

// 结果包含完整的类型特定信息
unpaidParking.forEach(item => {
  console.log(`
    车位: ${item.parking_detail.parking_spot.spot_number}
    车牌: ${item.parking_detail.parking_spot.license_plate}
    欠费: ¥${item.amount}
    业主: ${item.owner.first_name}
  `)
})
```

**关键优势**：
- ✅ 核心表查询快（有索引的真实列）
- ✅ 类型字段强类型（parking_details的字段有约束）
- ✅ 统一逻辑（欠费、催缴等）
- ✅ 特殊逻辑（停车位分配、车牌管理等）

---

### 场景6：新增收益类型

**需求**：新增"会所场地租金"收益

#### 多表方案 ❌
1. 创建 `venue_billings` 表
2. 创建 `venue_payments` 表
3. 更新所有汇总查询SQL
4. 更新前端统计组件
5. 更新权限配置
6. 更新API接口

#### 混合方案 ✅
1. 创建 `venue_details` 表（只包含场地特有字段）
```sql
CREATE TABLE venue_details (
  id UUID PRIMARY KEY,
  venue_id UUID REFERENCES venues(id),
  rental_type TEXT,  -- 'hourly', 'daily', 'monthly'
  booking_date DATE
);
```

2. 在 `revenue_types` 表加一行配置
```sql
INSERT INTO revenue_types (code, name, detail_table, has_owner)
VALUES ('venue', '场地租金', 'venue_details', true);
```

3. **完成！** 无需修改任何查询、统计、前端代码

---

## 混合方案的实现要点

### 1. 核心表设计原则

**receivables 表包含**：
- ✅ 所有类型通用的财务字段（amount, period, is_paid）
- ✅ 所有类型通用的业务字段（status, created_at）
- ✅ 用于统计、查询的关键字段（type_code, community_id）

**不包含**：
- ❌ 类型特定的业务字段（车位号、广告内容等）

### 2. 关联查询示例

```typescript
// Directus SDK 查询
const parkingReceivables = await receivablesApi.readMany({
  filter: {
    type_code: 'parking',
    is_paid: false
  },
  fields: [
    '*',
    'parking_detail.parking_spot.spot_number',
    'parking_detail.parking_spot.license_plate',
    'owner.first_name'
  ]
})
```

### 3. 前端组件复用

```vue
<!-- 通用的缴费记录列表组件 -->
<PaymentList
  :payments="payments"
  :type-renderer="getTypeRenderer"
/>

<script>
// 根据type_code渲染不同的详情
function getTypeRenderer(payment) {
  switch (payment.type_code) {
    case 'parking':
      return <ParkingPaymentDetail :data="payment.parking_detail" />
    case 'ad':
      return <AdPaymentDetail :data="payment.ad_detail" />
    default:
      return <DefaultPaymentDetail :data="payment" />
  }
}
</script>
```

---

## 总结对比

| 场景 | 多表方案 | 统一表方案 | 混合方案 ⭐ |
|------|---------|-----------|-----------|
| **总收益统计** | ❌ 复杂UNION | ✅ 简单SUM | ✅ 简单SUM |
| **按类型统计** | ❌ 多次查询 | ✅ GroupBy | ✅ GroupBy |
| **月度报表** | ❌ 代码重复 | ✅ 统一逻辑 | ✅ 统一逻辑 |
| **业主查询** | ❌ 多表合并 | ✅ 单表查询 | ✅ 单表查询 |
| **类型特定查询** | ✅ 性能好 | ❌ JSONB慢 | ✅ 真实列快 |
| **新增类型** | ❌ 高成本 | ✅ 零成本 | ✅ 低成本 |
| **类型安全** | ✅ 强约束 | ❌ JSONB弱 | ✅ 强约束 |
| **代码维护** | ❌ 重复多 | ✅ 统一 | ✅ 统一 |

---

## 我的最终建议

**采用混合方案**，具体实施：

### 第一阶段（当前）
1. 保持 billings/billing_payments 作为物业费专用表（已有代码）
2. 新增收益时使用混合方案：
   - `receivables` + `payments` 作为核心表
   - 每种新收益创建一个 `xxx_details` 表

### 第二阶段（未来可选）
如果觉得混合方案运行良好，可以将 billings/billing_payments 迁移到混合方案：
```sql
-- 将现有数据迁移到核心表
INSERT INTO receivables (type_code, ...)
SELECT 'property', ... FROM billings;

-- billings表改名为 property_details
-- 或者保持billings，通过视图兼容旧代码
```

### 优先级
1. **高优先级**：停车费（业务需求明确）
2. **中优先级**：广告收益、公共区域租金
3. **低优先级**：其他零散收入

**你觉得这个混合方案如何？是否解决了你的疑虑？**
