# 页面开发指南

> 新页面创建、开发流程和最佳实践

## 🚀 快速开始

### 创建新页面的两种方式

#### 方式一：自动化脚本创建（推荐）

```bash
# 在项目根目录执行
npm run add

# 按提示输入页面信息
# 例如：输入 user/profile 创建用户资料页面
```

**脚本会自动完成**：
- 创建页面目录和文件
- 生成基础页面模板
- 更新路由配置
- 创建对应的类型定义

#### 方式二：手动创建

```bash
# 1. 创建页面目录
mkdir -p src/pages/user/profile

# 2. 创建页面文件
touch src/pages/user/profile/index.vue

# 3. 手动更新 src/pages.json
# 4. 创建类型定义（如需要）
```

---

## 📁 页面目录结构

### 标准页面结构

```
src/pages/
├── index/                    # 首页
│   └── index.vue
├── user/                     # 用户模块
│   ├── profile/             # 用户资料
│   │   ├── index.vue        # 页面主文件
│   │   ├── components/      # 页面专用组件
│   │   │   ├── UserInfo.vue
│   │   │   └── EditForm.vue
│   │   └── types.ts         # 页面类型定义
│   ├── settings/            # 用户设置
│   │   └── index.vue
│   └── login/               # 登录页面
│       └── index.vue
└── product/                  # 产品模块
    ├── list/
    │   └── index.vue
    └── detail/
        └── index.vue
```

### 目录命名规范

- **模块目录**: 使用 kebab-case，语义化命名
- **页面目录**: 使用 kebab-case，动词+名词形式
- **组件目录**: 固定使用 `components`
- **类型文件**: 固定使用 `types.ts`

**示例**:
```
✅ 正确命名
user/profile          # 用户资料
product/detail        # 产品详情
order/create          # 创建订单
shop/cart            # 购物车

❌ 错误命名
User/Profile         # 大写开头
user_profile         # 下划线
userProfile          # 驼峰命名
user-profile-page    # 冗余后缀
```

---

## 🏗️ 页面开发流程

### 1. 需求分析和设计

**开发前检查清单**:
- [ ] 明确页面功能和用户场景
- [ ] 确定页面路由和参数
- [ ] 设计页面布局和交互
- [ ] 确定数据来源和状态管理
- [ ] 评估复用组件和新建组件

### 2. 分支管理

```bash
# 创建功能分支
git checkout -b feature/user-profile-page

# 或创建页面分支
git checkout -b page/user-profile
```

**分支命名规范**:
- `feature/模块-功能`: 新功能开发
- `page/页面名称`: 新页面开发
- `fix/问题描述`: 问题修复
- `refactor/重构内容`: 代码重构

### 3. 页面创建

#### 使用脚本创建（推荐）

```bash
# 执行创建脚本
npm run add

# 交互式输入
? 请输入页面路径 (例: user/profile): user/profile
? 请输入页面标题: 用户资料
? 是否需要下拉刷新? (y/N): N
? 是否需要上拉加载? (y/N): N

✅ 页面创建成功!
📁 页面文件: src/pages/user/profile/index.vue
📝 路由配置已更新: src/pages.json
🎯 可以开始开发了: npm run dev:h5
```

#### 手动创建步骤

**步骤1: 创建页面文件**

```vue
<!-- src/pages/user/profile/index.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

// 页面参数类型
interface PageQuery {
  userId?: string
}

// 页面数据类型
interface PageData {
  loading: boolean
  userInfo: UserInfo | null
}

// 响应式数据
const pageData = ref<PageData>({
  loading: false,
  userInfo: null
})

// 页面加载
onLoad((query: PageQuery) => {
  console.log('页面参数:', query)
  loadUserProfile(query.userId)
})

// 加载用户资料
const loadUserProfile = async (userId?: string) => {
  pageData.value.loading = true
  try {
    // TODO: 调用API获取用户信息
    // const result = await getUserInfo(userId)
    // pageData.value.userInfo = result.data
  } catch (error) {
    console.error('加载用户资料失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  } finally {
    pageData.value.loading = false
  }
}

// 页面标题
uni.setNavigationBarTitle({
  title: '用户资料'
})
</script>

<template>
  <view class="user-profile-page">
    <!-- 加载状态 -->
    <view v-if="pageData.loading" class="loading-container">
      <uni-load-more status="loading" />
    </view>
    
    <!-- 页面内容 -->
    <view v-else class="content-container">
      <text>用户资料页面</text>
      <!-- TODO: 实现页面内容 -->
    </view>
  </view>
</template>

<style lang="scss" scoped>
.user-profile-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200rpx;
}

.content-container {
  padding: 20rpx;
}
</style>
```

