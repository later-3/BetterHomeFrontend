# 停车收益功能部署脚本

本目录包含停车收益功能的所有部署和数据管理脚本。

---

## 📁 文件结构

```
scripts/
├── create-revenue-core-tables.sh          # 创建收益核心表（revenues）
├── create-parking-tables.sh               # 创建停车相关表
├── create-ad-revenue-tables.sh            # 创建广告收益表
├── update-parking-type-field.sh           # 更新type字段选项（fixed/public）
├── deploy-parking-to-remote.sh            # 一键部署到远程环境
└── test-data/
    ├── generate-parking-data.js           # 生成测试数据
    ├── import-parking-data.js             # 导入测试数据
    └── quick-import-parking.sh            # 快速导入脚本（支持local/remote）
```

---

## 🚀 快速开始

### 本地环境部署

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

### 远程环境部署

```bash
# 方式1：一键部署（推荐）
export REMOTE_DIRECTUS_TOKEN="your_admin_token_here"
bash scripts/deploy-parking-to-remote.sh

# 方式2：分步执行
# Step 1: 创建表结构
DIRECTUS_URL=https://www.betterhome.ink \
DIRECTUS_TOKEN=$REMOTE_DIRECTUS_TOKEN \
bash scripts/create-parking-tables.sh

# Step 2: 导入测试数据
cd scripts/test-data
./quick-import-parking.sh remote
```

---

## 📋 脚本说明

### 1. create-parking-tables.sh

创建停车相关的3张表：
- `parking_spots` - 停车位主数据表
- `parking_details` - 停车费详情表
- `parking_temp_records` - 临停费记录表

**特别注意**：
- `type` 字段选项已更新为 `fixed`（有产权）/ `public`（无产权）
- 临停不在 `parking_spots` 表，而是在 `parking_temp_records` 表

**使用**：
```bash
# 本地环境（默认）
bash create-parking-tables.sh

# 远程环境
DIRECTUS_URL=https://www.betterhome.ink \
DIRECTUS_TOKEN=your_token \
bash create-parking-tables.sh
```

### 2. deploy-parking-to-remote.sh

一键部署停车功能到远程环境，包括：
1. 创建收益核心表
2. 创建停车相关表
3. 创建广告收益表
4. 生成并导入测试数据

**环境变量**：
- `REMOTE_DIRECTUS_TOKEN`：必需，远程Directus管理员token

**使用**：
```bash
export REMOTE_DIRECTUS_TOKEN="your_admin_token_here"
bash scripts/deploy-parking-to-remote.sh
```

### 3. quick-import-parking.sh

快速生成并导入停车测试数据。

**参数**：
- `local`：导入到本地环境（http://localhost:8055）
- `remote`：导入到远程环境（https://www.betterhome.ink）

**使用**：
```bash
cd scripts/test-data

# 导入到本地
./quick-import-parking.sh local

# 导入到远程（需要设置环境变量）
export REMOTE_DIRECTUS_TOKEN="your_token"
./quick-import-parking.sh remote
```

### 4. generate-parking-data.js

生成停车测试数据，支持配置：

```javascript
const CONFIG = {
  total_spots: 60,              // 总车位数
  owner_parking_allocation: [...],  // 业主车位分配
  unsold_fixed_spots: 5,        // 有产权未售
  public_spots: 5,              // 无产权公共
  rented_ratio: 0.5,            // 50%租赁率
  management_fee: 200,          // 月管理费
  monthly_rent: 500,            // 月租金
  temp_parking_rate: 5,         // 临停5元/小时
  payment_ratio: 0.7,           // 70%缴费率
  temp_records_per_day: 3,      // 每天3条临停
};
```

**生成数据**：
- 60个停车位（50个业主购买 + 5个有产权未售 + 5个无产权公共）
- 532条应收账单（管理费+租金）
- 123条缴费记录
- 103条临停记录

### 5. import-parking-data.js

将生成的数据导入到Directus。

**使用**：
```bash
# 本地环境
node import-parking-data.js local

# 远程环境
node import-parking-data.js remote
```

### 6. update-parking-type-field.sh

更新 `parking_spots.type` 字段的选项。

