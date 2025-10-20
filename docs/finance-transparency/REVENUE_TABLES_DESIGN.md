# 混合方案 - 收益管理表设计

## 设计原则

**物业费**：保持专用表（billings + billing_payments）
**其他收益**：使用混合方案（receivables + payments + xxx_details）

当前实现：停车位收益、广告收益

---

## 表结构总览

```
收益类型
├── revenue_types (收益类型配置表)

混合方案核心表
├── receivables (应收核心表)
├── payments (实收核心表)

停车位收益
├── parking_spots (停车位主数据)
└── parking_details (停车位收益详情，关联receivables)

广告收益
├── ad_spots (广告位主数据)
└── ad_details (广告收益详情，关联receivables)
```

---

## 1. revenue_types (收益类型配置表)

**用途**：配置系统支持的收益类型，用于前端展示和查询

| 字段 | 类型 | 约束 | 说明 | 示例值 |
|------|------|------|------|--------|
| id | uuid | PK | 主键 | |
| code | string(50) | UNIQUE, NOT NULL | 类型代码 | 'parking', 'ad' |
| name | string(100) | NOT NULL | 类型名称 | '停车费', '广告收益' |
| description | text | | 类型说明 | '停车位管理费和租金' |
| detail_table | string(100) | | 详情表名 | 'parking_details' |
| icon | string(50) | | 图标名称 | 'car' |
| color | string(20) | | 显示颜色 | '#1890ff' |
| has_owner | boolean | NOT NULL, DEFAULT false | 是否关联业主 | true |
| is_active | boolean | NOT NULL, DEFAULT true | 是否启用 | true |
| sort_order | integer | DEFAULT 0 | 排序顺序 | 10 |
| date_created | timestamp | AUTO | 创建时间 | |
| date_updated | timestamp | AUTO | 更新时间 | |

**初始数据**：
```json
[
  {
    "code": "parking",
    "name": "停车费",
    "description": "停车位管理费和租金收入",
    "detail_table": "parking_details",
    "icon": "car",
    "color": "#1890ff",
    "has_owner": true,
    "is_active": true,
    "sort_order": 10
  },
  {
    "code": "ad",
    "name": "广告收益",
    "description": "小区广告位租赁收入",
    "detail_table": "ad_details",
    "icon": "notification",
    "color": "#52c41a",
    "has_owner": false,
    "is_active": true,
    "sort_order": 20
  }
]
```

---

## 2. receivables (应收核心表)

**用途**：存储所有类型收益的应收账单（除物业费外）

| 字段 | 类型 | 约束 | 说明 | 示例值 |
|------|------|------|------|--------|
| id | uuid | PK | 主键 | |
| community_id | uuid | FK, NOT NULL | 所属小区 | |
| type_code | string(50) | NOT NULL | 收益类型 | 'parking', 'ad' |
| type_detail_id | uuid | | 类型详情ID | (parking_details.id) |
| owner_id | uuid | FK, NULLABLE | 业主ID（可选） | |
| period | string(7) | NOT NULL | 账期 YYYY-MM | '2025-01' |
| amount | decimal(10,2) | NOT NULL | 应收金额 | 500.00 |
| is_paid | boolean | NOT NULL, DEFAULT false | 是否已缴费 | false |
| paid_at | timestamp | NULLABLE | 缴费时间 | |
| due_date | timestamp | NULLABLE | 应缴日期 | '2025-01-05' |
| late_fee | decimal(10,2) | DEFAULT 0 | 滞纳金 | 0.00 |
| status | string(20) | DEFAULT 'pending' | 状态 | 'pending', 'approved', 'cancelled' |
| notes | text | | 备注 | |
| user_created | uuid | FK | 创建人 | |
| date_created | timestamp | AUTO | 创建时间 | |
| user_updated | uuid | FK | 更新人 | |
| date_updated | timestamp | AUTO | 更新时间 | |
| date_deleted | timestamp | NULLABLE | 删除时间（软删除） | |

**索引**：
- `idx_receivables_community` ON (community_id)
- `idx_receivables_type` ON (type_code)
- `idx_receivables_owner` ON (owner_id)
- `idx_receivables_period` ON (period)
- `idx_receivables_paid` ON (is_paid, community_id, period)

**复合索引**：
- `idx_receivables_query` ON (community_id, type_code, period, is_paid)

---

## 3. payments (实收核心表)

**用途**：存储所有类型收益的实际缴费记录（除物业费外）

