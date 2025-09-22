这里把我们之前定下的「评论分页 & 子评论展开」策略快速回顾一下（就是现在要实现的准则）：

# 顶层评论（详情页主列表）

* **每页条数**：20
* **排序**：`created_at DESC, id DESC`（稳定排序，避免并列抖动）
* **翻页方式**：**cursor**（服务端返回 `next_cursor`；前端带上继续拉更旧的一页）
* **返回**：`items[]`, `has_more`, `next_cursor`，每条含 `replies_count`, `last_reply_at`, `like_count`, `unlike_count`

# 子评论（点“展开回复”时）

* **首次展开**：只拉 **3 条**（做预览）
* **继续展开**：每次 **10 条**
* **展示顺序**：前端按 **时间正序（ASC）** 展示，便于阅读

  * 实现口径：可以服务端按 `created_at DESC` 返回最近的3/10条，前端再**反转**呈现；继续加载用“上一页最旧一条”的位置做 **cursor** 拉更旧的
* **翻页隔离**：**每个父评论**维护各自的 `cursor/has_more`，互不影响
* **折叠规则**：预览 3 条之外显示“展开 N 条回复”；二级下再展开可见三级（最大到 3 层）

# 前端交互/性能

* **触底阈值**：列表滚动到**底部前 20%** 开始预取下一页（顶层和每个子列表都适用）
* **去重缓存**：用 `id` 去重；为顶层列表和每个父评论分别缓存已加载集合与 `cursor`
* **懒加载**：仅在用户点击“展开”时才请求该父评论的子列表

# 其他约束

* **最大层级**：`depth ≤ 3`
* **计数冗余**：依赖 `replies_count / last_reply_at`，避免前端聚合
* **接口上限**：服务端限制 `limit` 最大值（如 ≤50），防滥用

需要的话，我可以把这两类接口的**请求/响应示例**（参数名、示例 JSON、错误码）写出来，直接当 API 合约用。

---

## 当前任务：轻量评论组件实现计划

### 阶段一 · 数据适配

| 目标 | 将 `/items/comments` 原始数据转换为组件消费格式 |
| --- | --- |
| 子任务 |
| 1. 定义 `CommentEntity`（`id`, `author`, `created_at`, `text`, `attachments`, `like_count`, `my_reaction`, `reply_count` 等） |
| 2. 编写 `mapCommentResponseToEntity`：
   * 解析 `author_id.*` 组装姓名头像
   * 根据 `attachments.directus_files_id.type` 分类为 image / video / audio / other
   * 预留 `my_reaction` 字段（后续接 reactions） |
| 3. 邻居详情页通过 adapter 保存 `commentsList` |
| 验证 |
| * 控制台打印转换结果，字段完整，无 `undefined`
* 多附件 / 空附件评论均正常 |

### 阶段二 · 轻量 CommentItem（展示）

| 目标 | 复刻 `CommentItem` 布局但只保留必要字段 |
| --- | --- |
| 子任务 |
| 1. 新建 `BasicCommentItem.vue`（头像、昵称、时间、正文、附件渲染、点赞数、回复按钮） |
| 2. 邻居详情页引用该组件列表展示 |
| 3. 组件 `emit('like')` 与 `emit('reply')`，父层暂时打印日志 |
| 验证 |
| * UI 与设计稿对齐
* 点赞/回复按钮冒泡事件触发
* 多媒体附件展示正常 |

### 阶段三 · 点赞交互

| 目标 | 接入 `comment_reactions` flow，实现点赞/取消 |
| --- | --- |
| 子任务 |
| 1. 调用 `POST /items/comment_reactions` / `DELETE` 完成点赞切换 |
| 2. 更新 adapter：根据 reactions 判断 `my_reaction`
| 3. 本地乐观更新 `like_count`，失败回滚并提示 |
| 验证 |
| * 点赞后 `like_count` +1，取消 -1
* 接口失败时状态回退并显示错误 |

### 阶段四 · 回复功能

| 目标 | 支持发表二级评论 |
| --- | --- |
| 子任务 |
| 1. 轻量回复输入框（引用/精简 `CommentInput`）
| 2. `POST /items/comments` (`parent_comment_id`) 创建回复
| 3. 刷新目标评论的 `replies` 或本地插入 |
| 验证 |
| * 点击“回复”弹出输入框并可取消
* 提交成功后列表出现新回复，`replies_count` +1 |

### 阶段五 · 分页 / 懒加载（延续原分页策略）

依照前述顶层 cursor + 子评论懒加载设计，在基础功能稳定后迭代。

> 完成每个阶段后请更新本文档并在调试面板记录验证步骤，方便团队跟进。
