# 停车费管理 - 表结构设计文档

## 概述

停车费是混合方案中的第一个收益类型，包含三种费用：
- **车位管理费**：业主购买车位后每月缴纳的管理费
- **车位租金**：租赁车位的月租金
- **临时停车费**：临停车辆的停车费（来自闸机系统）

## 表结构总览

```
停车费相关表（5张）：

1. parking_spots          - 停车位主数据表（所有车位的档案）
2. parking_details        - 停车费详情表（关联receivables，管理费/租金）
3. parking_temp_records   - 临停费记录表（独立表，记录临停详情）
4. receivables           - 应收核心表（管理费、租金的账单）
5. payments              - 实收核心表（所有停车费的缴费记录）
```

**关联关系**：
```
管理费/租金流程：
parking_spots (车位档案)
    ↓
parking_details (费用详情)
    ↓
receivables (应收账单)
    ↓ 缴费后
payments (实收记录)

临停费流程：
parking_temp_records (入场/出场记录)
    ↓ 缴费后
payments (实收记录)
    ↑
    └─ payment_id 反向关联
```

---

## 1. parking_spots（停车位主数据表）

### 表说明
存储小区所有停车位的基本档案信息，类似于房产信息表。

### 字段定义

| 字段名 | 类型 | 约束 | 说明 | 示例值 |
|--------|------|------|------|--------|
| **id** | uuid | PRIMARY KEY | 主键 | |
| **community_id** | uuid | FOREIGN KEY, NOT NULL | 所属小区 | |
| **building_id** | uuid | FOREIGN KEY, NULLABLE | 所属楼栋（可选） | |
| **spot_number** | varchar(50) | NOT NULL | 车位编号 | 'A-101', 'B1-023' |
| **location** | varchar(100) | NULLABLE | 位置描述 | '地下1层A区' |
| **type** | varchar(20) | NOT NULL | 车位类型 | 'fixed', 'temp' |
| **ownership** | varchar(20) | NOT NULL | 产权类型 | 'owned', 'public' |
| **is_sold** | boolean | NOT NULL, DEFAULT false | 是否已出售 | true |
| **is_rented** | boolean | NOT NULL, DEFAULT false | 是否已出租 | false |
| **owner_id** | uuid | FOREIGN KEY, NULLABLE | 产权业主ID | |
| **renter_id** | uuid | FOREIGN KEY, NULLABLE | 租户ID | |
| **license_plate** | varchar(20) | NULLABLE | 绑定车牌号 | '京A12345' |
| **monthly_management_fee** | decimal(10,2) | NULLABLE | 月管理费 | 200.00 |
| **monthly_rent** | decimal(10,2) | NULLABLE | 月租金标准 | 500.00 |
| **rent_contract_start** | date | NULLABLE | 租赁合同开始日期 | '2025-01-01' |
| **rent_contract_end** | date | NULLABLE | 租赁合同结束日期 | '2025-12-31' |
| **purchase_contract_files** | json | NULLABLE | 购买合同文件（Directus files） | ["uuid-1", "uuid-2"] |
| **rent_contract_files** | json | NULLABLE | 租赁合同文件（Directus files） | ["uuid-3"] |
| **status** | varchar(20) | NOT NULL, DEFAULT 'active' | 车位状态 | 'active', 'inactive', 'maintenance' |
| **notes** | text | NULLABLE | 备注信息 | |
| **user_created** | uuid | FOREIGN KEY | 创建人 | |
| **date_created** | timestamp | NOT NULL, DEFAULT NOW() | 创建时间 | |
| **user_updated** | uuid | FOREIGN KEY | 更新人 | |
| **date_updated** | timestamp | AUTO UPDATE | 更新时间 | |
| **date_deleted** | timestamp | NULLABLE | 软删除时间 | |

### 字段说明

#### type（车位类型）
- `fixed`: 固定车位（可以出售的产权车位）
- `temp`: 临时车位（公共车位，不能出售）

#### ownership（产权类型）
- `owned`: 业主已购买（记录owner_id，每月收管理费）
- `public`: 公共车位（可以出租或供临停使用）

