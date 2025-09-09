# T1: 内容创建页面开发

## 任务概述
创建内容发布的主要编辑页面，提供富文本编辑和媒体上传功能。

## 技术要求
- **框架**: Vue 3 + TypeScript + uni-app
- **组件库**: uview-plus
- **状态管理**: Pinia
- **依赖**: 无其他任务依赖

## 页面规格

### 路由配置
```typescript
// 在 pages.json 中添加
{
  "path": "pages/create/create",
  "style": {
    "navigationBarTitleText": "发布内容"
  }
}
```

### 核心功能要求
1. **富文本编辑器**
   - 支持基础文本格式化
   - 支持图片插入
   - 字符计数显示
   - 实时保存草稿

2. **媒体上传**
   - 图片上传预览
   - 压缩处理
   - 上传进度显示

3. **表单验证**
   - 标题必填验证
   - 内容长度限制
   - 图片格式检查

## 开发指导

### 组件结构框架
```vue
<template>
  <view class="create-page">
    <!-- 头部区域：包含标题输入框 -->
    <view class="header-section">
      <!-- TODO: 实现标题输入组件 -->
    </view>

    <!-- 内容编辑区域 -->
    <view class="content-section">
      <!-- TODO: 实现富文本编辑器 -->
    </view>

    <!-- 媒体上传区域 -->
    <view class="media-section">
      <!-- TODO: 实现图片上传组件 -->
    </view>
    
    <!-- 底部操作区域 -->
    <view class="action-section">
      <!-- TODO: 实现保存草稿和发布按钮 -->
    </view>
  </view>
</template>
```

### 状态管理需求
```typescript
// store/content.ts 需要实现的状态
interface ContentState {
  // TODO: 定义内容创建相关的状态
  draft: {
    // 草稿数据结构
  }
  uploadProgress: {
    // 上传进度状态
  }
}
```

## API 集成要点

### Directus 交互
- **集合**: `posts`
- **字段**: title, content, images, status, author
- **操作**: 创建草稿、上传媒体文件

### 接口实现模板
```typescript
// api/content.ts
export const createDraft = async (data: DraftData) => {
  // TODO: 实现草稿创建逻辑
}

export const uploadImage = async (file: File) => {
  // TODO: 实现图片上传逻辑
}
```

## UI/UX 要求

### 设计规范
- 遵循 uview-plus 设计语言
- 响应式布局适配不同屏幕
- 加载状态和错误提示

### 交互要求
- 编辑时自动保存草稿
- 上传进度可视化
- 表单验证实时反馈

## 验收标准

### 功能验收
- [ ] 页面正常渲染，无控制台错误
- [ ] 富文本编辑器功能完整
- [ ] 图片上传正常工作
- [ ] 表单验证生效
- [ ] 草稿保存功能正常

### 代码质量
- [ ] TypeScript 类型检查通过
- [ ] 代码符合项目规范
- [ ] 组件可复用性良好
- [ ] 错误处理完善

### 性能要求
- [ ] 页面首屏加载时间 < 2s
- [ ] 图片压缩处理正常
- [ ] 内存占用合理

## 开发注意事项

### 框架保护规则
- 不修改 ttk-uni 核心文件
- 使用项目已有的 API 模式
- 遵循 Vue 3 Composition API 规范

### 错误处理
- 网络请求失败处理
- 文件上传异常处理
- 用户输入验证错误提示

## 测试要求

### 单元测试
```typescript
// tests/pages/create.spec.ts
// TODO: 编写组件单元测试
```

### 功能测试清单
- [ ] 基础编辑功能测试
- [ ] 文件上传功能测试
- [ ] 表单验证测试
- [ ] 草稿保存测试

## 开发人员填写区域

### 实现进度
- [ ] 页面基础结构
- [ ] 富文本编辑器集成
- [ ] 图片上传功能
- [ ] 表单验证逻辑
- [ ] API 集成
- [ ] 测试用例编写

### 技术难点记录
```
TODO: 开发过程中遇到的技术难点和解决方案
```

### 代码审查清单
- [ ] 代码格式符合规范
- [ ] 类型定义完整
- [ ] 错误处理覆盖完整
- [ ] 性能优化到位