#!/usr/bin/env node
/* 邮小驿 · 检索评测（复算 98.42% 这一指标）
 * 用法：node tools/qa_eval.mjs
 * 口径：以每条 kb/kb2/kb3 自带的问法（q 数组）作为测试问句，
 *      期望命中该条自身；取每条 kb 的首个问法 + 全部问法两种口径分别统计。
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const APP = path.join(ROOT, 'app');

global.window = {};
global.self = global.window;
eval(fs.readFileSync(path.join(APP, 'data.js'), 'utf8'));
eval(fs.readFileSync(path.join(APP, 'data-kb.js'), 'utf8'));
const qa = require(path.join(APP, 'shared/qa.js'));

const D = global.window.YXY;
const eng = qa.createEngine(D);
const st = eng.stats();
console.log('语料：kb=%d 条，非遗=%d 条，景点实体=%d，意图=%d',
  st.kb, st.heritage, st.entities, st.intents);

const groups = [
  ['kb', D.kb], ['kb2', D.kb2], ['kb3', D.kb3], ['heritage', D.heritage],
];

/* 语料里存在同义重复条目（如 k53「文游台门票」与 k153「文游台门票多少钱」），
 * 命中同义条目同样算对。判定口径：期望条目的任一问法被命中条目完整收录。 */
const ALL = [];
for (const [, arr] of groups) if (Array.isArray(arr)) ALL.push(...arr);
const byId = new Map(ALL.map(it => [it.id, it]));
function equivalent(expectedId, gotId) {
  if (expectedId === gotId) return true;
  const exp = byId.get(expectedId), got = byId.get(gotId);
  if (!exp || !got) return false;
  const qs = id => (Array.isArray(byId.get(id).q) ? byId.get(id).q : [byId.get(id).q]);
  const norm = new Set(qs(gotId));
  return qs(expectedId).some(q => norm.has(q));
}

let qTotal = 0, qHit = 0;
let firstTotal = 0, firstHit = 0;
const miss = [];

for (const [name, arr] of groups) {
  if (!Array.isArray(arr)) continue;
  for (const item of arr) {
    const qs = (Array.isArray(item.q) ? item.q : [item.q]).filter(Boolean);
    if (!qs.length) continue;
    qs.forEach((q, i) => {
      const r = eng.search(q);
      const ok = r.hit && equivalent(item.id, r.id);
      qTotal++;
      if (ok) qHit++;
      if (i === 0) { firstTotal++; if (ok) firstHit++; }
      if (!ok && miss.length < 40) {
        miss.push({ src: name, id: item.id, q, got: r.hit ? r.id : '(未命中)', score: r.score });
      }
    });
  }
}

const pct = (a, b) => b ? (a / b * 100).toFixed(2) + '%' : 'n/a';
console.log('全部问法：%d/%d = %s', qHit, qTotal, pct(qHit, qTotal));
console.log('首问法  ：%d/%d = %s', firstHit, firstTotal, pct(firstHit, firstTotal));
if (miss.length) {
  console.log('\n未命中/串条示例（最多 40 条）：');
  for (const m of miss) console.log(`  [${m.src}:${m.id}] 「${m.q}」 → ${m.got} (score=${m.score})`);
}
