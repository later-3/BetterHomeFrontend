# 财务透明功能 - 5分钟快速上手 🚀

> **目标**：让新开发者 5 分钟内运行起来，30 分钟内理解核心逻辑

---

## ⚡ 快速启动（5分钟）

### 1. 启动服务

```bash
# 终端 1：启动 Directus
docker-compose up

# 终端 2：启动前端
npm run dev
```

### 2. 生成测试数据

```bash
# 生成 2025 年 1-10 月测试数据（约 160 条记录）
node scripts/generate-test-data-2025.js
```

### 3. 访问页面

```
http://localhost:3003/#/pages/finance/finance-v2
```

**预期效果**：
- 总收入：约 ¥270,000
- 总支出：约 ¥252,000
- 结余：约 ¥18,000（绿色）

---

## 🎯 核心概念（3分钟理解）

### 数据公式

```
总收入 = billing_payments（物业费） + incomes（公共收益）
总支出 = expenses（已审核的支出）
结余 = 总收入 - 总支出
```

### 关键字段

| 表名 | 关键字段 | 说明 |
|------|---------|------|
| `billing_payments` | `period`, `amount` | 2025-01 月收了多少物业费 |
| `incomes` | `period`, `income_type`, `amount` | 2025-01 月停车费、广告等收益 |
| `expenses` | `period`, `expense_type`, `amount`, `status` | 2025-01 月工资、水电等支出 |

**重要**：按 `period`（账期）统计，不是按 `paid_at`（支付时间）！

---

## 🔥 踩过的坑（必看！）

### 坑 1：API 响应格式不一致 ⚠️

**错误代码**：
```typescript
const response = await api.readMany(query);
return response?.data || [];  // ❌ 当 limit: -1 时返回 undefined
```

**正确代码**：
```typescript
const response = await api.readMany(query);
return Array.isArray(response) ? response : [];  // ✅
```

**原因**：
- 带分页：`{ data: [...], meta: {...} }`
- 不带分页（`limit: -1`）：`[...]` 直接返回数组

**影响文件**：`src/store/finance.ts` 的三个方法
- `fetchBillingPaymentsByPeriods()` (line 735)
- `fetchIncomesByPeriods()` (line 769)
- `fetchExpensesByPeriods()` (line 1040)

---

### 坑 2：UUID 主键 ⚠️

所有表用 **UUID**，不是 INTEGER！

```javascript
// ✅ 正确
const id = generateUUID();  // '550e8400-e29b-41d4-a716-446655440000'

// ❌ 错误
const id = 123;  // 会导致外键错误
```

---

### 坑 3：权限配置 ⚠️

Resident 角色必须有读权限，且配置 `community_id` 过滤器：

```json
{
  "filter": {
    "_and": [
      { "community_id": { "_eq": "$CURRENT_USER.community_id" } }
    ]
  }
}
```

验证脚本：
```bash
bash scripts/configure-finance-permissions-v2.sh
```

---

## 📁 核心文件清单

| 文件 | 作用 | 改动频率 |
|------|------|---------|
| `src/pages/finance/finance-v2.vue` | UI 页面 | 🔥 高 |
| `src/store/finance.ts` | 数据逻辑 | 🔥 高 |
| `src/utils/finance-labels.ts` | 中文标签 | 🟡 中 |
| `scripts/generate-test-data-2025.js` | 测试数据 | 🟢 低 |

---

## 🛠️ 常见开发任务

### 任务 1：添加新的收入类型

**需要修改 3 个地方**：

1. **Directus 数据模型**（Admin 界面）
   - `incomes.income_type` 添加新选项

2. **中文标签** (`src/utils/finance-labels.ts`)
   ```typescript
   export function getIncomeTypeLabel(type: string): string {
     const labels: Record<string, string> = {
       new_income_type: '新收入类型',  // ← 这里
       // ...
     };
   }
   ```

3. **图标映射** (`src/pages/finance/finance-v2.vue`)
   ```typescript
   const incomeIcons: Record<string, string> = {
     new_income_type: "🆕",  // ← 这里
     // ...
   };
   ```

