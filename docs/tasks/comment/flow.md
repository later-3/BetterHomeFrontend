# Directus Flow 自动化评论统计维护

## 项目概述

通过创建 Directus Flow 自动维护评论系统的统计字段，减少前端业务逻辑复杂度，提升数据一致性和系统可维护性。

## 字段维护策略

按字段分别创建独立的 Flow，每个字段有明确的触发条件和处理逻辑，便于维护和调试。

### 目标字段清单
- `replies_count` - 评论回复数量
- `last_reply_at` - 最后回复时间  
- `deleted_at` - 软删除时间戳

### 已完成字段
- ✅ `like_count` - 点赞数量（已通过现有机制实现）
- ✅ `unlike_count` - 踩数量（已通过现有机制实现）

---

## Flow 设计方案

### 触发时机分析

经过分析，需要维护的字段可以归类为2个触发时机：

| 触发事件 | 影响字段 | 处理逻辑 |
|----------|----------|----------|
| **comments.items.create** | replies_count, last_reply_at | 更新父评论统计 |
| **comments.items.delete** | replies_count, last_reply_at, deleted_at | 软删除 + 更新父评论统计 |

### Flow 设计策略

采用**按触发时机分组**的方式，创建2个 Flow，每个 Flow 处理多个相关字段：

---

## Flow 实施方案

### Flow 1: 评论创建时统计更新

#### 目标字段
- `replies_count` - 父评论回复数量 +1
- `last_reply_at` - 父评论最后回复时间更新

#### Flow 配置
| 配置项 | 值 |
|--------|-----|
| **名称** | `Comment Created - Update Parent Stats` |
| **触发器** | `Event Hook - comments.items.create` |
| **触发条件** | `parent_comment_id IS NOT NULL` |
| **状态** | Active |

#### 操作序列
| 步骤 | 操作类型 | 目标 | 逻辑 |
|------|----------|------|------|
| **Op 1** | Condition | 检查条件 | `$trigger.payload.parent_comment_id != null` |
| **Op 2** | Read Item | 查询父评论 | `comments/${parent_comment_id}` |
| **Op 3** | Update Item | 更新回复数 | `replies_count = current + 1` |
| **Op 4** | Update Item | 更新回复时间 | `last_reply_at = $now` |

#### API 实现
```bash
# 创建 Flow
curl -X POST "http://localhost:8055/flows" \
  -H "Authorization: Bearer hm945LuZqtC9legpJsIc085ymelM6TTo" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Comment Created - Update Parent Stats",
    "icon": "chat_bubble_outline",
    "color": "#2196F3",
    "status": "active",
    "trigger": "event",
    "accountability": "all",
    "options": {
      "type": "action",
      "scope": ["items.create"],
      "collections": ["comments"]
    }
  }'
```

#### 验收标准
- ✅ 创建回复时父评论 `replies_count` 正确 +1
- ✅ 父评论 `last_reply_at` 更新为当前时间
- ✅ 顶级评论创建时不触发此 Flow
- ✅ Flow 执行日志显示成功

#### 注意事项
- ⚠️ 避免循环触发：更新操作不应触发 create 事件
- ⚠️ 处理父评论不存在的异常情况

---

### Flow 2: 评论删除时统计更新

#### 目标字段
- `deleted_at` - 设置软删除时间戳
- `replies_count` - 父评论回复数量 -1
- `last_reply_at` - 重新计算父评论最后回复时间

#### Flow 配置
| 配置项 | 值 |
|--------|-----|
| **名称** | `Comment Deleted - Soft Delete and Update Stats` |
| **触发器** | `Event Hook - comments.items.delete` |
| **触发条件** | 无条件触发 |
| **状态** | Active |

#### 操作序列
| 步骤 | 操作类型 | 目标 | 逻辑 |
|------|----------|------|------|
| **Op 1** | Update Item | 软删除标记 | `deleted_at = $now` |
| **Op 2** | Condition | 检查父评论 | `$trigger.payload.parent_comment_id != null` |
| **Op 3** | Read Item | 查询父评论 | `comments/${parent_comment_id}` |
| **Op 4** | Update Item | 更新回复数 | `replies_count = current - 1` |
| **Op 5** | Read Items | 查询剩余回复 | 获取最新回复时间 |
| **Op 6** | Update Item | 更新回复时间 | `last_reply_at = latest_reply_time` |

