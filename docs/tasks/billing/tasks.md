# 任务清单 - 财务透明功能 v2.0

## 任务组织说明

- **阶段划分**：Phase 1 数据层 → Phase 2 Store 层 → Phase 3 UI 层
- **小步前进**：每个任务独立可验证
- **优先级**：P0（必须）> P1（重要）> P2（可选）
- **状态标识**：
  - ✅ 已完成
  - 🚧 进行中
  - ⏸️ 已暂停
  - ⏳ 待开始
  - ❌ 已取消

---

## Phase 0: 准备工作

### Task 0.1: 数据清理和迁移准备 ⏳
**需求关联**: 基础设施
**描述**: 清理旧的 v1.0 数据表，准备迁移到 v2.0
**验收标准**:
- [ ] 备份现有 billings 和 expenses 表数据
- [ ] 创建数据迁移脚本文档
- [ ] 确认是否有生产数据需要迁移
- [ ] 与团队确认删除旧表的时间窗口

**预计工时**: 2小时
**优先级**: P0

---

### Task 0.2: 更新工单系统枚举 ⏳
**需求关联**: US-CM2（维修基金审批）
**描述**: 在工单系统中新增维修基金申请类型
**验收标准**:
- [ ] 在 work_orders 表的 type 枚举中添加 `maintenance_fund_application`
- [ ] 更新 TypeScript 类型定义
- [ ] 更新工单创建表单（支持新类型）
- [ ] 验证工单流程正常工作

**文件涉及**:
- `docs/betterhome.dbml`
- `src/@types/directus-schema.d.ts`

**预计工时**: 1小时
**优先级**: P0

---

## Phase 1: 数据层建设（v2.0 架构）

### Task 1.1: 删除旧的财务表 ⏳
**需求关联**: 数据清理
**描述**: 删除 v1.0 的 billings 和 expenses 表
**验收标准**:
- [ ] 在 Directus Admin 中删除 billings 表
- [ ] 在 Directus Admin 中删除 expenses 表
- [ ] 删除相关的权限规则（13条）
- [ ] 确认数据库表已物理删除
- [ ] 从 docs/betterhome.dbml 中删除旧表定义

**前置条件**: Task 0.1 完成

**预计工时**: 30分钟
**优先级**: P0

---

### Task 1.2: 创建收入侧表（1/3）- billings & billing_payments ⏳
**需求关联**: US-R1, US-PM1
**描述**: 创建物业费账单表和收款记录表
**验收标准**:
- [ ] 在 Directus 中创建 `billings` 表（10个业务字段）
- [ ] 在 Directus 中创建 `billing_payments` 表（8个业务字段）
- [ ] 配置表关系（billing_payments.billing_id -> billings.id）
- [ ] 配置索引（3个索引）
- [ ] 验证表结构正确（使用 Directus Admin 查看）
- [ ] 测试插入一条数据

**技术细节**:
```bash
# 使用脚本创建
bash scripts/create-finance-tables-v2.sh
```

**预计工时**: 2小时
**优先级**: P0

---

### Task 1.3: 创建收入侧表（2/3）- incomes ⏳
**需求关联**: US-R3, US-PM2
**描述**: 创建公共收益表
**验收标准**:
- [ ] 在 Directus 中创建 `incomes` 表（11个业务字段）
- [ ] 配置枚举 `income_type`（7个类型）
- [ ] 配置索引（3个索引）
- [ ] 验证 JSON 字段 `related_info` 正常工作
- [ ] 测试插入广告收益、停车收益各一条

**预计工时**: 1.5小时
**优先级**: P0

---

### Task 1.4: 创建收入侧表（3/3）- 维修基金 ⏳
**需求关联**: US-R6, US-CM2
**描述**: 创建维修基金账户和缴纳记录表
**验收标准**:
- [ ] 在 Directus 中创建 `maintenance_fund_accounts` 表
- [ ] 在 Directus 中创建 `maintenance_fund_payments` 表
- [ ] 配置表关系
- [ ] 配置唯一索引（community_id + owner_id）
- [ ] 测试插入一个账户和一条缴纳记录

**预计工时**: 1.5小时
**优先级**: P1

---