#### 业务状态组合
| is_sold | is_rented | ownership | owner_id | renter_id | 说明 |
|---------|-----------|-----------|----------|-----------|------|
| true | false | owned | ✓ | null | 业主自用车位，收管理费 |
| false | true | public | null | ✓ | 公共车位出租，收租金 |
| false | false | public | null | null | 空置公共车位 |

#### 文件字段说明
- `purchase_contract_files`: 存储购买合同PDF或照片（Directus files UUID数组）
  - 业主购买车位时上传
  - 用于存档和权属证明
- `rent_contract_files`: 存储租赁合同PDF或照片
  - 车位出租时上传
  - 每次续租可追加新合同文件

### 约束和索引

#### 唯一约束
```sql
CONSTRAINT unique_spot_number
UNIQUE (community_id, spot_number)
WHERE date_deleted IS NULL
```

#### 索引
```sql
CREATE INDEX idx_parking_spots_community ON parking_spots(community_id);
CREATE INDEX idx_parking_spots_owner ON parking_spots(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX idx_parking_spots_renter ON parking_spots(renter_id) WHERE renter_id IS NOT NULL;
CREATE INDEX idx_parking_spots_status ON parking_spots(community_id, is_sold, is_rented, status);
CREATE INDEX idx_parking_spots_license ON parking_spots(license_plate) WHERE license_plate IS NOT NULL;
```

### 业务场景示例

#### 场景1：业主购买车位
```sql
INSERT INTO parking_spots (
  community_id, spot_number, type, ownership,
  is_sold, owner_id, license_plate, monthly_management_fee,
  status
) VALUES (
  'community-uuid', 'A-101', 'fixed', 'owned',
  true, 'owner-uuid', '京A12345', 200.00,
  'active'
);
```

#### 场景2：公共车位出租
```sql
UPDATE parking_spots
SET
  is_rented = true,
  renter_id = 'renter-uuid',
  license_plate = '京B67890',
  rent_contract_start = '2025-01-01',
  rent_contract_end = '2025-12-31',
  monthly_rent = 500.00
WHERE id = 'spot-uuid';
```

#### 场景3：查询空置车位
```sql
SELECT spot_number, location, monthly_rent
FROM parking_spots
WHERE community_id = 'xxx'
  AND ownership = 'public'
  AND is_rented = false
  AND status = 'active'
  AND date_deleted IS NULL
ORDER BY spot_number;
```

---

## 2. parking_details（停车费详情表）

### 表说明
连接应收账单（receivables）和具体车位（parking_spots），存储每笔管理费或租金的关联信息。

**注意**：临停费不使用此表（临停费用独立的 parking_temp_records 表）

### 字段定义

| 字段名 | 类型 | 约束 | 说明 | 示例值 |
|--------|------|------|------|--------|
| **id** | uuid | PRIMARY KEY | 主键（同时是receivables.type_detail_id） | |
| **parking_spot_id** | uuid | FOREIGN KEY, NOT NULL | 关联停车位 | |
| **fee_type** | varchar(20) | NOT NULL | 费用类型 | 'management', 'rent' |
| **contract_no** | varchar(50) | NULLABLE | 合同编号 | 'PK-2025-001' |

### 字段说明

#### fee_type（费用类型）
- `management`: 管理费（业主购买车位后的管理费）
- `rent`: 租金（租赁车位的租金）

### 关联关系
```sql
-- receivables 通过 type_detail_id 关联
receivables.type_detail_id = parking_details.id

-- parking_details 关联车位
parking_details.parking_spot_id = parking_spots.id
```

### 索引
```sql
CREATE INDEX idx_parking_details_spot ON parking_details(parking_spot_id);
CREATE INDEX idx_parking_details_fee_type ON parking_details(fee_type);
```

### 业务场景示例

#### 场景：生成车位管理费账单
```sql
-- 1. 创建 parking_details 记录
INSERT INTO parking_details (
  id, parking_spot_id, fee_type, contract_no
) VALUES (
  'detail-uuid', 'spot-uuid', 'management', NULL
);

-- 2. 创建 receivable 账单
INSERT INTO receivables (
  community_id, type_code, type_detail_id,
  owner_id, period, amount, due_date
) VALUES (
  'community-uuid', 'parking_management', 'detail-uuid',
  'owner-uuid', '2025-01', 200.00, '2025-01-05'
);
```