**测试**：
```bash
# 在 Directus Admin 中手动创建一条新类型的 income 记录
# 刷新财务页面，应该能看到新类型显示
```

---

### 任务 2：修改金额计算逻辑

**位置**：`src/store/finance.ts` 的 `calculateFinancialSummary()` 方法

**示例**：只统计已支付的支出
```typescript
// 原逻辑：只统计 status = 'approved'
const totalExpense = expenses.reduce(
  (sum, expense) => sum + Number(expense.amount || 0),
  0
);

// 新逻辑：只统计 status = 'approved' 且 paid = true
const totalExpense = expenses
  .filter(e => e.status === 'approved' && e.paid === true)
  .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
```

---

### 任务 3：调试数据不显示问题

**步骤**：

1. **检查浏览器控制台**
   ```javascript
   // 看是否有错误日志
   // 看"财务数据获取成功"的日志内容
   ```

2. **检查数据库**
   ```bash
   docker exec -it directus-db psql -U directus -d directus
   ```
   ```sql
   SELECT COUNT(*) FROM billing_payments WHERE period = '2025-01';
   SELECT COUNT(*) FROM incomes WHERE period = '2025-01';
   ```

3. **检查用户信息**
   ```javascript
   // 浏览器控制台
   const { useUserStore } = await import('/src/store/user.ts');
   const userStore = useUserStore();
   console.log(userStore.community?.id);  // 应该有值
   ```

4. **直接测试 API**
   ```javascript
   // 浏览器控制台
   const { useFinanceStore } = await import('/src/store/finance.ts');
   const store = useFinanceStore();
   const data = await store.calculateFinancialSummary(['2025-01']);
   console.log(data);
   ```

---

## 📊 测试数据速查

| 项目 | 数量 | 金额 |
|------|------|------|
| 业主数 | 4 | - |
| 每月物业费 | 4 条 | ¥24,600 |
| 每月公共收益 | 4 条 | ~¥2,400 |
| 每月支出 | 4 条 | ~¥25,200 |
| **10个月总计** | **160 条** | **收入 ¥270,000，支出 ¥252,000** |

**业主列表**：
- 徐若楠（120m²，¥7,200/月）
- Bob（95m²，¥5,700/月）
- 林浩然（85m²，¥5,100/月）
- 陈雅宁（110m²，¥6,600/月）

---

## 🐛 问题排查清单

遇到问题时，按顺序检查：

- [ ] Directus 是否启动？（http://localhost:8055/admin）
- [ ] 前端开发服务器是否启动？（http://localhost:3003）
- [ ] 是否生成了测试数据？（运行 `generate-test-data-2025.js`）
- [ ] 用户是否登录？（浏览器控制台检查 `userStore.profile`）
- [ ] 权限是否配置？（运行权限脚本）
- [ ] 浏览器是否缓存了旧代码？（硬刷新：Cmd+Shift+R）

---

## 🎓 30分钟深入学习路径

1. **阅读核心代码**（15分钟）
   - `src/store/finance.ts` 的 `calculateFinancialSummary()`
   - `src/pages/finance/finance-v2.vue` 的 `fetchFinancialData()`

2. **理解数据流**（10分钟）
   ```
   页面加载 → fetchFinancialData()
   → store.calculateFinancialSummary(periods)
   → 并行调用 3 个 fetch 方法
   → 计算汇总数据
   → 返回给页面
   → UI 自动更新
   ```

3. **动手实践**（5分钟）
   - 修改一个中文标签
   - 在控制台测试一个 API 调用
   - 添加一条测试数据，看页面更新

---

## 📖 进阶阅读

详细文档：`docs/features/finance-transparency-v2.md`

包含内容：
- 完整技术架构
- 所有已知问题和解决方案
- 开发指南和最佳实践
- 待办事项和路线图
- FAQ 和常见问题

---

## 💬 获得帮助

- **文档**：`docs/features/finance-transparency-v2.md`
- **测试数据**：`docs/tasks/billing/test-data-summary.md`
- **Issues**：GitHub Issues
- **调试**：浏览器控制台 + Chrome DevTools

---

**记住**：遇到问题先看文档，再看代码，最后问人！👍
