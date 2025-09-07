# 任务清单 - 5按钮底部导航栏

## 📋 任务依赖关系图
```
Task 0 (Git分支准备)
    ↓
Task 1 (图标资源)
    ↓
Task 2 (新页面)
    ↓
Task 3 (更新配置)
    ↓
Task 4 (代码质量检查)
    ↓
Task 5 (测试验证)
    ↓
Task 6 (提交代码)
    ↓
Task 7 (创建PR)
```

---

## 🌿 Task 0: Git分支准备

### 任务目标
从main分支创建新的特性分支，准备开发环境

### 具体步骤
1. **切换到main分支**: `git checkout main`
2. **拉取最新代码**: `git pull origin main`
3. **创建特性分支**: `git checkout -b feature/bottom-navigation-5-buttons`
4. **推送分支到远程**: `git push -u origin feature/bottom-navigation-5-buttons`

### 分支命名规范
- **格式**: `feature/bottom-navigation-5-buttons`
- **说明**: 遵循 `feature/功能描述` 命名约定

### 验收标准
- [x] 成功创建并切换到特性分支
- [x] 分支基于最新的main分支
- [x] 远程分支创建成功
- [x] 工作目录干净，无未提交变更

### 依赖关系
- **前置依赖**: 无
- **后续任务**: Task 1

---

## 🎯 Task 1: 准备图标资源

### 任务目标
下载并准备5个按钮所需的图标资源

### 具体步骤
1. 访问 https://icon-sets.iconify.design/
2. 选择符合设计文档要求的图标
3. 下载为22px PNG格式
4. 为每个图标创建普通和激活两个状态
5. 放置到 `src/static/icons/` 目录

### 需要的文件
```
src/static/icons/
├── community.png          # 邻里图标
├── community-active.png   # 邻里激活状态
├── announcement.png       # 公告图标
├── announcement-active.png # 公告激活状态
├── tasks.png             # 事项图标
├── tasks-active.png      # 事项激活状态
├── user.png              # 用户图标
└── user-active.png       # 用户激活状态
```

### 验收标准
- [x] 所有图标文件存在于正确目录
- [x] 图标尺寸为22px × 22px
- [x] PNG格式，透明背景
- [x] 命名规范正确

### 依赖关系
- **前置依赖**: Task 0 (Git分支准备)
- **后续任务**: Task 2

---

## 📄 Task 2: 创建新页面

### 任务目标
为新增的导航按钮创建对应页面

### 具体步骤
1. 创建 `src/pages/neighborhood/` 目录
2. 创建 `src/pages/neighborhood/neighborhood.vue` 文件
3. 创建 `src/pages/affairs/` 目录
4. 创建 `src/pages/affairs/affairs.vue` 文件
5. 页面使用标准模板，内容可为空白或占位符

### 页面模板结构
```vue
<template>
  <view class="page-container">
    <text class="title">{{ pageTitle }}</text>
    <text class="placeholder">功能开发中...</text>
  </view>
</template>

<script setup lang="ts">
/**
 * 页面标题配置
 * 根据页面功能设置相应标题
 */
const pageTitle = '页面名称'
</script>

<style scoped>
.page-container {
  padding: 20px;
  text-align: center;
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

.placeholder {
  color: #999;
  font-size: 16px;
}
</style>
```

### 代码规范要求
- **TypeScript**: 严格类型定义，禁止使用 `any`
- **注释**: 关键逻辑必须有注释说明
- **格式化**: 遵循Prettier配置 (单引号、无分号、2空格缩进)
- **命名**: 遵循camelCase变量命名，kebab-case目录命名

### 验收标准
- [x] `src/pages/neighborhood/neighborhood.vue` 创建成功
- [x] `src/pages/affairs/affairs.vue` 创建成功
- [x] 页面可以正常渲染
- [x] 符合Vue 3 + TypeScript规范
- [x] 代码格式符合ESLint + Prettier规范
- [x] 关键代码有适当注释

### 依赖关系
- **前置依赖**: Task 1 (图标资源准备完成)
- **后续任务**: Task 3

---

## ⚙️ Task 3: 更新配置文件

### 任务目标
修改 `src/pages.json` 配置，实现5按钮导航

### 具体步骤
1. **备份配置**: 复制当前 `pages.json` 作为备份
2. **更新pages数组**: 添加新页面配置
   ```json
   {
     "name": "neighborhood",
     "path": "pages/neighborhood/neighborhood",
     "style": { "navigationBarTitleText": "邻里" }
   },
   {
     "name": "affairs",
     "path": "pages/affairs/affairs",
     "style": { "navigationBarTitleText": "事项" }
   }
   ```
3. **更新tabBar配置**: 替换为5按钮配置
4. **移除text字段**: 只保留图标，移除所有 `"text"` 配置
5. **添加配置注释**: 在配置文件中添加说明注释

