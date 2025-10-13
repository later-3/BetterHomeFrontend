#!/usr/bin/env bash
set -euo pipefail

DIRECTUS_URL="http://localhost:8055"
TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"
COMMUNITY_ID="2a5c769e-9909-4331-99b3-983c8b1175c6"
AVATAR_MAP="uploaded_avatars.csv"

BUILDINGS=(
  "69d4df83-b590-4cd9-8af9-db2e10d00ae8|咏兰阁"
  "e086bc8d-c777-4ba0-a6ff-714690a06cb8|听竹轩"
  "50be3933-f799-4cbd-82b0-df80a93cd03b|观松楼"
  "ceddcef1-0b04-4d63-9d27-8fa631a682d1|邀月庭"
)

USERS=(
  "陈雅宁|13811110001"
  "李思捷|13811110002"
  "王梓旭|13811110003"
  "赵宸睿|13811110004"
  "周雨桐|13811110005"
  "宋嘉怡|13811110006"
  "吴子墨|13811110007"
  "林浩然|13811110008"
  "徐若楠|13811110009"
  "杨致远|13811110010"
)

if [[ ! -f "$AVATAR_MAP" ]]; then
  echo "❌ 找不到 $AVATAR_MAP，请先运行 upload_avatars.sh" >&2
  exit 1
fi

avatars=()
while IFS=',' read -r file_name file_id; do
  if [[ "$file_name" == "file_name" ]]; then
    continue
  fi
  avatars+=("$file_id")
done < "$AVATAR_MAP"

if (( ${#avatars[@]} < ${#USERS[@]} )); then
  echo "❌ 头像数量不足，需要至少 ${#USERS[@]} 张" >&2
  exit 1
fi

authority_json=$(jq -n --arg community "$COMMUNITY_ID" '{community_id: $community}')

count=0
for entry in "${USERS[@]}"; do
  IFS='|' read -r name phone <<< "$entry"
  building_entry="${BUILDINGS[$(( count % ${#BUILDINGS[@]} ))]}"
  IFS='|' read -r building_id building_name <<< "$building_entry"

  avatar_id="${avatars[$count]}"

  email_local=$(python3 - <<PY
name = "$name"
index = $count + 1
import unicodedata
import re
slug = ''.join(ch if ord(ch) < 128 else '' for ch in unicodedata.normalize('NFKD', name))
slug = slug or 'user'
slug = re.sub(r'[^a-zA-Z0-9]+', '.', slug).strip('.')
if not slug:
    slug = 'user'
print(f"{slug}{index:02d}")
PY
)

  email="${email_local}@test.com"

  payload=$(jq -n \
    --arg email "$email" \
    --arg password "BetterHome#2025" \
    --arg first "$name" \
    --arg phone "$phone" \
    --arg community "$COMMUNITY_ID" \
    --arg building "$building_id" \
    --arg avatar "$avatar_id" \
    '{
      email: $email,
      password: $password,
      first_name: $first,
      community_id: $community,
      building_id: $building,
      phone_number: $phone,
      user_type: "resident",
      status: "active",
      avatar: $avatar
    }'
  )

  echo "创建 $name <$email> -> $building_name (avatar=$avatar_id)"
  response=$(curl --silent --show-error --fail-with-body --noproxy '*' -X POST "$DIRECTUS_URL/users" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" 2>&1 || true)

  user_id=$(echo "$response" | jq -r '.data.id // empty' 2>/dev/null || true)
  if [[ -n "$user_id" ]]; then
    echo "  ✔ 成功: $user_id"
  else
    err=$(echo "$response" | jq -r '.errors[0].message // .message // .error // .' 2>/dev/null || echo "$response")
    echo "  ✖ 失败: $err" >&2
  fi

  ((count++))
done

echo "全部完成"
