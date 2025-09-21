太好了！你已经把 `comments` 表字段建好了。下面给你一份\*\*“把评论系统跑起来还差什么”\*\*的落地清单——聚焦 Directus 的 **Flows / Hooks**、权限、索引、UI 配置与联调验收。按这个清单完成后，就算“`comments` 表功能完成可用（MVP）”。

---

# 一、必须补充的 Flows / Hooks（MVP 版）

> 说明：先用 **Flows** 就能跑；后续追求强一致性再迁到 **自定义 Hook（扩展）**。每条都写了触发条件、要做的校验/写入、为什么需要。

## F1. Before Create（comments）——层级 & 目标 & 媒体校验

* **触发**：Create on `comments`（前置）
* **做什么**

  1. **层级计算**

     * `if !parent_id` → `depth = 1`，`root_id = null（占位）`
     * `if parent_id` → 读取父评论，`depth = parent.depth + 1`；若 `depth > 3` → **Fail**；`root_id = parent.root_id`
  2. **目标存在性**

     * 根据 `target_collection + target_id` 到对应集合查一条；不存在 → **Fail**（避免挂到已删目标）
  3. **单媒体一致性**

     * `media_type='none'` → 三组媒体字段都必须为空
     * 其余各类型 → **仅该类型字段可非空**，其余组 **必须为空**
  4. **内容不能为空**

     * `text` 为空 且 `media_type='none'` → **Fail**
  5. **大小/时长限制（可做简单校验）**

     * 文本长度、图片/视频/音频尺寸与时长的上限（超限 → Fail）

> **作用**：保证数据正确性；自动算 `depth/root_id`；拦截非法目标与“多媒体同时上传”问题。

---

## F2. After Create（comments）——父计数 & 根回填

* **触发**：Create on `comments`（后置）
* **做什么**

  1. **回填 `root_id`**（仅顶层）

     * 若 `parent_id` 为空 → `PATCH` 当前记录 `root_id = id`
  2. **父评论联动**（仅子评）

     * `PATCH parent`：`replies_count += 1`，`last_reply_at = NOW()`

> **作用**：列表直接读计数/最近回复时间；顶层完整 `root_id` 便于同根查询。

---

## F3. Delete/Update（comments）——撤回/软删

> 建议统一走 Update 实现“软删”；作者 10 分钟内撤回允许硬删。

* **触发 A（撤回）**：Delete on `comments`（前置/后置都需要）

  * **条件**：`author_id = current_user 且 now - created_at ≤ 10min`
  * **做什么**（硬删）：

    * 真删除该记录；
    * 若有 `parent_id` → `PATCH parent`：`replies_count -= 1`；
    * 若删的是父的“最新子评”，`last_reply_at` 需回溯（可异步任务实现，见 F6）

* **触发 B（软删）**：Update on `comments`（前置）

  * **条件**：管理员删除 或 超过 10 分钟
  * **做什么**：

    * 设置 `status='deleted'`，`deleted_at = NOW()`；
    * **清空** `text` 与所有媒体字段（`media_type='none'`，三组文件字段置空）
    * **不**改 `replies_count`（保留楼中楼结构完整性）

> **作用**：满足“撤回 vs 墓碑”的产品规则，计数不乱。

---

## F4. Reactions 联动（comment\_reactions）——like/unlike 互斥 & 计数维护

* **触发**：Create / Update / Delete on `comment_reactions`
* **前置约束**：唯一索引 `(comment_id, user_id)`（防重复）
* **做什么**

  1. **互斥**：

     * 新建 `like` 时如已存在 `unlike` → 先改成 `like`（或先删后插）；反之亦然
  2. **计数**：

     * Create：目标 `comments.like_count` 或 `unlike_count` **+1**
     * Update：`like → unlike`：`like_count −1`，`unlike_count +1`（反之亦然）
     * Delete：对应计数 **−1**

> **作用**：把热门/冷门计数冗余到 `comments`，列表渲染快且无需聚合。

---

## F5. 安全与风控（建议最少做 2 条）

