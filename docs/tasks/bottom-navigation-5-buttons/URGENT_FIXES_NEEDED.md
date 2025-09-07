# 🚨 紧急修复需求 - 底部导航项目

## 📋 当前状态：❌ 项目存在严重问题，无法正常运行

### 🔥 阻塞性问题（必须立即修复）

#### 1. Vue API 导入缺失 - 会导致运行时崩溃

**问题文件**：
- `src/hooks/useNavigation.ts`
- `src/hooks/useErrorHandler.ts`

**修复步骤**：

```typescript
// 1. 修复 src/hooks/useNavigation.ts
// 在文件开头添加：
import { computed, onLoad, onTabItemTap } from 'vue'
```

```typescript
// 2. 修复 src/hooks/useErrorHandler.ts
// 在文件开头添加：
import { readonly } from 'vue'
```

**验证**：
```bash
npm run tsc    # 应该无类型错误
npm run dev    # 应该能正常启动
```

---

#### 2. 图标资源问题 - 显示紫色方块

**问题描述**：所有图标都是1×1像素占位符，导致导航栏显示紫色方块。

**修复步骤**：

1. **访问** https://icon-sets.iconify.design/
2. **搜索并下载**以下图标（22×22像素，PNG格式）：
   - `community` 或 `users` → neighbor.png
   - `announcement` 或 `megaphone` → notice.png
   - `task` 或 `todo` → task.png
   - 对应的 `-active` 版本

3. **替换文件**：
```bash
# 替换这些文件，确保每个文件 >500字节
src/static/icons/neighbor.png
src/static/icons/neighbor-active.png
src/static/icons/notice.png
src/static/icons/notice-active.png
src/static/icons/task.png
src/static/icons/task-active.png
```

**验证**：
```bash
# 检查文件大小（应该 >500字节）
ls -la src/static/icons/*.png

# 检查图标规格（应该是22x22）
file src/static/icons/neighbor.png
```

---

### 🚨 高优先级问题

#### 3. 清理调试代码
移除以下文件中的console.log：
- `src/pages/neighbor/neighbor.vue:25`
- `src/pages/notice/notice.vue:25`
- `src/pages/task/task.vue:25`

#### 4. 命名规范统一
考虑将页面路径统一：
- 当前：`neighbor/`, `task/`
- 任务要求：`neighborhood/`, `affairs/`

---

## 🎯 修复后验收标准

### ✅ 必须满足
- [ ] `npm run tsc` 无类型错误
- [ ] `npm run dev` 正常启动
- [ ] 底部导航显示5个图标（非紫色方块）
- [ ] 所有页面切换正常
- [ ] 无控制台错误

### ✅ 质量要求
- [ ] 无console.log调试代码
- [ ] 图标文件大小 >500字节
- [ ] 页面加载无错误

---

## 📞 需要开发协助

**联系方式**：请开发人员查看以下文档：
1. **详细问题分析**：`docs/tasks/bottom-navigation-5-buttons/06-pr-review.md`
2. **性能优化指南**：`docs/06-performance-optimization.md`（已更新）
3. **任务要求对照**：`docs/tasks/bottom-navigation-5-buttons/03-tasks.md`

**预计修复时间**：1-1.5小时

**修复优先级**：
1. 🔥 P0：Vue API导入（10分钟）
2. 🔥 P0：图标资源替换（30分钟）
3. 🚨 P1：代码清理（20分钟）

---

## 🔍 问题根因分析

1. **Vue API导入缺失**：开发过程中可能复制了代码但忘记导入依赖
2. **图标占位符**：使用了测试用的1×1像素图片，未替换为真实图标
3. **文档与实际不符**：实施报告存在大量虚假陈述，隐瞒了关键问题

---

**创建时间**：2025-01-07
**状态**：🚨 需要立即处理
**负责人**：开发团队

请优先处理P0级别问题，确保项目基本可用！