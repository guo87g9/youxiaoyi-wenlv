#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 app/ 目录打成单文件 HTML（图片全内联，可选音频内联）。

用法：
  python3 tools/pack_single.py                 # 出 交付/邮小驿-单文件版.html
  python3 tools/pack_single.py --with-audio    # 出 交付/邮小驿-单文件版-含音频.html

产物结构（与手工改产物无关，每次从 app/ 重新生成）：
  <style>            app.css 内联
  <body>             index.html 的 body
  <script>           __SINGLE_FILE 标记
  <script>           config.js 内联（演示用，含天地图密钥）
  <script>           data.js + data-kb.js + 合并 IIFE
  <script>           shared/qa.js
  <script>           shared/map.js
  <script>           （可选）音频 base64 表 + __audioResolve
  <script>           app.js（a.src 改写为经 __audioResolve 解析）
"""
import base64
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, "app")
OUT_DIR = os.path.join(ROOT, "交付")

MIME = {
    ".webp": "image/webp",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".mp3": "audio/mpeg",
}

MERGE_IIFE = """
/* 单文件版：扩展数据已内联，这里直接合并进 window.YXY */
(function () {
  var kb = window.YXY_KB;
  if (!kb || !window.YXY) return;
  for (var k in kb) {
    if (Object.prototype.hasOwnProperty.call(kb, k)) window.YXY[k] = kb[k];
  }
})();
"""


def read(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def data_uri(path):
    ext = os.path.splitext(path)[1].lower()
    mime = MIME.get(ext, "application/octet-stream")
    with open(path, "rb") as f:
        raw = f.read()
    return "data:%s;base64,%s" % (mime, base64.b64encode(raw).decode("ascii"))


def build(with_audio=False):
    html = read(os.path.join(APP, "index.html"))
    css = read(os.path.join(APP, "app.css"))
    data_js = read(os.path.join(APP, "data.js"))
    data_kb = read(os.path.join(APP, "data-kb.js"))
    qa_js = read(os.path.join(APP, "shared", "qa.js"))
    map_js = read(os.path.join(APP, "shared", "map.js"))
    app_js = read(os.path.join(APP, "app.js"))

    # 1) 样式内联
    html = html.replace('<link rel="stylesheet" href="app.css">',
                        "<style>\n" + css + "\n</style>")

    # 2) 配置：把动态 document.write(config.js) 换成直接内联，缺失时用空 key 兜底
    cfg_path = os.path.join(APP, "config.js")
    cfg = read(cfg_path) if os.path.exists(cfg_path) else \
        'window.YXY_CONFIG = {map:{tk:""},api:{base:""},geo:{radius:300}};'
    html = re.sub(
        r'<!-- 本地配置：.*?-->\s*<script>.*?</script>\s*',
        "<script>\n" + cfg + "\n</script>\n",
        html, flags=re.S)

    # 3) 数据脚本：data.js + data-kb.js + 合并，替换掉原来的 <script src="data.js">
    html = html.replace(
        '<script src="data.js"></script>',
        "<script>window.__SINGLE_FILE=1;</script>\n<script>\n" + data_js + "\n" +
        data_kb + "\n" + MERGE_IIFE + "\n</script>")

    # 4) 其余脚本内联
    for name, code in (("shared/qa.js", qa_js), ("shared/map.js", map_js)):
        html = html.replace('<script src="%s"></script>' % name,
                            "<script>\n" + code + "\n</script>")

    # app.js：音频要走 base64 表，否则 file:// 下播不出来
    app_js = app_js.replace(
        "a.src = meta.src;",
        "a.src = (window.__audioResolve || function(s){return s;})(meta.src);")
    html = html.replace('<script src="app.js"></script>',
                        "<script>\n" + app_js + "\n</script>")

    # 5) 可选：音频 base64
    audio_note = ""
    if with_audio:
        adir = os.path.join(APP, "assets", "audio")
        items = []
        total = 0
        for fn in sorted(os.listdir(adir)):
            if not fn.lower().endswith(".mp3"):
                continue
            p = os.path.join(adir, fn)
            with open(p, "rb") as f:
                raw = f.read()
            total += len(raw)
            items.append('"%s":"%s"' % (fn[:-4], base64.b64encode(raw).decode("ascii")))
        audio_js = (
            "<script>\n/* 单文件版音频：base64 已内联，file:// 下也能播 */\n"
            "window.__AUDIO_B64 = {\n" + ",\n".join(items) + "\n};\n"
            "(function(){\n"
            "  var M = window.__AUDIO_B64 || {}, N = 0;\n"
            "  for (var k in M) N++;\n"
            "  window.__AUDIO_AVAILABLE = N;\n"
            "  window.__audioResolve = function(src){\n"
            "    var name = String(src || '').split('/').pop().replace(/\\.mp3$/i, '');\n"
            "    return M[name] ? 'data:audio/mpeg;base64,' + M[name] : src;\n"
            "  };\n"
            "})();\n</script>\n")
        html = html.replace("<script>\n" + app_js, audio_js + "<script>\n" + app_js, 1)
        audio_note = "（含 %d 段音频内联，共 %.2f MB）" % (len(items), total / 1024 / 1024)

    # 6) 图片全部内联：把 assets/img/xxx 换成 data URI
    img_root = os.path.join(APP, "assets", "img")
    paths = set()
    for dirpath, _dn, fns in os.walk(img_root):
        for fn in fns:
            p = os.path.join(dirpath, fn)
            rel = os.path.relpath(p, APP).replace(os.sep, "/")
            paths.add(rel)
    # 长的先替换，避免 yuchengyi-800 被 yuchengyi-80 截断（当前没有这种，但别赌）
    for rel in sorted(paths, key=len, reverse=True):
        if rel in html:
            html = html.replace(rel, data_uri(os.path.join(APP, rel)))

    os.makedirs(OUT_DIR, exist_ok=True)
    name = "邮小驿-单文件版-含音频.html" if with_audio else "邮小驿-单文件版.html"
    out = os.path.join(OUT_DIR, name)
    with open(out, "w", encoding="utf-8") as f:
        f.write(html)

    size = os.path.getsize(out) / 1024 / 1024
    left = re.findall(r'assets/img/[A-Za-z0-9_./-]+', html)
    print("已生成 %s  %.2f MB%s" % (name, size, audio_note))
    if left:
        print("  ⚠ 仍有未内联的图片引用：%s" % sorted(set(left))[:5])
    return out


if __name__ == "__main__":
    build(with_audio="--with-audio" in sys.argv)
