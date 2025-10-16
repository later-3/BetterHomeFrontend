# 开发文档（Development Document）
## 社区财务透明化系统

---

## 📋 文档信息

| 项目 | 内容 |
|------|------|
| **文档版本** | v2.3 |
| **创建日期** | 2025-10-13 |
| **最后更新** | 2025-10-13 |
| **技术负责人** | 待定 |
| **目标读者** | 开发人员、测试人员 |

**重要说明（v2.3 更新）**：
- MVP 阶段只开发**业主端小程序**（5个页面）
- **业主端仅提供查看功能，不包含在线支付**（在线支付为 v2.0+ 功能）
- 物业管理员功能通过 **Directus 后台** 或简单网页实现（不在小程序中开发）
- 维修基金功能标记为 **v2.5+**（MVP 不包含）
- 业委会功能标记为 **v2.8+**（MVP 不包含）
- 开发重点：前端查询 Actions + UI 页面（纯展示，无支付交互），物业端创建 Actions 暂不使用

---

## 目录

1. [开发环境配置](#1-开发环境配置)
2. [技术实现](#2-技术实现)
3. [代码规范](#3-代码规范)
4. [开发工作流](#4-开发工作流)
5. [测试指南](#5-测试指南)
6. [部署指南](#6-部署指南)
7. [故障排查](#7-故障排查)
8. [FAQ](#8-faq)

---

## 1. 开发环境配置

### 1.1 系统要求

- **操作系统**：macOS / Windows 10+ / Linux
- **Node.js**：v18.x 或更高版本
- **包管理器**：npm 9.x 或 pnpm 8.x
- **IDE**：VS Code（推荐）或 WebStorm
- **微信开发者工具**：最新稳定版

### 1.2 安装步骤

#### 1. 克隆项目
```bash
git clone <repository-url>
cd BetterHomeFrontend
```

#### 2. 安装依赖
```bash
npm install
# 或
pnpm install
```

#### 3. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
# VITE_DIRECTUS_URL=http://localhost:8055
# VITE_DIRECTUS_TOKEN=your_token_here
```

#### 4. 启动开发服务器
```bash
npm run dev:mp-weixin
```

#### 5. 打开微信开发者工具
- 导入项目目录：`dist/dev/mp-weixin`
- 填写 AppID（测试可使用测试号）
- 点击"编译"运行

### 1.3 VS Code 插件推荐

```json
{
  "recommendations": [
    "vue.volar",                    // Vue 3 语言支持
    "dbaeumer.vscode-eslint",       // ESLint
    "esbenp.prettier-vscode",       // Prettier
    "lokalise.i18n-ally",           // 国际化支持
    "bradlc.vscode-tailwindcss",    // Tailwind CSS 智能提示
    "wayou.vscode-todo-highlight"   // TODO 高亮
  ]
}
```

### 1.4 配置 Directus 本地开发环境

#### 安装 Directus（Docker）
```bash
# docker-compose.yml
version: "3"
services:
  postgres:
    image: postgis/postgis:14-3.2-alpine
    volumes:
      - ./data/database:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: directus
      POSTGRES_USER: directus
      POSTGRES_PASSWORD: directus

  directus:
    image: directus/directus:latest
    ports:
      - 8055:8055
    volumes:
      - ./uploads:/directus/uploads
    environment:
      KEY: 255d861b-5ea1-5996-9aa3-922530ec40b1
      SECRET: 6116487b-cda1-52c2-b5b5-c8022c45e263
      DB_CLIENT: pg
      DB_HOST: postgres
      DB_PORT: 5432
      DB_DATABASE: directus
      DB_USER: directus
      DB_PASSWORD: directus
      ADMIN_EMAIL: admin@example.com
      ADMIN_PASSWORD: password
      PUBLIC_URL: http://localhost:8055

# 启动
docker-compose up -d
```

#### 创建财务表
```bash
# 运行数据库迁移脚本
bash scripts/create-finance-tables-v2-part1.sh
bash scripts/create-finance-tables-v2-part2.sh
bash scripts/create-finance-tables-v2-remaining.sh

# 配置权限
bash scripts/configure-finance-permissions-v2.sh

# 生成测试数据
node scripts/generate-finance-data.js
```

---

## 2. 技术实现

### 2.1 项目结构

**MVP 阶段项目结构（仅业主端）**：

```
BetterHomeFrontend/
├── src/
│   ├── pages/                   # 页面
│   │   ├── finance/            # ✅ MVP - 财务模块页面（业主端）
│   │   │   ├── index.vue       # ✅ MVP - 财务概览
│   │   │   ├── my-billings.vue # ✅ MVP - 我的账单
│   │   │   ├── billing-detail.vue # ✅ MVP - 账单详情
│   │   │   ├── monthly-accounts.vue # ✅ MVP - 月度账目
│   │   │   ├── income-detail.vue # ✅ MVP - 公共收入明细
│   │   │   │
│   │   │   ├── maintenance-fund.vue # 🔮 v2.0+ - 维修基金
│   │   │   ├── pm/             # ❌ MVP 不开发（使用 Directus 后台）
│   │   │   └── committee/      # 🔮 v2.0+ - 业委会页面
│   │   │
│   │   ├── task/               # 工单模块（已有）
│   │   ├── profile/            # 个人中心（已有）
│   │   └── login/              # 登录（已有）
│   │
│   ├── store/                  # Pinia Store
│   │   ├── finance.ts          # 财务 Store ⭐ 核心
│   │   ├── user.ts             # 用户 Store（已有）
│   │   └── workOrders.ts       # 工单 Store（已有）
│   │
│   ├── components/             # 组件
│   │   ├── finance/            # 财务组件
│   │   │   ├── FinanceCard.vue
│   │   │   ├── ProofViewer.vue
│   │   │   └── FileUploader.vue
│   │   └── common/             # 通用组件（已有）
│   │
│   ├── utils/                  # 工具函数
│   │   ├── directus.ts         # Directus SDK 封装
│   │   ├── fileUtils.ts        # 文件工具
│   │   └── finance-labels.ts   # 财务字段标签映射
│   │
│   ├── @types/                 # TypeScript 类型定义
│   │   └── directus-schema.ts  # Directus Schema
│   │
│   ├── config/                 # 配置文件
│   │   └── env.ts              # 环境变量
│   │
│   ├── App.vue                 # 根组件
│   ├── main.ts                 # 入口文件
│   ├── pages.json              # 路由配置
│   └── manifest.json           # 应用配置
│
├── scripts/                    # 脚本
│   ├── create-finance-tables-v2-*.sh
│   ├── configure-finance-permissions-v2.sh
│   └── generate-finance-data.js
│
├── docs/                       # 文档
│   └── finance-transparency/
│       ├── PRD.md              # 产品需求文档
│       ├── DESIGN.md           # 设计文档
│       └── DEVELOPMENT.md      # 开发文档（本文档）
│
├── .env.example                # 环境变量模板
├── .eslintrc.js                # ESLint 配置
├── .prettierrc                 # Prettier 配置
├── tsconfig.json               # TypeScript 配置
├── vite.config.ts              # Vite 配置
└── package.json                # 项目依赖
```

### 2.2 Store 实现详解

#### 2.2.1 State 设计

```typescript
// src/store/finance.ts

import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Query } from '@directus/sdk';
import type {
  Schema,
  Billing,
  BillingPayment,
  Income,
  Expense,
  Employee,
  SalaryRecord,
  MaintenanceFundAccount,
  MaintenanceFundPayment,
  MaintenanceFundUsage
} from '@/@types/directus-schema';

const DEFAULT_PAGE_SIZE = 20;

interface FinanceState {
  // 数据数组
  billings: Billing[];
  billingPayments: BillingPayment[];
  incomes: Income[];
  expenses: Expense[];
  employees: Employee[];
  salaryRecords: SalaryRecord[];
  mfAccounts: MaintenanceFundAccount[];
  mfPayments: MaintenanceFundPayment[];
  mfUsage: MaintenanceFundUsage[];

  // 分页状态
  billingsPage: number;
  billingsHasMore: boolean;
  incomesPage: number;
  incomesHasMore: boolean;
  expensesPage: number;
  expensesHasMore: boolean;
  employeesPage: number;
  employeesHasMore: boolean;
  mfUsagePage: number;
  mfUsageHasMore: boolean;

  // 通用状态
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

export const useFinanceStore = defineStore('finance', () => {
  const state = ref<FinanceState>({
    billings: [],
    billingPayments: [],
    incomes: [],
    expenses: [],
    employees: [],
    salaryRecords: [],
    mfAccounts: [],
    mfPayments: [],
    mfUsage: [],

    billingsPage: 1,
    billingsHasMore: true,
    incomesPage: 1,
    incomesHasMore: true,
    expensesPage: 1,
    expensesHasMore: true,
    employeesPage: 1,
    employeesHasMore: true,
    mfUsagePage: 1,
    mfUsageHasMore: true,

    loading: false,
    error: null,
    initialized: false
  });

  const userStore = useUserStore();

  // ... Getters 和 Actions
});
```

#### 2.2.2 Getters 实现

```typescript
// 收入相关 Getters
const totalPropertyFeeIncome = computed(() => {
  return state.value.billings
    .filter(b => b.status === 'paid' || b.status === 'partial')
    .reduce((sum, b) => sum + (b.paid_amount || 0), 0);
});

const totalPublicIncome = computed(() => {
  return state.value.incomes.reduce((sum, i) => sum + i.amount, 0);
});

const totalIncome = computed(() => {
  return totalPropertyFeeIncome.value + totalPublicIncome.value;
});

const incomesByType = computed(() => {
  return state.value.incomes.reduce((acc, income) => {
    const type = income.income_type;
    if (!acc[type]) {
      acc[type] = { count: 0, totalAmount: 0, items: [] };
    }
    acc[type].count += 1;
    acc[type].totalAmount += income.amount;
    acc[type].items.push(income);
    return acc;
  }, {} as Record<string, { count: number; totalAmount: number; items: Income[] }>);
});

// 支出相关 Getters
const totalExpense = computed(() => {
  return state.value.expenses
    .filter(e => e.status === 'approved')
    .reduce((sum, e) => sum + e.amount, 0);
});

const expensesByType = computed(() => {
  return state.value.expenses
    .filter(e => e.status === 'approved')
    .reduce((acc, expense) => {
      const type = expense.expense_type;
      if (!acc[type]) {
        acc[type] = { count: 0, totalAmount: 0, items: [] };
      }
      acc[type].count += 1;
      acc[type].totalAmount += expense.amount;
      acc[type].items.push(expense);
      return acc;
    }, {} as Record<string, { count: number; totalAmount: number; items: Expense[] }>);
});

const salaryExpense = computed(() => {
  return state.value.expenses
    .filter(e => e.expense_type === 'salary' && e.status === 'approved')
    .reduce((sum, e) => sum + e.amount, 0);
});

// 收支平衡
const balance = computed(() => {
  return totalIncome.value - totalExpense.value;
});

// 我的数据（业主视角）
const myBillings = computed(() => {
  const userId = userStore.profile?.id;
  if (!userId) return [];

  return state.value.billings.filter(b => {
    const ownerId = typeof b.owner_id === 'string' ? b.owner_id : b.owner_id?.id;
    return ownerId === userId;
  });
});

const myUnpaidAmount = computed(() => {
  return myBillings.value
    .filter(b => b.status === 'unpaid' || b.status === 'overdue')
    .reduce((sum, b) => sum + (b.billing_amount - (b.paid_amount || 0)), 0);
});

const myPaidAmount = computed(() => {
  return myBillings.value
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + b.paid_amount, 0);
});

const myMFAccount = computed(() => {
  const userId = userStore.profile?.id;
  if (!userId) return null;

  return state.value.mfAccounts.find(acc => {
    const ownerId = typeof acc.owner_id === 'string' ? acc.owner_id : acc.owner_id?.id;
    return ownerId === userId;
  });
});

const myMFBalance = computed(() => {
  return myMFAccount.value?.balance || 0;
});

// 员工相关
const employeesByPosition = computed(() => {
  return state.value.employees
    .filter(e => e.employment_status === 'active')
    .reduce((acc, employee) => {
      const position = employee.position_type;
      if (!acc[position]) {
        acc[position] = { count: 0, employees: [] };
      }
      acc[position].count += 1;
      acc[position].employees.push(employee);
      return acc;
    }, {} as Record<string, { count: number; employees: Employee[] }>);
});

// 逾期账单数量
const overdueCount = computed(() => {
  return state.value.billings.filter(b => b.status === 'overdue').length;
});
```

#### 2.2.3 Actions 实现

##### 查询 Actions

```typescript
// 查询我的账单（业主）
const fetchMyBillings = async (refresh = false): Promise<Billing[]> => {
  if (state.value.loading) return [];

  try {
    // 确保 session 有效
    await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
  } catch (error) {
    throw error;
  }

  const userId = userStore.profile?.id;
  if (!userId) {
    throw new Error('用户未登录');
  }

  state.value.loading = true;
  state.value.error = null;

  if (refresh) {
    state.value.billings = [];
    state.value.billingsPage = 1;
    state.value.billingsHasMore = true;
  }

  try {
    const query: Query<Schema, Billing> = {
      limit: DEFAULT_PAGE_SIZE,
      page: state.value.billingsPage,
      fields: BILLING_FIELDS,
      sort: ['-period', '-date_created'],
      filter: {
        owner_id: { _eq: userId },
        date_deleted: { _null: true }
      }
    };

    const items = await billingsApi.readMany(query);

    if (refresh) {
      state.value.billings = items;
    } else {
      state.value.billings = [...state.value.billings, ...items];
    }

    state.value.billingsPage += 1;
    state.value.billingsHasMore = items.length >= DEFAULT_PAGE_SIZE;
    state.value.initialized = true;

    return items;
  } catch (error) {
    state.value.error = (error as Error)?.message ?? '加载账单失败';
    throw error;
  } finally {
    state.value.loading = false;
  }
};

// 查询某个账单的所有缴费记录
const fetchBillingPayments = async (billingId: string): Promise<BillingPayment[]> => {
  try {
    await userStore.ensureActiveSession({ refreshIfNearExpiry: true });

    const query: Query<Schema, BillingPayment> = {
      fields: BILLING_PAYMENT_FIELDS,
      sort: ['-paid_at'],
      filter: {
        billing_id: { _eq: billingId },
        date_deleted: { _null: true }
      }
    };

    const items = await billingPaymentsApi.readMany(query);

    // 更新 state
    state.value.billingPayments = items;

    return items;
  } catch (error) {
    throw error;
  }
};

// 查询社区公共收入（所有角色）
const fetchCommunityIncomes = async (refresh = false): Promise<Income[]> => {
  if (state.value.loading) return [];

  try {
    await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
  } catch (error) {
    throw error;
  }

  const communityId = userStore.community?.id;
  if (!communityId) {
    throw new Error('小区信息缺失');
  }

  state.value.loading = true;
  state.value.error = null;

  if (refresh) {
    state.value.incomes = [];
    state.value.incomesPage = 1;
    state.value.incomesHasMore = true;
  }

  try {
    const query: Query<Schema, Income> = {
      limit: DEFAULT_PAGE_SIZE,
      page: state.value.incomesPage,
      fields: INCOME_FIELDS,
      sort: ['-income_date', '-date_created'],
      filter: {
        community_id: { _eq: communityId },
        date_deleted: { _null: true }
      }
    };

    const items = await incomesApi.readMany(query);

    if (refresh) {
      state.value.incomes = items;
    } else {
      state.value.incomes = [...state.value.incomes, ...items];
    }

    state.value.incomesPage += 1;
    state.value.incomesHasMore = items.length >= DEFAULT_PAGE_SIZE;

    return items;
  } catch (error) {
    state.value.error = (error as Error)?.message ?? '加载收入记录失败';
    throw error;
  } finally {
    state.value.loading = false;
  }
};

// 查询社区支出（所有角色）
const fetchCommunityExpenses = async (refresh = false): Promise<Expense[]> => {
  if (state.value.loading) return [];

  try {
    await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
  } catch (error) {
    throw error;
  }

  const communityId = userStore.community?.id;
  if (!communityId) {
    throw new Error('小区信息缺失');
  }

  state.value.loading = true;
  state.value.error = null;

  if (refresh) {
    state.value.expenses = [];
    state.value.expensesPage = 1;
    state.value.expensesHasMore = true;
  }

  try {
    const userRole = userStore.profile?.role;

    // 业主只能查看已审核的支出
    const statusFilter = userRole === 'resident'
      ? { status: { _eq: 'approved' } }
      : {};

    const query: Query<Schema, Expense> = {
      limit: DEFAULT_PAGE_SIZE,
      page: state.value.expensesPage,
      fields: EXPENSE_FIELDS,
      sort: ['-paid_at', '-date_created'],
      filter: {
        community_id: { _eq: communityId },
        ...statusFilter,
        date_deleted: { _null: true }
      }
    };

    const items = await expensesApi.readMany(query);

    if (refresh) {
      state.value.expenses = items;
    } else {
      state.value.expenses = [...state.value.expenses, ...items];
    }

    state.value.expensesPage += 1;
    state.value.expensesHasMore = items.length >= DEFAULT_PAGE_SIZE;

    return items;
  } catch (error) {
    state.value.error = (error as Error)?.message ?? '加载支出记录失败';
    throw error;
  } finally {
    state.value.loading = false;
  }
};

// 查询员工列表（物业/业委会）
const fetchEmployees = async (refresh = false): Promise<Employee[]> => {
  if (state.value.loading) return [];

  try {
    await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
  } catch (error) {
    throw error;
  }

  const communityId = userStore.community?.id;
  const userRole = userStore.profile?.role;

  if (!communityId) {
    throw new Error('小区信息缺失');
  }

  // 业主无权查看完整员工信息
  if (userRole === 'resident') {
    throw new Error('无权访问');
  }

  state.value.loading = true;
  state.value.error = null;

  if (refresh) {
    state.value.employees = [];
    state.value.employeesPage = 1;
    state.value.employeesHasMore = true;
  }

  try {
    const query: Query<Schema, Employee> = {
      limit: DEFAULT_PAGE_SIZE,
      page: state.value.employeesPage,
      fields: EMPLOYEE_FIELDS_FULL,
      sort: ['employment_status', 'position_type', 'hire_date'],
      filter: {
        community_id: { _eq: communityId },
        date_deleted: { _null: true }
      }
    };

    const items = await employeesApi.readMany(query);

    if (refresh) {
      state.value.employees = items;
    } else {
      state.value.employees = [...state.value.employees, ...items];
    }

    state.value.employeesPage += 1;
    state.value.employeesHasMore = items.length >= DEFAULT_PAGE_SIZE;

    return items;
  } catch (error) {
    state.value.error = (error as Error)?.message ?? '加载员工列表失败';
    throw error;
  } finally {
    state.value.loading = false;
  }
};
```

##### 创建 Actions（物业管理员）

> **MVP 说明**：以下创建 Actions 在 MVP 阶段**不会在小程序中使用**，物业管理员通过 Directus Admin Panel 直接操作数据库。这些 Actions 保留在 Store 中供 v1.5+ 版本的物业管理 Web 界面使用。

```typescript
// 创建缴费记录（❌ MVP 不用 - 通过 Directus 后台录入）
const createBillingPayment = async (data: Partial<BillingPayment>): Promise<BillingPayment> => {
  try {
    await userStore.ensureActiveSession({ refreshIfNearExpiry: true });

    // 权限校验
    const userRole = userStore.profile?.role;
    if (userRole !== 'property_manager') {
      throw new Error('无权创建缴费记录');
    }

    // 业务校验
    if (!data.billing_id || !data.amount || !data.paid_at) {
      throw new Error('缺少必填字段');
    }

    // 创建记录
    const result = await billingPaymentsApi.createOne(data);

    // 刷新账单列表（触发账单状态更新）
    await fetchMyBillings(true);

    return result;
  } catch (error) {
    throw error;
  }
};

// 创建公共收入
const createIncome = async (data: Partial<Income>): Promise<Income> => {
  try {
    await userStore.ensureActiveSession({ refreshIfNearExpiry: true });

    const userRole = userStore.profile?.role;
    if (userRole !== 'property_manager') {
      throw new Error('无权创建收入记录');
    }

    // 自动填充 community_id
    if (!data.community_id) {
      data.community_id = userStore.community?.id;
    }

    // 自动计算 period
    if (!data.period && data.income_date) {
      data.period = dayjs(data.income_date).format('YYYY-MM');
    }

    const result = await incomesApi.createOne(data);

    // 刷新收入列表
    await fetchCommunityIncomes(true);

    return result;
  } catch (error) {
    throw error;
  }
};

// 创建支出记录
const createExpense = async (data: Partial<Expense>): Promise<Expense> => {
  try {
    await userStore.ensureActiveSession({ refreshIfNearExpiry: true });

    const userRole = userStore.profile?.role;
    if (userRole !== 'property_manager') {
      throw new Error('无权创建支出记录');
    }

    // 自动填充字段
    if (!data.community_id) {
      data.community_id = userStore.community?.id;
    }

    if (!data.period && data.paid_at) {
      data.period = dayjs(data.paid_at).format('YYYY-MM');
    }

    if (!data.created_by) {
      data.created_by = userStore.profile?.id;
    }

    // 默认状态为已审核（MVP 版本）
    if (!data.status) {
      data.status = 'approved';
    }

    const result = await expensesApi.createOne(data);

    // 刷新支出列表
    await fetchCommunityExpenses(true);

    return result;
  } catch (error) {
    throw error;
  }
};

// 创建员工
const createEmployee = async (data: Partial<Employee>): Promise<Employee> => {
  try {
    await userStore.ensureActiveSession({ refreshIfNearExpiry: true });

    const userRole = userStore.profile?.role;
    if (userRole !== 'property_manager') {
      throw new Error('无权创建员工');
    }

    // 自动填充 community_id
    if (!data.community_id) {
      data.community_id = userStore.community?.id;
    }

    // 默认在职
    if (!data.employment_status) {
      data.employment_status = 'active';
    }

    const result = await employeesApi.createOne(data);

    // 刷新员工列表
    await fetchEmployees(true);

    return result;
  } catch (error) {
    throw error;
  }
};

// 批量创建工资记录
const batchCreateSalaryRecords = async (records: Partial<SalaryRecord>[]): Promise<SalaryRecord[]> => {
  try {
    await userStore.ensureActiveSession({ refreshIfNearExpiry: true });

    const userRole = userStore.profile?.role;
    if (userRole !== 'property_manager') {
      throw new Error('无权创建工资记录');
    }

    // 自动填充 community_id
    const communityId = userStore.community?.id;
    records.forEach(record => {
      if (!record.community_id) {
        record.community_id = communityId;
      }
    });

    const results = await salaryRecordsApi.createMany(records);

    // 注意：触发器会自动创建对应的 expenses 记录

    // 刷新工资和支出列表
    await fetchCommunityExpenses(true);

    return results;
  } catch (error) {
    throw error;
  }
};
```

##### 更新 Actions

```typescript
// 更新员工信息（物业）
const updateEmployee = async (id: string, data: Partial<Employee>): Promise<Employee> => {
  try {
    await userStore.ensureActiveSession({ refreshIfNearExpiry: true });

    const userRole = userStore.profile?.role;
    if (userRole !== 'property_manager') {
      throw new Error('无权修改员工信息');
    }

    const result = await employeesApi.updateOne(id, data);

    // 更新 state
    const index = state.value.employees.findIndex(e => e.id === id);
    if (index !== -1) {
      state.value.employees[index] = result;
    }

    return result;
  } catch (error) {
    throw error;
  }
};

// 审批维修基金使用（业委会）
const approveMFUsage = async (
  id: string,
  decision: 'approved' | 'rejected',
  reason?: string
): Promise<MaintenanceFundUsage> => {
  try {
    await userStore.ensureActiveSession({ refreshIfNearExpiry: true });

    const userRole = userStore.profile?.role;
    if (userRole !== 'committee_member') {
      throw new Error('只有业委会成员可以审批');
    }

    // 查询记录确认状态
    const record = await maintenanceFundUsageApi.readOne(id);
    if (record.approval_status !== 'pending') {
      throw new Error('该申请已审批，无法重复审批');
    }

    // 更新审批信息
    const updateData: Partial<MaintenanceFundUsage> = {
      approval_status: decision,
      approved_by: userStore.profile?.id,
      approved_at: new Date().toISOString()
    };

    if (decision === 'rejected' && reason) {
      updateData.rejection_reason = reason;
    }

    const result = await maintenanceFundUsageApi.updateOne(id, updateData);

    // 刷新维修基金使用列表
    await fetchCommunityMFUsage(true);

    return result;
  } catch (error) {
    throw error;
  }
};
```

##### 工具 Actions

```typescript
// 重置 Store（用户登出时调用）
const reset = () => {
  state.value.billings = [];
  state.value.billingPayments = [];
  state.value.incomes = [];
  state.value.expenses = [];
  state.value.employees = [];
  state.value.salaryRecords = [];
  state.value.mfAccounts = [];
  state.value.mfPayments = [];
  state.value.mfUsage = [];

  state.value.billingsPage = 1;
  state.value.billingsHasMore = true;
  state.value.incomesPage = 1;
  state.value.incomesHasMore = true;
  state.value.expensesPage = 1;
  state.value.expensesHasMore = true;
  state.value.employeesPage = 1;
  state.value.employeesHasMore = true;
  state.value.mfUsagePage = 1;
  state.value.mfUsageHasMore = true;

  state.value.initialized = false;
  state.value.loading = false;
  state.value.error = null;
};

// 导出所有内容
return {
  // State (as computed refs)
  billings: computed(() => state.value.billings),
  incomes: computed(() => state.value.incomes),
  expenses: computed(() => state.value.expenses),
  employees: computed(() => state.value.employees),
  loading: computed(() => state.value.loading),
  error: computed(() => state.value.error),
  initialized: computed(() => state.value.initialized),

  // Getters
  totalIncome,
  totalPropertyFeeIncome,
  totalPublicIncome,
  incomesByType,
  totalExpense,
  expensesByType,
  salaryExpense,
  balance,
  myBillings,
  myUnpaidAmount,
  myPaidAmount,
  myMFAccount,
  myMFBalance,
  employeesByPosition,
  overdueCount,

  // Actions
  fetchMyBillings,
  fetchBillingPayments,
  fetchCommunityIncomes,
  fetchCommunityExpenses,
  fetchEmployees,
  fetchMyMFAccount,
  fetchCommunityMFUsage,
  createBillingPayment,
  createIncome,
  createExpense,
  createEmployee,
  batchCreateSalaryRecords,
  updateEmployee,
  approveMFUsage,
  reset
};
```

### 2.3 文件上传实现

```typescript
// src/utils/fileUpload.ts

import { directusClient } from './directus';
import { uploadFiles } from '@directus/sdk';

interface UploadOptions {
  maxSize?: number;        // 最大文件大小（字节），默认 10MB
  allowedTypes?: string[]; // 允许的文件类型
}

export const uploadFile = async (
  filePath: string,
  options: UploadOptions = {}
): Promise<string> => {
  const {
    maxSize = 10 * 1024 * 1024,
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  } = options;

  return new Promise((resolve, reject) => {
    // 获取文件信息
    uni.getFileInfo({
      filePath,
      success: (fileInfo) => {
        // 检查文件大小
        if (fileInfo.size > maxSize) {
          reject(new Error(`文件大小不能超过 ${maxSize / 1024 / 1024}MB`));
          return;
        }

        // 上传文件
        uni.uploadFile({
          url: `${env.directusUrl}/files`,
          filePath,
          name: 'file',
          header: {
            'Authorization': `Bearer ${userStore.accessToken}`
          },
          success: (uploadRes) => {
            if (uploadRes.statusCode === 200) {
              const result = JSON.parse(uploadRes.data);
              resolve(result.data.id);
            } else {
              reject(new Error('上传失败'));
            }
          },
          fail: (error) => {
            reject(error);
          }
        });
      },
      fail: (error) => {
        reject(error);
      }
    });
  });
};

// 批量上传
export const uploadMultipleFiles = async (
  filePaths: string[],
  options?: UploadOptions
): Promise<string[]> => {
  const uploadPromises = filePaths.map(path => uploadFile(path, options));
  return Promise.all(uploadPromises);
};

// 选择并上传图片
export const chooseAndUploadImage = async (
  count = 9,
  options?: UploadOptions
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        try {
          const fileIds = await uploadMultipleFiles(res.tempFilePaths, options);
          resolve(fileIds);
        } catch (error) {
          reject(error);
        }
      },
      fail: reject
    });
  });
};
```

### 2.4 字段标签映射

```typescript
// src/utils/finance-labels.ts

// 收入类型标签
export const incomeTypeLabels: Record<string, string> = {
  advertising: '广告收益',
  parking: '停车收益',
  venue_rental: '场地租赁',
  vending: '自动售货机',
  express_locker: '快递柜',
  recycling: '废品回收',
  other: '其他'
};

// 支出类型标签
export const expenseTypeLabels: Record<string, string> = {
  salary: '员工工资',
  maintenance: '设施维护',
  utilities: '公共能耗',
  materials: '耗材采购',
  activity: '社区活动',
  committee_fund: '业委会经费',
  maintenance_fund: '维修基金使用',
  other: '其他'
};

// 支付方式标签
export const paymentMethodLabels: Record<string, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  bank: '银行转账',
  cash: '现金',
  pos: 'POS机',
  other: '其他'
};

// 账单状态标签
export const billingStatusLabels: Record<string, string> = {
  unpaid: '未缴',
  paid: '已缴',
  partial: '部分已缴',
  overdue: '逾期'
};

// 岗位类型标签
export const positionTypeLabels: Record<string, string> = {
  security: '保安',
  cleaning: '保洁',
  management: '管理人员',
  electrician: '电工',
  plumber: '管道工',
  gardener: '绿化工',
  temp_worker: '临时工',
  other: '其他'
};

// 在职状态标签
export const employmentStatusLabels: Record<string, string> = {
  active: '在职',
  resigned: '离职',
  on_leave: '休假',
  suspended: '停职'
};

// 维修基金使用类型标签
export const mfUsageTypeLabels: Record<string, string> = {
  elevator: '电梯更换/维修',
  exterior_wall: '外墙维修',
  roof: '屋顶防水',
  pipeline: '管道更换',
  fire_system: '消防系统',
  security_system: '安防系统',
  road: '道路维修',
  other: '其他'
};

// 审批状态标签
export const approvalStatusLabels: Record<string, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
  completed: '已完成'
};

