# 数据管理脚本使用指南

本文档介绍项目中用于开发和测试的数据管理脚本。

## 环境要求

- Python 3.x
- Node.js 14+
- Bash shell
- curl 命令
- jq 命令（JSON 处理）

## 环境变量配置

大多数脚本需要以下环境变量：

```bash
export DIRECTUS_URL="http://139.155.26.118:8055"
export DIRECTUS_EMAIL="your-email@example.com"
export DIRECTUS_PASSWORD="your-password"
```

## 脚本列表

### 1. 创建工单数据（推荐）

**文件**: `create_workorders_v2.py`

**功能**: 从 JSON 文件批量导入工单数据到 Directus

**使用方法**:
```bash
# 基本用法
DIRECTUS_URL=http://139.155.26.118:8055 python3 create_workorders_v2.py user_workorders.json

# 使用自定义 JSON 文件
python3 create_workorders_v2.py my_custom_workorders.json
```

**输入格式** (`user_workorders.json`):
```json
[
  {
    "title": "电梯故障",
    "description": "3号楼电梯按钮失灵",
    "category": "repair",
    "priority": "high",
    "submitter_email": "user@example.com",
    "community_name": "阳光小区",
    "files": [
      "path/to/image1.jpg",
      "path/to/image2.jpg"
    ]
  }
]
```

**支持的字段**:
- `title` (必填): 工单标题
- `description` (必填): 工单描述
- `category`: 类别 (repair, complaint, suggestion, inquiry, other)
- `priority`: 优先级 (low, medium, high, urgent)
- `status`: 状态 (submitted, accepted, in_progress, resolved, closed)
- `submitter_email`: 提交人邮箱
- `assignee_email`: 负责人邮箱
- `community_name`: 小区名称
- `files`: 附件文件路径数组

**特性**:
- ✅ 自动上传图片和视频附件
- ✅ 自动关联用户和小区
- ✅ 支持批量创建
- ✅ 详细的错误提示
- ✅ 创建进度显示

---

### 2. 创建工单数据（旧版本）

**文件**: `create_workorders.py`

**功能**: 旧版本的工单创建脚本

**使用方法**:
```bash
python3 create_workorders.py
```

**注意**: 推荐使用 `create_workorders_v2.py`，功能更完善。

---

### 3. Shell 版工单创建

**文件**: `create_workorders.sh`

**功能**: 使用 Shell 脚本创建工单（更轻量）

**使用方法**:
```bash
chmod +x create_workorders.sh
./create_workorders.sh
```

---

### 4. 创建居民数据

**文件**: `create_residents.sh`

**功能**: 批量创建测试居民用户

**使用方法**:
```bash
chmod +x create_residents.sh
./create_residents.sh
```

**功能说明**:
- 创建多个测试用户账号
- 自动分配到不同小区和楼栋
- 设置用户类型（业主、物业等）
- 上传随机头像

---

### 5. 修复文件 MIME 类型

**文件**: `fix_octet_stream.sh`

**功能**: 修复 Directus 中 MIME 类型错误的文件（`application/octet-stream`）

**问题背景**:
某些文件上传后 MIME 类型被错误识别为 `application/octet-stream`，导致图片无法在小程序中正常显示。

**使用方法**:
```bash
chmod +x fix_octet_stream.sh
./fix_octet_stream.sh
```

**工作流程**:
1. 从 Directus 导出所有 MIME 类型为 `application/octet-stream` 的文件
2. 保存到 `octet-stream.json`
3. 根据文件扩展名重新识别正确的 MIME 类型
4. 批量更新文件记录

**支持的文件类型**:
- 图片: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`
- 视频: `.mp4`, `.mov`, `.avi`, `.webm`

---

### 6. 重新上传文件

**文件**: `reupload_files.sh`

**功能**: 重新上传损坏或丢失的文件到 Directus

**使用场景**:
- 文件物理存储损坏
- 需要迁移文件存储位置
- 批量替换文件

**使用方法**:
```bash
chmod +x reupload_files.sh

# 需要先准备文件列表
# files.json 格式: [{"id": "file-id", "path": "/path/to/file.jpg"}]

./reupload_files.sh
```

---

### 7. 上传头像

**文件**: `upload_avatars.sh`

**功能**: 批量上传用户头像到 Directus

**使用方法**:
```bash
chmod +x upload_avatars.sh

# 确保头像文件在 avatars/ 目录下
./upload_avatars.sh
```

**目录结构**:
```
avatars/
  ├── user1.jpg
  ├── user2.png
  └── user3.jpg
```

**输出**:
- 上传成功的文件 ID 列表
- 保存到 `uploaded_avatars.csv`

---

### 8. 上传 Pexels 媒体

**文件**: `upload_pexels_media.sh`

**功能**: 批量上传从 Pexels 下载的测试图片和视频

**使用方法**:
```bash
chmod +x upload_pexels_media.sh

# 确保媒体文件在以下目录：
# - pexels_images/
# - pexels_videos/

./upload_pexels_media.sh
```

**用途**: 快速生成测试数据的图片和视频素材

---

### 9. 下载头像

**文件**: `download_avatars.js`, `download_random_avatars.js`

**功能**: 从在线 API 下载随机头像

**使用方法**:
```bash
# 下载特定头像
node download_avatars.js

