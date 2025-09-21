太好了，按**方案 A（多态目标 + 单媒体字段）**，下面给你一份可以直接当文档保存的\*\*《comments 表设计与写入规则》\*\*。内容包含：字段清单（类型/取值/默认/作用）、约束校验、写入/删除动作的具体规则、计数联动、索引与迁移清单。

---

# 《comments 表设计与写入规则》v1

## 1) 表：`comments`

### 1.1 字段清单

| 字段名                 | 类型                        | 必填 | 默认            | 取值/格式                                               | 作用                         |
| ------------------- | ------------------------- | -: | ------------- | --------------------------------------------------- | -------------------------- |
| `id`                | uuid                      |  是 | —             | UUID                                                | 主键                         |
| `author_id`         | m2o → `directus_users.id` |  否 | —             | 用户 ID                                               | 评论作者                       |
| `target_collection` | string (enum)             |  否 | —             | `posts` / `notices` / `issues` / `issue_nodes`（可扩展） | 被评论的目标集合（多态指针之一）           |
| `target_id`         | uuid                      |  否 | —             | 目标记录主键                                              | 被评论的目标记录（多态指针之二）           |
| `parent_id`         | m2o → `comments.id`       |  否 | NULL          | 顶层为空；子评指向父评                                         | 建立层级关系                     |
| `root_id`           | m2o → `comments.id`       |  否 | 自算            | 顶层 = 自己；子评 = 顶层 id                                  | 便于聚合/统计/查询同根树              |
| `depth`             | int                       |  是 | 自算            | 1 / 2 / 3                                           | 层级深度；>3 拒绝                 |
| `text`              | text                      |  否 | NULL          | ≤ 2000 字                                            | 评论文本                       |
| `media_type`        | string (enum)             |  是 | `'none'`      | `none` / `image` / `video` / `audio`                | 媒体类型（与下方文件字段一致性校验）         |
| `image_file`        | m2o → `directus_files.id` |  否 | NULL          | 图片文件 id                                             | 当 `media_type='image'` 时必填 |
| `image_w`           | int                       |  否 | NULL          | 像素宽                                                 | 列表占位/预览                    |
| `image_h`           | int                       |  否 | NULL          | 像素高                                                 | 列表占位/预览                    |
| `video_file`        | m2o → `directus_files.id` |  否 | NULL          | 视频文件 id                                             | 当 `media_type='video'` 时必填 |
| `video_poster`      | m2o → `directus_files.id` |  否 | NULL          | 首帧图                                                 | 列表封面                       |
| `video_duration`    | int                       |  否 | NULL          | 秒                                                   | 展示/点播优化                    |
| `audio_file`        | m2o → `directus_files.id` |  否 | NULL          | 音频文件 id                                             | 当 `media_type='audio'` 时必填 |
| `audio_duration`    | int                       |  否 | NULL          | 秒                                                   | 播放器展示                      |
| `replies_count`     | int                       |  是 | 0             | ≥0                                                  | 直接子级数量（仅顶层/二级有意义）          |
| `last_reply_at`     | datetime                  |  否 | NULL          | ISO 时间                                              | 最近子评时间（顶层/二级）              |
| `like_count`        | int                       |  是 | 0             | ≥0                                                  | 点赞数（由 reactions 派生）        |
| `unlike_count`      | int                       |  是 | 0             | ≥0                                                  | 踩数（由 reactions 派生）         |
| `status`            | string (enum)             |  是 | `'published'` | `published` / `pending` / `hidden` / `deleted`      | 发布/审核/屏蔽/墓碑                |
| `date_created`     | datetime                  |  是 | 系统            | —                                                   | 创建时间（Directus 系统字段，对应 Directus 的 `date_created`） |
| `date_updated`     | datetime                  |  是 | 系统            | —                                                   | 更新时间（Directus 系统字段，对应 Directus 的 `date_updated`） |
| `deleted_at`        | datetime                  |  否 | NULL          | —                                                   | 软删时间（当 `status='deleted'`） |

