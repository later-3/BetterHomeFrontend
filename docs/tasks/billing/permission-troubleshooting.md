# Billing 权限问题排查指南

## 问题描述

Resident 角色在 Directus 中已经开启了 billing 表的访问权限，但在前端访问"查看小区收支情况"时仍然显示没有权限。

## 问题原因

虽然在 Directus Admin 中给 resident 角色开启了 billing 表的权限，但可能存在以下问题：

### 1. 关联表权限缺失

`billings` 表包含多个关联字段，这些关联表也需要相应的读权限：

- `community_id` → `communities` 表
- `building_id` → `buildings` 表  
- `owner_id` → `directus_users` 表

如果这些关联表没有读权限，查询 billing 数据时会失败。

### 2. Policy 配置问题

Directus 10+ 使用 Policy 系统管理权限：

- 角色（Role）需要关联到策略（Policy）
- 权限（Permission）配置在 Policy 上，而不是直接在 Role 上
- 如果 resident 角色没有关联 policy，或 policy 配置不正确，权限不会生效

### 3. 字段级权限

可能只开启了表级权限，但没有配置字段级权限（`fields: ["*"]`）

### 4. 过滤规则问题

权限规则中的过滤条件可能配置错误，例如：
- `owner_id = $CURRENT_USER` 应该正确匹配当前用户
- 如果用户的 `community_id` 为空，基于 community 的过滤会失败

## 解决方案

### 方案 1: 使用自动修复脚本（推荐）

运行以下脚本自动配置所有必要的权限：

```bash
# 1. 设置管理员 token
export DIRECTUS_ADMIN_TOKEN="your_admin_token_here"

# 2. 运行修复脚本
bash scripts/fix-resident-billing-permissions.sh
```

这个脚本会：
- ✅ 检查并创建 resident policy
- ✅ 配置 billings 表的读权限（只能读自己的数据）
- ✅ 配置关联表权限（communities, buildings, directus_users）
- ✅ 配置其他财务表权限（billing_payments, incomes, expenses）

### 方案 2: 手动在 Directus Admin 中配置

#### 步骤 1: 检查 Policy 配置

1. 访问 Directus Admin: `http://localhost:8055/admin`
2. 进入 Settings → Roles & Permissions
3. 找到 "Resident" 角色
4. 检查是否关联了 Policy
   - 如果没有，点击 "Create Policy" 创建一个
   - 命名为 "Resident Policy"

#### 步骤 2: 配置 billings 表权限

在 Resident Policy 中添加权限：

**Collection**: `billings`  
**Action**: `read`  
**Permissions (Filter)**:
```json
{
  "_and": [
    {
      "owner_id": {
        "_eq": "$CURRENT_USER"
      }
    }
  ]
}
```
**Fields**: 选择 "All Fields" 或手动选择所有字段

#### 步骤 3: 配置关联表权限

**Collection**: `communities`  
**Action**: `read`  
**Permissions**:
```json
{
  "_and": [
    {
      "id": {
        "_eq": "$CURRENT_USER.community_id"
      }
    }
  ]
}
```
**Fields**: `id`, `name`

---

**Collection**: `buildings`  
**Action**: `read`  
**Permissions**:
```json
{
  "_and": [
    {
      "community_id": {
        "_eq": "$CURRENT_USER.community_id"
      }
    }
  ]
}
```
**Fields**: `id`, `name`, `community_id`

---

**Collection**: `directus_users`  
**Action**: `read`  
**Permissions**:
```json
{
  "_and": [
    {
      "id": {
        "_eq": "$CURRENT_USER"
      }
    }
  ]
}
```
**Fields**: `id`, `first_name`, `last_name`, `email`

#### 步骤 4: 配置其他财务表权限

**Collection**: `billing_payments`  
**Action**: `read`  
**Permissions**:
```json
{
  "_and": [
    {
      "owner_id": {
        "_eq": "$CURRENT_USER"
      }
    }
  ]
}
```
**Fields**: All Fields

---

**Collection**: `incomes`  
**Action**: `read`  
**Permissions**:
```json
{
  "_and": [
    {
      "community_id": {
        "_eq": "$CURRENT_USER.community_id"
      }
    }
  ]
}
```
**Fields**: All Fields

---

**Collection**: `expenses`  
**Action**: `read`  
**Permissions**:
```json
{
  "_and": [
    {
      "community_id": {
        "_eq": "$CURRENT_USER.community_id"
      }
    },
    {
      "status": {
        "_eq": "approved"
      }
    }
  ]
}
```
**Fields**: All Fields

## 验证权限配置

### 方法 1: 使用诊断脚本

```bash
export DIRECTUS_ADMIN_TOKEN="your_admin_token_here"
bash scripts/diagnose-billing-permissions.sh
```

### 方法 2: 手动测试 API

1. 使用 resident 用户登录获取 token
2. 测试 API 访问：

```bash
# 替换 <resident_token> 为实际的 token
curl -s "http://localhost:8055/items/billings?limit=1" \
  -H "Authorization: Bearer <resident_token>" | jq
```

如果返回数据，说明权限配置正确。  
如果返回 403 Forbidden，说明权限配置有问题。

### 方法 3: 在应用中测试

1. 使用 resident 用户登录应用
2. 访问 Profile 页面
3. 点击 "查看小区收支情况"
4. 应该能正常显示财务数据

## 常见错误和解决方法

### 错误 1: 403 Forbidden

**原因**: 权限配置不正确或缺失

**解决**:
- 检查 policy 是否正确关联到 resident 角色
- 检查权限规则中的 filter 是否正确
- 运行修复脚本重新配置权限

### 错误 2: 返回空数据

**原因**: 过滤规则太严格，或测试用户数据不匹配

**解决**:
- 检查测试用户的 `community_id` 是否正确设置
- 检查 billing 数据的 `owner_id` 是否匹配测试用户
- 在 Directus Admin 中手动创建测试数据

### 错误 3: 关联字段为 null

**原因**: 关联表没有读权限

**解决**:
- 确保 communities, buildings, directus_users 表都配置了读权限
- 运行修复脚本自动配置所有关联表权限

## 权限配置最佳实践

### 1. 使用 Policy 系统

- 为每个角色创建独立的 policy
- 在 policy 中配置权限，而不是直接在 role 上
- 便于管理和维护

### 2. 最小权限原则

- Resident 只能读取自己的数据（`owner_id = $CURRENT_USER`）
- 只能读取自己社区的数据（`community_id = $CURRENT_USER.community_id`）
- 只能读取已审核的支出数据（`status = approved`）

### 3. 字段级权限

- 敏感字段（如员工工资）不对 resident 开放
- 使用字段级权限控制数据可见性

### 4. 测试驱动

- 配置权限后立即测试
- 使用真实用户数据测试
- 覆盖所有角色和场景

## 相关文档

- [Directus Permissions 官方文档](https://docs.directus.io/configuration/users-roles-permissions.html)
- [Directus Policy 系统](https://docs.directus.io/configuration/users-roles-permissions.html#policies)
- [财务功能设计文档](./design.md)
- [权限配置脚本](../../scripts/fix-resident-billing-permissions.sh)