// 获取标签（带默认值）
export const getLabel = (
  value: string,
  labelMap: Record<string, string>,
  defaultLabel = '未知'
): string => {
  return labelMap[value] || defaultLabel;
};
```

---

## 3. 代码规范

### 3.1 命名规范

#### 文件命名
- 组件文件：PascalCase（如：`FinanceCard.vue`）
- 工具函数文件：camelCase（如：`fileUtils.ts`）
- Store 文件：camelCase（如：`finance.ts`）
- 类型定义文件：kebab-case（如：`directus-schema.ts`）

#### 变量命名
```typescript
// ✅ 推荐
const userProfile = { ... };
const isLoading = false;
const totalAmount = 1000;
const fetchData = async () => { ... };

// ❌ 不推荐
const UserProfile = { ... };      // 首字母不应大写（除非是类/构造函数）
const loading = false;            // 布尔值应加 is/has/can 前缀
const total = 1000;               // 不够具体
const getData = async () => { ... };  // get 通常用于同步操作
```

#### 组件命名
```vue
<!-- ✅ 推荐 -->
<template>
  <FinanceCard :amount="totalIncome" />
  <ProofViewer :files="proofFiles" />
</template>

<!-- ❌ 不推荐 -->
<template>
  <finance-card :amount="totalIncome" />  <!-- 应使用 PascalCase -->
  <Proof :files="proofFiles" />           <!-- 名称不够具体 -->
