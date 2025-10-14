# 财务透明功能 - 架构图

> 使用 Mermaid 图表展示系统架构，可在 GitHub/GitLab 中直接预览

---

## 系统架构全景图

```mermaid
graph TB
    User[👤 用户<br/>兰亭雅苑居民] -->|访问| Page[📱 财务透明页面<br/>finance-v2.vue]

    Page -->|调用| Store[📦 Pinia Store<br/>finance.ts]

    Store -->|REST API| Directus[🔌 Directus API<br/>localhost:8055]

    Directus -->|查询| DB[(🗄️ PostgreSQL<br/>财务数据)]

    DB -->|表| BP[billing_payments<br/>物业费实收]
    DB -->|表| Inc[incomes<br/>公共收益]
    DB -->|表| Exp[expenses<br/>支出记录]

    style User fill:#e1f5ff
    style Page fill:#fff3e0
    style Store fill:#f3e5f5
    style Directus fill:#e8f5e9
    style DB fill:#fce4ec
```

---

## 数据流向图

```mermaid
sequenceDiagram
    participant U as 👤 用户
    participant P as 📱 页面<br/>(finance-v2.vue)
    participant S as 📦 Store<br/>(finance.ts)
    participant API as 🔌 Directus API
    participant DB as 🗄️ Database

    U->>P: 1. 选择月份<br/>(1-10月)
    P->>P: 2. 生成 periods<br/>['2025-01', '2025-02', ...]
    P->>S: 3. calculateFinancialSummary(periods)

    par 并行请求
        S->>API: fetchBillingPaymentsByPeriods()
        API->>DB: SELECT * FROM billing_payments<br/>WHERE period IN (...)
        DB-->>API: 返回 40 条记录
        API-->>S: BillingPayment[]
    and
        S->>API: fetchIncomesByPeriods()
        API->>DB: SELECT * FROM incomes<br/>WHERE period IN (...)
        DB-->>API: 返回 40 条记录
        API-->>S: Income[]
    and
        S->>API: fetchExpensesByPeriods()
        API->>DB: SELECT * FROM expenses<br/>WHERE period IN (...) AND status='approved'
        DB-->>API: 返回 40 条记录
        API-->>S: Expense[]
    end

    S->>S: 4. 计算汇总<br/>总收入 = 物业费 + 公共收益<br/>总支出 = Σ expenses<br/>结余 = 总收入 - 总支出
    S-->>P: 5. 返回汇总数据
    P->>P: 6. 更新 UI<br/>(Vue 响应式)
    P-->>U: 7. 显示结果<br/>总收入 ¥270,246.00
```

---

## 数据库 ER 图

```mermaid
erDiagram
    communities ||--o{ billings : "has"
    communities ||--o{ billing_payments : "has"
    communities ||--o{ incomes : "has"
    communities ||--o{ expenses : "has"

    billings ||--o{ billing_payments : "paid_by"
    directus_users ||--o{ billings : "owns"
    directus_users ||--o{ billing_payments : "pays"

    communities {
        uuid id PK
        string name
        string address
    }

    billings {
        uuid id PK
        uuid community_id FK
        uuid owner_id FK
        string period "YYYY-MM"
        decimal billing_amount
        string status
    }

    billing_payments {
        uuid id PK
        uuid billing_id FK
        uuid community_id FK
        uuid owner_id FK
        string period "YYYY-MM 继承自 billing"
        decimal amount
        timestamp paid_at
    }

    incomes {
        uuid id PK
        uuid community_id FK
        string income_type "parking|advertising|..."
        string period "YYYY-MM"
        decimal amount
        timestamp income_date
    }

    expenses {
        uuid id PK
        uuid community_id FK
        string expense_type "salary|utilities|..."
        string period "YYYY-MM"
        decimal amount
        string status "approved|pending|rejected"
        timestamp paid_at
    }
```

---

## Store 方法调用关系图

```mermaid
graph LR
    A[calculateFinancialSummary] --> B[fetchBillingPaymentsByPeriods]
    A --> C[fetchIncomesByPeriods]
    A --> D[fetchExpensesByPeriods]

    B --> E[billingPaymentsApi.readMany]
    C --> F[incomesApi.readMany]
    D --> G[expensesApi.readMany]

    E --> H{检查响应格式}
    F --> H
    G --> H

    H -->|Array.isArray| I[✅ 返回数组]
    H -->|!Array.isArray| J[⚠️ 返回空数组]

    I --> K[计算总收入/总支出]
    J --> K

    K --> L[返回汇总数据]

    style A fill:#e3f2fd
    style K fill:#c8e6c9
    style H fill:#fff3e0
    style J fill:#ffcdd2
```