### 架构合规检查
- ✅ 属于Level 1配置文件修改（需团队评审）
- ✅ 符合特殊情况：tabBar配置，脚本不支持
- ✅ 需要在PR中详细说明修改原因
- ✅ 遵循"在现有配置基础上添加，而非替换"原则

### 关键配置变更
```json
// 变更前 (3按钮)
"list": [
  { "pagePath": "pages/index/index", "text": "首页", ... },
  { "pagePath": "pages/create/create", "text": "创建", ... },
  { "pagePath": "pages/profile/profile", "text": "我", ... }
]

// 变更后 (5按钮)
"list": [
  { "pagePath": "pages/neighborhood/neighborhood", "iconPath": "static/icons/community.png", "selectedIconPath": "static/icons/community-active.png" },
  { "pagePath": "pages/announcement/announcement", "iconPath": "static/icons/announcement.png", "selectedIconPath": "static/icons/announcement-active.png" },
  { "pagePath": "pages/create/create", "iconPath": "static/icons/add.png", "selectedIconPath": "static/icons/add-active.png" },
  { "pagePath": "pages/affairs/affairs", "iconPath": "static/icons/tasks.png", "selectedIconPath": "static/icons/tasks-active.png" },
  { "pagePath": "pages/profile/profile", "iconPath": "static/icons/user.png", "selectedIconPath": "static/icons/user-active.png" }
]
```

### 验收标准
- [x] pages.json文件语法正确
- [x] 新页面已添加到pages数组
- [x] tabBar配置包含5个按钮
- [x] 所有图标路径正确
- [x] 移除了text字段
- [x] JSON格式规范，有适当注释
- [x] 符合架构规范要求

### 依赖关系
- **前置依赖**: Task 1 (图标), Task 2 (页面)
- **后续任务**: Task 4

---

## 🔍 Task 4: 代码质量检查

### 任务目标
确保代码符合项目规范，通过所有质量检查

### 具体步骤
1. **ESLint检查**: 运行 `npm run lint`
2. **TypeScript检查**: 运行 `npm run type-check` (如果有)
3. **格式化检查**: 确保代码符合Prettier规范
4. **架构合规检查**: 确认未违反架构保护原则

### 质量标准
```bash
# 必须通过的检查命令
npm run lint          # ESLint规则检查
npm run lint:fix       # 自动修复可修复的问题
```

### 常见问题修复
- **ESLint错误**: 修复代码规范问题
- **TypeScript错误**: 补充类型定义
- **格式问题**: 运行Prettier格式化
- **未使用变量**: 清理无用代码

### 验收标准
- [x] ESLint检查通过，无错误和警告
- [x] TypeScript类型检查通过
- [x] 代码格式符合Prettier规范
- [x] 未违反架构保护原则
- [x] 无console.log等调试代码

### 依赖关系
- **前置依赖**: Task 1, Task 2, Task 3
- **后续任务**: Task 5

---

## 🧪 Task 5: 功能测试验证

### 任务目标
验证5按钮导航功能正常运行

### 具体步骤
1. **启动开发服务器**: `npm run dev`
2. **视觉检查**:
   - 底部显示5个图标按钮
   - 图标清晰可见，无文字标签
   - 按钮布局均匀
3. **功能测试**:
   - 点击每个按钮，验证页面跳转
   - 检查激活状态图标显示
   - 验证页面标题正确
4. **兼容性测试**:
   - H5端测试
   - 微信小程序端测试 (如需要)

### 测试用例
| 测试项 | 操作 | 期望结果 |
|--------|------|----------|
| 按钮显示 | 启动应用 | 底部显示5个图标按钮 |
| 邻里按钮 | 点击第1个按钮 | 跳转到邻里页面 |
| 公告按钮 | 点击第2个按钮 | 跳转到公告页面 |
| 创建按钮 | 点击第3个按钮 | 跳转到创建页面 |
| 事项按钮 | 点击第4个按钮 | 跳转到事项页面 |
| 我按钮 | 点击第5个按钮 | 跳转到个人页面 |
| 激活状态 | 切换页面 | 当前页面按钮显示激活图标 |

### 验收标准
- [x] 所有测试用例通过
- [x] 无控制台错误或警告
- [x] 符合设计文档要求
- [x] 遵循架构规范
- [x] 在不同设备/浏览器正常显示

### 依赖关系
- **前置依赖**: Task 4 (代码质量检查)
- **后续任务**: Task 6

---

## 📝 Task 6: 提交代码

### 任务目标
按照规范提交所有变更到Git仓库

### 具体步骤
1. **查看变更**: `git status` 确认所有文件
2. **添加变更**: `git add .` 添加所有新文件和修改
3. **提交代码**: 使用规范的提交信息格式
   ```bash
   git commit -m "feat: 实现5按钮底部导航栏功能

   - 新增邻里、事项页面
   - 更新tabBar配置为5按钮布局
   - 添加对应图标资源
   - 移除导航文字标签，仅显示图标

   🤖 Generated with [Claude Code](https://claude.ai/code)

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```
4. **推送到远程**: `git push origin feature/bottom-navigation-5-buttons`

