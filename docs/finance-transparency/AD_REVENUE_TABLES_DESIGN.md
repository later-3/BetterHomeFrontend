# 广告收益管理 - 表结构设计文档

## 概述

广告收益是混合方案中的第二个收益类型，包含两种广告位：
- **电梯广告**：小区电梯内的广告位
- **闸机广告**：出入口闸机的广告屏幕

## 表结构总览

```
广告收益相关表（4张）：

1. ad_spots          - 广告位主数据表（所有广告位的档案）
2. ad_contracts      - 广告合同表（每次签约的合同记录）
3. ad_details        - 广告收益详情表（关联receivables和合同）
4. receivables       - 应收核心表（广告租金的按月账单）
5. payments          - 实收核心表（广告费的缴费记录）
```

**关联关系**：
```
ad_spots (广告位档案)
    ↓ 签约
ad_contracts (合同记录)
    ↓ 生成账单
ad_details (费用详情)
    ↓
receivables (应收账单 - 按月)
    ↓ 缴费后
payments (实收记录)
```

---

## 1. ad_spots（广告位主数据表）

### 表说明
存储小区所有广告位的基本档案信息，包括位置、规格、状态等。

### 字段定义

| 字段名 | 类型 | 约束 | 说明 | 示例值 |
|--------|------|------|------|--------|
| **id** | uuid | PRIMARY KEY | 主键 | |
| **community_id** | uuid | FOREIGN KEY, NOT NULL | 所属小区 | |
| **spot_code** | varchar(50) | NOT NULL | 广告位编号 | 'AD-1-1-ELEVATOR', 'AD-GATE-01' |
| **spot_type** | varchar(20) | NOT NULL | 广告位类型 | 'elevator', 'gate' |
| **location** | varchar(100) | NOT NULL | 位置描述 | '1号楼1单元电梯', '南门闸机' |
| **floor** | varchar(20) | NULLABLE | 楼层（仅电梯广告） | '1-18层' |
| **size_spec** | varchar(50) | NULLABLE | 尺寸规格 | '60cm×90cm', '32寸液晶屏' |
| **base_price_monthly** | decimal(10,2) | NOT NULL | 月租金参考价 | 1000.00 |
| **status** | varchar(20) | NOT NULL, DEFAULT 'available' | 广告位状态 | 'available', 'rented', 'maintenance' |
| **current_contract_id** | uuid | FOREIGN KEY, NULLABLE | 当前合同ID | ad_contracts.id |
| **notes** | text | NULLABLE | 备注信息 | |
| **user_created** | uuid | FOREIGN KEY | 创建人 | |
| **date_created** | timestamp | NOT NULL, DEFAULT NOW() | 创建时间 | |
| **user_updated** | uuid | FOREIGN KEY | 更新人 | |
| **date_updated** | timestamp | AUTO UPDATE | 更新时间 | |
| **date_deleted** | timestamp | NULLABLE | 软删除时间 | |

### 字段说明

#### spot_type（广告位类型）
- `elevator`: 电梯广告（纸质海报或灯箱）
- `gate`: 闸机广告（电子屏幕）

#### status（广告位状态）
- `available`: 空闲可出租
- `rented`: 已出租
- `maintenance`: 维护中不可用

#### 文件字段说明
广告位本身不存储文件，文件存储在 `ad_contracts` 表（合同文件）和 `payments` 表（支付凭证）。

### 约束和索引

#### 唯一约束
```sql
CONSTRAINT unique_ad_spot_code
UNIQUE (community_id, spot_code)
WHERE date_deleted IS NULL
```

#### 索引
```sql
CREATE INDEX idx_ad_spots_community ON ad_spots(community_id);
CREATE INDEX idx_ad_spots_type ON ad_spots(spot_type);
CREATE INDEX idx_ad_spots_status ON ad_spots(community_id, status);
CREATE INDEX idx_ad_spots_contract ON ad_spots(current_contract_id) WHERE current_contract_id IS NOT NULL;
```

### 业务场景示例

#### 场景1：创建广告位
```sql
INSERT INTO ad_spots (
  id, community_id, spot_code, spot_type, location,
  size_spec, base_price_monthly, status
) VALUES (
  gen_uuid(), 'community-uuid', 'AD-1-1-ELEVATOR', 'elevator',
  '1号楼1单元电梯', '60cm×90cm', 1000.00, 'available'
);
```

