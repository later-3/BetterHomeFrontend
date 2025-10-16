# 重新创建 Expenses 表指南

## 背景

之前的 expenses 表显示为文件夹，已被删除。现在需要根据 `finance-schema-v2.dbml` 重新创建正确的 expenses 表。

## 表结构说明

根据 DBML 设计文档，expenses 表包含以下内容：

### 字段列表（共 22 个字段）

#### 审计字段（4个）
- `user_created` - 创建用户
- `date_created` - 创建时间
- `user_updated` - 更新用户
- `date_updated` - 更新时间

#### 支出基本信息（5个）
- `community_id` - 所属社区（必填）
- `expense_type` - 支出类型（必填，枚举）
  - salary（员工工资）
  - maintenance（设施维护）
  - utilities（公共能耗）
  - materials（耗材采购）
  - activity（社区活动）
  - committee_fund（业委会经费）
  - maintenance_fund（维修基金使用）
  - other（其他）
- `title` - 支出标题（必填）
- `description` - 详细说明
- `amount` - 支出金额（必填，decimal(10,2)）

#### 支付信息（3个）
- `paid_at` - 支付时间（必填）
- `period` - 所属月份（YYYY-MM，用于月度汇总）
- `payment_method` - 支付方式（必填，枚举）
  - wechat（微信）
  - alipay（支付宝）
  - bank（银行转账）
  - cash（现金）
  - pos（POS机刷卡）
  - other（其他）

#### 分类和关联（2个）
- `category` - 细分类别（如：工资-保安、维护-电梯）
- `related_info` - 关联信息（JSON格式）
  - 工资：`{"salary_record_ids": ["uuid1", "uuid2"]}`
  - 维修基金：`{"mf_usage_id": "uuid"}`
  - 维护：`{"contractor": "XX公司", "contract_no": "MNT202401"}`

#### 审核流程（3个）
- `status` - 审核状态（必填，默认 approved）
  - pending（待审核）
  - approved（已审核）
  - rejected（已拒绝）
- `approved_by` - 审批人
- `approved_at` - 审批时间

#### 凭证和备注（2个）
- `proof_files` - 凭证文件ID数组（JSON）
- `notes` - 备注

#### 其他（3个）
- `created_by` - 创建人/录入人（必填）
- `date_deleted` - 软删除时间

### 表关系（3个）

1. `expenses.community_id` → `communities.id`
2. `expenses.created_by` → `directus_users.id`
3. `expenses.approved_by` → `directus_users.id`

### 索引（4个）

1. `idx_expenses_community_time` - (community_id, paid_at desc, id)
2. `idx_expenses_type_time` - (community_id, expense_type, paid_at desc)
3. `idx_expenses_period` - (period, community_id)
4. `idx_expenses_status` - (status, approved_at desc)

## 创建步骤

### 步骤 1: 设置管理员 Token

```bash
export DIRECTUS_ADMIN_TOKEN="your_admin_token_here"
```

获取 token 的方法：
1. 登录 Directus Admin
2. 打开浏览器开发者工具（F12）
3. 查看 Network 标签
4. 找到任意 API 请求
5. 复制 Authorization header 中的 Bearer token

### 步骤 2: 运行创建脚本

```bash
bash scripts/create-expenses-table.sh
```

脚本会自动：
- ✅ 创建 expenses 集合（使用 payments 图标 💳）
- ✅ 创建所有 22 个字段
- ✅ 配置字段类型、验证规则、显示选项
- ✅ 创建 3 个表关系
- ✅ 设置正确的 meta 配置（非 singleton，非 hidden）

### 步骤 3: 验证创建结果

#### 在 Directus Admin 中检查

1. 访问 `http://localhost:8055/admin`
2. 进入 Content → Expenses
3. 检查：
   - [ ] 表图标显示为 💳（payments）而不是文件夹
   - [ ] 可以点击进入查看数据
   - [ ] 字段列表完整（22个字段）
   - [ ] 可以创建新记录

#### 测试创建记录

在 Directus Admin 中创建一条测试记录：

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

### 步骤 4: 配置权限

如果还没有配置权限，运行权限配置脚本：

```bash
bash scripts/fix-resident-billing-permissions.sh
```