---

## 3. parking_temp_records（临停费记录表）

### 表说明
存储临时停车的详细记录，包括入场、出场、缴费等信息。主要由闸机系统自动生成。

### 字段定义

| 字段名 | 类型 | 约束 | 说明 | 示例值 |
|--------|------|------|------|--------|
| **id** | uuid | PRIMARY KEY | 主键 | |
| **community_id** | uuid | FOREIGN KEY, NOT NULL | 所属小区 | |
| **payment_id** | uuid | FOREIGN KEY, NULLABLE | 关联缴费记录 | payments.id |
| **license_plate** | varchar(20) | NOT NULL | 车牌号 | '京A12345' |
| **entry_time** | timestamp | NOT NULL | 入场时间 | '2025-01-15 08:00:00' |
| **exit_time** | timestamp | NULLABLE | 出场时间 | '2025-01-15 18:00:00' |
| **duration_minutes** | integer | NULLABLE | 停车时长（分钟） | 600 |
| **parking_spot_number** | varchar(50) | NULLABLE | 临停车位号 | 'TEMP-01' |
| **calculated_amount** | decimal(10,2) | NOT NULL | 计算应收金额 | 25.00 |
| **actual_amount** | decimal(10,2) | NULLABLE | 实际收费金额 | 25.00 |
| **is_paid** | boolean | NOT NULL, DEFAULT false | 是否已缴费 | false |
| **payment_method** | varchar(50) | NULLABLE | 支付方式 | 'wechat', 'alipay' |
| **gate_system_id** | varchar(100) | NULLABLE | 闸机系统记录ID | 'GATE-001-20250115-001' |
| **operator_id** | uuid | FOREIGN KEY, NULLABLE | 操作员（人工收费时） | |
| **proof_files** | json | NULLABLE | 凭证文件（支付凭证、入场/出场照片） | ["uuid-1", "uuid-2"] |
| **notes** | text | NULLABLE | 备注 | |
| **user_created** | uuid | FOREIGN KEY | 创建人 | |
| **date_created** | timestamp | NOT NULL, DEFAULT NOW() | 创建时间 | |
| **user_updated** | uuid | FOREIGN KEY | 更新人 | |
| **date_updated** | timestamp | AUTO UPDATE | 更新时间 | |

### 字段说明

#### 时间和费用计算
- `entry_time`: 车辆入场时由闸机记录
- `exit_time`: 车辆出场时由闸机记录（入场时为null）
- `duration_minutes`: 出场时自动计算（exit_time - entry_time）
- `calculated_amount`: 根据停车时长和收费标准自动计算
- `actual_amount`: 实际收费（可能有折扣、优惠）

#### 缴费关联
- `payment_id`: 缴费后关联到 payments 表
- `is_paid`: 缴费后更新为 true

#### 文件字段说明
- `proof_files`: 存储相关凭证文件（Directus files UUID数组）
  - 支付凭证截图
  - 闸机入场/出场照片（车牌识别照片）
  - 人工收费时的手写凭证照片

### 索引
```sql
CREATE INDEX idx_temp_records_community ON parking_temp_records(community_id);
CREATE INDEX idx_temp_records_license ON parking_temp_records(license_plate);
CREATE INDEX idx_temp_records_entry_time ON parking_temp_records(entry_time);
CREATE INDEX idx_temp_records_payment ON parking_temp_records(payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX idx_temp_records_unpaid ON parking_temp_records(community_id, is_paid) WHERE is_paid = false;
CREATE INDEX idx_temp_records_gate ON parking_temp_records(gate_system_id) WHERE gate_system_id IS NOT NULL;
```

### 业务场景示例

#### 场景：完整的临停流程

##### 步骤1：车辆入场（闸机自动创建）
```sql
INSERT INTO parking_temp_records (
  id, community_id, license_plate, entry_time,
  calculated_amount, is_paid, gate_system_id
) VALUES (
  'record-uuid', 'community-uuid', '京A12345', NOW(),
  0.00, false, 'GATE-001-20250115-001'
);
-- 闸机抬杆放行
```

