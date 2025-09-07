# 项目架构与开发规范

> 项目架构原则、目录结构说明和开发约束规范

## 🛡️ 架构保护第一原则

**绝对禁止对底座框架进行任何侵入式修改！**

### 🚫 严格禁止的操作

#### Level 1: 核心配置文件 - ⚠️ 谨慎修改，需团队评审
**原则**：禁止随意修改。任何功能性或逻辑性变更，必须在PR中明确说明并经过审查。

```bash
# 允许：为新功能添加或更新依赖 (dev/prod)
# 禁止：随意更改核心框架版本 (vue, uni-app)
package.json

# 允许：为实现新功能添加插件或别名
vite.config.ts
tsconfig.json

# 允许：经团队同意后新增或调整规则
.eslintrc.js

# 允许：添加新的原子化CSS规则或主题色
unocss.config.ts

# 允许：修复脚本bug或增强功能（需作为独立PR提交）
auto/addPage.ts
```

#### Level 2: 自动生成文件
```bash
# ❌ 绝对禁止修改
src/auto-imports.d.ts       # 自动导入类型
src/components.d.ts         # 组件类型声明
src/@helper/                # pinia-auto-refs生成
```

#### Level 3: 底座工具函数
```bash
# ❌ 禁止覆盖或修改
src/utils/request.ts        # 网络请求封装
src/utils/router.ts         # 路由跳转封装
src/utils/platform.ts       # 平台判断
src/utils/uniAsync.ts       # 异步方法封装
src/utils/shared.ts         # 基础公共方法
src/utils/urlMap.ts         # 页面路由映射
```

### ✅ 允许的扩展方式

```bash
# ✅ 可以新增文件
src/utils/business.ts       # 业务工具函数
src/utils/validators.ts     # 表单验证工具
src/utils/formatters.ts     # 数据格式化工具
src/components/MyButton.vue # 自定义组件
src/pages/new-page/         # 新页面

# ✅ 可以配置环境变量
.env.development            # 开发环境配置
.env.production             # 生产环境配置

# ✅ 可以扩展底座配置
# 在现有配置基础上添加，而非替换
```

---

## 🏗️ 项目目录结构

### 完整目录结构

```
uni-vue3-vite-ts-pinia/
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

### 核心模块说明

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

---

## 🚫 开发约束原则

### 代码级禁止操作

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

// ❌ 禁止手动修改pages.json来添加普通页面
// ✅ 必须优先使用 npm run add 命令添加页面
// ⚠️ 特殊情况：如需修改tabBar或脚本不支持时，允许手动修改，但需在PR中特殊说明
```

### ✅ 正确的开发方式

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

// ✅ 使用自动化脚本添加页面
// npm run add
```

---

## 📋 命名规范

### 文件和目录命名

```bash
# ✅ 页面目录：kebab-case
pages/user-profile/
pages/property-list/

# ✅ 组件文件：PascalCase
components/UserCard.vue
components/PropertyList.vue

# ✅ 工具文件：camelCase
utils/formatDate.ts
utils/validateForm.ts

# ✅ 类型文件：camelCase + .d.ts
@types/user.d.ts
@types/api.d.ts
```

### 变量和函数命名

```typescript
// ✅ 变量：camelCase
const userName = 'John'
const isLoading = false

// ✅ 函数：camelCase + 动词开头
function getUserInfo() {}
function validateEmail() {}
function handleSubmit() {}

// ✅ 常量：UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.com'
const MAX_RETRY_COUNT = 3

// ✅ 类型：PascalCase
interface UserInfo {}
type ApiResponse<T> = {}
```

### Vue 组件命名

```vue
<!-- ✅ 组件名：PascalCase -->
<template>
  <UserProfile :user-info="userInfo" @update="handleUpdate" />
</template>

<script setup lang="ts">
// ✅ 组件属性：camelCase
interface Props {
  userInfo: UserInfo
  isEditable?: boolean
}