### Task 1.5: 创建支出侧表（1/2）- expenses 重构 ⏳
**需求关联**: US-R4, US-PM3
**描述**: 创建新的支出记录表
**验收标准**:
- [ ] 在 Directus 中创建 `expenses` 表（12个业务字段）
- [ ] 配置枚举 `expense_type`（8个类型）
- [ ] 配置枚举 `expense_status`（3个状态）
- [ ] 配置索引（4个索引）
- [ ] 验证 JSON 字段 `related_info` 正常工作
- [ ] 测试插入一条工资支出

**预计工时**: 1.5小时
**优先级**: P0

---

### Task 1.6: 创建支出侧表（2/2）- 员工和工资 ⏳
**需求关联**: US-PM4, US-PM5
**描述**: 创建员工信息表和工资发放记录表
**验收标准**:
- [ ] 在 Directus 中创建 `employees` 表（9个业务字段）
- [ ] 在 Directus 中创建 `salary_records` 表（13个业务字段）
- [ ] 配置枚举 `position_type`（8个岗位）
- [ ] 配置枚举 `employment_status`（4个状态）
- [ ] 配置表关系（salary_records.employee_id -> employees.id）
- [ ] 配置唯一索引（employee_id + period）
- [ ] 测试插入一个员工和一条工资记录

**预计工时**: 2小时
**优先级**: P0

---

### Task 1.7: 创建维修基金使用记录表 ⏳
**需求关联**: US-R6, US-CM2
**描述**: 创建维修基金使用记录表
**验收标准**:
- [ ] 在 Directus 中创建 `maintenance_fund_usage` 表
- [ ] 配置枚举 `mf_usage_type`（8个类型）
- [ ] 配置枚举 `mf_approval_status`（4个状态）
- [ ] 配置表关系（work_order_id -> work_orders.id）
- [ ] 配置唯一索引（work_order_id）
- [ ] 测试插入一条使用记录

**预计工时**: 1.5小时
**优先级**: P1

---

### Task 1.8: 配置权限规则（业主） ⏳
**需求关联**: US-R1, US-R2, US-R3, US-R4, US-R6
**描述**: 为 Resident 角色配置财务表权限
**验收标准**:
- [ ] billings: read（owner_id = $CURRENT_USER）
- [ ] billing_payments: read（owner_id = $CURRENT_USER）
- [ ] incomes: read（status = approved）
- [ ] expenses: read（status = approved）
- [ ] employees: read（仅岗位统计，不显示姓名）
- [ ] salary_records: 无权限
- [ ] maintenance_fund_accounts: read（owner_id = $CURRENT_USER）
- [ ] maintenance_fund_payments: read（owner_id = $CURRENT_USER）
- [ ] maintenance_fund_usage: read（status = approved）
- [ ] 使用脚本批量配置
- [ ] 验证业主登录后只能看到自己的数据

**技术细节**:
```bash
bash scripts/configure-finance-permissions-v2.sh
```

**预计工时**: 2小时
**优先级**: P0

---

### Task 1.9: 配置权限规则（物业） ⏳
**需求关联**: US-PM1 ~ US-PM7
**描述**: 为 Property Manager 角色配置财务表权限
**验收标准**:
- [ ] 所有财务表: CRUD 完全权限
- [ ] 可以看到所有业主的数据
- [ ] 可以看到所有员工的详细信息
- [ ] 验证物业登录后可以操作所有数据

**预计工时**: 1小时
**优先级**: P0

---

### Task 1.10: 配置权限规则（业委会） ⏳
**需求关联**: US-CM1, US-CM2, US-CM3
**描述**: 为 Committee Member 角色配置财务表权限
**验收标准**:
- [ ] 所有财务表: read 权限
- [ ] maintenance_fund_usage: update 权限（仅审批字段）
- [ ] 可以看到所有业主的汇总数据（不显示具体姓名）
- [ ] 可以看到员工详细信息
- [ ] 验证业委会登录后权限正确

**预计工时**: 1小时
**优先级**: P0

---