##### 步骤2：车辆出场（闸机计算费用）
```sql
UPDATE parking_temp_records
SET
  exit_time = NOW(),
  duration_minutes = EXTRACT(EPOCH FROM (NOW() - entry_time)) / 60,
  calculated_amount = 25.00  -- 根据时长计算
WHERE id = 'record-uuid';

-- 显示缴费二维码
```

##### 步骤3：车主扫码支付
```sql
-- 3.1 创建 payment 记录
INSERT INTO payments (
  id, community_id, type_code, amount,
  paid_at, payment_method, transaction_no
) VALUES (
  'payment-uuid', 'community-uuid', 'parking_temp', 25.00,
  NOW(), 'wechat', 'WX20250115180500123'
);

-- 3.2 关联缴费记录
UPDATE parking_temp_records
SET
  payment_id = 'payment-uuid',
  actual_amount = 25.00,
  is_paid = true,
  payment_method = 'wechat'
WHERE id = 'record-uuid';

-- 闸机抬杆放行
```

#### 查询示例

##### 查询当前在场未出的车辆
```sql
SELECT
  license_plate,
  entry_time,
  parking_spot_number,
  EXTRACT(EPOCH FROM (NOW() - entry_time)) / 60 as minutes_parked
FROM parking_temp_records
WHERE community_id = 'xxx'
  AND exit_time IS NULL
ORDER BY entry_time;
```

##### 查询某车牌的临停历史
```sql
SELECT
  entry_time,
  exit_time,
  duration_minutes,
  actual_amount,
  payment_method
FROM parking_temp_records
WHERE license_plate = '京A12345'
  AND is_paid = true
ORDER BY entry_time DESC
LIMIT 20;
```

##### 按日统计临停收益
```sql
SELECT
  DATE(entry_time) as date,
  COUNT(*) as count,
  SUM(actual_amount) as total_amount
FROM parking_temp_records
WHERE community_id = 'xxx'
  AND is_paid = true
  AND entry_time >= '2025-01-01'
  AND entry_time < '2025-02-01'
GROUP BY DATE(entry_time)
ORDER BY date;
```

---

## 4. receivables（应收核心表 - 停车费部分）

### 表说明
混合方案的核心表，存储所有非物业费的应收账单。停车费使用两种type_code：
- `parking_management`: 车位管理费
- `parking_rent`: 车位租金

**注意**：临停费（parking_temp）不使用 receivables，直接记录到 payments。

### 停车费相关字段

| 字段名 | 类型 | 约束 | 说明 | 停车费示例 |
|--------|------|------|------|-----------|
| **id** | uuid | PRIMARY KEY | 主键 | |
| **community_id** | uuid | FOREIGN KEY, NOT NULL | 所属小区 | |
| **type_code** | varchar(50) | NOT NULL | 收益类型 | 'parking_management', 'parking_rent' |
| **type_detail_id** | uuid | NULLABLE | 详情ID | parking_details.id |
| **owner_id** | uuid | FOREIGN KEY, NULLABLE | 业主/租户ID | |
| **period** | varchar(7) | NOT NULL | 账期 YYYY-MM | '2025-01' |
| **amount** | decimal(10,2) | NOT NULL | 应收金额 | 200.00, 500.00 |
| **is_paid** | boolean | NOT NULL, DEFAULT false | 是否已缴费 | false |
| **paid_at** | timestamp | NULLABLE | 缴费时间 | |
| **due_date** | timestamp | NULLABLE | 应缴日期 | '2025-01-05' |
| **late_fee** | decimal(10,2) | DEFAULT 0 | 滞纳金 | 10.00 |
| **status** | varchar(20) | DEFAULT 'pending' | 状态 | 'pending', 'cancelled' |
| **notes** | text | NULLABLE | 备注 | |

### 查询示例