### 提交信息规范
- **格式**: `feat: 功能描述`
- **类型**:
  - `feat`: 新功能
  - `fix`: 修复bug
  - `docs`: 文档修改
  - `style`: 格式修改
  - `refactor`: 重构
- **必须包含**: Claude Code生成标记和Co-Authored-By信息

### 验收标准
- [x] 提交信息格式规范
- [x] 包含所有相关文件变更
- [x] 推送到正确的远程分支
- [x] 提交历史清晰可读
- [x] 包含必要的Co-Authored-By信息

### 依赖关系
- **前置依赖**: Task 5 (功能测试通过)
- **后续任务**: Task 7

---

## 🔄 Task 7: 创建Pull Request

### 任务目标
创建规范的Pull Request，准备代码审查

### 具体步骤
1. **访问GitHub仓库**: 打开项目的GitHub页面
2. **创建PR**: 点击"Compare & pull request"
3. **填写PR信息**:
   ```markdown
   ## 📋 功能概述

   实现5按钮底部导航栏功能，从现有3按钮扩展为5按钮布局。

   ## 🎯 主要变更

   - ✅ 新增邻里页面 (`pages/neighborhood/neighborhood.vue`)
   - ✅ 新增事项页面 (`pages/affairs/affairs.vue`)
   - ✅ 更新 `pages.json` tabBar配置为5按钮
   - ✅ 添加相应图标资源 (来源: iconify.design)
   - ✅ 移除导航栏文字，仅显示图标

   ## 🔧 技术说明

   ### 架构合规性
   - ✅ 遵循 `docs/03-architecture-standards.md` 规范
   - ✅ 属于Level 1配置文件修改，特殊情况：tabBar配置
   - ✅ 未修改底座核心文件
   - ✅ 仅扩展配置和新增页面

   ### 代码质量
   - ✅ ESLint检查通过
   - ✅ TypeScript类型安全
   - ✅ 符合Prettier格式规范
   - ✅ 适当的代码注释

   ## 🧪 测试情况

   - [x] 5个导航按钮正常显示
   - [x] 所有页面跳转功能正常
   - [x] 图标激活状态正常
   - [x] 无控制台错误

   ## 📱 预览截图

   _请添加功能截图_

   🤖 Generated with [Claude Code](https://claude.ai/code)
   ```
4. **设置审查者**: 添加团队成员作为审查者
5. **添加标签**: 如 `feature`, `ui`, `navigation`

### PR规范要求
- **标题**: 简洁描述功能
- **描述**: 详细说明变更内容和架构合规性
- **截图**: 提供功能预览图
- **测试**: 说明测试情况
- **合规**: 特别说明Level 1文件修改原因

### 验收标准
- [x] PR创建成功
- [x] 信息描述完整清晰
- [x] 包含架构合规性说明
- [x] 添加了适当的审查者
- [x] 包含功能截图
- [x] 通过所有自动化检查

### 依赖关系
- **前置依赖**: Task 6 (代码提交完成)
- **后续任务**: 等待代码审查和合并

---

## 📊 任务总结

### 工作量评估
- **Task 0**: 0.2小时 (Git分支准备)
- **Task 1**: 0.5小时 (图标下载和处理)
- **Task 2**: 0.5小时 (创建2个简单页面)
- **Task 3**: 0.5小时 (配置文件修改)
- **Task 4**: 0.3小时 (代码质量检查)
- **Task 5**: 0.5小时 (功能测试验证)
- **Task 6**: 0.2小时 (提交代码)
- **Task 7**: 0.3小时 (创建PR)
- **总计**: 3小时

### 风险评估
- **低风险**: Task 0, Task 1, Task 2, Task 4, Task 6, Task 7 (标准流程)
- **中风险**: Task 3 (修改Level 1配置文件), Task 5 (功能测试)
- **风险缓解**:
  - 备份配置文件
  - 增量测试每个任务
  - 严格执行代码质量检查
  - 详细的PR说明

### 注意事项
- **架构合规**: Task 3涉及Level 1配置文件，需在PR中特殊说明
- **代码规范**: 严格遵循ESLint + Prettier + TypeScript规范
- **提交规范**: 必须包含Claude Code标记和Co-Authored-By信息
- **测试重点**: 优先检查图标路径和页面路径正确性
- **增量开发**: 建议逐个任务完成并测试，避免批量操作

### 🔍 质量保证检查点
1. **Task 2完成后**: 确认页面代码符合Vue 3 + TS规范
2. **Task 3完成后**: 验证pages.json语法正确性
3. **Task 4完成后**: 必须通过所有ESLint检查
4. **Task 5完成后**: 所有导航功能正常
5. **Task 6前**: 确认无调试代码和临时文件
6. **Task 7前**: 准备功能截图和详细说明