# uni-vue3-vite-ts-pinia 开发协同指南

## 📋 项目模块架构总览

### 核心模块划分

本项目采用模块化架构，共分为 8 个核心模块：

#### 1. 路由模块 (Route Module)

- **位置**: `src/pages.json`
- **职责**: 管理应用所有页面路由配置
- **依赖**: 无依赖，被所有页面模块依赖

#### 2. 页面模块 (Pages Module)

- **位置**: `src/pages/`
- **职责**: 具体业务页面实现
- **依赖**: Store 模块、API 模块、组件模块、工具模块

#### 3. 组件模块 (Components Module)

- **位置**: `src/components/`
- **职责**: 可复用的 UI 组件
- **依赖**: 工具模块(可选)

#### 4. 状态管理模块 (Store Module)

- **位置**: `src/store/`
- **职责**: 应用状态管理和数据持久化
- **依赖**: 类型定义模块

#### 5. API 模块 (API Module)

- **位置**: `src/api/`
- **职责**: 网络请求接口封装
- **依赖**: 工具模块(request.ts)、类型定义模块

#### 6. 工具模块 (Utils Module)

- **位置**: `src/utils/`
- **职责**: 通用工具函数和服务封装
- **依赖**: 配置模块

#### 7. 配置模块 (Config Module)

- **位置**: `src/config/`
- **职责**: 应用配置和环境管理
- **依赖**: 无依赖，被多个模块依赖

#### 8. 类型定义模块 (Types Module)

- **位置**: `src/@types/`
- **职责**: TypeScript 类型声明
- **依赖**: 无依赖，被多个模块依赖

---

## 🏗️ 模块开发原则与约束

### 1. 路由模块开发原则

**核心原则**: 路由即文档，保持配置的清晰和可维护性

**开发约束**:

- ❌ **禁止直接修改** `pages.json` 文件
- ✅ **必须使用** `npm run add` 命令添加新页面
- ✅ **命名规范**: 页面路径使用 kebab-case (如: user-profile)
- ✅ **结构规范**: 每个页面必须有独立的文件夹

**配置模板**:

```json
{
  "path": "pages/module-name/page-name",
  "style": {
    "navigationBarTitleText": "页面标题",
    "enablePullDownRefresh": false
  }
}
```

### 2. 页面模块开发原则

**核心原则**: 页面职责单一，数据流向清晰

**开发约束**:

- ✅ **必须使用** `<script setup lang="ts">` 语法
- ✅ **必须定义** 明确的 TypeScript 类型
- ❌ **禁止在页面中** 直接调用 uni API，必须通过工具模块封装
- ✅ **状态管理**: 页面级状态使用 ref/reactive，应用级状态使用 Pinia
- ✅ **样式规范**: 使用 scoped + SCSS，支持 UnoCSS 原子类

**页面结构模板**:

```vue
<script setup lang="ts">
// 1. 导入依赖
import { useTitle } from "@/hooks/useTitle";
import { forward } from "@/utils/router";

// 2. 接收参数(如果有)
interface Props {
  id?: string;
}
const props = withDefaults(defineProps<Props>(), {
  id: "",
});

// 3. 页面状态
const loading = ref(false);

// 4. 生命周期
onMounted(() => {
  // 初始化逻辑
});

// 5. 方法定义
const handleSubmit = () => {
  // 处理逻辑
};
</script>

<template>
  <view class="page-container">
    <!-- 页面内容 -->
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  // 页面样式
}
</style>
```

### 3. 组件模块开发原则

**核心原则**: 组件复用性最大化，接口设计最小化

**开发约束**:

- ✅ **必须定义** 清晰的 Props 类型和默认值
- ✅ **必须使用** defineEmits 定义事件
- ❌ **禁止直接修改** props，使用事件向上传递
- ✅ **插槽使用**: 合理使用具名插槽提高灵活性
- ✅ **样式隔离**: 必须使用 scoped 避免样式污染

**组件结构模板**:

```vue
<script setup lang="ts">
interface Props {
  title: string;
  disabled?: boolean;
}

interface Emits {
  click: [value: string];
  change: [value: any];
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<Emits>();

const handleClick = () => {
  if (props.disabled) return;
  emit("click", "clicked");
};
</script>

<template>
  <view @click="handleClick">
    <slot name="prefix"></slot>
    {{ title }}
    <slot></slot>
  </view>
</template>

<style lang="scss" scoped>
// 组件样式
</style>
```

### 4. 状态管理模块开发原则

**核心原则**: 状态最小化，操作原子化

