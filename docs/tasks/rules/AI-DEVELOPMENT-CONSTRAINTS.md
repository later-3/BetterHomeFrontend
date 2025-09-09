# AI开发协作约束规范

> **重要**: 本文档为AI开发者协作的强制约束规范，必须严格遵循，确保多人协作时的代码质量和框架完整性。

## 🎯 核心原则

### 📦 框架保护原则

**绝对禁止修改的核心文件**:
```
❌ 禁止修改：
src/main.ts                 # 应用入口
src/App.vue                 # 根组件
src/manifest.json           # 应用配置
uni.scss                    # 全局样式
vite.config.ts             # 构建配置
tsconfig.json              # TypeScript配置
package.json               # 依赖配置（除非明确需要）
```

**有条件修改的配置文件** (Level 1):
```
⚠️  需要谨慎修改：
src/pages.json             # 仅允许添加新页面和导航配置
src/store/                 # 仅允许添加新store，不修改现有store
src/utils/                 # 仅允许添加新工具函数
src/hooks/                 # 仅允许添加新hooks
```

## 🏗️ 页面开发规范

### 1. 页面添加流程

**步骤1**: 创建页面文件
```bash
# 标准页面目录结构
src/pages/[页面名]/
├── index.vue              # 页面组件（必需）
├── components/            # 页面专用组件（可选）
├── hooks/                # 页面专用hooks（可选）
└── types.ts              # 页面类型定义（可选）
```

**步骤2**: 更新 pages.json
```json
// 仅在 pages 数组中添加新页面
{
  "pages": [
    // 现有页面配置保持不变
    {
      "name": "新页面名",
      "path": "pages/新页面名/index",
      "style": {
        "navigationBarTitleText": "页面标题"
      }
    }
  ]
}
```

**❌ 禁止行为**:
- 修改现有页面的path配置
- 删除现有页面配置
- 修改tabBar的现有按钮配置
- 修改globalStyle全局样式

### 2. 底部导航栏规范

**当前导航结构** (5按钮布局):
```json
{
  "tabBar": {
    "list": [
      { "pagePath": "pages/neighbor/neighbor" },   // 邻里
      { "pagePath": "pages/notice/notice" },       // 公告
      { "pagePath": "pages/create/create" },       // 创建
      { "pagePath": "pages/task/task" },           // 事项
      { "pagePath": "pages/profile/profile" }      // 我
    ]
  }
}
```

**❌ 绝对禁止**:
- 自定义tabBar组件
- 修改tabBar的按钮数量
- 修改现有按钮的配置
- 添加新的导航按钮

**✅ 允许操作**:
- 开发对应页面的内容
- 优化页面性能和用户体验

## 📝 代码开发约束

### 1. Vue组件规范

**必须使用的技术栈**:
```typescript
// ✅ 强制使用
- Vue 3 Composition API
- TypeScript (严格模式)
- <script setup> 语法
- CSS Modules 或 scoped styles
```

**标准页面模板**:
```vue
<script setup lang="ts">
/**
 * [页面名称]
 * 功能描述：[简要描述页面功能]
 * 
 * @author AI Developer
 * @created [日期]
 */

import { ref, onMounted } from 'vue'

// 页面状态定义
const pageData = ref<any>(null)
const loading = ref(false)

// 页面生命周期
onMounted(() => {
  initPage()
})

// 页面初始化
const initPage = async () => {
  try {
    loading.value = true
    // 页面初始化逻辑
  } catch (error) {
    console.error('页面初始化失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="page-container">
    <!-- 页面内容 -->
    <view v-if="loading" class="loading">
      加载中...
    </view>
    <view v-else class="content">
      <!-- 具体内容 -->
    </view>
  </view>
</template>

<style scoped>
.page-container {
  padding: 20rpx;
  min-height: 100vh;
}

.loading {
  text-align: center;
  padding: 50rpx 0;
}

.content {
  /* 页面内容样式 */
}
</style>
```

### 2. 状态管理规范

**Store创建规则**:
```typescript
// ✅ 允许：创建页面专用store
// stores/[页面名].ts
import { defineStore } from 'pinia'

export const use[页面名]Store = defineStore('[页面名]', () => {
  // store逻辑
  return {
    // 导出的状态和方法
  }
})
```

**❌ 禁止行为**:
- 修改现有store（如navigation.ts）
- 在全局store中添加页面特定逻辑
- 直接修改其他页面的状态

### 3. API调用规范

**标准API封装**:
```typescript
// api/[页面名].ts
import { request } from '@/utils/request'

// 页面相关API接口
export const get[页面名]Data = (params: any) => {
  return request.get(`/api/[页面名]`, { params })
}

export const update[页面名] = (data: any) => {
  return request.post(`/api/[页面名]`, data)
}
```

**❌ 禁止行为**:
- 修改 `@/utils/request` 基础配置
- 在页面组件中直接使用fetch/axios
- 修改其他页面的API接口

## 🔧 开发工作流程

### 1. 任务开始前