> 备注：
>
> * 当前 Directus schema 中 `author_id` / `target_collection` / `target_id` / `root_id` 均允许 NULL，需由业务逻辑或 Hook 校验；若要硬约束需进一步调整 schema。
> * **单媒体约束**：`media_type` 与 `image_* / video_* / audio_*` **一致性**（最多只允许一类非空）。
> * 文本可空，媒体可空，但不能 “文本为空且媒体为 none”（避免空评论）。
> * 所有文件均来自 Directus Files（CDN/权限由 Files 控制）。

---

### 1.2 约束与校验（由 Hook/Validation 实施）

1. **层级规则**

   * `parent_id = NULL` ⇒ `depth = 1`，`root_id = self.id`
   * `parent_id != NULL` ⇒ `depth = parent.depth + 1`；如 `depth > 3` **拒绝**
   * `root_id = parent.root_id`

2. **媒体一致性**

   * `media_type='none'` ⇒ 三类文件字段必须全 NULL
   * `media_type='image'` ⇒ 仅 `image_file` 非空，且 `video_* / audio_*` 全 NULL
   * `media_type='video'` ⇒ 仅 `video_file` 非空，允许 `video_poster/video_duration`；其余 NULL
   * `media_type='audio'` ⇒ 仅 `audio_file` 非空，允许 `audio_duration`；其余 NULL

3. **大小/时长**（后端强校验）

   * 文本 ≤ 2000 字
   * 图片 ≤ 10MB（可配）；保存 `image_w/image_h`
   * 视频 ≤ 100MB、≤ 60s（可配）；保存 `video_duration` 和 `video_poster`
   * 音频 ≤ 20MB、≤ 10min（可配）；保存 `audio_duration`

4. **目标存在性**

   * 检查 `target_collection` + `target_id` 在对应集合中是否存在（自定义 Hook 校验，或在创建前由业务层先查）。

5. **状态流转**

   * 创建默认 `status='published'`（公告区如需先审可改为 `pending`）
   * 软删：`status='deleted'`，写入 `deleted_at`，并**清空** `text` 与媒体字段（仅留墓碑）
   * 隐藏：`status='hidden'`（管理员屏蔽；保留内容）

---

## 2) 写入/删除动作与联动

### 2.1 新增（Create）

* **顶层评论（depth=1）**

  * 输入：`author_id, target_collection, target_id, text?, media_type, [media fields…]`
  * Hook：自动设定 `depth=1`, `root_id=self.id`；校验媒体一致性与大小/时长；`replies_count=0`, `like_count=0`, `unlike_count=0`
  * 作用：在详情页/公告/事项/节点下新增一条一级评论

* **子评论（depth=2/3）**

  * 输入：`parent_id`（必填），其他同上
  * Hook：计算 `depth/ root_id`；**父评论** `replies_count += 1`，`last_reply_at = now()`
  * 作用：对一级或二级进行回复；当为二级的子评（depth=3）时，前端以“回复 @xxx …”内联展示

> 失败回滚：若在事务中后续步骤失败（如媒体校验/目标校验），整条创建回滚。

---

### 2.2 删除（Delete）

* **作者撤回（10 分钟内）**

  * 条件：`author_id = current_user` 且 `now - created_at ≤ 10min`
  * 动作：**硬删除**该记录
  * 联动：若有 `parent_id` → 父评论 `replies_count -= 1`；如影响父的 `last_reply_at`，可异步回算为其剩余子评的最大时间

* **超时删除（> 10 分钟）或管理员删除**

  * 动作：**软删除** → `status='deleted'`，`deleted_at=now()`，并**置空 `text` 与媒体字段**（保留 id/层级/计数，以维护楼中楼结构）
  * 联动：不再减少 `replies_count`（保留结构占位），也不再显示媒体/文本

* **屏蔽（隐藏）**

  * 管理员将 `status='hidden'`（可恢复）；前端根据权限判断是否展示“已隐藏”或完全不可见

---

### 2.3 计数与反应（与 `comment_reactions` 协同）

