非常好的规划！财务透明是 **BetterHome 从沟通工具升级为社区治理平台** 的关键一步。我们来系统性地设计这个功能。

---

## 🎯 一、需求分析（参考优秀软件）

### 1. **核心场景**
| 角色 | 需求 | 参考产品 |
|------|------|---------|
| **业主** | - 查看自己缴费记录<br>- 查看小区总收入/总支出<br>- 查看物业支出明细 | 微信物业缴费、支付宝生活号 |
| **物业** | - 录入业主缴费记录<br>- 录入支出明细（维修/工资等）<br>- 生成月度财务报告 | 钉钉智能财务、金蝶社区版 |
| **业委会** | - 审核物业支出<br>- 导出财务数据 | 业委会公示平台 |

### 2. **MVP 聚焦点**
> **只做最核心的“收入-支出”透明**，不做复杂会计科目

- ✅ **收入**：业主物业费缴纳记录
- ✅ **支出**：物业费用支出记录
- ✅ **汇总**：按月/按年总收入 & 总支出
- ❌ **不包含**：滞纳金、多期账单、发票管理、预算对比

---

## 🧱 二、数据模型设计（DBML）

### MVP 阶段核心表

#### 1. **物业费账单（Billing）**
```dbml
Table Billings {
  id uuid [pk]
  community_id uuid [not null] // 所属小区
  building_id uuid // 所属楼栋（可选）
  owner_id uuid [not null] // 缴费业主
  amount decimal(10,2) [not null] // 金额
  period varchar(7) [not null] // 账期（2024-10）
  status billing_status [not null, default: 'unpaid'] // unpaid/paid
  paid_at timestamp // 缴费时间
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]

  indexes {
    (community_id, period, status) [name: 'idx_billings_community_period']
    (owner_id, period) [name: 'idx_billings_owner_period']
  }
}

Enum billing_status {
  unpaid
  paid
}
```

#### 2. **物业支出（Expense）**
```dbml
Table Expenses {
  id uuid [pk]
  community_id uuid [not null] // 所属小区
  title varchar(255) [not null] // 支出标题（如“电梯维修”）
  description text // 详细说明
  amount decimal(10,2) [not null] // 金额
  category expense_category [not null] // 维修/工资/清洁等
  paid_at timestamp [not null] // 支付时间
  proof_file_id uuid // 凭证文件（发票/收据）
  created_by uuid [not null] // 录入人（物业）
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]

  indexes {
    (community_id, paid_at desc) [name: 'idx_expenses_community_time']
    (category, paid_at desc) [name: 'idx_expenses_category_time']
  }
}

Enum expense_category {
  repair      // 维修
  salary      // 工资
  cleaning    // 清洁
  security    // 保安
  utilities   // 公共水电
  other       // 其他
}
```

---

## 🔧 三、Directus 表创建

### 1. **创建 `billings` 表**
- **字段**：按 DBML 创建
- **关系**：
  - `community_id` → `communities.id` (M2O)
  - `building_id` → `buildings.id` (M2O, optional)
  - `owner_id` → `directus_users.id` (M2O)
- **权限**：
  - **业主**：只能读自己的账单
  - **物业**：可创建/读写所有账单
  - **业委会**：只读

### 2. **创建 `expenses` 表**
- **字段**：按 DBML 创建
- **关系**：
  - `community_id` → `communities.id` (M2O)
  - `proof_file_id` → `directus_files.id` (M2O, optional)
  - `created_by` → `directus_users.id` (M2O)
- **权限**：
  - **业主/业委会**：只读
  - **物业**：可创建/读写

---

## 📦 四、前端技术栈集成

### 1. **TypeScript 类型生成**
```ts
// src/@types/directus-schema.d.ts
export interface Billing {
  id: string;
  community_id: string;
  building_id: string | null;
  owner_id: string;
  amount: number;
  period: string; // "2024-10"
  status: 'unpaid' | 'paid';
  paid_at: string | null;
}

export interface Expense {
  id: string;
  community_id: string;
  title: string;
  description: string | null;
  amount: number;
  category: 'repair' | 'salary' | 'cleaning' | 'security' | 'utilities' | 'other';
  paid_at: string;
  proof_file_id: string | null;
  created_by: string;
}
```

### 2. **Directus SDK 封装**
```ts
// src/utils/directus.ts
export const billingsApi = {
  list: (params: any) => directus.items('billings').readMany(params),
  create: (data: Partial<Billing>) => directus.items('billings').create(data)
};

export const expensesApi = {
  list: (params: any) => directus.items('expenses').readMany(params),
  create: (data: Partial<Expense>) => directus.items('expenses').create(data)
};
```

### 3. **Pinia Store 设计**
```ts
// stores/finance.ts
export const useFinanceStore = defineStore('finance', {
  state: () => ({
    billings: [] as Billing[],
    expenses: [] as Expense[],
    loading: false
  }),

  getters: {
    // 业主总收入（已缴）
    totalIncome: (state) => 
      state.billings
        .filter(b => b.status === 'paid')
        .reduce((sum, b) => sum + b.amount, 0),
    
    // 小区总支出
    totalExpenses: (state) => 
      state.expenses.reduce((sum, e) => sum + e.amount, 0)
  },

  actions: {
    async fetchBillings(communityId: string, ownerId?: string) {
      this.loading = true;
      try {
        const filter: any = { community_id: { _eq: communityId } };
        if (ownerId) filter.owner_id = { _eq: ownerId };
        
        const response = await billingsApi.list({
          filter,
          sort: ['-paid_at']
        });
        this.billings = response.data;
      } finally {
        this.loading = false;
      }
    },

    async fetchExpenses(communityId: string) {
      this.loading = true;
      try {
        const response = await expensesApi.list({
          filter: { community_id: { _eq: communityId } },
          sort: ['-paid_at']
        });
        this.expenses = response.data;
      } finally {
        this.loading = false;
      }
    }
  }
});
```

---

## 🚀 五、实施计划（两阶段）

### 阶段 1：MVP（2 周）
| 任务 | 交付物 | 时间 |
|------|--------|------|
| **DBML 设计** | `billings`/`expenses` 表结构 | 1 天 |
| **Directus 表创建** | 权限配置 + 关系设置 | 2 天 |
| **前端基础功能** | - 业主账单查询页<br>- 物业支出录入页<br>- 小区收支汇总页 | 5 天 |
| **测试验证** | 业主/物业/业委会角色测试 | 2 天 |

### 阶段 2：优化（V2.0）
| 功能 | 说明 |
|------|------|
| **多期账单** | 支持按季度/年度生成账单 |
| **滞纳金计算** | 自动计算逾期费用 |
| **财务报告** | 月度 PDF 报告自动生成 |
| **预算管理** | 年度预算 vs 实际支出对比 |
| **发票管理** | 电子发票上传与关联 |

---

## ✅ 六、成功标志（MVP）

1. **业主端**：
   - 能查看自己的缴费记录
   - 能看到小区本月总收入/总支出
   - 能查看物业支出明细（含凭证）

2. **物业端**：
   - 能批量导入业主账单
   - 能录入支出并上传凭证
   - 能查看财务汇总数据

3. **数据安全**：
   - 业主只能看自己小区的数据
   - 业主不能修改账单状态

---

## 💡 最终建议

> **MVP 阶段聚焦“透明”而非“复杂”**：  
> - 用最简模型实现核心价值  
> - 避免过早引入会计复杂度  
> - 通过真实用户反馈迭代 V2.0

需要我为你提供 **完整的 DBML 文件** 或 **Directus 表创建指南** 吗？