### Task 1.11: 更新主 DBML 文件 ⏳
**需求关联**: 文档完整性
**描述**: 将 v2.0 表结构合并到主 DBML 文件
**验收标准**:
- [ ] 从 finance-schema-v2.dbml 复制表定义到 betterhome.dbml
- [ ] 删除旧的 billings 和 expenses 定义
- [ ] 更新枚举定义
- [ ] 更新关系定义
- [ ] 验证 DBML 语法正确（使用 DBML 工具）

**文件涉及**:
- `docs/betterhome.dbml`
- `docs/tasks/billing/finance-schema-v2.dbml`

**预计工时**: 30分钟
**优先级**: P1

---

### Task 1.12: 验证数据层完整性 ⏳
**需求关联**: 质量保证
**描述**: 全面测试数据层
**验收标准**:
- [ ] 所有表都创建成功（9张表）
- [ ] 所有枚举都正确（10个枚举）
- [ ] 所有关系都配置正确（15个关系）
- [ ] 所有索引都创建成功（20+个索引）
- [ ] 所有权限规则都配置正确（30+条规则）
- [ ] 插入测试数据验证完整流程：
  - 创建账单 → 录入收款 → 账单状态更新
  - 录入公共收益 → 查询收入汇总
  - 添加员工 → 录入工资 → 创建支出记录
  - 创建维修基金工单 → 审批 → 录入使用记录

**预计工时**: 2小时
**优先级**: P0

---

## Phase 2: Store 层重构

### Task 2.1: 更新 TypeScript 类型定义 ⏳
**需求关联**: 类型安全
**描述**: 根据 v2.0 表结构更新 TypeScript 接口
**验收标准**:
- [ ] 删除旧的 Billing 和 Expense 接口
- [ ] 添加 Billing 接口（v2.0）
- [ ] 添加 BillingPayment 接口
- [ ] 添加 Income 接口
- [ ] 添加 MaintenanceFundAccount 接口
- [ ] 添加 MaintenanceFundPayment 接口
- [ ] 添加 MaintenanceFundUsage 接口
- [ ] 添加 Expense 接口（v2.0）
- [ ] 添加 Employee 接口
- [ ] 添加 SalaryRecord 接口
- [ ] 更新 Schema 接口（添加新表）
- [ ] 运行 `npm run tsc` 无错误

**文件涉及**:
- `src/@types/directus-schema.d.ts`

**预计工时**: 2小时
**优先级**: P0

---

### Task 2.2: 更新 Directus SDK API ⏳
**需求关联**: API 封装
**描述**: 为新表创建 API 封装
**验收标准**:
- [ ] 删除旧的 billingsApi 和 expensesApi
- [ ] 添加 `billingsApi` (v2.0)
- [ ] 添加 `billingPaymentsApi`
- [ ] 添加 `incomesApi`
- [ ] 添加 `maintenanceFundAccountsApi`
- [ ] 添加 `maintenanceFundPaymentsApi`
- [ ] 添加 `maintenanceFundUsageApi`
- [ ] 添加 `expensesApi` (v2.0)
- [ ] 添加 `employeesApi`
- [ ] 添加 `salaryRecordsApi`
- [ ] 导出所有新类型
- [ ] 运行 `npm run tsc` 无错误

**文件涉及**:
- `src/utils/directus.ts`

**预计工时**: 1小时
**优先级**: P0

---

### Task 2.3: 删除旧的 finance Store ⏳
**需求关联**: 代码清理
**描述**: 删除 v1.0 的 finance.ts Store
**验收标准**:
- [ ] 备份旧的 src/store/finance.ts
- [ ] 删除旧的 finance.ts
- [ ] 确认没有其他文件引用旧 Store

**预计工时**: 10分钟
**优先级**: P0

---

### Task 2.4: 创建新的 finance Store（1/3）- 基础结构 ⏳
**需求关联**: US-R1, US-R2
**描述**: 创建 v2.0 finance Store 的基础结构
**验收标准**:
- [ ] 定义 FinanceState 接口（包含所有表的数据）
- [ ] 定义 state（使用 ref）
- [ ] 定义基础 getters（loading, error, initialized）
- [ ] 定义 reset 方法
- [ ] 运行 `npm run tsc` 无错误

**文件涉及**:
- `src/store/finance.ts`

**预计工时**: 1小时
**优先级**: P0

---