#### 场景2：查询空闲广告位
```sql
SELECT
  spot_code,
  spot_type,
  location,
  size_spec,
  base_price_monthly
FROM ad_spots
WHERE community_id = 'xxx'
  AND status = 'available'
  AND date_deleted IS NULL
ORDER BY spot_type, spot_code;
```

---

## 2. ad_contracts（广告合同表）

### 表说明
存储每次广告位出租的合同信息，包括广告主、合同期限、租金等。

### 字段定义

| 字段名 | 类型 | 约束 | 说明 | 示例值 |
|--------|------|------|------|--------|
| **id** | uuid | PRIMARY KEY | 主键 | |
| **community_id** | uuid | FOREIGN KEY, NOT NULL | 所属小区 | |
| **spot_id** | uuid | FOREIGN KEY, NOT NULL | 关联广告位 | ad_spots.id |
| **contract_no** | varchar(50) | NULLABLE | 合同编号 | 'AD-2025-001' |
| **advertiser_name** | varchar(100) | NOT NULL | 广告主姓名/联系人 | '张三' |
| **advertiser_company** | varchar(200) | NULLABLE | 广告公司名称 | '某某广告公司' |
| **advertiser_phone** | varchar(20) | NOT NULL | 广告主电话 | '13800138000' |
| **advertiser_email** | varchar(100) | NULLABLE | 广告主邮箱 | 'zhangsan@ad.com' |
| **contract_start** | date | NOT NULL | 合同开始日期 | '2025-01-01' |
| **contract_end** | date | NOT NULL | 合同结束日期 | '2025-12-31' |
| **monthly_rent** | decimal(10,2) | NOT NULL | 月租金 | 1000.00 |
| **total_amount** | decimal(10,2) | NOT NULL | 合同总金额 | 12000.00 |
| **deposit** | decimal(10,2) | DEFAULT 0 | 押金 | 2000.00 |
| **deposit_status** | varchar(20) | DEFAULT 'none' | 押金状态 | 'none', 'paid', 'refunded' |
| **status** | varchar(20) | NOT NULL, DEFAULT 'active' | 合同状态 | 'active', 'completed', 'terminated' |
| **contract_files** | json | NULLABLE | 合同文件（Directus files） | ["uuid-1", "uuid-2"] |
| **notes** | text | NULLABLE | 备注 | |
| **user_created** | uuid | FOREIGN KEY | 创建人 | |
| **date_created** | timestamp | NOT NULL, DEFAULT NOW() | 创建时间 | |
| **user_updated** | uuid | FOREIGN KEY | 更新人 | |
| **date_updated** | timestamp | AUTO UPDATE | 更新时间 | |
| **date_deleted** | timestamp | NULLABLE | 软删除时间 | |

### 字段说明

#### status（合同状态）
- `active`: 合同有效期内
- `completed`: 合同正常到期结束
- `terminated`: 合同提前终止

#### deposit_status（押金状态）
- `none`: 无押金
- `paid`: 押金已缴纳
- `refunded`: 押金已退还

#### 文件字段说明
- `contract_files`: 存储合同文件（Directus files UUID数组）
  - 签约时上传合同PDF或照片
  - 可以是扫描件或电子合同
  - 支持多个文件（正本、附件等）

### 约束和索引

#### 唯一约束
```sql
CONSTRAINT unique_contract_no
UNIQUE (community_id, contract_no)
WHERE contract_no IS NOT NULL AND date_deleted IS NULL
```

#### 检查约束
```sql
CONSTRAINT check_contract_dates
CHECK (contract_end > contract_start)

CONSTRAINT check_total_amount
CHECK (total_amount = monthly_rent * EXTRACT(MONTH FROM AGE(contract_end, contract_start)) + monthly_rent)
```

#### 索引
```sql
CREATE INDEX idx_ad_contracts_community ON ad_contracts(community_id);
CREATE INDEX idx_ad_contracts_spot ON ad_contracts(spot_id);
CREATE INDEX idx_ad_contracts_status ON ad_contracts(status);
CREATE INDEX idx_ad_contracts_dates ON ad_contracts(contract_start, contract_end);
CREATE INDEX idx_ad_contracts_advertiser ON ad_contracts(advertiser_phone);
```

### 业务场景示例

