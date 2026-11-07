# -*- coding: utf-8 -*-
"""生成页面内嵌的体验二维码（app/assets/img/qr.png）。

为什么需要这个脚本：
  二维码指向的是「已发布应用」的分享链接，而不是仓库里的文件。
  每次重新发布，链接（尤其是 sharecode）都会变，页面里的二维码就必须重做，
  否则游客扫码进去的是上一个版本 —— 这个坑真实踩过。

用法：
  python3 tools/make_qr.py "https://xxx.app.workbuddy.host/?sharecode=XXXX"
  不带参数时，读取 tools/qr_target.txt 里记录的链接。

生成后会立刻反解一遍，确认图里的内容与目标一致才落盘。
"""

import io
import os
import sys

import qrcode
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "app", "assets", "img", "qr.png")
TARGET_FILE = os.path.join(ROOT, "tools", "qr_target.txt")

SIZE = 760          # 与原图一致的像素边长
BORDER = 2          # 与原图接近的静默区（模块数）


def decode(path):
    """用 OpenCV 反解，确认二维码内容。"""
    import cv2
    img = cv2.imread(path)
    det = cv2.QRCodeDetector()
    ok, pts = det.detect(img)
    if not ok:
        return None
    data, _ = det.decode(img, pts)[0:2]
    return data


def main():
    if len(sys.argv) > 1:
        url = sys.argv[1].strip()
    elif os.path.exists(TARGET_FILE):
        with io.open(TARGET_FILE, encoding="utf-8") as f:
            url = f.read().strip()
    else:
        raise SystemExit("✗ 请传入分享链接，或先写入 tools/qr_target.txt")

    if not url.startswith("https://"):
        raise SystemExit("✗ 链接必须以 https:// 开头：%s" % url)

    q = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=BORDER,
    )
    q.add_data(url)
    q.make(fit=True)
    img = q.make_image(fill_color="black", back_color="white").convert("RGB")
    # 统一到固定边长，和原图观感一致；NEAREST 保住模块边缘的锐利
    img = img.resize((SIZE, SIZE), Image.NEAREST)
    img.save(OUT, "PNG", optimize=True)

    with io.open(TARGET_FILE, "w", encoding="utf-8") as f:
        f.write(url + "\n")

    got = decode(OUT)
    print("✓ 已生成 %s" % os.path.relpath(OUT, ROOT))
    print("  目标链接：%s" % url)
    print("  反解校验：%s" % (got or "（解码失败）"))
    if got != url:
        raise SystemExit("✗ 反解结果与目标不一致，二维码不可用")
    print("  尺寸：%d×%d，%d 字节" % (SIZE, SIZE, os.path.getsize(OUT)))


if __name__ == "__main__":
    main()
