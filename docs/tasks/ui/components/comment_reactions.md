对，我们还没把 `comment_reactions` 的规范单独成文。这里给你一份可直接入库的**精简版设计说明**（字段、约束、索引、Flow/Hook、API 口径）。照这个做就齐活了。

---

# 《comment_reactions 表设计与联动规则》v1

## 1) 创建集合与字段

先在 Directus 中创建 `comment_reactions` 集合，再按下表补齐字段（系统会自动附带 `date_created/date_updated`）。

| 字段名          | 类型                        | 必填 | 默认 | 说明                         |
| ------------ | ------------------------- | -: | -- | -------------------------- |
| `id`         | uuid                      |  是 | —  | 主键                         |
| `comment_id` | m2o → `comments.id`       |  是 | —  | 目标评论                       |
| `user_id`    | m2o → `directus_users.id` |  是 | —  | 进行反应的用户                    |
| `reaction`   | string(enum)              |  是 | —  | `like` \| `unlike`（互斥二选一）      |
| `date_created` | datetime                |  是 | 系统 | 创建时间                       |
| `date_updated` | datetime                |  是 | 系统 | 更新时间                       |

> 可选：保留 `source`（客户端来源）、`client_request_id`（幂等）字段，视需要再加。

创建集合时就添加唯一约束（`comment_id`, `user_id`），避免在 Flow 内部手动处理重复插入报错。

## 2) 约束与索引

* **唯一约束**：(`comment_id`, `user_id`) 唯一
  目的：同一用户对同一评论**只能有一条**反应记录（要么 like 要么 unlike）。
  > Directus REST 暂不支持直接创建组合索引，可通过数据库迁移或 CLI 完成；当前在 Flow 中已经做了互斥校验，依旧建议后续补上物理索引。
* **索引**：

  * `idx_reactions_comment`：`comment_id`（批量查目标评论的所有反应）
  * `idx_reactions_user`：`user_id`（查用户历史）
* **外键删除策略**：`comment_id` → **cascade delete**（评论硬删时自动清理反应）；`user_id` → restrict 或 cascade（看用户删除策略）。

## 3) 与 `comments` 的计数联动（Flow/Hook）

> 目标：保证 `comments.like_count / unlike_count` 与实际反应保持一致，并实现互斥。

### F-R1. Before Create（comment\_reactions）——互斥检查

1. `item-read` 查询同 `(comment_id, user_id)` 的记录。
2. 若不存在 → 正常走 `create`。
3. 若存在且 reaction 相同 → `throw-error` 404/409，前端可据此视为幂等成功。
4. 若存在且不同 → 先 `item-update` 修改旧记录的 `reaction`，然后 `throw-error` 409 中断原 `create`（避免唯一键冲突）。这样主流程只保留一条记录，后续 After Update Flow 负责调整计数。

### F-R2. After Create（comment\_reactions）——计数 +1

* 若 `reaction='like'` → `PATCH comments.like_count += 1`
* 若 `reaction='unlike'` → `PATCH comments.unlike_count += 1`

### F-R3. Before Update（comment\_reactions）——切换反应

* 对比旧值与新值：

  * `like → unlike`：`comments.like_count −=1`，`unlike_count +=1`
  * `unlike → like`：`comments.unlike_count −=1`，`like_count +=1`
  * 相同则不动。

### F-R4. After Delete（comment\_reactions）——计数 −1

* 根据被删除记录的 reaction：对应计数 −1。

> 说明：上述流程在 Flow 中需要用 `item-read` + `item-update` + `throw-error` 拼接。若反应量大或并发要求高，建议改用 Hook 在单事务内处理，以免计数漂移。

## 4) 权限建议

* 普通用户：`create`/`update`/`delete` 自己的反应，结合 Flow 做互斥。
* 管理员：可读写全部（治理）。
* 反爬/防抖：

  * 同用户对同评论**1s 冷却**（前端节流 + 后端简单限速可选）。

## 5) API 口径（对前端）

**创建/切换**（like 或 unlike）

* `POST /items/comment_reactions`

  ```json
  { "comment_id": "<uuid>", "reaction": "like" }  // user_id 可由后端用当前用户补齐
  ```

  * 若已有相反记录，按“Before Update”切换并返回最终状态。

**取消反应**

* `DELETE /items/comment_reactions/:id`

  * 或提供语义化端点：`DELETE /comment_reactions?comment_id=...`（服务端按 user\_id 定位那条）

**批量查询“我对这些评论的反应”**（喂给列表渲染）

* `GET /items/comment_reactions?filter[comment_id][_in]=id1,id2,...&filter[user_id][_eq]=me&limit=-1`

> 前端逻辑：点击“赞/踩”→ 乐观更新 → 调 `POST/DELETE`。切换操作直接重复 `POST`，服务端 Flow 会查询旧记录并走更新分支。

## 6) 联调验收清单

1. **首次点赞**：`like_count` +1；再点“赞”不应再 +1。
2. **切换到“踩”**：`like_count −1`，`unlike_count +1`。
3. **取消“踩”**：`unlike_count −1`。
4. **同一用户重复请求**：不应导致计数错乱（唯一键 + Flow/Hook 生效）。
5. **并发测试**（可后置）：同一评论快速连点 like/unlike，计数最终正确。

---

### 一句话总结

* `comment_reactions` = 轻量“用户×评论”的互斥状态表；
* 唯一键保证“一人一条”；
* Flow/Hook 负责把互斥与增减计数做对；
* 前端只管“设为 like / unlike / 取消”，其余交给服务端处理即可。

需要的话，我可以继续给你“**Flows 的中文界面逐步配置**（R1–R4 四个流程）”，就像我们给 `comments` 的 F1/F2 那样逐步点。
