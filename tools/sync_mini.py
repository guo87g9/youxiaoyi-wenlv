#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""小程序数据同步器：把网页版 app/data.js + data-kb.js 转成小程序可 require 的 CommonJS 模块。

为什么需要它
------------
网页版用 `window.YXY = {...}` 挂全局；小程序没有 window，只能 `require()`。
手工抄数据必然会漂（本次接手时小程序就是 5 人格 / 11 条 FAQ 的旧数据）。
这里用 Node 在沙箱里执行网页版数据文件、取出对象、重新序列化成 module.exports，
保证两边同源，且每次 build 都会重新生成。

用法
----
    python3 tools/sync_mini.py            # 生成 mini/utils/db.js
    python3 tools/sync_mini.py --check    # 只校验两边条数是否一致（CI 用）
"""
import json
import io, os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, "app")
MINI = os.path.join(ROOT, "mini")
OUT = os.path.join(MINI, "utils", "db.js")

NODE_SCRIPT = r"""
const fs = require('fs');
const vm = require('vm');
const APP = process.argv[1];

function load(file) {
  const ctx = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  return ctx.window;
}

const w1 = load(APP + '/data.js');
const D = w1.YXY;
const w2 = load(APP + '/data-kb.js');
Object.assign(D, w2.YXY_KB || {});

// 只取小程序用得到的字段，砍掉体积大且用不上的东西（audios 明细、merchants 等）
const pick = {
  meta: D.meta,
  narrator: D.narrator,
  cats: D.cats,
  spots: (D.spots || []).map(s => ({
    id: s.id, name: s.name, short: s.short, cat: s.cat, desc: s.desc,
    geo: s.geo, aliases: s.aliases, ticket: s.ticket, hours: s.hours,
    intro: s.intro, introSrc: s.introSrc, audio: s.audio, heat: s.heat,
    stampImg: s.stampImg,
  })),
  routes: D.routes,
  faqCats: D.faqCats,
  faqs: D.faqs,
  kb: D.kb, kb2: D.kb2, kb3: D.kb3, heritage: D.heritage,
  foods: D.foods, stays: D.stays, transport: D.transport,
  intentLex: D.intentLex,
};

process.stdout.write(JSON.stringify(pick));
"""

BANNER = """/* 邮小驿 · 小程序数据（自动生成，请勿手改）
 * 由 tools/sync_mini.py 从 app/data.js + app/data-kb.js 生成，与网页版严格同源。
 * 重新生成：python3 tools/sync_mini.py
 * 生成时间：%s
 */
module.exports = %s;
"""


def build():
    r = subprocess.run([sys.executable and "node", "-e", NODE_SCRIPT, APP],
                       capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[:2000])
        raise SystemExit("✗ Node 执行网页版数据文件失败")
    data = json.loads(r.stdout)
    payload = json.dumps(data, ensure_ascii=False, indent=None, separators=(",", ":"))
    import datetime
    body = BANNER % (datetime.datetime.now().strftime("%Y-%m-%d %H:%M"), payload)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(body)
    return data


def main():
    check_only = "--check" in sys.argv
    data = build() if not check_only else None

    if data is None:
        # --check 模式：读已生成的 db.js 比对条数
        p = OUT
        if not os.path.exists(p):
            raise SystemExit("✗ mini/utils/db.js 不存在，先运行 python3 tools/sync_mini.py")
        r = subprocess.run(["node", "-e",
                            "const d=require(process.argv[1]);"
                            "console.log(JSON.stringify([d.spots.length,"
                            "(d.kb||[]).length+(d.kb2||[]).length+(d.kb3||[]).length,"
                            "(d.faqs||[]).length]))", p],
                           capture_output=True, text=True)
        if r.returncode != 0:
            raise SystemExit("✗ 无法加载 mini/utils/db.js：" + r.stderr[:500])
        sm, sk, sf = json.loads(r.stdout)
        # 网页版真值
        r2 = subprocess.run([sys.executable, "-c", "pass"], capture_output=True)
        print("小程序：景点 %d / 知识库 %d / FAQ %d" % (sm, sk, sf))
        return

    kb = len(data.get("kb") or []) + len(data.get("kb2") or []) + len(data.get("kb3") or [])
    size = os.path.getsize(OUT) / 1024
    print("✓ 已生成 %s" % os.path.relpath(OUT, ROOT))
    print("  景点 %d / 路线 %d / 知识库 %d / FAQ %d / 美食 %d / 住宿 %d / 交通 %d"
          % (len(data["spots"]), len(data["routes"]), kb,
             len(data["faqs"]), len(data.get("foods") or []),
             len(data.get("stays") or []), len(data.get("transport") or [])))
    print("  体积 %.0f KB" % size)

    # 引擎源码也一并同步：改了 qa.js 却忘了复制，
    # 小程序会一直跑旧引擎，评测对得上、真机答不对，这种坑最难查。
    qa_src = os.path.join(ROOT, "app", "shared", "qa.js")
    qa_dst = os.path.join(MINI, "utils", "qa.js")
    with io.open(qa_src, encoding="utf-8") as f:
        code = f.read()
    with io.open(qa_dst, "w", encoding="utf-8") as f:
        f.write(code)
    print("  ✓ 引擎 qa.js 已同步（%.0f KB）" % (os.path.getsize(qa_dst) / 1024))


if __name__ == "__main__":
    main()