这会为 resident 角色配置：
- ✅ expenses 表的读权限（只能读已审核的记录）
- ✅ 关联表权限（communities, directus_users）

### 步骤 5: 在应用中测试

1. 使用 resident 用户登录应用
2. 访问 Profile 页面
3. 点击 "查看小区收支情况"
4. 应该能看到：
   - 总收入、总支出、结余
   - 支出组成（按类型分组）
   - 可以点击查看支出明细

## 常见问题

### Q1: 脚本执行报错？

**检查项**:
1. DIRECTUS_ADMIN_TOKEN 是否正确
2. Directus 服务是否正常运行（`http://localhost:8055`）
3. 网络连接是否正常
4. 查看 Directus 日志获取详细错误

**解决方法**:
```bash
# 检查 Directus 服务状态
curl -s http://localhost:8055/server/health | jq

# 测试 token 是否有效
curl -s http://localhost:8055/users/me \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" | jq
```

### Q2: 表创建成功但仍显示为文件夹？

**原因**: 浏览器缓存问题

**解决方法**:
1. 清除浏览器缓存
2. 使用无痕模式访问 Directus Admin
3. 强制刷新页面（Ctrl+Shift+R 或 Cmd+Shift+R）

### Q3: 字段创建失败？

**原因**: 可能某些字段已存在或有命名冲突

**解决方法**:
1. 在 Directus Admin 中手动检查字段列表
2. 删除冲突的字段
3. 重新运行脚本

### Q4: 关系创建失败？

**原因**: 关联表不存在或字段类型不匹配

**解决方法**:
1. 确保 communities 表存在
2. 确保 directus_users 表存在
3. 检查字段类型是否为 uuid

### Q5: 应用中看不到支出数据？

**检查项**:
1. 权限是否配置正确
2. 是否有测试数据
3. 数据的 status 是否为 approved
4. 用户的 community_id 是否匹配

**解决方法**:
```bash
# 1. 检查权限
bash scripts/diagnose-billing-permissions.sh

# 2. 修复权限
bash scripts/fix-resident-billing-permissions.sh

# 3. 在 Directus Admin 中检查数据
# 访问 Content → Expenses
# 确保有 status=approved 的记录
```

## 数据迁移（如果有旧数据）

如果之前有 expenses 数据需要迁移：

### 步骤 1: 导出旧数据

在删除旧表之前，应该已经导出了数据。如果没有，检查数据库备份。

### 步骤 2: 转换数据格式

根据新表结构调整数据格式：
- 确保所有必填字段都有值
- 枚举值要匹配新的定义
- JSON 字段格式要正确

### 步骤 3: 导入数据

使用 Directus API 批量导入：

```bash
# 示例：批量创建 expenses
curl -X POST "http://localhost:8055/items/expenses" \
  -H "Authorization: Bearer $DIRECTUS_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "community_id": "uuid1",
      "expense_type": "utilities",
      "title": "电费",
      "amount": 5000,
      "paid_at": "2024-01-15T10:00:00",
      "payment_method": "bank",
      "status": "approved",
      "created_by": "uuid2"
    }
  ]'
```

## 验证清单

创建完成后，使用此清单验证：

### Directus Admin 验证
- [ ] expenses 表显示为正常图标（💳）
- [ ] 可以点击进入查看数据
- [ ] 字段列表完整（22个字段）
- [ ] 可以创建新记录
- [ ] 可以编辑记录
- [ ] 可以删除记录（软删除）
- [ ] 关系字段显示正确（community_id, created_by, approved_by）

### API 验证
- [ ] 可以读取 expenses 数据
- [ ] 可以创建 expenses 记录
- [ ] 可以更新 expenses 记录
- [ ] 权限过滤正常工作

### 应用验证
- [ ] 财务总览页面显示支出数据
- [ ] 支出金额计算正确
- [ ] 支出分类显示正确
- [ ] 可以查看支出明细
- [ ] resident 用户只能看到已审核的支出

## 相关文档

- [财务表结构设计](./finance-schema-v2.dbml)
- [创建脚本](../../scripts/create-expenses-table.sh)
- [权限配置指南](./permission-troubleshooting.md)
- [财务功能设计文档](./design.md)
