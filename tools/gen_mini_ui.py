# -*- coding: utf-8 -*-
"""为小程序补齐「展示层元数据」：图标、配色、推荐人格、护照戳。

数据本身（景点 / 知识库 / 路线）一律从网页版同步，
但小程序有小程序的皮——emoji 图标、渐变色块、5 个人格的分工，
这些不属于文旅知识，放在这里维护，避免污染 data.js。

生成到 utils/ui.js，页面 require 它再和 db.js 合并。
"""

import io, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
MINI = os.path.join(os.path.dirname(HERE), "mini")

# 5 个人格：与网页版 app/data.js 的 narrator / personas 对齐
PERSONAS = [
    {"idx": 0, "short": "驿丞老爷", "icon": "👲", "color": "#B93A2B"},
    {"idx": 1, "short": "秦少游",   "icon": "🖋️", "color": "#5B7DB1"},
    {"idx": 2, "short": "汪老",     "icon": "📚", "color": "#C9A254"},
    {"idx": 3, "short": "小塔",     "icon": "🗼", "color": "#2F6E63"},
    {"idx": 4, "short": "小史",     "icon": "🏺", "color": "#7A5C3E"},
]

# 景点 id → (图标, 渐变色, 人格下标, 戳名)
SPOT_UI = {
    "yuchengyi":   ("🏛️", "#B93A2B,#8E2A1F", 0, "盂城驿"),
    "zhenguosi":   ("🗼", "#2F6E63,#1F4A42", 3, "镇国寺塔"),
    "wenyoutai":   ("🖌️", "#5B7DB1,#3D5A8F", 1, "文游台"),
    "dangpu":      ("🏦", "#8C6239,#5E3F22", 4, "高邮当铺"),
    "jingtusi":    ("🗿", "#6E86A8,#43597A", 4, "净土寺塔"),
    "kuilou":      ("🏯", "#A8632F,#7A4420", 4, "奎楼宋城墙"),
    "longqiuzhuang": ("🏺", "#7A6A3F,#4F4325", 4, "龙虬庄遗址"),
    "wangshi":     ("✍️", "#4F6B63,#2F463F", 4, "王氏纪念馆"),
    "kangzhan":    ("🎖️", "#9B3B33,#6B211C", 4, "抗战最后一役"),
    "wangzengqi":  ("📖", "#C9A254,#A5813B", 2, "汪曾祺纪念馆"),
    "jiyoujia":    ("🏤", "#7E6BA8,#514379", 4, "集邮家博物馆"),
    "museum":      ("🖼️", "#5E7F8C,#3C5A66", 4, "高邮博物馆"),
    "gaoyouhu":    ("🌊", "#3F7F9C,#255A73", 4, "高邮湖"),
    "huahai":      ("🌼", "#D2A63C,#A87B1F", 4, "湖上花海"),
    "yunhexidi":   ("🌅", "#C97A3E,#8C4A1D", 3, "运河西堤"),
    "nanmen":      ("🏮", "#B65A45,#8B3728", 4, "南门大街"),
    "beimendajie": ("🧧", "#A06A3C,#6E4322", 4, "北门大街"),
}


def main():
    import subprocess, json
    node = subprocess.run(
        ["node", "-e",
         "const D=require('%s');"
         "console.log(JSON.stringify(D.spots.map(s=>({id:s.id,name:s.name,cat:s.cat}))));" %
         os.path.join(MINI, "utils", "db.js").replace("\\", "/")],
        capture_output=True, text=True, cwd=MINI)
    if node.returncode != 0:
        raise SystemExit("读取 db.js 失败：\n" + node.stderr)
    spots = json.loads(node.stdout)

    missing = [s["id"] for s in spots if s["id"] not in SPOT_UI]
    if missing:
        raise SystemExit("缺少展示元数据：%s（请在 tools/gen_mini_ui.py 的 SPOT_UI 里补）" % missing)

    lines = [
        "// 由 tools/gen_mini_ui.py 生成，请勿手改。",
        "// 只放「小程序展示层」的元数据（图标 / 配色 / 人格 / 戳），",
        "// 文旅知识一律来自 utils/db.js（与网页版同源）。",
        "",
        "const personas = %s;" % json.dumps(PERSONAS, ensure_ascii=False, indent=2),
        "",
        "const spotUI = %s;" % json.dumps(
            {k: {"icon": v[0], "bg": "linear-gradient(135deg," + v[1] + ")",
                 "persona": v[2], "personaName": PERSONAS[v[2]]["short"], "stamp": v[3]}
             for k, v in SPOT_UI.items()}, ensure_ascii=False, indent=2),
        "",
        "const stamps = [",
    ]
    for s in spots:
        u = SPOT_UI[s["id"]]
        lines.append('  { n: %s, i: %s, spotId: %s },' % (
            json.dumps(u[3], ensure_ascii=False),
            json.dumps(u[0], ensure_ascii=False),
            json.dumps(s["id"], ensure_ascii=False)))
    lines += [
        "];",
        "",
        "// 给景点数组套上展示字段（保持 db.js 原顺序，18 处一处不落）",
        "function decorate(spots) {",
        "  return spots.map(function (s) {",
        "    const u = spotUI[s.id] || {};",
        "    return Object.assign({}, s, {",
        "      icon: u.icon || '📍',",
        "      bg: u.bg || 'linear-gradient(135deg,#8C6239,#5E3F22)',",
        "      persona: u.persona || 4,",
        "      personaName: u.personaName || '小史',",
        "      stamp: u.stamp || s.name",
        "    });",
        "  });",
        "}",
        "",
        "module.exports = { personas: personas, spotUI: spotUI, stamps: stamps, decorate: decorate };",
    ]
    out = os.path.join(MINI, "utils", "ui.js")
    with io.open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print("✓ 已生成 mini/utils/ui.js  (%d 处景点 / %d 枚戳 / %d 个人格)" %
          (len(spots), len(spots), len(PERSONAS)))


if __name__ == "__main__":
    main()
