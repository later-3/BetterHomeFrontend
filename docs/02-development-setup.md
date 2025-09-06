# 开发环境配置

> 完整的开发环境搭建和工具配置指南

## 🛠️ 基础环境

### Node.js 环境

```bash
# 检查Node.js版本
node --version  # 需要 >= 16.x
npm --version   # 需要 >= 8.x

# 推荐使用nvm管理Node版本
# macOS/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Windows
# 下载并安装 nvm-windows

# 安装和使用指定版本
nvm install 16
nvm use 16
```

### Git 配置

```bash
# 配置用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 配置换行符（Windows用户）
git config --global core.autocrlf true

# 配置默认分支名
git config --global init.defaultBranch main
```

---

## 💻 VSCode 配置

### 必装插件

以下插件是开发必需的，请确保全部安装：

```json
{
  "recommendations": [
    "Vue.volar",                    // Vue 3 语言支持
    "Vue.vscode-typescript-vue-plugin", // Vue TypeScript 插件
    "dbaeumer.vscode-eslint",       // ESLint 代码检查
    "esbenp.prettier-vscode",       // Prettier 代码格式化
    "stylelint.vscode-stylelint",   // Stylelint 样式检查
    "antfu.unocss",                 // UnoCSS 支持
    "bradlc.vscode-tailwindcss",    // Tailwind CSS 智能提示
    "ms-vscode.vscode-typescript-next", // TypeScript 支持
    "usernamehw.errorlens",         // 错误高亮显示
    "christian-kohler.path-intellisense", // 路径智能提示
    "formulahendry.auto-rename-tag", // 自动重命名标签
    "ms-vscode.vscode-json"         // JSON 支持
  ]
}
```

### 工作区配置

在项目根目录的 `.vscode/settings.json` 中配置：

```json
{
  // TypeScript 配置
  "typescript.preferences.quoteStyle": "single",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  
  // 编辑器配置
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.stylelint": true
  },
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.detectIndentation": false,
  
  // Vue 配置
  "volar.takeOverMode.enabled": true,
  "vue.codeActions.enabled": true,
  
  // 文件关联
  "files.associations": {
    "*.vue": "vue",
    "pages.json": "jsonc",
    "manifest.json": "jsonc"
  },
  
  // 排除文件
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true,
    "**/unpackage": true
  },
  
  // 搜索排除
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/unpackage": true,
    "**/*.d.ts": true
  },
  
  // ESLint 配置
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue"
  ],
  
  // Prettier 配置
  "prettier.requireConfig": true,
  "prettier.useEditorConfig": false,
  
  // UnoCSS 配置
  "unocss.root": "./"
}
```

### 代码片段配置

项目提供了预配置的代码片段，位于 `.vscode/` 目录：

- `api.code-snippets` - API接口相关代码片段
- `component.code-snippets` - Vue组件代码片段
- `store.code-snippets` - Pinia状态管理代码片段

---

## 🔧 开发工具

### 微信开发者工具

