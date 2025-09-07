# 设计文档 - 5按钮底部导航栏

## 🎨 视觉设计

### 布局设计
```
┌─────────────────────────────────────────┐
│  [邻里]  [公告]  [➕]  [事项]  [我]     │
└─────────────────────────────────────────┘
```

### 图标规范
- **尺寸**: 22px × 22px (保持现有配置)
- **格式**: PNG
- **状态**: 普通状态 + 激活状态 (两套图标)
- **命名**: `[功能名].png` + `[功能名]-active.png`

## 🎯 图标选择方案

### 推荐图标 (来源: iconify.design)

#### 1. 邻里 (Neighborhood/Community)
- **推荐**: `mdi:account-group` 或 `mdi:home-group`
- **备选**: `carbon:community` 或 `mdi:city`
- **文件**: `community.png` / `community-active.png`

#### 2. 公告 (Announcement)
- **推荐**: `mdi:bullhorn` 或 `mdi:announcement`
- **备选**: `carbon:announcement` 或 `mdi:information`
- **文件**: `announcement.png` / `announcement-active.png`

#### 3. 创建 (保持现有)
- **现有**: 保持当前的加号图标
- **文件**: `add.png` / `add-active.png` (已存在)

#### 4. 事项 (Affairs/Tasks)
- **推荐**: `mdi:clipboard-list` 或 `mdi:format-list-checks`
- **备选**: `carbon:task` 或 `mdi:checkbox-multiple-marked`
- **文件**: `tasks.png` / `tasks-active.png`

#### 5. 我 (Profile/User)
- **推荐**: `mdi:account` (与现有风格统一)
- **备选**: `carbon:user` 或 `mdi:person`
- **文件**: `user.png` / `user-active.png`

## 📱 交互设计

### 导航行为
- 点击按钮切换到对应页面
- 当前页面按钮显示激活状态图标
- 非当前页面显示普通状态图标

### 页面对应关系
```
按钮     -> 页面路径                    -> 页面标题
邻里     -> pages/neighborhood/         -> "邻里"
公告     -> pages/announcement/         -> "公告"
➕      -> pages/create/               -> "创建" (现有)
事项     -> pages/affairs/             -> "事项"
我       -> pages/profile/             -> "我" (现有)
```

## 🎪 样式配置

### tabBar配置结构
```json
{
  "tabBar": {
    "color": "#666666",
    "selectedColor": "#1AA86C",
    "borderStyle": "white",
    "backgroundColor": "#ffffff",
    "height": "50px",
    "fontSize": "10px",
    "iconWidth": "22px",
    "spacing": "3px",
    "list": [
      {
        "pagePath": "pages/neighborhood/neighborhood",
        "iconPath": "static/icons/community.png",
        "selectedIconPath": "static/icons/community-active.png"
      },
      {
        "pagePath": "pages/announcement/announcement",
        "iconPath": "static/icons/announcement.png",
        "selectedIconPath": "static/icons/announcement-active.png"
      },
      {
        "pagePath": "pages/create/create",
        "iconPath": "static/icons/add.png",
        "selectedIconPath": "static/icons/add-active.png"
      },
      {
        "pagePath": "pages/affairs/affairs",
        "iconPath": "static/icons/tasks.png",
        "selectedIconPath": "static/icons/tasks-active.png"
      },
      {
        "pagePath": "pages/profile/profile",
        "iconPath": "static/icons/user.png",
        "selectedIconPath": "static/icons/user-active.png"
      }
    ]
  }
}
```

## 🔧 技术约束

### 架构合规性
- ✅ 仅修改配置文件，不触碰底座核心
- ✅ 新增页面和资源文件
- ✅ 遵循现有命名规范
- ⚠️ pages.json属于Level 1配置，需要评审

### 兼容性考虑
- 保持现有tabBar样式配置不变
- 新增页面采用标准Vue 3 + TypeScript模板
- 图标资源需要考虑不同设备的显示效果