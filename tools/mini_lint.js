// WXML 静态检查：标签闭合、花括号配对、wx:key 覆盖、事件绑定、字段引用。
// 用法：node tools/mini_lint.js
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'mini', 'pages');
let issues = 0;
for (const page of fs.readdirSync(ROOT)) {
  const dir = path.join(ROOT, page);
  const wxml = path.join(dir, page + '.wxml');
  if (!fs.existsSync(wxml)) continue;
  const s = fs.readFileSync(wxml, 'utf8');

  // 1. 标签配对
  const stack = [];
  const tagRe = /<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g;
  let m;
  while ((m = tagRe.exec(s))) {
    const [, close, name, attrs, selfClose] = m;
    if (selfClose || ['input','image','icon','import','include','wxs'].includes(name)) continue;
    if (!close) stack.push(name);
    else {
      const top = stack.pop();
      if (top !== name) { console.log(`✗ ${page}: </${name}> 与 <${top}> 不匹配`); issues++; }
    }
  }
  if (stack.length) { console.log(`✗ ${page}: 未闭合 <${stack.join('>, <')}>`); issues++; }

  // 2. 双花括号配对
  const open = (s.match(/{{/g) || []).length;
  const closeN = (s.match(/}}/g) || []).length;
  if (open !== closeN) { console.log(`✗ ${page}: {{ ${open} 个 / }} ${closeN} 个`); issues++; }

  // 3. wx:for 里用 item/index，别处误用
  // 4. wx:key 检查
  const fors = s.match(/wx:for="[^"]*"/g) || [];
  const keys = s.match(/wx:key="[^"]*"/g) || [];
  if (fors.length > keys.length) { console.log(`⚠ ${page}: ${fors.length} 个 wx:for 只有 ${keys.length} 个 wx:key`); }
  console.log(`✓ ${page}.wxml  标签 ${(s.match(/<[a-zA-Z]/g)||[]).length} 个 / 循环 ${fors.length} 处`);
}
console.log(issues ? `\n✗ ${issues} 个问题` : '\n✓ WXML 结构检查通过');


/* ---------- 事件绑定是否都能在页面 js 里找到 ---------- */
for (const page of fs.readdirSync(ROOT)) {
  const wxml = path.join(ROOT, page, page + '.wxml');
  const js = path.join(ROOT, page, page + '.js');
  if (!fs.existsSync(wxml) || !fs.existsSync(js)) continue;
  const s = fs.readFileSync(wxml, 'utf8');
  const code = fs.readFileSync(js, 'utf8');
  const handlers = new Set();
  const re = /\b(?:bind|catch)(?::)?[a-z]+="([A-Za-z_$][\w$]*)"/g;
  let m;
  while ((m = re.exec(s))) handlers.add(m[1]);
  const missing = [...handlers].filter(h => !new RegExp('(^|[\\s,{])' + h + '\\s*[(:]', 'm').test(code));
  if (missing.length) { console.log(`✗ ${page}: 模板调用但 JS 里没有 → ${missing.join(', ')}`); issues++; }
  else console.log(`✓ ${page}: ${handlers.size} 个事件处理函数全部存在`);
}

/* ---------- 模板引用的字段是否真的有数据 ---------- */
const store = {};
global.wx = {
  setStorageSync: (k, v) => { store[k] = v; },
  getStorageSync: (k) => (k in store ? store[k] : ''),
  removeStorageSync: (k) => { delete store[k]; },
  showToast() {}, showModal() {}, switchTab() {}, setClipboardData() {},
  createInnerAudioContext: () => ({ play() {}, stop() {} })
};
let cap = null;
global.Page = (c) => { cap = c; };

for (const page of fs.readdirSync(ROOT)) {
  const wxml = path.join(ROOT, page, page + '.wxml');
  const js = path.join(ROOT, page, page + '.js');
  if (!fs.existsSync(wxml) || !fs.existsSync(js)) continue;

  cap = null;
  delete require.cache[require.resolve(js)];
  require(js);
  const inst = Object.assign({}, cap, {
    data: JSON.parse(JSON.stringify(cap.data || {})),
    setData(p) { Object.keys(p).forEach(k => { this.data[k] = p[k]; }); }
  });
  try {
    inst.onLoad && inst.onLoad();
    inst.onShow && inst.onShow();
    if (page === 'route') { inst.setData({ tIdx: 1, sIdx: 1 }); inst.gen(); }
    if (page === 'faq') inst.ask('盂城驿门票多少钱');
    if (page === 'passport') inst.stamp({ currentTarget: { dataset: { id: 'yuchengyi' } } });
  } catch (e) {
    console.log(`✗ ${page}: 生命周期/交互抛错 → ${e.message}`);
    issues++;
    continue;
  }

  const s = fs.readFileSync(wxml, 'utf8');
  const vars = new Set();
  const re = /\{\{([^}]*)\}\}/g;
  let m;
  while ((m = re.exec(s))) {
    const clean = m[1].replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '');
    const ids = (clean.match(/(^|[^.\w$])([A-Za-z_$][\w$]*)/g) || []).map(x => x.replace(/^[^.\w$]/, ''));
    ids.forEach(id => {
      if (['item', 'index', 'true', 'false', 'null', 'undefined', 'length'].includes(id)) return;
      vars.add(id);
    });
  }
  const keys = new Set(Object.keys(inst.data));
  const miss = [...vars].filter(v => !keys.has(v));
  if (miss.length) {
    console.log(`✗ ${page}: 模板引用了 data 里没有的字段 → ${miss.join(', ')}`);
    issues++;
  } else {
    console.log(`✓ ${page}: 模板引用 ${vars.size} 个字段，全部有数据`);
  }
}

console.log(issues ? `\n✗ ${issues} 个问题` : '\n✓ 小程序静态检查全部通过');
process.exit(issues ? 1 : 0);
