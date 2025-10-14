# 财务透明功能 - 数据层建设指南

## 📋 准备工作

### 1. 获取 Directus Admin Token

1. 打开浏览器，访问 http://localhost:8055/admin
2. 使用管理员账号登录
3. 打开浏览器开发者工具（F12）
4. 进入 **Application** (Chrome) 或 **Storage** (Firefox) 标签
5. 找到 **Local Storage** → `http://localhost:8055`
6. 复制 `directus_token` 的值

### 2. 安装 tsx（如果没有）

```bash
npm install -g tsx
# 或
pnpm add -g tsx
```

## 🚀 方案一：自动化脚本（推荐）

### 运行脚本

```bash
# 设置环境变量并运行
DIRECTUS_ADMIN_TOKEN="你的token" tsx scripts/create-billing-tables.ts
```

脚本会自动完成：
- ✅ 创建 `billings` 表及所有字段
- ✅ 创建 `expenses` 表及所有字段
- ✅ 配置表关系
- ✅ 设置字段类型和默认值

## 🔧 方案二：手动创建（备选）

如果脚本无法运行，可以手动在 Directus Admin 中创建：

### 1. 创建 `billings` 表

1. 访问 http://localhost:8055/admin/settings/data-model
2. 点击 "Create Collection"
3. 配置：
   - Collection Name: `billings`
   - Icon: 选择 `attach_money`
   - Note: `物业费账单表`
   - Archive Field: `date_deleted`
   - ✅ Enable Archive App Filter
4. 点击 "Save"

#### 添加字段：

**审计字段（系统自动）**
- `user_created` - UUID - User Created
- `date_created` - Timestamp - Date Created
- `user_updated` - UUID - User Updated
- `date_updated` - Timestamp - Date Updated

**业务字段（手动添加）**

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `community_id` | UUID | ✅ | - | 所属小区（M2O → communities） |
| `building_id` | UUID | ❌ | - | 所属楼栋（M2O → buildings） |
| `owner_id` | UUID | ✅ | - | 缴费业主（M2O → directus_users） |
| `amount` | Decimal(10,2) | ✅ | - | 金额 |
| `period` | String(7) | ✅ | - | 账期（YYYY-MM） |
| `payment_method` | String | ❌ | `other` | 缴费方式（下拉：wechat/alipay/bank/cash/other） |
| `status` | String | ✅ | `unpaid` | 状态（下拉：unpaid/paid/overdue） |
| `paid_at` | Timestamp | ❌ | - | 缴费时间 |
| `late_fee` | Decimal(10,2) | ❌ | `0` | 滞纳金 |
| `notes` | Text | ❌ | - | 备注 |
| `date_deleted` | Timestamp | ❌ | - | 软删除时间 |

### 2. 创建 `expenses` 表

1. 点击 "Create Collection"
2. 配置：
   - Collection Name: `expenses`
   - Icon: 选择 `payments`
   - Note: `物业支出表`
   - Archive Field: `date_deleted`
   - ✅ Enable Archive App Filter
3. 点击 "Save"

#### 添加字段：

**审计字段（系统自动）**
- `user_created` - UUID - User Created
- `date_created` - Timestamp - Date Created
- `user_updated` - UUID - User Updated
- `date_updated` - Timestamp - Date Updated

**业务字段（手动添加）**

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `community_id` | UUID | ✅ | - | 所属小区（M2O → communities） |
| `title` | String(255) | ✅ | - | 支出标题 |
| `description` | Text | ❌ | - | 详细说明 |
| `amount` | Decimal(10,2) | ✅ | - | 金额 |
| `category` | String | ✅ | - | 类别（下拉：repair/salary/cleaning/security/utilities/greening/elevator/other） |
| `paid_at` | Timestamp | ✅ | - | 支付时间 |
| `payment_method` | String | ❌ | `other` | 支付方式（下拉：wechat/alipay/bank/cash/other） |
| `status` | String | ✅ | `approved` | 状态（下拉：pending/approved/rejected） |
| `approved_by` | UUID | ❌ | - | 审核人（M2O → directus_users） |
| `approved_at` | Timestamp | ❌ | - | 审核时间 |
| `proof_files` | JSON | ❌ | - | 凭证文件ID数组 |
| `created_by` | UUID | ✅ | - | 录入人（M2O → directus_users） |
| `date_deleted` | Timestamp | ❌ | - | 软删除时间 |

### 3. 配置权限规则

#### billings 表权限

**resident (业主角色)**
- Create: ❌
- Read: ✅ 仅自己的
  ```json
  {
    "_and": [
      { "owner_id": { "_eq": "$CURRENT_USER" } }
    ]
  }
  ```
- Update: ❌
- Delete: ❌

**property_manager (物业角色)**
- Create: ✅ 全部
- Read: ✅ 全部
- Update: ✅ 全部
- Delete: ✅ 全部

**committee_member (业委会角色)**
- Create: ❌
- Read: ✅ 全部
- Update: ❌
- Delete: ❌

#### expenses 表权限

**resident (业主角色)**
- Create: ❌
- Read: ✅ 已审核的
  ```json
  {
    "_and": [
      { "community_id": { "_eq": "$CURRENT_USER.community_id" } },
      { "status": { "_eq": "approved" } }
    ]
  }
  ```
- Update: ❌
- Delete: ❌

**property_manager (物业角色)**
- Create: ✅ 全部
- Read: ✅ 全部
- Update: ✅ 全部
- Delete: ✅ 全部

**committee_member (业委会角色)**
- Create: ❌
- Read: ✅ 全部
- Update: ✅ 仅status字段（审核功能）
- Delete: ❌

## ✅ 验证

### 1. 检查表是否创建成功

访问 http://localhost:8055/admin/settings/data-model

应该看到：
- ✅ `billings` 表（attach_money 图标）
- ✅ `expenses` 表（payments 图标）

### 2. 检查字段

点击每个表，确认所有字段都已创建

### 3. 检查权限

访问 http://localhost:8055/admin/settings/roles

对每个角色（resident、property_manager、committee_member）检查权限配置

## 🔄 下一步

完成数据层建设后，继续：

1. ✅ 更新 TypeScript 类型定义
2. ✅ 封装 Directus SDK API
3. ✅ 创建 Pinia Store
4. ✅ 实现前端UI

参考文档：
- 设计文档：`docs/tasks/billing/design.md`
- 需求文档：`docs/tasks/billing/requirements.md`
- 任务清单：`docs/tasks/billing/tasks.md`