**开发约束**:

- ✅ **必须使用** defineStore 定义 store
- ✅ **状态设计**: 保持 state 扁平化，避免深度嵌套
- ✅ **持久化配置**: 敏感信息不持久化，用户数据选择性持久化
- ❌ **禁止在 actions 中** 直接修改其他 store 的状态
- ✅ **类型安全**: 为 state、getters、actions 定义明确类型

**Store 结构模板**:

```typescript
export default defineStore({
  id: "moduleName",
  state: (): ModuleState => ({
    data: [],
    loading: false,
    error: null,
  }),

  getters: {
    isLoading: (state) => state.loading,
    hasData: (state) => state.data.length > 0,
  },

  actions: {
    async fetchData() {
      this.loading = true;
      try {
        const result = await api.getData();
        this.data = result.data;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    clearData() {
      this.data = [];
      this.error = null;
    },
  },

  // 持久化配置
  persist: {
    enabled: true,
    strategies: [
      {
        key: "module-data",
        storage: {
          getItem: uni.getStorageSync,
          setItem: uni.setStorageSync,
        },
        paths: ["data"], // 只持久化 data 字段
      },
    ],
  },
});
```

### 5. API 模块开发原则

**核心原则**: 接口封装标准化，错误处理统一化

**开发约束**:

- ✅ **必须定义** 请求和响应的 TypeScript 接口
- ✅ **统一导出**: 每个模块导出一个对象，包含相关 API
- ✅ **命名规范**: API 方法使用动词前缀 (get/post/put/delete)
- ❌ **禁止在 API 层** 处理业务逻辑，只负责数据转换
- ✅ **错误处理**: 统一通过 request.ts 处理，不在单个 API 中处理

**API 结构模板**:

```typescript
// src/@types/api.d.ts - 类型定义
declare namespace UserAPI {
  interface GetUserParams {
    id: string;
  }

  interface UserInfo {
    id: string;
    name: string;
    avatar: string;
  }

  interface UpdateUserParams {
    id: string;
    name?: string;
    avatar?: string;
  }
}

// src/api/user.ts - API实现
const userAPI = {
  // 获取用户信息
  getUserInfo: (params: UserAPI.GetUserParams) =>
    http.get<UserAPI.UserInfo>("/user/info", params),

  // 更新用户信息
  updateUserInfo: (params: UserAPI.UpdateUserParams) =>
    http.post<UserAPI.UserInfo>("/user/update", params),

  // 删除用户
  deleteUser: (params: { id: string }) =>
    http.post<{ success: boolean }>("/user/delete", params),
};

export default userAPI;
```

### 6. 工具模块开发原则

**核心原则**: 纯函数优先，无副作用设计

**开发约束**:

- ✅ **纯函数优先**: 工具函数应该是纯函数，输入相同输出相同
- ✅ **单一职责**: 每个工具文件职责单一，功能聚焦
- ✅ **完整的类型定义**: 所有工具函数必须有 TypeScript 类型
- ❌ **禁止直接导入业务模块** (store、api 等)
- ✅ **统一的错误处理**: 工具函数的错误要有统一的处理方式

**工具函数模板**:

```typescript
// src/utils/format.ts
/**
 * 格式化日期
 * @param date 日期对象或时间戳
 * @param format 格式化模板
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: Date | number,
  format: string = "YYYY-MM-DD"
): string {
  // 实现逻辑
  return formattedDate;
}

/**
 * 格式化货币
 * @param amount 金额
 * @param currency 货币符号
 * @returns 格式化后的货币字符串
 */
export function formatCurrency(amount: number, currency: string = "¥"): string {
  // 实现逻辑
  return formattedAmount;
}
```

### 7. 配置模块开发原则

**核心原则**: 环境隔离，配置集中化

**开发约束**:

- ✅ **环境区分**: 必须区分 dev/beta/prod 环境
- ❌ **禁止硬编码**: 不允许在代码中硬编码配置值
- ✅ **类型安全**: 所有配置都要有 TypeScript 类型定义
- ✅ **敏感信息保护**: API 密钥等敏感信息不提交到版本控制
- ✅ **配置验证**: 启动时验证必要配置项

**配置结构模板**:

```typescript
// src/config/app.ts
interface AppConfig {
  name: string;
  version: string;
  description: string;
}

export const appConfig: AppConfig = {
  name: "MyApp",
  version: "1.0.0",
  description: "App description",
};

// src/config/env.ts
type Environment = "dev" | "beta" | "prod";

interface EnvConfig {
  apiBaseUrl: string;
  cdnUrl: string;
  debug: boolean;
}

const envConfigs: Record<Environment, EnvConfig> = {
  dev: {
    apiBaseUrl: "https://api-dev.example.com",
    cdnUrl: "https://cdn-dev.example.com",
    debug: true,
  },
  beta: {
    apiBaseUrl: "https://api-beta.example.com",
    cdnUrl: "https://cdn-beta.example.com",
    debug: true,
  },
  prod: {
    apiBaseUrl: "https://api.example.com",
    cdnUrl: "https://cdn.example.com",
    debug: false,
  },
};
```

### 8. 类型定义模块开发原则

**核心原则**: 类型先行，接口清晰

**开发约束**:

- ✅ **按业务模块分文件**: 不同业务的类型放在不同文件中
- ✅ **使用命名空间**: 避免类型名称冲突
- ✅ **继承和复用**: 合理使用继承避免重复定义
- ❌ **禁止 any 类型**: 除非确实无法定义具体类型
- ✅ **文档注释**: 复杂类型必须有 JSDoc 注释

**类型定义模板**:

```typescript
// src/@types/user.d.ts
declare namespace User {
  /** 用户基本信息 */
  interface BaseInfo {
    id: string;
    name: string;
    avatar?: string;
  }

  /** 用户详细信息 */
  interface DetailInfo extends BaseInfo {
    email: string;
    phone: string;
    createTime: number;
    updateTime: number;
  }

  /** 用户登录信息 */
  interface LoginInfo {
    token: string;
    refreshToken: string;
    expireTime: number;
  }
}

// src/@types/api.d.ts
declare namespace API {
  /** 通用响应结构 */
  interface Response<T = any> {
    code: number;
    message: string;
    data: T;
    success: boolean;
  }

  /** 分页参数 */
  interface PageParams {
    pageNum: number;
    pageSize: number;
  }

  /** 分页响应 */
  interface PageResponse<T> {
    list: T[];
    total: number;
    pageNum: number;
    pageSize: number;
  }
}
```

---

## 🎯 具体开发操作指南

### 场景一: 替换现有页面为自定义页面

**开发步骤**:

1. **分析现有页面**

   ```bash
   # 查看现有页面结构
   ls src/pages/index/
   # 分析页面依赖
   grep -r "pages/index" src/
   ```

2. **备份原页面** (可选)

   ```bash
   cp -r src/pages/index src/pages/index.backup
   ```

3. **修改页面内容**

   - 保持文件结构不变: `src/pages/index/index.vue`
   - 修改页面内容，保持导出接口一致
   - 更新相关的类型定义

4. **更新路由配置** (如需要)

   ```json
   // src/pages.json
   {
     "path": "pages/index/index",
     "style": {
       "navigationBarTitleText": "新页面标题"
     }
   }
   ```

5. **测试验证**
   ```bash
   npm run dev:h5
   npm run lint
   ```

**约束要求**:

- ❌ 不要改变页面路径
- ✅ 保持现有的导航结构
- ✅ 确保不破坏现有的页面跳转逻辑

### 场景二: 添加新页面

**开发步骤**:

1. **使用自动化脚本** (推荐)

   ```bash
   npm run add
   ```

   按提示输入页面信息

2. **手动创建** (了解原理)

   ```bash
   # 创建页面目录和文件
   mkdir src/pages/my-new-page
   touch src/pages/my-new-page/my-new-page.vue
   ```

   然后编辑 `src/pages.json` 添加路由配置

3. **实现页面功能**

   - 使用页面模板创建基础结构
   - 实现具体业务逻辑
   - 添加必要的样式

4. **测试页面**
   - 测试页面跳转
   - 测试页面功能
   - 检查代码规范

**约束要求**:

- ✅ 必须使用 kebab-case 命名页面
- ✅ 页面文件夹和文件同名
- ✅ 必须在 pages.json 中注册

### 场景三: 修改路由跳转

**开发步骤**:

1. **使用统一的路由工具**

   ```typescript
   // 正确方式
   import { forward } from "@/utils/router";

   // 页面跳转
   forward("user-profile", { id: "123" });

   // 替换当前页面
   forward("login", {}, { replace: true });
   ```

2. **避免直接使用 uni API**

   ```typescript
   // ❌ 错误方式
   uni.navigateTo({
     url: "/pages/user-profile/user-profile?id=123",
   });

   // ✅ 正确方式
   forward("user-profile", { id: "123" });
   ```

3. **更新路由配置** (如果添加新路由)
   - 在 `pages.json` 中添加页面配置
   - 更新 `src/utils/urlMap.ts` 中的路由映射

