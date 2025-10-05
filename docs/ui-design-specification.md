# BetterHome UI 设计规范

> 基于 Material Design 3、Apple HIG 和业界最佳实践制定
> 版本: 1.0.0
> 最后更新: 2025-01-04

---

## 📐 一、基础系统

### 1.1 设计原则

- **8pt 网格系统**: 所有间距和尺寸基于 8 的倍数
- **单一职责**: 每一层只负责一个定位维度
- **令牌化管理**: 使用设计令牌统一管理设计决策
- **对齐一致性**: 同类元素严格左对齐

### 1.2 Spacing Scale（间距比例尺）

```yaml
基础单位: 8px

间距令牌:
  space-050: 4px    # 0.5x - 紧密元素（图标↔文字、head↔body padding）
  space-100: 8px    # 1x   - 小间距（标签之间、head↔body总间距）
  space-200: 16px   # 2x   - 标准间距 ⭐ 最常用（卡片间距）
  space-300: 24px   # 3x   - 中等间距（区块分隔）
  space-400: 32px   # 4x   - 大间距（页面级）
  space-500: 40px   # 5x   - 超大间距
```

### 1.3 Typography Scale（字体比例尺）

```yaml
字号系统:
  caption:     12px  # 辅助文字、标签
  body:        14px  # 正文、描述
  body-large:  15px  # 用户名、次要标题
  title:       17px  # 卡片标题
  headline:    20px  # 页面标题

字重:
  regular:     400
  medium:      500
  semibold:    600
  bold:        700
```

---

## 📍 二、布局系统

### 2.1 层级结构

```
Screen (视口)
  └─ Page Container     ← padding: 16px
      └─ Section        ← padding: 24px 0
          └─ Component  ← padding: 16px, margin: 0
              └─ Content Element
```

### 2.2 定位规范

#### Page Container（页面容器）

```yaml
职责: 统一控制页面边距
样式:
  padding: 16px
  padding-bottom: 80px  # 为底部导航栏留空间
  background-color: #f4f5f7
```

#### Section（区域容器）

```yaml
职责: 区域分隔和内容分组
样式:
  padding: 24px 0  # 只负责上下间距
  margin-bottom: 16px
  background: #ffffff
  border-radius: 20px
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05)
```

#### Component Container（组件容器）

```yaml
职责: 控制组件间距
样式:
  display: flex
  flex-direction: column
  gap: 16px  # ✅ 使用 gap 而非 margin
```

---

## 🎴 三、工单卡片组件规范

### 3.1 Anatomy（组件解剖）

```
┌─────────────────────────────────────────────┐
│ ← 16px padding →                    ← 16px →│
│ ↑                                            │
│ 16px  [HEAD]                                 │
│ ↓     ┌──────┐  张三        8小时前          │
│       │ 40px │  物业工作人员                  │
│       │ 头像 │  ← 12px gap                   │
│       └──────┘  ↑ 4px gap                    │
│ ────────────────────────────────────────────│ 16px
│       [BODY]                                 │
│       水管爆裂急需维修 (17px bold)            │
│       ↓ 8px                                  │
│       厨房水管突然爆裂... (14px)              │
│       ↓ 8px                                  │
│       ┌────┐ ┌────┐ ┌────┐ ┌────┐           │
│       │100 │ │100 │ │100 │ │视频│            │
│       └────┘ └────┘ └────┘ └────┘ ← 8px gap │
│       ↓ 8px                                  │
│ ────────────────────────────────────────────│ 分隔线
│       [STATUS ROW] ↑ 4px padding-top        │
│       [维修] [高优] 👤李四  📍望京社区        │
│ ↑     ← 8px gap between items               │
│ 16px                                         │
└─────────────────────────────────────────────┘
```

### 3.2 Positioning（定位约束）

```yaml
工单卡片定位:
  # ✅ 核心指标
  card_from_screen: 16px           # 卡片边框距屏幕边缘
  content_from_screen: 32px        # 内容距屏幕边缘 ← 对齐基准线

  # 计算公式
  calculation:
    page_container.padding: 16px
    card.padding: 16px
    total: 32px  # 16 + 16

  # 对齐规则
  alignment_baseline: 32px
  aligned_elements:
    - 头像左边缘
    - 姓名文字左边缘
    - 标题文字左边缘
    - 描述文字左边缘
    - 状态行元素左边缘
```