#### 场景1：创建合同
```sql
INSERT INTO ad_contracts (
  id, community_id, spot_id, contract_no,
  advertiser_name, advertiser_company, advertiser_phone,
  contract_start, contract_end, monthly_rent, total_amount,
  deposit, deposit_status, status, contract_files
) VALUES (
  gen_uuid(), 'community-uuid', 'spot-uuid', 'AD-2025-001',
  '张三', '某某广告公司', '13800138000',
  '2025-01-01', '2025-12-31', 1000.00, 12000.00,
  2000.00, 'paid', 'active', '["file-uuid-1", "file-uuid-2"]'::json
);

-- 同时更新广告位状态
UPDATE ad_spots
SET status = 'rented', current_contract_id = 'contract-uuid'
WHERE id = 'spot-uuid';
```

#### 场景2：查询即将到期的合同
```sql
SELECT
  c.contract_no,
  c.advertiser_name,
  c.advertiser_phone,
  s.location,
  c.contract_end,
  DATE_PART('day', c.contract_end - CURRENT_DATE) as days_remaining
FROM ad_contracts c
JOIN ad_spots s ON c.spot_id = s.id
WHERE c.community_id = 'xxx'
  AND c.status = 'active'
  AND c.contract_end BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY c.contract_end;
```

---

## 3. ad_details（广告收益详情表）

### 表说明
连接应收账单（receivables）和广告合同（ad_contracts），存储每笔广告租金的关联信息。

### 字段定义

| 字段名 | 类型 | 约束 | 说明 | 示例值 |
|--------|------|------|------|--------|
| **id** | uuid | PRIMARY KEY | 主键（同时是receivables.type_detail_id） | |
| **spot_id** | uuid | FOREIGN KEY, NOT NULL | 关联广告位 | ad_spots.id |
| **contract_id** | uuid | FOREIGN KEY, NOT NULL | 关联合同 | ad_contracts.id |
| **receivable_id** | uuid | FOREIGN KEY, NULLABLE | 关联应收账单 | receivables.id |
| **payment_id** | uuid | FOREIGN KEY, NULLABLE | 关联缴费记录 | payments.id |

### 关联关系
```sql
-- receivables 通过 type_detail_id 关联
receivables.type_detail_id = ad_details.id

-- ad_details 关联广告位和合同
ad_details.spot_id = ad_spots.id
ad_details.contract_id = ad_contracts.id

-- 缴费后更新
ad_details.payment_id = payments.id
```

### 索引
```sql
CREATE INDEX idx_ad_details_spot ON ad_details(spot_id);
CREATE INDEX idx_ad_details_contract ON ad_details(contract_id);
CREATE INDEX idx_ad_details_receivable ON ad_details(receivable_id);
CREATE INDEX idx_ad_details_payment ON ad_details(payment_id) WHERE payment_id IS NOT NULL;
```

---

## 4. receivables（应收核心表 - 广告收益部分）

### 表说明
混合方案的核心表，存储所有非物业费的应收账单。广告收益使用 type_code: `ad_revenue`。

### 广告收益相关字段

| 字段名 | 类型 | 约束 | 说明 | 广告收益示例 |
|--------|------|------|------|-------------|
| **id** | uuid | PRIMARY KEY | 主键 | |
| **community_id** | uuid | FOREIGN KEY, NOT NULL | 所属小区 | |
| **type_code** | varchar(50) | NOT NULL | 收益类型 | 'ad_revenue' |
| **type_detail_id** | uuid | NULLABLE | 详情ID | ad_details.id |
| **owner_id** | uuid | FOREIGN KEY, NULLABLE | 关联用户 | null（广告主不是系统用户） |
| **period** | varchar(7) | NOT NULL | 账期 YYYY-MM | '2025-01' |
| **amount** | decimal(10,2) | NOT NULL | 应收金额 | 1000.00 |
| **is_paid** | boolean | NOT NULL, DEFAULT false | 是否已缴费 | false |
| **paid_at** | timestamp | NULLABLE | 缴费时间 | |
| **payment_id** | uuid | FOREIGN KEY, NULLABLE | 关联payment | |
| **due_date** | timestamp | NULLABLE | 应缴日期 | '2025-01-31' |
| **late_fee** | decimal(10,2) | DEFAULT 0 | 滞纳金 | 0 |
| **status** | varchar(20) | DEFAULT 'unpaid' | 状态 | 'unpaid', 'paid', 'cancelled' |
| **notes** | text | NULLABLE | 备注 | |

### 查询示例

