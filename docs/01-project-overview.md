# 项目概览与快速开始

> 基于 `uni-vue3-vite-ts-pinia` 底座的跨平台应用开发入门指南

## 📋 项目介绍

### 项目概述

BetterHome 是基于 `ttk-cli/uni-vue3-vite-ts-pinia` 脚手架构建的跨平台应用，支持H5、微信小程序、支付宝小程序等多端发布。项目采用现代化的前端技术栈，提供完整的工程化解决方案。

### 核心技术栈

- **跨平台框架**: uni-app (Vue 3)
- **开发语言**: TypeScript 5.x
- **状态管理**: Pinia 2.x + 持久化插件
- **构建工具**: Vite 5.x
- **样式方案**: SCSS + UnoCSS
- **代码规范**: ESLint + Prettier + Stylelint

### 项目特色

- 🚀 **极速开发**: Vite热重载 + 组件自动导入
- 🔧 **工程化完备**: 代码规范、提交规范、自动化脚本
- 🌐 **跨平台一致**: 一套代码多端运行
- 💾 **数据持久化**: 跨端状态自动同步
- 📱 **响应式设计**: rpx单位自适应屏幕

---

## 🚀 快速开始

### 环境要求

```bash
# Node.js版本要求
node >= 16.x
npm >= 8.x

# 推荐使用nvm管理Node版本
nvm use 16
```

### 项目初始化

```bash
# 1. 克隆项目
git clone [项目地址]
cd betterhome-frontend

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev:h5          # H5版本
npm run dev:mp-weixin   # 微信小程序版本

# 4. 验证环境
npm run lint            # 代码检查
npm run type-check      # 类型检查
```

### 开发脚本说明

| 命令 | 说明 |
|------|------|
| `npm run dev:h5` | 启动H5开发服务器 |
| `npm run dev:mp-weixin` | 启动微信小程序开发 |
| `npm run dev:mp-alipay` | 启动支付宝小程序开发 |
| `npm run build:h5` | 构建H5生产版本 |
| `npm run build:mp-weixin` | 构建微信小程序 |
| `npm run lint` | 代码规范检查 |
| `npm run lint:fix` | 自动修复代码规范问题 |
| `npm run type-check` | TypeScript类型检查 |
| `npm run add` | 自动添加新页面 |

---

## 🏗️ 项目结构概览

```
uni-vue3-vite-ts-pinia/
├── src/
│   ├── @types/          # TypeScript类型定义
│   ├── api/             # API接口封装
│   ├── components/      # 可复用组件
│   ├── config/          # 项目配置
│   ├── hooks/           # Composition API hooks
│   ├── pages/           # 页面文件
│   ├── static/          # 静态资源
│   ├── store/           # 状态管理
│   └── utils/           # 工具函数
├── pages.json           # 页面路由配置
├── main.ts              # 应用入口
├── vite.config.ts       # Vite配置
└── package.json         # 项目依赖
```

### 核心目录说明

- **`src/@types/`**: 全局TypeScript类型定义，支持全局使用
- **`src/api/`**: 后端接口封装，统一管理API调用
- **`src/components/`**: 可复用组件，支持自动导入
- **`src/pages/`**: 页面文件，每个页面独立文件夹
- **`src/store/`**: Pinia状态管理，支持数据持久化
- **`src/utils/`**: 工具函数，包含底座核心工具

---

## 🎯 开发流程

### 1. 创建功能分支

```bash
# 基于主分支创建功能分支
git checkout -b feature/your-feature-name
```

### 2. 添加新页面

```bash
# 使用自动化脚本添加页面
npm run add
# 根据提示输入页面信息
```

### 3. 开发与调试

```bash
# 启动开发服务器
npm run dev:h5

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

### 4. 提交代码

```bash
# 添加文件
git add .

# 提交（会自动触发代码检查）
git commit -m "feat: 添加新功能"

# 推送分支
git push origin feature/your-feature-name
```

---

## 📱 多端支持

### H5端
- 支持现代浏览器
- 响应式设计
- PWA支持

### 微信小程序
- 微信开发者工具调试
- 小程序特有API支持
- 分包加载优化

### 支付宝小程序
- 支付宝开发者工具
- 平台差异自动处理

---

## 🔗 相关链接

- [uni-app官方文档](https://uniapp.dcloud.net.cn/)
- [Vue 3官方文档](https://cn.vuejs.org/)
- [Vite官方文档](https://cn.vitejs.dev/)
- [Pinia官方文档](https://pinia.vuejs.org/zh/)
- [TypeScript官方文档](https://www.typescriptlang.org/)

---

## 📞 获取帮助

- 查看 [常见问题解答](./13-faq-troubleshooting.md)
- 参考 [开发指南](./05-page-development.md)
- 联系团队技术负责人

---

*下一步: [开发环境配置](./02-development-setup.md)*