### Task 2.5: 创建新的 finance Store（2/3）- 收入相关 ⏳
**需求关联**: US-R1, US-R3, US-PM1, US-PM2
**描述**: 实现收入相关的 getters 和 actions
**验收标准**:
- [ ] 实现 fetchMyBillings(refresh) - 获取我的账单
- [ ] 实现 fetchMyBillingPayments(billingId) - 获取账单的收款记录
- [ ] 实现 fetchCommunityIncomes(refresh) - 获取公共收益
- [ ] 实现 createBillingPayment(data) - 录入收款记录
- [ ] 实现 createIncome(data) - 录入公共收益
- [ ] 实现 getters:
  - totalPropertyFeeIncome: 物业费总收入
  - totalPublicIncome: 公共收益总收入
  - totalIncome: 总收入
  - incomesByType: 按类型分组的收入
- [ ] 所有 actions 调用 userStore.ensureActiveSession()
- [ ] 所有 actions 有完整的错误处理
- [ ] 添加类型断言（as Billing[]）
- [ ] 运行 `npm run tsc` 无错误

**预计工时**: 3小时
**优先级**: P0

---

### Task 2.6: 创建新的 finance Store（3/3）- 支出相关 ⏳
**需求关联**: US-R4, US-PM3, US-PM4, US-PM5
**描述**: 实现支出相关的 getters 和 actions
**验收标准**:
- [ ] 实现 fetchCommunityExpenses(refresh) - 获取支出记录
- [ ] 实现 fetchEmployees() - 获取员工列表
- [ ] 实现 fetchSalaryRecords(period) - 获取工资记录
- [ ] 实现 createExpense(data) - 录入支出
- [ ] 实现 createEmployee(data) - 添加员工
- [ ] 实现 createSalaryRecords(data[]) - 批量录入工资
- [ ] 实现 getters:
  - totalExpense: 总支出
  - expensesByType: 按类型分组的支出
  - balance: 结余（totalIncome - totalExpense）
  - employeesByPosition: 按岗位分组的员工
- [ ] 运行 `npm run tsc` 无错误

**预计工时**: 3小时
**优先级**: P0

---

### Task 2.7: 创建新的 finance Store（维修基金） ⏳
**需求关联**: US-R6, US-CM2
**描述**: 实现维修基金相关的 getters 和 actions
**验收标准**:
- [ ] 实现 fetchMyMFAccount() - 获取我的维修基金账户
- [ ] 实现 fetchMyMFPayments() - 获取我的缴纳记录
- [ ] 实现 fetchCommunityMFUsage(refresh) - 获取社区使用记录
- [ ] 实现 createMFPayment(data) - 录入缴纳记录
- [ ] 实现 createMFUsage(data) - 创建使用记录（关联工单）
- [ ] 实现 approveMFUsage(id, data) - 审批使用申请
- [ ] 实现 getters:
  - myMFBalance: 我的维修基金余额
  - totalMFBalance: 社区维修基金总余额
- [ ] 运行 `npm run tsc` 无错误

**预计工时**: 2小时
**优先级**: P1

---

### Task 2.8: 测试 finance Store ⏳
**需求关联**: 质量保证
**描述**: 全面测试 finance Store
**验收标准**:
- [ ] 测试所有 getters 返回正确的计算结果
- [ ] 测试所有 fetch actions 正确获取数据
- [ ] 测试所有 create actions 正确创建数据
- [ ] 测试分页加载（上拉加载更多）
- [ ] 测试下拉刷新
- [ ] 测试错误处理（网络错误、权限错误）
- [ ] 测试 token 自动刷新
- [ ] 所有测试通过

**预计工时**: 2小时
**优先级**: P0

---

## Phase 3: UI 层实现（业主端优先）

### Task 3.1: 创建财务总览页面（业主） ⏳
**需求关联**: US-R2
**描述**: 实现业主财务总览页面
**验收标准**:
- [ ] 创建页面 `src/pages/finance/index.vue`
- [ ] 显示当年总收入、总支出、结余（大数字卡片）
- [ ] 显示收入组成（饼图或柱状图）
- [ ] 显示支出组成（饼图或柱状图）
- [ ] 支持选择年份
- [ ] 点击收入/支出跳转到明细页
- [ ] 下拉刷新
- [ ] Loading 状态
- [ ] 错误处理（显示错误提示）
- [ ] 移动端适配