#### 查询某个广告位的应收账单
```sql
SELECT
  r.period,
  r.amount,
  r.is_paid,
  r.paid_at,
  r.due_date,
  c.advertiser_name,
  s.location
FROM receivables r
JOIN ad_details ad ON r.type_detail_id = ad.id
JOIN ad_contracts c ON ad.contract_id = c.id
JOIN ad_spots s ON ad.spot_id = s.id
WHERE s.id = 'spot-uuid'
  AND r.type_code = 'ad_revenue'
ORDER BY r.period;
```

#### 查询欠费的广告合同
```sql
SELECT
  c.contract_no,
  c.advertiser_name,
  c.advertiser_phone,
  s.location,
  COUNT(r.id) as unpaid_months,
  SUM(r.amount) as total_unpaid
FROM ad_contracts c
JOIN ad_spots s ON c.spot_id = s.id
JOIN ad_details ad ON c.id = ad.contract_id
JOIN receivables r ON ad.receivable_id = r.id
WHERE c.community_id = 'xxx'
  AND c.status = 'active'
  AND r.status = 'unpaid'
  AND r.due_date < NOW()
GROUP BY c.id, c.contract_no, c.advertiser_name, c.advertiser_phone, s.location
HAVING COUNT(r.id) > 0
ORDER BY total_unpaid DESC;
```

---

## 5. payments（实收核心表 - 广告收益部分）

### 表说明
混合方案的核心表，存储所有非物业费的实际缴费记录。广告收益使用 type_code: `ad_revenue`。

### 广告收益相关字段

| 字段名 | 类型 | 约束 | 说明 | 广告收益示例 |
|--------|------|------|------|-------------|
| **id** | uuid | PRIMARY KEY | 主键 | |
| **community_id** | uuid | FOREIGN KEY, NOT NULL | 所属小区 | |
| **type_code** | varchar(50) | NOT NULL | 收益类型 | 'ad_revenue' |
| **owner_id** | uuid | FOREIGN KEY, NULLABLE | 关联用户 | null |
| **amount** | decimal(10,2) | NOT NULL | 实缴金额 | 12000.00 |
| **paid_at** | timestamp | NOT NULL | 缴费时间 | '2025-01-15 14:30:00' |
| **paid_periods** | json | NULLABLE | 缴费账期数组 | ["2025-01", ..., "2025-12"] |
| **payment_method** | varchar(50) | NULLABLE | 支付方式 | 'bank_transfer', 'wechat', 'alipay', 'cash' |
| **payer_name** | varchar(100) | NULLABLE | 缴费人姓名 | '张三' |
| **payer_phone** | varchar(20) | NULLABLE | 缴费人电话 | '13800138000' |
| **transaction_no** | varchar(100) | NULLABLE | 交易单号 | 'TX202501151430ABC' |
| **proof_files** | json | NULLABLE | 缴费凭证文件 | ["file-uuid-1"] |
| **notes** | text | NULLABLE | 备注 | |

### 说明
- `paid_periods`: 数组，表示一次缴纳多个月（如签约时缴全年）
- `owner_id`: 广告主不是系统用户，通常为 null
- `payer_name` / `payer_phone`: 记录广告主信息
- `proof_files`: 支付凭证（银行转账记录、支付截图等）

### 查询示例

#### 查询2025年1月广告收益
```sql
SELECT
  COUNT(*) as payment_count,
  SUM(amount) as total_amount
FROM payments
WHERE community_id = 'xxx'
  AND type_code = 'ad_revenue'
  AND paid_at >= '2025-01-01'
  AND paid_at < '2025-02-01';
```

#### 查询某个合同的缴费历史
```sql
SELECT
  p.amount,
  p.paid_at,
  p.paid_periods,
  p.payment_method,
  p.payer_name,
  p.proof_files
FROM payments p
JOIN ad_details ad ON p.id = ad.payment_id
WHERE ad.contract_id = 'contract-uuid'
ORDER BY p.paid_at DESC;
```

---

## 完整业务场景验证

### 场景1: 新增广告位并签约出租

#### 业务流程
1. 物业录入新广告位：1号楼1单元电梯广告位
2. 广告公司A签约：2025年1月-12月，月租金1000元
3. 生成12个月的应收记录

#### 数据流转

