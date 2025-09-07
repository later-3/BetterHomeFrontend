# BetterHome 完整开发指导文档

> 基于 `ttk-cli/uni-vue3-vite-ts-pinia` 底座的跨平台应用开发指南
> 版本: v2.0 | 更新时间: 2025年9月

---

## 📖 目录

1. [项目概述](#1-项目概述)
2. [快速开始](#2-快速开始)
3. [架构原则](#3-架构原则)
4. [项目结构](#4-项目结构)
5. [开发规范](#5-开发规范)
6. [开发任务指南](#6-开发任务指南)
7. [代码模板库](#7-代码模板库)
8. [质量保证](#8-质量保证)
9. [部署和构建](#9-部署和构建)
10. [团队协作](#10-团队协作)
11. [常见问题](#11-常见问题)
12. [学习资源](#12-学习资源)

---

## 1. 项目概述

### 1.1 项目介绍
BetterHome 是基于 `ttk-cli/uni-vue3-vite-ts-pinia` 脚手架构建的跨平台应用，支持H5、微信小程序、支付宝小程序等多端发布。

### 1.2 核心技术栈
- **跨平台框架**: uni-app (Vue 3)
- **开发语言**: TypeScript 5.x
- **状态管理**: Pinia 2.x + 持久化插件
- **构建工具**: Vite 5.x
- **样式方案**: SCSS + UnoCSS
- **代码规范**: ESLint + Prettier + Stylelint

### 1.3 项目特色
- 🚀 **极速开发**: Vite热重载 + 组件自动导入
- 🔧 **工程化完备**: 代码规范、提交规范、自动化脚本
- 🌐 **跨平台一致**: 一套代码多端运行
- 💾 **数据持久化**: 跨端状态自动同步
- 📱 **响应式设计**: rpx单位自适应屏幕

---

## 2. 快速开始

### 2.1 环境要求
```bash
# Node.js版本要求
node >= 16.x
npm >= 8.x

# 推荐使用nvm管理Node版本
nvm use 16
```

### 2.2 项目初始化
```bash
# 1. 克隆项目
git clone [项目地址]
cd betterhome-frontend

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev:h5          # H5版本
npm run dev:mp-weixin   # 微信小程序版本

# 4. 验证环境
npm run lint            # 代码检查
npm run type-check      # 类型检查
```

### 2.3 VSCode配置
```json
// .vscode/settings.json
{
  "typescript.preferences.quoteStyle": "single",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnSave": true,
  "volar.takeOverMode.enabled": true
}
```

**必装插件**:
- Volar (Vue 3 支持)
- TypeScript Vue Plugin
- ESLint
- Prettier
- UnoCSS

---

## 3. 架构原则

### 3.1 🛡️ 框架保护第一原则

**绝对禁止对底座框架进行任何侵入式修改！**

#### 🚫 **严格禁止的操作**

**Level 1: 核心配置文件**
```bash
# ❌ 绝对禁止修改
vite.config.ts              # Vite核心配置
tsconfig.json               # TypeScript配置
package.json                # 依赖管理
.eslintrc.js                # 代码规范
unocss.config.ts            # 样式配置
auto/addPage.ts             # 自动化脚本
```

**Level 2: 自动生成文件**
```bash
# ❌ 绝对禁止修改
src/auto-imports.d.ts       # 自动导入类型
src/components.d.ts         # 组件类型声明
src/@helper/                # pinia-auto-refs生成
```

**Level 3: 底座工具函数**
```bash
# ❌ 禁止覆盖或修改
src/utils/request.ts        # 网络请求封装
src/utils/router.ts         # 路由跳转封装
src/utils/platform.ts       # 平台判断
src/utils/uniAsync.ts       # 异步方法封装
```

#### ✅ **允许的扩展方式**
```bash
# ✅ 可以新增文件
src/utils/business.ts       # 业务工具函数
src/components/MyButton.vue # 自定义组件
src/pages/new-page/         # 新页面

# ✅ 可以配置环境变量
.env.development            # 开发环境配置
.env.production             # 生产环境配置

# ✅ 可以扩展底座配置
# 在现有配置基础上添加，而非替换
```

### 3.2 开发约束原则

#### 🚫 **代码级禁止操作**
```typescript
// ❌ 禁止直接使用uni API
uni.navigateTo({ url: '/pages/user/user' })
uni.request({ url: 'https://api.com' })

// ❌ 禁止硬编码配置
const API_URL = 'https://api.example.com'

// ❌ 禁止使用any类型
const userData: any = response.data

// ❌ 禁止在组件中修改props
props.value = newValue
```

#### ✅ **正确的开发方式**
```typescript
// ✅ 使用封装的工具
import { forward } from '@/utils/router'
import request from '@/utils/request'
import { config } from '@/config'

forward('user', { id: '123' })
request.get('/user/info')
const apiUrl = config.apiBaseUrl

// ✅ 严格的类型定义
interface UserData {
  id: string
  name: string
}

// ✅ 通过事件通信
emit('update:value', newValue)
```

---

## 4. 项目结构

### 4.1 完整目录结构
```
ttk-cli-uni-vue3-vite-ts-pinia/
├── .husky/                     # Git钩子配置
├── .vscode/                    # VSCode工作区配置
├── auto/                       # 自动化脚本
│   └── addPage.ts              # 页面生成脚本
├── src/
│   ├── @types/                 # TypeScript类型定义模块
│   │   ├── api/                # API接口类型
│   │   │   ├── user.d.ts       # 用户相关类型
│   │   │   └── property.d.ts   # 房产相关类型
│   │   ├── store.d.ts          # Store状态类型
│   │   └── global.d.ts         # 全局类型声明
│   ├── api/                    # API接口模块
│   │   ├── index.ts            # 统一导出和配置
│   │   ├── user.ts             # 用户相关接口
│   │   ├── property.ts         # 房产相关接口
│   │   └── upload.ts           # 文件上传接口
│   ├── components/             # 组件模块（支持自动导入）
│   │   ├── base/               # 基础原子组件
│   │   │   ├── BaseButton.vue  # 基础按钮
│   │   │   ├── BaseIcon.vue    # 基础图标
│   │   │   └── BaseInput.vue   # 基础输入框
│   │   ├── business/           # 业务组件
│   │   │   ├── UserCard.vue    # 用户卡片
│   │   │   ├── PropertyCard.vue # 房产卡片
│   │   │   └── ComplaintForm.vue # 投诉表单
│   │   └── layout/             # 布局组件
│   │       ├── AppHeader.vue   # 应用头部
│   │       ├── AppFooter.vue   # 应用底部
│   │       └── AppTabBar.vue   # 底部导航
│   ├── config/                 # 配置模块
│   │   ├── index.ts            # 配置统一导出
│   │   ├── env.ts              # 环境配置
│   │   └── app.ts              # 应用配置
│   ├── @helper/                # pinia-auto-refs自动生成
│   │   └── index.ts            # 自动生成的Store助手
│   ├── hooks/                  # Composition API hooks
│   │   ├── useTitle.ts         # 页面标题管理
│   │   ├── usePermission.ts    # 权限控制
│   │   ├── useLoading.ts       # 加载状态管理
│   │   └── useRequest.ts       # 请求状态管理
│   ├── pages/                  # 页面模块
│   │   ├── index/              # 首页
│   │   │   └── index.vue
│   │   ├── user/               # 用户相关页面
│   │   │   ├── profile/        # 个人资料
│   │   │   │   └── profile.vue
│   │   │   └── settings/       # 用户设置
│   │   │       └── settings.vue
│   │   └── property/           # 房产相关页面
│   │       ├── list/           # 房产列表
│   │       │   └── list.vue
│   │       └── detail/         # 房产详情
│   │           └── detail.vue
│   ├── static/                 # 静态资源
│   │   ├── images/             # 图片资源
│   │   ├── icons/              # 图标资源
│   │   └── fonts/              # 字体资源
│   ├── store/                  # 状态管理模块（单数形式）
│   │   ├── index.ts            # Store统一配置
│   │   ├── user.ts             # 用户状态管理
│   │   ├── property.ts         # 房产状态管理
│   │   └── app.ts              # 应用全局状态
│   └── utils/                  # 工具模块
│       ├── request.ts          # 网络请求封装（底座核心）
│       ├── router.ts           # 路由跳转封装（底座核心）
│       ├── platform.ts         # 平台判断（底座核心）
│       ├── shared.ts           # 基础公共方法（底座核心）
│       ├── uniAsync.ts         # 异步方法封装（底座核心）
│       ├── urlMap.ts           # 页面路由映射（底座核心）
│       ├── business.ts         # 业务工具函数（可扩展）
│       ├── validators.ts       # 表单验证工具（可扩展）
│       └── formatters.ts       # 数据格式化工具（可扩展）
├── pages.json                  # 页面路由配置
├── main.ts                     # 应用入口文件
├── uni.scss                    # uni-app全局样式变量
├── unocss.config.ts            # UnoCSS配置
├── vite.config.ts              # Vite配置
├── tsconfig.json               # TypeScript配置
├── .eslintrc.js                # ESLint配置
├── .prettierrc.js              # Prettier配置
└── package.json                # 项目依赖和脚本
```

### 4.2 核心模块说明

#### 📁 `src/@types/` - 类型定义模块
- **职责**: 全局TypeScript类型声明
- **特点**: 支持全局类型，无需import即可使用
- **约束**: 只定义类型，不包含实现逻辑

#### 📁 `src/api/` - API接口模块
- **职责**: 后端接口封装和管理
- **依赖**: utils/request.ts
- **约束**: 不处理业务逻辑，只负责数据请求

#### 📁 `src/components/` - 组件模块
- **职责**: 可复用UI组件
- **特点**: 支持自动导入，无需手动注册
- **组织**: base(基础) + business(业务) + layout(布局)

#### 📁 `src/store/` - 状态管理模块
- **职责**: 全局状态管理和数据持久化
- **特点**: 集成pinia-auto-refs和持久化插件
- **约束**: 单数形式，与底座保持一致

#### 📁 `src/utils/` - 工具模块
- **核心文件**: 底座提供，禁止修改
- **扩展文件**: 可以新增业务工具函数
- **原则**: 纯函数优先，避免副作用

---

## 5. 开发规范

### 5.1 TypeScript规范

#### 类型定义标准
```typescript
// ✅ 完整的接口定义
interface UserInfo {
  id: string
  name: string
  avatar?: string
  email: string
  phone: string
  createTime: number
  updateTime: number
}

// ✅ API请求参数类型
declare namespace UserAPI {
  interface GetUserParams {
    id: string
    includeProfile?: boolean
  }

  interface UpdateUserParams {
    id: string
    name?: string
    avatar?: string
  }
}

// ✅ 组件Props类型
interface Props {
  title: string
  disabled?: boolean
  type?: 'primary' | 'secondary' | 'danger'
}

// ❌ 禁止使用any
const userData: any = response.data

// ✅ 使用具体类型
const userData: UserInfo = response.data
```

#### 类型组织规范
```typescript
// src/@types/api/user.d.ts - API类型
declare namespace UserAPI {
  // 接口相关类型
}

// src/@types/store.d.ts - Store类型
interface UserState {
  userInfo: UserInfo | null
  token: string
  isLoggedIn: boolean
}

// src/@types/global.d.ts - 全局类型
declare global {
  interface Window {
    // 全局扩展
  }
}
```

### 5.2 Vue组件规范

#### 页面组件模板
```vue
<script setup lang="ts">
// 1. 导入依赖（按类型分组）
// 1.1 Vue相关
import { ref, computed, onMounted } from 'vue'

// 1.2 Store相关
import { useUserStore } from '@/store/user'

// 1.3 API相关
import userAPI from '@/api/user'

// 1.4 工具函数
import { forward } from '@/utils/router'
import { showToast } from '@/utils/shared'

// 2. 接收参数
interface Props {
  userId?: string
  showHeader?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  userId: '',
  showHeader: true
})

// 3. 状态管理（优先使用pinia-auto-refs）
const userStore = useUserStore()
const { userInfo, isLoading } = storeToRefs(userStore)

// 4. 响应式数据
const formData = ref<UserFormData>({
  name: '',
  email: '',
  phone: ''
})

const errors = ref<Record<string, string>>({})

// 5. 计算属性
const isFormValid = computed(() => {
  return formData.value.name.trim() !== '' &&
         formData.value.email.trim() !== ''
})

const submitButtonText = computed(() => {
  return isLoading.value ? '保存中...' : '保存'
})

// 6. 生命周期
onMounted(async () => {
  await loadUserData()
})

// 7. 方法定义（按功能分组）
// 7.1 数据加载
const loadUserData = async (): Promise<void> => {
  if (!props.userId) return

  try {
    await userStore.fetchUserInfo(props.userId)
    updateFormData()
  } catch (error) {
    showToast('加载用户数据失败')
    console.error('Load user data failed:', error)
  }
}

// 7.2 表单处理
const updateFormData = (): void => {
  if (userInfo.value) {
    formData.value = {
      name: userInfo.value.name,
      email: userInfo.value.email,
      phone: userInfo.value.phone
    }
  }
}

const validateForm = (): boolean => {
  errors.value = {}

  if (!formData.value.name.trim()) {
    errors.value.name = '姓名不能为空'
  }

  if (!formData.value.email.trim()) {
    errors.value.email = '邮箱不能为空'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
    errors.value.email = '邮箱格式不正确'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async (): Promise<void> => {
  if (!validateForm()) return

  try {
    await userStore.updateUserInfo({
      id: props.userId,
      ...formData.value
    })
    showToast('保存成功')
    forward('user-profile', { id: props.userId })
  } catch (error) {
    showToast('保存失败')
    console.error('Update user failed:', error)
  }
}

// 7.3 页面跳转
const handleCancel = (): void => {
  forward('user-profile', { id: props.userId })
}

const handleAvatarClick = (): void => {
  forward('avatar-upload', { userId: props.userId })
}
</script>

<template>
  <view class="user-edit-page">
    <!-- 头部区域 -->
    <view v-if="showHeader" class="page-header">
      <text class="page-title">编辑资料</text>
    </view>

    <!-- 加载状态 -->
    <view v-if="isLoading" class="loading-container">
      <text>加载中...</text>
    </view>

    <!-- 主要内容 -->
    <view v-else class="page-content">
      <!-- 头像区域 -->
      <view class="avatar-section" @click="handleAvatarClick">
        <image
          :src="userInfo?.avatar || '/static/default-avatar.png'"
          class="avatar-image"
        />
        <text class="avatar-tip">点击更换头像</text>
      </view>

      <!-- 表单区域 -->
      <form class="user-form">
        <!-- 姓名输入 -->
        <view class="form-item">
          <text class="form-label">姓名</text>
          <input
            v-model="formData.name"
            type="text"
            placeholder="请输入姓名"
            class="form-input"
            :class="{ 'form-input--error': errors.name }"
          />
          <text v-if="errors.name" class="form-error">
            {{ errors.name }}
          </text>
        </view>

        <!-- 邮箱输入 -->
        <view class="form-item">
          <text class="form-label">邮箱</text>
          <input
            v-model="formData.email"
            type="email"
            placeholder="请输入邮箱"
            class="form-input"
            :class="{ 'form-input--error': errors.email }"
          />
          <text v-if="errors.email" class="form-error">
            {{ errors.email }}
          </text>
        </view>

        <!-- 手机号输入 -->
        <view class="form-item">
          <text class="form-label">手机号</text>
          <input
            v-model="formData.phone"
            type="text"
            placeholder="请输入手机号"
            class="form-input"
          />
        </view>
      </form>
    </view>

    <!-- 底部按钮 -->
    <view class="page-footer">
      <button
        class="btn btn--secondary"
        @click="handleCancel"
      >
        取消
      </button>
      <button
        class="btn btn--primary"
        :disabled="!isFormValid || isLoading"
        @click="handleSubmit"
      >
        {{ submitButtonText }}
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.user-edit-page {
  min-height: 100vh;
  background: var(--uni-bg-color);
  display: flex;
  flex-direction: column;
}

.page-header {
  @apply p-4 bg-white border-b border-gray-100;

  .page-title {
    @apply text-lg font-medium text-gray-900;
  }
}

.loading-container {
  @apply flex-1 flex items-center justify-center;

  text {
    @apply text-gray-500;
  }
}

.page-content {
  @apply flex-1 p-4;
}

.avatar-section {
  @apply flex flex-col items-center mb-6 p-4;

  .avatar-image {
    @apply w-20 h-20 rounded-full border-2 border-gray-200;
  }

  .avatar-tip {
    @apply mt-2 text-sm text-gray-500;
  }
}

.user-form {
  @apply space-y-4;
}

.form-item {
  @apply space-y-2;

  .form-label {
    @apply block text-sm font-medium text-gray-700;
  }

  .form-input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md;
    @apply focus:outline-none focus:ring-2 focus:ring-blue-500;

    &--error {
      @apply border-red-500;
    }
  }

  .form-error {
    @apply text-sm text-red-500;
  }
}

.page-footer {
  @apply p-4 bg-white border-t border-gray-100;
  @apply flex space-x-3;

  .btn {
    @apply flex-1 py-3 px-4 rounded-md text-center;
    @apply transition-colors duration-200;

    &--primary {
      @apply bg-blue-500 text-white;

      &:not(:disabled):hover {
        @apply bg-blue-600;
      }

      &:disabled {
        @apply bg-gray-300 cursor-not-allowed;
      }
    }

    &--secondary {
      @apply bg-gray-100 text-gray-700;

      &:hover {
        @apply bg-gray-200;
      }
    }
  }
}

// 响应式设计
@media (max-width: 375px) {
  .page-content {
    @apply px-3;
  }

  .avatar-section {
    @apply px-3;
  }
}
</style>
```

#### 业务组件模板
```vue
<script setup lang="ts">
// 1. 组件接口定义
interface Props {
  user: UserInfo
  showActions?: boolean
  size?: 'small' | 'medium' | 'large'
}

interface Emits {
  edit: [user: UserInfo]
  delete: [userId: string]
  view: [userId: string]
}

// 2. Props和Emits
const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  size: 'medium'
})

const emit = defineEmits<Emits>()

// 3. 计算属性
const cardClasses = computed(() => [
  'user-card',
  `user-card--${props.size}`,
  {
    'user-card--with-actions': props.showActions
  }
])

const avatarSize = computed(() => {
  const sizeMap = {
    small: 40,
    medium: 60,
    large: 80
  }
  return sizeMap[props.size]
})

// 4. 事件处理
const handleEdit = (): void => {
  emit('edit', props.user)
}

const handleDelete = (): void => {
  emit('delete', props.user.id)
}

const handleView = (): void => {
  emit('view', props.user.id)
}
</script>

<template>
  <view :class="cardClasses" @click="handleView">
    <!-- 头像区域 -->
    <view class="user-card__avatar">
      <image
        :src="user.avatar || '/static/default-avatar.png'"
        :style="{ width: avatarSize + 'px', height: avatarSize + 'px' }"
        class="avatar-image"
      />
    </view>

    <!-- 信息区域 -->
    <view class="user-card__info">
      <view class="user-card__name">
        <text>{{ user.name }}</text>
      </view>
      <view v-if="user.email" class="user-card__email">
        <text>{{ user.email }}</text>
      </view>
      <view v-if="user.phone" class="user-card__phone">
        <text>{{ user.phone }}</text>
      </view>
    </view>

    <!-- 操作区域 -->
    <view v-if="showActions" class="user-card__actions" @click.stop>
      <button class="action-btn action-btn--edit" @click="handleEdit">
        编辑
      </button>
      <button class="action-btn action-btn--delete" @click="handleDelete">
        删除
      </button>
    </view>

    <!-- 插槽支持 -->
    <view v-if="$slots.default" class="user-card__extra">
      <slot />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.user-card {
  @apply bg-white rounded-lg border border-gray-200 p-4;
  @apply flex items-center space-x-3 cursor-pointer;
  @apply transition-shadow duration-200;

  &:hover {
    @apply shadow-md;
  }

  &--small {
    @apply p-3;
  }

  &--large {
    @apply p-6;
  }

  &__avatar {
    @apply flex-shrink-0;

    .avatar-image {
      @apply rounded-full object-cover;
    }
  }

  &__info {
    @apply flex-1 min-w-0;
  }

  &__name {
    @apply font-medium text-gray-900 truncate;
  }

  &__email {
    @apply text-sm text-gray-500 truncate;
  }

  &__phone {
    @apply text-sm text-gray-500;
  }

  &__actions {
    @apply flex space-x-2;
  }

  &__extra {
    @apply ml-auto;
  }
}

.action-btn {
  @apply px-3 py-1 text-sm rounded;
  @apply transition-colors duration-200;

  &--edit {
    @apply bg-blue-100 text-blue-700;

    &:hover {
      @apply bg-blue-200;
    }
  }

  &--delete {
    @apply bg-red-100 text-red-700;

    &:hover {
      @apply bg-red-200;
    }
  }
}
</style>
```

### 5.3 API开发规范

#### 类型定义
```typescript
// src/@types/api/user.d.ts
declare namespace UserAPI {
  // 请求参数类型
  interface GetUserParams {
    id: string
    includeProfile?: boolean
  }

  interface GetUserListParams extends API.PageParams {
    keyword?: string
    status?: 'active' | 'inactive'
  }

  interface CreateUserParams {
    name: string
    email: string
    phone?: string
    avatar?: string
  }

  interface UpdateUserParams {
    id: string
    name?: string
    email?: string
    phone?: string
    avatar?: string
  }

  // 响应数据类型
  interface UserInfo {
    id: string
    name: string
    email: string
    phone: string
    avatar: string
    status: 'active' | 'inactive'
    createTime: number
    updateTime: number
  }

  interface UserProfile extends UserInfo {
    permissions: string[]
    preferences: Record<string, any>
  }
}

// src/@types/api/common.d.ts
declare namespace API {
  // 通用响应结构
  interface Response<T = any> {
    code: number
    message: string
    data: T
    success: boolean
    timestamp: number
  }

  // 分页参数
  interface PageParams {
    pageNum: number
    pageSize: number
  }

  // 分页响应
  interface PageResponse<T> {
    list: T[]
    total: number
    pageNum: number
    pageSize: number
    totalPages: number
  }

  // 上传响应
  interface UploadResponse {
    url: string
    filename: string
    size: number
  }
}
```

#### API实现
```typescript
// src/api/user.ts
import request from '@/utils/request'

const userAPI = {
  // 获取用户信息
  getUserInfo: (params: UserAPI.GetUserParams) =>
    request.get<UserAPI.UserInfo>('/user/info', params),

  // 获取用户详细信息
  getUserProfile: (params: UserAPI.GetUserParams) =>
    request.get<UserAPI.UserProfile>('/user/profile', params),

  // 获取用户列表
  getUserList: (params: UserAPI.GetUserListParams) =>
    request.get<API.PageResponse<UserAPI.UserInfo>>('/user/list', params),

  // 创建用户
  createUser: (params: UserAPI.CreateUserParams) =>
    request.post<UserAPI.UserInfo>('/user/create', params),

  // 更新用户信息
  updateUser: (params: UserAPI.UpdateUserParams) =>
    request.post<UserAPI.UserInfo>('/user/update', params),

  // 删除用户
  deleteUser: (params: { id: string }) =>
    request.post<{ success: boolean }>('/user/delete', params),

  // 批量操作
  batchDeleteUsers: (params: { ids: string[] }) =>
    request.post<{ success: boolean; failedIds: string[] }>('/user/batch-delete', params),

  // 上传头像
  uploadAvatar: (filePath: string) =>
    request.upload<API.UploadResponse>('/user/upload-avatar', filePath)
}

export default userAPI
```

### 5.4 Store开发规范

#### Store实现
```typescript
// src/store/user.ts
import { defineStore } from 'pinia'
import userAPI from '@/api/user'
import { showToast } from '@/utils/shared'

interface UserState {
  userInfo: UserAPI.UserInfo | null
  userProfile: UserAPI.UserProfile | null
  token: string
  refreshToken: string
  isLoggedIn: boolean
  loading: boolean
  error: string | null
}

export const useUserStore = defineStore({
  id: 'user',

  state: (): UserState => ({
    userInfo: null,
    userProfile: null,
    token: '',
    refreshToken: '',
    isLoggedIn: false,
    loading: false,
    error: null
  }),

  getters: {
    // 基础信息获取
    userName: (state) => state.userInfo?.name || '未登录用户',
    userAvatar: (state) => state.userInfo?.avatar || '/static/default-avatar.png',
    userEmail: (state) => state.userInfo?.email || '',

    // 状态判断
    isAuthenticated: (state) => !!state.token && state.isLoggedIn,
    hasUserInfo: (state) => !!state.userInfo,
    hasProfile: (state) => !!state.userProfile,

    // 权限相关
    userPermissions: (state) => state.userProfile?.permissions || [],
    hasPermission: (state) => (permission: string) => {
      return state.userProfile?.permissions?.includes(permission) || false
    },

    // 状态组合
    isLoadingUser: (state) => state.loading,
    userError: (state) => state.error
  },

  actions: {
    // 用户认证
    async login(credentials: { email: string; password: string }) {
      this.loading = true
      this.error = null

      try {
        const result = await authAPI.login(credentials)

        this.token = result.data.token
        this.refreshToken = result.data.refreshToken
        this.userInfo = result.data.userInfo
        this.isLoggedIn = true

        // 登录成功后获取详细信息
        await this.fetchUserProfile()

        showToast('登录成功')
        return result.data
      } catch (error: any) {
        this.error = error.message || '登录失败'
        showToast(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        if (this.token) {
          await authAPI.logout()
        }
      } catch (error) {
        console.warn('Logout API failed:', error)
      } finally {
        // 清除所有状态
        this.token = ''
        this.refreshToken = ''
        this.userInfo = null
        this.userProfile = null
        this.isLoggedIn = false
        this.error = null

        showToast('已退出登录')
      }
    },

    // 用户信息管理
    async fetchUserInfo(userId?: string) {
      if (!userId && !this.userInfo?.id) return

      this.loading = true
      this.error = null

      try {
        const result = await userAPI.getUserInfo({
          id: userId || this.userInfo!.id
        })
        this.userInfo = result.data
        return result.data
      } catch (error: any) {
        this.error = error.message || '获取用户信息失败'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchUserProfile(userId?: string) {
      if (!userId && !this.userInfo?.id) return

      try {
        const result = await userAPI.getUserProfile({
          id: userId || this.userInfo!.id
        })
        this.userProfile = result.data
        return result.data
      } catch (error: any) {
        console.warn('Fetch user profile failed:', error)
        throw error
      }
    },

    async updateUserInfo(params: UserAPI.UpdateUserParams) {
      this.loading = true
      this.error = null

      try {
        const result = await userAPI.updateUser(params)

        // 更新本地状态
        if (this.userInfo && this.userInfo.id === params.id) {
          this.userInfo = { ...this.userInfo, ...result.data }
        }

        showToast('更新成功')
        return result.data
      } catch (error: any) {
        this.error = error.message || '更新失败'
        showToast(this.error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 状态重置
    clearError() {
      this.error = null
    },

    clearUserData() {
      this.userInfo = null
      this.userProfile = null
      this.error = null
    },

    // Token管理
    setToken(token: string, refreshToken?: string) {
      this.token = token
      if (refreshToken) {
        this.refreshToken = refreshToken
      }
    },

    clearToken() {
      this.token = ''
      this.refreshToken = ''
      this.isLoggedIn = false
    }
  },

  // 持久化配置
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'user-storage',
        storage: {
          getItem: uni.getStorageSync,
          setItem: uni.setStorageSync
        },
        // 选择性持久化，不持久化敏感和临时数据
        paths: ['userInfo', 'token', 'refreshToken', 'isLoggedIn']
      }
    ]
  }
})

export default useUserStore
```

#### Store使用规范
```typescript
// ✅ 使用pinia-auto-refs简化（推荐）
const { userInfo, isLoggedIn, userName, login, logout } = useStore('user')

// ✅ 传统方式（也支持）
const userStore = useUserStore()
const { userInfo, isLoggedIn } = storeToRefs(userStore)
const { login, logout } = userStore

// 在页面中使用
onMounted(async () => {
  if (isLoggedIn.value) {
    await userStore.fetchUserProfile()
  }
})
```

---

## 6. 开发任务指南

### 6.1 添加新页面任务

#### 🤖 自动化方式（推荐）
```bash
# 使用底座提供的自动化脚本
npm run add

# 按提示输入：
# - 页面名称: user-profile
# - 页面标题: 用户资料
# - 是否为分包页面: 否
```

#### 📋 任务分解清单

**Phase 1: 页面基础结构** (30分钟)
- [ ] 使用`npm run add`创建页面
- [ ] 验证路由配置正确
- [ ] 实现基础页面模板
- [ ] 测试页面跳转

**Phase 2: 页面功能实现** (2-4小时)
- [ ] 定义页面Props和State类型
- [ ] 实现数据加载逻辑
- [ ] 添加用户交互功能
- [ ] 处理错误和加载状态

**Phase 3: API和Store集成** (1-2小时)
- [ ] 定义API接口类型（如需要）
- [ ] 实现API调用（如需要）
- [ ] 集成Store状态管理（如需要）
- [ ] 处理数据持久化

**Phase 4: 样式和交互优化** (1-2小时)
- [ ] 实现响应式布局
- [ ] 添加交互动画
- [ ] 优化用户体验
- [ ] 跨端兼容性测试

#### ✅ 验收标准
```bash
# 代码质量检查
npm run lint           # 代码规范检查通过
npm run type-check     # TypeScript类型检查通过

# 功能验证
# - 页面能正常访问和渲染
# - 参数传递和路由跳转正确
# - 数据加载和状态管理正常
# - 跨端兼容性验证（H5 + 小程序）
```

#### 🔧 开发模板
```vue
<!-- src/pages/user-profile/user-profile.vue -->
<script setup lang="ts">
// 页面参数
interface Props {
  userId?: string
}
const props = withDefaults(defineProps<Props>(), {
  userId: ''
})

// 状态管理
const { userInfo, isLoading, fetchUserInfo } = useStore('user')

// 页面状态
const refreshing = ref(false)

// 生命周期
onMounted(async () => {
  await loadData()
})

// 方法定义
const loadData = async () => {
  if (!props.userId) return

  try {
    await fetchUserInfo(props.userId)
  } catch (error) {
    console.error('Load user data failed:', error)
  }
}

const handleRefresh = async () => {
  refreshing.value = true
  try {
    await loadData()
  } finally {
    refreshing.value = false
  }
}

const handleEdit = () => {
  forward('user-edit', { userId: props.userId })
}
</script>

<template>
  <view class="user-profile-page">
    <!-- 加载状态 -->
    <view v-if="isLoading" class="loading">
      <text>加载中...</text>
    </view>

    <!-- 用户信息 -->
    <view v-else-if="userInfo" class="user-info">
      <UserCard
        :user="userInfo"
        :show-actions="true"
        @edit="handleEdit"
      />
    </view>

    <!-- 空状态 -->
    <view v-else class="empty">
      <text>用户不存在</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.user-profile-page {
  min-height: 100vh;
  background: var(--uni-bg-color);
  padding: 20rpx;
}

.loading, .empty {
  @apply flex items-center justify-center h-64;

  text {
    @apply text-gray-500;
  }
}
</style>
```

### 6.2 添加业务组件任务

#### 📋 任务分解清单

**Phase 1: 组件设计** (30分钟)
- [ ] 确定组件功能和接口
- [ ] 设计Props和Events类型
- [ ] 评估复用性和扩展性
- [ ] 选择合适的组件分类

**Phase 2: 组件实现** (1-3小时)
- [ ] 创建组件文件
- [ ] 实现组件逻辑
- [ ] 添加样式和动画
- [ ] 支持插槽扩展

**Phase 3: 集成测试** (30分钟)
- [ ] 验证自动导入功能
- [ ] 测试组件在页面中使用
- [ ] 验证Props和Events
- [ ] 跨端兼容性测试

#### 🔧 组件开发模板
```vue
<!-- src/components/business/PropertyCard.vue -->
<script setup lang="ts">
// 组件Props
interface Props {
  property: PropertyInfo
  showActions?: boolean
  size?: 'small' | 'medium' | 'large'
  clickable?: boolean
}

// 组件Events
interface Emits {
  click: [property: PropertyInfo]
  favorite: [propertyId: string, favorited: boolean]
  share: [propertyId: string]
  contact: [property: PropertyInfo]
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  size: 'medium',
  clickable: true
})

const emit = defineEmits<Emits>()

// 计算属性
const cardClasses = computed(() => [
  'property-card',
  `property-card--${props.size}`,
  {
    'property-card--clickable': props.clickable
  }
])

const priceText = computed(() => {
  if (props.property.price) {
    return `¥${(props.property.price / 10000).toFixed(1)}万`
  }
  return '价格面议'
})

// 内部状态
const favorited = ref(false)

// 事件处理
const handleClick = () => {
  if (props.clickable) {
    emit('click', props.property)
  }
}

const handleFavorite = (event: Event) => {
  event.stopPropagation()
  favorited.value = !favorited.value
  emit('favorite', props.property.id, favorited.value)
}

const handleShare = (event: Event) => {
  event.stopPropagation()
  emit('share', props.property.id)
}

const handleContact = (event: Event) => {
  event.stopPropagation()
  emit('contact', props.property)
}
</script>

<template>
  <view :class="cardClasses" @click="handleClick">
    <!-- 图片区域 -->
    <view class="property-card__image">
      <image
        :src="property.coverImage || '/static/placeholder-property.png'"
        class="image"
        mode="aspectFill"
      />

      <!-- 图片标签 -->
      <view v-if="property.tags?.length" class="image-tags">
        <text
          v-for="tag in property.tags.slice(0, 2)"
          :key="tag"
          class="image-tag"
        >
          {{ tag }}
        </text>
      </view>
    </view>

    <!-- 信息区域 -->
    <view class="property-card__content">
      <!-- 标题和价格 -->
      <view class="property-card__header">
        <text class="property-title">{{ property.title }}</text>
        <text class="property-price">{{ priceText }}</text>
      </view>

      <!-- 基本信息 -->
      <view class="property-card__info">
        <text class="property-area">{{ property.area }}㎡</text>
        <text class="property-type">{{ property.type }}</text>
        <text class="property-location">{{ property.location }}</text>
      </view>

      <!-- 描述 -->
      <view v-if="property.description" class="property-card__desc">
        <text>{{ property.description }}</text>
      </view>

      <!-- 操作按钮 -->
      <view v-if="showActions" class="property-card__actions">
        <button
          class="action-btn action-btn--favorite"
          :class="{ 'action-btn--favorited': favorited }"
          @click="handleFavorite"
        >
          <text>{{ favorited ? '已收藏' : '收藏' }}</text>
        </button>

        <button class="action-btn action-btn--share" @click="handleShare">
          <text>分享</text>
        </button>

        <button class="action-btn action-btn--contact" @click="handleContact">
          <text>联系</text>
        </button>
      </view>
    </view>

    <!-- 插槽支持 -->
    <view v-if="$slots.default" class="property-card__extra">
      <slot />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.property-card {
  @apply bg-white rounded-lg overflow-hidden;
  @apply border border-gray-200 shadow-sm;
  @apply transition-all duration-200;

  &--clickable {
    @apply cursor-pointer;

    &:hover {
      @apply shadow-md transform -translate-y-1;
    }
  }

  &--small {
    .property-card__content {
      @apply p-3;
    }
  }

  &--large {
    .property-card__content {
      @apply p-6;
    }
  }

  &__image {
    @apply relative;
    aspect-ratio: 16/9;

    .image {
      @apply w-full h-full object-cover;
    }

    .image-tags {
      @apply absolute top-2 left-2 flex space-x-1;
    }

    .image-tag {
      @apply px-2 py-1 bg-blue-500 text-white text-xs rounded;
    }
  }

  &__content {
    @apply p-4 space-y-3;
  }

  &__header {
    @apply flex justify-between items-start;

    .property-title {
      @apply flex-1 font-medium text-gray-900 mr-2;
    }

    .property-price {
      @apply text-lg font-bold text-red-500;
    }
  }

  &__info {
    @apply flex space-x-3 text-sm text-gray-500;
  }

  &__desc {
    text {
      @apply text-sm text-gray-600 line-clamp-2;
    }
  }

  &__actions {
    @apply flex space-x-2 pt-2 border-t border-gray-100;
  }

  &__extra {
    @apply p-4 pt-0;
  }
}

.action-btn {
  @apply flex-1 py-2 px-3 text-sm text-center rounded;
  @apply border border-gray-300 text-gray-700;
  @apply transition-colors duration-200;

  &:hover {
    @apply bg-gray-50;
  }

  &--favorite {
    &.action-btn--favorited {
      @apply bg-red-50 border-red-300 text-red-700;
    }
  }

  &--contact {
    @apply bg-blue-500 border-blue-500 text-white;

    &:hover {
      @apply bg-blue-600;
    }
  }
}
</style>
```

### 6.3 API接口开发任务

#### 📋 任务分解清单

**Phase 1: 接口设计** (30分钟)
- [ ] 分析业务需求
- [ ] 设计接口参数和响应结构
- [ ] 定义TypeScript类型
- [ ] 规划错误处理

**Phase 2: 类型定义** (30分钟)
- [ ] 在`@types/api/`中定义接口类型
- [ ] 定义请求参数类型
- [ ] 定义响应数据类型
- [ ] 扩展通用类型（如需要）

**Phase 3: API实现** (1小时)
- [ ] 在`api/`目录创建模块文件
- [ ] 实现具体API方法
- [ ] 添加请求参数验证
- [ ] 配置错误处理

**Phase 4: 集成测试** (30分钟)
- [ ] 在页面中调用API
- [ ] 验证参数传递
- [ ] 测试错误处理
- [ ] 验证响应数据类型

#### 🔧 API开发模板
```typescript
// src/@types/api/property.d.ts
declare namespace PropertyAPI {
  // 房产基本信息
  interface PropertyInfo {
    id: string
    title: string
    description: string
    price: number
    area: number
    type: 'apartment' | 'house' | 'commercial'
    status: 'available' | 'sold' | 'rented'
    location: string
    address: string
    coverImage: string
    images: string[]
    tags: string[]
    amenities: string[]
    contact: {
      name: string
      phone: string
      email: string
    }
    createTime: number
    updateTime: number
  }

  // 搜索参数
  interface SearchParams extends API.PageParams {
    keyword?: string
    type?: PropertyInfo['type']
    status?: PropertyInfo['status']
    minPrice?: number
    maxPrice?: number
    minArea?: number
    maxArea?: number
    location?: string
    sortBy?: 'price' | 'area' | 'createTime'
    sortOrder?: 'asc' | 'desc'
  }

  // 创建/更新参数
  interface CreatePropertyParams {
    title: string
    description: string
    price: number
    area: number
    type: PropertyInfo['type']
    location: string
    address: string
    coverImage?: string
    images?: string[]
    tags?: string[]
    amenities?: string[]
    contact: PropertyInfo['contact']
  }

  interface UpdatePropertyParams extends Partial<CreatePropertyParams> {
    id: string
  }

  // 收藏相关
  interface FavoriteParams {
    propertyId: string
  }

  interface FavoriteInfo {
    id: string
    propertyId: string
    userId: string
    createTime: number
  }
}

// src/api/property.ts
import request from '@/utils/request'

const propertyAPI = {
  // 获取房产列表
  getPropertyList: (params: PropertyAPI.SearchParams) =>
    request.get<API.PageResponse<PropertyAPI.PropertyInfo>>('/property/list', params),

  // 获取房产详情
  getPropertyDetail: (params: { id: string }) =>
    request.get<PropertyAPI.PropertyInfo>('/property/detail', params),

  // 创建房产
  createProperty: (params: PropertyAPI.CreatePropertyParams) =>
    request.post<PropertyAPI.PropertyInfo>('/property/create', params),

  // 更新房产
  updateProperty: (params: PropertyAPI.UpdatePropertyParams) =>
    request.post<PropertyAPI.PropertyInfo>('/property/update', params),

  // 删除房产
  deleteProperty: (params: { id: string }) =>
    request.post<{ success: boolean }>('/property/delete', params),

  // 搜索建议
  getSearchSuggestions: (params: { keyword: string }) =>
    request.get<{ keywords: string[]; locations: string[] }>('/property/search-suggestions', params),

  // 收藏相关
  addToFavorites: (params: PropertyAPI.FavoriteParams) =>
    request.post<PropertyAPI.FavoriteInfo>('/property/favorite/add', params),

  removeFromFavorites: (params: PropertyAPI.FavoriteParams) =>
    request.post<{ success: boolean }>('/property/favorite/remove', params),

  getFavoriteList: (params: API.PageParams) =>
    request.get<API.PageResponse<PropertyAPI.PropertyInfo>>('/property/favorite/list', params),

  // 图片上传
  uploadPropertyImages: (filePaths: string[]) =>
    request.uploadMultiple<API.UploadResponse[]>('/property/upload-images', filePaths),

  // 统计数据
  getPropertyStats: () =>
    request.get<{
      total: number
      available: number
      sold: number
      rented: number
      avgPrice: number
    }>('/property/stats')
}

export default propertyAPI
```

### 6.4 Store状态管理任务

#### 📋 任务分解清单

**Phase 1: 状态设计** (30分钟)
- [ ] 分析业务状态需求
- [ ] 设计state结构
- [ ] 规划getters计算属性
- [ ] 设计actions方法

**Phase 2: 类型定义** (30分钟)
- [ ] 定义State接口类型
- [ ] 定义Actions参数类型
- [ ] 配置持久化策略
- [ ] 处理状态迁移

**Phase 3: Store实现** (1-2小时)
- [ ] 实现state初始状态
- [ ] 实现getters计算属性
- [ ] 实现actions业务逻辑
- [ ] 配置数据持久化

**Phase 4: 集成使用** (30分钟)
- [ ] 在页面中使用Store
- [ ] 验证状态响应性
- [ ] 测试持久化功能
- [ ] 优化性能

#### 🔧 Store开发模板
```typescript
// src/store/property.ts
import { defineStore } from 'pinia'
import propertyAPI from '@/api/property'
import { showToast } from '@/utils/shared'

interface PropertyState {
  // 房产列表相关
  propertyList: PropertyAPI.PropertyInfo[]
  propertyListLoading: boolean
  propertyListError: string | null
  propertyListTotal: number
  propertyListPageNum: number
  propertyListHasMore: boolean

  // 房产详情相关
  propertyDetail: PropertyAPI.PropertyInfo | null
  propertyDetailLoading: boolean
  propertyDetailError: string | null

  // 搜索相关
  searchKeyword: string
  searchFilters: Partial<PropertyAPI.SearchParams>
  searchSuggestions: { keywords: string[]; locations: string[] }

  // 收藏相关
  favoriteList: PropertyAPI.PropertyInfo[]
  favoriteIds: Set<string>
  favoriteListLoading: boolean

  // 用户操作状态
  creating: boolean
  updating: boolean
  deleting: boolean
}

export const usePropertyStore = defineStore({
  id: 'property',

  state: (): PropertyState => ({
    // 房产列表
    propertyList: [],
    propertyListLoading: false,
    propertyListError: null,
    propertyListTotal: 0,
    propertyListPageNum: 1,
    propertyListHasMore: true,

    // 房产详情
    propertyDetail: null,
    propertyDetailLoading: false,
    propertyDetailError: null,

    // 搜索
    searchKeyword: '',
    searchFilters: {},
    searchSuggestions: { keywords: [], locations: [] },

    // 收藏
    favoriteList: [],
    favoriteIds: new Set(),
    favoriteListLoading: false,

    // 操作状态
    creating: false,
    updating: false,
    deleting: false
  }),

  getters: {
    // 列表状态
    hasPropertyList: (state) => state.propertyList.length > 0,
    isPropertyListEmpty: (state) => !state.propertyListLoading && state.propertyList.length === 0,
    propertyListStatus: (state) => ({
      loading: state.propertyListLoading,
      error: state.propertyListError,
      hasData: state.propertyList.length > 0,
      hasMore: state.propertyListHasMore
    }),

    // 详情状态
    hasPropertyDetail: (state) => !!state.propertyDetail,
    propertyDetailStatus: (state) => ({
      loading: state.propertyDetailLoading,
      error: state.propertyDetailError,
      hasData: !!state.propertyDetail
    }),

    // 搜索状态
    hasSearchKeyword: (state) => state.searchKeyword.trim() !== '',
    hasSearchFilters: (state) => Object.keys(state.searchFilters).length > 0,
    activeSearchParams: (state) => ({
      keyword: state.searchKeyword,
      ...state.searchFilters
    }),

    // 收藏状态
    favoriteCount: (state) => state.favoriteIds.size,
    isFavorite: (state) => (propertyId: string) => state.favoriteIds.has(propertyId),

    // 操作状态
    isAnyOperating: (state) => state.creating || state.updating || state.deleting,
    operationStatus: (state) => ({
      creating: state.creating,
      updating: state.updating,
      deleting: state.deleting
    })
  },

  actions: {
    // 房产列表管理
    async fetchPropertyList(params: PropertyAPI.SearchParams = {}, append = false) {
      if (!append) {
        this.propertyListLoading = true
        this.propertyListError = null
      }

      try {
        const searchParams = {
          pageNum: append ? this.propertyListPageNum + 1 : 1,
          pageSize: 20,
          ...params
        }

        const result = await propertyAPI.getPropertyList(searchParams)

        if (append) {
          this.propertyList.push(...result.data.list)
        } else {
          this.propertyList = result.data.list
        }

        this.propertyListTotal = result.data.total
        this.propertyListPageNum = result.data.pageNum
        this.propertyListHasMore = result.data.pageNum < result.data.totalPages

        return result.data
      } catch (error: any) {
        this.propertyListError = error.message || '加载房产列表失败'
        if (!append) {
          showToast(this.propertyListError)
        }
        throw error
      } finally {
        this.propertyListLoading = false
      }
    },

    async loadMorePropertyList() {
      if (!this.propertyListHasMore || this.propertyListLoading) return

      return this.fetchPropertyList(this.activeSearchParams, true)
    },

    async refreshPropertyList() {
      return this.fetchPropertyList(this.activeSearchParams, false)
    },

    // 房产详情管理
    async fetchPropertyDetail(propertyId: string) {
      this.propertyDetailLoading = true
      this.propertyDetailError = null

      try {
        const result = await propertyAPI.getPropertyDetail({ id: propertyId })
        this.propertyDetail = result.data
        return result.data
      } catch (error: any) {
        this.propertyDetailError = error.message || '加载房产详情失败'
        showToast(this.propertyDetailError)
        throw error
      } finally {
        this.propertyDetailLoading = false
      }
    },

    clearPropertyDetail() {
      this.propertyDetail = null
      this.propertyDetailError = null
    },

    // 搜索管理
    updateSearchKeyword(keyword: string) {
      this.searchKeyword = keyword
    },

    updateSearchFilters(filters: Partial<PropertyAPI.SearchParams>) {
      this.searchFilters = { ...this.searchFilters, ...filters }
    },

    clearSearchFilters() {
      this.searchKeyword = ''
      this.searchFilters = {}
    },

    async fetchSearchSuggestions(keyword: string) {
      if (!keyword.trim()) {
        this.searchSuggestions = { keywords: [], locations: [] }
        return
      }

      try {
        const result = await propertyAPI.getSearchSuggestions({ keyword })
        this.searchSuggestions = result.data
        return result.data
      } catch (error) {
        console.warn('Fetch search suggestions failed:', error)
      }
    },

    // 收藏管理
    async fetchFavoriteList() {
      this.favoriteListLoading = true

      try {
        const result = await propertyAPI.getFavoriteList({ pageNum: 1, pageSize: 100 })
        this.favoriteList = result.data.list
        this.favoriteIds = new Set(result.data.list.map(item => item.id))
        return result.data
      } catch (error: any) {
        showToast('加载收藏列表失败')
        throw error
      } finally {
        this.favoriteListLoading = false
      }
    },

    async toggleFavorite(propertyId: string) {
      const isFavorited = this.favoriteIds.has(propertyId)

      try {
        if (isFavorited) {
          await propertyAPI.removeFromFavorites({ propertyId })
          this.favoriteIds.delete(propertyId)
          this.favoriteList = this.favoriteList.filter(item => item.id !== propertyId)
          showToast('已取消收藏')
        } else {
          await propertyAPI.addToFavorites({ propertyId })
          this.favoriteIds.add(propertyId)
          showToast('已添加收藏')
        }

        return !isFavorited
      } catch (error: any) {
        showToast(isFavorited ? '取消收藏失败' : '添加收藏失败')
        throw error
      }
    },

    // 房产操作
    async createProperty(params: PropertyAPI.CreatePropertyParams) {
      this.creating = true

      try {
        const result = await propertyAPI.createProperty(params)

        // 更新本地列表
        this.propertyList.unshift(result.data)
        this.propertyListTotal += 1

        showToast('创建成功')
        return result.data
      } catch (error: any) {
        showToast('创建失败')
        throw error
      } finally {
        this.creating = false
      }
    },

    async updateProperty(params: PropertyAPI.UpdatePropertyParams) {
      this.updating = true

      try {
        const result = await propertyAPI.updateProperty(params)

        // 更新本地数据
        const index = this.propertyList.findIndex(item => item.id === params.id)
        if (index > -1) {
          this.propertyList[index] = result.data
        }

        if (this.propertyDetail?.id === params.id) {
          this.propertyDetail = result.data
        }

        showToast('更新成功')
        return result.data
      } catch (error: any) {
        showToast('更新失败')
        throw error
      } finally {
        this.updating = false
      }
    },

    async deleteProperty(propertyId: string) {
      this.deleting = true

      try {
        await propertyAPI.deleteProperty({ id: propertyId })

        // 更新本地数据
        this.propertyList = this.propertyList.filter(item => item.id !== propertyId)
        this.favoriteList = this.favoriteList.filter(item => item.id !== propertyId)
        this.favoriteIds.delete(propertyId)
        this.propertyListTotal -= 1

        if (this.propertyDetail?.id === propertyId) {
          this.propertyDetail = null
        }

        showToast('删除成功')
      } catch (error: any) {
        showToast('删除失败')
        throw error
      } finally {
        this.deleting = false
      }
    },

    // 状态重置
    clearError() {
      this.propertyListError = null
      this.propertyDetailError = null
    },

    resetState() {
      this.propertyList = []
      this.propertyDetail = null
      this.searchKeyword = ''
      this.searchFilters = {}
      this.favoriteList = []
      this.favoriteIds = new Set()
      this.clearError()
    }
  },

  // 持久化配置
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'property-storage',
        storage: {
          getItem: uni.getStorageSync,
          setItem: uni.setStorageSync
        },
        // 只持久化部分状态，避免数据过时
        paths: ['searchKeyword', 'searchFilters', 'favoriteIds']
      }
    ]
  }
})

export default usePropertyStore
```

---

## 7. 代码模板库

### 7.1 页面模板

#### 列表页模板
```vue
<!-- 列表页通用模板 -->
<script setup lang="ts">
interface Props {
  category?: string
}

const props = withDefaults(defineProps<Props>(), {
  category: ''
})

// Store状态
const {
  propertyList,
  propertyListStatus,
  searchKeyword,
  fetchPropertyList,
  loadMorePropertyList,
  refreshPropertyList
} = useStore('property')

// 页面状态
const refreshing = ref(false)
const searchValue = ref('')

// 生命周期
onMounted(() => {
  loadData()
})

// 方法定义
const loadData = async () => {
  try {
    await fetchPropertyList({ category: props.category })
  } catch (error) {
    console.error('Load data failed:', error)
  }
}

const handleSearch = async () => {
  if (searchValue.value === searchKeyword) return

  try {
    await fetchPropertyList({
      keyword: searchValue.value,
      category: props.category
    })
  } catch (error) {
    console.error('Search failed:', error)
  }
}

const handleRefresh = async () => {
  refreshing.value = true
  try {
    await refreshPropertyList()
  } finally {
    refreshing.value = false
  }
}

const handleLoadMore = async () => {
  if (!propertyListStatus.hasMore || propertyListStatus.loading) return

  try {
    await loadMorePropertyList()
  } catch (error) {
    console.error('Load more failed:', error)
  }
}

const handleItemClick = (item: PropertyAPI.PropertyInfo) => {
  forward('property-detail', { id: item.id })
}
</script>

<template>
  <view class="list-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrapper">
        <input
          v-model="searchValue"
          type="text"
          placeholder="搜索房产"
          class="search-input"
          @confirm="handleSearch"
        />
        <button class="search-btn" @click="handleSearch">搜索</button>
      </view>
    </view>

    <!-- 列表内容 -->
    <scroll-view
      class="scroll-container"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="handleRefresh"
      @scrolltolower="handleLoadMore"
    >
      <!-- 加载状态 -->
      <view v-if="propertyListStatus.loading && !propertyList.length" class="loading">
        <text>加载中...</text>
      </view>

      <!-- 列表项 -->
      <view v-else-if="propertyList.length" class="list-content">
        <PropertyCard
          v-for="item in propertyList"
          :key="item.id"
          :property="item"
          class="list-item"
          @click="handleItemClick(item)"
        />

        <!-- 加载更多 -->
        <view v-if="propertyListStatus.hasMore" class="load-more">
          <text v-if="propertyListStatus.loading">加载中...</text>
          <text v-else>上拉加载更多</text>
        </view>

        <!-- 没有更多 -->
        <view v-else class="no-more">
          <text>没有更多数据了</text>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty">
        <text>暂无数据</text>
        <button @click="loadData">重新加载</button>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.list-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--uni-bg-color);
}

.search-bar {
  @apply p-4 bg-white border-b border-gray-100;

  .search-input-wrapper {
    @apply flex space-x-2;
  }

  .search-input {
    @apply flex-1 px-3 py-2 border border-gray-300 rounded;
  }

  .search-btn {
    @apply px-4 py-2 bg-blue-500 text-white rounded;
  }
}

.scroll-container {
  flex: 1;
}

.list-content {
  @apply p-4 space-y-3;
}

.list-item {
  @apply mb-3;
}

.loading, .empty, .load-more, .no-more {
  @apply py-8 text-center text-gray-500;
}

.empty {
  @apply space-y-4;

  button {
    @apply px-4 py-2 bg-blue-500 text-white rounded;
  }
}
</style>
```

#### 表单页模板
```vue
<!-- 表单页通用模板 -->
<script setup lang="ts">
interface Props {
  id?: string
  mode?: 'create' | 'edit'
}

const props = withDefaults(defineProps<Props>(), {
  id: '',
  mode: 'create'
})

// 表单数据
const formData = ref<PropertyAPI.CreatePropertyParams>({
  title: '',
  description: '',
  price: 0,
  area: 0,
  type: 'apartment',
  location: '',
  address: '',
  contact: {
    name: '',
    phone: '',
    email: ''
  }
})

// 表单验证
const errors = ref<Record<string, string>>({})
const rules = {
  title: [
    { required: true, message: '标题不能为空' },
    { max: 100, message: '标题不能超过100个字符' }
  ],
  price: [
    { required: true, message: '价格不能为空' },
    { min: 0, message: '价格不能为负数' }
  ],
  area: [
    { required: true, message: '面积不能为空' },
    { min: 0, message: '面积不能为负数' }
  ],
  'contact.name': [
    { required: true, message: '联系人姓名不能为空' }
  ],
  'contact.phone': [
    { required: true, message: '联系电话不能为空' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
  ]
}

// Store状态
const { creating, updating, createProperty, updateProperty } = useStore('property')

// 计算属性
const isEditing = computed(() => props.mode === 'edit')
const submitText = computed(() => {
  if (creating.value || updating.value) {
    return isEditing.value ? '更新中...' : '创建中...'
  }
  return isEditing.value ? '更新' : '创建'
})

const isFormValid = computed(() => {
  return Object.keys(errors.value).length === 0 &&
         formData.value.title.trim() !== '' &&
         formData.value.price > 0 &&
         formData.value.area > 0
})

// 生命周期
onMounted(() => {
  if (isEditing.value && props.id) {
    loadPropertyData()
  }
})

// 方法定义
const loadPropertyData = async () => {
  try {
    // 加载编辑数据的逻辑
  } catch (error) {
    console.error('Load property data failed:', error)
  }
}

const validateField = (field: string, value: any) => {
  const fieldRules = rules[field as keyof typeof rules]
  if (!fieldRules) return

  for (const rule of fieldRules) {
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors.value[field] = rule.message
      return
    }

    if (rule.max && value.toString().length > rule.max) {
      errors.value[field] = rule.message
      return
    }

    if (rule.min && Number(value) < rule.min) {
      errors.value[field] = rule.message
      return
    }

    if (rule.pattern && !rule.pattern.test(value.toString())) {
      errors.value[field] = rule.message
      return
    }
  }

  delete errors.value[field]
}

const validateForm = () => {
  errors.value = {}

  // 验证所有必需字段
  validateField('title', formData.value.title)
  validateField('price', formData.value.price)
  validateField('area', formData.value.area)
  validateField('contact.name', formData.value.contact.name)
  validateField('contact.phone', formData.value.contact.phone)

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return

  try {
    if (isEditing.value) {
      await updateProperty({ id: props.id, ...formData.value })
    } else {
      await createProperty(formData.value)
    }

    // 跳转到列表页或详情页
    forward('property-list')
  } catch (error) {
    console.error('Submit failed:', error)
  }
}

const handleCancel = () => {
  uni.navigateBack()
}
</script>

<template>
  <view class="form-page">
    <!-- 头部 -->
    <view class="page-header">
      <text class="page-title">
        {{ isEditing ? '编辑房产' : '创建房产' }}
      </text>
    </view>

    <!-- 表单内容 -->
    <scroll-view class="form-container" scroll-y>
      <form class="form">
        <!-- 基本信息 -->
        <view class="form-section">
          <text class="section-title">基本信息</text>

          <view class="form-item">
            <text class="form-label">标题 *</text>
            <input
              v-model="formData.title"
              type="text"
              placeholder="请输入房产标题"
              class="form-input"
              :class="{ 'form-input--error': errors.title }"
              @blur="validateField('title', formData.title)"
            />
            <text v-if="errors.title" class="form-error">{{ errors.title }}</text>
          </view>

          <view class="form-item">
            <text class="form-label">描述</text>
            <textarea
              v-model="formData.description"
              placeholder="请输入房产描述"
              class="form-textarea"
            />
          </view>

          <view class="form-row">
            <view class="form-item flex-1">
              <text class="form-label">价格 *</text>
              <input
                v-model.number="formData.price"
                type="number"
                placeholder="0"
                class="form-input"
                :class="{ 'form-input--error': errors.price }"
                @blur="validateField('price', formData.price)"
              />
              <text v-if="errors.price" class="form-error">{{ errors.price }}</text>
            </view>

            <view class="form-item flex-1">
              <text class="form-label">面积 *</text>
              <input
                v-model.number="formData.area"
                type="number"
                placeholder="0"
                class="form-input"
                :class="{ 'form-input--error': errors.area }"
                @blur="validateField('area', formData.area)"
              />
              <text v-if="errors.area" class="form-error">{{ errors.area }}</text>
            </view>
          </view>

          <view class="form-item">
            <text class="form-label">类型</text>
            <picker
              :value="formData.type"
              :range="[{value: 'apartment', label: '公寓'}, {value: 'house', label: '别墅'}, {value: 'commercial', label: '商用'}]"
              range-key="label"
              @change="(e) => formData.type = ['apartment', 'house', 'commercial'][e.detail.value]"
            >
              <view class="picker-view">
                {{ {'apartment': '公寓', 'house': '别墅', 'commercial': '商用'}[formData.type] }}
              </view>
            </picker>
          </view>
        </view>

        <!-- 位置信息 -->
        <view class="form-section">
          <text class="section-title">位置信息</text>

          <view class="form-item">
            <text class="form-label">位置</text>
            <input
              v-model="formData.location"
              type="text"
              placeholder="请输入位置"
              class="form-input"
            />
          </view>

          <view class="form-item">
            <text class="form-label">详细地址</text>
            <input
              v-model="formData.address"
              type="text"
              placeholder="请输入详细地址"
              class="form-input"
            />
          </view>
        </view>

        <!-- 联系信息 -->
        <view class="form-section">
          <text class="section-title">联系信息</text>

          <view class="form-item">
            <text class="form-label">联系人 *</text>
            <input
              v-model="formData.contact.name"
              type="text"
              placeholder="请输入联系人姓名"
              class="form-input"
              :class="{ 'form-input--error': errors['contact.name'] }"
              @blur="validateField('contact.name', formData.contact.name)"
            />
            <text v-if="errors['contact.name']" class="form-error">
              {{ errors['contact.name'] }}
            </text>
          </view>

          <view class="form-item">
            <text class="form-label">联系电话 *</text>
            <input
              v-model="formData.contact.phone"
              type="text"
              placeholder="请输入联系电话"
              class="form-input"
              :class="{ 'form-input--error': errors['contact.phone'] }"
              @blur="validateField('contact.phone', formData.contact.phone)"
            />
            <text v-if="errors['contact.phone']" class="form-error">
              {{ errors['contact.phone'] }}
            </text>
          </view>

          <view class="form-item">
            <text class="form-label">邮箱</text>
            <input
              v-model="formData.contact.email"
              type="email"
              placeholder="请输入邮箱"
              class="form-input"
            />
          </view>
        </view>
      </form>
    </scroll-view>

    <!-- 底部按钮 -->
    <view class="form-footer">
      <button class="btn btn--secondary" @click="handleCancel">
        取消
      </button>
      <button
        class="btn btn--primary"
        :disabled="!isFormValid || creating || updating"
        @click="handleSubmit"
      >
        {{ submitText }}
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.form-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--uni-bg-color);
}

.page-header {
  @apply p-4 bg-white border-b border-gray-100;

  .page-title {
    @apply text-lg font-medium text-gray-900;
  }
}

.form-container {
  flex: 1;
}

.form {
  @apply p-4 space-y-6;
}

.form-section {
  @apply space-y-4;

  .section-title {
    @apply text-base font-medium text-gray-900 border-b border-gray-200 pb-2;
  }
}

.form-row {
  @apply flex space-x-3;
}

.form-item {
  @apply space-y-2;

  &.flex-1 {
    @apply flex-1;
  }

  .form-label {
    @apply block text-sm font-medium text-gray-700;
  }

  .form-input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md;
    @apply focus:outline-none focus:ring-2 focus:ring-blue-500;

    &--error {
      @apply border-red-500;
    }
  }

  .form-textarea {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md h-20;
    @apply focus:outline-none focus:ring-2 focus:ring-blue-500;
  }

  .form-error {
    @apply text-sm text-red-500;
  }

  .picker-view {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md;
    @apply bg-white text-gray-900;
  }
}

.form-footer {
  @apply p-4 bg-white border-t border-gray-100;
  @apply flex space-x-3;

  .btn {
    @apply flex-1 py-3 px-4 rounded-md text-center;
    @apply transition-colors duration-200;

    &--primary {
      @apply bg-blue-500 text-white;

      &:not(:disabled) {
        &:hover {
          @apply bg-blue-600;
        }
      }

      &:disabled {
        @apply bg-gray-300 cursor-not-allowed;
      }
    }

    &--secondary {
      @apply bg-gray-100 text-gray-700;

      &:hover {
        @apply bg-gray-200;
      }
    }
  }
}
</style>
```

### 7.2 组件模板

#### 列表项组件模板
```vue
<!-- 列表项组件通用模板 -->
<script setup lang="ts">
interface Props {
  item: any // 根据实际数据类型调整
  showActions?: boolean
  size?: 'small' | 'medium' | 'large'
  layout?: 'horizontal' | 'vertical'
}

interface Emits {
  click: [item: any]
  edit: [item: any]
  delete: [itemId: string]
  favorite: [itemId: string, favorited: boolean]
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true,
  size: 'medium',
  layout: 'horizontal'
})

const emit = defineEmits<Emits>()

// 内部状态
const favorited = ref(false)

// 计算属性
const itemClasses = computed(() => [
  'list-item',
  `list-item--${props.size}`,
  `list-item--${props.layout}`,
  {
    'list-item--with-actions': props.showActions
  }
])

// 事件处理
const handleClick = () => {
  emit('click', props.item)
}

const handleEdit = (event: Event) => {
  event.stopPropagation()
  emit('edit', props.item)
}

const handleDelete = (event: Event) => {
  event.stopPropagation()
  emit('delete', props.item.id)
}

const handleFavorite = (event: Event) => {
  event.stopPropagation()
  favorited.value = !favorited.value
  emit('favorite', props.item.id, favorited.value)
}
</script>

<template>
  <view :class="itemClasses" @click="handleClick">
    <!-- 主要内容区 -->
    <view class="list-item__content">
      <!-- 图标/头像 -->
      <view v-if="item.avatar || item.icon" class="list-item__icon">
        <image
          :src="item.avatar || item.icon"
          class="icon-image"
        />
      </view>

      <!-- 文本信息 -->
      <view class="list-item__info">
        <view class="list-item__title">
          <text>{{ item.title || item.name }}</text>
        </view>
        <view v-if="item.description" class="list-item__desc">
          <text>{{ item.description }}</text>
        </view>
        <view v-if="item.meta" class="list-item__meta">
          <text>{{ item.meta }}</text>
        </view>
      </view>

      <!-- 右侧内容 -->
      <view class="list-item__right">
        <slot name="right">
          <text v-if="item.value" class="list-item__value">
            {{ item.value }}
          </text>
        </slot>
      </view>
    </view>

    <!-- 操作按钮区 -->
    <view v-if="showActions" class="list-item__actions" @click.stop>
      <button
        v-if="item.canFavorite"
        class="action-btn action-btn--favorite"
        :class="{ 'action-btn--favorited': favorited }"
        @click="handleFavorite"
      >
        <text>{{ favorited ? '已收藏' : '收藏' }}</text>
      </button>

      <button
        v-if="item.canEdit"
        class="action-btn action-btn--edit"
        @click="handleEdit"
      >
        <text>编辑</text>
      </button>

      <button
        v-if="item.canDelete"
        class="action-btn action-btn--delete"
        @click="handleDelete"
      >
        <text>删除</text>
      </button>

      <!-- 自定义操作插槽 -->
      <slot name="actions" :item="item" />
    </view>

    <!-- 底部扩展区 -->
    <view v-if="$slots.footer" class="list-item__footer">
      <slot name="footer" :item="item" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.list-item {
  @apply bg-white border border-gray-200 rounded-lg;
  @apply transition-all duration-200 cursor-pointer;

  &:hover {
    @apply shadow-md;
  }

  &--small {
    @apply p-3;
  }

  &--medium {
    @apply p-4;
  }

  &--large {
    @apply p-6;
  }

  &--horizontal {
    .list-item__content {
      @apply flex items-center space-x-3;
    }
  }

  &--vertical {
    .list-item__content {
      @apply space-y-3;
    }
  }

  &__content {
    @apply flex-1;
  }

  &__icon {
    @apply flex-shrink-0;

    .icon-image {
      @apply w-10 h-10 rounded-full object-cover;
    }
  }

  &__info {
    @apply flex-1 min-w-0 space-y-1;
  }

  &__title {
    @apply font-medium text-gray-900 truncate;
  }

  &__desc {
    @apply text-sm text-gray-600 line-clamp-2;
  }

  &__meta {
    @apply text-xs text-gray-500;
  }

  &__right {
    @apply flex-shrink-0 text-right;
  }

  &__value {
    @apply text-sm font-medium text-gray-900;
  }

  &__actions {
    @apply flex space-x-2 mt-3 pt-3 border-t border-gray-100;
  }

  &__footer {
    @apply mt-3 pt-3 border-t border-gray-100;
  }
}

.action-btn {
  @apply px-3 py-1 text-sm rounded border;
  @apply transition-colors duration-200;

  &--favorite {
    @apply border-gray-300 text-gray-700;

    &:hover {
      @apply bg-gray-50;
    }

    &.action-btn--favorited {
      @apply bg-red-50 border-red-300 text-red-700;
    }
  }

  &--edit {
    @apply border-blue-300 text-blue-700 bg-blue-50;

    &:hover {
      @apply bg-blue-100;
    }
  }

  &--delete {
    @apply border-red-300 text-red-700 bg-red-50;

    &:hover {
      @apply bg-red-100;
    }
  }
}
</style>
```

#### 弹窗组件模板
```vue
<!-- 弹窗组件通用模板 -->
<script setup lang="ts">
interface Props {
  visible: boolean
  title?: string
  maskClosable?: boolean
  width?: string
  zIndex?: number
}

interface Emits {
  'update:visible': [visible: boolean]
  confirm: []
  cancel: []
  close: []
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  maskClosable: true,
  width: '80%',
  zIndex: 1000
})

const emit = defineEmits<Emits>()

// 计算属性
const modalStyle = computed(() => ({
  zIndex: props.zIndex,
  display: props.visible ? 'flex' : 'none'
}))

const contentStyle = computed(() => ({
  width: props.width,
  maxWidth: '90vw'
}))

// 事件处理
const handleMaskClick = () => {
  if (props.maskClosable) {
    handleClose()
  }
}

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  handleClose()
}

// 阻止内容区点击冒泡
const handleContentClick = (event: Event) => {
  event.stopPropagation()
}
</script>

<template>
  <view v-if="visible" class="modal-overlay" :style="modalStyle" @click="handleMaskClick">
    <view class="modal-content" :style="contentStyle" @click="handleContentClick">
      <!-- 头部 -->
      <view v-if="title || $slots.header" class="modal-header">
        <slot name="header">
          <text class="modal-title">{{ title }}</text>
        </slot>
        <button class="modal-close" @click="handleClose">
          <text>×</text>
        </button>
      </view>

      <!-- 内容 -->
      <view class="modal-body">
        <slot />
      </view>

      <!-- 底部 -->
      <view v-if="$slots.footer" class="modal-footer">
        <slot name="footer" :confirm="handleConfirm" :cancel="handleCancel" />
      </view>

      <!-- 默认底部按钮 -->
      <view v-else class="modal-footer">
        <button class="btn btn--secondary" @click="handleCancel">
          取消
        </button>
        <button class="btn btn--primary" @click="handleConfirm">
          确定
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50;
  @apply flex items-center justify-center p-4;
}

.modal-content {
  @apply bg-white rounded-lg shadow-xl;
  @apply flex flex-col max-h-full;

  animation: modalSlideIn 0.3s ease-out;
}

.modal-header {
  @apply flex items-center justify-between p-4 border-b border-gray-200;

  .modal-title {
    @apply text-lg font-medium text-gray-900;
  }

  .modal-close {
    @apply w-6 h-6 flex items-center justify-center;
    @apply text-gray-400 hover:text-gray-600;

    text {
      @apply text-xl;
    }
  }
}

.modal-body {
  @apply flex-1 p-4 overflow-y-auto;
}

.modal-footer {
  @apply flex space-x-3 p-4 border-t border-gray-200;

  .btn {
    @apply flex-1 py-2 px-4 rounded text-center;
    @apply transition-colors duration-200;

    &--primary {
      @apply bg-blue-500 text-white;

      &:hover {
        @apply bg-blue-600;
      }
    }

    &--secondary {
      @apply bg-gray-100 text-gray-700;

      &:hover {
        @apply bg-gray-200;
      }
    }
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
```

### 7.3 工具函数模板

#### 表单验证工具
```typescript
// src/utils/validators.ts
export interface ValidationRule {
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  validator?: (value: any) => boolean
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export class FormValidator {
  private rules: Record<string, ValidationRule[]> = {}

  // 添加验证规则
  addRule(field: string, rules: ValidationRule[]): void {
    this.rules[field] = rules
  }

  // 验证单个字段
  validateField(field: string, value: any): string | null {
    const fieldRules = this.rules[field]
    if (!fieldRules) return null

    for (const rule of fieldRules) {
      // 必填验证
      if (rule.required && this.isEmpty(value)) {
        return rule.message
      }

      // 如果值为空且非必填，跳过其他验证
      if (this.isEmpty(value) && !rule.required) {
        continue
      }

      // 最小值/长度验证
      if (rule.min !== undefined) {
        if (typeof value === 'number' && value < rule.min) {
          return rule.message
        }
        if (typeof value === 'string' && value.length < rule.min) {
          return rule.message
        }
      }

      // 最大值/长度验证
      if (rule.max !== undefined) {
        if (typeof value === 'number' && value > rule.max) {
          return rule.message
        }
        if (typeof value === 'string' && value.length > rule.max) {
          return rule.message
        }
      }

      // 正则验证
      if (rule.pattern && !rule.pattern.test(String(value))) {
        return rule.message
      }

      // 自定义验证
      if (rule.validator && !rule.validator(value)) {
        return rule.message
      }
    }

    return null
  }

  // 验证整个表单
  validate(data: Record<string, any>): ValidationResult {
    const errors: Record<string, string> = {}

    // 验证所有定义了规则的字段
    Object.keys(this.rules).forEach(field => {
      const error = this.validateField(field, this.getNestedValue(data, field))
      if (error) {
        errors[field] = error
      }
    })

    return {
      valid: Object.keys(errors).length === 0,
      errors
    }
  }

  // 判断值是否为空
  private isEmpty(value: any): boolean {
    return value === null ||
           value === undefined ||
           value === '' ||
           (Array.isArray(value) && value.length === 0)
  }

  // 获取嵌套对象的值
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
}

// 预定义的验证规则
export const commonRules = {
  required: (message = '该字段为必填项'): ValidationRule => ({
    required: true,
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    min,
    message: message || `最少需要${min}个字符`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    max,
    message: message || `最多允许${max}个字符`
  }),

  email: (message = '请输入有效的邮箱地址'): ValidationRule => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message
  }),

  phone: (message = '请输入有效的手机号'): ValidationRule => ({
    pattern: /^1[3-9]\d{9}$/,
    message
  }),

  number: (message = '请输入有效的数字'): ValidationRule => ({
    validator: (value) => !isNaN(Number(value)) && isFinite(Number(value)),
    message
  }),

  positiveNumber: (message = '请输入正数'): ValidationRule => ({
    validator: (value) => Number(value) > 0,
    message
  }),

  url: (message = '请输入有效的URL'): ValidationRule => ({
    pattern: /^https?:\/\/.+/,
    message
  })
}

// 使用示例
export const createUserValidator = () => {
  const validator = new FormValidator()

  validator.addRule('name', [
    commonRules.required('姓名不能为空'),
    commonRules.minLength(2, '姓名至少需要2个字符'),
    commonRules.maxLength(20, '姓名不能超过20个字符')
  ])

  validator.addRule('email', [
    commonRules.required('邮箱不能为空'),
    commonRules.email()
  ])

  validator.addRule('phone', [
    commonRules.required('手机号不能为空'),
    commonRules.phone()
  ])

  return validator
}
```

#### 数据格式化工具
```typescript
// src/utils/formatters.ts
import dayjs from 'dayjs'

// 时间格式化
export const formatDate = {
  // 标准日期格式
  standard: (date: Date | string | number, format = 'YYYY-MM-DD'): string => {
    return dayjs(date).format(format)
  },

  // 带时间的格式
  datetime: (date: Date | string | number): string => {
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
  },

  // 相对时间
  relative: (date: Date | string | number): string => {
    const now = dayjs()
    const target = dayjs(date)
    const diff = now.diff(target, 'minute')

    if (diff < 1) return '刚刚'
    if (diff < 60) return `${diff}分钟前`
    if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
    if (diff < 43200) return `${Math.floor(diff / 1440)}天前`

    return target.format('YYYY-MM-DD')
  },

  // 时间范围
  range: (start: Date | string | number, end: Date | string | number): string => {
    const startStr = dayjs(start).format('YYYY-MM-DD')
    const endStr = dayjs(end).format('YYYY-MM-DD')
    return `${startStr} 至 ${endStr}`
  }
}

// 数字格式化
export const formatNumber = {
  // 货币格式
  currency: (amount: number, currency = '¥', decimals = 2): string => {
    const formatted = amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return `${currency}${formatted}`
  },

  // 万为单位
  wan: (num: number, decimals = 1): string => {
    if (num < 10000) return num.toString()
    return `${(num / 10000).toFixed(decimals)}万`
  },

  // 百分比
  percentage: (num: number, decimals = 2): string => {
    return `${(num * 100).toFixed(decimals)}%`
  },

  // 文件大小
  fileSize: (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 B'

    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  },

  // 千分位分隔
  thousands: (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
}

// 文本格式化
export const formatText = {
  // 手机号脱敏
  maskPhone: (phone: string): string => {
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  },

  // 身份证脱敏
  maskIdCard: (idCard: string): string => {
    return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
  },

  // 邮箱脱敏
  maskEmail: (email: string): string => {
    return email.replace(/(.{2}).+(@.+)/, '$1***$2')
  },

  // 截断文本
  truncate: (text: string, maxLength: number, suffix = '...'): string => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - suffix.length) + suffix
  },

  // 首字母大写
  capitalize: (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  },

  // 驼峰转横线
  kebabCase: (text: string): string => {
    return text.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  },

  // 横线转驼峰
  camelCase: (text: string): string => {
    return text.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
  }
}

// 地址格式化
export const formatAddress = {
  // 完整地址
  full: (province: string, city: string, district: string, detail: string): string => {
    return [province, city, district, detail].filter(Boolean).join('')
  },

  // 简化地址
  simplified: (province: string, city: string, district: string): string => {
    // 如果省份和城市相同（如北京市、上海市），只显示一个
    if (province === city) {
      return [city, district].filter(Boolean).join('')
    }
    return [province, city, district].filter(Boolean).join('')
  }
}

// 状态格式化
export const formatStatus = {
  // 用户状态
  userStatus: (status: string): { text: string; color: string } => {
    const statusMap = {
      active: { text: '正常', color: 'green' },
      inactive: { text: '禁用', color: 'red' },
      pending: { text: '待审核', color: 'orange' }
    }
    return statusMap[status as keyof typeof statusMap] || { text: '未知', color: 'gray' }
  },

  // 订单状态
  orderStatus: (status: string): { text: string; color: string } => {
    const statusMap = {
      pending: { text: '待支付', color: 'orange' },
      paid: { text: '已支付', color: 'blue' },
      shipped: { text: '已发货', color: 'purple' },
      delivered: { text: '已完成', color: 'green' },
      cancelled: { text: '已取消', color: 'red' }
    }
    return statusMap[status as keyof typeof statusMap] || { text: '未知', color: 'gray' }
  }
}

// 数据转换
export const transformData = {
  // 数组转树形结构
  arrayToTree: <T extends { id: string; parentId?: string }>(
    array: T[],
    rootId: string | null = null
  ): (T & { children?: T[] })[] => {
    const result: (T & { children?: T[] })[] = []
    const map = new Map<string, T & { children: T[] }>()

    // 创建映射
    array.forEach(item => {
      map.set(item.id, { ...item, children: [] })
    })

    // 构建树形结构
    array.forEach(item => {
      const node = map.get(item.id)!
      if (item.parentId === rootId) {
        result.push(node)
      } else if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children.push(node)
      }
    })

    return result
  },

  // 树形结构转数组
  treeToArray: <T extends { children?: T[] }>(tree: T[]): T[] => {
    const result: T[] = []

    const traverse = (nodes: T[]) => {
      nodes.forEach(node => {
        const { children, ...rest } = node
        result.push(rest as T)
        if (children?.length) {
          traverse(children)
        }
      })
    }

    traverse(tree)
    return result
  }
}
```

---

## 8. 质量保证

### 8.1 代码质量标准

#### TypeScript要求
```bash
# 类型覆盖率要求
npm run type-check     # 必须100%通过

# 严格模式配置
"strict": true,
"noImplicitAny": true,
"strictNullChecks": true
```

#### ESLint配置验证
```bash
# 代码规范检查
npm run lint           # 零警告要求
npm run lint:fix       # 自动修复格式问题

# 提交前检查
npm run pre-commit     # husky自动执行
```

#### 代码审查清单
```markdown
## 框架保护检查 🛡️
- [ ] 未修改底座核心配置文件
- [ ] 未覆盖底座工具函数
- [ ] 未修改自动生成文件
- [ ] 遵循底座开发约定

## 代码质量检查
- [ ] TypeScript类型检查通过
- [ ] ESLint规则检查通过
- [ ] 函数长度 < 50行
- [ ] 组件Props有默认值
- [ ] 无console.log残留

## 功能验证
- [ ] 页面功能正常
- [ ] 路由跳转正确
- [ ] 数据加载和保存正常
- [ ] 错误处理完善

## 性能检查
- [ ] 合理使用computed缓存
- [ ] 避免不必要的重新渲染
- [ ] 图片懒加载优化
- [ ] 大列表虚拟滚动

## 兼容性验证
- [ ] H5端功能正常
- [ ] 微信小程序功能正常
- [ ] 响应式布局适配
- [ ] 交互体验一致
```

### 8.2 测试策略

#### 单元测试（推荐配置）
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/@types/',
        '**/*.d.ts'
      ]
    }
  }
})

// 组件测试示例
// tests/components/UserCard.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import UserCard from '@/components/business/UserCard.vue'

describe('UserCard', () => {
  const mockUser = {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    avatar: '/avatar.jpg'
  }

  it('renders user information correctly', () => {
    const wrapper = mount(UserCard, {
      props: { user: mockUser }
    })

    expect(wrapper.find('.user-card__name').text()).toBe('张三')
    expect(wrapper.find('.user-card__email').text()).toBe('zhangsan@example.com')
  })

  it('emits edit event when edit button clicked', async () => {
    const wrapper = mount(UserCard, {
      props: { user: mockUser, showActions: true }
    })

    await wrapper.find('.action-btn--edit').trigger('click')
    expect(wrapper.emitted().edit).toBeTruthy()
    expect(wrapper.emitted().edit[0]).toEqual([mockUser])
  })
})
```

#### 工具函数测试
```typescript
// tests/utils/formatters.test.ts
import { describe, it, expect } from 'vitest'
import { formatNumber, formatText } from '@/utils/formatters'

describe('formatNumber', () => {
  it('formats currency correctly', () => {
    expect(formatNumber.currency(1234.56)).toBe('¥1,234.56')
    expect(formatNumber.currency(1000, ')).toBe('$1,000.00')
  })

  it('formats wan correctly', () => {
    expect(formatNumber.wan(5000)).toBe('5000')
    expect(formatNumber.wan(15000)).toBe('1.5万')
    expect(formatNumber.wan(100000)).toBe('10.0万')
  })
})

describe('formatText', () => {
  it('masks phone number correctly', () => {
    expect(formatText.maskPhone('13812345678')).toBe('138****5678')
  })

  it('truncates text correctly', () => {
    expect(formatText.truncate('这是一个很长的文本', 6)).toBe('这是一...')
    expect(formatText.truncate('短文本', 10)).toBe('短文本')
  })
})
```

#### API测试（Mock方式）
```typescript
// tests/api/user.test.ts
import { describe, it, expect, vi } from 'vitest'
import userAPI from '@/api/user'

// Mock request工具
vi.mock('@/utils/request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

describe('userAPI', () => {
  it('calls getUserInfo with correct parameters', async () => {
    const mockResponse = {
      data: { id: '1', name: '张三' }
    }

    const request = await import('@/utils/request')
    vi.mocked(request.default.get).mockResolvedValue(mockResponse)

    const result = await userAPI.getUserInfo({ id: '1' })

    expect(request.default.get).toHaveBeenCalledWith('/user/info', { id: '1' })
    expect(result).toEqual(mockResponse)
  })
})
```

### 8.3 性能优化

#### 组件性能优化
```vue
<script setup lang="ts">
// ✅ 使用computed缓存复杂计算
const expensiveValue = computed(() => {
  return heavyCalculation(props.data)
})

// ✅ 避免在模板中使用复杂表达式
const formattedPrice = computed(() => formatNumber.currency(props.price))

// ✅ 合理使用watch避免不必要的更新
watch(() => props.userId, async (newId) => {
  if (newId) {
    await loadUserData(newId)
  }
}, { immediate: true })

// ❌ 避免在模板中直接调用函数
// <text>{{ formatPrice(item.price) }}</text>

// ✅ 使用computed替代
// <text>{{ item.formattedPrice }}</text>
</script>
```

#### 列表性能优化
```vue
<!-- 大列表虚拟滚动 -->
<script setup lang="ts">
const virtualListRef = ref()
const listData = ref([]) // 大量数据

// 虚拟滚动配置
const virtualListConfig = {
  itemHeight: 80,
  visibleCount: 10,
  bufferCount: 5
}
</script>

<template>
  <!-- 使用虚拟滚动组件 -->
  <VirtualList
    ref="virtualListRef"
    :data="listData"
    :item-height="virtualListConfig.itemHeight"
    :visible-count="virtualListConfig.visibleCount"
  >
    <template #default="{ item, index }">
      <PropertyCard :property="item" :key="item.id" />
    </template>
  </VirtualList>
</template>
```

#### 图片懒加载
```vue
<template>
  <!-- 使用uni-app的lazy-load -->
  <image
    :src="imageUrl"
    :lazy-load="true"
    class="lazy-image"
    @load="handleImageLoad"
    @error="handleImageError"
  />
</template>

<script setup lang="ts">
const handleImageLoad = () => {
  // 图片加载成功
}

const handleImageError = () => {
  // 图片加载失败，显示默认图片
}
</script>
```

---

## 9. 部署和构建

### 9.1 构建命令

```bash
# 开发环境
npm run dev:h5              # H5开发版本
npm run dev:mp-weixin       # 微信小程序开发版本
npm run dev:mp-alipay       # 支付宝小程序开发版本

# 生产构建
npm run build:h5            # H5生产版本
npm run build:mp-weixin     # 微信小程序生产版本
npm run build:mp-alipay     # 支付宝小程序生产版本

# 代码检查
npm run lint               # 完整代码检查
npm run lint:fix           # 自动修复问题
npm run type-check         # TypeScript类型检查

# 测试相关
npm run test              # 运行测试
npm run test:coverage     # 测试覆盖率报告
```

### 9.2 环境配置

#### 环境变量配置
```bash
# .env.development
NODE_ENV=development
VITE_API_BASE_URL=https://api-dev.betterhome.com
VITE_UPLOAD_URL=https://upload-dev.betterhome.com
VITE_DEBUG=true

# .env.staging
NODE_ENV=staging
VITE_API_BASE_URL=https://api-staging.betterhome.com
VITE_UPLOAD_URL=https://upload-staging.betterhome.com
VITE_DEBUG=true

# .env.production
NODE_ENV=production
VITE_API_BASE_URL=https://api.betterhome.com
VITE_UPLOAD_URL=https://upload.betterhome.com
VITE_DEBUG=false
```

#### 环境配置管理
```typescript
// src/config/env.ts
interface EnvConfig {
  apiBaseUrl: string
  uploadUrl: string
  debug: boolean
  version: string
}

const envConfig: EnvConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  uploadUrl: import.meta.env.VITE_UPLOAD_URL || '',
  debug: import.meta.env.VITE_DEBUG === 'true',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0'
}

// 环境验证
const validateEnv = (): void => {
  const required = ['apiBaseUrl', 'uploadUrl']
  const missing = required.filter(key => !envConfig[key as keyof EnvConfig])

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }
}

validateEnv()

export default envConfig
```

### 9.3 CI/CD配置

#### GitHub Actions示例
```yaml
# .github/workflows/deploy.yml
name: Deploy BetterHome Frontend

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Run type check
      run: npm run type-check

    - name: Run tests
      run: npm run test:coverage

    - name: Upload coverage
      uses: codecov/codecov-action@v3

  build-h5:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build H5
      run: npm run build:h5
      env:
        VITE_API_BASE_URL: ${{ secrets.PROD_API_URL }}
        VITE_UPLOAD_URL: ${{ secrets.PROD_UPLOAD_URL }}

    - name: Deploy to CDN
      run: |
        # 部署到CDN的脚本
        echo "Deploying H5 to CDN..."

  build-miniprogram:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build MiniProgram
      run: npm run build:mp-weixin

    - name: Upload to WeChat
      run: |
        # 上传到微信小程序的脚本
        echo "Uploading to WeChat MiniProgram..."
```

### 9.4 部署配置

#### H5部署配置
```nginx
# nginx.conf for H5
server {
    listen 80;
    server_name betterhome.com;

    root /var/www/betterhome-h5;
    index index.html;

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API代理
    location /api/ {
        proxy_pass https://api.betterhome.com/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

#### 小程序发布配置
```json
// 微信小程序project.config.json
{
  "description": "BetterHome微信小程序",
  "packOptions": {
    "ignore": [
      {
        "type": "file",
        "value": ".eslintrc.js"
      },
      {
        "type": "folder",
        "value": "tests"
      }
    ]
  },
  "setting": {
    "urlCheck": false,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "preloadBackgroundData": false,
    "minified": true,
    "newFeature": true
  },
  "compileType": "miniprogram",
  "libVersion": "latest",
  "appid": "wxxxxxxxxxxx",
  "projectname": "betterhome-miniprogram"
}
```

---

## 10. 团队协作

### 10.1 Git工作流

#### 分支策略
```bash
# 主要分支
main         # 生产环境分支，仅接受来自develop的合并
develop      # 开发环境分支，集成所有功能

# 功能分支
feature/user-management      # 功能开发分支
feature/property-list        # 功能开发分支
hotfix/critical-bug         # 紧急修复分支
release/v1.2.0              # 发布准备分支
```

#### 开发流程
```bash
# 1. 创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/user-profile

# 2. 开发和提交
git add .
git commit -m "feat(user): 添加用户资料页面

- 实现用户信息展示
- 添加头像上传功能
- 集成用户编辑表单

Closes #123"

# 3. 推送和创建PR
git push origin feature/user-profile
# 在GitHub/GitLab创建Pull Request

# 4. 代码审查通过后合并
git checkout develop
git pull origin develop
git branch -d feature/user-profile
```

#### 提交信息规范
```bash
# 提交格式: type(scope): description
#
# type: 提交类型
# scope: 影响范围（可选）
# description: 简短描述

# 示例
feat(user): 添加用户资料编辑功能
fix(api): 修复用户列表分页问题
docs(readme): 更新安装说明
style(components): 统一按钮组件样式
refactor(store): 重构用户状态管理
test(utils): 添加格式化工具测试
chore(deps): 升级vue到3.4.0

# 破坏性变更
feat(api)!: 重构用户API接口

BREAKING CHANGE: 用户API响应格式已更改
```

### 10.2 代码审查流程

#### Pull Request模板
```markdown
## 📋 变更描述
简要描述此次变更的内容和目的

## 🎯 变更类型
- [ ] 新功能 (feature)
- [ ] 问题修复 (bugfix)
- [ ] 文档更新 (docs)
- [ ] 样式调整 (style)
- [ ] 代码重构 (refactor)
- [ ] 性能优化 (perf)
- [ ] 测试相关 (test)
- [ ] 构建相关 (chore)

## 🧪 测试清单
- [ ] 本地功能测试通过
- [ ] 单元测试通过
- [ ] 代码规范检查通过
- [ ] TypeScript类型检查通过
- [ ] 跨端兼容性验证

## 📱 测试环境
- [ ] H5浏览器测试
- [ ] 微信小程序测试
- [ ] 移动端真机测试

## 🔍 审查要点
请重点关注以下方面：
- [ ] 是否遵循框架保护原则
- [ ] 代码逻辑是否正确
- [ ] 性能是否有影响
- [ ] 安全性考虑

## 📸 截图/录屏
如果涉及UI变更，请提供截图或录屏

## 🔗 相关链接
- 相关Issue: #xxx
- 设计稿: [链接]
- 测试用例: [链接]
```

#### 审查检查清单
```markdown
## 🛡️ 框架保护检查（最高优先级）
- [ ] 未修改底座核心配置文件
- [ ] 未覆盖底座工具函数
- [ ] 未修改自动生成文件
- [ ] 遵循底座开发约定
- [ ] 新增依赖已团队评估

## 📝 代码质量检查
- [ ] 代码逻辑清晰易懂
- [ ] 函数职责单一，长度合理
- [ ] 变量命名有意义
- [ ] 注释充分且准确
- [ ] 错误处理完善

## 🏗️ 架构设计检查
- [ ] 符合项目架构原则
- [ ] 模块划分合理
- [ ] 接口设计清晰
- [ ] 数据流向正确

## 🔒 安全性检查
- [ ] 无敏感信息泄露
- [ ] 输入验证充分
- [ ] 权限控制正确
- [ ] XSS/CSRF防护

## ⚡ 性能检查
- [ ] 无明显性能问题
- [ ] 合理使用缓存
- [ ] 避免内存泄露
- [ ] 资源加载优化

## 🧪 测试完整性
- [ ] 单元测试覆盖核心逻辑
- [ ] 集成测试验证业务流程
- [ ] 边界条件考虑充分
- [ ] 错误场景测试完备
```

### 10.3 团队开发规范

#### 分工协作模式
```markdown
## 角色分工
- **前端架构师**: 技术选型、架构设计、代码审查
- **高级开发**: 核心功能开发、技术难点攻关、新人指导
- **中级开发**: 业务功能开发、组件封装、测试编写
- **初级开发**: 页面开发、简单功能实现、文档维护

## 任务分配原则
1. **按功能模块分配**: 每人负责1-2个完整的业务模块
2. **按技术层次分配**: 复杂功能由高级开发负责
3. **结对编程**: 重要功能可以采用结对编程
4. **知识分享**: 定期技术分享和代码走读
```

#### 沟通协作机制
```markdown
## 日常沟通
- **每日站会**: 同步进度，识别阻塞
- **技术讨论**: 重要技术决策集体讨论
- **代码走读**: 定期组织代码走读会
- **问题解决**: 及时寻求帮助，避免闭门造车

## 文档协作
- **需求文档**: 产品经理维护，开发团队review
- **技术文档**: 开发团队共同维护
- **接口文档**: 前后端协作维护
- **部署文档**: 运维和开发协作维护

## 工具使用
- **项目管理**: Jira/Trello/Asana
- **代码托管**: GitHub/GitLab
- **即时沟通**: Slack/企业微信/钉钉
- **文档协作**: Confluence/Notion/语雀
```

---

## 11. 常见问题

### 11.1 环境和配置问题

#### Q1: VSCode插件冲突导致Vue语法错误
```bash
# 问题现象
- Vue组件语法高亮异常
- TypeScript类型提示错误
- 组件自动导入失效

# 解决方案
1. 禁用Vetur插件
2. 安装并启用Volar插件
3. 安装TypeScript Vue Plugin
4. 重启VSCode

# 验证方法
打开任意.vue文件，检查语法高亮和类型提示是否正常
```

#### Q2: 组件自动导入失败
```bash
# 问题现象
- 使用组件时提示"未定义"
- components.d.ts文件未生成或不完整

# 解决方案
1. 确保组件放在src/components/目录下
2. 重启开发服务器: npm run dev:h5
3. 检查components.d.ts是否正确生成
4. 如果仍有问题，删除components.d.ts后重新启动

# 验证方法
检查src/components.d.ts文件中是否包含你的组件声明
```

#### Q3: pinia-auto-refs不生效
```bash
# 问题现象
- useStore方法提示不存在
- @helper目录没有生成

# 解决方案
1. 检查vite.config.ts中PiniaAutoRefs插件配置
2. 确保store文件正确export default defineStore
3. 重新运行npm run dev
4. 检查src/@helper/index.ts是否生成

# 验证方法
在页面中尝试使用: const { userInfo } = useStore('user')
```

### 11.2 开发问题

#### Q4: 路由跳转失效
```bash
# 问题现象
- 使用forward函数跳转后页面空白
- 控制台提示路由不存在

# 解决方案
1. 检查pages.json中是否正确注册页面
2. 确认文件路径和配置路径一致
3. 验证urlMap.ts中的路由映射
4. 确保页面文件夹和文件同名

# 正确的配置示例
pages.json: "path": "pages/user-profile/user-profile"
文件路径: src/pages/user-profile/user-profile.vue
```

#### Q5: 跨端样式差异
```bash
# 问题现象
- H5端显示正常，小程序端样式错乱
- 某些CSS属性在小程序中不生效

# 解决方案
1. 使用rpx单位而非px
2. 避免使用小程序不支持的CSS属性
3. 使用条件编译处理平台差异
4. 参考uni-app官方兼容性文档

# 条件编译示例
/* #ifdef H5 */
.h5-specific {
  transform: scale(1.1);
}
/* #endif */

/* #ifdef MP-WEIXIN */
.mp-specific {
  // 小程序特有样式
}
/* #endif */
```

#### Q6: Store数据丢失
```bash
# 问题现象
- 页面刷新后登录状态丢失
- 存储的数据无法恢复

# 解决方案
1. 检查pinia持久化配置是否正确
2. 确认storage策略配置无误
3. 验证存储的字段是否在paths中
4. 检查storage权限是否正常

# 持久化配置示例
persist: {
  enabled: true,
  strategies: [{
    key: 'user-storage',
    storage: {
      getItem: uni.getStorageSync,
      setItem: uni.setStorageSync
    },
    paths: ['userInfo', 'token', 'isLoggedIn']
  }]
}
```

### 11.3 构建和部署问题

#### Q7: 构建失败
```bash
# 问题现象
- npm run build:h5 失败
- TypeScript编译错误

# 解决方案
1. 先执行npm run type-check定位类型错误
2. 修复所有TypeScript类型问题
3. 确保所有import路径正确
4. 检查环境变量配置

# 调试步骤
npm run type-check    # 检查类型错误
npm run lint         # 检查代码规范
npm run build:h5     # 重新构建
```

#### Q8: 小程序体积过大
```bash
# 问题现象
- 小程序包体积超过限制
- 上传时提示体积过大

# 解决方案
1. 使用分包加载
2. 压缩图片资源
3. 移除未使用的依赖
4. 开启代码分割

# 分包配置示例
// pages.json
{
  "subPackages": [
    {
      "root": "pages/user",
      "pages": [
        {
          "path": "profile/profile",
          "style": { "navigationBarTitleText": "个人资料" }
        }
      ]
    }
  ]
}
```

### 11.4 性能问题

#### Q9: 页面加载缓慢
```bash
# 问题现象
- 页面首次加载时间过长
- 白屏时间较长

# 解决方案
1. 实现代码分割和懒加载
2. 优化图片加载策略
3. 减少初始包体积
4. 使用骨架屏提升体验

# 懒加载示例
const UserProfile = defineAsyncComponent(() =>
  import('@/pages/user-profile/user-profile.vue')
)
```

#### Q10: 列表滚动卡顿
```bash
# 问题现象
- 大列表滚动时出现卡顿
- 内存占用过高

# 解决方案
1. 使用虚拟滚动技术
2. 实现分页加载
3. 优化列表项渲染
4. 避免复杂计算在渲染中进行

# 虚拟滚动优化
<scroll-view
  :scroll-y="true"
  @scrolltolower="loadMore"
  enhanced
  :show-scrollbar="false"
>
  <!-- 只渲染可见区域的内容 -->
</scroll-view>
```

---

## 12. 学习资源

### 12.1 官方文档

#### 核心技术文档
- **[uni-app官方文档](https://uniapp.dcloud.io/)** - 跨平台开发指南
- **[Vue 3官方文档](https://v3.cn.vuejs.org/)** - Vue 3 Composition API
- **[Pinia官方文档](https://pinia.vuejs.org/)** - 状态管理方案
- **[Vite官方文档](https://vitejs.dev/)** - 构建工具配置
- **[TypeScript官方文档](https://www.typescriptlang.org/)** - 类型系统学习

#### 底座特色插件
- **[pinia-plugin-persist-uni](https://allen-1998.github.io/pinia-plugin-persist-uni/)** - 跨端数据持久化
- **[pinia-auto-refs](https://github.com/Allen-1998/pinia-auto-refs)** - Store使用增强
- **[UnoCSS文档](https://github.com/unocss/unocss)** - 原子化CSS引擎

### 12.2 学习路径

#### 初级开发者（0-6个月）
```markdown
## 第一阶段：基础技能 (2-4周)
1. **Vue 3基础**: Composition API、响应式原理
2. **TypeScript基础**: 类型定义、接口、泛型
3. **uni-app基础**: 组件使用、生命周期、跨端概念
4. **项目结构**: 熟悉项目目录和文件组织

## 第二阶段：开发实践 (4-8周)
1. **页面开发**: 使用模板快速开发页面
2. **组件封装**: 基础组件的使用和封装
3. **状态管理**: Pinia的基本使用
4. **API调用**: 接口集成和错误处理

## 第三阶段：质量提升 (4-8周)
1. **代码规范**: ESLint、Prettier的使用
2. **测试编写**: 单元测试基础
3. **性能优化**: 基础优化技巧
4. **跨端适配**: 平台差异处理
```

#### 中级开发者（6-18个月）
```markdown
## 第一阶段：深入理解 (2-4周)
1. **架构理解**: 深入理解项目架构设计
2. **底座特色**: 掌握pinia-auto-refs等增强功能
3. **工程化工具**: 熟练使用构建和部署工具
4. **性能调优**: 高级性能优化技巧

## 第二阶段：业务开发 (8-12周)
1. **复杂组件**: 高复用性组件设计
2. **状态设计**: 复杂业务状态管理
3. **接口设计**: API接口的设计和优化
4. **错误处理**: 完善的错误处理机制

## 第三阶段：技术提升 (4-8周)
1. **代码审查**: 参与和主导代码审查
2. **架构优化**: 提出架构改进建议
3. **技术分享**: 组织技术分享和培训
4. **工具开发**: 开发团队效率工具
```

#### 高级开发者（18个月+）
```markdown
## 核心职责
1. **技术决策**: 参与技术选型和架构设计
2. **代码质量**: 建立和维护代码质量标准
3. **团队培养**: 指导初中级开发者成长
4. **问题解决**: 解决复杂技术问题

## 提升方向
1. **架构设计**: 大型项目架构设计能力
2. **性能优化**: 深度性能分析和优化
3. **技术前瞻**: 新技术调研和引入
4. **团队管理**: 技术团队管理能力
```

### 12.3 推荐资源

#### 技术博客和文章
- **[Vue.js官方博客](https://blog.vuejs.org/)** - Vue最新动态
- **[uni-app社区](https://ask.dcloud.net.cn/)** - 开发问题讨论
- **[MDN Web文档](https://developer.mozilla.org/)** - Web标准参考
- **[Can I Use](https://caniuse.com/)** - 浏览器兼容性查询

#### 开发工具推荐
- **[Vue DevTools](https://devtools.vuejs.org/)** - Vue调试工具
- **[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)** - 小程序开发
- **[支付宝小程序开发者工具](https://opendocs.alipay.com/mini/ide)** - 支付宝小程序开发
- **[Postman](https://www.postman.com/)** - API测试工具

#### 在线学习平台
- **[Vue Mastery](https://www.vuemastery.com/)** - Vue专业课程
- **[egghead.io](https://egghead.io/)** - 短视频教程
- **[Frontend Masters](https://frontendmasters.com/)** - 高质量前端课程
- **[极客时间](https://time.geekbang.org/)** - 中文技术课程

### 12.4 实践项目建议

#### 练习项目（由简到难）
1. **个人博客系统**: 练习基础页面开发和路由
2. **待办事项应用**: 练习状态管理和数据持久化
3. **电商商品展示**: 练习列表组件和图片处理
4. **社交媒体应用**: 练习复杂交互和实时更新
5. **企业管理系统**: 练习权限控制和复杂表单

#### 贡献开源项目
1. **参与uni-app社区**: 提交bug报告和功能建议
2. **贡献组件库**: 开发和分享通用组件
3. **编写技术文档**: 完善项目文档和教程
4. **开发工具插件**: VSCode插件、CLI工具等

---

## 📋 总结

本开发指导文档为基于 `ttk-cli/uni-vue3-vite-ts-pinia` 底座的 BetterHome 项目提供了完整的开发指南。

### 🎯 核心价值

1. **框架保护第一**: 确保底座稳定性和可维护性
2. **开发效率提升**: 标准化流程和工具链支持
3. **代码质量保证**: 严格的规范和检查机制
4. **团队协作优化**: 清晰的分工和沟通机制
5. **知识体系化**: 完整的学习路径和资源

### 🚀 关键成功因素

- **严格遵循框架保护原则**: 任何侵入性修改都必须被拒绝
- **充分利用底座优势**: 发挥工程化工具链的价值
- **持续团队培训**: 确保所有成员理解和执行规范
- **完善的代码审查**: 以框架保护为第一优先级
- **知识分享文化**: 促进团队技术水平整体提升

### ⚠️ 重要提醒

- **底线原则**: 业务需求不能成为破坏架构的理由
- **持续改进**: 根据项目发展不断完善开发规范
- **工具更新**: 及时跟进底座和依赖的版本更新
- **问题反馈**: 遇到问题及时反馈，避免重复踩坑

通过遵循本指导文档，团队可以在保持架构稳定性的前提下，高效地进行跨平台应用开发，确保项目的长期成功。