---

## 页面组件结构图

```mermaid
graph TB
    Root[finance-v2.vue] --> Nav[up-navbar<br/>导航栏]
    Root --> Loading[up-loading-page<br/>加载遮罩]
    Root --> MonthSelector[月份选择器]
    Root --> Summary[汇总卡片]
    Root --> Tabs[up-subsection<br/>收入/支出切换]
    Root --> List[明细列表]
    Root --> Empty[up-empty<br/>空状态]

    MonthSelector --> Checkboxes[up-checkbox-group<br/>1-12月复选框]

    Summary --> Balance[结余显示]
    Summary --> Grid[up-grid<br/>总支出/总收入/环比]

    List --> CellGroup[up-cell-group]
    CellGroup --> Cell1[up-cell<br/>停车费 ¥14,217 5.3%]
    CellGroup --> Cell2[up-cell<br/>广告收益 ¥4,370 1.6%]
    CellGroup --> Cell3[up-cell<br/>...]

    Cell1 --> Icon1[🅿️ 图标]
    Cell1 --> Progress1[up-line-progress<br/>进度条]

    style Root fill:#e3f2fd
    style Summary fill:#c8e6c9
    style List fill:#fff3e0
```

---

## 权限控制流程图

```mermaid
flowchart TD
    Start([用户访问财务页面]) --> CheckLogin{是否登录?}

    CheckLogin -->|否| ShowLogin[显示登录页]
    CheckLogin -->|是| CheckCommunity{是否有 community_id?}

    CheckCommunity -->|否| ShowError[显示错误:<br/>无法获取社区信息]
    CheckCommunity -->|是| FetchData[调用 API 获取数据]

    FetchData --> DirectusCheck{Directus 权限检查}

    DirectusCheck -->|无权限| Return403[返回 403 Forbidden]
    DirectusCheck -->|有权限| ApplyFilter[应用 community_id 过滤器]

    ApplyFilter --> QueryDB[(查询数据库)]
    QueryDB --> ReturnData[返回数据]

    Return403 --> ShowError
    ReturnData --> RenderUI[渲染 UI]

    RenderUI --> End([显示财务数据])
    ShowLogin --> End
    ShowError --> End

    style CheckLogin fill:#fff3e0
    style DirectusCheck fill:#fff3e0
    style Return403 fill:#ffcdd2
    style End fill:#c8e6c9
```

---

## 数据聚合逻辑图

```mermaid
graph TD
    A[原始数据] --> BP[billing_payments<br/>40条记录]
    A --> Inc[incomes<br/>40条记录]
    A --> Exp[expenses<br/>40条记录]

    BP --> PF[物业费实收<br/>Σ amount]
    Inc --> PI[公共收益<br/>Σ amount]
    Exp --> TE[总支出<br/>Σ amount where status='approved']

    PF --> TI[总收入<br/>= 物业费 + 公共收益]
    PI --> TI

    TI --> Balance[结余<br/>= 总收入 - 总支出]
    TE --> Balance

    Inc --> GroupIncome[按类型分组收入<br/>parking: ¥14,217<br/>advertising: ¥4,370<br/>...]
    Exp --> GroupExpense[按类型分组支出<br/>salary: ¥230,000<br/>utilities: ¥10,000<br/>...]

    GroupIncome --> Percent1[计算百分比<br/>parking: 5.3%<br/>advertising: 1.6%]
    GroupExpense --> Percent2[计算百分比<br/>salary: 91.2%<br/>utilities: 4.0%]

    style A fill:#e3f2fd
    style TI fill:#c8e6c9
    style TE fill:#ffcdd2
    style Balance fill:#fff3e0
```

---

## 测试数据生成流程图

