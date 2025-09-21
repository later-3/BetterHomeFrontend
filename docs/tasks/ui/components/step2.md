棒，进入 **Step 2：Directus 数据模型设计**。我先给一份**精简而完整的表结构与约束方案**（不写代码），专门满足我们已定的规则（深度≤3、单条至多一种媒体、like/unlike 互斥、顶层分页+子评按需拉等）。确认后我再细化到字段校验/Hook 逻辑。

---

# 2.1 核心集合（Collections）

## A) `comments`（评论主表）

**用途**：同时承载 详情页评论 + 时间轴节点评论；支持 1/2/3 级结构化媒体。

**关键字段**

* 标识/归属

  * `id` (uuid)
  * `author_id` (m2o → users)
  * `target_collection` (string; 枚举：`posts` | `issues` | `issue_nodes` | `notices`)
  * `target_id` (uuid)
* 结构

  * `parent_id` (m2o → comments, 可空)
  * `root_id` (m2o → comments, 顶层评论的 id；顶层自己指向自己)
  * `depth` (int, 1/2/3；由 Hook 计算)
* 内容

  * `text` (string / text, 可空)
  * `media_type` (enum: `none` | `image` | `video` | `audio`)
  * `image_file` (m2o → directus\_files, 可空) + `image_w` `image_h`
  * `video_file` (m2o → directus\_files, 可空) + `video_poster` (m2o → files) + `video_duration`
  * `audio_file` (m2o → directus\_files, 可空) + `audio_duration`
* 计数/状态（冗余，便于列表）

  * `replies_count` (int, 默认0；仅顶层/二级用)
  * `like_count` (int, 默认0)
  * `unlike_count` (int, 默认0)
  * `last_reply_at` (datetime, 子评最新时间；仅顶层/二级用)
  * `status` (enum: `published` | `hidden` | `deleted` | `pending`)
  * `created_at` `updated_at` `deleted_at`

**约束 & 校验（通过 Directus Hooks/Validation）**

* `depth` ∈ {1,2,3}；当 `parent_id` 为空 → depth=1；否则 depth=parent.depth+1（>3 拒绝）。
* **单媒体约束**：`media_type` 与三个 file 字段**一致性检查**；仅允许其中一类非空。
* 文本/媒体校验：大小、时长、格式（与 Step1 限制一致）。
* `root_id`：若 `depth=1` 则设为自身；否则继承 `parent.root_id`。

**索引（性能要点）**

* `(target_collection, target_id, created_at DESC)` → 顶层分页
* `(parent_id, created_at ASC)` → 子评正序
* `(root_id)` → 统计/聚合
* `(like_count DESC)` → 之后做“最热”排序可用

---

## B) `comment_reactions`（评论反应表：like/unlike）

**用途**：记录用户对评论的“赞/踩（unlike）”，**互斥**。

**关键字段**

* `id` (uuid)
* `comment_id` (m2o → comments)
* `user_id` (m2o → users)
* `reaction` (enum: `like` | `unlike`)
* `created_at`

**约束**

* **唯一性**：(`comment_id`, `user_id`) 唯一（同一用户对同一评论仅一条反应记录）。
* Hook/Flow：

  * 插入/更新时，根据新旧 `reaction` **增减** `comments.like_count / unlike_count`；
  * 删除记录时同步扣减对应计数。
  * 采用事务/队列避免竞态。

---

# 2.2 与业务集合的关系

我们不做“多表外键”那种多态关系，直接用**多态指针**：

* `comments.target_collection` + `comments.target_id`
* 允许指向：`posts`（交流圈）、`notices`（公告）、`issues`（事项）、`issue_nodes`（时间轴节点）。

**好处**：一张评论表**通吃所有目标**；查询时用 filter：

* 顶层评论列表：`depth=1 AND target_collection='posts' AND target_id=:id`
* 子评论列表：`parent_id=:comment_id`

---

# 2.3 计数与派生更新（Hooks/Flows）

为了前端分页和列表性能，把高频聚合做成**冗余字段**并在写入时维护。

**在 `comments` 表上的写入 Hooks**

* **before create**：

  * 计算 `depth` / `root_id`；
  * 校验**单媒体约束**与大小/时长；
  * `status` 初始为 `published`（或公告区按需 `pending`）。
* **after create**：

  * 若有 `parent_id`：父评论 `replies_count += 1`，并更新 `last_reply_at = now()`；
  * 顶层/二级的 `replies_count` 只统计“直接子级”。
* **after delete / soft-delete**：

  * 对其父 `replies_count -= 1`（软删也同步扣）；
  * 若删的是最后一条，父的 `last_reply_at` 需要**回溯最新子评时间**（可异步任务补算）。

**在 `comment_reactions` 上的写入 Hooks**

* 插入/更新/删除时，增减目标 `comments.like_count / unlike_count`；保证互斥。

> 注：Directus Flow/Hook 可用 Node 脚本或 SQL 执行；高并发时建议串行队列以防计数漂移。

---

# 2.4 权限与治理（按角色）

* **业主/物业员工**：

  * 读：`status in ('published','hidden' by ACL)`；
  * 写：可创建评论；可对自己评论在 10 分钟内“撤回”（直接 delete）；超时只能请求删除 → 置 `status='deleted'`；
  * 反应：可创建/更新/删除自己的 reaction。
* **管理员/物业经理**：

  * 读写删全权；`hidden/pending` 审核流。
* **黑名单/举报**：

  * 通过额外表 `user_blocks` `reports`（后续 Step6）或利用 Directus 权限过滤器隐藏相互屏蔽内容。

---

# 2.5 校验边界（与 Step1 对齐）

* **文本长度**：≤ 2000 字（后端强校验）。
* **图片**：≤10MB；保存 `w/h`，前端按比例占位；CDN 压缩。
* **视频**：≤100MB / ≤60s；保存 `duration` + `poster`；前端仅封面展示，点击加载。
* **音频**：≤20MB / ≤10min；保存 `duration`。
* **单媒体**：三个 file 字段最多一个非空；`media_type` 必须匹配。
* **深度**：`depth≤3`，超出拒绝。

---

# 2.6 查询口径（为 Step3 的 API 做准备）

* **顶层列表（一级）**

  * Filter：`depth=1 AND target_collection=:tc AND target_id=:tid`
  * Sort：`created_at DESC`（默认）
  * Select：必要字段 + `replies_count` + 简要作者信息
* **子评论（二级+三级）**

  * Filter：`parent_id=:pid`（二级）；`parent_id in (:ids)`（批量拉取）
  * Sort：`created_at ASC`
  * 分页：每次 10 条；返回 `total` 以便展示“展开更多 N 条”
* **反应状态**

  * 可选在同请求中用 `aggregate` 或单独 endpoint 返回“我是否 like/unlike 过”。

---

## 你需要拍板的点（很快）

1. **媒体元数据**：图片/视频/音频的 `duration / w/h / poster`，是否**由后端生成**？（推荐：后端生成/回填，更稳）
2. **删除策略**：超时删除是否一律 `status='deleted'`（墓碑），是否保留文本/媒体还是清空？（推荐：清空媒体与文本，仅保留“已删除”）
3. **审核**：公告区评论是否默认 `pending`？（MVP 可 `published`，后续再开审核）

确认这三点后，我进入 **Step 3：API 合约 & 分页策略落地**（把请求/响应字段、筛选/排序、乐观更新回滚口径一次性定好）。
