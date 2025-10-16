# 重新创建财务表快速指南

## 问题背景

在 Directus Admin 中，`expenses` 和 `employees` 表显示为文件夹图标，已被删除。需要根据 `finance-schema-v2.dbml` 重新创建这两个表。

## 快速创建

### 方法 1: 批量创建（推荐）

一次性创建两个表：

```bash
# 1. 设置管理员 token
export DIRECTUS_ADMIN_TOKEN="your_admin_token_here"

# 2. 批量创建
bash scripts/create-expenses-and-employees.sh
```

### 方法 2: 单独创建

分别创建每个表：

```bash
# 设置 token
export DIRECTUS_ADMIN_TOKEN="your_admin_token_here"

# 创建 expenses 表
bash scripts/create-expenses-table.sh

# 创建 employees 表
bash scripts/create-employees-table.sh
```

## 表结构概览

### Expenses 表（支出记录）

**图标**: 💳 (payments)  
**字段数**: 22 个（4个审计字段 + 18个业务字段）

**核心字段**:
- `community_id` - 所属社区（必填）
- `expense_type` - 支出类型（必填）
  - salary（员工工资）
  - maintenance（设施维护）
  - utilities（公共能耗）
  - materials（耗材采购）
  - activity（社区活动）
  - committee_fund（业委会经费）
  - maintenance_fund（维修基金使用）
  - other（其他）
- `title` - 支出标题（必填）
- `amount` - 支出金额（必填）
- `paid_at` - 支付时间（必填）
- `payment_method` - 支付方式（必填）
- `status` - 审核状态（默认 approved）
- `created_by` - 创建人（必填）

**关系**:
- `community_id` → `communities`
- `created_by` → `directus_users`
- `approved_by` → `directus_users`

---

### Employees 表（员工信息）

**图标**: 🎫 (badge)  
**字段数**: 17 个（4个审计字段 + 13个业务字段）

**核心字段**:
- `community_id` - 所属社区（必填）
- `name` - 员工姓名（必填）
- `phone` - 联系电话
- `id_card_last4` - 身份证后4位（隐私保护）
- `position_type` - 岗位类型（必填）
  - security（保安）
  - cleaning（保洁）
  - management（管理人员）
  - electrician（水电工）
  - plumber（管道工）
  - gardener（绿化工）
  - temp_worker（临时工）
  - other（其他）
- `position_title` - 岗位名称（如：保安队长）
- `employment_status` - 在职状态（默认 active）
  - active（在职）
  - resigned（离职）
  - on_leave（休假）
  - suspended（停职）
- `hire_date` - 入职日期（必填）
- `resignation_date` - 离职日期
- `base_salary` - 基本工资

**关系**:
- `community_id` → `communities`

## 验证清单

创建完成后，使用此清单验证：

### ✅ Directus Admin 验证

**Expenses 表**:
- [ ] 表图标显示为 💳 (payments)
- [ ] 可以点击进入查看数据
- [ ] 字段列表完整（22个字段）
- [ ] 可以创建新记录
- [ ] 支出类型下拉选项正确（8个选项）
- [ ] 支付方式下拉选项正确（6个选项）
- [ ] 审核状态下拉选项正确（3个选项）

**Employees 表**:
- [ ] 表图标显示为 🎫 (badge)
- [ ] 可以点击进入查看数据
- [ ] 字段列表完整（17个字段）
- [ ] 可以创建新记录
- [ ] 岗位类型下拉选项正确（8个选项）
- [ ] 在职状态下拉选项正确（4个选项）

### ✅ 测试数据创建

**创建测试支出记录**:
```json
{
  "community_id": "<your_community_id>",
  "expense_type": "utilities",
  "title": "2024年1月电费",
  "description": "小区公共区域电费",
  "amount": 5000.00,
  "paid_at": "2024-01-15T10:00:00",
  "period": "2024-01",
  "payment_method": "bank",
  "status": "approved",
  "created_by": "<your_user_id>"
}
```

**创建测试员工记录**:
```json
{
  "community_id": "<your_community_id>",
  "name": "张三",
  "phone": "13800138000",
  "position_type": "security",
  "position_title": "保安队长",
  "employment_status": "active",
  "hire_date": "2024-01-01",
  "base_salary": 5000.00
}
```

