# 停车费收益功能文档

## 功能概述

停车费收益功能用于管理小区停车相关的所有收入，包括：
- **管理费**：业主购买车位的月度管理费（¥200/月）
- **租金**：公共车位的租赁收入（¥500/月）
- **临停费**：临时停车收入（¥5/小时）

---

## 数据模型

### 1. 停车位表 (`parking_spots`)

存储所有停车位的档案信息。

**字段说明**：

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | UUID | 主键 |
| `community_id` | UUID | 所属小区 |
| `spot_number` | String | 车位号（如：A-001，B-005，C-003） |
| `location` | String | 位置描述（如：地下1层A区） |
| `type` | String | 车位类型：`fixed`（有产权）/ `public`（无产权） |
| `ownership` | String | 产权类型：`owned`（业主购买）/ `public`（公共车位） |
| `is_sold` | Boolean | 是否已售出 |
| `is_rented` | Boolean | 是否已租出 |
| `owner_id` | UUID | 业主ID（购买车位的业主） |
| `renter_id` | UUID | 租户ID（租赁车位的用户） |
| `license_plate` | String | 车牌号 |
| `monthly_management_fee` | Decimal | 月管理费 |
| `monthly_rent` | Decimal | 月租金 |
| `rent_contract_start` | Date | 租赁合同起始日期 |
| `rent_contract_end` | Date | 租赁合同结束日期 |
| `status` | String | 状态 |

**车位类型说明**：

```
A区：业主购买车位
- type: 'fixed'
- ownership: 'owned'
- is_sold: true
- 收取管理费 ¥200/月

B区：有产权但未售出
- type: 'fixed'
- ownership: 'public'
- is_sold: false
- 可出租，收取租金 ¥500/月

C区：无产权公共车位
- type: 'public'
- ownership: 'public'
- 只能出租，收取租金 ¥500/月
```

### 2. 停车详情表 (`parking_details`)

记录停车费的具体信息（管理费或租金）。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | UUID | 主键 |
| `parking_spot_id` | UUID | 关联车位 |
| `fee_type` | String | 费用类型：`management`（管理费）/ `rent`（租金） |
| `contract_no` | String | 合同编号（租金才有） |
| `start_date` | Date | 开始日期 |
| `end_date` | Date | 结束日期 |
| `payment_id` | UUID | 关联缴费记录 |

**注意**：每个车位只有**1条** parking_details 记录，通过 `fee_type` 区分管理费和租金。

### 3. 临停记录表 (`parking_temp_records`)

记录临时停车的收费信息。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | UUID | 主键 |
| `community_id` | UUID | 所属小区 |
| `license_plate` | String | 车牌号 |
| `entry_time` | Timestamp | 入场时间 |
| `exit_time` | Timestamp | 出场时间 |
| `duration_minutes` | Integer | 停车时长（分钟） |
| `parking_spot_number` | String | 车位号 |
| `calculated_amount` | Decimal | 计算金额 |
| `actual_amount` | Decimal | 实收金额 |
| `payment_method` | String | 支付方式 |
| `is_paid` | Boolean | 是否已支付 |
| `gate_system_id` | String | 闸机编号 |
| `payment_id` | UUID | 关联缴费记录 |
| `proof_files` | JSON | 支付凭证 |
| `notes` | String | 备注 |

**计费规则**：
```javascript
const hours = Math.ceil(duration_minutes / 60);  // 向上取整
const amount = hours * 5;  // ¥5/小时
```

### 4. 应收账款表 (`receivables`)

记录每月的应收账单。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | UUID | 主键 |
| `community_id` | UUID | 所属小区 |
| `type_code` | String | 类型：`parking_management` / `parking_rent` |
| `type_detail_id` | UUID | 关联 parking_details.id |
| `owner_id` | UUID | 业主/租户ID |
| `period` | String | 账期（如：2025-01） |
| `amount` | Decimal | 金额 |
| `due_date` | Timestamp | 到期日（每月5号） |
| `status` | String | 状态：`paid` / `unpaid` |
| `payment_id` | UUID | 关联缴费记录 |

