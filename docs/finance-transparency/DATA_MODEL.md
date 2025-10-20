# 财务透明功能 - 数据模型关系文档

## 📊 核心表关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                         财务数据模型关系                         │
└─────────────────────────────────────────────────────────────────┘

收入（Income）                            支出（Expense）
├── 物业费实收                            ├── 工资支出 ─┐
│   ├── billings (应收账单)               │   ├── salary_records
│   │   ├── id (UUID)                     │   │   ├── id (UUID)
│   │   ├── community_id → communities    │   │   ├── employee_id → employees
│   │   ├── owner_id → directus_users     │   │   ├── period (YYYY-MM)
│   │   ├── period (YYYY-MM)              │   │   ├── actual_amount
│   │   ├── amount (应收金额)             │   │   └── expense_id → expenses (自动)
│   │   ├── is_paid (是否已缴) ✅         │   │
│   │   └── paid_at (缴费时间)            │   └── employees (员工信息)
│   │                                     │       ├── id (UUID)
│   └── billing_payments (缴费记录)       │       ├── name
│       ├── id (UUID)                     │       ├── position_type
│       ├── owner_id → directus_users     │       ├── employment_status
│       ├── amount (实收金额)             │       └── base_salary
│       ├── paid_at (缴费时间)            │
│       └── paid_periods (缴纳月份) ✅    ├── 其他支出
│                                         │   └── expenses (支出记录)
└── 公共收益                              │       ├── id (UUID)
    └── incomes (公共收益记录)            │       ├── community_id → communities
        ├── id (UUID)                     │       ├── expense_type (类型)
        ├── community_id → communities    │       ├── amount (金额)
        ├── income_type (类型)            │       ├── paid_at (支付时间)
        ├── amount (金额)                 │       ├── period (YYYY-MM)
        ├── income_date (收入日期)        │       └── status (审核状态)
        └── period (YYYY-MM)              │
                                          └── 维修基金支出 (v2.5+)
```

---

## 📋 核心表详解

### 1. billings（物业费账单 - 应收）

**用途：** 记录物业费账单，表示"每月应该收多少钱"

**设计理念：** 每年年初为所有业主生成12条月度账单，缴费时更新对应月份的`is_paid`状态

**关键字段：**
```typescript
{
  id: string;                  // UUID主键
  community_id: string;        // 社区ID (UUID)
  building_id: string;         // 楼栋ID (UUID, 可选)
  owner_id: string;            // 业主ID (UUID, directus_users)
  period: string;              // 账期 "2025-01"
  amount: number;              // 应缴金额 800
  is_paid: boolean;            // 是否已缴 false
  paid_at: timestamp;          // 缴费时间（从billing_payments继承）
  area: number;                // 计费面积 100
  unit_price: number;          // 单价（元/m²）8.0
  due_date: timestamp;         // 应缴截止日期 "2025-01-25"
  notes: string;               // 备注
  date_deleted: timestamp;     // 软删除
}
```

**重要说明：**
- ✅ 简化设计：只用`is_paid`布尔值，不需要`paid_amount`和`status`字段
- ✅ 账单独立：每月一条，状态清晰
- ✅ FIFO原则：缴费必须从最早的未缴月份开始

---

### 2. billing_payments（物业费缴费记录 - 实收明细）

**用途：** 记录每次缴费的详细信息，包括金额、时间、方式、凭证等

**设计理念：** 一次缴费可以缴纳多个月，通过`paid_periods`字段明确记录缴了哪几个月

**关键字段：**
```typescript
{
  id: string;                  // UUID主键
  owner_id: string;            // 业主ID (UUID)
  community_id: string;        // 社区ID (UUID)
  amount: number;              // 缴费金额 3200
  paid_at: timestamp;          // 缴费时间 "2025-05-15T10:30:00Z"
  payment_method: string;      // 支付方式 "wechat|alipay|bank|cash|other"
  transaction_no: string;      // 交易单号 "WX202505151030001"
  paid_periods: JSON;          // ✅ 关键字段：缴了哪几个月 ["2025-01","2025-02","2025-03","2025-04"]
  payer_name: string;          // 缴费人姓名
  payer_phone: string;         // 缴费人电话
  proof_files: JSON;           // ✅ Directus文件UUID数组 ["file-uuid-1","file-uuid-2"]
  notes: string;               // 备注 "小程序在线支付"
  date_deleted: timestamp;     // 软删除
}
```

**关键设计决策：**

1. **✅ 保留 `paid_periods` 字段的原因：**
   - 明确记录每笔缴费对应的月份
   - 支持物业费调价场景（不同月份不同单价）
   - 财务对账清晰（"5月15日缴的钱是哪几个月？"一目了然）
   - 数据完整性强（不需要反推计算）

2. **✅ 没有 `billing_id` 外键：**
   - 一次缴费对应多个billing（不是1对1关系）
   - 通过`paid_periods`间接关联
   - 降低数据库复杂度

3. **✅ `proof_files` 存储Directus文件UUID：**
   - 上传文件后获得UUID
   - 存储为JSON数组：`["uuid-1", "uuid-2"]`
   - 查询时通过`fields: ['proof_files.*']`自动展开文件信息

**示例：**
```json
// 场景：业主5月缴纳4个月物业费（1-4月）