**步骤2: 更新路由配置**

```json
// src/pages.json
{
  "pages": [
    // ... 其他页面
    {
      "path": "pages/user/profile/index",
      "style": {
        "navigationBarTitleText": "用户资料",
        "enablePullDownRefresh": false,
        "backgroundTextStyle": "dark"
      }
    }
  ]
}
```

**步骤3: 创建类型定义（可选）**

```typescript
// src/pages/user/profile/types.ts

// 页面查询参数
export interface ProfilePageQuery {
  userId?: string
  tab?: 'info' | 'settings' | 'security'
}

// 页面状态
export interface ProfilePageState {
  loading: boolean
  userInfo: UserInfo | null
  activeTab: string
  editMode: boolean
}

// 表单数据
export interface ProfileFormData {
  nickname: string
  avatar: string
  gender: 'male' | 'female' | 'unknown'
  birthday: string
  bio: string
}
```

### 4. 页面开发

#### 数据获取和状态管理

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { getUserProfile, updateUserProfile } from '@/api/user'
import type { ProfilePageQuery, ProfilePageState } from './types'

// Store
const userStore = useUserStore()

// 页面状态
const pageState = ref<ProfilePageState>({
  loading: false,
  userInfo: null,
  activeTab: 'info',
  editMode: false
})

// 计算属性
const isCurrentUser = computed(() => {
  return pageState.value.userInfo?.id === userStore.userInfo?.id
})

// 页面加载
onLoad(async (query: ProfilePageQuery) => {
  await loadUserProfile(query.userId)
  
  // 设置默认标签页
  if (query.tab) {
    pageState.value.activeTab = query.tab
  }
})

// 下拉刷新
onPullDownRefresh(async () => {
  await loadUserProfile()
  uni.stopPullDownRefresh()
})

// 加载用户资料
const loadUserProfile = async (userId?: string) => {
  pageState.value.loading = true
  try {
    const result = await getUserProfile(userId || userStore.userInfo?.id)
    pageState.value.userInfo = result.data
  } catch (error) {
    console.error('加载用户资料失败:', error)
    uni.showToast({ title: '加载失败', icon: 'error' })
  } finally {
    pageState.value.loading = false
  }
}

// 切换编辑模式
const toggleEditMode = () => {
  pageState.value.editMode = !pageState.value.editMode
}

// 保存资料
const saveProfile = async (formData: ProfileFormData) => {
  try {
    const result = await updateUserProfile(formData)
    pageState.value.userInfo = result.data
    pageState.value.editMode = false
    
    // 更新全局用户信息
    userStore.updateUserInfo(result.data)
    
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    console.error('保存失败:', error)
    uni.showToast({ title: '保存失败', icon: 'error' })
  }
}
</script>
```

#### 页面布局和组件

```vue
<template>
  <view class="user-profile-page">
    <!-- 页面头部 -->
    <view class="page-header">
      <UserAvatar 
        :src="pageState.userInfo?.avatar" 
        :size="120"
        :editable="isCurrentUser && pageState.editMode"
        @change="handleAvatarChange"
      />
      <view class="user-basic-info">
        <text class="username">{{ pageState.userInfo?.nickname }}</text>
        <text class="user-id">ID: {{ pageState.userInfo?.id }}</text>
      </view>
      
      <!-- 操作按钮 -->
      <view v-if="isCurrentUser" class="action-buttons">
        <button 
          v-if="!pageState.editMode" 
          class="edit-btn"
          @click="toggleEditMode"
        >
          编辑资料
        </button>
        <view v-else class="edit-actions">
          <button class="cancel-btn" @click="toggleEditMode">取消</button>
          <button class="save-btn" @click="handleSave">保存</button>
        </view>
      </view>
    </view>
    
    <!-- 标签页 -->
    <view class="tab-container">
      <TabBar 
        :tabs="tabList"
        :active="pageState.activeTab"
        @change="handleTabChange"
      />
    </view>
    
    <!-- 标签页内容 -->
    <view class="tab-content">
      <!-- 基本信息 -->
      <UserInfoTab 
        v-if="pageState.activeTab === 'info'"
        :user-info="pageState.userInfo"
        :edit-mode="pageState.editMode"
        @save="saveProfile"
      />
      
      <!-- 设置 -->
      <UserSettingsTab 
        v-else-if="pageState.activeTab === 'settings'"
        :user-info="pageState.userInfo"
      />
      
      <!-- 安全 -->
      <UserSecurityTab 
        v-else-if="pageState.activeTab === 'security'"
        :user-info="pageState.userInfo"
      />
    </view>
  </view>