| 字段 | 类型 | 约束 | 说明 | 示例值 |
|------|------|------|------|--------|
| id | uuid | PK | 主键 | |
| community_id | uuid | FK, NOT NULL | 所属小区 | |
| type_code | string(50) | NOT NULL | 收益类型 | 'parking', 'ad' |
| owner_id | uuid | FK, NULLABLE | 业主ID（可选） | |
| amount | decimal(10,2) | NOT NULL | 实缴金额 | 1500.00 |
| paid_at | timestamp | NOT NULL | 缴费时间 | '2025-01-15 14:30' |
| paid_periods | json | | 缴费账期数组 | ["2025-01", "2025-02", "2025-03"] |
| payment_method | string(50) | | 支付方式 | 'wechat', 'alipay', 'bank', 'cash' |
| payer_name | string(100) | | 缴费人姓名 | '张三' |
| payer_phone | string(20) | | 缴费人电话 | '13800138000' |
| transaction_no | string(100) | | 交易单号 | 'TX202501151430ABC123' |
| proof_files | json | | 缴费凭证文件ID数组 | ["file-uuid-1", "file-uuid-2"] |
| notes | text | | 备注 | |
| user_created | uuid | FK | 创建人 | |
| date_created | timestamp | AUTO | 创建时间 | |
| user_updated | uuid | FK | 更新人 | |
| date_updated | timestamp | AUTO | 更新时间 | |
| date_deleted | timestamp | NULLABLE | 删除时间（软删除） | |

**索引**：
- `idx_payments_community` ON (community_id)
- `idx_payments_type` ON (type_code)
- `idx_payments_owner` ON (owner_id)
- `idx_payments_paid_at` ON (paid_at)
- `idx_payments_query` ON (community_id, type_code, paid_at)

---

## 4. parking_spots (停车位主数据表)

**用途**：存储小区所有停车位的基本信息

| 字段 | 类型 | 约束 | 说明 | 示例值 |
|------|------|------|------|--------|
| id | uuid | PK | 主键 | |
| community_id | uuid | FK, NOT NULL | 所属小区 | |
| building_id | uuid | FK, NULLABLE | 所属楼栋（可选） | |
| spot_number | string(50) | NOT NULL | 车位编号 | 'A-101', 'B1-023' |
| location | string(100) | | 位置描述 | '地下1层A区' |
| type | string(20) | NOT NULL | 车位类型 | 'fixed', 'temp' |
| ownership | string(20) | NOT NULL | 产权类型 | 'owned', 'rented', 'public' |
| is_sold | boolean | DEFAULT false | 是否已出售 | true |
| is_rented | boolean | DEFAULT false | 是否已出租 | false |
| owner_id | uuid | FK, NULLABLE | 产权所有人 | |
| renter_id | uuid | FK, NULLABLE | 租户 | |
| license_plate | string(20) | | 绑定车牌号 | '京A12345' |
| monthly_management_fee | decimal(10,2) | | 月管理费 | 200.00 |
| monthly_rent | decimal(10,2) | | 月租金 | 500.00 |
| contract_start | date | NULLABLE | 合同开始日期 | '2025-01-01' |
| contract_end | date | NULLABLE | 合同结束日期 | '2025-12-31' |
| status | string(20) | DEFAULT 'active' | 状态 | 'active', 'inactive', 'maintenance' |
| notes | text | | 备注 | |
| user_created | uuid | FK | 创建人 | |
| date_created | timestamp | AUTO | 创建时间 | |
| user_updated | uuid | FK | 更新人 | |
| date_updated | timestamp | AUTO | 更新时间 | |
| date_deleted | timestamp | NULLABLE | 删除时间（软删除） | |

**唯一约束**：
- `unique_spot_number` ON (community_id, spot_number) WHERE date_deleted IS NULL

**索引**：
- `idx_parking_spots_community` ON (community_id)
- `idx_parking_spots_owner` ON (owner_id)
- `idx_parking_spots_renter` ON (renter_id)
- `idx_parking_spots_status` ON (is_sold, is_rented, status)

**字段说明**：
- `type`:
  - `fixed`: 固定车位（产权车位）
  - `temp`: 临时车位
- `ownership`:
  - `owned`: 业主自有（已购买）
  - `rented`: 租赁
  - `public`: 公共车位
- `monthly_management_fee`: 车位管理费（无论是否出租都要交）
- `monthly_rent`: 租金（仅出租时收取）

---

## 5. parking_details (停车位收益详情表)

**用途**：关联 receivables，存储每笔停车费应收的具体信息

| 字段 | 类型 | 约束 | 说明 | 示例值 |
|------|------|------|------|--------|
| id | uuid | PK | 主键（同时是receivables.type_detail_id） | |
| parking_spot_id | uuid | FK, NOT NULL | 关联停车位 | |
| fee_type | string(20) | NOT NULL | 费用类型 | 'management', 'rent' |
| contract_no | string(50) | | 合同编号 | 'PK-2025-001' |
| contract_start | date | | 合同开始日期 | '2025-01-01' |
| contract_end | date | | 合同结束日期 | '2025-12-31' |