#### 查询某车位的应收账单
```sql
SELECT
  r.period,
  r.amount,
  r.is_paid,
  r.paid_at,
  pd.fee_type,
  ps.spot_number
FROM receivables r
JOIN parking_details pd ON r.type_detail_id = pd.id
JOIN parking_spots ps ON pd.parking_spot_id = ps.id
WHERE ps.id = 'spot-uuid'
  AND r.type_code IN ('parking_management', 'parking_rent')
ORDER BY r.period;
```

#### 查询所有欠费车位
```sql
SELECT
  ps.spot_number,
  ps.license_plate,
  u.first_name as owner_name,
  COUNT(*) as unpaid_months,
  SUM(r.amount) as total_unpaid
FROM receivables r
JOIN parking_details pd ON r.type_detail_id = pd.id
JOIN parking_spots ps ON pd.parking_spot_id = ps.id
LEFT JOIN directus_users u ON r.owner_id = u.id
WHERE r.community_id = 'xxx'
  AND r.type_code IN ('parking_management', 'parking_rent')
  AND r.is_paid = false
GROUP BY ps.id, ps.spot_number, ps.license_plate, u.first_name
ORDER BY total_unpaid DESC;
```

---

## 5. payments（实收核心表 - 停车费部分）

### 表说明
混合方案的核心表，存储所有非物业费的实际缴费记录。停车费使用三种type_code：
- `parking_management`: 车位管理费
- `parking_rent`: 车位租金
- `parking_temp`: 临时停车费

### 停车费相关字段

| 字段名 | 类型 | 约束 | 说明 | 停车费示例 |
|--------|------|------|------|-----------|
| **id** | uuid | PRIMARY KEY | 主键 | |
| **community_id** | uuid | FOREIGN KEY, NOT NULL | 所属小区 | |
| **type_code** | varchar(50) | NOT NULL | 收益类型 | 'parking_management', 'parking_rent', 'parking_temp' |
| **owner_id** | uuid | FOREIGN KEY, NULLABLE | 业主/租户ID | 管理费/租金有，临停费可能没有 |
| **amount** | decimal(10,2) | NOT NULL | 实缴金额 | 600.00, 500.00, 25.00 |
| **paid_at** | timestamp | NOT NULL | 缴费时间 | '2025-01-15 14:30:00' |
| **paid_periods** | json | NULLABLE | 缴费账期数组 | ["2025-01", "2025-02", "2025-03"] |
| **payment_method** | varchar(50) | NULLABLE | 支付方式 | 'wechat', 'alipay', 'bank', 'cash' |
| **payer_name** | varchar(100) | NULLABLE | 缴费人姓名 | '张三' |
| **payer_phone** | varchar(20) | NULLABLE | 缴费人电话 | '13800138000' |
| **transaction_no** | varchar(100) | NULLABLE | 交易单号 | 'TX2025011514300123' |
| **proof_files** | json | NULLABLE | 缴费凭证文件ID | ["file-uuid-1"] |
| **notes** | text | NULLABLE | 备注 | |

### 说明
- 管理费和租金的 `paid_periods` 是数组，表示一次缴纳多个月
- 临停费的 `paid_periods` 为 null（没有账期概念）
- 临停费的详细信息（车牌、入场时间等）在 `parking_temp_records` 表，通过 `payment_id` 反向关联

### 查询示例

#### 查询2025年1月所有停车收益
```sql
SELECT
  type_code,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM payments
WHERE community_id = 'xxx'
  AND type_code IN ('parking_management', 'parking_rent', 'parking_temp')
  AND paid_at >= '2025-01-01'
  AND paid_at < '2025-02-01'
GROUP BY type_code;

-- 结果示例：
-- parking_management | 300 | 60000.00
-- parking_rent       | 100 | 50000.00
-- parking_temp       | 850 | 25000.00
```

#### 查询某业主的停车费缴费历史
```sql
SELECT
  type_code,
  amount,
  paid_at,
  paid_periods,
  payment_method
FROM payments
WHERE owner_id = 'owner-uuid'
  AND type_code IN ('parking_management', 'parking_rent')
ORDER BY paid_at DESC;
```