```sql
-- 步骤1: 创建广告位
INSERT INTO ad_spots (
  id, community_id, spot_code, spot_type, location,
  size_spec, base_price_monthly, status
) VALUES (
  'spot-uuid-1', 'community-1', 'AD-1-1-ELEVATOR', 'elevator',
  '1号楼1单元电梯', '60cm×90cm', 1000.00, 'available'
);

-- 步骤2: 创建合同
INSERT INTO ad_contracts (
  id, community_id, spot_id, contract_no,
  advertiser_name, advertiser_company, advertiser_phone,
  contract_start, contract_end, monthly_rent, total_amount,
  deposit, deposit_status, status, contract_files
) VALUES (
  'contract-uuid-1', 'community-1', 'spot-uuid-1', 'AD-2025-001',
  '张三', '某某广告公司', '13800138000',
  '2025-01-01', '2025-12-31', 1000.00, 12000.00,
  2000.00, 'paid', 'active',
  '["file-uuid-contract-1", "file-uuid-contract-2"]'::json
);

-- 更新广告位状态
UPDATE ad_spots
SET status = 'rented', current_contract_id = 'contract-uuid-1'
WHERE id = 'spot-uuid-1';

-- 步骤3: 生成12个月的应收记录
-- 1月份
INSERT INTO ad_details (id, spot_id, contract_id)
VALUES ('detail-uuid-1', 'spot-uuid-1', 'contract-uuid-1');

INSERT INTO receivables (
  id, community_id, type_code, type_detail_id,
  period, amount, due_date, status
) VALUES (
  'recv-uuid-1', 'community-1', 'ad_revenue', 'detail-uuid-1',
  '2025-01', 1000.00, '2025-01-31T23:59:59.000Z', 'unpaid'
);

UPDATE ad_details
SET receivable_id = 'recv-uuid-1'
WHERE id = 'detail-uuid-1';

-- ... 类似生成 2-12月 的应收记录（每月一条）
```

**验证查询：查看合同和应收账单**
```sql
SELECT
  c.contract_no,
  c.advertiser_name,
  s.location,
  COUNT(r.id) as total_months,
  COUNT(r.id) FILTER (WHERE r.status = 'unpaid') as unpaid_months,
  SUM(r.amount) as total_amount
FROM ad_contracts c
JOIN ad_spots s ON c.spot_id = s.id
JOIN ad_details ad ON c.id = ad.contract_id
JOIN receivables r ON ad.receivable_id = r.id
WHERE c.id = 'contract-uuid-1'
GROUP BY c.id, c.contract_no, c.advertiser_name, s.location;

-- 预期结果：
-- contract_no | advertiser_name | location | total_months | unpaid_months | total_amount
-- AD-2025-001 | 张三 | 1号楼1单元电梯 | 12 | 12 | 12000.00
```

---

### 场景2: 广告主缴费（按月缴）

#### 业务流程
广告公司A 在1月15日缴纳1月份租金1000元

#### 数据流转

```sql
-- 步骤1: 创建实收记录
INSERT INTO payments (
  id, community_id, type_code, amount, paid_at,
  paid_periods, payment_method, payer_name, payer_phone,
  transaction_no, proof_files
) VALUES (
  'pay-uuid-1', 'community-1', 'ad_revenue', 1000.00,
  '2025-01-15T10:30:00.000Z',
  '["2025-01"]'::json, 'bank_transfer', '张三', '13800138000',
  'TX202501151030ABC', '["file-uuid-proof-1"]'::json
);

-- 步骤2: 更新应收状态
UPDATE receivables
SET status = 'paid', paid_at = '2025-01-15T10:30:00.000Z', payment_id = 'pay-uuid-1'
WHERE id = 'recv-uuid-1';

-- 步骤3: 在 ad_details 中关联 payment
UPDATE ad_details
SET payment_id = 'pay-uuid-1'
WHERE receivable_id = 'recv-uuid-1';
```

**验证查询：查看缴费状态**
```sql
SELECT
  r.period,
  r.amount,
  r.status,
  r.paid_at,
  p.payment_method,
  p.transaction_no
FROM receivables r
LEFT JOIN payments p ON r.payment_id = p.id
WHERE r.id = 'recv-uuid-1';

-- 预期结果：
-- period | amount | status | paid_at | payment_method | transaction_no
-- 2025-01 | 1000.00 | paid | 2025-01-15 10:30:00 | bank_transfer | TX202501151030ABC
```

---

### 场景3: 一次性缴纳全年费用

#### 业务流程
广告公司A 在1月一次性缴纳全年12000元

#### 数据流转

