# Schedule App UI Component

基于Figma设计实现的日程管理应用界面，使用Vue.js构建。

## 文件结构

```
ui/complaint/detail/
├── ScheduleApp.vue         # 主应用组件
├── TimelineSection.vue     # 时间轴组件（独立）
├── preview.html            # 完整应用预览
├── timeline-preview.html   # 时间轴组件预览
├── styles.css              # 通用样式文件
└── README.md              # 说明文档
```

## 功能特性

### 🎨 设计特点
- **现代化UI设计**: 基于Figma原型，采用渐变色彩和圆角设计
- **响应式布局**: 支持移动端和桌面端显示
- **流畅动画**: 包含悬停效果和过渡动画
- **无障碍支持**: 符合WCAG标准的可访问性设计

### 📱 界面组件
1. **顶部导航栏**
   - 返回按钮
   - 用户头像

2. **月份导航**
   - 上一月/下一月切换
   - 当前月份显示

3. **日期选择器**
   - 可点击的日期卡片
   - 活跃状态高亮显示

4. **事件列表**
   - 时间轴显示
   - 彩色事件卡片
   - 参与者头像
   - 事件时间信息

5. **底部导航栏**
   - 四个主要功能入口
   - 当前页面指示器

## 使用方法

### 1. 直接预览
- **完整应用**: 打开 `preview.html` 文件预览完整的日程应用界面
- **时间轴组件**: 打开 `timeline-preview.html` 文件预览独立的时间轴组件

### 2. Vue项目集成

#### 使用完整应用组件
```vue
<template>
  <ScheduleApp />
</template>

<script>
import ScheduleApp from './ui/complaint/detail/ScheduleApp.vue'

export default {
  components: {
    ScheduleApp
  }
}
</script>
```

#### 单独使用时间轴组件
```vue
<template>
  <TimelineSection 
    :title="'我的日程'"
    :timeLabels="timeLabels"
    :events="events"
    @event-click="handleEventClick"
  />
</template>

<script>
import TimelineSection from './ui/complaint/detail/TimelineSection.vue'

export default {
  components: {
    TimelineSection
  },
  data() {
    return {
      timeLabels: ['9AM', '10AM', '11AM', '12PM'],
      events: [
        {
          id: 1,
          title: '会议标题',
          subtitle: '参与者',
          time: '9:00 AM - 10:00 AM',
          type: 'event-orange',
          avatars: [
            { id: 1, color: '#ff6b6b' },
            { id: 2, color: '#4ecdc4' }
          ]
        }
      ]
    }
  },
  methods: {
    handleEventClick(event) {
      console.log('Event clicked:', event)
    }
  }
}
</script>
```

### 3. 样式引入
```html
<link rel="stylesheet" href="./ui/complaint/detail/styles.css">
```

## 技术栈

- **Vue 3**: 组件框架
- **CSS3**: 样式和动画
- **SVG**: 图标和装饰元素
- **Flexbox/Grid**: 布局系统

## 组件详细说明

### TimelineSection 组件

#### Props
- `title` (String): 时间轴标题，默认为 "Ongoing"
- `timeLabels` (Array): 时间标签数组，如 ['9AM', '10AM', '11AM']
- `events` (Array): 事件数据数组

#### Events
- `event-click`: 当事件卡片被点击时触发，传递事件对象

#### 事件数据格式
```javascript
{
  id: 1,                    // 唯一标识
  title: '事件标题',         // 事件名称
  subtitle: '参与者信息',    // 副标题
  time: '9:00 AM - 10:00 AM', // 时间范围
  type: 'event-orange',     // 样式类型: event-orange, event-blue, event-pink
  avatars: [                // 参与者头像
    { id: 1, color: '#ff6b6b' },
    { id: 2, color: '#4ecdc4' }
  ]
}
```

## 自定义配置

### 颜色主题
在 `styles.css` 中修改CSS变量：
```css
:root {
  --primary-gradient: linear-gradient(136deg, #8B78FF 0%, #5451D6 100%);
  --orange-gradient: linear-gradient(136deg, #FFD29D 0%, #FF9E2D 100%);
  --blue-gradient: linear-gradient(136deg, #B1EEFF 0%, #29BAE2 100%);
  --pink-gradient: linear-gradient(136deg, #FFA0BC 0%, #FF1B5E 100%);
}
```

### 事件数据
在Vue组件中修改 `data()` 方法：
```javascript
data() {
  return {
    currentMonth: 'April',
    dates: [
      { day: 4, name: 'Sat', active: false },
      { day: 5, name: 'Sun', active: true },
      // 添加更多日期...
    ]
  }
}
```

## 交互功能

### 已实现
- ✅ 日期选择切换
- ✅ 月份导航
- ✅ 按钮悬停效果
- ✅ 事件卡片点击
- ✅ 底部导航切换

### 可扩展
- 🔄 事件详情弹窗
- 🔄 日期范围选择
- 🔄 事件添加/编辑
- 🔄 用户设置面板
- 🔄 通知系统

## 浏览器兼容性

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 响应式断点

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

## 开发建议

1. **图标资源**: 当前使用SVG内联图标，可替换为实际的图标文件
2. **数据接口**: 可集成API来动态加载事件数据
3. **状态管理**: 对于复杂应用，建议使用Vuex或Pinia
4. **测试**: 建议添加单元测试和E2E测试

## 许可证

MIT License - 可自由使用和修改