```mermaid
flowchart TD
    Start([运行 generate-test-data-2025.js]) --> Loop{遍历 1-10 月}

    Loop -->|当前月份| CreateBillings[生成 4 条 billings<br/>每个业主一条]

    CreateBillings --> CreatePayments[生成 4 条 billing_payments<br/>80% 当月缴费<br/>20% 下月缴费]

    CreatePayments --> CreateIncomes[生成 4 条 incomes<br/>停车费、广告、快递柜、场地]

    CreateIncomes --> CreateExpenses[生成 4 条 expenses<br/>工资、水电、维修、物料]

    CreateExpenses --> NextMonth{还有下个月?}

    NextMonth -->|是| Loop
    NextMonth -->|否| Summary[输出统计信息]

    Summary --> End([完成<br/>160 条记录])

    style Start fill:#e3f2fd
    style CreateBillings fill:#fff3e0
    style CreatePayments fill:#c8e6c9
    style CreateIncomes fill:#f0f4c3
    style CreateExpenses fill:#ffcdd2
    style End fill:#c8e6c9
```

---

## 常见问题排查流程图

```mermaid
flowchart TD
    Problem([页面显示 ¥0.00]) --> Check1{Directus 是否启动?}

    Check1 -->|否| Fix1[启动 Docker Compose]
    Check1 -->|是| Check2{是否有测试数据?}

    Check2 -->|否| Fix2[运行 generate-test-data-2025.js]
    Check2 -->|是| Check3{用户是否登录?}

    Check3 -->|否| Fix3[登录系统]
    Check3 -->|是| Check4{community_id 是否正确?}

    Check4 -->|否| Fix4[检查用户 profile 数据]
    Check4 -->|是| Check5{权限是否配置?}

    Check5 -->|否| Fix5[运行权限配置脚本]
    Check5 -->|是| Check6{浏览器是否缓存?}

    Check6 -->|是| Fix6[硬刷新页面<br/>Cmd+Shift+R]
    Check6 -->|否| Check7{API 响应格式正确?}

    Check7 -->|否| Fix7[修复 Store 方法<br/>检查 Array.isArray]
    Check7 -->|是| Debug[打开控制台调试<br/>检查网络请求]

    Fix1 --> Retry([重新测试])
    Fix2 --> Retry
    Fix3 --> Retry
    Fix4 --> Retry
    Fix5 --> Retry
    Fix6 --> Retry
    Fix7 --> Retry
    Debug --> Retry

    Retry --> Success{问题解决?}
    Success -->|是| End([✅ 完成])
    Success -->|否| Problem

    style Problem fill:#ffcdd2
    style End fill:#c8e6c9
    style Debug fill:#fff3e0
```

---

## 部署架构图

```mermaid
graph TB
    subgraph "生产环境"
        LB[负载均衡器<br/>Nginx]

        subgraph "前端服务"
            FE1[uniapp 实例 1]
            FE2[uniapp 实例 2]
        end

        subgraph "后端服务"
            BE1[Directus 实例 1]
            BE2[Directus 实例 2]
        end

        subgraph "数据层"
            DB[(PostgreSQL<br/>主从复制)]
            Redis[(Redis<br/>缓存)]
        end
    end

    User[用户] --> LB
    LB --> FE1
    LB --> FE2

    FE1 --> BE1
    FE2 --> BE2

    BE1 --> Redis
    BE2 --> Redis

    BE1 --> DB
    BE2 --> DB

    style User fill:#e1f5ff
    style LB fill:#fff3e0
    style DB fill:#c8e6c9
    style Redis fill:#ffcdd2
```

---

## 技术栈依赖图

```mermaid
graph LR
    subgraph "前端"
        Vue[Vue 3] --> Pinia[Pinia]
        Vue --> Uniapp[uniapp]
        Uniapp --> Uview[uview-plus]
    end

    subgraph "通信层"
        Pinia --> DirectusSDK[Directus SDK]
    end

    subgraph "后端"
        DirectusSDK --> Directus[Directus CMS]
        Directus --> PG[(PostgreSQL)]
    end

    subgraph "开发工具"
        TS[TypeScript] --> Vue
        Vite[Vite] --> Vue
    end

    style Vue fill:#42b883
    style Pinia fill:#ffd859
    style Directus fill:#6644ff
    style PG fill:#336791
```

---

## 使用说明

这些图表使用 [Mermaid](https://mermaid.js.org/) 语法编写，可以在以下环境中直接渲染：

- ✅ GitHub / GitLab（原生支持）
- ✅ VS Code（安装 Mermaid 插件）
- ✅ Notion / Obsidian（安装插件）
- ✅ 在线编辑器：https://mermaid.live/

---

## 相关文档

- [完整开发文档](./finance-transparency-v2.md)
- [快速上手指南](./FINANCE_QUICKSTART.md)
- [测试数据说明](../tasks/billing/test-data-summary.md)