**文件涉及**:
- `src/pages/finance/index.vue`
- 新建页面路由

**预计工时**: 4小时
**优先级**: P0

---

### Task 3.2: 创建我的账单页面（业主） ⏳
**需求关联**: US-R1
**描述**: 实现业主查看物业费账单页面
**验收标准**:
- [ ] 创建页面 `src/pages/finance/my-billings.vue`
- [ ] 显示账单列表（账期、应缴、已缴、状态）
- [ ] 支持筛选账期
- [ ] 支持按状态筛选（全部/未缴/已缴/逾期）
- [ ] 点击账单查看详情（含收款记录）
- [ ] 显示欠费提醒（红色标记）
- [ ] 上拉加载更多
- [ ] 下拉刷新
- [ ] 空状态（无数据）
- [ ] Loading 状态
- [ ] 移动端适配

**文件涉及**:
- `src/pages/finance/my-billings.vue`

**预计工时**: 4小时
**优先级**: P0

---

### Task 3.3: 创建收入明细页面（业主） ⏳
**需求关联**: US-R3
**描述**: 实现业主查看收入明细页面
**验收标准**:
- [ ] 创建页面 `src/pages/finance/incomes.vue`
- [ ] 显示物业费收入汇总（当月/当年）
- [ ] 显示公共收益列表（按类型分组）
- [ ] 每条收益显示：类型、标题、金额、时间
- [ ] 点击查看收益详情（含凭证）
- [ ] 支持按月筛选
- [ ] 支持按类型筛选
- [ ] 上拉加载更多
- [ ] 下拉刷新
- [ ] 移动端适配

**文件涉及**:
- `src/pages/finance/incomes.vue`
- `src/pages/finance/income-detail.vue`

**预计工时**: 5小时
**优先级**: P0

---

### Task 3.4: 创建支出明细页面（业主） ⏳
**需求关联**: US-R4
**描述**: 实现业主查看支出明细页面
**验收标准**:
- [ ] 创建页面 `src/pages/finance/expenses.vue`
- [ ] 显示支出列表（按类型分组）
- [ ] 每条支出显示：类型、标题、金额、时间
- [ ] 点击查看支出详情（含凭证）
- [ ] 工资支出：显示岗位分布（保安×4人），不显示姓名
- [ ] 其他支出：显示完整信息
- [ ] 支持按月筛选
- [ ] 支持按类型筛选
- [ ] 上拉加载更多
- [ ] 下拉刷新
- [ ] 移动端适配

**文件涉及**:
- `src/pages/finance/expenses.vue`
- `src/pages/finance/expense-detail.vue`

**预计工时**: 5小时
**优先级**: P0

---

### Task 3.5: 创建维修基金页面（业主） ⏳
**需求关联**: US-R6
**描述**: 实现业主查看维修基金页面
**验收标准**:
- [ ] 创建页面 `src/pages/finance/maintenance-fund.vue`
- [ ] 显示我的维修基金余额（大数字卡片）
- [ ] 显示我的缴纳记录列表
- [ ] 显示社区使用记录列表
- [ ] 点击使用记录查看详情（项目、审批流程、凭证）
- [ ] 使用记录显示审批状态（待审批/已批准/已完成）
- [ ] 上拉加载更多
- [ ] 下拉刷新
- [ ] 移动端适配

**文件涉及**:
- `src/pages/finance/maintenance-fund.vue`
- `src/pages/finance/mf-usage-detail.vue`

**预计工时**: 4小时
**优先级**: P1

---

### Task 3.6: 创建月度账目页面（业主） ⏳
**需求关联**: US-R5
**描述**: 实现业主查看每月详细账目页面
**验收标准**:
- [ ] 创建页面 `src/pages/finance/monthly.vue`
- [ ] 显示月份选择器
- [ ] 显示该月总收入、总支出、结余
- [ ] 显示该月所有收入明细（列表）
- [ ] 显示该月所有支出明细（列表）
- [ ] 每笔收支可点击查看详情
- [ ] 移动端适配