* 点赞/踩行为不直接写入 `comments`，而是写入 `comment_reactions`：

  * 插入/更新/删除 reaction 时，Hook **增减** `comments.like_count / unlike_count`
  * 互斥：同一 `(comment_id, user_id)` 仅一条记录；更新 reaction 值时进行计数迁移
* 计数防漂移：高并发下建议串行队列或数据库函数保证原子性

---

## 3) 索引（建议）

* `idx_comments_target`：(`target_collection`, `target_id`, `created_at DESC`) —— 顶层分页
* `idx_comments_parent`：(`parent_id`, `created_at ASC`) —— 子评正序分页
* `idx_comments_root`：(`root_id`) —— 同根聚合/治理
* `idx_comments_like_hot`：(`like_count DESC`) —— 后续“最热”排序
* 常规：`author_id`, `status`, `created_at`

---

## 4) 迁移清单（从你现有结构到方案 A）

1. **新增字段**：`target_collection`, `target_id`, `parent_id`, `root_id`, `depth`, `media_type`, `image_file/image_w/image_h`, `video_file/video_poster/video_duration`, `audio_file/audio_duration`, `replies_count`, `last_reply_at`, `like_count`, `unlike_count`, `status`, `deleted_at`
2. **数据回填**：

   * 旧数据的 `content_id` ⇒ `target_collection='contents'`（或真实集合名） + `target_id=content_id`
   * 顶层老数据：`parent_id=NULL`, `depth=1`, `root_id=id`
   * 如有旧 `attachments`：按“最多一种且一条”的规则回填到对应媒体字段；超规数据标记人工处理
3. **移除/弃用**：`attachments`（M2M）
4. **建立索引**：见第 3 节
5. **Hook/Flow 实装**：

   * before/after create：层级/媒体校验、父计数 + `last_reply_at`
   * after delete（硬删）：父计数回调；after update（软删）：清空文本与媒体
   * reactions 表的计数联动（另文档定义）

---

## 5) 常见查询口径（为 API 合约做准备）

* **顶层列表（一级）**

  * Filter：`depth=1 AND target_collection=:tc AND target_id=:tid AND status='published'`
  * Sort：`created_at DESC`
  * Select：必要字段 + `replies_count/like_count/unlike_count/author{…}`
* **子评论列表（二级或三级）**

  * Filter：`parent_id=:pid AND status='published'`
  * Sort：`created_at ASC`
  * 分页：`limit=10, offset/ cursor`
* **我的反应状态**

  * `comment_reactions` 查 `(comment_id in :ids AND user_id=:me)` 返回 `reaction` 映射

---

> **完成以上调整后**，前端即可按我们在 Step0/Step1 定的交互去实现：
>
> * 顶层 20/页，子评 10/批；
> * 展开时再请求子评；
> * 媒体为单一类型单一文件；
> * 点赞/踩通过 reactions 联动计数；
> * 撤回（≤10min 硬删）/ 删除（软删墓碑）。

下面把 **`parent_id`** 和 **`root_id`** 的用途与用法讲清楚，直接照着用就行。

# 核心概念

* **`parent_id`**：这条评论的**直接父级**是谁。顶层评论没有父级 ⇒ `NULL`。
* **`root_id`**：这条评论所属的**整棵评论树的根**是谁。顶层评论的 `root_id = 自己的 id`；所有子孙评论的 `root_id` 都等于这条顶层评论的 id。

# 何时写入什么值

* **创建顶层评论**：`parent_id = NULL`，`root_id = 新评论 id`，`depth = 1`。
* **回复顶层（= 二级）**：`parent_id = 顶层 id`，`root_id = 顶层 id`，`depth = 2`。
* **回复二级（= 三级）**：`parent_id = 二级 id`，`root_id = 顶层 id`，`depth = 3`。

# 你能用它们做什么（最常见 8 种用法）

## 1) 拉**顶层**评论列表（分页）

```sql
-- target_* 为方案A的多态目标指针
WHERE depth = 1
  AND target_collection = :tc
  AND target_id = :tid
  AND status = 'published'
ORDER BY created_at DESC
LIMIT :pageSize OFFSET :offset
```

