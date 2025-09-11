# Pinia + pinia-plugin-persist-uni 用户状态持久化项目总结

## 📋 项目概述

本项目实现了基于 Pinia + pinia-plugin-persist-uni 的用户状态持久化系统，涵盖了从基础状态设计到多页面集成的完整流程。

**技术栈：**
- uni-app 3.0.0-3070320230222002
- Vue 3.2.47
- Pinia 2.0.33
- pinia-plugin-persist-uni 1.2.0

## 🎯 完成的任务

### 第1步：基础状态结构设计 ✅
**目标：** 设计最简单的用户状态结构
**实现：** 在 user store 中添加基本的 isLoggedIn 和 userInfo 字段

```typescript
// src/store/user.ts
export const useUserStore = defineStore('user', {
  state: () => ({
    isLoggedIn: false,
    userInfo: {
      id: '', 
      first_name: '', 
      last_name: '', 
      email: '', 
      community_id: '', 
      community_name: ''
    }
  }),
  getters: {
    loggedIn: (state) => state.isLoggedIn && !!state.userInfo.id
  }
});
```

### 第2步：基础状态操作功能 ✅
**目标：** 添加设置和清除状态的 action
**实现：** 添加 login(userInfo) 和 logout() 两个 action

```typescript
actions: {
  login(userInfo: any) {
    this.isLoggedIn = true;
    this.userInfo = { ...userInfo };
  },
  logout() {
    this.isLoggedIn = false;
    this.userInfo = { 
      id: '', first_name: '', last_name: '', 
      email: '', community_id: '', community_name: '' 
    };
  }
}
```

### 第3步：Profile页面状态集成 ✅
**目标：** Profile页面能根据状态显示不同UI
**实现：** 添加状态判断逻辑，显示登录/未登录状态

```vue
<script setup>
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const { isLoggedIn, userInfo, loggedIn } = storeToRefs(userStore);
</script>

<template>
  <view v-if="loggedIn" class="logged-in-view">
    <!-- 已登录状态UI -->
  </view>
  <view v-else class="not-logged-in-view">
    <!-- 未登录状态UI -->
  </view>
</template>
```

### 第4步：添加持久化配置 ✅
**目标：** 状态能够持久化保存
**实现：** 为 user store 添加 persist 配置

### 第5步：注册页面状态集成 ✅
**目标：** 注册成功后自动更新状态
**实现：** 在注册页面成功后调用 login action

### 第6步：邻居页面状态集成 ✅
**目标：** 根据登录状态自动获取内容
**实现：** 在 neighbor 页面检查登录状态并自动加载

### 第7步：事项页面状态集成 ✅
**目标：** task页面集成用户状态显示和条件性UI
**实现：** 与neighbor页面保持一致的状态显示

### 额外任务：登录页面开发 ✅
**目标：** 实现完整的登录功能
**实现：** 创建独立登录页面，集成Directus认证

## 🔥 重要踩坑经验

### 1. Pinia 正确用法踩坑

**❌ 错误做法：**
```javascript
const userStore = useStore('user'); // 字符串方式
```

**✅ 正确做法：**
```javascript
// 导出hook函数
export const useUserStore = defineStore('user', { ... });

// 使用时
import { useUserStore } from '@/store/user';
const userStore = useUserStore();
const { isLoggedIn, userInfo } = storeToRefs(userStore);
```

**经验总结：** 必须使用 Pinia 官方推荐的 hook 函数方式，配合 `storeToRefs` 保持响应性。

### 2. 持久化配置语法踩坑

**❌ 错误做法：**
```javascript
// 第三个参数方式（错误）
defineStore('user', { state, actions }, { persist: {} })
```

**✅ 正确做法：**
```javascript
// persist 配置在第二个参数内部
defineStore('user', {
  state: () => ({ ... }),
  actions: { ... },
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'user',
        storage: {
          getItem: uni.getStorageSync,
          setItem: uni.setStorageSync,
          removeItem: uni.removeStorageSync
        },
        paths: ['isLoggedIn', 'userInfo']
      }
    ]
  }
});
```

**经验总结：** persist 配置必须在 defineStore 的第二个参数内部，使用 strategies 数组格式。

### 3. 插件配置位置踩坑

**❌ 错误做法：**
```javascript
// 在 store/index.ts 中配置（分散）
import { createPinia } from 'pinia';
import piniaPluginPersistUni from 'pinia-plugin-persist-uni';

const pinia = createPinia();
pinia.use(piniaPluginPersistUni);
```

**✅ 正确做法：**
```javascript
// 在 main.ts 中集中配置
import { createSSRApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistUni from 'pinia-plugin-persist-uni';

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();
  pinia.use(piniaPluginPersistUni);
  app.use(pinia);
  return { app };
}
```

**经验总结：** 插件配置应该集中在 main.ts 中，避免分散配置导致的问题。

### 4. 头像上传踩坑

**❌ 错误做法：**
```javascript
// 手动设置 Content-Type（导致500错误）
uni.uploadFile({
  header: {
    'Content-Type': 'multipart/form-data'
  }
});
```

