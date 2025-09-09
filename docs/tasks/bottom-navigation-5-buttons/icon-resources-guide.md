# 🎨 图标资源获取指南

## 📋 优秀的免费图标网站

### 1. 🌟 **Iconify** (推荐首选)
- **网址**: https://icon-sets.iconify.design/
- **优势**: 
  - 超过15万个免费图标
  - 支持SVG/PNG下载
  - 可自定义颜色和大小
  - 统一的设计风格
- **适合图标**:
  - 邻里: `mdi:account-group`, `mdi:home-group`, `mdi:community`
  - 公告: `mdi:bullhorn`, `mdi:announcement`, `mdi:megaphone`
  - 创建: `mdi:plus-circle`, `mdi:plus-box`, `mdi:add`
  - 事项: `mdi:clipboard-list`, `mdi:format-list-checks`, `mdi:task`
  - 我的: `mdi:account`, `mdi:account-circle`, `mdi:person`

### 2. 🎯 **Tabler Icons**
- **网址**: https://tabler-icons.io/
- **优势**: 
  - 4000+免费SVG图标
  - 一致的设计语言
  - 22x22px标准尺寸
  - MIT许可证
- **适合图标**:
  - 邻里: `users`, `home-2`, `building-community`
  - 公告: `speakerphone`, `bell`, `news`
  - 创建: `plus`, `circle-plus`, `square-plus`
  - 事项: `checklist`, `clipboard-list`, `tasks`
  - 我的: `user`, `user-circle`, `profile`

### 3. 🚀 **Heroicons**
- **网址**: https://heroicons.com/
- **优势**: 
  - Tailwind CSS团队制作
  - 现代简洁设计
  - 两种风格：outline和solid
  - 完全免费
- **适合图标**:
  - 邻里: `users`, `home`, `building-office`
  - 公告: `megaphone`, `bell`, `speaker-wave`
  - 创建: `plus`, `plus-circle`, `plus-small`
  - 事项: `clipboard-document-list`, `list-bullet`, `check-circle`
  - 我的: `user`, `user-circle`, `identification`

### 4. 🎨 **Feather Icons**
- **网址**: https://feathericons.com/
- **优势**: 
  - 极简线条风格
  - 287个精选图标
  - 24x24px标准
  - 开源MIT许可
- **适合图标**:
  - 邻里: `users`, `home`, `user-plus`
  - 公告: `bell`, `megaphone`, `alert-circle`
  - 创建: `plus`, `plus-circle`, `plus-square`
  - 事项: `list`, `check-square`, `clipboard`
  - 我的: `user`, `settings`, `person`

### 5. 🔥 **Lucide**
- **网址**: https://lucide.dev/
- **优势**: 
  - Feather Icons的继承者
  - 1000+图标
  - 现代设计
  - 活跃维护
- **适合图标**:
  - 邻里: `users`, `home`, `building`
  - 公告: `megaphone`, `bell`, `mail`
  - 创建: `plus`, `plus-circle`, `square-plus`
  - 事项: `list-todo`, `clipboard-list`, `check-square`
  - 我的: `user`, `user-circle`, `settings`

## 🛠️ 图标获取和使用流程

### 方法1: 直接下载PNG (推荐)

#### 步骤1: 访问Iconify
```bash
# 打开浏览器访问
https://icon-sets.iconify.design/
```

#### 步骤2: 搜索图标
```
搜索关键词:
- "users" 或 "community" → 邻里图标
- "megaphone" 或 "announcement" → 公告图标
- "plus" 或 "add" → 创建图标
- "list" 或 "tasks" → 事项图标
- "user" 或 "profile" → 我的图标
```

#### 步骤3: 下载配置
```
格式: PNG
尺寸: 22x22px (符合pages.json配置)
颜色: 
  - 普通状态: #666666
  - 激活状态: #1AA86C
```

