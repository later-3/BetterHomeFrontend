#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Directus Work Order Batch Creation Script (V2 - cURL Edition)

This script reads a JSON definition file to batch-create work orders in Directus.
It uses `curl` for all network operations to ensure consistency with manual tests.

Features:
- Reads work order data from a flexible JSON structure.
- For each work order, uploads specified local files (images/videos) on the fly.
- Associates the newly uploaded files with the work order upon creation.
- Supports a --dry-run mode to test payloads without creating data.

Requires `curl` to be installed and available in the system's PATH.
"""

import argparse
import json
import os
import subprocess
from pathlib import Path
from typing import Optional

print("--- SCRIPT EXECUTION STARTED (cURL Edition) ---")

# --- Configuration ---
DIRECTUS_URL = os.getenv("DIRECTUS_URL", "http://localhost:8055")
TOKEN = os.getenv("DIRECTUS_TOKEN", "sfXUxkm3bEwOKO8fDKrZoClDQ4N08D0n")

# --- Constants ---
COMMUNITY_ID = "2a5c769e-9909-4331-99b3-983c8b1175c6"
DEFAULT_SUBMITTER_ID = os.getenv("SUBMITTER_ID", "1030a8c2-888e-4ff9-a9e8-d1b6a7c3d8ea")  # 徐若楠


def parse_args() -> argparse.Namespace:
    """解析命令行参数"""
    parser = argparse.ArgumentParser(
        description="通过 Directus API 批量创建工单 (V2 - cURL 按需上传)。"
    )
    parser.add_argument("definition", help="描述工单的 JSON 文件的路径。 সন")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="打印将要发送的数据，但不实际创建任何内容。"
    )
    return parser.parse_args()

def load_workorders_from_json(path: str) -> list:
    """从 JSON 文件加载工单定义"""
    file_path = Path(path)
    if not file_path.exists():
        raise SystemExit(f"❌ 找不到工单定义文件: {path}")

    with file_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    candidates = data.get("workorders") if isinstance(data, dict) else data
    if not isinstance(candidates, list):
        raise SystemExit("❌ JSON 文件格式错误：应为数组或包含 'workorders' 数组的对象。 সন")
    return candidates

def fix_video_mime_type(file_id: str, file_path: Path) -> bool:
    """修复视频文件的 MIME 类型"""
    # 检测文件扩展名
    ext = file_path.suffix.lower()
    mime_map = {
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.mkv': 'video/x-matroska',
        '.webm': 'video/webm'
    }

    if ext not in mime_map:
        return True  # 不是视频文件，无需修复

    correct_mime = mime_map[ext]
    print(f"       🔧 正在修复视频 MIME 类型为: {correct_mime}")

    try:
        patch_data = json.dumps({"type": correct_mime})
        cmd = [
            "curl", "--noproxy", "*", "-s", "-X", "PATCH",
            "-H", f"Authorization: Bearer {TOKEN}",
            "-H", "Content-Type: application/json",
            "-d", patch_data,
            f"{DIRECTUS_URL}/files/{file_id}"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=10)
        response_json = json.loads(result.stdout)

        if "errors" in response_json:
            print(f"       ⚠ MIME 类型修复失败: {response_json['errors'][0]['message']}")
            return False

        print(f"       ✔ MIME 类型已修复为: {correct_mime}")
        return True
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, json.JSONDecodeError) as e:
        print(f"       ⚠ MIME 类型修复失败: {e}")
        return False

def upload_file(local_path: str, dry_run: bool) -> Optional[str]:
    """使用 cURL 上传单个本地文件到 Directus 并返回其 ID"""
    file_path = Path(local_path)
    if not file_path.exists():
        print(f"    ⚠ 文件不存在，跳过上传: {local_path}")
        return None

    if dry_run:
        print(f"    [dry-run] 计划上传文件: {local_path}")
        return f"dry-run-id-for-{file_path.name}"

    print(f"    ⬆️ 正在上传文件: {local_path}")
    try:
        cmd = [
            "curl", "--noproxy", "*", "-s", "-X", "POST",
            "-H", f"Authorization: Bearer {TOKEN}",
            "-F", f"file=@{local_path}",
            f"{DIRECTUS_URL}/files"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=30)
        response_json = json.loads(result.stdout)

        if "errors" in response_json:
            print(f"       ✖ 上传失败: {response_json['errors'][0]['message']}")
            return None

        file_id = response_json["data"]["id"]
        print(f"       ✔ 上传成功, 文件 ID: {file_id}")

        # 自动修复视频文件的 MIME 类型
        fix_video_mime_type(file_id, file_path)

        return file_id
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError) as e:
        print(f"       ✖ 上传失败 (cURL): {e}")
        if isinstance(e, subprocess.CalledProcessError):
            print(f"         - 响应: {e.stderr or e.stdout}")
    return None

def create_work_order(payload: dict, dry_run: bool):
    """使用 cURL 创建单个工单"""
    if dry_run:
        print("    [dry-run] 准备创建工单，数据如下:")
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return {"data": {"id": "dry-run-workorder-id"}}

    try:
        json_payload = json.dumps(payload)
        cmd = [
            "curl", "--noproxy", "*", "-s", "-X", "POST",
            "-H", f"Authorization: Bearer {TOKEN}",
            "-H", "Content-Type: application/json",
            "--data-binary", "@-",  # 从 stdin 读取数据
            f"{DIRECTUS_URL}/items/work_orders"
        ]
        result = subprocess.run(cmd, input=json_payload, capture_output=True, text=True, check=True, timeout=15)
        return json.loads(result.stdout)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError) as e:
        print(f"       ✖ 创建工单失败 (cURL): {e}")
        if isinstance(e, subprocess.CalledProcessError):
            try:
                return json.loads(e.stdout or e.stderr)
            except json.JSONDecodeError:
                return {"errors": [{"message": e.stderr or e.stdout}]}
        return {"errors": [{"message": str(e)}]}

def main():
    """主执行函数"""
    print("--- DEBUG: Entered main() function ---")
    args = parse_args()

    # --- Pre-flight Check ---
    print("--- 预检: 正在检查服务器连接和 Token... ---")
    try:
        cmd = ["curl", "--noproxy", "*", "-s", "-H", f"Authorization: Bearer {TOKEN}", f"{DIRECTUS_URL}/server/info"]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=10)
        response_json = json.loads(result.stdout)
        project_name = response_json.get("data", {}).get("project", {}).get("project_name", "Unknown Project")
        print(f"--- 预检成功: 已连接到 Directus 项目 \"{project_name}\" ---")
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError) as e:
        print(f"❌ 致命错误：无法连接到 Directus 服务器或 Token 无效。 সন")
        print(f"   请检查 DIRECTUS_URL (当前: {DIRECTUS_URL}) 和 DIRECTUS_TOKEN 环境变量，并确保 'curl' 已安装。 সন")
        if isinstance(e, subprocess.CalledProcessError):
            print(f"   错误详情 (cURL): {e.stderr or e.stdout}")
        else:
            print(f"   错误详情: {e}")
        exit(1)
    # --- End Pre-flight Check ---

    workorders = load_workorders_from_json(args.definition)

    if not workorders:
        print("⚠ JSON 文件中没有任何工单条目")
        return

    print(f"\n======= 开始批量创建工单 (共 {len(workorders)} 条) =======")

    for index, item in enumerate(workorders, start=1):
        print(f"\n--- ( {index}/{len(workorders)} ) 正在处理工单: {item.get('title', '无标题')} ---")

        try:
            uploaded_file_ids = []
            local_files = item.get("local_files", [])
            if isinstance(local_files, list) and local_files:
                print("  - 发现需要上传的文件...")
                for file_path in local_files:
                    new_file_id = upload_file(file_path, args.dry_run)
                    if new_file_id:
                        uploaded_file_ids.append(new_file_id)
            
            payload = {
                "title": item["title"],
                "description": item["description"],
                "category": item["category"],
                "status": item.get("status", "submitted"),
                "priority": item.get("priority", "medium"),
                "community_id": COMMUNITY_ID,
                "submitter_id": item.get("submitter_id", DEFAULT_SUBMITTER_ID),
            }

            if uploaded_file_ids:
                payload["files"] = {"create": [{"directus_files_id": fid} for fid in uploaded_file_ids]}

            print("  - 准备创建工单...")
            response = create_work_order(payload, args.dry_run)

            if response and response.get("data") and response.get("data").get("id"):
                workorder_id = response["data"]["id"]
                print(f"  ✅ 工单创建成功! ID: {workorder_id}")
            else:
                error_msg = response.get("errors", "未知错误")
                print(f"  ❌ 工单创建失败: {error_msg}")

        except KeyError as e:
            print(f"  ✖ 数据准备失败: 缺少必须的字段 {e}")
            print(f"    - 出错的工单数据: {item}")
            continue
        except Exception as e:
            print(f"  ✖ 处理工单时发生未知错误: {e}")
            continue

    print("\n======= 批量创建完成 =======")

# 直接调用 main 函数
main()
