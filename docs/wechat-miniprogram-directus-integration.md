# 微信小程序 + Directus SDK 集成问题解决方案

## 背景

项目使用 uni-app + Vite + Vue 3 + Pinia + Directus SDK 技术栈开发微信小程序（mp-weixin）。在真机调试时遇到 `URL is not a constructor` 错误，导致小程序无法正常运行。

## 技术栈

- **前端框架**: uni-app (Vue 3 + Vite)
- **状态管理**: Pinia + pinia-plugin-persist-uni
- **后端 SDK**: Directus SDK (@directus/sdk)
- **UI 组件**: uview-plus
- **目标平台**: 微信小程序（mp-weixin）

## 问题描述

### 问题 1: URL is not a constructor

**错误信息**：
```
vendor.js:12929 undefined is not a constructor (evaluating 'new n.URL(e)')
```

**影响范围**：
- 所有页面无法加载
- Directus SDK 无法初始化
- 用户登录、注册失败
- 数据请求全部失败

**错误原因**：
微信小程序环境缺少浏览器 API：
- `URL` 构造函数
- `URLSearchParams` 类
- `document` 对象
- DOM 相关 API

而 Directus SDK 依赖这些 API 来构建请求 URL 和处理参数。

### 问题 2: 图片和视频资源无法显示

**现象**：
- 开发者工具模拟器：图片正常显示 ✅
- H5 预览：图片正常显示 ✅
- 真机远程调试：图片无法显示 ❌

**原因**：
微信小程序在真机上对 HTTP 请求有严格限制，当后端服务器使用 HTTP 协议（非 HTTPS）时，真机环境会阻止图片等资源的加载请求。

## 解决方案

### 方案 1: 实现 URL Polyfill（已实施）

#### 1.1 创建自定义 URL 和 URLSearchParams 实现

创建 `src/utils/url-polyfill-miniprogram.ts`，实现完整的 URL 和 URLSearchParams 接口：

```typescript
/**
 * 微信小程序环境的 URL Polyfill
 * 不依赖任何浏览器 API（如 document.createElement）
 * 专门为 Directus SDK 在小程序环境中使用而设计
 */

export class MiniURLSearchParams implements URLSearchParams {
  private params: Map<string, string[]>;

  constructor(init?: string | URLSearchParams | Record<string, string> | string[][]) {
    this.params = new Map();
    // 实现初始化逻辑
  }

  append(name: string, value: string): void { /* ... */ }
  delete(name: string): void { /* ... */ }
  get(name: string): string | null { /* ... */ }
  getAll(name: string): string[] { /* ... */ }
  has(name: string): boolean { /* ... */ }
  set(name: string, value: string): void { /* ... */ }
  toString(): string { /* ... */ }
  // 实现完整的迭代器接口
  forEach, keys, values, entries, [Symbol.iterator]
}

export class MiniURL implements URL {
  href: string;
  origin: string;
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  searchParams: URLSearchParams;

  constructor(url: string, base?: string | URL) {
    // 使用正则表达式解析 URL，不依赖 DOM
    const parsed = this._parseUrl(url);
    // 初始化所有属性
    this.searchParams = new MiniURLSearchParams(this.search);
  }

  private _parseUrl(url: string) {
    const match = url.match(
      /^(https?:)\/\/([^:\/\?#]+)(:(\d+))?(\/[^\?#]*)?(\?[^#]*)?(#.*)?$/i
    );
    // 返回解析后的 URL 组件
  }
}
```

**关键特性**：
- ✅ 不依赖 `document.createElement`
- ✅ 使用正则表达式解析 URL
- ✅ 完整实现 URL 和 URLSearchParams 接口
- ✅ 支持相对路径和绝对路径解析

#### 1.2 三层注入策略

为确保所有代码（包括第三方库）都能访问 polyfill，采用三层注入：

**Layer 1: 模块级自动注入**
在 `url-polyfill-miniprogram.ts` 末尾：
```typescript
if (typeof globalThis !== "undefined") {
  if (!globalThis.URL) (globalThis as any).URL = MiniURL;
  if (!globalThis.URLSearchParams) (globalThis as any).URLSearchParams = MiniURLSearchParams;
}
```

**Layer 2: 应用启动早期注入**
在 `src/main.ts` 开头（所有 import 之前）：
```typescript
import { MiniURL, MiniURLSearchParams } from "@/utils/url-polyfill-miniprogram";

if (typeof globalThis !== "undefined") {
  if (!globalThis.URL) (globalThis as any).URL = MiniURL;
  if (!globalThis.URLSearchParams) (globalThis as any).URLSearchParams = MiniURLSearchParams;
}
```