### 3.3 Sizing（尺寸约束）

```yaml
工单卡片尺寸:
  width: 100%  # 由容器控制
  effective_width: calc(100vw - 32px)  # 屏幕宽度 - 两边各16px
  min_height: 120px
  height: auto  # 基于内容

头像:
  size: 40px × 40px
  shape: circle

媒体项（图片/视频）:
  size: 100px × 100px
  border-radius: 8px
```

### 3.4 Spacing（间距约束）

```yaml
外部间距:
  margin: 0  # ❌ 禁止使用
  gap_between_cards: 16px  # ✅ 由容器 gap 控制

内部间距:
  padding: 16px  # 卡片统一内边距

  # head 内部
  avatar_to_info: 12px           # 头像 → 姓名
  name_to_role: 4px              # 姓名 → 角色

  # head 和 body 分隔
  head_to_body: 8px              # head padding-bottom: 4px + body padding-top: 4px

  # body 内部（统一 gap）
  body_gap: 8px                  # 所有子元素统一间距
    - title_to_description: 8px
    - description_to_media: 8px
    - media_to_status: 8px

  # 媒体网格
  media_items_gap: 8px           # 图片/视频之间

  # 状态行
  status_row_padding_top: 4px    # 与上方内容分隔
  status_row_border_top: 1px solid #f1f5f9
  status_items_gap: 8px          # 标签/元素之间
  icon_to_text: 4px              # 图标 → 文字
```

### 3.5 Typography（字体规范）

```yaml
头部区域:
  submitter_name:
    font-size: 15px
    font-weight: bold
    line-height: 20px

  submitter_role:
    font-size: 12px
    font-weight: regular
    color: #64748b  # 次要文字

  created_time:
    font-size: 12px
    color: #64748b

主体区域:
  title:
    font-size: 17px
    font-weight: bold
    line-height: 22px
    color: #111827

  description:
    font-size: 14px
    font-weight: regular
    line-height: 20px
    color: #64748b
    max-length: 140字  # 超出截断并显示...

状态行:
  tag_text:
    font-size: 12px
    font-weight: medium

  meta_text:
    font-size: 12px
    color: #64748b
```

### 3.6 显示字段规范

```yaml
必须显示:
  - submitter_id: 提交人（头像 + 姓名 + 角色）
  - date_created: 创建时间（相对时间）
  - title: 工单标题
  - description: 描述（最多140字）
  - files: 附件（图片/视频，最多4个）
  - category: 类别标签
  - priority: 优先级标签
  - assignee_id: 负责人
  - community_id: 社区名称

不显示:
  - status: 工单状态（内部流程信息）
  - rating: 评分（适合详情页）
  - feedback: 反馈（适合详情页）
  - deadline: 截止日期（待优化）
```

---

## 🎨 四、颜色系统

### 4.1 基础颜色

```yaml
背景色:
  page_background: #f4f5f7      # 页面背景
  card_background: #ffffff      # 卡片背景

文字颜色:
  text_primary: #111827         # 主要文字（标题）
  text_secondary: #64748b       # 次要文字（描述、时间）
  text_tertiary: #94a3b8        # 辅助文字

分隔线:
  divider_light: #f1f5f9        # 浅色分隔线
  divider_medium: #e2e8f0       # 中等分隔线
```

### 4.2 语义颜色

```yaml
标签类型颜色:
  primary: #2563eb     # 蓝色 - 设施维修、进行中
  success: #16a34a     # 绿色 - 优化建议、已解决
  warning: #ea580c     # 橙色 - 投诉建议、高优
  error: #dc2626       # 红色 - 紧急
  info: #64748b        # 灰色 - 咨询、其他
```

---

## 🔧 五、实现规范

### 5.1 CSS 编写规则

