# Task Card Component

基于Figma设计实现的Vue代办事项卡片组件，专为社区物业管理系统设计。

## 🎯 组件用途

这是一个专门用于显示业主向物业或其他业主发起的代办事项的预览小组件。适用于：

- **物业管理系统**: 展示维修申请、投诉建议等
- **社区服务平台**: 显示邻里互助、公共事务等
- **任务管理界面**: 代办事项列表和状态跟踪

## ✨ 功能特性

### 🏷️ 事项分类
- **设施维修**: 电梯、水电、门禁等设施问题
- **投诉建议**: 噪音、服务质量等投诉
- **安全问题**: 门禁故障、安全隐患等
- **环境卫生**: 垃圾清理、绿化维护等
- **邻里纠纷**: 停车位、噪音等纠纷
- **其他事项**: 公共设施改善建议等

### 🎨 视觉设计
- **优先级标识**: 紧急、重要、普通、低优先级的颜色区分
- **状态跟踪**: 待处理、处理中、已完成、已关闭
- **负责人信息**: 显示处理人员的头像、姓名和部门
- **时间显示**: 智能显示创建时间（几分钟前、几小时前、几天前）

### 🔄 交互功能
- **悬停效果**: 卡片阴影和位移动画
- **点击操作**: 查看详情按钮，支持事件回调
- **响应式设计**: 适配移动端和桌面端

## 📱 组件结构

### 头部区域 (Header Section)
- 事项类型标签（带图标和颜色）
- 优先级标识
- 创建时间显示

### 内容区域 (Content Section)
- 事项标题
- 详细描述（支持多行截断）
- 状态标签和位置信息
- 负责人头像和信息

### 底部操作 (Footer Section)
- "查看详情" 按钮
- 箭头图标（带悬停动画）

## 🚀 使用方法

### 基础用法
```vue
<template>
  <TaskCard 
    :task="taskData"
    @view-details="handleViewDetails"
  />
</template>

<script>
import TaskCard from './TaskCard.vue'

export default {
  components: {
    TaskCard
  },
  data() {
    return {
      taskData: {
        id: '001',
        title: '电梯维修申请',
        type: '设施维修',
        description: '3号楼电梯按钮失灵，需要及时维修处理。',
        status: '待处理',
        priority: '紧急',
        location: '3号楼 电梯间',
        createdAt: new Date(),
        assignee: {
          name: '物业管理处',
          role: '维修部门',
          avatar: 'assets/1.svg'
        }
      }
    }
  },
  methods: {
    handleViewDetails(task) {
      console.log('查看详情:', task)
      // 跳转到详情页面或打开详情弹窗
    }
  }
}
</script>
```

### Task 数据结构

```typescript
interface Task {
  id: string                    // 事项ID
  title: string                 // 事项标题
  type: string                  // 事项类型
  description: string           // 详细描述
  status: string               // 处理状态
  priority: string             // 优先级
  location: string             // 位置信息
  createdAt: Date              // 创建时间
  assignee: {                  // 负责人信息
    name: string               // 姓名
    role: string               // 角色/部门
    avatar: string             // 头像URL
  }
}
```

### 支持的枚举值

#### 事项类型 (type)
- `设施维修` - 蓝色主题
- `投诉建议` - 橙色主题  
- `安全问题` - 红色主题
- `环境卫生` - 绿色主题
- `邻里纠纷` - 紫色主题
- `其他事项` - 灰色主题

#### 优先级 (priority)
- `紧急` - 红色标签
- `重要` - 橙色标签
- `普通` - 绿色标签
- `低` - 灰色标签

#### 状态 (status)
- `待处理` - 橙色标签
- `处理中` - 蓝色标签
- `已完成` - 绿色标签
- `已关闭` - 灰色标签

### 事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| view-details | 点击查看详情时触发 | task: Task对象 |

## 📋 预览页面

我们提供了两个预览页面：

1. **CloudCard.vue + preview.html**: 原始的云存储卡片组件
2. **TaskCard.vue + task-preview.html**: 新的代办事项卡片组件

### 启动预览服务器

```bash
# 进入组件目录
cd ui/complaint/card

# 启动HTTP服务器
python3 -m http.server 8083

# 访问预览页面
# 原始组件: http://localhost:8083/preview.html
# 代办事项组件: http://localhost:8083/task-preview.html
```

## 🎨 设计系统

### 颜色规范
- **主色调**: 各类型事项的专属颜色
- **状态色**: 统一的状态标识颜色
- **文字色**: #333 (标题), #666 (正文), #999 (辅助)
- **背景色**: 白色卡片，浅色标签背景

### 字体规范
- **标题**: 20px, font-weight: 600
- **正文**: 14px, font-weight: 400  
- **标签**: 12px, font-weight: 500
- **时间**: 12px, font-weight: 400

### 间距规范
- **卡片内边距**: 25px
- **元素间距**: 12px, 20px
- **标签内边距**: 6px 12px
- **圆角**: 20px (卡片), 16px (标签)

## 📱 响应式设计

- **桌面端**: 360px 固定宽度
- **平板端**: 自适应宽度，最大360px
- **移动端**: 100%宽度，调整内边距和字体大小

## 🔧 技术栈

- **Vue 3**: 组合式API
- **CSS3**: Flexbox布局，CSS变量
- **响应式设计**: 移动优先
- **现代浏览器**: Chrome 90+, Firefox 88+, Safari 14+

## 📁 文件结构

```
ui/complaint/card/
├── TaskCard.vue          # 代办事项卡片组件 (新)
├── CloudCard.vue         # 云存储卡片组件 (原)
├── task-preview.html     # 代办事项预览页面 (新)
├── preview.html          # 云存储预览页面 (原)
├── README.md             # 说明文档
└── assets/               # 图片资源
    ├── 1.svg            # 图标1
    ├── 2.svg            # 图标2  
    ├── 3.png            # 预览图
    └── 4.svg            # 箭头图标
```

## 🚀 集成建议

1. **列表页面**: 使用网格布局展示多个TaskCard
2. **筛选功能**: 根据类型、状态、优先级筛选
3. **排序功能**: 按时间、优先级、状态排序
4. **分页加载**: 支持无限滚动或分页
5. **实时更新**: WebSocket或轮询更新状态

## 📝 示例数据

```javascript
const sampleTasks = [
  {
    id: '001',
    title: '电梯维修申请',
    type: '设施维修',
    description: '3号楼电梯按钮失灵，需要及时维修处理，影响业主正常出行安全。',
    status: '待处理',
    priority: '紧急',
    location: '3号楼 电梯间',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    assignee: {
      name: '物业管理处',
      role: '维修部门',
      avatar: 'assets/1.svg'
    }
  },
  {
    id: '002',
    title: '噪音投诉处理',
    type: '投诉建议',
    description: '楼上邻居深夜装修噪音严重，影响正常休息。',
    status: '处理中',
    priority: '重要',
    location: '2号楼 1205室',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    assignee: {
      name: '张管家',
      role: '客服部门',
      avatar: 'assets/2.svg'
    }
  }
]
```

## 🎯 使用场景

### 物业管理系统
- 维修申请管理
- 投诉处理跟踪
- 安全事件记录
- 环境问题处理

### 社区服务平台
- 邻里互助请求
- 公共设施报修
- 活动组织协调
- 意见建议收集

### 任务管理界面
- 工单分配展示
- 处理进度跟踪
- 优先级管理
- 负责人分配