// ✅ 事件名：kebab-case
const emit = defineEmits<{
  'update:user-info': [value: UserInfo]
  'delete-user': [id: string]
}>()
</script>
```

---

## 🎯 代码组织原则

### 1. 单一职责原则

```typescript
// ✅ 每个文件只负责一个功能
// user.ts - 只处理用户相关API
export const getUserInfo = () => {}
export const updateUserInfo = () => {}

// ❌ 不要在一个文件中混合多种职责
// mixed.ts - 混合了用户、订单、支付等功能
```

### 2. 依赖倒置原则

```typescript
// ✅ 依赖抽象，不依赖具体实现
interface ApiService {
  get<T>(url: string): Promise<T>
}

class UserService {
  constructor(private api: ApiService) {}
}

// ❌ 直接依赖具体实现
class UserService {
  getUserInfo() {
    return uni.request({ url: '/user' }) // 直接依赖uni API
  }
}
```

### 3. 开闭原则

```typescript
// ✅ 对扩展开放，对修改封闭
// 通过配置扩展功能，而不是修改源码
const config = {
  apiBaseUrl: process.env.API_BASE_URL,
  timeout: 5000,
  // 可以添加新配置，但不修改现有配置
}

// ❌ 直接修改底座代码
// 修改 utils/request.ts 的内部实现
```

---

## 🔒 类型安全规范

### TypeScript 配置

```json
// tsconfig.json 关键配置
{
  "compilerOptions": {
    "strict": true,              // 启用严格模式
    "noImplicitAny": true,       // 禁止隐式any
    "noImplicitReturns": true,   // 函数必须有返回值
    "noUnusedLocals": true,      // 禁止未使用的局部变量
    "noUnusedParameters": true   // 禁止未使用的参数
  }
}
```

### 类型定义规范

```typescript
// ✅ 明确的接口定义
interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

interface UserInfo {
  id: string
  name: string
  email: string
  avatar?: string  // 可选属性用 ?
}

// ✅ 使用联合类型
type Status = 'pending' | 'success' | 'error'

// ✅ 使用泛型
function request<T>(url: string): Promise<ApiResponse<T>> {
  // 实现
}

// ❌ 避免使用any
const data: any = response.data
```

---

## 📏 代码风格规范

### ESLint 规则

项目使用严格的 ESLint 配置，主要规则包括：

```javascript
// .eslintrc.js 关键规则
module.exports = {
  rules: {
    // 代码质量
    'no-console': 'warn',           // 警告console使用
    'no-debugger': 'error',         // 禁止debugger
    'no-unused-vars': 'error',      // 禁止未使用变量

    // Vue特定
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'warn',

    // TypeScript
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error'
  }
}
```

### Prettier 格式化

```json
// .prettierrc
{
  "semi": false,              // 不使用分号
  "singleQuote": true,        // 使用单引号
  "tabWidth": 2,              // 缩进2个空格
  "trailingComma": "none",    // 不使用尾随逗号
  "printWidth": 80            // 行宽80字符
}
```

---

## 🔍 代码审查标准

### 审查清单

- [ ] 是否遵循架构保护原则
- [ ] 是否使用正确的命名规范
- [ ] 是否有完整的类型定义
- [ ] 是否通过ESLint检查
- [ ] 是否有必要的注释
- [ ] 是否遵循单一职责原则
- [ ] 是否有适当的错误处理
- [ ] 是否有性能考虑

### 常见问题

1. **直接修改底座文件**
   - 问题：修改 `utils/request.ts` 等核心文件
   - 解决：创建新的工具文件扩展功能

2. **类型定义不完整**
   - 问题：使用 `any` 类型或缺少接口定义
   - 解决：补充完整的类型定义

3. **组件职责不清**
   - 问题：一个组件承担多个职责
   - 解决：拆分组件，保持单一职责

---

*下一步: [模块协作指南](./04-module-collaboration.md)*
