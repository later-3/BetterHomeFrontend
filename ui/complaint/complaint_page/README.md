# 投诉页面组件

这个目录包含了投诉相关的页面组件，提供两种不同用途的组件选择。

## 📋 组件列表

### 🎯 TaskList.vue (推荐使用)
**纯净的任务卡片列表组件**，可以像插入图片一样插入到任何页面中。

#### ✨ 组件特性
- **纯净组件**: 只包含TaskCard列表，无额外UI元素
- **响应式设计**: 自适应容器宽度
- **完整样式**: 内置所有必要的CSS样式
- **即插即用**: 无需额外配置，直接使用
- **事件支持**: 支持task-click事件监听
- **预设数据**: 包含6个不同类型的示例任务

#### 🚀 使用方法
```vue
<template>
  <div class="your-page">
    <!-- 你的页面内容 -->
    <TaskList @task-click="handleTaskClick" />
    <!-- 你的页面内容 -->
  </div>
</template>

<script>
import TaskList from './TaskList.vue'

export default {
  components: { TaskList },
  methods: {
    handleTaskClick(task) {
      console.log('点击了任务:', task.title)
    }
  }
}
</script>
```

#### 📦 包含的任务类型
- 🔧 设施维修 (紧急)
- 📢 投诉建议 (重要)
- 🔒 安全问题 (紧急)
- 🌿 环境卫生 (普通)
- 🤝 邻里纠纷 (重要)
- 🏗️ 其他事项 (低)

---

### 📱 ComplaintPage.vue
**完整的手机页面组合组件**，包含完整的手机界面元素。

#### 🎯 主要功能
- **手机屏幕模拟**: 375x812px标准手机屏幕尺寸
- **状态栏**: 显示时间、信号、WiFi、电池状态
- **导航栏**: 返回按钮、页面标题、菜单按钮
- **统计面板**: 总计、待处理、紧急事项数量统计
- **筛选功能**: 全部、待处理、紧急、已完成筛选
- **任务列表**: 包含6个预设的代办事项
- **底部操作**: 新建事项按钮
- **Home指示器**: iOS风格的底部指示器

#### 🔧 技术特性

**组件结构**
```
ComplaintPage.vue
├── 状态栏 (Status Bar)
├── 页面头部 (Page Header)
├── 筛选统计 (Filter Section)
├── 任务列表 (Tasks Container)
│   └── TaskCard 组件 × 6
├── 底部操作 (Bottom Actions)
└── Home指示器 (Home Indicator)
```

**依赖组件**
- **TaskCard**: `../card/TaskCard.vue`
- **Vue 3**: 使用组合式API

**数据模型**
```javascript
{
  id: Number,           // 任务ID
  title: String,        // 任务标题
  description: String,  // 任务描述
  category: String,     // 事项类型
  priority: String,     // 优先级
  status: String,       // 处理状态
  location: String,     // 位置信息
  assignee: {          // 负责人信息
    name: String,
    role: String,
    avatar: String
  },
  createdAt: Date      // 创建时间
}
```

## 🎨 样式系统

### 事项分类颜色
- **设施维修**: 红色 (#dc3545)
- **投诉建议**: 橙色 (#fd7e14)
- **安全问题**: 粉色 (#e83e8c)
- **环境卫生**: 绿色 (#20c997)
- **邻里纠纷**: 紫色 (#6f42c1)
- **其他事项**: 灰色 (#6c757d)

### 优先级颜色
- **紧急**: 红色 (#dc3545)
- **重要**: 橙色 (#fd7e14)
- **普通**: 绿色 (#28a745)
- **低**: 灰色 (#6c757d)

### 状态颜色
- **待处理**: 黄色 (#ffc107)
- **处理中**: 蓝色 (#17a2b8)
- **已完成**: 绿色 (#28a745)
- **已关闭**: 灰色 (#6c757d)

## 📱 预览页面

### 启动预览服务器
```bash
cd ui/complaint/complaint_page
python3 -m http.server 8084
```

### 访问预览页面
- **TaskList组件**: `http://localhost:8084/task-list-preview.html` ⭐ **推荐**
- **ComplaintPage组件**: `http://localhost:8084/preview.html`

## 📊 组件对比

| 特性 | TaskList.vue | ComplaintPage.vue |
|------|-------------|-------------------|
| **用途** | 🎯 插入式组件 | 📱 完整页面演示 |
| **UI元素** | 仅任务列表 | 完整手机界面 |
| **尺寸** | 自适应容器 | 固定375x812px |
| **使用场景** | 嵌入现有页面 | 独立页面预览 |
| **复杂度** | 轻量简洁 | 功能完整 |
| **推荐度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

## 🔄 交互功能

### TaskList组件事件
- `@task-click`: 点击任务卡片时触发

### ComplaintPage组件事件
- `@task-click`: 点击任务卡片时触发
- `@go-back`: 点击返回按钮时触发
- `@show-menu`: 点击菜单按钮时触发
- `@add-task`: 点击新建任务按钮时触发

### ComplaintPage筛选功能
- **全部**: 显示所有任务
- **待处理**: 只显示待处理状态的任务
- **紧急**: 只显示紧急优先级的任务
- **已完成**: 只显示已完成状态的任务

## 💡 使用建议

### 选择TaskList.vue的场景 ⭐
- ✅ 需要在现有页面中嵌入任务列表
- ✅ 页面已有基础布局和导航
- ✅ 只需要展示任务卡片内容
- ✅ 希望组件轻量且易于集成

### 选择ComplaintPage.vue的场景
- ✅ 需要完整的页面演示效果
- ✅ 要展示完整的手机界面设计
- ✅ 需要筛选和统计功能
- ✅ 用于原型展示或功能演示

## 📦 文件结构

```
ui/complaint/complaint_page/
├── TaskList.vue            # 纯净任务列表组件 ⭐
├── ComplaintPage.vue       # 完整页面组件
├── task-list-preview.html  # TaskList预览页面 ⭐
├── preview.html           # ComplaintPage预览页面
├── README.md              # 说明文档
└── assets/                # 图片资源
    ├── 1.svg
    ├── 2.svg
    ├── 3.png
    └── 4.svg
```

## 🔧 自定义配置

### 修改任务数据
在对应组件的`data()`中修改`tasks`数组来自定义任务内容。

### 调整样式
所有样式都在组件的`<style scoped>`部分，可以根据需要进行调整。

### 扩展功能
通过监听组件事件，可以轻松扩展更多功能，如任务详情页面、编辑功能等。

---

## 🎯 快速开始

**推荐使用TaskList.vue组件**，它提供了最简洁的任务列表功能，可以轻松集成到任何现有页面中！

```bash
# 1. 启动预览服务器
python3 -m http.server 8084

# 2. 查看TaskList组件效果
open http://localhost:8084/task-list-preview.html