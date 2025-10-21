# 临停收益功能

## 功能概述

临停（临时停车）是指非业主/非租户的临时车辆使用小区空置车位产生的收入。

计费标准：**¥5/小时**（不足1小时按1小时算）

---

## 计算规则

### 计费公式

```javascript
// 代码位置: generate-parking-data.js:563-565
const hours = Math.ceil(durationMinutes / 60);  // 向上取整
const amount = hours * temp_parking_rate;       // 小时数 × 单价(5元)
```

### 配置参数

```javascript
const CONFIG = {
  temp_parking_rate: 5,       // 临停单价：5元/小时
  temp_records_per_day: 3,    // 每天生成3条临停记录
};
```

### 计算示例

从实际测试数据验证：

| 停车时长 | 计算过程 | 金额 |
|---------|---------|------|
| 223分钟 | Math.ceil(223/60) × 5 = 4小时 × 5 = ¥20 ✅ | ¥20 |
| 72分钟  | Math.ceil(72/60) × 5 = 2小时 × 5 = ¥10 ✅  | ¥10 |
| 212分钟 | Math.ceil(212/60) × 5 = 4小时 × 5 = ¥20 ✅ | ¥20 |
| 77分钟  | Math.ceil(77/60) × 5 = 2小时 × 5 = ¥10 ✅  | ¥10 |
| 83分钟  | Math.ceil(83/60) × 5 = 2小时 × 5 = ¥10 ✅  | ¥10 |
| 59分钟  | Math.ceil(59/60) × 5 = 1小时 × 5 = ¥5 ✅   | ¥5  |
| 61分钟  | Math.ceil(61/60) × 5 = 2小时 × 5 = ¥10 ✅  | ¥10 |

---

## 业务规则

1. **计费规则**：按小时计费，不足1小时按1小时算（向上取整）
2. **单价**：¥5/小时
3. **可用车位**：空置的公共车位（B区和C区未租出的车位）
4. **支付方式**：70% 微信支付，30% 支付宝
5. **自动支付**：测试数据中所有临停记录都已支付（`is_paid: true`）
6. **车牌号生成**：随机生成中国车牌号格式（如：京A·12345）

---

## 数据模型

### parking_temp_records 表

临停记录表，独立于 `parking_spots` 表。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | UUID | 主键 |
| `community_id` | UUID | 所属小区 |
| `license_plate` | String | 车牌号 |
| `entry_time` | Timestamp | 入场时间 |
| `exit_time` | Timestamp | 出场时间 |
| `duration_minutes` | Integer | 停车时长（分钟） |
| `parking_spot_number` | String | 临停使用的车位号 |
| `calculated_amount` | Decimal | 计算金额（系统自动算出） |
| `actual_amount` | Decimal | 实际收费（可能有优惠，当前与计算金额相同） |
| `payment_method` | String | 支付方式（wechat/alipay） |
| `is_paid` | Boolean | 是否已支付 |
| `gate_system_id` | String | 闸机编号（如：GATE-001） |
| `payment_id` | UUID | 关联缴费记录 |
| `proof_files` | JSON | 支付凭证图片（目前为空） |
| `notes` | String | 备注 |

---

## 数据查询

### 1. 获取临停记录

```javascript
const tempRecords = await readItems("parking_temp_records", {
  filter: {
    entry_time: {
      _between: [start, end]  // 筛选时间范围
    }
  },
  fields: [
    "id", "license_plate", "entry_time", "exit_time",
    "duration_minutes", "parking_spot_number",
    "calculated_amount", "actual_amount", "payment_method"
  ],
  sort: ["-entry_time"],  // 按入场时间倒序
  limit: -1
});
```

### 2. 统计临停总收益

```javascript
const result = await aggregate("payments", {
  aggregate: { sum: ["amount"] },
  query: {
    filter: {
      type_code: { _eq: "parking_temp" }
    }
  }
});
const tempRevenue = Number(result?.[0]?.sum?.amount || 0);
```

---

## 页面功能

### 1. 临停列表页 (`parking-temp-list.vue`)

**三个区域**：
1. **筛选区域**：
   - 起始月份选择
   - 结束月份选择
   - 查询按钮

2. **临停总收益**：
   - 显示总收益金额
   - 显示记录总数

3. **临停记录列表**：
   - 车牌号
   - 停车时长
   - 入场/出场时间
   - 车位号
   - 收费金额
   - 支付方式标签

**点击记录** → 跳转到临停详情页

### 2. 临停详情页 (`parking-temp-detail.vue`)

**内容区域**：

1. **车牌信息**：
   - 车牌号（大字显示）
   - 车辆图标

2. **金额卡片**：
   - 停车费用
   - 支付状态（已支付）

3. **停车信息**：
   - 入场时间
   - 出场时间
   - 停车时长
   - 车位号

4. **费用信息**：
   - 计费时长（向上取整的小时数）
   - 单价（¥5/小时）
   - 计算金额
   - 实收金额

5. **支付信息**：
   - 支付方式
   - 支付时间
   - 交易单号
   - 闸机编号

6. **支付凭证**（可选）：
   - 支付凭证图片展示

7. **备注**（可选）：
   - 其他备注信息

---

## 测试数据

### 生成配置

```javascript
const CONFIG = {
  temp_parking_rate: 5,      // 5元/小时
  temp_records_per_day: 3,   // 每天3条
  year: 2025,
  months: [1,2,3,4,5,6,7,8,9,10,11,12]  // 全年12个月
};
```

### 生成结果

```
临停记录: 103条
临停缴费: 103条（全部已支付）
临停总收益: ¥3,850
```

### 记录分布

- 每天生成3条记录
- 停车时长：30分钟 - 4小时随机
- 支付方式：70% 微信，30% 支付宝
- 所有记录都已支付

---

## 数据流程

```
访客车辆进入
    ↓
闸机记录入场时间
    ↓
车辆停放在空置车位
    ↓
车辆离开，闸机记录出场时间
    ↓
系统计算停车时长和费用
    ↓
访客扫码支付（微信/支付宝）
    ↓
创建 parking_temp_records 记录
    ↓
创建 payment 记录 (type_code='parking_temp')
    ↓
闸机放行
```

---

## 常见问题

### Q1: 临停和固定车位有什么区别？

| 项目 | 固定车位 | 临停 |
|------|---------|------|
| **数据表** | parking_spots | parking_temp_records |
| **使用对象** | 业主/租户 | 访客 |
| **计费方式** | 按月收费 | 按小时收费 |
| **金额** | ¥200或¥500/月 | ¥5/小时 |
| **合同** | 长期产权或租赁 | 无合同，即停即走 |

### Q2: 临停费用会有优惠吗？

目前测试数据中 `calculated_amount` = `actual_amount`，即没有优惠。
实际业务中可以设置：
- 首小时免费
- VIP客户折扣
- 节假日优惠等

### Q3: 临停记录的车位号从哪里来？

从空置的公共车位（B区和C区未租出的车位）随机选择：

```javascript
// 获取可用于临停的车位
const availableSpots = spots.filter(s =>
  (s.type === 'fixed' && !s.is_sold && !s.is_rented) ||  // B区未售未租
  (s.type === 'public' && !s.is_rented)                  // C区未租
);
```

---

## 相关文档

- [停车收益总体文档](./PARKING_REVENUE.md)
- [停车租金文档](./PARKING_RENT.md)
- [停车表结构设计](./PARKING_TABLES_DESIGN.md)