</template>
```

### 3.2 TypeScript 规范

#### 类型定义
```typescript
// ✅ 推荐：使用 interface 定义对象类型
interface UserProfile {
  id: string;
  name: string;
  role: 'resident' | 'property_manager' | 'committee_member';
}

// ✅ 推荐：使用 type 定义联合类型、函数类型
type BillingStatus = 'unpaid' | 'paid' | 'partial' | 'overdue';
type FetchFunction = (id: string) => Promise<Billing>;

// ❌ 不推荐：滥用 any
const data: any = { ... };  // 应明确类型

// ✅ 推荐：使用 unknown + 类型守卫
const data: unknown = JSON.parse(response);
if (isValidData(data)) {
  // data 类型已收窄
}
```

#### 函数签名
```typescript
// ✅ 推荐：明确参数和返回值类型
const calculateTotal = (
  amounts: number[],
  discount: number = 0
): number => {
  return amounts.reduce((sum, amt) => sum + amt, 0) - discount;
};

// ❌ 不推荐：缺少类型标注
const calculateTotal = (amounts, discount = 0) => {
  return amounts.reduce((sum, amt) => sum + amt, 0) - discount;
};
```

### 3.3 Vue 组件规范

#### 组件结构顺序
```vue
<script setup lang="ts">
// 1. 导入
import { ref, computed, onMounted } from 'vue';
import { useFinanceStore } from '@/store/finance';