#### 查询临停费详情（关联 parking_temp_records）
```sql
SELECT
  p.amount,
  p.paid_at,
  p.payment_method,
  ptr.license_plate,
  ptr.entry_time,
  ptr.exit_time,
  ptr.duration_minutes
FROM payments p
JOIN parking_temp_records ptr ON p.id = ptr.payment_id
WHERE p.community_id = 'xxx'
  AND p.type_code = 'parking_temp'
  AND p.paid_at >= '2025-01-01'
  AND p.paid_at < '2025-02-01'
ORDER BY p.paid_at DESC;
```

---

## 完整业务流程示例

### 流程1：业主购买车位并缴纳管理费

```sql
-- 1. 记录车位已售
UPDATE parking_spots
SET is_sold = true, owner_id = 'owner-uuid', license_plate = '京A12345'
WHERE id = 'spot-uuid';

-- 2. 生成2025年全年管理费账单（12条）
FOR month IN 1..12 LOOP
  -- 2.1 创建 parking_details
  INSERT INTO parking_details (id, parking_spot_id, fee_type)
  VALUES (gen_uuid(), 'spot-uuid', 'management');

  -- 2.2 创建 receivable
  INSERT INTO receivables (
    community_id, type_code, type_detail_id, owner_id,
    period, amount, due_date
  ) VALUES (
    'community-uuid', 'parking_management', detail_id, 'owner-uuid',
    '2025-' || LPAD(month::text, 2, '0'), 200.00,
    ('2025-' || LPAD(month::text, 2, '0') || '-05')::date
  );
END LOOP;

-- 3. 业主一次缴纳3个月管理费
-- 3.1 创建 payment
INSERT INTO payments (
  community_id, type_code, owner_id, amount, paid_at,
  paid_periods, payment_method, payer_name
) VALUES (
  'community-uuid', 'parking_management', 'owner-uuid', 600.00, NOW(),
  '["2025-01", "2025-02", "2025-03"]'::json, 'wechat', '张三'
);

-- 3.2 更新对应的 receivables
UPDATE receivables
SET is_paid = true, paid_at = NOW()
WHERE owner_id = 'owner-uuid'
  AND type_code = 'parking_management'
  AND period IN ('2025-01', '2025-02', '2025-03');
```

### 流程2：公共车位出租

```sql
-- 1. 记录车位出租
UPDATE parking_spots
SET
  is_rented = true,
  renter_id = 'renter-uuid',
  license_plate = '京B67890',
  rent_contract_start = '2025-01-01',
  rent_contract_end = '2025-06-30',
  monthly_rent = 500.00
WHERE id = 'spot-uuid';

-- 2. 生成租期内的租金账单（6个月）
FOR month IN 1..6 LOOP
  INSERT INTO parking_details (id, parking_spot_id, fee_type, contract_no)
  VALUES (gen_uuid(), 'spot-uuid', 'rent', 'RENT-2025-001');

  INSERT INTO receivables (
    community_id, type_code, type_detail_id, owner_id,
    period, amount, due_date
  ) VALUES (
    'community-uuid', 'parking_rent', detail_id, 'renter-uuid',
    '2025-' || LPAD(month::text, 2, '0'), 500.00,
    ('2025-' || LPAD(month::text, 2, '0') || '-05')::date
  );
END LOOP;

-- 3. 租户缴纳首月租金
INSERT INTO payments (
  community_id, type_code, owner_id, amount, paid_at,
  paid_periods, payment_method
) VALUES (
  'community-uuid', 'parking_rent', 'renter-uuid', 500.00, NOW(),
  '["2025-01"]'::json, 'alipay'
);

UPDATE receivables
SET is_paid = true, paid_at = NOW()
WHERE owner_id = 'renter-uuid'
  AND type_code = 'parking_rent'
  AND period = '2025-01';
```

### 流程3：临时停车（完整流程）

参见前文 **parking_temp_records 表** 的业务场景示例。

---

## 统计查询场景

### 场景1：小区停车收益总览（本月）