</template>
```

#### 页面样式

```scss
<style lang="scss" scoped>
.user-profile-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.page-header {
  position: relative;
  padding: 40rpx 30rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  
  .user-basic-info {
    margin-top: 20rpx;
    text-align: center;
    
    .username {
      display: block;
      font-size: 36rpx;
      font-weight: 600;
      margin-bottom: 10rpx;
    }
    
    .user-id {
      font-size: 24rpx;
      opacity: 0.8;
    }
  }
  
  .action-buttons {
    position: absolute;
    top: 40rpx;
    right: 30rpx;
    
    .edit-btn {
      padding: 12rpx 24rpx;
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1rpx solid rgba(255, 255, 255, 0.3);
      border-radius: 20rpx;
      font-size: 26rpx;
    }
    
    .edit-actions {
      display: flex;
      gap: 20rpx;
      
      button {
        padding: 12rpx 20rpx;
        border-radius: 20rpx;
        font-size: 26rpx;
      }
      
      .cancel-btn {
        background-color: transparent;
        color: white;
        border: 1rpx solid rgba(255, 255, 255, 0.5);
      }
      
      .save-btn {
        background-color: #4CAF50;
        color: white;
        border: none;
      }
    }
  }
}

.tab-container {
  background-color: white;
  border-bottom: 1rpx solid #e0e0e0;
}

.tab-content {
  flex: 1;
  background-color: white;
}

// 响应式设计
@media (max-width: 750rpx) {
  .page-header {
    padding: 30rpx 20rpx;
    
    .action-buttons {
      position: static;
      margin-top: 20rpx;
      text-align: center;
    }
  }
}
</style>
```

### 5. 页面测试

#### 功能测试

```typescript
// tests/pages/user/profile.test.ts
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import UserProfilePage from '@/pages/user/profile/index.vue'
import { useUserStore } from '@/store/user'

describe('UserProfilePage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('应该正确渲染用户信息', async () => {
    const wrapper = mount(UserProfilePage)
    const userStore = useUserStore()
    
    // 模拟用户数据
    userStore.userInfo = {
      id: '123',
      nickname: '测试用户',
      avatar: 'https://example.com/avatar.jpg'
    }
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.username').text()).toBe('测试用户')
    expect(wrapper.find('.user-id').text()).toBe('ID: 123')
  })
  
  it('应该支持编辑模式切换', async () => {
    const wrapper = mount(UserProfilePage)
    
    // 点击编辑按钮
    await wrapper.find('.edit-btn').trigger('click')
    
    expect(wrapper.vm.pageState.editMode).toBe(true)
    expect(wrapper.find('.edit-actions').exists()).toBe(true)
  })
})
```

#### 端到端测试

```typescript
// e2e/user-profile.spec.ts
import { test, expect } from '@playwright/test'

test.describe('用户资料页面', () => {
  test('应该能够查看和编辑用户资料', async ({ page }) => {
    // 导航到用户资料页面
    await page.goto('/pages/user/profile/index')
    
    // 检查页面标题
    await expect(page).toHaveTitle('用户资料')
    
    // 检查用户信息显示
    await expect(page.locator('.username')).toBeVisible()
    
    // 点击编辑按钮
    await page.click('.edit-btn')
    
    // 检查编辑模式
    await expect(page.locator('.edit-actions')).toBeVisible()
    
    // 修改昵称
    await page.fill('input[name="nickname"]', '新昵称')
    
    // 保存修改
    await page.click('.save-btn')
    
    // 检查保存结果
    await expect(page.locator('.username')).toHaveText('新昵称')
  })
})
```

---

## 🎯 页面开发最佳实践

### 1. 性能优化

#### 懒加载和代码分割

```vue
<script setup lang="ts">
// 懒加载组件
const UserInfoTab = defineAsyncComponent(() => 
  import('./components/UserInfoTab.vue')
)

const UserSettingsTab = defineAsyncComponent(() => 
  import('./components/UserSettingsTab.vue')
)

// 条件加载
const shouldLoadHeavyComponent = ref(false)