// 2. Props 定义
interface Props {
  amount: number;
  title?: string;
}
const props = withDefaults(defineProps<Props>(), {
  title: '金额'
});

// 3. Emits 定义
const emit = defineEmits<{
  (e: 'update', value: number): void;
}>();

// 4. Store / Composables
const financeStore = useFinanceStore();

// 5. 响应式数据
const count = ref(0);

// 6. 计算属性
const formattedAmount = computed(() => {
  return `¥${props.amount.toFixed(2)}`;
});

// 7. 方法
const handleClick = () => {
  emit('update', count.value);
};

// 8. 生命周期
onMounted(() => {
  console.log('Component mounted');
});
</script>

<template>
  <view class="finance-card">
    <text>{{ title }}</text>
    <text>{{ formattedAmount }}</text>
  </view>
</template>

<style scoped>
.finance-card {
  padding: 32rpx;
}
</style>
```

#### Props 验证
```typescript
// ✅ 推荐：使用 TypeScript 类型 + 默认值
interface Props {
  amount: number;
  status?: 'success' | 'error' | 'warning';
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  status: 'success',
  disabled: false
});
```

### 3.4 ESLint 配置

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  env: {
    node: true,
    'vue/setup-compiler-macros': true
  },
  extends: [
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-typescript/recommended',
    '@vue/eslint-config-prettier'
  ],
  rules: {
    // Vue 规则
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'warn',

    // TypeScript 规则
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],

    // 通用规则
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'prefer-const': 'warn',
    'no-var': 'error'
  }
};
```

