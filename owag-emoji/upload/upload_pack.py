#!/usr/bin/env python3
"""Tải bộ emoji oWAG lên Telegram bằng Bot API (chỉ dùng thư viện chuẩn của Python).

Chuẩn bị:
  1. Tạo bot qua @BotFather, lấy token.
  2. Lấy ID số của tài khoản Telegram (ví dụ qua @userinfobot).
  3. Nhắn /start cho bot vừa tạo (bắt buộc, nếu không Telegram báo lỗi người dùng).

Chạy:
  export TELEGRAM_BOT_TOKEN="123456:ABC..."
  python3 upload/upload_pack.py --user-id 123456789

Tuỳ chọn:
  --mode mixed   (mặc định) 8 emoji có bản động dùng WEBM, còn lại PNG — một bộ duy nhất
  --mode static  toàn bộ 57 emoji dạng PNG tĩnh
  --mode video   chỉ 8 emoji động
  --name owag    phần đầu tên ngắn; tên đầy đủ sẽ là owag_by_<tên_bot>
  --title oWAG   tên hiển thị của bộ
  --dry-run      chỉ in danh sách, không gửi gì
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

DIST = Path(__file__).resolve().parent.parent / "dist"
API = "https://api.telegram.org/bot{token}/{method}"
FIRST_BATCH = 50  # createNewStickerSet nhận tối đa 50 emoji một lần


def multipart(fields, files):
    boundary = uuid.uuid4().hex
    out = bytearray()
    for k, v in fields.items():
        out += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n".encode()
        out += str(v).encode() + b"\r\n"
    for k, (filename, data, ctype) in files.items():
        out += (
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"; filename=\"{filename}\"\r\n"
            f"Content-Type: {ctype}\r\n\r\n"
        ).encode()
        out += data + b"\r\n"
    out += f"--{boundary}--\r\n".encode()
    return bytes(out), f"multipart/form-data; boundary={boundary}"


def call(token, method, fields=None, files=None, retries=5, soft=False):
    fields = fields or {}
    files = files or {}
    body, ctype = multipart(fields, files)
    for attempt in range(retries):
        req = urllib.request.Request(API.format(token=token, method=method), data=body, headers={"Content-Type": ctype})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                res = json.loads(r.read())
        except urllib.error.HTTPError as e:
            res = json.loads(e.read() or b"{}")
        except urllib.error.URLError as e:
            wait = 2 ** attempt
            print(f"  mạng lỗi ({e.reason}), thử lại sau {wait}s")
            time.sleep(wait)
            continue
        if res.get("ok"):
            return res["result"]
        retry_after = (res.get("parameters") or {}).get("retry_after")
        if retry_after:
            print(f"  Telegram yêu cầu chờ {retry_after}s")
            time.sleep(retry_after + 1)
            continue
        if soft:
            return None
        raise SystemExit(f"Lỗi {method}: {res.get('description', res)}")
    raise SystemExit(f"Lỗi {method}: hết lượt thử lại")


def keywords(words):
    # Telegram: tối đa 20 từ khoá, tổng độ dài không quá 64 ký tự
    out, total = [], 0
    for w in words:
        if len(out) >= 20 or total + len(w) > 64:
            break
        out.append(w)
        total += len(w)
    return out


def build_items(manifest, mode):
    items = []
    for it in manifest["items"]:
        if mode == "video":
            if "video" not in it:
                continue
            path, fmt, ctype = it["video"], "video", "video/webm"
        elif mode == "mixed" and "video" in it:
            path, fmt, ctype = it["video"], "video", "video/webm"
        else:
            path, fmt, ctype = it["static"], "static", "image/png"
        items.append({"id": it["id"], "file": DIST / path, "format": fmt, "ctype": ctype,
                      "emoji_list": it["emoji"][:20], "keywords": keywords(it["keywords"])})
    return items


def input_sticker(item, attach):
    return {"sticker": f"attach://{attach}", "format": item["format"],
            "emoji_list": item["emoji_list"], "keywords": item["keywords"]}


def main():
    ap = argparse.ArgumentParser(description="Tải bộ emoji oWAG lên Telegram")
    ap.add_argument("--token", default=os.environ.get("TELEGRAM_BOT_TOKEN"))
    ap.add_argument("--user-id", type=int, required=True, help="ID số của tài khoản sẽ sở hữu bộ emoji")
    ap.add_argument("--mode", choices=["mixed", "static", "video"], default="mixed")
    ap.add_argument("--name", default="owag")
    ap.add_argument("--title", default="oWAG")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    manifest = json.loads((DIST / "manifest.json").read_text(encoding="utf-8"))
    items = build_items(manifest, a.mode)
    if not items:
        raise SystemExit("Không có emoji nào để tải.")

    if a.dry_run:
        for i, it in enumerate(items, 1):
            print(f"{i:>2}. {it['id']:<14} {it['format']:<6} {' '.join(it['emoji_list'])}  {', '.join(it['keywords'])}")
        print(f"Tổng: {len(items)} emoji, chế độ {a.mode}")
        return

    if not a.token:
        raise SystemExit("Thiếu token bot: đặt biến TELEGRAM_BOT_TOKEN hoặc dùng --token")

    bot = call(a.token, "getMe")
    set_name = f"{a.name}_by_{bot['username']}"
    print(f"Bot: @{bot['username']} · bộ emoji: {set_name} · {len(items)} emoji ({a.mode})")

    # Dừng nếu tên bộ đã tồn tại, tránh tạo trùng.
    if call(a.token, "getStickerSet", {"name": set_name}, soft=True):
        raise SystemExit(f"Bộ '{set_name}' đã tồn tại. Đổi --name hoặc xoá bộ cũ qua @Stickers.")

    first, rest = items[:FIRST_BATCH], items[FIRST_BATCH:]
    files = {f"f{i}": (it["file"].name, it["file"].read_bytes(), it["ctype"]) for i, it in enumerate(first)}
    stickers = [input_sticker(it, f"f{i}") for i, it in enumerate(first)]
    call(a.token, "createNewStickerSet", {
        "user_id": a.user_id, "name": set_name, "title": a.title,
        "sticker_type": "custom_emoji", "stickers": json.dumps(stickers, ensure_ascii=False),
    }, files)
    print(f"  đã tạo bộ với {len(first)} emoji")

    for it in rest:
        call(a.token, "addStickerToSet", {
            "user_id": a.user_id, "name": set_name,
            "sticker": json.dumps(input_sticker(it, "f0"), ensure_ascii=False),
        }, {"f0": (it["file"].name, it["file"].read_bytes(), it["ctype"])})
        print(f"  + {it['id']}")
        time.sleep(0.4)

    # Đặt dấu oWAG làm ảnh đại diện của bộ.
    st = call(a.token, "getStickerSet", {"name": set_name})
    if st["stickers"]:
        call(a.token, "setCustomEmojiStickerSetThumbnail",
             {"name": set_name, "custom_emoji_id": st["stickers"][0]["custom_emoji_id"]})

    print(f"\nXong: https://t.me/addemoji/{set_name}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(1)