const HeavyComponent = defineAsyncComponent({
  loader: () => import('./components/HeavyComponent.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorComponent,
  delay: 200,
  timeout: 3000
})
</script>
```

#### 数据缓存

```typescript
// 使用 Store 缓存数据
const loadUserProfile = async (userId?: string, forceRefresh = false) => {
  const cachedData = userStore.getCachedProfile(userId)
  
  if (cachedData && !forceRefresh) {
    pageState.value.userInfo = cachedData
    return
  }
  
  // 从服务器获取数据
  const result = await getUserProfile(userId)
  pageState.value.userInfo = result.data
  
  // 缓存数据
  userStore.cacheProfile(userId, result.data)
}
```

#### 图片优化

```vue
<template>
  <!-- 使用 lazy-load 和 webp 格式 -->
  <image 
    :src="optimizedImageUrl"
    :lazy-load="true"
    mode="aspectFit"
    @error="handleImageError"
  />
</template>

<script setup lang="ts">
const optimizedImageUrl = computed(() => {
  if (!props.src) return ''
  
  // 根据设备像素比选择合适尺寸
  const dpr = uni.getSystemInfoSync().pixelRatio
  const size = Math.ceil(props.size * dpr)
  
  return `${props.src}?w=${size}&h=${size}&format=webp`
})
</script>
```

### 2. 用户体验优化

#### 加载状态

```vue
<template>
  <view class="page-container">
    <!-- 骨架屏 -->
    <SkeletonLoader v-if="pageState.loading" />
    
    <!-- 空状态 -->
    <EmptyState 
      v-else-if="!pageState.userInfo"
      title="用户不存在"
      description="该用户可能已被删除或不存在"
      @retry="loadUserProfile"
    />
    
    <!-- 正常内容 -->
    <view v-else class="content">
      <!-- 页面内容 -->
    </view>
  </view>
</template>
```

#### 错误处理

```typescript
// 统一错误处理
const handleError = (error: any, context: string) => {
  console.error(`${context}失败:`, error)
  
  let message = '操作失败，请稍后重试'
  
  if (error.code === 401) {
    message = '登录已过期，请重新登录'
    // 跳转到登录页
    uni.navigateTo({ url: '/pages/auth/login/index' })
    return
  }
  
  if (error.code === 403) {
    message = '没有权限执行此操作'
  }
  
  if (error.code === 404) {
    message = '请求的资源不存在'
  }
  
  uni.showToast({
    title: message,
    icon: 'error',
    duration: 2000
  })
}
```

#### 交互反馈

```typescript
// 操作确认
const confirmDelete = () => {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除吗？',
    confirmColor: '#ff4757',
    success: (res) => {
      if (res.confirm) {
        handleDelete()
      }
    }
  })
}

// 操作成功反馈
const showSuccessToast = (message: string) => {
  uni.showToast({
    title: message,
    icon: 'success',
    duration: 1500
  })
}

// 加载状态
const showLoading = (title = '加载中...') => {
  uni.showLoading({ title })
}

const hideLoading = () => {
  uni.hideLoading()
}
```

### 3. 可访问性

```vue
<template>
  <!-- 语义化标签 -->
  <view class="user-profile-page" role="main">
    <view class="page-header" role="banner">
      <image 
        :src="userInfo.avatar"
        :alt="`${userInfo.nickname}的头像`"
        role="img"
      />
      <text role="heading" aria-level="1">{{ userInfo.nickname }}</text>
    </view>
    
    <!-- 可访问的按钮 -->
    <button 
      class="edit-btn"
      :aria-label="editMode ? '取消编辑' : '编辑资料'"
      @click="toggleEditMode"
    >
      {{ editMode ? '取消' : '编辑' }}
    </button>
    
    <!-- 表单标签 -->
    <view class="form-group">
      <label for="nickname">昵称</label>
      <input 
        id="nickname"
        v-model="formData.nickname"
        type="text"
        :aria-required="true"
        :aria-invalid="errors.nickname ? 'true' : 'false'"
      />
      <text v-if="errors.nickname" role="alert" class="error-message">
        {{ errors.nickname }}
      </text>
    </view>
  </view>
</template>
```

---

## 🔧 调试和故障排除

### 1. 常见问题

#### 页面路由问题

```typescript
// ❌ 错误的路由跳转
uni.navigateTo({ url: '/pages/user/profile' })  // 缺少 /index

