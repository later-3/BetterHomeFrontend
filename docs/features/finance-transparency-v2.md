# 财务透明功能 v2.0 - 开发文档

> ⚠️ **文档状态说明（2025-10-19）**
>
> 本文档描述的是财务透明功能的**早期v2.0版本**。数据模型已在**v2.5版本（2025-10-19）**进行了重要简化：
> - `billings`表：移除`paid_amount`和`status`，改用`is_paid`布尔字段
> - `billing_payments`表：移除`billing_id`外键和`period`字段，新增`paid_periods`数组字段
> - 不使用触发器/Hooks，采用FIFO缴费原则
>
> **最新数据模型请参考：** [docs/finance-transparency/DATA_MODEL.md](../finance-transparency/DATA_MODEL.md)
>
> 本文档保留用于了解功能演进历史，但部分技术细节已过时。

## 📋 目录

- [功能概述](#功能概述)
- [技术架构](#技术架构)
- [已知问题与解决方案](#已知问题与解决方案)
- [开发指南](#开发指南)
- [测试数据说明](#测试数据说明)
- [待办事项](#待办事项)

---

## 功能概述

### 业务目标

为社区居民提供透明的财务信息展示，包括：
- **总收入**：物业费实收 + 公共收益
- **总支出**：各类支出明细（人员工资、水电费、维修保养等）
- **结余**：总收入 - 总支出
- **多月份选择**：支持查看任意月份组合的财务汇总

### 核心数据模型

```
总收入 = 物业费实收（billing_payments） + 公共收益（incomes）
总支出 = 已审核支出（expenses，status = 'approved'）
结余 = 总收入 - 总支出
```

### 会计准则

采用**权责发生制**（Accrual Accounting）：
- 按照 `period` 字段（YYYY-MM 格式）归属账期
- 而非按照实际支付/收款时间（`paid_at`）

**示例**：
- 2025-01 月的账单，即使在 2025-02 才缴费，也归属到 2025-01 的收入
- `billing_payments` 表的 `period` 字段从对应的 `billings` 继承而来

---

## 技术架构

### 文件结构

```
src/
├── pages/finance/
│   └── finance-v2.vue           # 财务透明页面 UI
├── store/
│   └── finance.ts               # 财务数据状态管理（Pinia）
├── utils/
│   ├── finance-labels.ts        # 收入/支出类型的中文标签映射
│   └── directus.ts              # Directus API 封装
└── @types/
    └── directus-schema.d.ts     # TypeScript 类型定义

scripts/
└── generate-test-data-2025.js   # 生成测试数据脚本

docs/
└── tasks/billing/
    └── test-data-summary.md     # 测试数据文档
```

### 数据库表

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `billings` | 物业费账单（应收） | `period`, `billing_amount`, `owner_id` |
| `billing_payments` | 物业费收款（实收）| `period`, `amount`, `paid_at` |
| `incomes` | 公共收益 | `period`, `income_type`, `amount` |
| `expenses` | 支出记录 | `period`, `expense_type`, `amount`, `status` |

**重要**：所有表使用 **UUID 主键**，不是自增 INTEGER。

### 前端技术栈

- **框架**：Vue 3 + TypeScript + uniapp
- **状态管理**：Pinia
- **UI 组件**：uview-plus
- **后端 API**：Directus SDK

---

## 已知问题与解决方案

### ⚠️ 问题 1：Directus API 响应格式不一致

**现象**：
```javascript
// 带分页参数的查询
{ data: [...], meta: {...} }

// 不带分页参数（limit: -1）的查询
[...]  // 直接返回数组
```

**错误代码示例**：
```typescript
const response = await billingPaymentsApi.readMany(query);
return response?.data || [];  // ❌ 当 limit: -1 时，response.data 是 undefined
```

**正确做法**：
```typescript
const response = await billingPaymentsApi.readMany(query);
// 检查 response 本身是否为数组
return Array.isArray(response) ? response : [];  // ✅
```

**影响范围**：
- `fetchBillingPaymentsByPeriods()` - src/store/finance.ts:735
- `fetchIncomesByPeriods()` - src/store/finance.ts:769
- `fetchExpensesByPeriods()` - src/store/finance.ts:1040

**解决状态**：✅ 已修复（2025-10-14）

---

### ⚠️ 问题 2：UUID vs INTEGER 主键

**背景**：
- 早期版本使用 INTEGER 自增主键
- v2.0 迁移到 UUID 主键（更符合 Directus 最佳实践）

**迁移脚本**：
```bash
# 位置：scripts/create-finance-tables-v2-*.sh
bash scripts/create-finance-tables-v2-part1.sh
bash scripts/create-finance-tables-v2-part2.sh
bash scripts/create-finance-tables-v2-remaining.sh
```

**注意事项**：
1. 删除旧表前务必备份数据
2. 外键字段类型必须匹配（UUID 对 UUID）
3. 测试数据脚本使用 `generateUUID()` 函数生成主键

---

### ⚠️ 问题 3：权限配置

**症状**：API 返回 403 或空数据

**检查清单**：
```bash
# 1. 验证 Resident 角色是否有读权限
curl "http://localhost:8055/permissions?filter[policy][_eq]=RESIDENT_POLICY_ID" \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 2. 确认 community_id 过滤器配置正确
# billing_payments: _and: [community_id._eq: $CURRENT_USER.community_id]
```

**权限配置脚本**：
```bash
bash scripts/configure-finance-permissions-v2.sh
```

---

## 开发指南

### 快速开始

#### 1. 启动 Directus 和前端

```bash
# 终端 1：启动 Directus（Docker）
docker-compose up

# 终端 2：启动前端开发服务器
npm run dev
```

#### 2. 生成测试数据

```bash
# 生成 2025 年 1-10 月的测试数据
node scripts/generate-test-data-2025.js
```

**数据量**：
- 物业费账单：40 条（4 业主 × 10 月）
- 物业费收款：40 条
- 公共收益：40 条（4 类型 × 10 月）
- 支出记录：40 条（4 类型 × 10 月）

#### 3. 访问页面

```
http://localhost:3003/#/pages/finance/finance-v2
```

---

### 核心代码解读

#### Store 方法：`calculateFinancialSummary()`

**位置**：`src/store/finance.ts:1049-1126`

**功能**：根据选中的账期，计算财务汇总数据

**输入**：
```typescript
periods: string[]  // 例如：['2025-01', '2025-02', '2025-03']
```

**输出**：
```typescript
{
  propertyFeeIncome: number,      // 物业费实收
  publicIncome: number,           // 公共收益
  totalIncome: number,            // 总收入
  totalExpense: number,           // 总支出
  balance: number,                // 结余
  incomesByType: Array<{          // 按类型分组的收益
    type: string,
    total: number,
    count: number
  }>,
  expensesByType: Array<{         // 按类型分组的支出
    type: string,
    total: number,
    count: number
  }>,
  billingPayments: BillingPayment[],  // 原始数据
  incomes: Income[],
  expenses: Expense[]
}
```

**关键实现**：
```typescript
// 1. 并行获取三类数据（性能优化）
const [billingPayments, incomes, expenses] = await Promise.all([
  fetchBillingPaymentsByPeriods(periods),
  fetchIncomesByPeriods(periods),
  fetchExpensesByPeriods(periods),
]);

// 2. 计算总收入
const propertyFeeIncome = billingPayments.reduce(
  (sum, payment) => sum + Number(payment.amount || 0),
  0
);
const publicIncome = incomes.reduce(
  (sum, income) => sum + Number(income.amount || 0),
  0
);
const totalIncome = propertyFeeIncome + publicIncome;

// 3. 计算总支出（只统计已审核的）
const totalExpense = expenses.reduce(
  (sum, expense) => sum + Number(expense.amount || 0),
  0
);
```

---

#### 页面组件：`finance-v2.vue`

**位置**：`src/pages/finance/finance-v2.vue`

**核心功能**：
1. 月份选择器（多选，默认 1-10 月）
2. 财务汇总卡片（结余、总收入、总支出、环比）
3. 收入/支出明细列表（带百分比和进度条）

**数据流**：
```
onMounted()
  ↓
fetchFinancialData()
  ↓
financeStore.calculateFinancialSummary(periods)
  ↓
financialData.value = data
  ↓
UI 自动更新（Vue 响应式）
```

**金额格式化**：
```typescript
function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
```

---

### 添加新的收入/支出类型

#### 1. 更新数据库枚举

修改 Directus 数据模型：
- `incomes.income_type`：停车费、广告收益、快递柜、场地租赁、其他
- `expenses.expense_type`：人员工资、水电费、维修保养、物料采购、安保、保洁、绿化、其他

#### 2. 更新中文标签映射

**位置**：`src/utils/finance-labels.ts`

```typescript
export function getIncomeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    parking: '停车费',
    advertising: '广告收益',
    express_locker: '快递柜',
    venue_rental: '场地租赁',
    new_type: '新类型',  // ← 添加这里
    other: '其他',
  };
  return labels[type] || type;
}
```

#### 3. 更新图标映射

**位置**：`src/pages/finance/finance-v2.vue:198-216`

```typescript
const incomeIcons: Record<string, string> = {
  parking: "🅿️",
  advertising: "📢",
  express_locker: "📦",
  venue_rental: "🏢",
  new_type: "🆕",  // ← 添加这里
  other: "💰",
};
```

#### 4. 更新测试数据

**位置**：`scripts/generate-test-data-2025.js:26-32`

```javascript
const INCOME_TYPES = [
  { type: 'parking', label: '车位租金', min: 1200, max: 1800 },
  { type: 'new_type', label: '新类型', min: 500, max: 1000 },  // ← 添加这里
  // ...
];
```

---

## 测试数据说明

### 业主信息

| 业主 | 房屋面积 | 月物业费 (60元/m²) |
|------|---------|-------------------|
| 徐若楠 | 120 m² | ¥7,200 |
| Bob | 95 m² | ¥5,700 |
| 林浩然 | 85 m² | ¥5,100 |
| 陈雅宁 | 110 m² | ¥6,600 |

**每月应收合计**：¥24,600

### 收入类型及金额范围

| 类型 | 金额范围（每月） |
|------|----------------|
| 停车费 | ¥1,200 - ¥1,800 |
| 广告收益 | ¥300 - ¥600 |
| 快递柜 | ¥200 - ¥400 |
| 场地租赁 | ¥150 - ¥350 |

**每月公共收益合计**：约 ¥2,400

### 支出类型及金额范围

| 类型 | 金额（每月） |
|------|-------------|
| 人员工资 | ¥23,000（固定） |
| 水电费 | ¥800 - ¥1,200 |
| 维修保养 | ¥500 - ¥1,000 |
| 物料采购 | ¥200 - ¥500 |

**每月支出合计**：约 ¥25,000

### 预期汇总（1-10 月）

- **总收入**：约 ¥270,000
  - 物业费实收：¥246,000
  - 公共收益：约 ¥24,000
- **总支出**：约 ¥252,000
- **结余**：约 ¥18,000

---

## 待办事项

### 🔴 高优先级

- [ ] **环比计算**：实现真实的环比增长逻辑
  - 当前显示固定值：`+0.0%`
  - 需要比较相邻时间段的数据

- [ ] **点击明细查看详情**：点击收入/支出项跳转到详情页
  - 路由：`/pages/finance/detail?type=income&category=parking&period=2025-01`
  - 显示该类型的所有记录（分页列表）

- [ ] **错误处理优化**：
  - 网络错误重试机制
  - 空数据状态优化（区分"无权限"和"无数据"）

### 🟡 中优先级

- [ ] **数据缓存**：避免重复请求相同账期的数据
  - 使用 Pinia 的 state 缓存已加载的数据
  - 添加"刷新"按钮手动更新

- [ ] **导出功能**：支持导出财务报表（PDF/Excel）
  - 使用 jsPDF 生成 PDF
  - 使用 xlsx 生成 Excel

- [ ] **图表可视化**：
  - 收入/支出趋势折线图（ECharts）
  - 收入/支出占比饼图

### 🟢 低优先级

- [ ] **按年份查看**：支持选择年份，显示全年汇总
  - 2024 年、2025 年等快捷选择

- [ ] **搜索/筛选**：
  - 按关键词搜索收入/支出项
  - 按金额范围筛选

- [ ] **对比功能**：
  - 对比不同月份的财务数据
  - 对比预算 vs 实际支出

---

## 常见问题 FAQ

### Q1：为什么总收入显示为 ¥0.00？

**排查步骤**：
1. 检查用户是否登录：`userStore.profile?.id`
2. 检查 community_id 是否正确：`userStore.community?.id`
3. 检查数据库是否有数据：
   ```sql
   SELECT COUNT(*) FROM billing_payments WHERE period = '2025-01';
   ```
4. 检查权限配置：Resident 角色是否有读取权限
5. 检查浏览器控制台是否有 API 错误

### Q2：如何重新生成测试数据？

```bash
# 方法 1：直接运行脚本（会追加数据）
node scripts/generate-test-data-2025.js

# 方法 2：清空后重新生成
# 1. 在 Directus Admin 中删除所有财务数据
# 2. 运行脚本
node scripts/generate-test-data-2025.js
```

### Q3：如何调试 Store 方法？

在浏览器控制台：
```javascript
// 1. 导入 store
const { useFinanceStore } = await import('/src/store/finance.ts');
const financeStore = useFinanceStore();

// 2. 调用方法
const result = await financeStore.calculateFinancialSummary(['2025-01']);
console.log(result);
```

### Q4：生产环境部署注意事项？

1. **移除测试数据**：清空 Directus 中的测试数据
2. **权限检查**：确认 Resident 角色权限配置正确
3. **环境变量**：配置正确的 Directus URL
4. **性能优化**：考虑添加数据缓存层（Redis）
5. **日志监控**：接入 Sentry 等错误追踪服务

---

## 参考资源

### 内部文档
- [测试数据总结](../tasks/billing/test-data-summary.md)
- [权限配置指南](../tasks/billing/permission-troubleshooting.md)
- [UUID 迁移指南](../tasks/billing/table-id-type-issue.md)

### 外部文档
- [Directus SDK 文档](https://docs.directus.io/reference/sdk/)
- [uview-plus 组件库](https://uviewui.com/)
- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Pinia 状态管理](https://pinia.vuejs.org/zh/)

---

## 更新日志

### v2.0.0 (2025-10-14)
- ✅ UUID 主键迁移完成
- ✅ 修复 Directus API 响应格式不一致问题
- ✅ 实现多月份选择功能
- ✅ 完成收入/支出明细展示
- ✅ 生成完整测试数据（1-10 月）
- ✅ 权责发生制会计准则实现

### v1.0.0 (2025-10-13)
- 初始版本（INTEGER 主键）
- 基础财务汇总功能

---

## 联系方式

如有问题，请联系：
- 开发团队：[GitHub Issues](https://github.com/your-repo/issues)
- 文档维护：通过 PR 提交文档改进建议

---

**最后更新**：2025-10-14
**维护者**：开发团队