### 5. 缴费记录表 (`payments`)

记录实际缴费信息。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | UUID | 主键 |
| `community_id` | UUID | 所属小区 |
| `type_code` | String | 类型：`parking_management` / `parking_rent` / `parking_temp` |
| `owner_id` | UUID | 缴费人ID |
| `amount` | Decimal | 缴费金额 |
| `paid_at` | Timestamp | 缴费时间 |
| `paid_periods` | Array | 缴费月份（如：["2025-01", "2025-02"]） |
| `payment_method` | String | 支付方式 |
| `transaction_no` | String | 交易单号 |

---

## 数据流程

### 管理费流程

```
1. parking_spots (type='fixed', ownership='owned', is_sold=true)
   ↓
2. parking_details (fee_type='management')
   ↓
3. receivables (type_code='parking_management', 每月生成)
   ↓
4. payments (type_code='parking_management', 业主缴费)
```

### 租金流程

```
1. parking_spots (is_rented=true)
   ↓
2. parking_details (fee_type='rent')
   ↓
3. receivables (type_code='parking_rent', 每月生成)
   ↓
4. payments (type_code='parking_rent', 租户缴费)
```

### 临停费流程

```
1. parking_temp_records (临停记录)
   ↓
2. payments (type_code='parking_temp', 出场时缴费)
```

---

## 页面结构

### 1. 停车费收益总览 (`parking-revenue-overview.vue`)

**功能**：
- 显示停车费总收益
- 显示管理费、租金、临停费分项统计
- 提供导航到各详情页

**数据统计**：
```javascript
// 从 payments 表统计
const managementRevenue = SUM(amount WHERE type_code='parking_management')
const rentRevenue = SUM(amount WHERE type_code='parking_rent')
const tempRevenue = SUM(amount WHERE type_code='parking_temp')
const totalRevenue = managementRevenue + rentRevenue + tempRevenue
```

### 2. 停车管理费详情 (`parking-management-detail.vue`)

**三个区域**：
1. **筛选区域**：月份范围选择
2. **收支汇总**：应收总额、实收总额、车位统计
3. **车位列表**：显示所有管理费车位及欠费状态

**点击车位** → 跳转到 `parking-spot-billing-detail.vue`

### 3. 车位缴费详情 (`parking-spot-billing-detail.vue`)

**内容**：
- 车位信息（车位号、业主、位置）
- 缴费进度（月管理费、总应缴、已缴、欠费）
- 12个月缴费状态可视化
- 缴费记录列表

**点击缴费记录** → 跳转到 `payment-detail.vue`

### 4. 停车租金详情 (`parking-rent-list.vue`)

**三个区域**：
1. **筛选区域**：月份范围选择
2. **收支汇总**：应收总额、实收总额、车位统计
3. **车位列表**：显示所有租赁车位及欠费状态

**点击车位** → 跳转到 `parking-rent-spot-detail.vue`

### 5. 租金车位详情 (`parking-rent-spot-detail.vue`)

**内容**：
- 车位和租户信息
- 租赁合同期
- 缴费进度（月租金、总应缴、已缴、欠费）
- 12个月缴费状态可视化
- 缴费记录列表

### 6. 临停收益 (`parking-temp-list.vue`)

**三个区域**：
1. **筛选区域**：月份范围选择
2. **总收益**：临停总收益统计
3. **记录列表**：显示所有临停记录（车牌、时长、收益）

**点击记录** → 跳转到 `parking-temp-detail.vue`

### 7. 临停详情 (`parking-temp-detail.vue`)

**内容**：
- 车牌信息
- 停车详情（入场/出场时间、停车时长、车位号）
- 费用详情（计费时长、单价、实收金额）
- 支付信息（支付方式、交易单号、闸机编号）
- 支付凭证图片

---

## 部署指南

### 本地部署