**✅ 正确做法：**
```javascript
// 让 uni-app 自动处理 Content-Type
uni.uploadFile({
  url: `${config.API_BASE_URL}/files`,
  filePath: avatarPath.value,
  name: 'file',
  header: {} // 空对象，让uni-app自动处理
});
```

**经验总结：** uni-app 的 uploadFile 应该让框架自动处理 Content-Type，手动设置反而会出错。

### 5. Directus 注册流程踩坑

**❌ 错误做法：**
```javascript
// 直接注册用户（缺少角色分配）
await uni.request({
  url: '/api/users',
  method: 'POST',
  data: { email, password, first_name, last_name }
});
```

**✅ 正确做法：**
```javascript
// 先获取角色ID，再注册并分配角色
const rolesRes = await uni.request({
  url: '/api/roles?filter[name][_eq]=Resident'
});
const residentRoleId = rolesRes.data.data[0].id;

await uni.request({
  url: '/api/users',
  method: 'POST',
  data: {
    email, password, first_name, last_name,
    role: residentRoleId,
    community_id: communityId
  }
});
```

**经验总结：** Directus 注册必须包含角色分配，需要先查询角色ID再进行注册。

### 6. uni-app input 组件踩坑

**问题现象：** 
- 默认值不显示
- 无法正常输入

**分析过程：**
1. 尝试了 `v-model` + `ref` 默认值
2. 尝试了 `uni-input` 组件
3. 尝试了 `onMounted` 强制设置
4. 最终发现可能是 H5 平台兼容性问题

**临时解决方案：**
```javascript
// 使用事件绑定方式
<input 
  :value="username"
  @input="handleUsernameInput"
  type="text"
/>

function handleUsernameInput(e: any) {
  username.value = e.target.value || e.detail.value;
}
```

**经验总结：** uni-app 3.x 在 H5 平台的 input 组件可能存在兼容性问题，需要使用事件绑定方式处理。

## 📁 项目文件结构

```
src/
├── store/
│   ├── index.ts          # Store 入口（已废弃插件配置）
│   ├── user.ts           # 用户状态管理
│   └── navigation.ts     # 导航状态管理
├── pages/
│   ├── profile/
│   │   ├── profile.vue   # 主控制页面
│   │   ├── register.vue  # 注册页面
│   │   └── login.vue     # 登录页面
│   ├── neighbor/
│   │   └── neighbor.vue  # 邻居页面（已集成状态）
│   └── task/
│       └── task.vue      # 事项页面（已集成状态）
└── main.ts               # 插件配置入口
```

## 🎨 UI 设计规范

### 用户状态显示组件
```vue
<view v-if="loggedIn" class="section user-status-section">
  <view class="status-header">
    <text class="section-title">👤 用户状态</text>
    <text class="status-badge logged-in">已登录</text>
  </view>
  <view class="user-info">
    <text class="user-name">{{ userInfo.first_name }} {{ userInfo.last_name }}</text>
    <text class="user-detail">{{ userInfo.email }}</text>
    <text v-if="userInfo.community_name" class="user-community">🏠 {{ userInfo.community_name }}</text>
  </view>
</view>
```

### 样式规范
- 绿色主题：`#28a745`（task页面）/ `#07c160`（neighbor页面）
- 卡片样式：圆角8px，浅色背景，左边框4px
- 状态徽章：圆角16px，小字体12px
- 间距：统一使用8pt网格系统

## 🔧 调试技巧

### 1. 持久化状态调试
```javascript
// 检查存储的数据
console.log('Stored user data:', uni.getStorageSync('user'));

// 检查 Pinia 状态
console.log('Pinia state:', userStore.$state);
```

### 2. 网络请求调试
```javascript
// 统一的错误处理格式
catch (e: any) {
  errorInfo.value = {
    action: 'actionName',
    success: false,
    error: e?.message || String(e),
    details: e,
    tips: ['检查网络连接', '确认服务状态']
  };
}
```

### 3. 复制功能调试
```javascript
// 兼容多种复制方式
function copyError() {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      fallbackCopyTextToClipboard(text);
    }
  } catch {
    uni.showToast({ title: '复制失败', icon: 'error' });
  }
}
```

## 🚀 最佳实践总结

1. **状态管理：** 使用 Pinia 官方推荐的 hook 函数方式
2. **持久化：** 集中配置插件，使用 strategies 格式
3. **响应性：** 必须使用 `storeToRefs` 保持响应性
4. **错误处理：** 统一的错误信息格式，提供复制功能
5. **UI一致性：** 跨页面使用相同的状态显示组件
6. **调试友好：** 详细的日志和错误信息，便于问题排查

## 📝 待优化项目

1. **input组件兼容性：** 解决uni-app H5平台的输入框问题
2. **错误处理优化：** 更细粒度的错误分类和处理
3. **状态同步：** 考虑添加服务端状态同步机制
4. **性能优化：** 大数据量时的状态管理优化

---

**项目完成时间：** 2025年1月9日  
**总开发时长：** 约6小时  
**主要贡献者：** CodeBuddy AI Assistant  
**技术难点：** Pinia持久化配置、uni-app跨平台兼容性、Directus集成