**约束要求**:

- ❌ 禁止直接使用 uni.navigateTo 等 API
- ✅ 必须使用项目封装的路由工具
- ✅ 参数传递要类型安全

### 场景四: 添加新按钮/组件

**开发步骤**:

1. **确定组件类型**

   - 页面专用组件: 放在页面目录下
   - 通用组件: 放在 `src/components/` 下

2. **创建组件文件**

   ```bash
   # 通用组件
   touch src/components/CustomButton.vue

   # 页面专用组件
   mkdir src/pages/user-profile/components
   touch src/pages/user-profile/components/ProfileHeader.vue
   ```

3. **实现组件**

   - 使用组件模板创建基础结构
   - 定义清晰的 Props 和 Events
   - 实现组件逻辑和样式

4. **使用组件**

   ```vue
   <script setup lang="ts">
   // 通用组件会自动导入，无需手动 import
   // 页面专用组件需要手动导入
   import ProfileHeader from "./components/ProfileHeader.vue";
   </script>

   <template>
     <view>
       <ProfileHeader :user="userInfo" @edit="handleEdit" />
       <CustomButton type="primary" @click="handleSubmit"> 提交 </CustomButton>
     </view>
   </template>
   ```

**约束要求**:

- ✅ 通用组件放在 components 目录下会自动注册
- ✅ 组件必须有清晰的 Props 类型定义
- ✅ 事件名使用 camelCase
- ❌ 禁止在组件内直接修改 props

### 场景五: 添加 API 接口

**开发步骤**:

1. **定义接口类型**

   ```typescript
   // src/@types/api.d.ts
   declare namespace ProductAPI {
     interface GetProductParams {
       id: string;
       includeDetails?: boolean;
     }

     interface Product {
       id: string;
       name: string;
       price: number;
       description?: string;
     }
   }
   ```

2. **实现 API 方法**

   ```typescript
   // src/api/product.ts
   import http from "@/utils/request";

   const productAPI = {
     getProduct: (params: ProductAPI.GetProductParams) =>
       http.get<ProductAPI.Product>("/products/detail", params),

     getProducts: (params: API.PageParams) =>
       http.get<API.PageResponse<ProductAPI.Product>>("/products/list", params),
   };

   export default productAPI;
   ```

3. **在页面中使用**

   ```typescript
   // src/pages/product/product.vue
   <script setup lang="ts">
   import productAPI from '@/api/product'

   const product = ref<ProductAPI.Product>()
   const loading = ref(false)

   const loadProduct = async (id: string) => {
     loading.value = true
     try {
       const result = await productAPI.getProduct({ id })
       product.value = result.data
     } catch (error) {
       console.error('加载产品失败:', error)
     } finally {
       loading.value = false
     }
   }
   </script>
   ```

**约束要求**:

- ✅ API 方法必须有完整的 TypeScript 类型
- ✅ 统一使用 http 工具发请求
- ❌ 禁止在 API 层处理 UI 相关逻辑
- ✅ 错误处理统一在 request.ts 中处理

### 场景六: 添加全局状态管理

**开发步骤**:

1. **定义状态类型**

   ```typescript
   // src/@types/store.d.ts
   declare namespace Store {
     interface CartState {
       items: CartItem[];
       total: number;
       loading: boolean;
     }

     interface CartItem {
       id: string;
       name: string;
       price: number;
       quantity: number;
     }
   }
   ```

2. **创建 Store**

   ```typescript
   // src/store/cart.ts
   export default defineStore({
     id: "cart",

     state: (): Store.CartState => ({
       items: [],
       total: 0,
       loading: false,
     }),

     getters: {
       itemCount: (state) => state.items.length,
       isEmpty: (state) => state.items.length === 0,
       totalPrice: (state) =>
         state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
     },

     actions: {
       addItem(item: Store.CartItem) {
         const existingItem = this.items.find((i) => i.id === item.id);
         if (existingItem) {
           existingItem.quantity += item.quantity;
         } else {
           this.items.push(item);
         }
         this.updateTotal();
       },

       removeItem(itemId: string) {
         const index = this.items.findIndex((i) => i.id === itemId);
         if (index > -1) {
           this.items.splice(index, 1);
           this.updateTotal();
         }
       },

       updateTotal() {
         this.total = this.totalPrice;
       },
     },

     persist: {
       enabled: true,
       strategies: [
         {
           key: "cart-data",
           storage: {
             getItem: uni.getStorageSync,
             setItem: uni.setStorageSync,
           },
           paths: ["items"], // 只持久化商品列表
         },
       ],
     },
   });
   ```