**说明**：
- `fee_type`:
  - `management`: 管理费
  - `rent`: 租金

**关联关系**：
```sql
receivables.type_detail_id = parking_details.id
parking_details.parking_spot_id = parking_spots.id
```

**查询示例**：
```sql
-- 查询所有停车费应收，包含车位信息
SELECT
  r.*,
  pd.fee_type,
  ps.spot_number,
  ps.license_plate
FROM receivables r
JOIN parking_details pd ON r.type_detail_id = pd.id
JOIN parking_spots ps ON pd.parking_spot_id = ps.id
WHERE r.type_code = 'parking' AND r.is_paid = false;
```

---

## 6. ad_spots (广告位主数据表)

**用途**：存储小区所有广告位的基本信息

| 字段 | 类型 | 约束 | 说明 | 示例值 |
|------|------|------|------|--------|
| id | uuid | PK | 主键 | |
| community_id | uuid | FK, NOT NULL | 所属小区 | |
| spot_number | string(50) | NOT NULL | 广告位编号 | 'AD-001', 'LED-01' |
| location | string(200) | NOT NULL | 位置描述 | '小区大门右侧', '1号楼电梯间' |
| type | string(20) | NOT NULL | 广告位类型 | 'billboard', 'led', 'elevator', 'poster' |
| size | string(50) | | 尺寸规格 | '3m×2m', '1920×1080' |
| monthly_price | decimal(10,2) | NOT NULL | 月租金标准 | 5000.00 |
| status | string(20) | DEFAULT 'available' | 状态 | 'available', 'occupied', 'maintenance' |
| notes | text | | 备注 | |
| user_created | uuid | FK | 创建人 | |
| date_created | timestamp | AUTO | 创建时间 | |
| user_updated | uuid | FK | 更新人 | |
| date_updated | timestamp | AUTO | 更新时间 | |
| date_deleted | timestamp | NULLABLE | 删除时间（软删除） | |

**唯一约束**：
- `unique_ad_spot_number` ON (community_id, spot_number) WHERE date_deleted IS NULL

**索引**：
- `idx_ad_spots_community` ON (community_id)
- `idx_ad_spots_type` ON (type)
- `idx_ad_spots_status` ON (status)

**字段说明**：
- `type`:
  - `billboard`: 户外广告牌
  - `led`: LED显示屏
  - `elevator`: 电梯广告
  - `poster`: 海报栏

---

## 7. ad_details (广告收益详情表)

**用途**：关联 receivables，存储每笔广告费应收的具体信息

| 字段 | 类型 | 约束 | 说明 | 示例值 |
|------|------|------|------|--------|
| id | uuid | PK | 主键（同时是receivables.type_detail_id） | |
| ad_spot_id | uuid | FK, NOT NULL | 关联广告位 | |
| advertiser_name | string(200) | NOT NULL | 广告主名称 | '某某超市' |
| advertiser_contact | string(100) | | 广告主联系方式 | '张经理 13800138000' |
| ad_content | text | | 广告内容描述 | '超市促销活动' |
| contract_no | string(50) | | 合同编号 | 'AD-2025-001' |
| contract_start | date | NOT NULL | 合同开始日期 | '2025-01-01' |
| contract_end | date | NOT NULL | 合同结束日期 | '2025-06-30' |
| discount_rate | decimal(5,2) | DEFAULT 0 | 折扣率 | 0.10 (10%折扣) |

**关联关系**：
```sql
receivables.type_detail_id = ad_details.id
ad_details.ad_spot_id = ad_spots.id
```

**查询示例**：
```sql
-- 查询所有广告费应收，包含广告位信息
SELECT
  r.*,
  ad.advertiser_name,
  ad.contract_start,
  ad.contract_end,
  spot.location,
  spot.type
FROM receivables r
JOIN ad_details ad ON r.type_detail_id = ad.id
JOIN ad_spots spot ON ad.ad_spot_id = spot.id
WHERE r.type_code = 'ad' AND r.is_paid = false;
```

---

## 数据流程示例

### 停车费场景

#### 1. 创建停车位
```sql
INSERT INTO parking_spots (community_id, spot_number, type, monthly_management_fee)
VALUES ('community-uuid', 'A-101', 'fixed', 200.00);
```

