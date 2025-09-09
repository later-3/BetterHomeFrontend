# 项目待办事项

## 🚀 API 配置和环境管理

### 高优先级
- [ ] **生产环境 API 配置**
  - [ ] 配置生产环境 Directus 服务器 CORS 策略
  - [ ] 设置生产环境域名和 API 端点
  - [ ] 验证 HTTPS 证书配置

- [ ] **多端环境适配**
  - [ ] 完善 `src/config/env.ts` 中的环境配置
  - [ ] 实现运行时环境检测逻辑（H5 vs 小程序）
  - [ ] 添加开发/生产环境自动切换机制

- [ ] **部署配置**
  - [ ] 配置 Nginx 反向代理（如果需要）
  - [ ] 设置 Directus 生产环境配置文件
  - [ ] 配置小程序合法域名列表

### 中优先级
- [ ] **API 封装优化**
  - [ ] 创建统一的 API 请求封装类
  - [ ] 实现请求拦截器和响应拦截器
  - [ ] 添加自动重试和错误处理机制
  - [ ] 实现请求缓存策略

- [ ] **错误处理和监控**
  - [ ] 实现全局错误处理机制
  - [ ] 添加网络状态监测
  - [ ] 集成错误日志收集服务
  - [ ] 添加 API 性能监控

### 低优先级
- [ ] **开发体验优化**
  - [ ] 添加 API 接口文档集成
  - [ ] 创建 API 测试工具页面
  - [ ] 实现 Mock 数据支持
  - [ ] 添加接口响应时间统计

## 📝 相关文档
- CORS 解决方案：`docs/troubleshooting/cors-proxy-solution.md`
- API 配置文件：`src/config/env.ts`
- Vite 代理配置：`vite.config.ts`

## 🔧 技术债务
- [ ] 移除测试页面中的硬编码账号密码
- [ ] 优化错误信息的用户友好性
- [ ] 统一项目中的 API 调用方式
- [ ] 完善 TypeScript 类型定义

---
**更新时间**: 2025-09-08
**负责人**: 开发团队



accept
*/*
accept-encoding
gzip, deflate, br, zstd
accept-language
en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7
authorization
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMzZhMmEwLTljMWEtNDViZC04MmViLTY4NjEzNTMzNDAxMiIsInJvbGUiOiI3MzIyYzAyNS05MGNjLTQzYjktODY5OS0yNWFjYTE1ZGU3MzEiLCJhcHBfYWNjZXNzIjp0cnVlLCJhZG1pbl9hY2Nlc3MiOnRydWUsImlhdCI6MTc1NzM0NTM5MCwiZXhwIjoxNzU3MzQ2MjkwLCJpc3MiOiJkaXJlY3R1cyJ9.iqiiLNXlgDxBfxqV9U-YK0tNxUaKIHDd6-sJvXudyIU
connection
keep-alive
content-length
46
content-type
application/json
cookie
directus_session_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUyZDEyZjk2LTRjMmYtNGQxOS04NDQ1LTliYTJlZDM2ZWY0MyIsInJvbGUiOiI4NWY2NDcxNC03MGExLTRhOTctOTU3Ni00N2FkMjBlNGRlODMiLCJhcHBfYWNjZXNzIjp0cnVlLCJhZG1pbl9hY2Nlc3MiOnRydWUsInNlc3Npb24iOiJnNDNvME9XMml5QTRyMEUzR21ZRG0tRFNUNEFYRHZhWnNoSWE4NlhWVUdXa0VJYUJIWkF5YTJuRnhhampQODRPIiwiaWF0IjoxNzU3MzQ0NTQ5LCJleHAiOjE3NTc0MzA5NDksImlzcyI6ImRpcmVjdHVzIn0.ddeUn06wOYJDNQcuX4BJHKTEbRqPdB4EWYaEP_OWSAc
host
localhost:5173
origin
http://localhost:5173
referer
http://localhost:5173/
sec-fetch-dest
empty
sec-fetch-mode
cors
sec-fetch-site
same-origin
user-agent
Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1


accept
*/*
accept-encoding
gzip, deflate, br, zstd
accept-language
en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7
authorization
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMzZhMmEwLTljMWEtNDViZC04MmViLTY4NjEzNTMzNDAxMiIsInJvbGUiOiI3MzIyYzAyNS05MGNjLTQzYjktODY5OS0yNWFjYTE1ZGU3MzEiLCJhcHBfYWNjZXNzIjp0cnVlLCJhZG1pbl9hY2Nlc3MiOnRydWUsImlhdCI6MTc1NzM0NTM5MCwiZXhwIjoxNzU3MzQ2MjkwLCJpc3MiOiJkaXJlY3R1cyJ9.iqiiLNXlgDxBfxqV9U-YK0tNxUaKIHDd6-sJvXudyIU
connection
keep-alive
content-length
108
content-type
application/json
cookie
directus_session_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUyZDEyZjk2LTRjMmYtNGQxOS04NDQ1LTliYTJlZDM2ZWY0MyIsInJvbGUiOiI4NWY2NDcxNC03MGExLTRhOTctOTU3Ni00N2FkMjBlNGRlODMiLCJhcHBfYWNjZXNzIjp0cnVlLCJhZG1pbl9hY2Nlc3MiOnRydWUsInNlc3Npb24iOiJnNDNvME9XMml5QTRyMEUzR21ZRG0tRFNUNEFYRHZhWnNoSWE4NlhWVUdXa0VJYUJIWkF5YTJuRnhhampQODRPIiwiaWF0IjoxNzU3MzQ0NTQ5LCJleHAiOjE3NTc0MzA5NDksImlzcyI6ImRpcmVjdHVzIn0.ddeUn06wOYJDNQcuX4BJHKTEbRqPdB4EWYaEP_OWSAc
host
localhost:5173
origin
http://localhost:5173
referer
http://localhost:5173/
sec-fetch-dest
empty
sec-fetch-mode
cors
sec-fetch-site
same-origin
user-agent
Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1