3. **在页面中使用**

   ```typescript
   // 使用 pinia-auto-refs 自动生成的 useStore
   const { items, itemCount, isEmpty, addItem, removeItem } = useStore("cart");

   // 添加商品到购物车
   const handleAddToCart = (product: ProductAPI.Product) => {
     addItem({
       id: product.id,
       name: product.name,
       price: product.price,
       quantity: 1,
     });
   };
   ```

**约束要求**:

- ✅ Store 必须有唯一的 id
- ✅ 敏感数据不要持久化
- ✅ Actions 中不要直接调用其他 Store 的 actions
- ✅ 使用 pinia-auto-refs 简化 Store 使用

---

## 🚀 开发效率技巧

### 1. 自动导入配置

项目已配置自动导入，以下 API 可直接使用无需 import:

- Vue 3 Composition API: `ref`, `reactive`, `computed`, `watch` 等
- uni-app API: `uni.xxx` 等
- Pinia: `defineStore`, `storeToRefs` 等
- 自定义 hooks: `src/hooks/` 下的所有 hooks
- 通用组件: `src/components/` 下的所有组件

### 2. 类型提示优化

- 启用 VSCode 的 Volar 插件
- 禁用 Vetur 插件避免冲突
- 使用 `// @ts-ignore` 时要有注释说明原因

### 3. 开发调试技巧

```bash
# 开发模式启动 (支持热重载)
npm run dev:h5          # H5版本
npm run dev:mp-weixin   # 微信小程序版本

# 代码检查
npm run lint            # 完整代码检查
npm run eslint          # 只检查 JS/TS 代码
npm run stylelint       # 只检查样式代码

# 类型检查
npm run tsc             # TypeScript 类型检查
```

### 4. Git 提交规范

```bash
# 标准提交格式
git commit -m "feat: 添加用户个人资料页面"
git commit -m "fix: 修复购物车数量计算错误"
git commit -m "docs: 更新开发文档"
git commit -m "style: 统一代码格式"
git commit -m "refactor: 重构用户认证逻辑"

# 使用辅助工具
npm run cz              # 交互式提交
```

### 5. 代码生成技巧

```bash
# 自动生成页面
npm run add

# 生成 TypeScript 类型 (基于 JSON)
# 使用 json2ts.com 网站转换 API 响应为 TS 类型
```

---

## ⚠️ 常见错误和解决方案

### 1. Vetur 冲突问题

**错误现象**: 组件引入报错，Vue 语法高亮异常
**解决方案**:

- 安装 Volar 插件
- 禁用 Vetur 插件 (仅在当前工作区)

### 2. Git 提交被拦截

**错误现象**: `git commit` 提示格式错误
**解决方案**:

- 使用规范的提交格式: `type: description`
- 或使用 `npm run cz` 辅助提交

### 3. 类型定义错误

**错误现象**: TypeScript 类型检查失败
**解决方案**:

- 检查 `src/@types/` 下的类型定义
- 确保导入的 API 响应类型正确
- 使用 `npm run tsc` 检查具体错误

### 4. 页面无法访问

**错误现象**: 页面跳转后显示 404
**解决方案**:

- 检查 `src/pages.json` 中的路径配置
- 确保文件路径和配置路径一致
- 检查文件名是否与文件夹名一致

### 5. 组件未自动导入

**错误现象**: 使用组件时提示未定义
**解决方案**:

- 确保组件放在 `src/components/` 目录下
- 重启开发服务器
- 检查 `src/components.d.ts` 是否正确生成

---

## 📚 参考资源

- [uni-app 官方文档](https://uniapp.dcloud.io/)
- [Vue 3 官方文档](https://v3.cn.vuejs.org/)
- [Pinia 官方文档](https://pinia.vuejs.org/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [UnoCSS 官方文档](https://github.com/unocss/unocss)

---

## 💡 最佳实践总结

1. **代码组织**: 按功能模块划分，保持单一职责
2. **类型安全**: 优先使用 TypeScript，避免 any 类型
3. **代码复用**: 抽离公共逻辑为 hooks 或工具函数
4. **性能优化**: 合理使用 computed、分包加载
5. **错误处理**: 统一的错误处理机制
6. **开发工具**: 充分利用自动化工具提升效率
7. **团队协作**: 遵循统一的代码规范和提交规范

通过遵循以上开发指南，团队成员可以高效、规范地进行项目开发，确保代码质量和项目可维护性。