#### 2. 业主购买车位，开始收取管理费
```sql
-- 更新车位信息
UPDATE parking_spots
SET is_sold = true, owner_id = 'user-uuid'
WHERE id = 'spot-uuid';

-- 生成2025年全年应收账单
FOR each month IN 1..12:
  -- 创建parking_details
  INSERT INTO parking_details (id, parking_spot_id, fee_type)
  VALUES (uuid_generate(), 'spot-uuid', 'management');

  -- 创建receivable
  INSERT INTO receivables (
    community_id, type_code, type_detail_id, owner_id,
    period, amount
  ) VALUES (
    'community-uuid', 'parking', parking_detail_id, 'user-uuid',
    '2025-' || month, 200.00
  );
```

#### 3. 业主缴费（一次缴3个月）
```sql
-- 创建payment记录
INSERT INTO payments (
  community_id, type_code, owner_id,
  amount, paid_at, paid_periods, payment_method
) VALUES (
  'community-uuid', 'parking', 'user-uuid',
  600.00, NOW(), '["2025-01", "2025-02", "2025-03"]', 'wechat'
);

-- 更新对应的receivables为已缴费
UPDATE receivables
SET is_paid = true, paid_at = NOW()
WHERE owner_id = 'user-uuid'
  AND type_code = 'parking'
  AND period IN ('2025-01', '2025-02', '2025-03');
```

### 广告费场景

#### 1. 创建广告位
```sql
INSERT INTO ad_spots (community_id, spot_number, location, type, monthly_price)
VALUES ('community-uuid', 'AD-001', '小区大门右侧', 'billboard', 5000.00);
```

#### 2. 签订广告合同（6个月）
```sql
-- 创建ad_details
INSERT INTO ad_details (
  id, ad_spot_id, advertiser_name,
  contract_no, contract_start, contract_end
) VALUES (
  uuid_generate(), 'spot-uuid', '某某超市',
  'AD-2025-001', '2025-01-01', '2025-06-30'
);

-- 生成6个月应收账单
FOR each month IN 1..6:
  INSERT INTO receivables (
    community_id, type_code, type_detail_id,
    period, amount
  ) VALUES (
    'community-uuid', 'ad', ad_detail_id,
    '2025-' || month, 5000.00
  );
```

#### 3. 广告主缴费（一次缴半年）
```sql
-- 创建payment记录（广告费没有owner_id）
INSERT INTO payments (
  community_id, type_code, amount, paid_at,
  paid_periods, payment_method, payer_name
) VALUES (
  'community-uuid', 'ad', 30000.00, NOW(),
  '["2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06"]',
  'bank', '某某超市-张经理'
);

-- 更新对应的receivables
UPDATE receivables
SET is_paid = true, paid_at = NOW()
WHERE type_code = 'ad'
  AND type_detail_id = 'ad-detail-uuid'
  AND period IN ('2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06');
```

---

## 查询示例

### 1. 查询小区总收益（包含物业费）

```typescript
// 物业费
const propertyRevenue = await billingPaymentsApi.readMany({
  filter: { community_id, paid_at: { _gte: '2025-01-01', _lte: '2025-12-31' } },
  aggregate: { sum: ['amount'] }
})

// 其他收益（停车费+广告费）
const otherRevenue = await paymentsApi.readMany({
  filter: { community_id, paid_at: { _gte: '2025-01-01', _lte: '2025-12-31' } },
  aggregate: { sum: ['amount'] }
})

const total = propertyRevenue.sum + otherRevenue.sum
```

### 2. 按收益类型统计

```typescript
const revenueByType = await paymentsApi.readMany({
  filter: { community_id, paid_at: { _gte: '2025-01-01', _lte: '2025-01-31' } },
  groupBy: ['type_code'],
  aggregate: { sum: ['amount'], count: ['*'] }
})

// 结果：
// [
//   { type_code: 'parking', sum: { amount: 28000 }, count: 140 },
//   { type_code: 'ad', sum: { amount: 15000 }, count: 3 }
// ]
```

### 3. 查询某业主的所有缴费（物业费+停车费）

```typescript
// 物业费
const propertyPayments = await billingPaymentsApi.readMany({
  filter: { owner_id },
  fields: ['*']
})

// 停车费
const parkingPayments = await paymentsApi.readMany({
  filter: { owner_id, type_code: 'parking' },
  fields: ['*', 'parking_detail.parking_spot.*']
})

// 合并显示
const allPayments = [
  ...propertyPayments.map(p => ({ type: 'property', ...p })),
  ...parkingPayments.map(p => ({ type: 'parking', ...p }))
].sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))
```

---

## 下一步

1. **创建Directus字段脚本** - 自动创建这些表
2. **生成测试数据** - 停车位和广告位的测试数据
3. **实现前端页面** - 收益统计、停车位管理、广告位管理

你觉得这个表设计如何？需要调整的地方吗？
