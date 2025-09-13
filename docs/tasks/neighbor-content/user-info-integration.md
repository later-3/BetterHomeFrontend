# 业主圈用户信息集成实现文档

## 📋 任务概述

在业主圈页面中实现从Directus后端获取并正确显示用户头像和昵称，将content数据转换为社交动态格式。

## 🎯 实现目标

1. 通过Directus关联查询获取完整的用户信息（昵称、头像）
2. 将后端content数据转换为前端社交动态格式
3. 在SocialFeedContent组件中正确显示用户头像和昵称
4. 实现移动应用标准的token管理（2小时过期）

## 🔧 技术实现

### 1. 后端API查询优化

#### 关联查询语法
使用Directus关联查询语法获取用户信息：

```javascript
fields: 'id,title,body,type,community_id,attachments.*,user_created.*,author_id.id,author_id.first_name,author_id.last_name,author_id.avatar,date_created'
```

#### 关键字段说明
- `author_id.id` - 作者用户ID
- `author_id.first_name` - 作者姓名
- `author_id.last_name` - 作者姓氏
- `author_id.avatar` - 作者头像文件ID
- `attachments.*` - 附件信息（包含图片）
- `user_created.*` - 系统创建用户信息（备用）

### 2. 数据结构分析

#### 实际返回的数据结构
```json
{
  "id": "90cbe348-068a-45a0-9184-7eb4202b8ff9",
  "title": "hi",
  "body": "body", 
  "type": "post",
  "community_id": "45df5312-bf5c-48a7-a722-8b34da0d137d",
  "attachments": [
    {
      "id": 4,
      "contents_id": "90cbe348-068a-45a0-9184-7eb4202b8ff9",
      "directus_files_id": "c2e62acf-f16c-409f-b049-f840522dec4f"
    }
  ],
  "author_id": {
    "id": "b793401e-34de-43d1-9f4f-852401be552b",
    "first_name": "sadasdasdasd",
    "last_name": "用户", 
    "avatar": "7f62c6ca-0566-4e54-9c59-9457b962bf08"
  }
}
```

### 3. 用户信息提取逻辑

#### 优先级策略
```javascript
// 优先级1: 使用关联查询的author_id信息
if (item.author_id && typeof item.author_id === 'object') {
  // 智能组合姓名
  let authorName = '';
  if (item.author_id.first_name && item.author_id.last_name) {
    authorName = `${item.author_id.first_name} ${item.author_id.last_name}`;
  } else if (item.author_id.first_name) {
    authorName = item.author_id.first_name;
  } else if (item.author_id.last_name) {
    authorName = item.author_id.last_name;
  } else {
    authorName = '业主用户';
  }
  
  // 处理头像URL
  let authorAvatar = '';
  if (item.author_id.avatar) {
    authorAvatar = getImageUrl(item.author_id.avatar);
  }
  
  return {
    name: authorName,
    avatar: authorAvatar,
    title: `${item.community_name || '社区'}业主`
  };
}

// 优先级2: 使用user_created系统字段（备用）
// 优先级3: 其他字段（兼容性处理）
```

### 4. 图片URL处理

#### 头像URL生成
```javascript
function getImageUrl(attachment: any): string {
  if (!token.value) {
    return '';
  }
  
  // 处理不同格式的attachment
  let attachmentId = '';
  if (typeof attachment === 'string') {
    attachmentId = attachment;
  } else if (attachment && typeof attachment === 'object') {
    attachmentId = attachment.directus_files_id || 
                   attachment.id || 
                   attachment.file_id || 
                   attachment.attachment_id || '';
  }
  
  if (!attachmentId) {
    return '';
  }
  
  // 生成带token的图片URL
  return `${apiBaseUrl.value}/assets/${attachmentId}?access_token=${token.value}`;
}
```

#### 附件图片处理
```javascript
// 基于实际数据结构处理attachments
images = item.attachments
  .map((att: any, imgIndex: number) => {
    // 使用directus_files_id字段
    const fileId = att.directus_files_id || att.id || att;
    return getImageUrl(fileId);
  })
  .filter((url: string) => url);
```

### 5. 前端组件显示

#### SocialFeedContent组件头像显示
```vue
<template>
  <div class="avatar">
    <img 
      v-if="post.user.avatar" 
      :src="post.user.avatar" 
      class="avatar-image" 
      alt="用户头像" 
    />
    <div v-else class="avatar-placeholder">👤</div>
  </div>
</template>

<style>
.avatar-image {
  width: 100%;
  height: 100%; 
  object-fit: cover;
  border-radius: 50%;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;
}
</style>
```

### 6. Token管理优化

#### 移动应用标准Token管理
```javascript
// Pinia Store增强
state: () => ({
  token: '',
  tokenExpiry: null as Date | null, // 新增过期时间
  // ...其他状态
}),

getters: {
  // 检查token是否即将过期（提前5分钟警告）
  tokenNearExpiry: (state) => {
    if (!state.tokenExpiry) return false;
    const now = new Date();
    const warningTime = new Date(state.tokenExpiry.getTime() - 5 * 60 * 1000);
    return now >= warningTime;
  },
  
  // 检查token是否已过期
  tokenExpired: (state) => {
    if (!state.tokenExpiry) return false;
    return new Date() >= state.tokenExpiry;
  }
},

actions: {
  // 登录时设置token过期时间（2小时）
  login(userInfo, token, expiryMinutes = 120) {
    this.token = token;
    this.tokenExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);
    // ...其他逻辑
  }
}
```

## 📊 测试功能

### 原始数据测试
实现了完整的测试系统来验证API数据：

1. **获取原始数据** - 同时测试3种不同的请求类型
2. **转换POST数据** - 基于真实数据进行转换测试  
3. **原始数据显示** - 可查看和复制完整的API响应
4. **调试日志** - 详细记录数据处理过程

### 测试流程
```
登录获取Token → 获取原始数据 → 转换POST数据 → 查看社交动态
```

## ✅ 实现结果

### 成功展示的信息
1. **真实用户昵称**: `sadasdasdasd 用户`, `bob 用户`, `啊啊啊啊 用户`
2. **用户头像**: 从Directus assets获取的真实头像图片
3. **图片附件**: 基于`directus_files_id`的内容图片
4. **完整用户信息**: 包含头像、昵称、身份标题

### 关键改进点
- ✅ 使用Directus关联查询语法获取完整用户信息
- ✅ 智能处理用户名组合（first_name + last_name）
- ✅ 优雅处理`author_id`为`null`的边界情况
- ✅ 基于真实数据结构优化图片URL生成
- ✅ 实现移动应用标准token管理（2小时过期）
- ✅ 完整的测试和调试系统

## 📝 文件变更清单

### 主要文件
- `src/pages/neighbor/neighbor.vue` - 核心逻辑实现
- `src/components/SocialFeedContent.vue` - 显示组件优化
- `src/store/user.ts` - token管理增强
- `src/pages/profile/login.vue` - 登录token设置

### 新增功能
- 原始数据测试系统
- POST数据转换功能
- 移动应用token管理
- 头像显示支持

## 🚀 部署说明

此实现完全基于现有的Directus API，无需后端改动，仅需确保：
1. 用户表包含`first_name`, `last_name`, `avatar`字段
2. content表包含`author_id`外键关联
3. Directus API权限配置允许关联查询

---

*文档创建时间: 2025-09-13*  
*实现状态: ✅ 完成并测试通过*