```sql
SELECT
  '车位管理费' as revenue_type,
  COUNT(*) as payment_count,
  SUM(amount) as total_amount
FROM payments
WHERE community_id = 'xxx'
  AND type_code = 'parking_management'
  AND paid_at >= DATE_TRUNC('month', NOW())
  AND paid_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'

UNION ALL

SELECT
  '车位租金',
  COUNT(*),
  SUM(amount)
FROM payments
WHERE community_id = 'xxx'
  AND type_code = 'parking_rent'
  AND paid_at >= DATE_TRUNC('month', NOW())
  AND paid_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month'

UNION ALL

SELECT
  '临时停车费',
  COUNT(*),
  SUM(amount)
FROM payments
WHERE community_id = 'xxx'
  AND type_code = 'parking_temp'
  AND paid_at >= DATE_TRUNC('month', NOW())
  AND paid_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month';

-- 结果示例：
-- 车位管理费  | 300 | 60000.00
-- 车位租金    | 100 | 50000.00
-- 临时停车费  | 850 | 25000.00
-- 合计：      1250 | 135000.00
```

### 场景2：车位利用率分析

```sql
SELECT
  COUNT(*) FILTER (WHERE is_sold = true) as sold_count,
  COUNT(*) FILTER (WHERE is_rented = true) as rented_count,
  COUNT(*) FILTER (WHERE ownership = 'public' AND is_rented = false) as vacant_count,
  COUNT(*) as total_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_sold = true OR is_rented = true) / COUNT(*), 2) as utilization_rate
FROM parking_spots
WHERE community_id = 'xxx'
  AND type = 'fixed'
  AND status = 'active'
  AND date_deleted IS NULL;

-- 结果示例：
-- sold_count: 800, rented_count: 150, vacant_count: 50, total_count: 1000
-- utilization_rate: 95.00%
```

### 场景3：临停收益趋势（按小时统计）

```sql
SELECT
  EXTRACT(HOUR FROM entry_time) as hour,
  COUNT(*) as count,
  SUM(actual_amount) as total_amount,
  AVG(duration_minutes) as avg_duration
FROM parking_temp_records
WHERE community_id = 'xxx'
  AND is_paid = true
  AND entry_time >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM entry_time)
ORDER BY hour;

-- 分析高峰时段，优化收费策略
```

---

## 数据迁移和维护

### 定期清理临停记录（保留近3个月）

```sql
-- 软删除3个月前的已缴费临停记录
DELETE FROM parking_temp_records
WHERE is_paid = true
  AND exit_time < NOW() - INTERVAL '3 months';
```

### 批量生成账单（每月1号执行）

```sql
-- 为所有已售车位生成当月管理费账单
INSERT INTO parking_details (id, parking_spot_id, fee_type)
SELECT gen_uuid(), id, 'management'
FROM parking_spots
WHERE is_sold = true AND status = 'active';

INSERT INTO receivables (community_id, type_code, type_detail_id, owner_id, period, amount, due_date)
SELECT
  ps.community_id,
  'parking_management',
  pd.id,
  ps.owner_id,
  TO_CHAR(NOW(), 'YYYY-MM'),
  ps.monthly_management_fee,
  DATE_TRUNC('month', NOW()) + INTERVAL '4 days'  -- 当月5号
FROM parking_spots ps
JOIN parking_details pd ON pd.parking_spot_id = ps.id
WHERE ps.is_sold = true AND ps.status = 'active' AND pd.fee_type = 'management';

-- 类似地生成租金账单...
```

---

## 总结

### 表关系总览
```
parking_spots (1) ←→ (N) parking_details ←→ (1) receivables ←→ (1) payments
                                                                     ↑
parking_temp_records ──────────────────────────────────────────────┘
                    (payment_id)
```

### 设计要点
1. ✅ **分离主数据和交易数据**：parking_spots 是档案，receivables/payments 是交易
2. ✅ **临停费独立处理**：不走应收流程，直接实收
3. ✅ **支持批量缴费**：paid_periods 数组支持一次缴多个月
4. ✅ **灵活查询**：可以从车位、业主、时间等多维度查询
5. ✅ **扩展性好**：新增停车相关业务不影响核心表结构

### 下一步
- [ ] 编写广告收益表结构文档
- [ ] 创建Directus表结构脚本
- [ ] 生成测试数据