#### 步骤4: 文件命名
```
邻里: neighbor.png, neighbor-active.png
公告: notice.png, notice-active.png
创建: create.png, create-active.png
事项: task.png, task-active.png
我的: profile.png, profile-active.png
```

### 方法2: 使用SVG图标

#### 优势
- 矢量图形，无损缩放
- 文件更小
- 可通过CSS控制颜色

#### 获取方式
```bash
# 1. 从Iconify复制SVG代码
# 2. 保存为.svg文件
# 3. 在pages.json中引用
```

### 方法3: 使用图标字体

#### 安装Iconify
```bash
npm install @iconify/vue
```

#### 在组件中使用
```vue
<template>
  <Icon icon="mdi:account-group" />
</template>
```

## 🎯 推荐的具体图标组合

### 组合1: Material Design Icons (MDI)
```
邻里: mdi:account-group
公告: mdi:bullhorn
创建: mdi:plus-circle
事项: mdi:clipboard-list
我的: mdi:account-circle
```

### 组合2: Tabler Icons
```
邻里: tabler:users
公告: tabler:speakerphone
创建: tabler:plus
事项: tabler:checklist
我的: tabler:user-circle
```

### 组合3: Heroicons
```
邻里: heroicons:users
公告: heroicons:megaphone
创建: heroicons:plus-circle
事项: heroicons:clipboard-document-list
我的: heroicons:user-circle
```

## 🚀 快速实现方案

### 使用现成的图标包
```bash
# 安装Tabler Icons Vue组件
npm install @tabler/icons-vue

# 在项目中使用
import { IconUsers, IconMegaphone, IconPlus, IconClipboardList, IconUser } from '@tabler/icons-vue'
```

### 直接下载方案
1. 访问 https://icon-sets.iconify.design/
2. 搜索 "mdi:account-group" 
3. 点击下载PNG，设置22x22px
4. 分别下载灰色(#666666)和绿色(#1AA86C)版本
5. 重命名并放入 `src/static/icons/` 目录
6. 更新 `pages.json` 中的路径

## 📝 pages.json 配置示例

```json
{
  "tabBar": {
    "list": [
      {
        "pagePath": "pages/neighbor/neighbor",
        "iconPath": "static/icons/neighbor.png",
        "selectedIconPath": "static/icons/neighbor-active.png"
      },
      {
        "pagePath": "pages/notice/notice",
        "iconPath": "static/icons/notice.png",
        "selectedIconPath": "static/icons/notice-active.png"
      },
      {
        "pagePath": "pages/create/create",
        "iconPath": "static/icons/create.png",
        "selectedIconPath": "static/icons/create-active.png"
      },
      {
        "pagePath": "pages/task/task",
        "iconPath": "static/icons/task.png",
        "selectedIconPath": "static/icons/task-active.png"
      },
      {
        "pagePath": "pages/profile/profile",
        "iconPath": "static/icons/profile.png",
        "selectedIconPath": "static/icons/profile-active.png"
      }
    ]
  }
}
```

## 🎨 图标设计原则

### 1. 一致性
- 使用同一图标库的图标
- 保持相同的设计风格
- 统一的线条粗细

### 2. 识别性
- 图标含义清晰明确
- 符合用户认知习惯
- 避免过于抽象的设计

### 3. 适配性
- 22x22px下清晰可见
- 灰度和彩色版本都要好看
- 在不同背景下都能识别

### 4. 品牌一致性
- 符合应用整体设计语言
- 与品牌色彩搭配和谐
- 体现产品特色

## 🔧 技术实现建议

### 优先级排序
1. **PNG图标** - 最简单，兼容性最好
2. **SVG图标** - 质量更高，文件更小
3. **图标字体** - 最灵活，但需要额外配置
4. **Vue组件** - 最现代，但增加依赖

### 性能考虑
- PNG文件控制在2KB以内
- SVG优化压缩
- 考虑图标预加载
- 使用适当的缓存策略

---

**推荐方案**: 使用Iconify网站下载MDI图标的PNG版本，简单快速且效果好！