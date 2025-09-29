# 注册 / 登录 集成与问题总结

## 架构基线
- **TypeScript 接口**：所有 Directus 数据类型来自自动生成的 `src/@types/directus-schema.d.ts`。任何 API 交互都应引用这些类型，避免手写 `any`。
- **Directus SDK 封装**：统一通过 `src/utils/directus.ts` 出口获取客户端，使用 `createCollectionApi`、`registerDirectusUser`、`updateMe` 等封装，避免在业务代码里直接拼 REST URL。
- **Pinia 集成**：`src/store/user.ts` 是我们唯一的用户状态来源，负责登录、登出、资料刷新、上下文加载（社区/楼栋）和 token 持久化。页面只能通过 `useUserStore` 读取或触发动作。

## Pinia 使用要点
1. **登录后刷新资料**：`login()` 内部已经调用 `fetchProfile()` 与 `fetchContext()`；页面只需关注 `profile`、`community`、`building` 等状态。
2. **更新用户信息**：任何资料更新（头像、社区等）都应调用 `updateMe` 或 `fetchProfile()`，不要直接修改 ref。
3. **跨页面共享**：`storeToRefs(useUserStore())` 在登录页 / 注册页 / 个人中心等所有场景保持一致，避免重复创建 store 实例。

## Directus SDK 封装实践
- `registerDirectusUser(email, password, options)` 走 `/auth/register`，由 Directus 自动赋默认角色。
- 登录后使用 `updateMe(payload)` 补齐 `first_name`、`last_name`、`status`、`community_id`、`building_id`、`user_type`、`phone` 等；上传头像后依然调用 `updateMe({ avatar })`。
- `communitiesApi` / `buildingsApi` 负责读取基础信息，所有级联数据都通过这两个 API 构建。
- `uni-fetch.ts` 已处理 204/205 等无 body 场景，避免再次出现 “Response with null body” 的异常。

## 注册 / 登录 实现流程
1. **注册表单**：用户名 + 密码 + 电话 + 小区 / 楼栋级联 + 头像。用户名会自动补全为合法邮箱 `username@test.com`，密码必填，电话可选。
2. **注册接口**：`registerDirectusUser` 创建账号；Directus 后台需开启 Public Registration 并设置默认角色。
3. **登录 + 补写**：注册成功后立即登录，随后通过 `updateMe` 写回社区、楼栋、联系电话、头像等字段，完成后刷新 Pinia 状态。
4. **默认头像**：如果未选择头像，使用 `src/static/avatar-default.png`；个人中心和登录页都会引用该默认图。

### 遇到的问题 & 解决方案
| 问题 | 原因 | 解决方案 |
| --- | --- | --- |
| 注册后无法登录 (`INVALID_CREDENTIALS`) | `/auth/register` 默认创建 `invited/unverified` 用户 | 后台关闭邮箱验证或在登录后立即 `updateMe({ status: 'active' })` |
| 403 Forbidden (`/roles`, `/users`) | 普通用户无权限访问核心集合 | 统一改为 `registerDirectusUser` + `updateMe`，避免直接调用 `/roles` `/users` |
| `Response with null body status` | `uni.request` 处理 204/205 状态仍拼 body | 在 `uni-fetch.ts` 中针对 204/205/304 返回 `new Response(undefined, …)` |
| 级联组件右侧不显示子项 & `rect` 报错 | uView 多列模式依赖 `u-tabs`，在 H5/Vite 下 `rect` 读取失败 | 改用单列模式（`header-direction="column" :options-cols="1"`），并手动 refresh selection |
| 默认邮箱校验不过 | 用户仅输入昵称 | 使用 `buildEmailFromUsername` 统一补全 `@test.com` |

## 级联选择实践
- 级联数据在注册页开场通过 `communitiesApi`、`buildingsApi` 获取，构造 `{ value, label, children }` 结构。
- 打开弹窗前会回填默认选中值（优先上次选择，否则默认首个小区/楼栋）。
- 由于 H5 端 `optionsCols=2` 会触发 `rect` 异常，当前保持单列步骤布局；如需双列展示，建议在 Directus 官方 CLI 环境测试或手动实现左右列表。

## 后续开发指引
1. 新增页面或功能时，前端状态仍应通过 Pinia 和 Directus 封装交互，禁止散落 `uni.request`。
2. 接口字段若有新增，需先更新 Directus schema（或 regenerate 类型），再在前端引用类型字段。
3. 所有登录态相关操作（更新状态、持久化 token、权限判断）都集中在 `userStore` 内处理，页面只使用 store 暴露的动作/计算属性。
4. 代码中统一使用 `USERNAME_SUFFIX`，避免硬编码邮箱后缀。

## 参考资源
- Pinia 用户 store：`src/store/user.ts`
- Directus 封装：`src/utils/directus.ts`
- 注册 / 登录页面：`src/pages/profile/register.vue`、`src/pages/profile/login.vue`
- 级联示例与 uView 使用指南：`docs/uview_docs/uview-plus-usage-guide.md`