---

## 4. 开发工作流

### 4.1 Git 工作流

#### 分支策略
```
main (生产分支)
  └── develop (开发分支)
       ├── feature/finance-overview (功能分支)
       ├── feature/billing-payment-entry
       ├── bugfix/fix-payment-amount-calculation
       └── hotfix/fix-critical-bug
```

#### 分支命名规范
- **功能分支**：`feature/<feature-name>`（如：`feature/maintenance-fund`）
- **Bug 修复**：`bugfix/<bug-description>`（如：`bugfix/fix-overdue-calculation`）
- **紧急修复**：`hotfix/<issue-description>`（如：`hotfix/fix-payment-error`）

#### Commit Message 规范
```bash
# 格式：<type>(<scope>): <subject>

# Type 类型：
# feat: 新功能
# fix: Bug 修复
# docs: 文档更新
# style: 代码格式（不影响功能）
# refactor: 重构
# test: 测试相关
# chore: 构建/工具链相关

# 示例
feat(finance): 添加财务概览页面
fix(billing): 修复缴费金额计算错误
docs(readme): 更新安装说明
refactor(store): 重构 finance store 结构
```

### 4.2 开发流程

#### 1. 创建功能分支
```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
```

#### 2. 开发功能
```bash
# 编写代码
# 运行 lint
npm run lint

# 运行类型检查
npm run type-check

# 本地测试
npm run dev:mp-weixin
```