```sql
-- 步骤1: 创建一笔实收记录（金额12000）
INSERT INTO payments (
  id, community_id, type_code, amount, paid_at,
  paid_periods, payment_method, payer_name, payer_phone,
  transaction_no, proof_files, notes
) VALUES (
  'pay-uuid-full', 'community-1', 'ad_revenue', 12000.00,
  '2025-01-15T10:30:00.000Z',
  '["2025-01","2025-02","2025-03","2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12"]'::json,
  'bank_transfer', '张三', '13800138000',
  'TX202501151030XYZ', '["file-uuid-proof-full"]'::json,
  '合同AD-2025-001全年租金'
);

-- 步骤2: 批量更新所有应收记录
UPDATE receivables
SET status = 'paid', paid_at = '2025-01-15T10:30:00.000Z', payment_id = 'pay-uuid-full'
WHERE type_detail_id IN (
  SELECT id FROM ad_details WHERE contract_id = 'contract-uuid-1'
);

-- 步骤3: 批量更新 ad_details
UPDATE ad_details
SET payment_id = 'pay-uuid-full'
WHERE contract_id = 'contract-uuid-1';
```

**验证查询：确认全部缴清**
```sql
SELECT
  COUNT(*) as total_months,
  COUNT(*) FILTER (WHERE r.status = 'paid') as paid_months,
  SUM(r.amount) as total_amount
FROM receivables r
JOIN ad_details ad ON r.type_detail_id = ad.id
WHERE ad.contract_id = 'contract-uuid-1';

-- 预期结果：
-- total_months | paid_months | total_amount
-- 12 | 12 | 12000.00
```

---

### 场景4: 合同到期续约

#### 业务流程
2025年12月，广告公司A续约2026年，月租金提高到1200元

#### 数据流转

```sql
-- 步骤1: 旧合同标记结束
UPDATE ad_contracts
SET status = 'completed'
WHERE id = 'contract-uuid-1';

-- 步骤2: 创建新合同
INSERT INTO ad_contracts (
  id, community_id, spot_id, contract_no,
  advertiser_name, advertiser_company, advertiser_phone,
  contract_start, contract_end, monthly_rent, total_amount,
  deposit, deposit_status, status, contract_files
) VALUES (
  'contract-uuid-2', 'community-1', 'spot-uuid-1', 'AD-2026-001',
  '张三', '某某广告公司', '13800138000',
  '2026-01-01', '2026-12-31', 1200.00, 14400.00,
  2000.00, 'paid', 'active',
  '["file-uuid-contract-2026"]'::json
);

-- 更新广告位当前合同
UPDATE ad_spots
SET current_contract_id = 'contract-uuid-2'
WHERE id = 'spot-uuid-1';

-- 步骤3: 生成新的12个月应收（月租金1200）
-- ... 类似场景1
```

**验证查询：查看广告位的合同历史**
```sql
SELECT
  c.contract_no,
  c.contract_start,
  c.contract_end,
  c.monthly_rent,
  c.status,
  COUNT(r.id) FILTER (WHERE r.status = 'paid') as paid_months
FROM ad_contracts c
LEFT JOIN ad_details ad ON c.id = ad.contract_id
LEFT JOIN receivables r ON ad.receivable_id = r.id
WHERE c.spot_id = 'spot-uuid-1'
GROUP BY c.id, c.contract_no, c.contract_start, c.contract_end, c.monthly_rent, c.status
ORDER BY c.contract_start DESC;

-- 预期结果：
-- contract_no | contract_start | contract_end | monthly_rent | status | paid_months
-- AD-2026-001 | 2026-01-01 | 2026-12-31 | 1200.00 | active | 0
-- AD-2025-001 | 2025-01-01 | 2025-12-31 | 1000.00 | completed | 12
```

---

### 场景5: 统计查询

#### 5.1 查询某月广告总收益（应收）
```sql
SELECT
  SUM(amount) as total_receivable
FROM receivables
WHERE type_code = 'ad_revenue'
  AND period = '2025-01'
  AND community_id = 'community-1';

-- 预期结果（假设有10个广告位都已签约）：
-- total_receivable: 10000.00
```

#### 5.2 查询某月广告实收
```sql
SELECT
  SUM(amount) as total_paid
FROM payments
WHERE type_code = 'ad_revenue'
  AND community_id = 'community-1'
  AND paid_at >= '2025-01-01'
  AND paid_at < '2025-02-01';

-- 预期结果：
-- total_paid: 8000.00  (假设10个广告位中有8个已缴费)
```

