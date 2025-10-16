# Requirements Document

## Introduction

本需求文档旨在解决财务模块的 Directus 权限配置问题。当前用户在访问财务相关页面时遇到 `FORBIDDEN` 错误，需要为不同用户角色配置适当的数据访问权限，确保业主可以查看自己的账单，物业管理员可以管理所有财务数据，业委会成员可以审批支出等。

## Requirements

### Requirement 1: 业主角色权限配置

**User Story:** 作为业主用户，我想查看我自己的物业费账单和缴费记录，以便了解我的缴费情况

#### Acceptance Criteria

1. WHEN 业主用户登录系统 THEN 系统 SHALL 允许该用户读取自己的 `billings` 记录（通过 `owner_id` 过滤）
2. WHEN 业主用户访问我的物业费页面 THEN 系统 SHALL 允许该用户读取自己的 `billing_payments` 记录
3. WHEN 业主用户查看维修基金 THEN 系统 SHALL 允许该用户读取自己的 `maintenance_fund_accounts` 和 `maintenance_fund_payments` 记录
4. WHEN 业主用户访问财务总览 THEN 系统 SHALL 允许该用户读取所属社区的 `incomes` 和 `expenses` 记录（只读）
5. IF 业主用户尝试访问其他业主的账单 THEN 系统 SHALL 拒绝访问并返回权限错误

### Requirement 2: 物业管理员角色权限配置

**User Story:** 作为物业管理员，我想管理所有财务数据，以便完成日常的财务管理工作

#### Acceptance Criteria

1. WHEN 物业管理员登录系统 THEN 系统 SHALL 允许该用户对所属社区的所有财务表进行 CRUD 操作
2. WHEN 物业管理员录入收款记录 THEN 系统 SHALL 允许创建 `billing_payments` 记录并自动更新对应的 `billings` 记录
3. WHEN 物业管理员录入公共收益 THEN 系统 SHALL 允许创建 `incomes` 记录
4. WHEN 物业管理员录入支出 THEN 系统 SHALL 允许创建 `expenses` 记录
5. WHEN 物业管理员管理员工 THEN 系统 SHALL 允许对 `employees` 和 `salary_records` 进行 CRUD 操作

### Requirement 3: 业委会成员角色权限配置

**User Story:** 作为业委会成员，我想审批重大支出和维修基金使用，以便监督社区财务

#### Acceptance Criteria

1. WHEN 业委会成员登录系统 THEN 系统 SHALL 允许该用户读取所属社区的所有财务数据
2. WHEN 业委会成员审批支出 THEN 系统 SHALL 允许更新 `expenses` 表的 `status`、`approved_by` 和 `approved_at` 字段
3. WHEN 业委会成员审批维修基金使用 THEN 系统 SHALL 允许更新 `maintenance_fund_usage` 表的审批相关字段
4. IF 业委会成员尝试删除财务记录 THEN 系统 SHALL 拒绝该操作
5. WHEN 业委会成员查看财务报表 THEN 系统 SHALL 提供所有收支数据的只读访问

### Requirement 4: 权限配置脚本

**User Story:** 作为开发人员，我想通过脚本自动配置权限，以便快速部署和维护权限设置

#### Acceptance Criteria

1. WHEN 执行权限配置脚本 THEN 系统 SHALL 为所有相关角色创建或更新权限规则
2. WHEN 脚本执行完成 THEN 系统 SHALL 输出配置结果和任何错误信息
3. IF 角色不存在 THEN 脚本 SHALL 先创建角色再配置权限
4. WHEN 配置权限规则 THEN 脚本 SHALL 使用 Directus API 而不是直接操作数据库
5. WHEN 脚本遇到错误 THEN 系统 SHALL 提供清晰的错误信息和修复建议

### Requirement 5: 权限验证和测试

**User Story:** 作为开发人员，我想验证权限配置是否正确，以便确保系统安全性

#### Acceptance Criteria

1. WHEN 权限配置完成后 THEN 系统 SHALL 提供验证脚本测试各角色的访问权限
2. WHEN 业主用户尝试访问其他业主数据 THEN 验证脚本 SHALL 确认访问被拒绝
3. WHEN 物业管理员访问财务数据 THEN 验证脚本 SHALL 确认所有 CRUD 操作成功
4. WHEN 业委会成员尝试删除数据 THEN 验证脚本 SHALL 确认操作被拒绝
5. IF 任何权限验证失败 THEN 脚本 SHALL 输出详细的失败信息和预期行为