#### 验收标准
- ✅ 删除操作不会真实删除记录
- ✅ `deleted_at` 字段正确设置为删除时间
- ✅ 父评论 `replies_count` 正确 -1
- ✅ 父评论 `last_reply_at` 重新计算正确

#### 注意事项
- ⚠️ 需要阻止 Directus 的默认删除行为
- ⚠️ 级联处理：删除父评论时子评论的处理



---

## 实施计划

### 环境准备
#### 任务1：权限验证
```bash
# 验证 admin token
curl -H "Authorization: Bearer hm945LuZqtC9legpJsIc085ymelM6TTo" \
  "http://localhost:8055/users/me"

# 检查现有 Flow
curl -H "Authorization: Bearer hm945LuZqtC9legpJsIc085ymelM6TTo" \
  "http://localhost:8055/flows"
```

#### 任务2：数据结构确认
```bash
# 检查 comments 表字段
curl -H "Authorization: Bearer hm945LuZqtC9legpJsIc085ymelM6TTo" \
  "http://localhost:8055/collections/comments/fields"

# 检查 comment_reactions 表字段  
curl -H "Authorization: Bearer hm945LuZqtC9legpJsIc085ymelM6TTo" \
  "http://localhost:8055/collections/comment_reactions/fields"
```

### 实施顺序
1. **第1天**: 环境准备 + Flow 1 (评论创建统计)
2. **第2天**: Flow 2 (评论删除统计) 
3. **第3天**: 整体测试和优化

---

## 实施计划

### 时间安排
- **第1天**: 阶段一 - 环境准备与验证
- **第2天**: 阶段二 - 核心统计 Flow 创建  
- **第3天**: 阶段三 - 软删除 Flow 创建
- **第4天**: 阶段四 - 高级功能和优化
- **第5天**: 整体测试和文档完善

### 里程碑
1. **M1**: 环境验证完成，测试数据就绪
2. **M2**: 评论统计自动更新正常工作
3. **M3**: 点赞统计自动更新正常工作  
4. **M4**: 软删除功能正常工作
5. **M5**: 所有功能集成测试通过

## 风险控制

### 主要风险
1. **数据一致性风险**: 并发操作导致统计错误
2. **性能风险**: Flow 执行影响系统响应速度
3. **循环触发风险**: Flow 之间的相互触发
4. **数据丢失风险**: Flow 配置错误导致数据异常

### 缓解措施
1. **分阶段实施**: 逐步创建和测试每个 Flow
2. **充分测试**: 每个阶段完成后进行全面测试
3. **备份机制**: 实施前备份所有相关数据
4. **回滚计划**: 准备快速回滚到原始状态的方案
5. **监控告警**: 实时监控 Flow 执行状态

## 验收标准

### 功能验收
- [ ] 创建回复时父评论统计正确更新
- [ ] 点赞/取消点赞时统计正确更新
- [ ] 删除评论时软删除正常工作
- [ ] 多层嵌套评论统计正确
- [ ] 并发操作时数据一致性保证

### 性能验收  
- [ ] Flow 执行时间 < 500ms
- [ ] 系统响应速度无明显影响
- [ ] 大量数据时性能稳定

### 稳定性验收
- [ ] 连续运行24小时无异常
- [ ] 异常情况自动恢复
- [ ] 错误日志完整可追踪

## 后续维护

### 监控指标
- Flow 执行成功率
- Flow 执行平均耗时  
- 统计数据准确性
- 系统性能影响

### 维护计划
- 每周检查 Flow 执行日志
- 每月验证统计数据准确性
- 季度性能优化评估
- 年度架构升级规划

---

> **注意**: 本文档将在实施过程中持续更新，记录实际执行情况和遇到的问题。