#### 5.3 查询电梯广告收益
```sql
SELECT
  r.period,
  COUNT(DISTINCT ad.spot_id) as spot_count,
  SUM(r.amount) as total_revenue
FROM receivables r
JOIN ad_details ad ON r.type_detail_id = ad.id
JOIN ad_spots s ON ad.spot_id = s.id
WHERE s.spot_type = 'elevator'
  AND r.status = 'paid'
  AND r.period >= '2025-01'
  AND r.period <= '2025-12'
GROUP BY r.period
ORDER BY r.period;

-- 预期结果：
-- period | spot_count | total_revenue
-- 2025-01 | 8 | 8000.00
-- 2025-02 | 8 | 8000.00
-- ...
```

#### 5.4 查询某个广告位的收益历史
```sql
SELECT
  c.contract_no,
  c.advertiser_name,
  c.contract_start,
  c.contract_end,
  c.monthly_rent,
  COUNT(r.id) as total_months,
  COUNT(r.id) FILTER (WHERE r.status = 'paid') as paid_months,
  SUM(r.amount) FILTER (WHERE r.status = 'paid') as total_paid
FROM ad_contracts c
LEFT JOIN ad_details ad ON c.id = ad.contract_id
LEFT JOIN receivables r ON ad.receivable_id = r.id
WHERE c.spot_id = 'spot-uuid-1'
GROUP BY c.id, c.contract_no, c.advertiser_name, c.contract_start, c.contract_end, c.monthly_rent
ORDER BY c.contract_start DESC;

-- 预期结果：
-- contract_no | advertiser_name | contract_start | contract_end | monthly_rent | total_months | paid_months | total_paid
-- AD-2025-001 | 张三 | 2025-01-01 | 2025-12-31 | 1000.00 | 12 | 12 | 12000.00
```

#### 5.5 查询欠费合同
```sql
SELECT
  c.contract_no,
  c.advertiser_name,
  c.advertiser_phone,
  s.location,
  COUNT(r.id) as unpaid_months,
  SUM(r.amount) as unpaid_amount,
  MIN(r.due_date) as earliest_due_date
FROM ad_contracts c
JOIN ad_spots s ON c.spot_id = s.id
JOIN ad_details ad ON c.id = ad.contract_id
JOIN receivables r ON ad.receivable_id = r.id
WHERE c.status = 'active'
  AND r.status = 'unpaid'
  AND r.due_date < NOW()
GROUP BY c.id, c.contract_no, c.advertiser_name, c.advertiser_phone, s.location
HAVING COUNT(r.id) > 0
ORDER BY unpaid_amount DESC;

-- 预期结果（如果某合同欠费）：
-- contract_no | advertiser_name | advertiser_phone | location | unpaid_months | unpaid_amount | earliest_due_date
-- AD-2025-002 | 李四 | 13900139000 | 2号楼电梯 | 3 | 3000.00 | 2025-01-31
```

#### 5.6 广告位利用率分析
```sql
SELECT
  spot_type,
  COUNT(*) as total_spots,
  COUNT(*) FILTER (WHERE status = 'rented') as rented_spots,
  COUNT(*) FILTER (WHERE status = 'available') as available_spots,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'rented') / COUNT(*), 2) as utilization_rate
FROM ad_spots
WHERE community_id = 'community-1'
  AND date_deleted IS NULL
GROUP BY spot_type;

-- 预期结果：
-- spot_type | total_spots | rented_spots | available_spots | utilization_rate
-- elevator  | 50          | 45           | 5               | 90.00
-- gate      | 10          | 8            | 2               | 80.00
```

#### 5.7 按月统计广告收益趋势
```sql
SELECT
  r.period,
  COUNT(DISTINCT ad.contract_id) as active_contracts,
  SUM(r.amount) FILTER (WHERE r.status = 'paid') as actual_revenue,
  SUM(r.amount) as expected_revenue,
  ROUND(100.0 * SUM(r.amount) FILTER (WHERE r.status = 'paid') / SUM(r.amount), 2) as collection_rate
FROM receivables r
JOIN ad_details ad ON r.type_detail_id = ad.id
WHERE r.type_code = 'ad_revenue'
  AND r.period >= '2025-01'
  AND r.period <= '2025-12'
GROUP BY r.period
ORDER BY r.period;

-- 预期结果：
-- period  | active_contracts | actual_revenue | expected_revenue | collection_rate
-- 2025-01 | 50               | 48000.00       | 50000.00         | 96.00
-- 2025-02 | 50               | 49000.00       | 50000.00         | 98.00
-- ...
```

---

