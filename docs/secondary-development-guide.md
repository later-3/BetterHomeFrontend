# uni-vue3-vite-ts-pinia 二次开发指南

## 主题：如何添加新页面

本文档详细说明了在此项目框架下如何添加一个新的页面。为了保证项目结构的统一性和可维护性，请严格遵循以下步骤操作。

### 总体原则与注意事项

- **分支管理**: 在进行任何新功能开发（包括添加页面）之前，请务必基于最新的主干分支（如 `main` 或 `develop`）创建一个新的功能分支。例如：`git checkout -b feature/add-user-profile-page`。这能确保你的开发工作与主干隔离，便于代码审查和合并。
- **目录约定**: 严格遵守项目中既有的目录结构。页面文件存放在 `src/pages`，页面所需的静态资源（如非组件化的图标、背景图等）统一存放在 `src/static` 目录下。

---

### 操作步骤

添加新页面主要有两种方法：**手动创建**和**脚本自动创建**。推荐使用脚本自动创建，以避免手动操作可能带来的疏漏。

#### 方法一：手动创建（了解原理）

此方法能帮助你理解页面创建的完整流程。

##### **步骤 1: 创建页面文件 (.vue)**

1.  **定位目录**: 进入 `src/pages/` 目录。
2.  **创建文件夹**: 创建一个以页面名命名的文件夹（推荐使用小写+中划线命名法，如 `my-new-page`）。例如，我们要创建一个“我的设置”页面，可以命名为 `user-settings`。
    - **文件路径**: `src/pages/user-settings/`
3.  **创建文件**: 在刚刚创建的文件夹内，创建一个与文件夹同名的 `.vue` 文件。
    - **文件路径**: `src/pages/user-settings/user-settings.vue`

**此步骤的注意事项:**

- **“文件夹包裹文件”的结构**: 强烈建议每个页面都由一个文件夹包裹。这样做的好处是，未来如果此页面有自己独有的组件或逻辑模块，可以就近存放在此文件夹内，便于维护。
- **页面内容**: `.vue` 文件必须包含 `<template>` 部分，`<script>` 和 `<style>` 可根据需要添加。一个最基础的页面结构如下：

  ```vue
  <!-- src/pages/user-settings/user-settings.vue -->
  <template>
    <view class="user-settings-page">
      <text>这是我的设置页面</text>
    </view>
  </template>

  <script setup lang="ts">
  // 页面逻辑
  </script>

  <style lang="scss" scoped>
  // 页面样式
  </style>
  ```

##### **步骤 2: 注册页面路由**

创建完文件后，你需要告诉 `uni-app` 框架这个页面的存在，否则它无法被访问。

1.  **定位文件**: 打开项目根目录下的 `src/pages.json` 文件。
2.  **添加配置**: 在 `pages` 数组中，添加一个 JSON 对象来描述你新创建的页面。

    ```json
    {
      "pages": [
        {
          "name": "index",
          "path": "pages/index/index",
          "style": {
            "navigationBarTitleText": "首页"
          }
        },
        {
          "name": "profile",
          "path": "pages/profile/profile",
          "style": {
            "navigationBarTitleText": "个人"
          }
        },
        // 在这里添加你的新页面配置
        {
          "path": "pages/user-settings/user-settings",
          "style": {
            "navigationBarTitleText": "我的设置"
          }
        }
      ]
      // ... 其他配置
    }
    ```

**此步骤的注意事项:**

- **`path` 字段**:
  - 路径从 `src` 的下一级开始，即 `pages/` 开头。
  - 路径**不包含** `.vue` 文件后缀。
  - 请仔细检查路径，这是最容易出错的地方。
- **`style` 字段**:
  - `navigationBarTitleText` 用于设置页面的导航栏标题。
  - 你可以在这里配置页面的其他样式，如导航栏颜色等，具体请参考 `uni-app`官方文档。
- **页面层级**: 如果你添加的是一个功能模块下的子页面，并且希望进行分包优化，应将其配置在 `subPackages` 字段中，而不是主 `pages` 字段。对于大多数新页面，添加到主 `pages` 数组即可。

---

#### 方法二：脚本自动创建（官方推荐）

本项目在 `package.json` 中提供了一个便捷脚本，可以自动完成以上两个手动步骤。

##### **步骤 1: 执行命令**

1.  **打开终端**: 在项目的根目录下打开你的终端。
2.  **运行脚本**: 执行以下命令：

    ```bash
    npm run add
    ```

3.  **根据提示操作**: 脚本 (`auto/addPage.ts`) 启动后，会提示你输入页面名称等信息。根据提示完成操作即可。

**此步骤的注意事项:**

- **自动化优势**: 强烈推荐使用此方法，因为它能确保文件和配置的正确性，避免因手动操作失误（如路径写错、JSON 格式错误）导致的问题。
- **工作目录**: 必须在项目的根目录下执行此命令。