// ✅ 正确的路由跳转
uni.navigateTo({ url: '/pages/user/profile/index' })

// ✅ 带参数的路由跳转
uni.navigateTo({ 
  url: '/pages/user/profile/index?userId=123&tab=settings' 
})
```

#### 页面参数获取

```typescript
// ❌ 错误的参数获取
onMounted(() => {
  // onMounted 中无法获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  console.log(currentPage.options) // 可能为空
})

// ✅ 正确的参数获取
onLoad((query) => {
  // 在 onLoad 中获取页面参数
  console.log('页面参数:', query)
})
```

#### 状态更新问题

```typescript
// ❌ 直接修改 props
const props = defineProps<{ userInfo: UserInfo }>()
props.userInfo.name = '新名称'  // 错误！

// ✅ 通过事件通信
const emit = defineEmits<{
  update: [userInfo: UserInfo]
}>()

const updateUserInfo = (newInfo: UserInfo) => {
  emit('update', newInfo)
}
```

### 2. 调试技巧

#### 开发者工具调试

```typescript
// 条件断点
const debugMode = process.env.NODE_ENV === 'development'

if (debugMode) {
  console.log('页面状态:', pageState.value)
  console.log('用户信息:', userStore.userInfo)
}

// 性能监控
const startTime = performance.now()

// 执行操作
await loadUserProfile()

const endTime = performance.now()
console.log(`加载用户资料耗时: ${endTime - startTime}ms`)
```

#### 网络请求调试

```typescript
// API 请求拦截
const loadUserProfile = async (userId?: string) => {
  console.log('开始加载用户资料:', { userId })
  
  try {
    const result = await getUserProfile(userId)
    console.log('用户资料加载成功:', result)
    return result
  } catch (error) {
    console.error('用户资料加载失败:', error)
    
    // 详细错误信息
    if (error.response) {
      console.error('响应状态:', error.response.status)
      console.error('响应数据:', error.response.data)
    }
    
    throw error
  }
}
```

### 3. 性能监控

```typescript
// 页面性能监控
const performanceMonitor = {
  pageLoadStart: 0,
  pageLoadEnd: 0,
  
  startTiming() {
    this.pageLoadStart = performance.now()
  },
  
  endTiming() {
    this.pageLoadEnd = performance.now()
    const loadTime = this.pageLoadEnd - this.pageLoadStart
    
    console.log(`页面加载耗时: ${loadTime.toFixed(2)}ms`)
    
    // 上报性能数据
    if (loadTime > 3000) {
      console.warn('页面加载时间过长:', loadTime)
    }
  }
}

// 在页面生命周期中使用
onLoad(() => {
  performanceMonitor.startTiming()
})

onReady(() => {
  performanceMonitor.endTiming()
})
```

---

## 📋 页面开发检查清单

### 开发完成检查

- [ ] **功能完整性**
  - [ ] 页面所有功能正常工作
  - [ ] 数据加载和显示正确
  - [ ] 用户交互响应正常
  - [ ] 错误处理完善

- [ ] **代码质量**
  - [ ] TypeScript 类型定义完整
  - [ ] 代码符合项目规范
  - [ ] 无 ESLint 错误和警告
  - [ ] 组件和函数命名语义化

- [ ] **性能优化**
  - [ ] 图片资源优化
  - [ ] 懒加载实现
  - [ ] 数据缓存策略
  - [ ] 页面加载时间 < 3s

- [ ] **用户体验**
  - [ ] 加载状态提示
  - [ ] 空状态处理
  - [ ] 错误状态处理
  - [ ] 操作反馈及时

- [ ] **多端兼容**
  - [ ] H5 端正常显示
  - [ ] 小程序端正常显示
  - [ ] App 端正常显示
  - [ ] 响应式布局适配

- [ ] **测试覆盖**
  - [ ] 单元测试通过
  - [ ] 集成测试通过
  - [ ] 端到端测试通过
  - [ ] 手动测试完成

### 发布前检查

- [ ] **代码审查**
  - [ ] 代码已通过 Code Review
  - [ ] 安全问题已排查
  - [ ] 性能问题已优化

- [ ] **文档更新**
  - [ ] API 文档已更新
  - [ ] 组件文档已更新
  - [ ] 变更日志已记录

- [ ] **部署准备**
  - [ ] 构建成功无错误
  - [ ] 环境配置正确
  - [ ] 依赖版本锁定

---

*下一步: [性能优化指南](./06-performance-optimization.md)*