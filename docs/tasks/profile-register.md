# Profile页面用户注册功能开发

## 任务概述
开发Profile页面的用户信息管理和注册功能，包括头像选择、昵称输入、小区信息获取和用户注册。

## 开发任务

### 1. 头像选择功能
**目标**: 允许用户选择和更换头像
- 实现点击头像选择图片功能
- 支持相册和拍照两种选择方式
- 添加"点击更换头像"提示
- 头像路径动态绑定和更新

**技术实现**:
```javascript
// 选择头像
async function chooseAvatar() {
  const res = await uni.chooseImage({
    count: 1,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera']
  });
  if (res.tempFilePaths && res.tempFilePaths[0]) {
    avatarPath.value = res.tempFilePaths[0];
  }
}
```

### 2. 小区信息获取功能
**目标**: 从Directus获取并显示所有小区信息
- API端点: `GET /api/items/communities`
- 显示所有小区而不是仅第一个
- 每个小区独立卡片展示
- 包含小区名称、地址、描述信息

**技术实现**:
```javascript
async function getCommunityInfo() {
  const res = await uni.request({
    url: '/api/items/communities',
    method: 'GET'
  });
  communities.value = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
}
```

### 3. 用户注册功能

#### 3.1 分析Directus用户注册需求
**发现的关键问题**:
- Directus不支持自定义`nickname`字段用于用户注册
- 必须使用标准字段: `first_name`, `last_name`, `email`, `password`
- 需要获取并分配`resident`角色

#### 3.2 注册流程设计
**第一步**: 获取resident角色ID
```javascript
const rolesRes = await uni.request({ url: '/api/roles', method: 'GET' });
const residentRole = roles.find(role => role.name === 'resident' || role.name === 'Resident');
```

**第二步**: 构建用户数据
```javascript
const userData = {
  first_name: nickname.value.trim(),
  last_name: '用户',
  email: `${nickname.value.toLowerCase()}@test.com`,
  password: '123456',
  role: residentRoleId  // 关键：分配角色
};
```

**第三步**: 多端点尝试注册
```javascript
const endpoints = ['/api/users', '/api/auth/register', '/api/items/directus_users'];
// 逐一尝试直到成功
```

**第四步**: 关联小区信息
```javascript
await uni.request({
  url: `/api/users/${userId}`,
  method: 'PATCH',
  data: { community_id: communities.value[1].id }  // 第二个小区
});
```

#### 3.3 错误分析和调试功能
- 详细的错误信息记录和显示
- 包含时间戳、用户数据、小区信息、角色信息
- 复制按钮便于错误信息分析
- 控制台详细日志输出

## 技术难点与解决方案

### 难点1: Directus用户字段映射
**问题**: 初始使用`nickname`字段注册失败，用户无法在后台找到
**解决**: 研究Directus官方文档，使用标准字段`first_name`, `last_name`, `email`, `password`

### 难点2: 角色分配
**问题**: 注册的用户默认没有角色，权限不足
**解决**: 
1. 通过`/api/roles`端点获取所有角色
2. 查找`resident`角色并获取ID
3. 在用户注册时包含`role`字段

### 难点3: 小区信息关联
**问题**: 需要将用户关联到第二个小区
**解决**:
1. 获取所有小区信息
2. 取第二个小区的ID (`communities[1].id`)
3. 注册成功后通过PATCH请求更新用户的`community_id`

## API端点总结

| 功能 | 方法 | 端点 | 说明 |
|------|------|------|------|
| 获取角色 | GET | `/api/roles` | 获取所有系统角色 |
| 获取小区 | GET | `/api/items/communities` | 获取所有小区信息 |
| 用户注册 | POST | `/api/users` | 创建新用户(主要方式) |
| 更新用户 | PATCH | `/api/users/{id}` | 更新用户信息(关联小区) |

## 成功指标
- ✅ 用户可以选择和更换头像
- ✅ 用户可以输入昵称进行注册  
- ✅ 系统能获取并显示所有小区信息
- ✅ 用户注册成功并在Directus后台可见
- ✅ 用户自动分配到`resident`角色
- ✅ 用户关联到指定的第二个小区
- ✅ 完整的错误处理和调试信息

## 代码文件
主要修改文件: `src/pages/profile/profile.vue`
- 完全重构了profile页面
- 从复杂的用户管理系统简化为专注的注册功能
- 实现了现代化的卡片布局设计
- 添加了完善的错误处理和用户反馈机制

## 后续优化建议
1. **头像上传**: 实现头像文件上传到Directus的`/files`端点
2. **表单验证**: 添加昵称、邮箱格式验证
3. **密码策略**: 实现更安全的默认密码生成
4. **用户体验**: 添加加载动画和更好的视觉反馈
5. **权限管理**: 根据resident角色配置适当的权限