## 统计查询场景（汇总）

### 场景6: 小区广告收益总览（本月）

```sql
SELECT
  '广告收益' as revenue_type,
  COUNT(DISTINCT ad.contract_id) as contract_count,
  COUNT(*) as payment_count,
  SUM(amount) as total_amount
FROM payments p
JOIN ad_details ad ON p.id = ad.payment_id
WHERE p.community_id = 'community-1'
  AND p.type_code = 'ad_revenue'
  AND p.paid_at >= DATE_TRUNC('month', NOW())
  AND p.paid_at < DATE_TRUNC('month', NOW()) + INTERVAL '1 month';

-- 结果示例：
-- revenue_type | contract_count | payment_count | total_amount
-- 广告收益     | 50             | 50            | 50000.00
```

### 场景7: 电梯广告 vs 闸机广告收益对比（本年）

```sql
SELECT
  s.spot_type,
  COUNT(DISTINCT s.id) as spot_count,
  SUM(r.amount) FILTER (WHERE r.status = 'paid') as total_revenue
FROM ad_spots s
LEFT JOIN ad_details ad ON s.id = ad.spot_id
LEFT JOIN receivables r ON ad.receivable_id = r.id AND r.period LIKE '2025-%'
WHERE s.community_id = 'community-1'
  AND s.date_deleted IS NULL
GROUP BY s.spot_type
ORDER BY total_revenue DESC;

-- 结果示例：
-- spot_type | spot_count | total_revenue
-- elevator  | 50         | 540000.00
-- gate      | 10         | 120000.00
```

---

## 数据迁移和维护

### 批量生成账单（每月1号执行）

```sql
-- 为所有活动合同生成当月广告租金账单
INSERT INTO ad_details (id, spot_id, contract_id)
SELECT
  gen_uuid(),
  c.spot_id,
  c.id
FROM ad_contracts c
WHERE c.status = 'active'
  AND c.contract_start <= DATE_TRUNC('month', NOW())
  AND c.contract_end >= DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day';

INSERT INTO receivables (
  community_id, type_code, type_detail_id,
  period, amount, due_date, status
)
SELECT
  c.community_id,
  'ad_revenue',
  ad.id,
  TO_CHAR(NOW(), 'YYYY-MM'),
  c.monthly_rent,
  DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day',  -- 当月最后一天
  'unpaid'
FROM ad_contracts c
JOIN ad_details ad ON c.id = ad.contract_id
WHERE c.status = 'active'
  AND ad.receivable_id IS NULL;  -- 避免重复生成

-- 更新 ad_details 的 receivable_id
UPDATE ad_details ad
SET receivable_id = r.id
FROM receivables r
WHERE r.type_detail_id = ad.id
  AND ad.receivable_id IS NULL;
```

### 自动标记过期合同

```sql
-- 每天检查并标记已到期的合同
UPDATE ad_contracts
SET status = 'completed'
WHERE status = 'active'
  AND contract_end < CURRENT_DATE;

-- 同时更新广告位状态
UPDATE ad_spots
SET status = 'available', current_contract_id = NULL
WHERE current_contract_id IN (
  SELECT id FROM ad_contracts WHERE status = 'completed'
);
```

---

## 总结

### 表关系总览
```
ad_spots (1) ←→ (N) ad_contracts (1) ←→ (N) ad_details ←→ (1) receivables ←→ (1) payments
```

### 设计要点
1. ✅ **分离主数据和交易数据**：ad_spots 是广告位档案，ad_contracts 是合同记录，receivables/payments 是交易
2. ✅ **合同管理**：完整记录每次签约的历史，支持续约、换广告主
3. ✅ **按月计费**：即使一次性缴全年，也生成12条月度应收，便于统计分析
4. ✅ **文件管理**：合同文件存储在 ad_contracts，支付凭证存储在 payments
5. ✅ **灵活查询**：可以从广告位、合同、时间、类型等多维度查询
6. ✅ **扩展性好**：新增广告类型（如公告栏、墙体广告）不影响核心表结构

### 与停车费的一致性
- ✅ 都使用混合方案（核心表 + 详情表）
- ✅ 都按月生成应收账单
- ✅ 都支持批量缴费（paid_periods 数组）
- ✅ 都使用 receivables 和 payments 核心表
- ✅ 都支持文件附件管理

### 下一步
- [ ] 创建receivables和payments核心表结构文档
- [ ] 创建Directus表结构脚本
- [ ] 生成测试数据
