#!/bin/bash

# =======================================================
# ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ 请修改此部分 ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
# =======================================================
# ❗️❗️ 警告: 此文件包含敏感信息 (密码)，请勿提交到 Git 仓库 ❗️❗️
EMAIL="laterzxhp@gmail.com"
PASSWORD="123"
DIRECTUS_URL="http://localhost:8055"
# 使用从文件列表中获取的真实文件ID
FILE_ID="03b4e36d-f3b1-40bf-9b50-e321920377d6"
OUTPUT_FILE="test_download_curl.jpg"
# =======================================================
# ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
# =======================================================

echo "[1/4] 正在以 ${EMAIL} 身份登录..."

# --- 步骤一：登录并使用 jq 提取 Token ---
TOKEN=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\", \"password\":\"${PASSWORD}\"}" \
  "${DIRECTUS_URL}/auth/login" | jq -r '.data.access_token')

# --- 检查 Token 是否获取成功 ---
if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ **测试失败!** 无法获取 Token。请检查您的邮箱、密码和 Directus URL。"
  exit 1
fi

echo "✅ [1/4] 登录成功, Token 已获取!"
echo "[2/4] --------------------------------"
echo "[2/4] 正在获取contents数据..."

# --- 步骤二：获取contents数据，查看最新的附件 ---
CONTENTS_DATA=$(curl -s -H "Authorization: Bearer ${TOKEN}" \
  "${DIRECTUS_URL}/items/contents?limit=5&fields=id,title,attachments.*")

echo "📋 Contents数据: ${CONTENTS_DATA}"
echo ""

# --- 检查是否有错误 ---
HAS_ERROR=$(echo "${CONTENTS_DATA}" | jq -r '.errors // empty')
if [ ! -z "$HAS_ERROR" ]; then
  echo "❌ **获取Contents数据失败!** 错误信息:"
  echo "${CONTENTS_DATA}" | jq -r '.errors[0].message'
  exit 1
fi

# --- 从contents数据中提取第一个有attachments的记录 ---
echo "🔍 正在分析attachments数据..."
FIRST_ATTACHMENT_ID=$(echo "${CONTENTS_DATA}" | jq -r '.data[]? | select(.attachments != null and (.attachments | length) > 0) | .attachments[0].directus_files_id' | head -1)

if [ "$FIRST_ATTACHMENT_ID" == "null" ] || [ -z "$FIRST_ATTACHMENT_ID" ]; then
  echo "❌ **没有找到包含附件的内容!** 请确认已经上传了包含图片的内容。"
  exit 1
fi

echo "✅ 找到附件ID: ${FIRST_ATTACHMENT_ID}"
FILE_ID="${FIRST_ATTACHMENT_ID}"

echo "[3/4] --------------------------------"
echo "[3/4] 正在下载文件 ID: ${FILE_ID}..."

# --- 先获取文件的Content-Type ---
CONTENT_TYPE=$(curl -s -I -H "Authorization: Bearer ${TOKEN}" \
  "${DIRECTUS_URL}/assets/${FILE_ID}" | grep -i "content-type:" | awk '{print $2}' | tr -d '\r')

echo "📄 文件类型: ${CONTENT_TYPE}"

# --- 根据Content-Type确定文件扩展名 ---
case "${CONTENT_TYPE}" in
  image/svg+xml*)
    EXTENSION="svg" ;;
  image/jpeg*)
    EXTENSION="jpg" ;;
  image/png*)
    EXTENSION="png" ;;
  image/gif*)
    EXTENSION="gif" ;;
  image/webp*)
    EXTENSION="webp" ;;
  *)
    EXTENSION="bin" ;;
esac

# --- 使用正确的扩展名 ---
CORRECT_OUTPUT_FILE="downloaded_image.${EXTENSION}"
echo "💾 保存为: ${CORRECT_OUTPUT_FILE}"

# --- 步骤三：使用 Token 下载图片 ---
# 使用 -w "%{http_code}" 来获取 HTTP 状态码
HTTP_STATUS=$(curl -s -L -w "%{http_code}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -o "${CORRECT_OUTPUT_FILE}" \
  "${DIRECTUS_URL}/assets/${FILE_ID}")

echo "[3/3] --------------------------------"
echo "[3/3] 后端返回的 HTTP 状态码: ${HTTP_STATUS}"

# --- 检查下载是否成功 ---
if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 300 ]; then
  echo "🎉 **测试成功!** 文件已保存为 \"${CORRECT_OUTPUT_FILE}\""
  echo "文件大小: $(ls -lh ${CORRECT_OUTPUT_FILE} | awk '{print $5}')"
  echo "文件类型: $(file ${CORRECT_OUTPUT_FILE})"
else
  echo "❌ **测试失败!** 下载文件时遇到错误。状态码: ${HTTP_STATUS}"
  echo ""
  echo "🔍 让我们尝试其他方式获取更多调试信息..."
  echo ""

  # --- 尝试其他诊断方法 ---
  echo "🧪 [额外测试1] 尝试用access_token参数方式："
  HTTP_STATUS2=$(curl -s -L -w "%{http_code}" \
    -o "test_with_param.jpg" \
    "${DIRECTUS_URL}/assets/${FILE_ID}?access_token=${TOKEN}")
  echo "   状态码: ${HTTP_STATUS2}"

  echo ""
  echo "🧪 [额外测试2] 检查用户权限信息："
  USER_INFO=$(curl -s -H "Authorization: Bearer ${TOKEN}" \
    "${DIRECTUS_URL}/users/me")
  echo "   用户信息: ${USER_INFO}"

  echo ""
  echo "🧪 [额外测试3] 尝试访问files端点："
  HTTP_STATUS3=$(curl -s -L -w "%{http_code}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -o "test_files_endpoint.jpg" \
    "${DIRECTUS_URL}/files/${FILE_ID}")
  echo "   状态码: ${HTTP_STATUS3}"

  echo ""
  echo "🧪 [额外测试4] 检查所有文件列表（前5个）："
  FILES_LIST=$(curl -s -H "Authorization: Bearer ${TOKEN}" \
    "${DIRECTUS_URL}/files?limit=5")
  echo "   文件列表: ${FILES_LIST}"

  echo ""
  echo "🧪 [额外测试5] 检查contents中的attachments："
  CONTENTS_LIST=$(curl -s -H "Authorization: Bearer ${TOKEN}" \
    "${DIRECTUS_URL}/items/contents?limit=3&fields=id,title,attachments.*")
  echo "   内容及attachments: ${CONTENTS_LIST}"

  echo ""
  echo "💡 **调试建议:**"
  echo "   - 如果状态码是403: 权限问题，需要在Directus管理后台配置文件访问权限"
  echo "   - 如果状态码是404: 文件ID可能不存在，请检查ID是否正确"
  echo "   - 如果状态码是401: Token可能已过期或无效"

  # 清理掉可能创建的空文件
  rm -f "${CORRECT_OUTPUT_FILE}" "test_with_param.jpg" "test_files_endpoint.jpg"
fi

echo ""
echo "[4/4] 脚本执行完毕。"