// billing_payments（1条记录）
{
  "id": "payment-uuid",
  "owner_id": "owner-uuid",
  "amount": 3200,
  "paid_at": "2025-05-15T10:30:00Z",
  "payment_method": "wechat",
  "paid_periods": ["2025-01", "2025-02", "2025-03", "2025-04"],
  "proof_files": ["file-uuid-1", "file-uuid-2"],
  "notes": "小程序在线支付"
}

// billings（4条记录更新）
[
  { "period": "2025-01", "amount": 800, "is_paid": false } → is_paid: true ✅
  { "period": "2025-02", "amount": 800, "is_paid": false } → is_paid: true ✅
  { "period": "2025-03", "amount": 800, "is_paid": false } → is_paid: true ✅
  { "period": "2025-04", "amount": 800, "is_paid": false } → is_paid: true ✅
]
```

---

### 3. incomes（公共收益）

**用途：** 记录社区公共收益（广告、停车、场地租赁等）

**关键字段：**
```typescript
{
  id: string;                  // UUID主键
  community_id: string;        // 社区ID (UUID)
  income_type: string;         // 收入类型
  title: string;               // 收入标题 "2025-01月停车费"
  description: string;         // 详细说明
  amount: number;              // 收入金额 1500
  income_date: timestamp;      // 收入日期 "2025-01-20"
  period: string;              // 账期 "2025-01"（用于月度汇总）
  payment_method: string;      // 支付方式
  transaction_no: string;      // 交易流水号
  related_info: JSON;          // 关联信息（广告商、车位号等）
  proof_files: JSON;           // 凭证文件UUID数组
  notes: string;               // 备注
  date_deleted: timestamp;     // 软删除
}
```

**收入类型（income_type）：**
```typescript
type IncomeType =
  | 'advertising'      // 广告收益
  | 'parking'          // 停车费
  | 'venue_rental'     // 场地租赁
  | 'vending'          // 自动售货
  | 'express_locker'   // 快递柜
  | 'recycling'        // 废品回收
  | 'other';           // 其他
```

---

### 4. expenses（支出记录）

**用途：** 记录所有类型的支出

**关键字段：**
```typescript
{
  id: string;                  // UUID主键
  community_id: string;        // 社区ID (UUID)
  expense_type: string;        // 支出类型
  title: string;               // 支出标题 "2025-01月水电费"
  description: string;         // 详细说明
  amount: number;              // 支出金额 1200
  paid_at: timestamp;          // 支付时间 "2025-01-18"
  period: string;              // 账期 "2025-01"
  payment_method: string;      // 支付方式
  category: string;            // 分类
  related_info: JSON;          // 关联信息
  status: string;              // 审核状态 "pending|approved|rejected"
  approved_by: string;         // 审批人ID (UUID)
  approved_at: timestamp;      // 审批时间
  created_by: string;          // 创建人ID (UUID)
  proof_files: JSON;           // 凭证文件UUID数组
  date_deleted: timestamp;     // 软删除
}
```

**支出类型（expense_type）：**
```typescript
type ExpenseType =
  | 'salary'            // 工资（关联salary_records）
  | 'maintenance'       // 维修费用
  | 'utilities'         // 水电费
  | 'materials'         // 物料采购
  | 'activity'          // 活动经费
  | 'committee_fund'    // 业委会经费 (v2.8+)
  | 'maintenance_fund'  // 维修基金 (v2.5+)
  | 'other';            // 其他