1. **下载安装**
   - 访问 [微信开发者工具官网](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
   - 下载对应平台版本

2. **项目导入**
   ```bash
   # 构建微信小程序版本
   npm run build:mp-weixin
   
   # 在微信开发者工具中导入 dist/build/mp-weixin 目录
   ```

3. **调试配置**
   - 开启「不校验合法域名」
   - 开启「不校验 TLS 版本」
   - 配置本地服务器代理

### 支付宝开发者工具

1. **下载安装**
   - 访问 [支付宝开发者工具官网](https://opendocs.alipay.com/mini/ide/download)
   
2. **项目配置**
   ```bash
   # 构建支付宝小程序版本
   npm run build:mp-alipay
   
   # 导入 dist/build/mp-alipay 目录
   ```

### 浏览器开发工具

推荐使用 Chrome DevTools 进行H5端调试：

- **Vue DevTools**: 安装 Vue.js devtools 扩展
- **移动端调试**: 使用 Chrome 移动设备模拟器
- **网络调试**: 使用 Network 面板监控请求

---

## 📦 依赖管理

### npm 配置

```bash
# 配置npm镜像源（可选）
npm config set registry https://registry.npmmirror.com/

# 查看当前配置
npm config list

# 清理缓存
npm cache clean --force
```

### 依赖安装

```bash
# 安装项目依赖
npm install

# 安装新依赖
npm install package-name
npm install -D package-name  # 开发依赖

# 更新依赖
npm update

# 检查过期依赖
npm outdated
```

### 依赖版本管理

项目使用 `package-lock.json` 锁定依赖版本：

- ✅ **提交** `package-lock.json` 到版本控制
- ❌ **不要删除** `package-lock.json`
- ✅ **团队统一** 使用相同的包管理器

---

## 🚀 开发服务器

### 启动开发服务器

```bash
# H5端开发
npm run dev:h5
# 访问 http://localhost:3000

# 微信小程序开发
npm run dev:mp-weixin
# 在微信开发者工具中打开 dist/dev/mp-weixin

# 支付宝小程序开发
npm run dev:mp-alipay
# 在支付宝开发者工具中打开 dist/dev/mp-alipay
```

### 开发服务器配置

Vite 开发服务器配置位于 `vite.config.ts`：

```typescript
// 主要配置项
export default {
  server: {
    port: 3000,        // 端口号
    open: true,        // 自动打开浏览器
    cors: true,        // 启用CORS
    proxy: {           // 代理配置
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
}
```

---

## 🔍 调试技巧

### 代码调试

```typescript
// 使用 console 调试
console.log('调试信息', data)
console.table(arrayData)  // 表格形式显示数组
console.group('分组信息') // 分组显示

// 使用 debugger 断点
function someFunction() {
  debugger // 浏览器会在此处暂停
  // 其他代码
}
```

### 网络请求调试

```typescript
// 在 request.ts 中添加调试信息
request.interceptors.request.use(config => {
  console.log('请求配置:', config)
  return config
})

request.interceptors.response.use(response => {
  console.log('响应数据:', response)
  return response
})
```

### 状态调试

```typescript
// 在组件中调试 Pinia 状态
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)

// 监听状态变化
watch(userInfo, (newVal) => {
  console.log('用户信息变化:', newVal)
}, { deep: true })
```

---

## ⚡ 性能优化

### 开发环境优化

```bash
# 使用更快的包管理器
npm install -g pnpm
pnpm install  # 替代 npm install

# 启用 Vite 缓存
# 缓存目录: node_modules/.vite
```

### 编辑器性能优化

```json
// VSCode settings.json
{
  "typescript.disableAutomaticTypeAcquisition": true,
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "editor.quickSuggestions": {
    "strings": false
  }
}
```

---

## 🔧 故障排除

### 常见问题

1. **依赖安装失败**
   ```bash
   # 清理缓存重新安装
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   ```

2. **TypeScript 类型错误**
   ```bash
   # 重启 TypeScript 服务
   # VSCode: Ctrl+Shift+P -> "TypeScript: Restart TS Server"
   
   # 检查类型
   npm run type-check
   ```

3. **ESLint 规则冲突**
   ```bash
   # 查看具体错误
   npm run lint
   
   # 自动修复
   npm run lint:fix
   ```

4. **热重载不工作**
   - 检查文件路径是否正确
   - 重启开发服务器
   - 清理浏览器缓存

---

## 📋 环境检查清单

- [ ] Node.js >= 16.x
- [ ] npm >= 8.x
- [ ] VSCode 已安装必需插件
- [ ] 项目依赖安装成功
- [ ] 开发服务器启动正常
- [ ] 代码检查通过
- [ ] TypeScript 类型检查通过
- [ ] 微信/支付宝开发者工具配置完成

---

*下一步: [项目架构与开发规范](./03-architecture-standards.md)*