#### 3. 提交代码
```bash
git add .
git commit -m "feat(finance): 添加我的功能"
git push origin feature/my-feature
```

#### 4. 创建 Pull Request
- 在 GitHub/GitLab 上创建 PR
- 填写 PR 描述：功能说明、测试结果、截图
- 指定 Reviewer
- 等待 Code Review

#### 5. 合并到 develop
```bash
# Reviewer 审核通过后
git checkout develop
git merge --no-ff feature/my-feature
git push origin develop

# 删除功能分支
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

### 4.3 Code Review 清单

**Reviewer 需要检查**：
- [ ] 代码是否符合命名规范
- [ ] TypeScript 类型是否完整
- [ ] 是否有潜在的性能问题（如无限循环、内存泄漏）
- [ ] 错误处理是否完善
- [ ] 是否有安全隐患（如 XSS、SQL 注入）
- [ ] 是否有单元测试（关键逻辑）
- [ ] 是否更新了文档
- [ ] UI 是否符合设计规范

---

## 5. 测试指南

### 5.1 单元测试

#### 测试 Store Getters
```typescript
// tests/unit/store/finance.spec.ts

import { setActivePinia, createPinia } from 'pinia';
import { useFinanceStore } from '@/store/finance';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Finance Store - Getters', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should calculate total income correctly', () => {
    const financeStore = useFinanceStore();

    // 模拟数据
    financeStore.billings = [
      { id: '1', status: 'paid', paid_amount: 800 },
      { id: '2', status: 'paid', paid_amount: 800 }
    ];
    financeStore.incomes = [
      { id: '1', amount: 500 },
      { id: '2', amount: 300 }
    ];

    // 断言
    expect(financeStore.totalPropertyFeeIncome).toBe(1600);
    expect(financeStore.totalPublicIncome).toBe(800);
    expect(financeStore.totalIncome).toBe(2400);
  });

  it('should filter unpaid billings correctly', () => {
    const financeStore = useFinanceStore();

    financeStore.billings = [
      { id: '1', status: 'unpaid', billing_amount: 800, paid_amount: 0 },
      { id: '2', status: 'paid', billing_amount: 800, paid_amount: 800 },
      { id: '3', status: 'overdue', billing_amount: 800, paid_amount: 0 }
    ];

    expect(financeStore.myUnpaidAmount).toBe(1600); // unpaid + overdue
  });
});
```

#### 测试工具函数
```typescript
// tests/unit/utils/finance-labels.spec.ts

import { getLabel, incomeTypeLabels } from '@/utils/finance-labels';
import { describe, it, expect } from 'vitest';

describe('Finance Labels', () => {
  it('should return correct label for valid key', () => {
    const label = getLabel('advertising', incomeTypeLabels);
    expect(label).toBe('广告收益');
  });

  it('should return default label for invalid key', () => {
    const label = getLabel('invalid_key', incomeTypeLabels, '未知类型');
    expect(label).toBe('未知类型');
  });
});
```

### 5.2 集成测试

#### 测试 API 调用
```typescript
// tests/integration/api/billings.spec.ts

import { describe, it, expect, beforeAll } from 'vitest';
import { billingsApi } from '@/utils/directus';