```

**注意：** MVP阶段，业主只能查看`status='approved'`的支出

---

### 5. employees（员工信息）

**用途：** 记录社区员工基本信息

**关键字段：**
```typescript
{
  id: string;                  // UUID主键
  community_id: string;        // 社区ID (UUID)
  name: string;                // 姓名 "张三"
  phone: string;               // 电话
  id_card_last4: string;       // 身份证后4位（隐私保护）
  position_type: string;       // 岗位类型 "security"
  position_title: string;      // 职位名称 "保安队长"
  employment_status: string;   // 在职状态 "active"
  hire_date: date;             // 入职日期
  resignation_date: date;      // 离职日期
  base_salary: number;         // 基本工资 5500
  notes: string;               // 备注
  date_deleted: timestamp;     // 软删除
}
```

**岗位类型（position_type）：**
```typescript
type PositionType =
  | 'security'        // 保安
  | 'cleaning'        // 保洁
  | 'management'      // 管理人员
  | 'electrician'     // 电工
  | 'plumber'         // 水工
  | 'gardener'        // 绿化工
  | 'temp_worker'     // 临时工
  | 'other';          // 其他
```

**在职状态（employment_status）：**
- `active`: 在职
- `resigned`: 离职
- `suspended`: 停职
- `probation`: 试用

**隐私保护：** 员工工资信息对业主不可见，只显示工资总支出

---

### 6. salary_records（工资发放记录）

**用途：** 记录员工工资发放明细

**关键字段：**
```typescript
{
  id: string;                  // UUID主键
  employee_id: string;         // 员工ID (UUID) → employees
  community_id: string;        // 社区ID (UUID)
  period: string;              // 工资月份 "2025-01"
  base_salary: number;         // 基本工资 5500
  bonus: number;               // 奖金 500
  subsidy: number;             // 补贴 0
  deduction: number;           // 扣款 0
  social_security: number;     // 社保 200
  housing_fund: number;        // 公积金 200
  actual_amount: number;       // 实发金额 5600
  payment_date: timestamp;     // 发放日期
  payment_method: string;      // 发放方式
  expense_id: string;          // 关联支出记录ID（自动创建）
  proof_files: JSON;           // 凭证文件UUID数组
}
```

**计算公式：**
```
actual_amount = base_salary + bonus + subsidy - deduction - social_security - housing_fund
```

**自动化逻辑：**
- 创建salary_record时，系统自动创建对应的expense记录
- expense记录的`expense_type='salary'`，`amount=actual_amount`

---

## 🔄 数据流转关系

### 物业费收入流程

```
1. 年初初始化
   └─> 为所有业主生成12条billings（2025-01 ~ 2025-12）
       └─> is_paid = false

2. 业主缴费（FIFO原则）
   └─> 选择缴纳月数（如4个月）
       └─> 自动选择最早的未缴月份（1、2、3、4月）
           └─> 计算总额：800 × 4 = 3200元

3. 支付成功
   ├─> 批量更新billings（4条记录）
   │   └─> UPDATE billings SET is_paid=true, paid_at=now()
   │       WHERE id IN (uuid-1, uuid-2, uuid-3, uuid-4)
   │
   └─> 创建billing_payments（1条记录）
       └─> INSERT billing_payments VALUES (
             amount: 3200,
             paid_periods: ["2025-01","2025-02","2025-03","2025-04"],
             proof_files: ["file-uuid-1","file-uuid-2"]
           )

4. 财务统计
   └─> 物业费实收 = SUM(billings.amount WHERE is_paid=true AND period='2025-01')
   └─> 或者：物业费实收 = SUM(billing_payments.amount WHERE '2025-01' IN paid_periods)
```

### 公共收益流程

```
1. 物业录入公共收益
   └─> incomes表
       └─> 设置income_type、amount、period

2. 财务统计
   └─> 公共收益 = SUM(incomes.amount WHERE period='2025-01')
```

### 工资支出流程

```
1. 创建员工信息
   └─> employees表

2. 发放工资
   └─> salary_records表
       ├─> employee_id → employees
       ├─> 计算actual_amount
       └─> 自动创建expense记录
           └─> expenses表 (expense_type='salary')

3. 财务统计
   └─> 工资支出 = SUM(expenses.amount WHERE expense_type='salary' AND period='2025-01')
```

### 其他支出流程

```
1. 物业录入支出
   └─> expenses表
       ├─> 设置expense_type（utilities、maintenance等）
       ├─> 设置amount、period
       └─> status默认为'approved' (MVP阶段)

2. 财务统计
   └─> 其他支出 = SUM(expenses.amount WHERE expense_type!='salary' AND status='approved' AND period='2025-01')
```

---

## 📊 财务统计逻辑

### 总收入计算

```typescript
总收入 = 物业费实收 + 公共收益

// 方式1：从billings统计
物业费实收 = SUM(billings.amount WHERE is_paid=true AND period IN [selected_periods])

// 方式2：从billing_payments统计（推荐，更准确）
物业费实收 = SUM(billing_payments.amount WHERE paid_periods 包含 [selected_periods])

