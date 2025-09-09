# 图片下载问题排查指南

## 问题概述

在从 Directus 下载图片时遇到多种错误，包括 403 权限错误和文件类型识别错误。本文档总结了完整的排查过程和最终解决方案。

## 核心问题分析

### 1. 权限问题 (403 Forbidden)

**根本原因**：使用了错误的文件 ID 格式

```javascript
// ❌ 错误做法：使用 attachment.id
attachmentId = attachment.id  // 值为: 3

// ✅ 正确做法：使用 directus_files_id
attachmentId = attachment.directus_files_id  // 值为: "589380cf-c79e-45b5-8718-f2d7efb8a170"
```

**解释**：
- `attachment.id` 是关联表中的记录ID (数字)
- `attachment.directus_files_id` 是实际文件的UUID (字符串)
- Directus 的 `/assets/` 端点需要使用文件的UUID，而不是关联记录的ID

### 2. 文件类型识别问题

**根本原因**：固定使用 `.jpg` 扩展名保存所有文件

```bash
# ❌ 问题：强制保存为 .jpg
OUTPUT_FILE="test_download_curl.jpg"  # 实际文件是 SVG

# ✅ 解决：根据 Content-Type 动态确定扩展名
CONTENT_TYPE=$(curl -s -I -H "Authorization: Bearer ${TOKEN}" "${DIRECTUS_URL}/assets/${FILE_ID}")
# image/svg+xml -> .svg
# image/jpeg -> .jpg
# image/png -> .png
```

## 完整的调试流程

### 阶段1: 权限错误排查
1. 尝试多种认证方式（Bearer Header、access_token参数）
2. 检查用户权限和角色配置
3. 测试不同的API端点（/assets/、/files/）
4. **发现关键**：所有认证方式都返回403，说明不是认证问题

### 阶段2: 数据结构分析
```json
// Contents数据结构分析
{
  "attachments": [{
    "id": 3,                    // ❌ 关联表记录ID
    "contents_id": "a6849764...",
    "directus_files_id": "589380cf..."  // ✅ 真正的文件ID
  }]
}
```

### 阶段3: 文件ID修正
```bash
# 修改提取逻辑
FIRST_ATTACHMENT_ID=$(echo "${CONTENTS_DATA}" | jq -r '
  .data[]? |
  select(.attachments != null and (.attachments | length) > 0) |
  .attachments[0].directus_files_id'  # 使用正确的字段
)
```

### 阶段4: 动态文件类型处理
```bash
# 1. 获取Content-Type
CONTENT_TYPE=$(curl -s -I -H "Authorization: Bearer ${TOKEN}" "${DIRECTUS_URL}/assets/${FILE_ID}")

# 2. 映射到正确扩展名
case "${CONTENT_TYPE}" in
  image/svg+xml*) EXTENSION="svg" ;;
  image/jpeg*)    EXTENSION="jpg" ;;
  image/png*)     EXTENSION="png" ;;
  *)              EXTENSION="bin" ;;
esac

# 3. 使用正确文件名保存
CORRECT_OUTPUT_FILE="downloaded_image.${EXTENSION}"
```

## 关键经验教训

### 1. 数据结构理解的重要性
- 不要假设API返回的第一个ID字段就是所需的ID
- 仔细分析关联表结构，区分记录ID和外键ID
- 使用 `jq` 等工具仔细检查JSON结构

### 2. 文件类型处理最佳实践
- 永远不要硬编码文件扩展名
- 优先使用HTTP头部的Content-Type确定文件类型
- 考虑各种可能的文件格式（SVG、PNG、JPEG等）

### 3. 调试方法论
```bash
# 分步验证法
1. 先确认能获取数据 ✓
2. 再确认ID提取正确 ✓
3. 然后测试文件下载 ✓
4. 最后验证文件完整性 ✓
```

## 解决方案总结

### 前端修复 (Vue.js)
```typescript
// 修复图片URL生成
function getImageUrl(attachment: any): string {
  if (attachment && typeof attachment === 'object') {
    // ✅ 优先使用 directus_files_id
    attachmentId = attachment.directus_files_id || attachment.id || '';
  }
  return `${apiBaseUrl.value}/assets/${attachmentId}?access_token=${token.value}`;
}
```

### 后端测试脚本修复
```bash
# 1. 正确提取文件ID
FIRST_ATTACHMENT_ID=$(echo "${CONTENTS_DATA}" | jq -r '.data[]? | select(.attachments != null and (.attachments | length) > 0) | .attachments[0].directus_files_id')

# 2. 动态文件类型处理
CONTENT_TYPE=$(curl -s -I ...)
EXTENSION=$(determine_extension_from_content_type)
CORRECT_OUTPUT_FILE="downloaded_image.${EXTENSION}"
```

## 预防措施

### 开发阶段
1. **API数据结构文档化**：明确记录每个字段的含义
2. **类型安全**：使用TypeScript定义准确的接口类型
3. **单元测试**：针对文件ID提取逻辑编写测试

### 调试阶段
1. **分步验证**：每个步骤都验证数据正确性
2. **详细日志**：记录关键数据结构和转换过程
3. **多场景测试**：测试不同文件类型和数据情况

---

**总结**：该问题的核心是对Directus数据结构的误解，将关联表的记录ID误用为文件ID。正确的解决方案是使用`directus_files_id`字段，并根据实际Content-Type动态确定文件扩展名。

**最重要的教训**：在集成第三方API时，必须深入理解其数据模型，不能仅凭字段名称做假设。