describe('Billings API', () => {
  let testBillingId: string;

  beforeAll(async () => {
    // 创建测试数据
    const billing = await billingsApi.createOne({
      community_id: 'test-community-id',
      owner_id: 'test-owner-id',
      period: '2024-01',
      billing_amount: 800,
      status: 'unpaid'
    });
    testBillingId = billing.id;
  });

  it('should fetch billing by id', async () => {
    const billing = await billingsApi.readOne(testBillingId);
    expect(billing.id).toBe(testBillingId);
    expect(billing.period).toBe('2024-01');
  });

  it('should update billing status', async () => {
    const updated = await billingsApi.updateOne(testBillingId, {
      status: 'paid',
      paid_amount: 800
    });
    expect(updated.status).toBe('paid');
    expect(updated.paid_amount).toBe(800);
  });
});
```

### 5.3 E2E 测试（手动测试清单）

> **MVP 说明**：以下测试用例分为业主端（小程序）和物业端（Directus 后台）。MVP 阶段重点测试业主端小程序功能。

#### ✅ MVP - 业主端测试用例（小程序）

**TC-001：查看财务概览**
1. 以业主身份登录
2. 进入"财务透明"页面
3. 检查是否显示：本月收入、本月支出、本月结余
4. 检查是否显示"我的账单"卡片
5. 检查是否显示"维修基金"卡片
6. 下拉刷新，检查数据是否更新

**TC-002：查看我的账单**
1. 点击"我的账单"入口
2. 检查是否显示账单列表
3. 检查账单状态显示是否正确（未缴/已缴/逾期）
4. 点击某条账单，进入详情页
5. 检查是否显示账单详情和缴费记录
6. 如有凭证图片，点击预览

**TC-003：查看月度账目**
1. 点击"月度账目"入口
2. 检查是否显示本月收支汇总
3. 检查是否显示收入明细列表
4. 检查是否显示支出明细列表
5. 下拉刷新，检查数据是否更新

**TC-004：查看公共收入明细**
1. 点击"公共收入明细"入口
2. 检查是否显示收入列表（广告、停车等）
3. 检查收入类型分类是否正确
4. 点击某条收入，查看详情
5. 如有凭证，点击查看

> **注**：维修基金功能为 v2.0+，MVP 不测试

#### ✅ MVP - 物业端测试用例（Directus 后台）

> **说明**：物业端功能通过 Directus Admin Panel 实现，测试在 Web 端进行

**TC-101：录入缴费记录（Directus）**
1. 登录 Directus Admin Panel (`http://localhost:8055/admin`)
2. 进入 `billing_payments` collection
3. 点击"Create New Item"
4. 选择 `billing_id`（关联账单）
5. 填写缴费金额、缴费时间、支付方式
6. 填写缴费人信息（姓名、电话）
7. 上传凭证文件到 `proof_files` 字段
8. 点击"Save"
9. 进入 `billings` collection，检查对应账单的 `status` 和 `paid_amount` 是否自动更新

**TC-102：录入公共收入（Directus）**
1. 登录 Directus Admin Panel
2. 进入 `incomes` collection
3. 点击"Create New Item"
4. 选择收入类型（income_type）
5. 填写标题、描述、金额、收入日期
6. 上传凭证文件
7. 点击"Save"
8. 在小程序业主端"公共收入明细"页面，检查是否显示新录入的记录

**TC-103：录入支出（Directus）**
1. 登录 Directus Admin Panel
2. 进入 `expenses` collection
3. 点击"Create New Item"
4. 选择支出类型（expense_type）
5. 填写标题、金额、支付日期
6. 上传凭证文件
7. 设置 `status` 为 `approved`
8. 点击"Save"
9. 在小程序业主端"月度账目"页面，检查支出是否正确显示

**TC-104：管理员工（Directus）**
1. 登录 Directus Admin Panel
2. 进入 `employees` collection
3. 点击"Create New Item"创建新员工
4. 填写姓名、岗位类型、入职日期、基本工资
5. 设置 `employment_status` 为 `active`
6. 点击"Save"
7. 检查员工列表是否显示新员工
8. 编辑员工信息，修改岗位或工资
9. 将某员工的 `employment_status` 改为 `resigned`（离职）

**TC-105：录入工资（Directus）**
1. 登录 Directus Admin Panel
2. 进入 `salary_records` collection
3. 点击"Create New Item"
4. 选择员工（employee_id）
5. 填写账期（period: YYYY-MM）
6. 填写工资明细：基本工资、奖金、扣款、社保、公积金
7. 手动计算并填写实发金额（actual_amount）
8. 选择发放日期和方式
9. 点击"Save"
10. 检查 `expenses` collection，确认是否自动生成对应的工资支出记录（expense_type = salary）

#### 🔮 v2.0+ - 业委会端测试用例（暂不测试）

**TC-201：审批维修基金使用**
1. 以业委会成员身份登录
2. 进入"维修基金审批"页面
3. 检查是否显示待审批申请列表
4. 点击某条申请，查看详情
5. 填写审批意见
6. 点击"批准"或"拒绝"
7. 检查是否提示成功
8. 返回列表，检查申请状态是否更新

### 5.4 性能测试

#### 加载性能测试
- **首屏加载时间**：< 2 秒（4G 网络）
- **列表滚动帧率**：> 50 FPS
- **分页加载时间**：< 1 秒

#### 压力测试
- **并发用户数**：500 用户同时在线
- **数据量**：账单 10,000+ 条、支出 5,000+ 条

---

## 6. 部署指南

### 6.1 构建生产版本

```bash
# 1. 安装依赖
npm ci

# 2. 类型检查
npm run type-check

# 3. Lint 检查
npm run lint

# 4. 构建小程序
npm run build:mp-weixin

# 输出目录：dist/build/mp-weixin
```

### 6.2 微信小程序上传

#### 方法 1：使用微信开发者工具
1. 打开微信开发者工具
2. 导入项目：`dist/build/mp-weixin`
3. 点击"上传"
4. 填写版本号和项目备注
5. 上传完成

#### 方法 2：使用 CLI 工具（推荐 CI/CD）
```bash
# 安装 miniprogram-ci
npm install -g miniprogram-ci

# 上传代码
npx miniprogram-ci upload \
  --project-path ./dist/build/mp-weixin \
  --version 1.0.0 \
  --desc "财务透明功能上线" \
  --appid wxXXXXXXXXXXXXXXXX \
  --private-key-path ./private.key
```

### 6.3 Directus 生产环境配置