**Layer 3: Directus SDK 配置注入**
在 `src/utils/directus.ts`：
```typescript
import { MiniURL, MiniURLSearchParams } from "./url-polyfill-miniprogram";
import { createUniFetch } from "./uni-fetch";

const uniFetch = createUniFetch();

const directus = createDirectus<Schema>(env.directusUrl, {
  globals: {
    fetch: uniFetch,
    URL: MiniURL as any,
    URLSearchParams: MiniURLSearchParams as any,
  },
})
  .with(rest())
  .with(authentication("json"));
```

**为什么需要三层？**
- Layer 1: 模块加载时立即可用
- Layer 2: 确保应用启动前注入
- Layer 3: Directus SDK 内部也能使用（官方推荐方式）

#### 1.3 创建自定义 Fetch 适配器

创建 `src/utils/uni-fetch.ts`，使用 `uni.request()` 实现 Fetch API：

```typescript
export function createUniFetch() {
  return async function uniFetch(
    input: string | Request,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === "string" ? input : input.url;
    const method = init?.method || "GET";
    const headers = init?.headers || {};

    return new Promise((resolve, reject) => {
      uni.request({
        url,
        method: method as any,
        header: headers,
        data: init?.body,
        success: (res) => {
          resolve(new MiniResponse(res.data, {
            status: res.statusCode,
            statusText: res.errMsg,
            headers: res.header,
          }));
        },
        fail: (err) => {
          reject(new Error(err.errMsg));
        },
      });
    });
  };
}
```

创建 `src/utils/MiniResponse.ts` 实现 Response 接口。

### 方案 2: 图片资源显示问题（临时方案）

#### 开发阶段解决方案

使用微信开发者工具的 **"真机调试"** 模式（而非"预览"或"远程调试"）：

1. 确保在开发者工具中勾选了"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"
2. 点击工具栏的 **"真机调试"** 按钮（不是"预览"）
3. 用微信扫码打开

**真机调试模式的特点**：
- ✅ "不校验域名"设置会生效
- ✅ HTTP 图片请求可以正常加载
- ✅ Console 日志会同步到开发者工具

#### 生产环境解决方案

正式发布前必须完成：

1. **配置 HTTPS 证书**
   - 为 Directus 服务器配置 SSL 证书（推荐使用 Let's Encrypt）
   - 配置 Nginx 或其他反向代理处理 HTTPS

2. **更新配置文件**
   ```typescript
   // src/config/env.ts
   const envMap = {
     prod: {
       baseUrl: "https://m.example.com",
       apiBaseUrl: "https://api.example.com",
       directusUrl: "https://api.example.com",
     }
   };
   ```

3. **配置微信小程序域名白名单**
   - 登录微信公众平台小程序后台
   - 进入"开发 -> 开发管理 -> 开发设置 -> 服务器域名"
   - 添加以下域名（必须 HTTPS）：
     - **request合法域名**: `https://api.example.com`
     - **uploadFile合法域名**: `https://api.example.com`
     - **downloadFile合法域名**: `https://api.example.com`

## 失败的尝试

### ❌ 尝试 1: url-polyfill npm 包

```bash
npm install url-polyfill
```

**失败原因**：该包依赖 `document.createElement()` 创建 `<a>` 标签来解析 URL，微信小程序环境没有 DOM API。

**错误信息**：
```
undefined is not an object (evaluating 'r.createElement')
```

### ❌ 尝试 2: React Native 相关的 polyfill

多个 React Native polyfill 包都依赖 Node.js 或浏览器特有 API，不适用于微信小程序环境。

## 项目数据管理脚本

为了方便开发测试，创建了以下数据管理脚本：

### 1. 创建工单数据

**脚本**: `create_workorders_v2.py`

用途：批量创建测试工单数据到 Directus

```bash
# 使用方式
DIRECTUS_URL=http://139.155.26.118:8055 python3 create_workorders_v2.py user_workorders.json
```

特性：
- 支持从 JSON 文件批量导入
- 自动处理文件上传和关联
- 支持多种工单类型（repair, complaint, suggestion 等）

### 2. 修复文件 MIME 类型

**脚本**: `fix_octet_stream.sh`

用途：修复 Directus 中 MIME 类型为 `application/octet-stream` 的文件

```bash
chmod +x fix_octet_stream.sh
./fix_octet_stream.sh
```

### 3. 重新上传文件

**脚本**: `reupload_files.sh`

用途：重新上传损坏或丢失的文件到 Directus

```bash
chmod +x reupload_files.sh
./reupload_files.sh
```

### 4. 上传头像

**脚本**: `upload_avatars.sh`

用途：批量上传用户头像到 Directus

```bash
chmod +x upload_avatars.sh
./upload_avatars.sh
```

### 5. 创建居民数据

**脚本**: `create_residents.sh`

用途：批量创建测试居民数据

```bash
chmod +x create_residents.sh
./create_residents.sh
```