**必须执行的检查**:
```bash
# 1. 确认当前分支状态
git status
git pull origin main

# 2. 创建功能分支
git checkout -b feature/[页面名]-development

# 3. 检查框架完整性
npm run lint
npm run type-check
```

### 2. 开发过程中

**强制要求**:
- ✅ 每次修改前运行 `npm run lint`
- ✅ 每次提交前运行 `npm run build` 确保构建成功
- ✅ 使用TypeScript严格模式，禁止使用 `any` 类型
- ✅ 所有异步操作必须有错误处理
- ✅ 关键逻辑必须添加注释

**代码质量检查清单**:
```bash
# 必须通过的检查
□ npm run lint                 # ESLint检查通过
□ npm run type-check           # TypeScript类型检查通过
□ npm run build               # 构建成功
□ 页面功能正常运行            # 手动功能测试
□ 无console.log调试代码       # 清理调试代码
□ 无TODO/FIXME注释           # 完成所有开发任务
```

### 3. 任务完成后

**提交规范**:
```bash
# 1. 添加文件
git add src/pages/[页面名]/
git add src/api/[页面名].ts
git add src/stores/[页面名].ts  # 如有

# 2. 规范提交信息
git commit -m "feat: 实现[页面名]页面功能

- 新增[页面名]页面组件
- 实现[具体功能列表]
- 添加相关API接口
- 通过所有质量检查

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# 3. 推送分支
git push origin feature/[页面名]-development
```

## 🚨 危险操作警告

### 绝对禁止的操作

```bash
❌ 删除现有文件
❌ 修改package.json依赖（除非明确需要）
❌ 修改vite.config.ts构建配置
❌ 修改tsconfig.json编译配置
❌ 创建自定义路由系统
❌ 创建自定义导航组件
❌ 修改App.vue根组件
❌ 修改main.ts入口文件
❌ 在组件外使用全局变量
❌ 直接操作DOM (使用uni-app API)
❌ 使用localStorage (使用uni.getStorageSync)
```

### 需要申请的操作

```bash
⚠️  添加新的npm依赖
⚠️  修改全局样式变量
⚠️  修改uni.scss
⚠️  添加新的全局组件
⚠️  修改构建脚本
⚠️  添加环境变量
```

## 📊 页面开发检查清单

### 开发完成自检

**功能检查**:
- [ ] 页面正常渲染，无白屏错误
- [ ] 所有交互功能正常工作
- [ ] 数据加载和错误处理完整
- [ ] 页面样式适配不同屏幕尺寸
- [ ] 导航进入和退出正常

**代码质量**:
- [ ] TypeScript类型定义完整
- [ ] 无ESLint警告和错误
- [ ] 关键函数有注释说明
- [ ] 无调试代码残留
- [ ] 异步操作有错误处理

**性能优化**:
- [ ] 图片资源已优化
- [ ] 组件渲染性能良好
- [ ] 内存使用正常
- [ ] 无无限循环或内存泄漏

## 🔍 常见问题和解决方案

### 1. 页面跳转问题
```typescript
// ✅ 正确方式
uni.navigateTo({
  url: '/pages/目标页面/index'
})

// ❌ 错误方式
// 不要使用vue-router或自定义路由
```

### 2. 数据共享问题
```typescript
// ✅ 使用Pinia store
const store = use[页面名]Store()

// ❌ 不要使用全局变量
// window.globalData = data
```

### 3. 样式冲突问题
```vue
<!-- ✅ 使用scoped样式 -->
<style scoped>
.container { /* 页面特定样式 */ }
</style>

<!-- ❌ 不要使用全局样式 -->
<style>
.container { /* 可能影响其他页面 */ }
</style>
```

## 📞 协作沟通规范

### 问题报告格式
```markdown
**页面**: [页面名称]
**问题类型**: Bug/Feature/Question
**问题描述**: [详细描述]
**重现步骤**: [如果是Bug]
**期望行为**: [期望的结果]
**环境信息**: [浏览器/设备信息]
```

### 代码审查要点
1. **架构合规性**: 是否违反框架保护原则
2. **代码质量**: TypeScript、ESLint、性能
3. **功能完整性**: 是否满足需求
4. **用户体验**: 交互流畅性和视觉效果
5. **错误处理**: 异常情况的处理是否完善

## 🎯 成功标准

每个页面开发任务的成功标准：

1. **✅ 功能完整**: 实现所有需求功能
2. **✅ 质量达标**: 通过所有代码质量检查
3. **✅ 框架兼容**: 不破坏现有框架结构
4. **✅ 性能优良**: 页面加载和交互流畅
5. **✅ 文档完整**: 代码注释和说明完整

---

## 📚 参考文档

- [项目架构标准](./03-architecture-standards.md)
- [性能优化指南](./06-performance-optimization.md)
- [测试规范](./07-testing-guide.md)
- [紧急修复指南](../URGENT_FIXES_NEEDED.md)

---

**最后更新**: 2025-01-07  
**适用版本**: v1.0+  
**强制执行**: 所有AI开发者必须严格遵循

⚠️ **重要提醒**: 违反本约束规范可能导致代码合并失败或系统不稳定，请严格遵守！