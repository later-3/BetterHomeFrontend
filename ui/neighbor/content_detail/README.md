# 邻里内容详情组件

基于Figma设计实现的邻里内容详情页面，展示用户发布的内容、互动数据和评论功能。

## 📱 功能特性

### 🎨 UI组件
- **状态栏**: 显示时间和系统状态图标
- **导航栏**: 返回按钮和操作按钮（分享、收藏、更多）
- **用户信息**: 发布者头像、用户名和发布时间
- **主要内容**: 大图展示和内容描述
- **互动统计**: 浏览量、评论数、点赞数
- **评论区**: 评论列表和评论输入框
- **底部指示器**: iOS风格的Home指示器

### ✨ 交互功能
1. **导航操作**: 返回、分享、收藏、更多选项
2. **评论功能**: 查看评论列表、添加新评论
3. **实时更新**: 评论数量实时更新
4. **响应式设计**: 适配移动端界面

## 📁 文件结构

```
ui/neighbor/content_detail/
├── NeighborContentDetail.vue    # Vue组件文件
├── preview.html                 # 预览页面
└── README.md                   # 说明文档
```

## 🚀 使用方法

### 1. 直接预览
打开 `preview.html` 文件在浏览器中查看效果

### 2. Vue项目集成
```vue
<template>
  <NeighborContentDetail />
</template>

<script>
import NeighborContentDetail from './ui/neighbor/content_detail/NeighborContentDetail.vue'

export default {
  components: {
    NeighborContentDetail
  }
}
</script>
```

### 3. 本地服务器预览
```bash
# 在项目根目录运行
cd ui/neighbor/content_detail
python3 -m http.server 8080
# 访问 http://localhost:8080/preview.html
```

## 🎯 数据结构

### 内容数据格式
```javascript
{
  author: 'Thanh Pham',           // 发布者姓名
  timeAgo: '1 hour ago',          // 发布时间
  title: 'Street portrait',       // 内容标题
  description: 'Lorem ipsum...',   // 内容描述
  imageUrl: 'path/to/image.png',  // 主图路径
  views: 125,                     // 浏览量
  comments: 20,                   // 评论数
  likes: 125                      // 点赞数
}
```

### 评论数据格式
```javascript
{
  id: 1,                          // 评论ID
  author: 'Bruno Pham',           // 评论者姓名
  text: 'Great shot! I love it',  // 评论内容
  timeAgo: '2 mins ago',          // 评论时间
  avatar: 'path/to/avatar.svg'    // 头像路径
}
```

## 🎨 设计规范

### 颜色系统
- **主文本**: #212121 (深灰色)
- **次要文本**: #828282 (中灰色)
- **辅助文本**: #BDBDBD (浅灰色)
- **背景色**: #FFFFFF (白色)
- **卡片背景**: #F6F7F9 (浅灰背景)

### 字体规范
- **主标题**: 20px, 700 weight
- **用户名**: 16px, 400/700 weight
- **正文**: 14px, 400 weight
- **辅助信息**: 12px, 400 weight

### 间距规范
- **页面边距**: 14-20px
- **组件间距**: 10-16px
- **内容内边距**: 16px
- **头像尺寸**: 30px

## 🔧 自定义配置

### 修改内容数据
在Vue组件的 `data()` 方法中修改 `content` 对象：

```javascript
content: {
  author: '你的用户名',
  timeAgo: '刚刚',
  title: '自定义标题',
  description: '自定义描述内容...',
  imageUrl: '你的图片路径',
  views: 100,
  comments: 5,
  likes: 50
}
```

### 添加自定义样式
在组件的 `<style scoped>` 部分添加或修改CSS：

```css
.custom-style {
  /* 你的自定义样式 */
}
```

## 📱 响应式支持

- **移动端优先**: 基于375px宽度设计
- **自适应布局**: 支持不同屏幕尺寸
- **触摸友好**: 按钮和交互区域适合触摸操作

## 🎭 动画效果

- **评论添加**: 滑入动画效果
- **按钮悬停**: 透明度过渡效果
- **页面过渡**: 平滑的视觉反馈

## 🔗 资源依赖

- **Vue 3**: 前端框架
- **图标资源**: CodeBubbyAssets/114_2031/ 目录下的SVG和PNG文件
- **字体**: Circular Std, SF Pro Text (系统回退字体)

## 📝 开发说明

### 组件特点
- 使用Vue 3 Composition API
- 完全响应式数据绑定
- 模块化CSS样式
- 语义化HTML结构
- 无障碍访问支持

### 扩展建议
1. 添加图片懒加载功能
2. 实现评论的点赞/回复功能
3. 添加内容分享到社交媒体
4. 实现图片放大查看功能
5. 添加用户资料页面跳转

## 🐛 问题排查

### 常见问题
1. **图片不显示**: 检查资源路径是否正确
2. **样式异常**: 确认CSS文件加载正常
3. **交互无响应**: 检查Vue.js是否正确加载
4. **字体显示**: 确认字体文件或CDN链接可用

### 调试建议
- 使用浏览器开发者工具检查控制台错误
- 验证网络请求是否成功
- 检查Vue组件的数据绑定状态