## 验证步骤

### 1. 验证 URL Polyfill

```bash
# 编译微信小程序
npm run build:mp-weixin

# 用微信开发者工具打开 dist/build/mp-weixin
# 查看 Console，不应有 "URL is not a constructor" 错误
```

### 2. 验证登录功能

1. 在真机调试模式下打开小程序
2. 进入"我"页面
3. 点击"登录"按钮
4. 输入邮箱和密码
5. 确认能够成功登录并看到用户信息

### 3. 验证数据加载

1. 切换到"事项"标签页
2. 确认能够看到工单列表
3. 点击工单查看详情
4. 确认数据加载正常

## 性能优化建议

### 1. 图片缩略图

对于列表页的图片，使用 Directus 的缩略图功能：

```typescript
// src/utils/fileUtils.ts
export function getThumbnailUrl(
  file: DirectusFile | string | null | undefined,
  width: number = 200,
  height: number = 200
): string | null {
  const fileUrl = getFileUrl(file);
  if (!fileUrl) return null;

  return `${fileUrl}?width=${width}&height=${height}&fit=cover`;
}
```

### 2. 按需加载字段

在查询工单时，明确指定需要的字段：

```typescript
const SAFE_FIELDS = [
  "id",
  "title",
  "description",
  "category",
  "priority",
  "status",
  "date_created",
  "submitter_id.id",
  "submitter_id.first_name",
  "submitter_id.last_name",
  "submitter_id.avatar",
  "files.directus_files_id.*",
] as unknown as NonNullable<WorkOrderQuery["fields"]>;
```

### 3. 分页加载

实现列表的分页加载，避免一次性加载过多数据：

```typescript
const query: WorkOrderQuery = {
  limit: 10,
  page: currentPage,
  fields: SAFE_FIELDS,
  sort: ["-date_created"],
};
```

## 已知限制

### 1. 真机图片加载限制

- **问题**: 真机上 HTTP 图片无法加载（即使设置了"不校验域名"）
- **临时方案**: 使用"真机调试"模式（不是"预览"）
- **正式方案**: 配置 HTTPS（必须）

### 2. URL Polyfill 兼容性

当前实现覆盖了 Directus SDK 需要的核心功能，但可能不支持 URL 标准的所有特性。如果遇到问题，需要针对性扩展。

### 3. 性能考虑

Polyfill 是纯 JavaScript 实现，性能略低于原生 API。对于大量 URL 操作的场景，建议：
- 缓存解析结果
- 减少不必要的 URL 构建
- 使用字符串拼接替代简单场景

## 参考资料

### 官方文档

- [Directus SDK - Custom Fetch](https://docs.directus.io/guides/sdk/custom-fetch.html)
- [Directus SDK - Getting Started](https://docs.directus.io/guides/sdk/getting-started.html)
- [uni-app 官方文档](https://uniapp.dcloud.net.cn/)
- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)

### 相关标准

- [URL Standard (WHATWG)](https://url.spec.whatwg.org/)
- [URLSearchParams - MDN](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
- [Fetch API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## 问题排查清单

当遇到问题时，按以下顺序检查：

### ✅ Polyfill 相关
- [ ] 确认 `url-polyfill-miniprogram.ts` 已正确导入
- [ ] 检查 `main.ts` 中的全局注入代码在所有 import 之前
- [ ] 确认 `directus.ts` 中 `globals` 配置正确
- [ ] 查看 Console 是否有 "URL is not a constructor" 错误

### ✅ 网络请求
- [ ] 检查开发者工具 Network 标签，确认请求已发送
- [ ] 确认请求 URL 格式正确
- [ ] 检查 HTTP 状态码（200 = 成功）
- [ ] 确认响应数据格式符合预期

### ✅ 真机调试
- [ ] 使用"真机调试"而非"预览"模式
- [ ] 确认"不校验合法域名"选项已勾选
- [ ] 检查手机网络连接
- [ ] 查看真机 Console 日志

### ✅ 数据结构
- [ ] 确认 Directus 返回的数据结构符合预期
- [ ] 检查关联字段是否正确展开（使用 `fields` 参数）
- [ ] 验证文件 URL 构建逻辑

## 总结

通过实现自定义的 URL/URLSearchParams Polyfill 和 Fetch 适配器，成功解决了 Directus SDK 在微信小程序环境中的兼容性问题。关键要点：

1. **不依赖浏览器 API**：使用纯 JavaScript 和正则表达式实现
2. **三层注入策略**：确保全局可用性
3. **官方推荐方式**：使用 Directus SDK 的 `globals` 配置项
4. **网络安全策略**：了解真机环境的限制，生产环境必须使用 HTTPS

这套方案已在开发环境验证通过，用户可以正常登录、查看数据。图片资源在"真机调试"模式下也能正常显示。