```css
/* ✅ 推荐：使用 gap 控制间距 */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;  /* 统一子元素间距 */
}

/* ❌ 禁止：在子元素上使用 margin */
.title {
  margin-bottom: 8px;  /* 不要这样做 */
}

/* ✅ 推荐：覆盖第三方组件默认样式 */
.work-order-card {
  margin: 0 !important;  /* 覆盖 uview-plus 默认 margin */
}

/* ✅ 推荐：使用 calc 计算响应式尺寸 */
.card {
  width: calc(100vw - 32px);  /* 屏幕宽度 - 两边各16px */
}
```

### 5.2 命名规范

```yaml
BEM 命名法:
  Block: .work-order-card
  Element: .work-order-card__header
  Modifier: .work-order-card--compact

层级命名:
  容器: -container, -wrapper
  区域: -section, -region
  列表: -list, -group
  项目: -item, -card

状态命名:
  is-active
  is-disabled
  has-error
```

### 5.3 响应式规范

```yaml
断点:
  mobile: < 768px     # 移动端（默认）
  tablet: >= 768px    # 平板
  desktop: >= 1024px  # 桌面

移动优先:
  - 先设计移动端（375px 宽度）
  - 使用 min-width 媒体查询扩展到大屏

间距调整:
  mobile: 使用标准间距
  tablet: 可增加 1.5x 间距
  desktop: 可增加 2x 间距
```

---

## 📋 六、组件清单

### 6.1 已规范化组件

- ✅ WorkOrderCard（工单卡片）
- ✅ TaskList（工单列表）
- ✅ FilterBar（筛选栏）

### 6.2 待规范化组件

- ⏳ WorkOrderDetail（工单详情）
- ⏳ CommentCard（评论卡片）
- ⏳ AnnouncementCard（公告卡片）
- ⏳ UserProfile（用户资料）

---

## 🔍 七、验证清单

### 7.1 间距验证

```yaml
✅ 检查项:
  - [ ] 卡片距屏幕边缘 = 16px
  - [ ] 内容距屏幕边缘 = 32px
  - [ ] 卡片之间间距 = 16px
  - [ ] head 到 body 间距 = 8px
  - [ ] 卡片内边距 = 16px（左右上下）
  - [ ] 所有元素左对齐于 32px 基准线
  - [ ] 使用 gap 而非 margin 控制间距
  - [ ] 无间距叠加问题
```

### 7.2 对齐验证

```yaml
✅ 检查项:
  - [ ] 头像左边缘 = 32px
  - [ ] 标题左边缘 = 32px
  - [ ] 描述左边缘 = 32px
  - [ ] 状态行左边缘 = 32px
  - [ ] head 和 body 完全左对齐
```

### 7.3 尺寸验证

```yaml
✅ 检查项:
  - [ ] 头像尺寸 = 40px × 40px
  - [ ] 媒体项尺寸 = 100px × 100px
  - [ ] 最小触摸目标 >= 44px
  - [ ] 卡片宽度 = 100vw - 32px
```

---

## 📖 八、参考资料

### 8.1 设计系统

- [Material Design 3](https://m3.material.io/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)
- [Atlassian Design System](https://atlassian.design/)
- [Carbon Design System](https://carbondesignsystem.com/)

### 8.2 最佳实践

- 8pt 网格系统
- 设计令牌（Design Tokens）
- 移动优先设计
- 无障碍访问（a11y）

---

## 📝 九、变更日志

### v1.1.0 (2025-01-05)

- ✅ 优化 head 和 body 间距从 16px 调整为 8px
  - 符合亲密性法则：卡片内部间距 (8px) < 卡片之间间距 (16px)
  - 实现方式：head padding-bottom: 4px + body padding-top: 4px
  - 增强卡片整体性，更好区分不同卡片

### v1.0.0 (2025-01-04)

- ✅ 确定基础间距系统（基于 8px）
- ✅ 定义工单卡片完整规范
- ✅ 明确定位约束方法（内容距屏幕 32px）
- ✅ 统一使用 gap 控制间距
- ✅ 移除工单状态（已提交）显示
- ✅ 修复头像与标题对齐问题

---

**维护者**: BetterHome 开发团队
**联系方式**: 项目 Issue 跟踪
