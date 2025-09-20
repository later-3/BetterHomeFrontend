# UniApp 静态资源引用规范指导

## 概述

本文档基于 UniApp 官方文档，整理了项目中静态资源的标准引用规范和最佳实践。

## 目录结构

### static 目录的作用
- **用途**：存储本地静态资源（图片、视频、字体、文件等）
- **位置**：项目根目录下的 `static` 文件夹
- **特点**：目录中的资源会被完整打包到最终编译产物中，即使代码中未直接引用

### 平台特定资源
支持创建平台特定的子目录：
```
static/
├── web/           # Web 平台专用资源
├── app/           # App 平台专用资源
├── mp-weixin/     # 微信小程序专用资源
└── common/        # 通用资源
```

## 资源引用规范

### 1. 在 Vue 模板中引用图片

```vue
<template>
  <!-- 推荐：使用绝对路径 -->
  <image src="/static/images/logo.png" />

  <!-- 动态绑定 -->
  <image :src="'/static/images/' + imageName + '.png'" />
</template>
```

### 2. 在 CSS 中引用资源

```css
/* 推荐：使用 ~@ 前缀的绝对路径 */
.logo {
  background-image: url('~@/static/images/background.png');
}

/* 字体引用 */
@font-face {
  font-family: 'CustomFont';
  src: url('~@/static/fonts/custom.ttf');
}
```

### 3. 在 JavaScript 中引用资源

```javascript
// 推荐方式
const imagePath = '/static/images/icon.png';

// 动态引用
const getImagePath = (name) => {
  return `/static/images/${name}.png`;
};
```

### 4. 在页面配置中引用

```json
{
  "pages": [
    {
      "path": "pages/home/index",
      "style": {
        "navigationBarBackgroundImage": "/static/images/nav-bg.png"
      }
    }
  ],
  "tabBar": {
    "list": [
      {
        "iconPath": "static/icons/home.png",
        "selectedIconPath": "static/icons/home-active.png"
      }
    ]
  }
}
```

## 最佳实践

### 1. 文件大小优化
- **小文件**（< 40KB）：会自动转换为 base64 格式，减少网络请求
- **大文件**（≥ 40KB）：建议放在服务器上，使用网络路径引用

### 2. 路径规范
- **绝对路径**：推荐使用 `~@/static/` 或 `/static/` 开头的绝对路径
- **避免相对路径**：特别是在小程序平台，相对路径可能导致问题

### 3. 平台兼容性
- **小程序平台**：CSS 中不支持本地文件引用，需使用 base64 或网络路径
- **网络资源**：必须使用 HTTPS 协议

### 4. 目录管理
```
static/
├── images/        # 图片资源
│   ├── icons/     # 图标
│   ├── banners/   # 轮播图
│   └── avatars/   # 头像
├── fonts/         # 字体文件
├── videos/        # 视频文件
└── files/         # 其他文件
```

### 5. 性能考虑
- 只存储必要的静态资源
- 定期清理未使用的文件
- 避免将 CSS、Less/SCSS 文件放在 static 目录

## 常见问题与解决方案

### 1. 图片显示不出来
- 检查路径是否正确
- 确认文件是否在 static 目录中
- 使用绝对路径而非相对路径

### 2. 小程序中图片不显示
- 检查是否使用了本地路径（小程序不支持）
- 考虑使用 base64 格式或网络路径

### 3. 应用启动缓慢
- 检查 static 目录大小
- 移除不必要的大文件
- 考虑使用云存储

## 示例代码

### 完整的图片引用示例

```vue
<template>
  <view class="container">
    <!-- 静态图片 -->
    <image src="/static/images/logo.png" class="logo" />

    <!-- 动态图片 -->
    <image :src="userAvatar" class="avatar" />

    <!-- 背景图片通过 CSS -->
    <view class="banner"></view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      userAvatar: '/static/images/default-avatar.png'
    };
  }
};
</script>

<style>
.logo {
  width: 100px;
  height: 100px;
}

.banner {
  width: 100%;
  height: 200px;
  background-image: url('~@/static/images/banner.jpg');
  background-size: cover;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
}
</style>
```

## 总结

正确使用 static 目录和遵循资源引用规范，可以确保：
1. 跨平台兼容性
2. 良好的性能表现
3. 便于维护和管理
4. 避免常见的路径问题

建议在开发过程中始终遵循上述规范，确保项目的稳定性和可维护性。