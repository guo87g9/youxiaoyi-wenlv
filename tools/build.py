#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
邮小驿 · 构建与自检

  python3 tools/build.py            # 自检 → 出 dist/ → 打 zip → 打两份单文件 → 写 _build_report.md

任何一项不通过就直接退出（exit 1），不允许"带病打包"。
产物统一落在 交付/ 下，源码永远在 app/ 下，不要手改产物。
"""
import json
import os
import re
import shutil
import subprocess
import sys
import zipfile
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, "app")
DIST = os.path.join(ROOT, "dist")
# 交付目录固定在工作区根 /workspace/交付 —— 那是用户能看见的地方。
# 曾经写成 ROOT/交付，结果仓库里和 workspace 下各有一份产物，
# 改了源码只更新了仓库那份，用户打开的却是旧的。一个路径只能有一个真身。
OUT = os.path.join(os.path.dirname(ROOT), "交付")

errors = []
notes = []


def kb(n):
    return n / 1024.0


def mb(n):
    return n / 1024.0 / 1024.0


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def walk_files(base):
    for dp, _dn, fns in os.walk(base):
        for fn in fns:
            yield os.path.join(dp, fn)


def size_of(paths):
    return sum(os.path.getsize(p) for p in paths if os.path.exists(p))


def main():
    # ---------- 1. HTML 结构 ----------
    idx = read(os.path.join(APP, "index.html"))
    op = len(re.findall(r"<div\b", idx))
    cl = len(re.findall(r"</div>", idx))
    if op != cl:
        errors.append("index.html div 不平衡：%d 开 / %d 闭" % (op, cl))

    # ---------- 2. 资源引用 ----------
    app_files = [p for p in walk_files(APP) if not p.endswith(".md")]
    refs = set()
    for p in app_files:
        if not p.endswith((".html", ".css", ".js")):
            continue
        txt = read(p)
        for m in re.findall(r"assets/[A-Za-z0-9_./-]+\.(?:webp|png|jpg|jpeg|svg|mp3)", txt):
            refs.add(m)
    missing = [r for r in sorted(refs) if not os.path.exists(os.path.join(APP, r))]
    if missing:
        errors.append("资源缺失 %d 个：%s" % (len(missing), missing[:5]))

    # ---------- 3. 景点与音频 ----------
    data_js = read(os.path.join(APP, "data.js"))
    data_kb = read(os.path.join(APP, "data-kb.js"))
    # 景点 = 带 geo 坐标的条目（data.js 里只有景点有 geo）
    spot_ids = re.findall(r'id:\s*"([a-z0-9\-]+)",\s*name:', data_js)
    # 商户也是 id + name 的结构（m1/m2/m3），不是景点，剔掉
    spot_ids = [i for i in spot_ids if not re.match(r"^m\d+$", i)]
    geo_cnt = len(re.findall(r"geo:\s*\{\s*lat:", data_js))
    if len(spot_ids) != len(set(spot_ids)):
        errors.append("景点 id 有重复")
    if geo_cnt != 17:
        notes.append("景点 geo 条目数为 %d（预期 17）" % geo_cnt)

    audio_entries = re.findall(
        r'"([\w\-]+)"\s*:\s*\{[^}]*?src:\s*"assets/audio/([^"]+)"[^}]*?kind:\s*"(\w+)"',
        data_js + data_kb)
    audio_files = sorted(os.listdir(os.path.join(APP, "assets", "audio")))
    audio_files = [f for f in audio_files if f.lower().endswith(".mp3")]
    kind = {"official": 0, "ai": 0}
    for _k, _f, kd in audio_entries:
        kind[kd] = kind.get(kd, 0) + 1
    if len(audio_files) != len(set(f for _k, f, _kd in audio_entries)):
        errors.append("音频文件数（%d）与引用去重数（%d）不一致"
                      % (len(audio_files), len(set(f for _k, f, _kd in audio_entries))))

    audio_sizes = [os.path.getsize(os.path.join(APP, "assets", "audio", f)) for f in audio_files]
    audio_total = sum(audio_sizes)

    # ---------- 4. 首屏体积 ----------
    first = [os.path.join(APP, x) for x in
             ("index.html", "app.css", "app.js", "data.js", "shared/qa.js", "shared/map.js")]
    first_kb = kb(size_of(first))
    kb_kb = kb(os.path.getsize(os.path.join(APP, "data-kb.js")))
    # 首屏口径：代码 + 位图缩略图（webp）；矢量插画单独计，不进首屏预算
    # （2026-11-06 统一口径：旧报告 136 KB 只算了 webp，svh 从未计入）
    thumbs = sorted(set(re.findall(r'thumb:\s*"([^"]+)"', data_js)))
    thumb_webp = kb(size_of([os.path.join(APP, t) for t in thumbs if t.endswith(".webp")]))
    thumb_svg = kb(size_of([os.path.join(APP, t) for t in thumbs if t.endswith(".svg")]))
    thumb_kb = thumb_webp
    total_first = first_kb + thumb_webp
    # 2026-11-07：17 个点位全部改为实景照（原 7 张照片 + 10 张矢量插画，插画几乎不占体积），
    # 位图张数由 7 增至 17，首屏预算按 500 KB 执行。
    if total_first > 500:
        errors.append("首屏 %.0f KB 超过 500 KB 预算" % total_first)

    # ---------- 5. dist ----------
    if os.path.isdir(DIST):
        shutil.rmtree(DIST)
    shutil.copytree(APP, DIST)
    # 评测脚本随包分发：交付方拿到 zip 后可直接 `node tools/qa_eval.mjs` 复算检索准确率
    dist_tools = os.path.join(DIST, "tools")
    os.makedirs(dist_tools, exist_ok=True)
    shutil.copy(os.path.join(ROOT, "tools", "qa_eval.mjs"), dist_tools)
    dist_files = list(walk_files(DIST))
    dist_size = size_of(dist_files)

    # ---------- 5.1 docs/（GitHub Pages 源） ----------
    # Pages 只接受仓库根目录或 /docs，且不允许多余的构建步骤时最省事的形态就是静态副本。
    # 只放前端必需的运行文件：不含 config.js（key）、不含音频（15MB，Pages 走流量且非必需）。
    DOCS = os.path.join(ROOT, "docs")
    if os.path.isdir(DOCS):
        shutil.rmtree(DOCS)
    os.makedirs(DOCS)
    for name in ("index.html", "app.css", "app.js", "data.js", "data-kb.js",
                 "config.example.js", "CREDITS.md"):
        shutil.copy(os.path.join(APP, name), DOCS)
    shutil.copytree(os.path.join(APP, "shared"), os.path.join(DOCS, "shared"))
    # 图片保留（体量小、首屏要用），音频只拷索引到的文件会被音频体积拖垮，故整体跳过
    img_src = os.path.join(APP, "assets", "img")
    if os.path.isdir(img_src):
        shutil.copytree(img_src, os.path.join(DOCS, "assets", "img"))
    lib_src = os.path.join(APP, "assets", "lib")
    if os.path.isdir(lib_src) and any(os.scandir(lib_src)):
        shutil.copytree(lib_src, os.path.join(DOCS, "assets", "lib"))
    # 占位 config.js：不含 key，只保证不出现 404 console error；地图降级为手绘示意
    with open(os.path.join(DOCS, "config.js"), "w", encoding="utf-8") as f:
        f.write('/* GitHub Pages 演示用占位配置：不含任何密钥，key 留空 → 地图自动降级为手绘示意\n'
                ' * 本地开发请复制 config.example.js 到 config.js 并填入自己的天地图 key\n'
                ' */\n'
                'window.YXY_CONFIG = window.YXY_CONFIG || {};\n'
                'window.YXY_CONFIG.map = window.YXY_CONFIG.map || { tk: "" };\n')
    docs_files = list(walk_files(DOCS))
    docs_size = size_of(docs_files)

    # ---------- 6. zip ----------
    os.makedirs(OUT, exist_ok=True)
    zip_path = os.path.join(OUT, "邮小驿-网页版.zip")
    if os.path.exists(zip_path):
        os.remove(zip_path)
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for dp, _dn, fns in os.walk(DIST):
            for fn in sorted(fns):
                p = os.path.join(dp, fn)
                z.write(p, os.path.relpath(p, DIST))
    zip_size = os.path.getsize(zip_path)
    with zipfile.ZipFile(zip_path) as z:
        n_zip = len([n for n in z.namelist() if not n.endswith("/")])

    # ---------- 7. 单文件 ----------
    for args in ([], ["--with-audio"]):
        r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "pack_single.py")] + args,
                           capture_output=True, text=True)
        if r.returncode != 0:
            errors.append("pack_single 失败：%s" % (r.stderr.strip().splitlines() or [""])[-1])
        else:
            notes.append(r.stdout.strip())

    single = os.path.join(OUT, "邮小驿-单文件版.html")
    single_a = os.path.join(OUT, "邮小驿-单文件版-含音频.html")
    for p in (single, single_a):
        if not os.path.exists(p):
            errors.append("单文件缺失：%s" % p)
            continue
        t = read(p)
        if '<script src=' in t or 'href="app.css"' in t:
            errors.append("%s 仍有外链引用" % os.path.basename(p))
        left = set(re.findall(r"assets/img/[A-Za-z0-9_./-]+", t))
        if left:
            errors.append("%s 有 %d 个图片未内联" % (os.path.basename(p), len(left)))
        if len(re.findall(r"<div\b", t)) != len(re.findall(r"</div>", t)):
            errors.append("%s div 不平衡" % os.path.basename(p))

    # ---------- 8. 报告 ----------
    ok = not errors
    lines = []
    lines.append("# 构建与自检报告")
    lines.append("")
    lines.append("- 生成时间：%s" % datetime.now().strftime("%Y-%m-%d %H:%M"))
    lines.append("- HTML `<div>` 平衡：%d 开 / %d 闭  %s" % (op, cl, "OK" if op == cl else "FAIL"))
    lines.append("- 资源引用：%d 个，缺失 %d 个" % (len(refs), len(missing)))
    lines.append("- 景点 id：%d 个（唯一：%s），音频条目：%d 条"
                 % (len(spot_ids), "是" if len(set(spot_ids)) == len(spot_ids) else "否", len(audio_entries)))
    lines.append("- 音频文件：%d 个，合计 %.2f MB，单段最大 %d KB"
                 % (len(audio_files), mb(audio_total), max(audio_sizes) / 1024 if audio_sizes else 0))
    lines.append("- 音频构成（按 data.js 的 kind 标注）：团队录音 %d 条 / AI 合成 %d 条"
                 "（条目比文件多 1：intro 与 gaoyou-intro 指向同一 mp3）"
                 % (kind.get("official", 0), kind.get("ai", 0)))
    lines.append("- 首屏（html+css+js+data，不含 data-kb.js）：%.0f KB" % first_kb)
    lines.append("- 按需加载 data-kb.js（问答/吃住行/非遗）：%.0f KB" % kb_kb)
    lines.append("- 首屏缩略图（webp 位图 17 张，400px/q72）：%.0f KB；矢量插画另计 %.0f KB（已不引用）"
                 % (thumb_webp, thumb_svg))
    lines.append("- 首屏总计：%.0f KB  （≤500KB %s；17 张实景照口径，旧口径 350KB 为 7 照片+10 插画）" % (total_first, "达标" if total_first <= 500 else "超标"))
    lines.append("- dist 总体积：%.2f MB / %d 个文件" % (mb(dist_size), len(dist_files)))
    lines.append("- docs/（GitHub Pages 源，不含音频与 key）：%.2f MB / %d 个文件"
                 % (mb(docs_size), len(docs_files)))
    lines.append("- 网页版 zip：%.2f MB / %d 个文件" % (mb(zip_size), n_zip))
    for p in (single, single_a):
        if os.path.exists(p):
            lines.append("- %s：%.2f MB" % (os.path.basename(p), mb(os.path.getsize(p))))
    lines.append("")
    if errors:
        lines.append("## 未通过 ❌")
        for e in errors:
            lines.append("- " + e)
    else:
        lines.append("## 全部通过 ✅")
    report = "\n".join(lines) + "\n"
    with open(os.path.join(OUT, "_build_report.md"), "w", encoding="utf-8") as f:
        f.write(report)

    print(report)
    if errors:
        print("构建失败：%d 项未通过" % len(errors), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