**文件涉及**:
- `src/pages/finance/monthly.vue`

**预计工时**: 3小时
**优先级**: P1

---

## Phase 4: UI 层实现（物业端）

### Task 4.1: 创建物业费收款录入页面 ⏳
**需求关联**: US-PM1
**描述**: 实现物业录入收款记录页面
**验收标准**:
- [ ] 创建页面 `src/pages/finance/property/billing-payment-create.vue`
- [ ] 业主选择器（搜索或下拉）
- [ ] 账期选择器（显示应缴金额）
- [ ] 实收金额输入（支持部分缴费）
- [ ] 支付方式选择器
- [ ] 缴费人信息输入（姓名、电话）
- [ ] 交易流水号输入
- [ ] 凭证上传（图片）
- [ ] 表单验证（必填项、金额格式）
- [ ] 提交成功后跳转并提示
- [ ] 移动端适配

**文件涉及**:
- `src/pages/finance/property/billing-payment-create.vue`

**预计工时**: 4小时
**优先级**: P0

---

### Task 4.2: 创建公共收益录入页面 ⏳
**需求关联**: US-PM2
**描述**: 实现物业录入公共收益页面
**验收标准**:
- [ ] 创建页面 `src/pages/finance/property/income-create.vue`
- [ ] 收益类型选择器（7种类型）
- [ ] 标题输入
- [ ] 详细说明输入（多行文本）
- [ ] 金额输入
- [ ] 收益日期选择器
- [ ] 支付方式选择器
- [ ] 交易流水号输入
- [ ] 关联信息输入（根据类型动态显示字段）
- [ ] 凭证上传（支持多文件）
- [ ] 表单验证
- [ ] 提交成功后跳转并提示
- [ ] 移动端适配

**文件涉及**:
- `src/pages/finance/property/income-create.vue`

**预计工时**: 5小时
**优先级**: P0

---

### Task 4.3: 创建支出录入页面 ⏳
**需求关联**: US-PM3
**描述**: 实现物业录入支出页面
**验收标准**:
- [ ] 创建页面 `src/pages/finance/property/expense-create.vue`
- [ ] 支出类型选择器（8种类型）
- [ ] 标题输入
- [ ] 详细说明输入
- [ ] 金额输入
- [ ] 支付日期选择器
- [ ] 支付方式选择器
- [ ] 分类输入（可选）
- [ ] 关联信息输入（根据类型动态显示）
- [ ] 凭证上传（支持多文件）
- [ ] 表单验证
- [ ] 提交成功后跳转并提示
- [ ] 移动端适配

**文件涉及**:
- `src/pages/finance/property/expense-create.vue`

**预计工时**: 5小时
**优先级**: P0

---

### Task 4.4: 创建员工管理页面 ⏳
**需求关联**: US-PM4
**描述**: 实现物业管理员工页面
**验收标准**:
- [ ] 创建页面 `src/pages/finance/property/employees.vue`
- [ ] 显示在职员工列表
- [ ] 显示离职员工列表（可切换）
- [ ] 按岗位筛选
- [ ] 搜索员工（姓名、电话）
- [ ] 点击员工查看详情
- [ ] 添加员工按钮（跳转到添加页面）
- [ ] 编辑员工按钮
- [ ] 标记离职按钮
- [ ] 移动端适配

**文件涉及**:
- `src/pages/finance/property/employees.vue`
- `src/pages/finance/property/employee-create.vue`
- `src/pages/finance/property/employee-edit.vue`

**预计工时**: 5小时
**优先级**: P0

---

### Task 4.5: 创建工资录入页面 ⏳
**需求关联**: US-PM5
**描述**: 实现物业录入工资页面
**验收标准**:
- [ ] 创建页面 `src/pages/finance/property/salary-records.vue`
- [ ] 月份选择器
- [ ] 批量生成按钮（为所有在职员工生成工资记录）
- [ ] 显示员工工资列表（可编辑）
- [ ] 每个员工：基本工资、奖金、补贴、扣款、社保、公积金
- [ ] 自动计算实发金额
- [ ] 发放日期选择器
- [ ] 发放方式选择器
- [ ] 凭证上传
- [ ] 防重复提交（同一员工同一月份）
- [ ] 提交后自动创建支出记录
- [ ] 移动端适配