**更新内容**：
- 旧选项：`fixed`（固定车位）/ `temp`（临时车位）
- 新选项：`fixed`（有产权）/ `public`（无产权）

**原因**：临停不在 `parking_spots` 表，而是在 `parking_temp_records` 表，所以 `type` 字段只用于区分有无产权。

**使用**：
```bash
bash update-parking-type-field.sh
```

---

## 🗂️ 数据表说明

### parking_spots（停车位主数据表）

存储所有车位的档案信息。

**关键字段**：
- `type`：`fixed`（有产权）/ `public`（无产权）
- `ownership`：`owned`（业主购买）/ `public`（公共车位）
- `is_sold`：是否已售出
- `is_rented`：是否已租出
- `owner_id`：业主ID
- `renter_id`：租户ID
- `monthly_management_fee`：月管理费（¥200）
- `monthly_rent`：月租金（¥500）

**车位分配**：
- A区（50个）：业主购买车位（type='fixed', ownership='owned'）
- B区（5个）：有产权未售（type='fixed', ownership='public'）
- C区（5个）：无产权公共（type='public', ownership='public'）

### parking_details（停车费详情表）

记录停车费的具体信息。

**关键字段**：
- `parking_spot_id`：关联车位
- `fee_type`：`management`（管理费）/ `rent`（租金）
- `contract_no`：合同编号（租金才有）

**注意**：每个车位只有1条 parking_details 记录。

### parking_temp_records（临停费记录表）

记录临时停车的收费信息。

**关键字段**：
- `license_plate`：车牌号
- `entry_time`：入场时间
- `exit_time`：出场时间
- `duration_minutes`：停车时长（分钟）
- `calculated_amount`：计算金额
- `actual_amount`：实收金额
- `payment_method`：支付方式
- `gate_system_id`：闸机编号

**计费规则**：¥5/小时，不足1小时按1小时算（向上取整）

---

## 💡 常见问题

### Q1: 如何区分本地和远程环境？

通过环境变量控制：
- **本地**：`DIRECTUS_URL=http://localhost:8055`
- **远程**：`DIRECTUS_URL=https://www.betterhome.ink`

### Q2: 远程部署需要什么权限？

需要设置 `REMOTE_DIRECTUS_TOKEN` 环境变量，值为Directus管理员token。

```bash
export REMOTE_DIRECTUS_TOKEN="your_admin_token_here"
```

### Q3: 如何重新生成数据？

```bash
cd scripts/test-data

# 删除旧数据（可选）
# 需要手动在Directus Admin中删除

# 生成新数据
node generate-parking-data.js local

# 导入新数据
node import-parking-data.js local
```

### Q4: type字段为什么改了？

**旧设计**：
- `fixed`：固定车位
- `temp`：临时车位

**问题**：临停记录在 `parking_temp_records` 表，不需要在 `parking_spots` 表区分。

**新设计**：
- `fixed`：有产权的固定车位（可以售卖）
- `public`：无产权的公共车位（只能出租）

### Q5: 为什么租金收益之前显示为¥0？

**原因**：数据生成脚本的bug，缴费记录只按 `owner_id` 分组，导致管理费和租金混在一起。

**已修复**：现在按 `owner_id + type_code` 组合分组。

---

## 📚 相关文档

- [停车收益功能文档](../docs/finance-transparency/PARKING_REVENUE.md)
- [停车租金文档](../docs/finance-transparency/PARKING_RENT.md)
- [临停收益文档](../docs/finance-transparency/PARKING_TEMP.md)
- [停车表结构设计](../docs/finance-transparency/PARKING_TABLES_DESIGN.md)

---

## 🔄 更新日志

### 2025-10-21
- ✅ 创建远程部署脚本 `deploy-parking-to-remote.sh`
- ✅ 创建快速导入脚本 `quick-import-parking.sh`
- ✅ 更新 `create-parking-tables.sh` 的type字段选项
- ✅ 修复租金缴费生成逻辑（按owner_id+type_code分组）
- ✅ 更新所有相关文档

### 2025-10-20
- ✅ 创建停车表结构脚本
- ✅ 创建数据生成脚本
- ✅ 创建数据导入脚本