```bash
# 1. 创建表结构
cd scripts
bash create-revenue-core-tables.sh
bash create-parking-tables.sh
bash create-ad-revenue-tables.sh

# 2. 生成并导入测试数据
cd test-data
./quick-import-parking.sh local
```

### 远程部署

```bash
# 1. 设置远程环境变量
export REMOTE_DIRECTUS_TOKEN="your_admin_token_here"

# 2. 一键部署（包括创建表+导入数据）
bash scripts/deploy-parking-to-remote.sh

# 或者分步执行：

# 2a. 创建表结构
DIRECTUS_URL=https://www.betterhome.ink \
DIRECTUS_TOKEN=$REMOTE_DIRECTUS_TOKEN \
bash scripts/create-parking-tables.sh

# 2b. 导入数据
cd scripts/test-data
./quick-import-parking.sh remote
```

---

## 测试数据

运行 `generate-parking-data.js` 会生成以下数据：

### 配置
```javascript
const CONFIG = {
  total_spots: 60,           // 总车位数
  owner_parking_allocation: [...],  // 业主车位分配
  unsold_fixed_spots: 5,     // 有产权未售
  public_spots: 5,           // 无产权公共
  rented_ratio: 0.5,         // 50%租赁率
  management_fee: 200,       // 月管理费
  monthly_rent: 500,         // 月租金
  temp_parking_rate: 5,      // 临停5元/小时
  year: 2025,
  months: [1,2,3,4,5,6,7,8,9,10,11,12],
  payment_ratio: 0.7,        // 70%缴费率
  temp_records_per_day: 3,   // 每天3条临停
};
```

### 生成结果示例
```
停车位总数: 60
  - 已售车位: 50个（管理费）
  - 已租车位: 4个（租金）
  - 空置车位: 6个

应收账单: 532条
  - 管理费: 500条
  - 租金: 32条
  - 已缴: 372条 (69.9%)
  - 欠费: 160条 (30.1%)

缴费记录: 123条
  - 管理费: 26条，¥151,300
  - 租金: 5条，¥11,000
  - 临停: 206条，¥3,850

停车费总收益: ¥166,150
```

---

## 常见问题

### Q1: 为什么租金显示为¥0？

**原因**：数据生成脚本的bug，缴费记录只按 `owner_id` 分组，导致管理费和租金混在一起。

**解决**：已修复，现在按 `owner_id + type_code` 组合分组。

### Q2: 如何区分有产权和无产权车位？

使用 `type` 字段：
- `type='fixed'`：有产权的固定车位
- `type='public'`：无产权的公共车位

临停不在 `parking_spots` 表，而是在 `parking_temp_records` 表。

### Q3: 如何获取用户信息？

`directus_users` 是核心集合，不能使用 `readItems()`，需要使用 REST API：

```javascript
const token = uni.getStorageSync("directus_token");
const response = await fetch(`${env.directus_url}/users/${userId}?fields=id,first_name,last_name`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const user = await response.json();
```

### Q4: 一个车位可以既收管理费又收租金吗？

不可以。每个车位只有一种费用类型：
- **已售车位**（ownership='owned'）：只收管理费
- **公共车位已租**（ownership='public' + is_rented=true）：只收租金
- **公共车位空置**：不收费

---

## 更新日志

### 2025-10-21
- ✅ 实现租金详情功能（列表+详情页）
- ✅ 实现临停收益功能（列表+详情页）
- ✅ 修复租金缴费生成逻辑
- ✅ 修复 directus_users 访问问题
- ✅ 更新 type 字段选项为 fixed/public
- ✅ 创建远程部署脚本

### 2025-10-20
- ✅ 实现管理费详情功能
- ✅ 创建停车位表结构
- ✅ 创建数据生成脚本

---

## 相关文档

- [财务透明功能v2.0总体文档](./finance-transparency-v2.md)
- [物业费管理文档](./USER_BILLING.md)
- [临停收益详细说明](./PARKING_TEMP.md)
- [租金收益详细说明](./PARKING_RENT.md)
