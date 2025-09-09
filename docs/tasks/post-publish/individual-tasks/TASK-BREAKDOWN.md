# 发布帖子功能开发任务分解

> **项目目标**: 实现+号按钮的发布功能，支持发布到"业主圈"和"事务页"两个入口

## 🎯 功能概述

### 用户流程
1. 点击底部导航栏"+"按钮
2. 进入发布类型选择页面
3. 选择发布类型：【发到业主圈】或【发到事务页】
4. 填写对应表单并提交
5. 成功后显示结果或跳转详情

### 技术架构
- **前端**: Vue 3 + TypeScript + Pinia + uview-plus
- **后端**: Directus (http://localhost:8055)
- **测试账号**: `cunmin@mail.com` / `123`

---

## 📋 任务分解 (按依赖顺序)

### T1 | API基础设施搭建
**目标**: 建立与Directus后端的安全连接和基础API封装

**工作内容**:
1. 创建 `src/api/config.ts` - 配置基础URL和请求拦截器
2. 创建 `src/api/auth.ts` - 封装登录认证逻辑
3. 创建 `src/utils/request.ts` - 统一的HTTP请求封装

**具体要求**:
```typescript
// src/api/config.ts
export const API_BASE_URL = 'http://localhost:8055'
export const TEST_USER = {
  email: 'cunmin@mail.com',
  password: '123'
}

// src/utils/request.ts
export const apiRequest = async (url: string, options?: RequestOptions) => {
  // 自动添加 Authorization: Bearer <token>
  // 统一错误处理
  // 返回标准化响应
}
```

**验证标准**:
- [ ] `apiRequest('/server/info')` 返回服务器信息
- [ ] `login()` 能成功获取并存储access_token
- [ ] 后续请求自动携带token且验证通过

**预计工作量**: 1-1.5小时

---

### T2 | 发布页面路由和基础UI
**目标**: 创建发布入口页面和类型选择界面

**工作内容**:
1. 更新 `src/pages.json` 添加发布页面路由
2. 创建 `src/pages/publish/index.vue` - 发布类型选择页
3. 使用uview-plus搭建基础UI骨架

**页面结构**:
```vue
<template>
  <view class="publish-container">
    <view class="header">
      <text class="title">选择发布类型</text>
    </view>
    
    <view class="type-buttons">
      <u-button 
        @click="goToPost"
        type="primary"
        size="large">
        发到业主圈
      </u-button>
      
      <u-button 
        @click="goToComplaint"
        type="warning" 
        size="large">
        发到事务页
      </u-button>
    </view>
  </view>
</template>
```

**路由配置**:
```json
// pages.json 新增
{
  "path": "pages/publish/index",
  "style": {
    "navigationBarTitleText": "发布内容"
  }
}
```

**验证标准**:
- [ ] 点击底部"+"按钮能跳转到发布页
- [ ] 发布页显示两个选项按钮
- [ ] 点击按钮能跳转到对应的子页面 (先跳到空白页面)

**预计工作量**: 1小时

---

### T3 | 数据字典API封装
**目标**: 封装获取社区、楼栋、部门数据的API函数

**工作内容**:
1. 创建 `src/api/dictionary.ts` - 字典数据API
2. 实现内存缓存机制 (5分钟有效期)
3. 添加TypeScript类型定义

**API接口**:
```typescript
// src/api/dictionary.ts
export interface Community {
  id: string
  name: string
}

export interface Building {
  id: string
  name: string
  community_id: string
}

export interface Department {
  id: string
  name: string
}

// 带缓存的API函数
export const fetchCommunities = (): Promise<Community[]>
export const fetchBuildings = (communityId?: string): Promise<Building[]>
export const fetchDepartments = (): Promise<Department[]>
```

**Directus API调用**:
```bash
# 社区列表
GET /items/communities?fields=id,name&limit=-1

# 楼栋列表 (可按社区过滤)
GET /items/buildings?fields=id,name,community_id&limit=-1
GET /items/buildings?fields=id,name,community_id&filter[community_id][_eq]=<COMM_ID>

# 部门列表
GET /items/departments?fields=id,name&limit=-1
```

**验证标准**:
- [ ] `fetchCommunities()` 返回社区列表数组
- [ ] `fetchBuildings()` 返回楼栋列表数组
- [ ] 5分钟内重复调用使用缓存数据
- [ ] 网络失败时有合理错误处理

**预计工作量**: 1-1.5小时

---

### T4 | 发布API核心函数
**目标**: 封装内容创建和工单创建的API函数

**工作内容**:
1. 创建 `src/api/content.ts` - 内容发布API
2. 实现两个核心函数：创建内容、创建工单
3. 完善错误处理和类型定义

**API函数**:
```typescript
// src/api/content.ts
export interface CreateContentParams {
  type: 'post' | 'complaint'
  title: string
  body: string
  community_id: string
  building_id?: string
  target_department_id?: string
}

export interface WorkOrderParams {
  content_id: string
  community_id: string
}

// 创建内容 (业主圈帖子 或 投诉内容)
export const createContent = (params: CreateContentParams): Promise<string>

// 创建工单 (仅投诉需要)
export const createWorkOrder = (params: WorkOrderParams): Promise<string>
```

**Directus API调用**:
```bash
# 创建内容
POST /items/contents
{
  "type": "post",           # 或 "complaint"
  "title": "标题",
  "body": "内容",
  "community_id": "<uuid>",
  "author": "<当前用户ID>",
  "building_id": "<uuid?>",        # 投诉时可选
  "target_department_id": "<uuid?>" # 投诉时可选
}

# 创建工单 (投诉的第二步)
POST /items/work_orders
{
  "content_id": "<内容ID>",
  "status": "submitted",
  "community_id": "<社区ID>"
}
```

**验证标准**:
- [ ] `createContent()` 能成功创建内容并返回ID
- [ ] `createWorkOrder()` 能成功创建工单并返回ID
- [ ] 错误时抛出包含message的异常
- [ ] 在Directus管理后台能看到创建的记录

**预计工作量**: 1.5小时

---

### T5 | 业主圈发布表单页面
**目标**: 实现发布到业主圈的完整功能

**工作内容**:
1. 创建 `src/pages/publish/post.vue` - 业主圈发布页
2. 创建 `src/stores/publish.ts` - 发布状态管理
3. 集成表单验证和提交逻辑

**页面功能**:
```vue
<template>
  <view class="post-form">
    <!-- 标题输入 -->
    <u-form-item label="标题" required>
      <u-input v-model="form.title" placeholder="请输入帖子标题" />
    </u-form-item>
    
    <!-- 内容输入 -->
    <u-form-item label="内容" required>
      <u-textarea v-model="form.body" placeholder="分享你的想法..." />
    </u-form-item>
    
    <!-- 社区选择 -->
    <u-form-item label="发布到" required>
      <u-picker 
        v-model="form.community_id"
        :list="communities"
        placeholder="选择社区" />
    </u-form-item>
    
    <!-- 提交按钮 -->
    <u-button 
      @click="submitPost"
      :loading="isSubmitting"
      type="primary">
      发布
    </u-button>
  </view>
</template>
```

**状态管理**:
```typescript
// src/stores/publish.ts
export const usePublishStore = defineStore('publish', () => {
  const form = ref({
    title: '',
    body: '',
    community_id: ''
  })
  
  const isSubmitting = ref(false)
  
  const submitPost = async () => {
    // 调用T4的createContent API
    // 处理成功/失败状态
  }
  
  return { form, isSubmitting, submitPost }
})
```

**验证标准**:
- [ ] 表单输入验证正常 (必填字段、长度限制)
- [ ] 社区下拉列表正常加载
- [ ] 提交成功后显示成功提示并清空表单
- [ ] 提交失败时显示具体错误信息
- [ ] Directus后台能看到type='post'的新记录

**预计工作量**: 2小时

---

### T6 | 事务投诉表单页面
**目标**: 实现发布到事务页的两步提交功能

**工作内容**:
1. 创建 `src/pages/publish/complaint.vue` - 投诉发布页
2. 实现两步提交：先创建内容，再创建工单  
3. 处理楼栋联动和失败重试逻辑

**页面功能**:
```vue
<template>
  <view class="complaint-form">
    <!-- 基础信息 (与post相同) -->
    <u-form-item label="标题" required>
      <u-input v-model="form.title" />
    </u-form-item>
    
    <u-form-item label="问题描述" required>
      <u-textarea v-model="form.body" />
    </u-form-item>
    
    <!-- 社区选择 (必填) -->
    <u-form-item label="所属社区" required>
      <u-picker 
        v-model="form.community_id"
        @change="onCommunityChange" />
    </u-form-item>
    
    <!-- 楼栋选择 (可选，联动) -->
    <u-form-item label="相关楼栋">
      <u-picker 
        v-model="form.building_id"
        :list="filteredBuildings" />
    </u-form-item>
    
    <!-- 部门选择 (可选) -->
    <u-form-item label="处理部门">
      <u-picker 
        v-model="form.target_department_id"
        :list="departments" />
    </u-form-item>
    
    <!-- 提交状态显示 -->
    <view v-if="submitStatus" class="submit-status">
      <text>{{ submitStatus }}</text>
      <u-button 
        v-if="needRetryWorkOrder" 
        @click="retryWorkOrder"
        size="small">
        重新创建工单
      </u-button>
    </view>
    
    <u-button @click="submitComplaint">提交投诉</u-button>
  </view>
</template>
```

**两步提交逻辑**:
```typescript
const submitComplaint = async () => {
  try {
    // 第一步：创建投诉内容
    const contentId = await createContent({
      type: 'complaint',
      ...form.value
    })
    
    submitStatus.value = '投诉内容创建成功，正在创建工单...'
    
    // 第二步：创建工单
    const workOrderId = await createWorkOrder({
      content_id: contentId,
      community_id: form.value.community_id
    })
    
    submitStatus.value = '投诉提交成功！'
    
  } catch (error) {
    if (contentId && !workOrderId) {
      // 内容创建成功但工单失败
      submitStatus.value = '内容已创建但工单创建失败'
      needRetryWorkOrder.value = true
    }
  }
}
```

**验证标准**:
- [ ] 社区选择后楼栋列表正确联动
- [ ] 两步提交都成功时显示完成提示
- [ ] 工单创建失败时提供重试功能
- [ ] Directus后台同时有content和work_order记录
- [ ] work_order.content_id 正确关联到content.id

**预计工作量**: 2.5小时

---

### T7 | 提交安全和用户体验优化
**目标**: 完善提交过程的交互体验和安全性

**工作内容**:
1. 实现提交按钮防抖和Loading状态
2. 统一错误提示和成功反馈
3. 添加表单数据验证

**优化内容**:
- **防重复提交**: 提交中按钮禁用，显示loading动画
- **表单验证**: 必填字段检查，内容长度限制
- **错误处理**: 网络错误、服务器错误、业务错误分类提示
- **成功反馈**: Toast提示 + 可选的页面跳转

**代码示例**:
```typescript
// 提交安全包装
const submitWithSafety = async (submitFn: () => Promise<void>) => {
  if (isSubmitting.value) return // 防重复提交
  
  try {
    isSubmitting.value = true
    await submitFn()
    
    // 成功提示
    uni.showToast({
      title: '发布成功',
      icon: 'success'
    })
    
    // 清空表单
    resetForm()
    
  } catch (error) {
    // 统一错误处理
    const message = extractErrorMessage(error)
    uni.showToast({
      title: message,
      icon: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
```

**验证标准**:
- [ ] 快速连续点击提交按钮不会重复提交
- [ ] 网络错误时显示"网络连接失败，请重试"
- [ ] 服务器错误时显示具体错误信息
- [ ] 成功后有明确的反馈并清空表单
- [ ] 必填字段未填写时有醒目提示

**预计工作量**: 1小时

---

### T8 | 成功后跳转和详情页面
**目标**: 提供发布成功后的跳转和简易详情查看

**工作内容**:
1. 创建 `src/pages/content/detail.vue` - 内容详情页
2. 创建 `src/pages/workorder/detail.vue` - 工单详情页
3. 实现发布成功后的跳转逻辑

**详情页面功能**:
```vue
<!-- content/detail.vue -->
<template>
  <view class="content-detail">
    <view class="header">
      <text class="title">{{ content.title }}</text>
      <text class="meta">{{ content.type === 'post' ? '业主圈' : '投诉' }}</text>
    </view>
    
    <view class="body">
      <text>{{ content.body }}</text>
    </view>
    
    <view class="footer">
      <text>发布时间: {{ formatTime(content.date_created) }}</text>
      <text>所属社区: {{ content.community.name }}</text>
    </view>
  </view>
</template>
```

**Directus查询API**:
```bash
# 内容详情
GET /items/contents/:id?fields=id,type,title,body,date_created,community.name,author.email

# 工单详情
GET /items/work_orders/:id?fields=id,status,content_id.title,community.name,date_created
```

**跳转逻辑**:
```typescript
// 发布成功后
const handlePublishSuccess = (contentId: string, workOrderId?: string) => {
  uni.showToast({
    title: '发布成功',
    icon: 'success'
  })
  
  setTimeout(() => {
    if (workOrderId) {
      // 投诉跳转到工单详情
      uni.navigateTo({
        url: `/pages/workorder/detail?id=${workOrderId}`
      })
    } else {
      // 帖子跳转到内容详情
      uni.navigateTo({
        url: `/pages/content/detail?id=${contentId}`
      })
    }
  }, 1500)
}
```

**验证标准**:
- [ ] 发布成功后能跳转到对应详情页
- [ ] 详情页正确显示发布的内容信息
- [ ] 投诉类型能正确显示关联的工单状态
- [ ] 页面返回逻辑正常

**预计工作量**: 1.5小时

---

## 📊 任务总览

| 任务 | 预计工作量 | 依赖关系 | 验证重点 |
|------|-----------|----------|----------|
| T1 - API基础设施 | 1.5h | 无 | 认证和请求封装 |
| T2 - 路由和UI骨架 | 1h | 无 | 页面跳转和基础交互 |
| T3 - 数据字典API | 1.5h | T1 | 数据获取和缓存 |
| T4 - 发布核心API | 1.5h | T1 | 内容创建和工单创建 |
| T5 - 业主圈表单 | 2h | T1,T3,T4 | 单步提交功能 |
| T6 - 投诉表单 | 2.5h | T1,T3,T4 | 两步提交和联动 |
| T7 - 安全优化 | 1h | T5,T6 | 用户体验和防护 |
| T8 - 详情页面 | 1.5h | T4 | 跳转和详情显示 |

**总工作量**: 约12小时  
**建议分配**: 可拆分给2-3个AI并行开发，每个AI负责2-4个任务

---

## 🔒 开发约束

### 必须遵循的规范
1. **严格按照任务顺序**: 后续任务依赖前面任务的输出
2. **小步快跑**: 每个任务完成后必须验证通过才能进行下一个
3. **代码质量**: 每个任务完成后运行 `npm run lint` 确保无错误
4. **类型安全**: 所有API函数必须有完整的TypeScript类型定义
5. **错误处理**: 每个网络请求都要有合理的错误处理逻辑

### Directus后端交互规范
```bash
# 环境配置
BASE_URL="http://localhost:8055"
TEST_USER="cunmin@mail.com"  
TEST_PASSWORD="123"

# 认证流程
1. POST /auth/login 获取access_token
2. 后续请求header: Authorization: Bearer <token>
3. 获取当前用户ID: GET /users/me

# 错误处理
- 4xx错误: 显示具体的错误信息
- 5xx错误: 显示"服务暂不可用，请稍后重试"
- 网络错误: 显示"网络连接失败，请检查网络"
```

---

## 🧪 测试和验证

### 每个任务的DoD (Definition of Done)
1. ✅ 功能按预期工作
2. ✅ 通过 `npm run lint` 检查  
3. ✅ 在Directus后台能看到相关数据
4. ✅ 错误场景有合理提示
5. ✅ 代码有适当注释
6. ✅ 提交信息规范

### 端到端验证脚本
最终完成时，应该能通过以下手动测试：
```
1. 点击底部+按钮 → 进入发布页面
2. 选择"发到业主圈" → 填写表单 → 提交成功 → 后台有post记录
3. 返回发布页面
4. 选择"发到事务页" → 填写表单 → 提交成功 → 后台有content+work_order记录  
5. 各种错误场景都有合理提示
```

---

**最后更新**: 2025-01-07  
**负责人**: 项目协调员  
**预计完成时间**: 2-3天 (按任务并行开发)

💡 **重要提醒**: 每个AI在开发时必须严格按照[AI开发约束规范](../AI-DEVELOPMENT-CONSTRAINTS.md)执行！