**文件涉及**:
- `src/pages/finance/property/salary-records.vue`

**预计工时**: 6小时
**优先级**: P0

---

### Task 4.6: 创建欠费查询页面 ⏳
**需求关联**: US-PM6
**描述**: 实现物业查看欠费业主页面
**验收标准**:
- [ ] 创建页面 `src/pages/finance/property/overdue-billings.vue`
- [ ] 显示所有未缴/部分缴纳的账单
- [ ] 显示欠费金额、账期、业主信息
- [ ] 按楼栋筛选
- [ ] 按账期筛选
- [ ] 导出欠费名单（Excel，V2.0功能）
- [ ] 移动端适配

**文件涉及**:
- `src/pages/finance/property/overdue-billings.vue`

**预计工时**: 3小时
**优先级**: P1

---

## Phase 5: UI 层实现（业委会端）

### Task 5.1: 创建维修基金审批页面 ⏳
**需求关联**: US-CM2
**描述**: 实现业委会审批维修基金页面
**验收标准**:
- [ ] 创建页面 `src/pages/finance/committee/mf-approvals.vue`
- [ ] 显示待审批的维修基金申请（工单列表）
- [ ] 点击查看申请详情
- [ ] 显示项目名称、类型、预算、施工单位、合同等
- [ ] 显示凭证（可下载）
- [ ] 批准按钮（填写审批意见）
- [ ] 拒绝按钮（填写拒绝原因）
- [ ] 显示审批历史
- [ ] 移动端适配

**文件涉及**:
- `src/pages/finance/committee/mf-approvals.vue`
- `src/pages/finance/committee/mf-approval-detail.vue`

**预计工时**: 4小时
**优先级**: P1

---

### Task 5.2: 创建业委会财务总览页面 ⏳
**需求关联**: US-CM1
**描述**: 实现业委会查看详细财务页面
**验收标准**:
- [ ] 复用业主财务总览页面
- [ ] 额外显示：物业费缴纳率、欠费户数
- [ ] 额外显示：员工岗位分布（含姓名，V2.0）
- [ ] 导出财务数据按钮（V2.0功能）
- [ ] 移动端适配

**文件涉及**:
- `src/pages/finance/committee/overview.vue`

**预计工时**: 2小时
**优先级**: P1

---

## Phase 6: 组件封装和优化

### Task 6.1: 创建通用财务卡片组件 ⏳
**需求关联**: 代码复用
**描述**: 封装通用的财务卡片组件
**验收标准**:
- [ ] 创建 BillingCard 组件（账单卡片）
- [ ] 创建 IncomeCard 组件（收入卡片）
- [ ] 创建 ExpenseCard 组件（支出卡片）
- [ ] 创建 FinanceSummaryCard 组件（财务总览卡片）
- [ ] 所有卡片支持点击事件
- [ ] 所有卡片移动端适配
- [ ] 所有卡片有 Loading 状态
- [ ] 编写组件文档

**文件涉及**:
- `src/components/finance/BillingCard.vue`
- `src/components/finance/IncomeCard.vue`
- `src/components/finance/ExpenseCard.vue`
- `src/components/finance/FinanceSummaryCard.vue`

**预计工时**: 4小时
**优先级**: P1

---

### Task 6.2: 创建凭证查看组件 ⏳
**需求关联**: 代码复用
**描述**: 封装凭证查看组件
**验收标准**:
- [ ] 创建 ProofViewer 组件
- [ ] 支持图片预览（点击放大）
- [ ] 支持 PDF 预览
- [ ] 支持多文件展示（轮播或网格）
- [ ] 支持下载凭证
- [ ] 移动端适配
- [ ] 编写组件文档

**文件涉及**:
- `src/components/finance/ProofViewer.vue`

**预计工时**: 3小时
**优先级**: P1

---