公共收益 = SUM(incomes.amount WHERE period IN [selected_periods])
```

### 总支出计算

```typescript
总支出 = SUM(expenses.amount WHERE period IN [selected_periods] AND status='approved')
```

### 结余计算

```typescript
结余 = 总收入 - 总支出
```

---

## 🎯 权责发生制会计

**核心原则：** 按照`period`字段（账期）归属，而非实际支付时间

**示例：**

| 记录类型 | period | paid_at/income_date | 归属月份 |
|---------|--------|---------------------|---------|
| billing_payment | ["2025-01"] | 2025-02-10 | 2025-01 |
| income | 2025-01 | 2025-01-20 | 2025-01 |
| expense | 2025-01 | 2025-01-25 | 2025-01 |

**好处：**
- 按月度准确统计财务状况
- 避免跨月支付导致的统计混乱
- 符合会计准则

---

## 🔗 外键关系总结

```
billings
├─> community_id → communities
├─> building_id → buildings
└─> owner_id → directus_users

billing_payments（无外键关联billings，通过paid_periods间接关联）
├─> community_id → communities
└─> owner_id → directus_users

incomes
└─> community_id → communities

expenses
├─> community_id → communities
├─> created_by → directus_users
└─> approved_by → directus_users

employees
└─> community_id → communities

salary_records
├─> employee_id → employees
├─> community_id → communities
└─> expense_id → expenses (自动创建)
```

---

## 📝 业务规则

### 物业费缴纳规则（FIFO原则）

1. **必须从前往后缴费**
   - ✅ 正确：欠1、2、3、4、5月，缴4个月 → 缴1、2、3、4月
   - ❌ 错误：欠1、2、3、4、5月，缴4个月 → 跳过1月，缴2、3、4、5月

2. **必须整月缴纳**
   - ✅ 最少缴1个月
   - ✅ 必须是月份的整数倍
   - ❌ 不支持部分月份（MVP阶段）

3. **自动按顺序选择**
   - 前端只需要选择"缴几个月"
   - 系统自动选择最早的N个未缴月份
   - 不允许手动勾选具体月份

### 物业费调价场景

```
场景：2025年7月物业费从800元/月调整为850元/月

数据：
- billings（2025-01 ~ 2025-06）: amount = 800
- billings（2025-07 ~ 2025-12）: amount = 850

缴费示例（业主8月缴6个月）：
- 缴纳月份：1、2、3、4、5、6月
- 总额：800 × 6 = 4800元
- paid_periods: ["2025-01","2025-02","2025-03","2025-04","2025-05","2025-06"]

查询方便：
- "8月15日缴的4800元是哪几个月？"
- 直接查看paid_periods字段即可 ✅
```

---

## 🚀 MVP范围确认

### ✅ MVP阶段包含的表（6张）

1. **billings** - 物业费账单
2. **billing_payments** - 物业费缴费记录
3. **incomes** - 公共收益
4. **expenses** - 支出记录
5. **employees** - 员工信息
6. **salary_records** - 工资发放记录

### 🔮 v2.5+ 阶段的表（3张）

7. **maintenance_fund_accounts** - 维修基金账户
8. **maintenance_fund_payments** - 维修基金缴纳
9. **maintenance_fund_usage** - 维修基金使用

---

## 📌 重要设计决策总结

| 设计点 | 决策 | 原因 |
|--------|------|------|
| **billings字段** | 只用`is_paid`，不用`paid_amount`和`status` | 简化逻辑，一个月只有缴/未缴两种状态 |
| **billing_payments外键** | 没有`billing_id`字段 | 一次缴费对应多个月，不是1对1关系 |
| **paid_periods字段** | ✅ 必须保留 | 物业费调价时必需，财务对账清晰 |
| **proof_files字段** | Directus文件UUID数组 | 标准的Directus文件存储方式 |
| **缴费顺序** | FIFO原则（从前往后） | 符合物业费缴纳的实际业务规则 |
| **所有ID** | 使用UUID | Directus最佳实践，支持分布式 |
| **触发器/Flow** | ❌ 不使用 | 逻辑在前端/后端代码中，更灵活可控 |

---

## 📖 相关文档

- [数据导入指南](./DATA_IMPORT_GUIDE.md) - 测试数据导入方法
- [产品需求文档](./PRD.md) - 完整的业务需求
- [开发文档](./DEVELOPMENT.md) - 技术实现细节
- [v2.0功能文档](../features/finance-transparency-v2.md) - 功能说明

---

**最后更新：** 2025-10-18
**维护者：** 开发团队