# 下载随机头像
node download_random_avatars.js
```

---

### 10. 下载已使用的文件

**文件**: `download_used_files.sh`

**功能**: 从 Directus 下载所有正在使用的文件（用于备份）

**使用方法**:
```bash
chmod +x download_used_files.sh
./download_used_files.sh
```

**输出**:
- 文件下载到 `downloaded_assets/` 目录
- 生成文件清单 `used_files_ids.txt`

---

### 11. 删除未使用的文件（危险）

**文件**: `delete_unused_files.sh`, `delete_unused_files.py`

**功能**: 删除 Directus 中未被引用的文件

**⚠️ 警告**: 这是危险操作，请确保已备份！

**使用方法**:
```bash
# Shell 版本
chmod +x delete_unused_files.sh
./delete_unused_files.sh

# Python 版本（推荐，更安全）
python3 delete_unused_files.py
```

**建议**:
1. 先运行 `download_used_files.sh` 备份所有文件
2. 检查未使用文件列表
3. 确认无误后再执行删除

---

### 12. 危险：删除所有文件

**文件**: `dangerously_delete_all_files.sh`

**功能**: 删除 Directus 中的所有文件记录

**⚠️⚠️⚠️ 极度危险**: 此操作不可逆！仅用于测试环境重置。

**使用方法**:
```bash
# 建议永远不要运行这个脚本
# 如果必须运行：
chmod +x dangerously_delete_all_files.sh
./dangerously_delete_all_files.sh
```

---

## 常见用法示例

### 快速搭建测试环境

```bash
# 1. 创建居民用户
./create_residents.sh

# 2. 上传头像
./upload_avatars.sh

# 3. 创建工单数据
DIRECTUS_URL=http://139.155.26.118:8055 \
  python3 create_workorders_v2.py user_workorders.json

# 4. 上传测试媒体
./upload_pexels_media.sh
```

### 文件管理和清理

```bash
# 1. 备份所有使用中的文件
./download_used_files.sh

# 2. 修复错误的 MIME 类型
./fix_octet_stream.sh

# 3. 删除未使用的文件（可选）
python3 delete_unused_files.py
```

### 数据迁移

```bash
# 1. 导出工单数据（手动或脚本）
# 2. 下载所有关联文件
./download_used_files.sh

# 3. 在新环境重新上传文件
./reupload_files.sh

# 4. 导入工单数据
python3 create_workorders_v2.py exported_workorders.json
```

---

## 故障排查

### 脚本执行失败

**问题**: 脚本无法执行
```bash
# 解决方案：添加执行权限
chmod +x script_name.sh
```

### 网络连接问题

**问题**: 无法连接到 Directus
```bash
# 检查 Directus 服务是否运行
curl http://139.155.26.118:8055/server/health

# 检查环境变量
echo $DIRECTUS_URL
```

### Python 依赖问题

**问题**: 缺少 Python 模块
```bash
# 安装依赖
pip3 install requests python-dotenv

# 或使用虚拟环境
python3 -m venv myenv
source myenv/bin/activate
pip install -r requirements.txt  # 如果有的话
```

### 文件权限问题

**问题**: 无法读取/写入文件
```bash
# 检查文件权限
ls -la script_name.sh

# 修改文件所有者
sudo chown $USER:$USER script_name.sh
```

---

## 最佳实践

### 1. 环境变量管理

创建 `.env` 文件（不要提交到 git）：

```bash
# .env
DIRECTUS_URL=http://139.155.26.118:8055
DIRECTUS_EMAIL=admin@example.com
DIRECTUS_PASSWORD=secret123
```

在脚本中加载：
```bash
source .env
python3 create_workorders_v2.py data.json
```

### 2. 数据备份

在执行修改/删除操作前：
```bash
# 备份数据库
mysqldump -u root -p betterhome > backup_$(date +%Y%m%d).sql

# 备份文件
./download_used_files.sh
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz downloaded_assets/
```

### 3. 批量操作

处理大量数据时，分批执行：
```bash
# 将大文件拆分
split -l 100 large_workorders.json batch_

# 批量处理
for file in batch_*; do
  python3 create_workorders_v2.py "$file"
  sleep 2  # 避免过载
done
```

### 4. 日志记录

保存脚本执行日志：
```bash
./create_workorders.sh 2>&1 | tee logs/workorders_$(date +%Y%m%d_%H%M%S).log
```

---

## 安全注意事项

1. **不要提交敏感信息**
   - `.env` 文件
   - 包含密码的脚本
   - 生产环境 URL 和凭证

2. **生产环境谨慎操作**
   - 永远先在测试环境验证
   - 使用只读账号进行查询
   - 删除操作需要二次确认

3. **访问控制**
   - 限制脚本执行权限
   - 使用专门的服务账号
   - 定期轮换密码

4. **数据隐私**
   - 不要在脚本中硬编码真实用户数据
   - 测试数据使用随机生成或匿名化
   - 遵守数据保护法规

---

## 贡献指南

添加新脚本时：

1. 遵循命名规范：`verb_noun.sh` 或 `verb_noun.py`
2. 添加脚本说明（文件头部注释）
3. 更新本文档
4. 添加使用示例
5. 提供错误处理

示例脚本模板：
```bash
#!/bin/bash
#
# Script: my_script.sh
# Description: 简短描述脚本功能
# Usage: ./my_script.sh [options]
# Author: Your Name
# Date: 2025-01-11
#

set -e  # 遇到错误立即退出
set -u  # 使用未定义变量时报错

# 脚本内容...
```

---

## 相关资源

- [Directus API 文档](https://docs.directus.io/reference/introduction.html)
- [Directus CLI 工具](https://docs.directus.io/reference/cli.html)
- [Bash 脚本编程指南](https://www.gnu.org/software/bash/manual/)
- [Python Requests 文档](https://requests.readthedocs.io/)