### Task 6.3: 创建文件上传组件 ⏳
**需求关联**: 代码复用
**描述**: 封装文件上传组件（集成 Directus Files）
**验收标准**:
- [ ] 创建 FileUploader 组件
- [ ] 支持图片上传（拍照或相册）
- [ ] 支持 PDF 上传
- [ ] 支持多文件上传
- [ ] 显示上传进度
- [ ] 上传成功后返回文件 ID
- [ ] 图片自动压缩（可选）
- [ ] 移动端适配
- [ ] 编写组件文档

**文件涉及**:
- `src/components/finance/FileUploader.vue`

**预计工时**: 4小时
**优先级**: P0

---

### Task 6.4: 性能优化 ⏳
**需求关联**: 性能要求
**描述**: 优化财务模块性能
**验收标准**:
- [ ] 列表页加载时间 < 2秒
- [ ] 财务总览加载时间 < 1秒
- [ ] 图片懒加载
- [ ] 虚拟列表（如果列表很长）
- [ ] 缓存策略优化
- [ ] 减少不必要的 API 请求

**预计工时**: 3小时
**优先级**: P2

---

### Task 6.5: 错误处理优化 ⏳
**需求关联**: 易用性要求
**描述**: 优化错误处理和用户反馈
**验收标准**:
- [ ] 所有 API 错误都有友好提示
- [ ] 网络错误重试机制
- [ ] 表单验证错误提示明确
- [ ] 权限错误友好提示
- [ ] 空状态优化（无数据时的提示）
- [ ] Loading 状态优化（骨架屏）

**预计工时**: 2小时
**优先级**: P1

---

## Phase 7: 测试和文档

### Task 7.1: 编写单元测试 ⏳
**需求关联**: 质量保证
**描述**: 为 Store 和工具函数编写单元测试
**验收标准**:
- [ ] finance Store 测试覆盖率 > 80%
- [ ] 测试所有 getters
- [ ] 测试所有 actions
- [ ] 测试错误处理
- [ ] 所有测试通过

**预计工时**: 4小时
**优先级**: P2

---

### Task 7.2: 端到端测试 ⏳
**需求关联**: 质量保证
**描述**: 编写端到端测试
**验收标准**:
- [ ] 测试业主查看财务流程
- [ ] 测试物业录入数据流程
- [ ] 测试业委会审批流程
- [ ] 测试不同角色权限
- [ ] 所有测试通过

**预计工时**: 6小时
**优先级**: P2

---

### Task 7.3: 更新用户文档 ⏳
**需求关联**: 文档完整性
**描述**: 编写用户使用文档
**验收标准**:
- [ ] 业主使用指南（如何查看财务信息）
- [ ] 物业使用指南（如何录入数据）
- [ ] 业委会使用指南（如何审批维修基金）
- [ ] 常见问题解答（FAQ）
- [ ] 截图和示例

**文件涉及**:
- `docs/tasks/billing/user-guide.md`

**预计工时**: 3小时
**优先级**: P2

---

### Task 7.4: 更新开发文档 ⏳
**需求关联**: 文档完整性
**描述**: 更新开发文档
**验收标准**:
- [ ] 更新 design.md（完整的技术设计）
- [ ] 更新 setup-guide.md（部署指南）
- [ ] API 文档（Store API 说明）
- [ ] 数据库迁移文档
- [ ] 权限配置文档

**预计工时**: 2小时
**优先级**: P1

---

## 任务统计

**总任务数**: 59个

**按阶段统计**:
- Phase 0 (准备): 2个任务
- Phase 1 (数据层): 12个任务
- Phase 2 (Store层): 8个任务
- Phase 3 (业主UI): 6个任务
- Phase 4 (物业UI): 6个任务
- Phase 5 (业委会UI): 2个任务
- Phase 6 (组件优化): 5个任务
- Phase 7 (测试文档): 4个任务

**按优先级统计**:
- P0 (MVP必须): 32个任务（预计 ~90小时）
- P1 (重要): 18个任务（预计 ~50小时）
- P2 (可选): 9个任务（预计 ~24小时）

**预计总工时**: 约 160+ 小时

---

## 下一步行动

1. ✅ 确认需求文档（requirements.md）
2. ✅ 确认任务清单（tasks.md）
3. ⏳ 更新设计文档（design.md）
4. ⏳ 开始执行 Phase 0 任务
5. ⏳ 每完成一个 Phase 进行阶段性验收