* **文本净化/关键词**：Create/Update 前做基础清洗与敏感词校验（命中 → Fail 或 `status='pending'`）
* **频率限制**：每人每分钟 ≤5 条；带媒体 ≤2 条（可以在业务层做，也能用 Flow + Redis/自增表实现简版）

---

## F6.（可选）last\_reply 回溯任务

* **触发**：Scheduled Flow（定时任务），或 After Delete（异步触发队列）
* **做什么**：扫描被硬删记录的父评论，计算其剩余子评的最大 `created_at` 回填到 `last_reply_at`
* **作用**：保证“最近回复时间”准确（删掉最新子评后的修正）

---

# 二、字段与权限配置（无需写代码）

1. **字段默认与验证**

   * `status` 默认 `published`
   * `replies_count/like_count/unlike_count` 默认 `0`
   * `text` 最大长度（如 2000）
   * `target_collection` / `media_type` 配置为 **select(choices)**

2. **关系与删除策略**

   * `parent_id` / `root_id` / `*_file` 配置为 m2o
   * **on delete**：建议 **restrict**（或 `set null`，不要 cascade），避免误删整棵树/媒体

3. **显示条件（后台 UI 易用）**

   * `media_type='image'` 时仅显示 `image_*`；`video` 时仅显示 `video_*`；`audio` 同理
   * `status='deleted'` 时隐藏 `text` 与媒体字段（或只管理员可见）

4. **角色权限**（最低限度）

   * 业主/普通用户：Create 自己的评论；10 分钟内 Delete（或 Update 为“撤回”动作）；Read `published/hidden(部分)`
   * 管理员：所有 Read/Update/Delete；可设置 `status`
   * Reactions：任意用户对 `comment_reactions` 的 CRUD（受唯一索引限制）

---

# 三、索引（性能关键）

* `idx_comments_target (target_collection, target_id, created_at DESC)` —— 顶层分页
* `idx_comments_parent (parent_id, created_at ASC)` —— 子评分页
* `idx_comments_root (root_id)` —— 同根查询/治理/统计
* `idx_comments_like_hot (like_count DESC)` —— 预留“最热”排序
* `comment_reactions`：唯一索引 `(comment_id, user_id)`

---

# 四、联调与验收清单（跑通即完成）

1. **创建顶层评论**

   * 不传 `parent_id` → 自动 `depth=1 / root_id=自己`；状态 `published`；计数为 0

2. **创建二级/三级评论**

   * 传 `parent_id` → 自动 `depth=2/3 / root_id=顶层 id`；父 `replies_count+1`、`last_reply_at` 更新时间
   * 传错媒体组 → 被 Flow 拦截

3. **删除**

   * 作者 ≤10 分钟：硬删；父计数 −1（必要时回溯 last\_reply）
   * 超时/管理员：软删；文本与媒体清空、`status='deleted'`

4. **like/unlike**

   * 同一用户互斥；切换能看到计数 +/− 正确变化；删除 reaction 后计数回退

5. **分页**

   * 顶层：带 `target_*` + `depth=1`，按 `created_at DESC`，每页 20
   * 子评：`parent_id=xxx`，按 `created_at ASC`，每次 10

6. **安全**

   * 敏感词/超限媒体被拒
   * 频率限制生效（至少后端日志有证据）

---

# 五、何时考虑把 Flow 改成 Hook（工程化升级）

* **并发量上来**、对 `replies_count/last_reply` 一致性要求更高：

  * 用 **自定义 Hook** 在**同一事务**里完成 “创建子评 + 更新父计数/时间”。
* **复杂风控**（黑名单、分级审核、外部内容服务）：

  * Hook 或网关服务中处理，再写入 Directus。
* **last\_reply 回溯**：做成数据库函数/后台任务，保证极端情况下也准确。

---

## 一句话总结

* 你现在“字段都有了”，只要按上面的 **F1–F4** 四个 Flow 做完（外加索引/权限/UI 配置）→ 评论功能就已经**可上线**。
* 想更严谨：再补 **F6 定时回溯** 或直接把关键流程迁到 **自定义 Hook（事务内）**。

需要的话，我可以把 **F1–F4 的 Flow 节点配置表**（每个节点的输入/条件/设置字段）逐条写出来，照着在 Directus Admin 里点就能完成。
