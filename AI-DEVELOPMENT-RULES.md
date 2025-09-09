# AI开发者快速约束卡片

> **此文档为AI开发者的快速参考，必须置于AI的system rules中**

## 🚨 绝对禁止 (违反将导致任务失败)

```bash
❌ 修改 src/main.ts、src/App.vue、package.json
❌ 创建自定义tabBar组件（必须使用pages.json配置）
❌ 修改现有页面的导航配置
❌ 修改底部导航按钮数量或配置
❌ 使用any类型、console.log、TODO注释
❌ 直接操作DOM（使用uni-app API）
❌ 使用localStorage（使用uni.getStorageSync）
❌ 修改其他页面的代码文件
```

## ✅ 必须遵循

### 页面开发标准流程
1. **创建页面**: `src/pages/[页面名]/index.vue`
2. **更新配置**: 仅在`pages.json`的`pages`数组添加新页面
3. **技术栈**: Vue 3 + TypeScript + `<script setup>`
4. **质量检查**: `npm run lint` + `npm run build`

### 代码模板
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const loading = ref(false)

onMounted(() => {
  initPage()
})

const initPage = async () => {
  try {
    loading.value = true
    // 页面逻辑
  } catch (error) {
    console.error('初始化失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="page-container">
    <!-- 页面内容 -->
  </view>
</template>

<style scoped>
.page-container {
  padding: 20rpx;
  min-height: 100vh;
}
</style>
```

### 提交规范
```bash
git commit -m "feat: 实现[页面名]页面

- 功能描述
- 通过质量检查

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

## 📋 任务完成检查清单

**开发前**:
- [ ] 确认页面名称和功能需求
- [ ] 检查当前框架状态
- [ ] 创建功能分支

**开发中**:
- [ ] 使用标准页面模板
- [ ] TypeScript严格模式
- [ ] 添加错误处理
- [ ] 适当注释

**提交前**:
- [ ] `npm run lint` 通过
- [ ] `npm run build` 成功
- [ ] 页面功能正常
- [ ] 无调试代码
- [ ] 提交信息规范

## ⚠️ 框架保护

**当前5按钮导航结构**:
```
邻里(neighbor) | 公告(notice) | 创建(create) | 事项(task) | 我(profile)
```

**只能开发页面内容，不能**:
- 修改导航结构
- 自定义tabBar
- 影响其他页面

## 🎯 核心原则

1. **独立开发**: 每个页面独立，不影响其他页面
2. **框架优先**: 使用框架提供的功能，不自定义
3. **质量保证**: 严格的代码质量标准
4. **协作友好**: 规范的提交和文档

---

**记住**: 我们是在ttk-uni框架基础上开发，要保护框架完整性，确保多人协作的成功！