#### 环境变量
```bash
# .env.production
KEY=<random-key>
SECRET=<random-secret>

# 数据库
DB_CLIENT=pg
DB_HOST=<postgres-host>
DB_PORT=5432
DB_DATABASE=directus_production
DB_USER=<db-user>
DB_PASSWORD=<db-password>

# 公共访问
PUBLIC_URL=https://api.yourdomain.com
CORS_ENABLED=true
CORS_ORIGIN=https://yourdomain.com

# 文件存储
STORAGE_LOCATIONS=s3
STORAGE_S3_DRIVER=s3
STORAGE_S3_KEY=<aws-access-key>
STORAGE_S3_SECRET=<aws-secret-key>
STORAGE_S3_BUCKET=<bucket-name>
STORAGE_S3_REGION=<region>

# 缓存
CACHE_ENABLED=true
CACHE_STORE=redis
REDIS_HOST=<redis-host>
REDIS_PORT=6379

# 邮件（可选）
EMAIL_FROM=noreply@yourdomain.com
EMAIL_TRANSPORT=smtp
EMAIL_SMTP_HOST=<smtp-host>
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=<smtp-user>
EMAIL_SMTP_PASSWORD=<smtp-password>
```

#### Docker 部署
```bash
# docker-compose.prod.yml
version: "3"
services:
  postgres:
    image: postgis/postgis:14-3.2-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: directus_production
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    restart: always

  redis:
    image: redis:7-alpine
    restart: always

  directus:
    image: directus/directus:latest
    ports:
      - 8055:8055
    volumes:
      - directus_uploads:/directus/uploads
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    restart: always

volumes:
  postgres_data:
  directus_uploads:
```

---

## 7. 故障排查

### 7.1 常见问题

#### 问题 1：无法登录 / Token 过期
**症状**：API 请求返回 401 错误
**原因**：Access Token 过期
**解决方案**：
```typescript
// 在 Store Actions 中确保 session 有效
await userStore.ensureActiveSession({ refreshIfNearExpiry: true });
```

#### 问题 2：图片上传失败
**症状**：上传后返回 413 错误
**原因**：文件大小超过限制
**解决方案**：
```bash
# 修改 Directus 配置
FILES_MAX_UPLOAD_SIZE=20MB  # 增加到 20MB
```

#### 问题 3：数据加载缓慢
**症状**：列表加载超过 5 秒
**原因**：未使用索引、查询字段过多
**解决方案**：
1. 检查 SQL 查询是否使用索引：
   ```sql
   EXPLAIN ANALYZE SELECT * FROM billings WHERE owner_id = '...';
   ```
2. 减少查询字段，只查询必要字段
3. 启用 Directus 缓存

#### 问题 4：权限错误
**症状**：业主能看到其他业主的数据
**原因**：权限配置错误
**解决方案**：
```bash
# 重新配置权限
bash scripts/configure-finance-permissions-v2.sh

# 检查权限规则
curl "http://localhost:8055/permissions?filter[role][_eq]=resident" \
  -H "Authorization: Bearer <admin-token>"
```

#### 问题 5：账单状态未更新
**症状**：录入缴费后账单状态仍为"未缴"
**原因**：触发器未生效或逻辑错误
**解决方案**：
1. 检查触发器是否存在：
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_billing_status';
   ```
2. 手动触发状态更新：
   ```sql
   UPDATE billings
   SET paid_amount = (
     SELECT COALESCE(SUM(amount), 0)
     FROM billing_payments
     WHERE billing_id = billings.id
     AND date_deleted IS NULL
   );
   ```

### 7.2 调试技巧

#### 开启 Directus 调试日志
```bash
# .env
LOG_LEVEL=debug
LOG_STYLE=pretty
```

#### 使用 Vue DevTools
```bash
# 安装 Vue DevTools 浏览器插件
# 在微信开发者工具中启用调试模式
```

#### 网络请求调试
```typescript
// 在 directus.ts 中添加请求拦截器
import { createDirectus, rest } from '@directus/sdk';

const directusClient = createDirectus(env.directusUrl)
  .with(rest({
    onRequest: (config) => {
      console.log('Request:', config);
      return config;
    },
    onResponse: (response) => {
      console.log('Response:', response);
      return response;
    }
  }));
```

---

## 8. FAQ

**Q1: 如何添加新的收入类型？**
A: 在 Directus 中修改 `income_type` 枚举，然后在 `finance-labels.ts` 中添加对应标签。

**Q2: 如何实现维修基金自动扣减？**
A: 当维修基金使用申请审批通过后，触发器会自动扣减对应业主的维修基金余额。

**Q3: 业主能否修改自己的账单？**
A: 不能。业主只有只读权限，只有物业管理员可以创建和修改账单。

**Q4: 如何批量生成账单？**
A: 物业管理员可以使用"批量生成账单"功能，选择账期和单价，系统会自动为所有业主生成账单。

**Q5: 如何导出财务报表？**
A: 目前版本暂不支持，计划在 v2.1 版本中添加 Excel 导出功能。

**Q6: 如何处理缴费退款？**
A: 创建一条负金额的缴费记录（amount < 0），系统会自动减少 `paid_amount`。

**Q7: 如何确保数据安全？**
A:
- 所有 API 请求需要 JWT Token 鉴权
- 使用 HTTPS 加密传输
- 敏感信息（身份证、工资）脱敏处理
- 定期备份数据库

**Q8: 如何优化性能？**
A:
- 启用 Directus 缓存（Redis）
- 使用分页加载，避免一次性加载大量数据
- 使用虚拟列表渲染长列表
- 图片使用缩略图

**Q9: 如何测试权限配置？**
A:
```bash
# 以不同角色登录，手动测试
# 或使用 Postman 模拟不同角色的请求
curl "http://localhost:8055/items/billings" \
  -H "Authorization: Bearer <resident-token>"
```

**Q10: 如何回滚数据库？**
A:
```bash
# 从备份恢复
pg_restore -h localhost -U directus -d directus_production backup.sql

# 或使用 Directus Migrations
npx directus database migrate:down
```

---

**文档状态**：✅ 已完成

**版本历史**：

| 版本 | 日期 | 修改人 | 修改内容 |
|------|------|--------|----------|
| v1.0 | 2025-01-XX | 初稿 | 初始版本 |
| v2.0 | 2025-10-13 | Claude | 完善开发文档，增加详细实现方案和测试指南 |
| v2.2 | 2025-10-13 | Claude | **架构调整**：物业端功能使用 Directus 后台，MVP 只开发业主端小程序；更新测试用例为 Directus 后台操作 |
| v2.3 | 2025-10-13 | Claude | **业主缴费调整**：明确 MVP 不包含在线支付功能，业主端仅展示账单和缴费记录 |

**维护责任**：开发团队

**更新频率**：随项目迭代更新

**反馈渠道**：GitHub Issues / 项目内部 Wiki

**下一步行动**：
1. 创建数据库表和权限配置（使用提供的脚本）
2. 实现业主端 5 个小程序页面
3. 配置 Directus Admin Panel 供物业人员使用
4. 进行端到端测试
