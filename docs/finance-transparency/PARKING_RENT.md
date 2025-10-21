# 停车租金收益功能

## 功能概述

停车租金是小区公共车位出租产生的收入。包括：
- **有产权未售车位**（B区）：可以出租或售卖
- **无产权公共车位**（C区）：只能出租

月租金：**¥500/月**

---

## 数据流程

租金的完整流程：

```
parking_spots (已租车位)
    ↓ is_rented=true, renter_id
parking_details (租金详情，fee_type='rent')
    ↓ 每个车位1条记录
receivables (租金应收，type_code='parking_rent')
    ↓ 每月生成应收账单
payments (租金实收，type_code='parking_rent')
    ↓ 租户缴费
统计总收益: SUM(payments.amount WHERE type_code='parking_rent')
```

---

## 车位分配

### B区：有产权未售车位（5个）
- `type='fixed'`（有产权）
- `ownership='public'`（公共所有）
- `is_sold=false`（未售出）
- **可租可售**
- 约50%已租出（2-3个）

### C区：无产权公共车位（5个）
- `type='public'`（无产权）
- `ownership='public'`（公共所有）
- **只能出租**
- 约50%已租出（2-3个）

---

## 数据查询

### 1. 获取所有已租车位

```javascript
const rentedSpots = await readItems("parking_spots", {
  filter: {
    is_rented: { _eq: true }
  },
  fields: ["id", "spot_number", "renter_id", "monthly_rent", "rent_contract_start", "rent_contract_end"]
});
```

### 2. 获取租户信息

**注意**：`directus_users` 是核心集合，不能使用 `readItems()`

```javascript
const token = uni.getStorageSync("directus_token");
const response = await fetch(`${env.directusUrl}/users/${renterId}?fields=id,first_name,last_name`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const user = await response.json();
const name = user.data?.first_name || user.data?.last_name || "未知租户";
```

### 3. 获取租金应收账单

```javascript
const receivables = await readItems("receivables", {
  filter: {
    type_code: { _eq: "parking_rent" },
    period: { _in: months }  // 筛选月份
  },
  fields: ["id", "type_detail_id", "amount", "status", "payment_id"]
});
```

### 4. 统计租金总收益

```javascript
const result = await aggregate("payments", {
  aggregate: { sum: ["amount"] },
  query: {
    filter: {
      type_code: { _eq: "parking_rent" }
    }
  }
});
const rentRevenue = Number(result?.[0]?.sum?.amount || 0);
```

---

## 页面功能

### 1. 租金列表页 (`parking-rent-list.vue`)

**三个区域**：
1. **筛选区域**：月份范围选择
2. **收支汇总**：
   - 应收总额
   - 实收总额
   - 出租车位总数
   - 未欠费车位数
   - 欠费车位数
3. **车位列表**：
   - 车位号
   - 租户姓名
   - 欠费状态（有欠费/已缴清）

**点击车位** → 跳转到租金车位详情页

### 2. 租金车位详情页 (`parking-rent-spot-detail.vue`)

**内容**：
- 车位信息（车位号、位置）
- 租户信息
- 租赁合同期（如：2025-01-01 至 2025-12-31）
- 缴费进度：
  - 月租金（¥500）
  - 总应缴金额
  - 已缴金额
  - 欠费金额
- 12个月缴费状态可视化（绿色=已缴，橙色=未缴）
- 缴费记录列表（金额、时间、月份、支付方式）

**点击缴费记录** → 跳转到缴费详情页

---

## 测试数据示例

```javascript
// 配置
const CONFIG = {
  unsold_fixed_spots: 5,    // B区：有产权未售
  public_spots: 5,          // C区：无产权公共
  rented_ratio: 0.5,        // 50%租赁率
  monthly_rent: 500,        // 月租金
  year: 2025,
  months: [1,2,3,4,5,6,7,8,9,10,11,12]
};

// 生成结果
已租车位: 4个
租金应收: 32条（4个车位 × 8个月，部分合同到6月30日）
租金缴费: 5条，总额 ¥11,000
```

---

## 常见问题

### Q1: 为什么之前租金显示为¥0？

**原因**：数据生成脚本的bug，缴费记录只按 `owner_id` 分组，导致管理费和租金混在一起处理。

**修复前**：
```javascript
// ❌ 只按owner_id分组
const receivablesByOwner = {};
for (const recv of receivables) {
  receivablesByOwner[recv.owner_id].push(recv);
}
```

**修复后**：
```javascript
// ✅ 按owner_id + type_code组合分组
const receivablesByOwnerAndType = {};
for (const recv of receivables) {
  const key = `${recv.owner_id}__${recv.type_code}`;
  receivablesByOwnerAndType[key].push(recv);
}
```

### Q2: 租金和管理费有什么区别？

| 项目 | 管理费 | 租金 |
|------|--------|------|
| **适用对象** | 业主购买的车位 | 公共车位出租 |
| **金额** | ¥200/月 | ¥500/月 |
| **type_code** | `parking_management` | `parking_rent` |
| **fee_type** | `management` | `rent` |
| **缴费人** | 业主（owner_id） | 租户（renter_id） |

### Q3: 一个车位能同时收管理费和租金吗？

**不能**。每个车位只有一种费用类型：
- **业主购买车位**：只收管理费
- **公共车位已租**：只收租金
- **公共车位空置**：不收费

---

## 相关文档

- [停车收益总体文档](./PARKING_REVENUE.md)
- [临停收益文档](./PARKING_TEMP.md)
- [停车表结构设计](./PARKING_TABLES_DESIGN.md)