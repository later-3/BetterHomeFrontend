# Blog Card Component

基于Figma设计实现的Vue博客卡片组件。

## 组件特性

- 📱 响应式设计，支持移动端适配
- 🎨 完全还原Figma设计稿
- ⚡ Vue 3 Composition API
- 🔧 高度可定制的props
- 📊 互动统计显示（点赞、评论、浏览）

## 文件结构

```
ui/complaint/detail/basic/
├── BlogCard.vue          # Vue组件文件
├── preview.html          # 预览页面
├── README.md            # 说明文档
└── assets/              # 图标资源
    ├── 1.svg           # 点赞图标
    ├── 2.svg           # 评论图标
    └── 3.svg           # 浏览图标
```

## 组件Props

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| authorName | String | 'Robert Fox' | 作者姓名 |
| authorRole | String | 'Web Development' | 作者角色 |
| authorAvatar | String | 'assets/1.svg' | 作者头像 |
| title | String | 'Minim dolor in amet nulla laboris' | 文章标题 |
| publishDate | String | 'September 23, 2021' | 发布日期 |
| excerpt | String | 'Minim dolor...' | 文章摘要 |
| tags | Array | ['React', 'Javascript', 'Angular'] | 标签列表 |
| likes | String | '20k' | 点赞数 |
| comments | String | '34' | 评论数 |
| views | String | '567' | 浏览数 |

## 使用方法

### 1. 在Vue项目中使用

```vue
<template>
  <BlogCard
    author-name="Jane Smith"
    author-role="UI/UX Designer"
    title="The Future of Web Design"
    publish-date="December 9, 2024"
    excerpt="Exploring the latest trends..."
    :tags="['Design', 'UI/UX', 'Trends']"
    likes="15k"
    comments="89"
    views="1.2k"
  />
</template>

<script>
import BlogCard from './BlogCard.vue'

export default {
  components: {
    BlogCard
  }
}
</script>
```

### 2. 预览页面

启动本地服务器预览组件：

```bash
cd ui/complaint/detail/basic
python3 -m http.server 8080
```

然后在浏览器中访问：`http://localhost:8080/preview.html`

## 设计规格

- **尺寸**: 360px × 533px
- **圆角**: 20px
- **字体**: Roboto
- **主色调**: #EB3349 (标签背景)
- **文字颜色**: 
  - 主标题: #000000
  - 副标题: #78858F
  - 日期: #838383

## 响应式断点

- **移动端**: 320px - 768px
- **平板**: 768px - 1024px  
- **桌面端**: 1024px+

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 开发说明

组件严格按照Figma设计稿实现，保持像素级精确度。所有交互元素都支持自定义，可以根据实际需求调整样式和功能。