### ✅ 权限配置

```bash
# 配置 resident 角色权限
bash scripts/fix-resident-billing-permissions.sh
```

验证权限：
- [ ] Resident 可以读取 expenses（status=approved）
- [ ] Resident 可以读取 employees（岗位统计）
- [ ] Resident 不能读取员工的敏感信息（工资）

### ✅ 应用测试

- [ ] 登录应用
- [ ] 访问 Profile → 查看小区收支情况
- [ ] 财务总览页面显示正常
- [ ] 支出数据显示正确
- [ ] 支出分类显示正确
- [ ] 可以查看支出明细

## 常见问题

### Q1: 脚本执行报错 "Collection already exists"

**原因**: 表已经存在

**解决方法**:
1. 在 Directus Admin 中检查表是否存在
2. 如果存在但显示为文件夹，先删除
3. 重新运行脚本

### Q2: 字段创建失败

**原因**: 某些字段可能已存在

**解决方法**:
1. 在 Directus Admin 中检查字段列表
2. 手动删除冲突的字段
3. 重新运行脚本

### Q3: 关系创建失败

**原因**: 关联表不存在

**解决方法**:
1. 确保 `communities` 表存在
2. 确保 `directus_users` 表存在
3. 检查字段类型是否为 uuid

### Q4: 表创建成功但仍显示为文件夹

**原因**: 浏览器缓存

**解决方法**:
1. 清除浏览器缓存
2. 使用无痕模式访问
3. 强制刷新（Ctrl+Shift+R）

### Q5: 应用中看不到数据

**检查项**:
1. 权限是否配置正确
2. 是否有测试数据
3. 数据的 status 是否为 approved
4. 用户的 community_id 是否匹配

**解决方法**:
```bash
# 诊断权限
bash scripts/diagnose-billing-permissions.sh

# 修复权限
bash scripts/fix-resident-billing-permissions.sh
```

## 脚本文件说明

### 单独创建脚本

1. **`scripts/create-expenses-table.sh`**
   - 创建 expenses 表
   - 22 个字段
   - 3 个关系
   - 完整的 meta 配置

2. **`scripts/create-employees-table.sh`**
   - 创建 employees 表
   - 17 个字段
   - 1 个关系
   - 完整的 meta 配置

### 批量创建脚本

**`scripts/create-expenses-and-employees.sh`**
- 一次性创建两个表
- 自动调用单独的创建脚本
- 提供完整的操作指引

## 相关文档

- [财务表结构设计](./finance-schema-v2.dbml) - 完整的表结构定义
- [Expenses 表详细指南](./recreate-expenses-guide.md) - Expenses 表的详细说明
- [权限配置指南](./permission-troubleshooting.md) - 权限配置和故障排除
- [财务功能设计文档](./design.md) - 整体设计文档

## 快速命令参考

```bash
# 设置 token
export DIRECTUS_ADMIN_TOKEN="your_token"

# 批量创建（推荐）
bash scripts/create-expenses-and-employees.sh

# 单独创建 expenses
bash scripts/create-expenses-table.sh

# 单独创建 employees
bash scripts/create-employees-table.sh

# 配置权限
bash scripts/fix-resident-billing-permissions.sh

# 诊断权限
bash scripts/diagnose-billing-permissions.sh

# 验证表结构
bash scripts/check-expenses-collection.sh
```

## 时间估算

- 设置 token: 1 分钟
- 运行批量创建脚本: 2-3 分钟
- 验证表结构: 2 分钟
- 创建测试数据: 3 分钟
- 配置权限: 2 分钟
- 应用测试: 3 分钟

**总计**: 约 15 分钟

## 成功标志

当你看到以下内容时，说明创建成功：

✅ 在 Directus Admin 中：
- Expenses 显示为 💳 图标
- Employees 显示为 🎫 图标
- 可以正常创建和编辑记录

✅ 在应用中：
- 财务总览页面显示正常
- 支出数据正确显示
- 支出分类正确

✅ 权限正常：
- Resident 可以查看已审核的支出
- Resident 可以查看员工岗位统计
- 数据过滤正确（只看自己社区的数据）
