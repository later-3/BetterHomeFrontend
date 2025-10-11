#!/usr/bin/env bash
set -euo pipefail

DIRECTUS_URL="http://localhost:8055"
TOKEN="sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"
COMMUNITY_ID="2a5c769e-9909-4331-99b3-983c8b1175c6"
MEDIA_MAP="uploaded_pexels_media.csv"

BUILDINGS_JSON='[
  {"name": "咏兰阁", "id": "69d4df83-b590-4cd9-8af9-db2e10d00ae8"},
  {"name": "听竹轩", "id": "e086bc8d-c777-4ba0-a6ff-714690a06cb8"},
  {"name": "观松楼", "id": "50be3933-f799-4cbd-82b0-df80a93cd03b"},
  {"name": "邀月庭", "id": "ceddcef1-0b04-4d63-9d27-8fa631a682d1"}
]'

WORKORDERS_JSON='[
  {"title": "3号楼电梯层门关闭困难", "category": "repair", "building": "咏兰阁", "email": "user01@test.com", "description": "电梯在晚高峰时多次关门缓慢，门缝还发出刺耳声响，担心安全隐患，请尽快安排检修。"},
  {"title": "地下车库排水口堵塞", "category": "complaint", "building": "听竹轩", "email": "user02@test.com", "description": "昨夜暴雨后车库入口积水严重，排水口有大量落叶树枝堵塞，导致车辆出入受影响。"},
  {"title": "垃圾房异味影响居民", "category": "complaint", "building": "观松楼", "email": "user03@test.com", "description": "观松楼一层垃圾房近一周毫无清理，异味扩散到楼道，希望物业加强管理。"},
  {"title": "小区绿化修剪建议", "category": "suggestion", "building": "邀月庭", "email": "user04@test.com", "description": "邀月庭东侧灌木长势过高遮挡行人视线，建议近期安排修剪。"},
  {"title": "夜间走廊照明闪烁", "category": "repair", "building": "咏兰阁", "email": "user05@test.com", "description": "咏兰阁8楼走廊灯持续闪烁，老人晚上出行不便，麻烦尽快更换灯具。"},
  {"title": "物业客服态度问题", "category": "complaint", "building": "听竹轩", "email": "user06@test.com", "description": "电话报修时物业客服态度敷衍多次打断，服务体验很差，望改进。"},
  {"title": "楼道墙皮大面积脱落", "category": "repair", "building": "观松楼", "email": "user07@test.com", "description": "观松楼7楼楼道墙皮脱落，粉尘掉落影响卫生，也存在安全问题。"},
  {"title": "中央喷泉水泵异常", "category": "repair", "building": "邀月庭", "email": "user08@test.com", "description": "中央喷泉设备出现漏电警示，周边地砖有水渍渗出，需立即检修以防触电风险。"}
]'

PRIORITIES=("low" "medium" "high" "urgent")

if [[ ! -f "$MEDIA_MAP" ]]; then
  echo "❌ 找不到 $MEDIA_MAP，请先运行 upload_pexels_media.sh" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "❌ 需要 jq，请先安装 jq" >&2
  exit 1
fi

IFS=$'\n' read -d '' -r -a MEDIA_IDS < <(tail -n +2 "$MEDIA_MAP" | cut -d',' -f2 && printf '\0')
if (( ${#MEDIA_IDS[@]} == 0 )); then
  echo "❌ $MEDIA_MAP 没有任何记录" >&2
  exit 1
fi

echo "$WORKORDERS_JSON" | jq -c '.[]' | while read -r workorder; do
  title=$(echo "$workorder" | jq -r '.title')
  category=$(echo "$workorder" | jq -r '.category')
  building_name=$(echo "$workorder" | jq -r '.building')
  submitter_email=$(echo "$workorder" | jq -r '.email')
  description=$(echo "$workorder" | jq -r '.description')

  building_id=$(echo "$BUILDINGS_JSON" | jq -r --arg name "$building_name" '.[] | select(.name==$name) | .id')
  if [[ -z "$building_id" ]]; then
    echo "  ✖ 找不到楼栋 $building_name，跳过 $title" >&2
    continue
  fi

  submitter_id=$(curl --silent --noproxy '*' \
    -H "Authorization: Bearer $TOKEN" \
    "$DIRECTUS_URL/users?limit=1&fields=id&filter[email][_eq]=$submitter_email" |
    jq -r '.data[0].id // empty')
  if [[ -z "$submitter_id" ]]; then
    echo "  ✖ 找不到用户 $submitter_email，跳过 $title" >&2
    continue
  fi

  count=$(( (RANDOM % 3) + 1 ))
  files_create=$(python3 - <<PY
import random, json
ids = json.loads('''$(printf '%s' "${MEDIA_IDS[@]}" | jq -R -s 'split("\n") | map(select(length>0))')''')
count = $count
sample = random.sample(ids, min(count, len(ids)))
print(json.dumps([{"directus_files_id": fid} for fid in sample]))
PY
)
  files=$(echo "$files_create" | jq -c './/[]')
  priority=${PRIORITIES[$((RANDOM % ${#PRIORITIES[@]}))]}

  payload=$(jq -n \
    --arg title "$title" \
    --arg desc "$description" \
    --arg category "$category" \
    --arg priority "$priority" \
    --arg status "submitted" \
    --arg submitter "$submitter_id" \
    --arg community "$COMMUNITY_ID" \
    --argjson files "$files" \
    '{
      title: $title,
      description: $desc,
      category: $category,
      priority: $priority,
      status: $status,
      submitter_id: $submitter,
      community_id: $community,
      files: { create: $files }
    }')

  echo "  → 创建工单：$title ($category / $priority)"
  response=$(curl --silent --show-error --fail-with-body --noproxy '*' -X POST "$DIRECTUS_URL/items/work_orders" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" 2>&1 || true)

  workorder_id=$(echo "$response" | jq -r '.data.id // empty' 2>/dev/null || true)
  if [[ -n "$workorder_id" ]]; then
    echo "     ✔ 成功: $workorder_id"
  else
    err=$(echo "$response" | jq -r '.errors[0].message // .message // .error // .' 2>/dev/null || echo "$response")
    echo "     ✖ 失败: $err" >&2
  fi

done

echo "批量创建完成。"
