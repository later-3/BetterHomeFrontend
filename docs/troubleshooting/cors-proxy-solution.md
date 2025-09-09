# CORS 跨域问题解决方案

## 问题描述

在 H5 开发环境中，使用 `uni.request` 直接访问本地 Directus 服务时遇到网络请求失败：

```javascript
// 错误信息
{
  "action": "login",
  "success": false,
  "stage": "network_error",
  "error": {
    "message": "[object Object]",
    "errMsg": "request:fail",
    "type": "object"
  }
}
```

## 问题原因

1. **浏览器 CORS 策略限制**：浏览器阻止前端直接访问不同域的后端服务
2. **uni-app H5 环境限制**：在浏览器环境中，uni.request 受到跨域安全策略限制
3. **本地开发环境**：`http://localhost:3000` (前端) 访问 `http://localhost:8055` (Directus) 属于跨域

## 解决方案

### 开发环境解决方案：Vite 代理配置

项目中已配置 Vite 开发服务器代理，在 `vite.config.ts` 中：

```typescript
server: {
  proxy: {
    "^/api": {
      target: env.apiBaseUrl,           // 后端服务地址
      changeOrigin: true,               // 开启代理
      rewrite: (path) => path.replace(/^\/api/, ""),  // 重写路径
    },
  },
}
```

### 修复步骤

1. **修改 API 基础地址**：
   ```typescript
   // 从直接访问改为使用代理
   const apiBaseUrl = ref('/api')  // 原来是 'http://localhost:8055'
   ```

2. **更新环境配置**：
   ```typescript
   // src/config/env.ts
   dev: {
     baseUrl: 'http://m.dev.xxx.com',
     apiBaseUrl: 'http://localhost:8055'  // 指向本地 Directus
   }
   ```

3. **重启开发服务器**：代理配置需要重启才能生效

### 工作原理

```
前端请求: /api/auth/login
    ↓
Vite 代理拦截并转发
    ↓
实际请求: http://localhost:8055/auth/login
    ↓
Directus 响应
    ↓
返回给前端（无跨域问题）
```

## 测试验证

使用以下测试代码验证解决方案：

```typescript
// 网络连接测试
async function testNetwork() {
  try {
    // 测试公网 API
    const publicTest = await uni.request({
      url: 'https://httpbin.org/json',
      method: 'GET'
    })
    
    // 测试本地 Directus
    const localTest = await uni.request({
      url: '/api/server/info',  // 使用代理路径
      method: 'GET'
    })
    
    console.log('网络测试成功')
  } catch (error) {
    console.error('网络测试失败:', error)
  }
}
```

## 多环境配置方案

### 不同环境的最佳实践

| 环境类型 | 推荐方案 | 配置方式 |
|----------|----------|----------|
| **H5开发环境** | Vite/Webpack 代理 | `/api` → `http://localhost:8055` |
| **小程序开发** | 直接请求 | `http://localhost:8055` |
| **H5生产环境** | CORS配置或Nginx代理 | `https://api.domain.com` |
| **小程序生产** | 直接请求 | `https://api.domain.com` |

### 环境检测配置

```typescript
const getApiBaseUrl = () => {
  const isDev = process.env.NODE_ENV === 'development'
  
  // #ifdef MP
  return isDev ? 'http://localhost:8055' : 'https://api.domain.com'
  // #endif
  
  // #ifdef H5  
  return isDev ? '/api' : 'https://api.domain.com'
  // #endif
}
```

## 生产环境部署注意事项

### 方案1: Directus CORS 配置
```bash
# .env
CORS_ENABLED=true
CORS_ORIGIN=https://yourdomain.com,https://m.yourdomain.com
CORS_METHODS=GET,POST,PATCH,DELETE
CORS_ALLOWED_HEADERS=Content-Type,Authorization
```

### 方案2: Nginx 反向代理
```nginx
location /api/ {
    proxy_pass http://localhost:8055/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 方案3: 同域部署
- 前端：`https://app.domain.com`
- 后端：`https://app.domain.com/api`

## 相关问题排查

### 常见错误信息

1. **request:fail** - 网络请求失败，通常是 CORS 问题
2. **ERR_BLOCKED_BY_CLIENT** - 浏览器插件拦截
3. **ERR_CONNECTION_REFUSED** - 后端服务未启动
4. **401 Unauthorized** - 认证失败，Token 问题

### 调试技巧

1. **开启详细日志**：记录请求和响应的完整信息
2. **浏览器开发者工具**：查看 Network 选项卡的实际请求
3. **分步测试**：先测试公网 API，再测试本地服务
4. **环境隔离**：确认在不同环境下的配置差异

## 总结

- **开发环境**：使用 Vite 代理是最优解决方案，无需修改后端配置
- **生产环境**：需根据部署架构选择 CORS、反向代理或同域部署方案
- **多端适配**：小程序无 CORS 限制，H5 需要特殊处理
- **最佳实践**：环境检测 + 动态配置，确保各环境都能正常工作

此解决方案既保持了开发的便捷性，又为生产部署提供了清晰的路径。