用途：详情页首次进入时的主列表（我们定的 20 条/页）。

## 2) 点开“展开 N 条回复”时，拉**某条的直接子评**

```sql
WHERE parent_id = :comment_id
  AND status = 'published'
ORDER BY created_at ASC
LIMIT :limit OFFSET :offset   -- 我们定的 10 条/批
```

用途：二级/三级的分页加载与展示。

## 3) 一次性取**同一根**下的所有层级（治理/后台工具）

```sql
WHERE root_id = :top_comment_id
ORDER BY depth ASC, created_at ASC
```

用途：后台审核、批量导出、统计，或前端需要把整棵树拿来做搜索/定位。

## 4) 统计某条顶层的**直接子评数量**与最近回复时间

* 写入时维护冗余：创建/删除子评时更新父的 `replies_count += 1/−= 1`，`last_reply_at = NOW()`（删除后可异步回算）。
* 展示时无需聚合：直接读 `replies_count / last_reply_at`。

## 5) 快速判断**层级关系**与限制深度

* 由 `depth` 控制不可超过 3；
* `parent_id` 判定“是不是对二级的回复”；
* `root_id` 判定“是否同一楼层”。

## 6) 删除/撤回时的**联动**

* **硬删**（作者 10 分钟内撤回）：如果被删的有 `parent_id`，把**父**的 `replies_count -= 1`；必要时回算 `last_reply_at`。
* **软删**（超时或管理员）：设 `status='deleted'` 并清空文本/媒体；不改 `replies_count`，保留楼层结构完整性。
* 无论哪种，`root_id` 都不变，便于后续统计。

## 7) 前端**展开/收起状态**与“锚点定位”

* 展开：点击父评 → 用 `parent_id = 父id` 拉子评；缓存结果，重复展开不重拉。
* 从通知跳转到某条子评（给了 `comment_id`）：

  1. 先查这条的 `root_id`、`parent_id`；
  2. 确保顶层列表中包含 `root_id`（滚动到它），并展开对应父评；
  3. 在父评的子评列表里滚动定位到 `comment_id` 并高亮。
     依赖 `root_id` 才能一步命中“所属哪一楼”。

## 8) 常用索引（配合查询）

* `(target_collection, target_id, created_at DESC)`：顶层分页
* `(parent_id, created_at ASC)`：子评分页
* `(root_id)`：同根查询/统计

# DO / DON’T（落地须知）

* ✅ **所有子评**都把 `root_id` 写成**顶层 id**（而不是父 id）；这样“同根查询/统计”才是 O(1) 筛选。
* ✅ **任何列表**都只按需要拉：顶层 20/页；子评点击展开再拉 10/批；并缓存。
* ✅ **互斥播放**、**滚动暂停**等与 `parent_id/root_id` 无关，但“展开后定位某条”要用到这两个字段。
* ❌ 不要用 `root_id = parent_id`（这是常见误用，会导致三级评论被分到“错误根”）。
* ❌ 不要靠聚合实时数 `COUNT(*)` 来显示子评数量——用我们维护的 `replies_count`，更快更稳。

# 小例子（直观看一眼）

```
A 顶层(id=100)         parent_id=NULL  root_id=100  depth=1
└─ B 二级(id=101)      parent_id=100   root_id=100  depth=2
   ├─ C 三级(id=102)   parent_id=101   root_id=100  depth=3
   └─ D 三级(id=103)   parent_id=101   root_id=100  depth=3
└─ E 二级(id=104)      parent_id=100   root_id=100  depth=2
```

* 展开 A 的子评：`WHERE parent_id=100` → 得到 B、E
* 展开 B 的子评：`WHERE parent_id=101` → 得到 C、D
* 整棵树：`WHERE root_id=100` → A、B、C、D、E

这样，你就能同时满足：

* **顶层分页快**（按 `target_*` + `depth=1`）
* **子评加载轻**（`parent_id` 维度按需拉）
* **治理/统计方便**（`root_id` 一键聚合）
