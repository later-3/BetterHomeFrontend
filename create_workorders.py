import argparse
import csv
import json
import random
import urllib.request
import urllib.parse
from pathlib import Path

DIRECTUS_URL = "http://localhost:8055"
TOKEN = "sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n"
COMMUNITY_ID = "2a5c769e-9909-4331-99b3-983c8b1175c6"
MEDIA_MAP = "uploaded_pexels_media.csv"

BUILDINGS = {
    "咏兰阁": "69d4df83-b590-4cd9-8af9-db2e10d00ae8",
    "听竹轩": "e086bc8d-c777-4ba0-a6ff-714690a06cb8",
    "观松楼": "50be3933-f799-4cbd-82b0-df80a93cd03b",
    "邀月庭": "ceddcef1-0b04-4d63-9d27-8fa631a682d1",
}

PRIORITIES = ["low", "medium", "high", "urgent"]
DEFAULT_STATUS = "submitted"


def load_media_ids(csv_path: str):
    media_ids = []
    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            media_ids.append(row["file_id"])
    if not media_ids:
        raise SystemExit(f"❌ {csv_path} 中没有任何文件信息")
    return media_ids


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Batch create work orders via Directus API.")
    parser.add_argument(
        "definition",
        help="Path to the JSON file describing work orders.",
    )
    parser.add_argument(
        "--media-map",
        default=MEDIA_MAP,
        help="CSV file that maps uploaded media to file ids (default: %(default)s).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print payloads without sending requests.",
    )
    return parser.parse_args()


def load_workorders_from_json(path: str):
    file_path = Path(path)
    if not file_path.exists():
        raise SystemExit(f"❌ 找不到工单定义文件: {path}")

    with file_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, dict):
        candidates = data.get("workorders") or data.get("items") or data.get("data")
    else:
        candidates = data

    if not isinstance(candidates, list):
        raise SystemExit("❌ JSON 文件格式错误：应为数组或包含 workorders/items/data 数组的对象")

    return candidates


def api_get(path):
    req = urllib.request.Request(
        f"{DIRECTUS_URL}{path}",
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)


def api_post(path, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{DIRECTUS_URL}{path}",
        data=data,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        err_text = e.read().decode("utf-8", errors="ignore")
        try:
            return json.loads(err_text)
        except json.JSONDecodeError:
            return {"error": err_text}


def lookup_user_id(email):
    encoded = urllib.parse.quote(email)
    result = api_get(f"/users?limit=1&fields=id&filter[email][_eq]={encoded}")
    data = result.get("data", [])
    return data[0].get("id") if data else None


def random_files(media_ids):
    count = random.randint(1, min(3, len(media_ids)))
    sample = random.sample(media_ids, count)
    return [{"directus_files_id": fid} for fid in sample]


def coalesce(data, *keys):
    for key in keys:
        if key in data:
            value = data[key]
            if value is None:
                continue
            if isinstance(value, str):
                stripped = value.strip()
                if not stripped:
                    continue
                return stripped
            return value
    return None


def resolve_building(value):
    if not value:
        return None
    if value in BUILDINGS:
        return value, BUILDINGS[value]
    if isinstance(value, str) and value.count("-") == 4:
        return value, value
    return value, None


def make_files_payload(entry, media_ids):
    provided = entry.get("files") or entry.get("attachments")
    if provided is None:
        return random_files(media_ids)

    if isinstance(provided, dict):
        provided = provided.get("create")

    if not isinstance(provided, list):
        raise ValueError("files 字段必须是数组或包含 create 数组的对象")

    normalized = []
    for item in provided:
        if isinstance(item, str):
            normalized.append({"directus_files_id": item})
            continue

        if isinstance(item, dict):
            if "directus_files_id" in item:
                fid = item["directus_files_id"]
                if isinstance(fid, dict):
                    fid = fid.get("id")
                normalized.append({"directus_files_id": fid})
                continue

            if "id" in item:
                normalized.append({"directus_files_id": item["id"]})
                continue

        raise ValueError("files 条目必须是字符串或包含 directus_files_id/id 的对象")

    return normalized


def resolve_submitter(entry):
    submitter_id = coalesce(entry, "submitter_id")
    email = coalesce(entry, "email", "submitter_email")

    if submitter_id:
        return submitter_id, email

    if not email:
        raise ValueError("缺少 email 或 submitter_id")

    resolved_id = lookup_user_id(email)
    if not resolved_id:
        raise ValueError(f"找不到用户 {email}")

    return resolved_id, email


def build_workorder_payload(entry, media_ids):
    if not isinstance(entry, dict):
        raise ValueError("工单条目必须是对象")

    title = coalesce(entry, "title")
    if not title:
        raise ValueError("缺少 title")

    category = coalesce(entry, "category")
    if not category:
        raise ValueError("缺少 category")

    description = coalesce(entry, "description", "content", "detail")
    if not description:
        raise ValueError("缺少 description")

    building_value = coalesce(entry, "building", "building_id", "building_name")
    building_label, building_id = resolve_building(building_value)
    if not building_id:
        raise ValueError(f"找不到楼栋 {building_value}")

    submitter_id, submitter_email = resolve_submitter(entry)

    priority_value = coalesce(entry, "priority")
    if priority_value:
        normalized_priority = str(priority_value).lower()
        if normalized_priority not in PRIORITIES:
            print(f"    ⚠ 未识别优先级 {priority_value}，改用随机值")
            priority = random.choice(PRIORITIES)
        else:
            priority = normalized_priority
    else:
        priority = random.choice(PRIORITIES)

    status = coalesce(entry, "status") or DEFAULT_STATUS
    community_id = coalesce(entry, "community_id") or COMMUNITY_ID

    files_payload = make_files_payload(entry, media_ids)

    payload = {
        "title": title,
        "description": description,
        "category": category,
        "priority": priority,
        "status": status,
        "submitter_id": submitter_id,
        "community_id": community_id,
    }

    optional_fields = (
        "deadline",
        "resolved_at",
        "assignee_id",
        "rating",
        "feedback",
    )

    for key in optional_fields:
        if key in entry and entry[key] is not None:
            payload[key] = entry[key]

    extra_payload = entry.get("payload") or entry.get("extra")
    if isinstance(extra_payload, dict):
        payload.update(extra_payload)

    if files_payload:
        payload["files"] = {"create": files_payload}

    meta = {
        "title": title,
        "category": category,
        "priority": priority,
        "building": building_label,
        "submitter_email": submitter_email,
    }

    return payload, meta


def main():
    args = parse_args()
    media_ids = load_media_ids(args.media_map)
    workorders = load_workorders_from_json(args.definition)

    if not workorders:
        print("⚠ JSON 文件中没有任何工单条目")
        return

    print("开始批量创建工单...")

    for index, item in enumerate(workorders, start=1):
        try:
            payload, meta = build_workorder_payload(item, media_ids)
        except ValueError as err:
            identifier = item.get("title") if isinstance(item, dict) else f"第 {index} 个条目"
            print(f"  ✖ {identifier}: {err}")
            continue

        summary = f"{meta['title']} ({meta['category']}/{meta['priority']})"

        if args.dry_run:
            print(f"  · 跳过发送 [dry-run]：{summary}")
            continue

        print(f"  → 创建工单：{summary}")
        response = api_post("/items/work_orders", payload)

        workorder_id = response.get("data", {}).get("id")
        if workorder_id:
            print(f"       ✔ 成功: {workorder_id}")
        else:
            error_msg = response.get("errors") or response.get("error") or response
            print(f"       ✖ 失败: {error_msg}")

    print("批量创建完成。")


if __name__ == "__main__":
    main()
