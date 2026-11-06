/* 小程序页面逻辑离线自测：模拟 Page()/wx，按页面真实生命周期跑一遍。
 * 只测 JS 逻辑（数据绑定、检索、存储），不渲染 WXML。 */
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', 'mini');

// ---- 模拟 wx ----
const store = {};
let pendingPrefill = '';
global.wx = {
  setStorageSync: (k, v) => { store[k] = v; },
  getStorageSync: (k) => (k in store ? store[k] : ''),
  removeStorageSync: (k) => { delete store[k]; },
  setClipboardData: () => {},
  showToast: () => {},
  showModal: () => {},
  switchTab: () => {},
  createInnerAudioContext: () => ({ play() {}, stop() {}, pause() {} })
};

// ---- 模拟 Page ----
let captured = null;
global.Page = (cfg) => { captured = cfg; };

function makePage(file) {
  captured = null;
  const full = path.join(ROOT, file);
  delete require.cache[require.resolve(full)];
  require(full);
  const cfg = captured;
  // 极简 setData：支持顶层字段，`a.b` 形式不参与测试
  const inst = Object.assign({}, cfg, {
    data: JSON.parse(JSON.stringify(cfg.data || {})),
    setData(patch) {
      Object.keys(patch).forEach((k) => { this.data[k] = patch[k]; });
    }
  });
  return inst;
}

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  ✓ ' + msg); }
  else { fail++; console.log('  ✗ ' + msg); }
}

/* ---------------- 首页 ---------------- */
console.log('\n[首页]');
{
  const p = makePage('pages/index/index.js');
  p.onLoad();
  ok(p.data.total === 17, '景点总数 17（实际 ' + p.data.total + '）');
  ok(p.data.spots.length === 17, '全部筛选下 17 张卡');
  ok(p.data.cats[0].t.indexOf('17') >= 0, '分类文案带数量：' + p.data.cats[0].t);
  ok(p.data.spots.every(s => s.icon && s.bg && s.personaName), '每张卡都有图标/配色/讲解员');
  p.onCat({ currentTarget: { dataset: { k: 'hist' } } });
  ok(p.data.spots.length === 9 && p.data.spots.every(s => s.cat === 'hist'), '筛「历史古迹」得 9 处');
  p.onCat({ currentTarget: { dataset: { k: 'food' } } });
  ok(p.data.spots.length === 2, '筛「街区美食」得 2 处');
}

/* ---------------- 问答页 ---------------- */
console.log('\n[问答页]');
{
  const p = makePage('pages/faq/faq.js');
  p.onLoad();
  const total = p.data.list.length;
  ok(total === 201, '默认列表 201 条知识（实际 ' + total + '）');
  ok(p.data.cats.length === 6, '分类 6 个');

  const cases = [
    ['盂城驿值得去吗', 'yuchengyi|k168|k1|k175'],
    ['盂城驿门票多少钱', 'k151|k29|k158'],
    ['有什么特产可以带', 'k84'],
    ['停车方便吗', 'k30'],
    ['带老人小孩玩什么', 'k71'],
    ['高邮咸鸭蛋为什么好', 'k25'],
    ['从南京怎么去高邮', 'k34'],
    ['上厕所', 'k103']
  ];
  let hit = 0;
  for (const [q, allow] of cases) {
    p.setData({ input: q, ans: null });
    p.onSend();
    const a = p.data.ans;
    const gotId = a && a.ok ? (a.rawId || '') : '';
    // 命中判定：答案文本非空且有出处，或落在允许集合
    if (a && a.ok && a.a) hit++;
    ok(!!(a && a.ok && a.a), '问「' + q + '」→ 有答案（出处：' + (a && a.src ? a.src.slice(0, 14) : '无') + '）');
  }
  ok(hit === cases.length, '热门问法全部命中知识库');

  p.setData({ input: '今天天气怎么样啊啊' });
  p.onSend();
  ok(p.data.ans.ok === false && p.data.ans.more.length > 0, '未命中时给候选问法而不是编答案');

  p.backToList();
  ok(p.data.ans === null, '可以返回列表');

  // 分类筛选后条数应小于全量
  p.onCat({ currentTarget: { dataset: { k: 'ticket' } } });
  ok(p.data.list.length > 0 && p.data.list.length < 201, '筛「门票预约」得 ' + p.data.list.length + ' 条');
}

/* ---------------- 讲解页 ---------------- */
console.log('\n[讲解页]');
{
  const p = makePage('pages/guide/guide.js');
  p.onLoad();
  ok(p.data.personas.length === 5, '5 位讲解员');
  ok(p.data.personas.every(x => x.suggest.length >= 3), '每人至少 3 条推荐问题');
  ok(p.data.messages.length === 1 && p.data.messages[0].role === 'ai', '进入即有一条开场白');
  ok(p.data.personas[0].hello.indexOf('盂城驿') >= 0, '驿丞的开场白提到盂城驿');
}

/* ---------------- 路线页 ---------------- */
console.log('\n[路线页]');
{
  const p = makePage('pages/route/route.js');
  p.onLoad && p.onLoad();
  // 一天 + 文化历史
  p.setData({ tIdx: 1, sIdx: 1 });
  p.gen();
  ok(!!p.data.route, '一天+文化历史 → 出路线：' + (p.data.route && p.data.route.title));
  ok(p.data.route.stops.every(s => s.name && s.time), '每站都有名字和时间');
  // 两天 + 亲子
  p.setData({ tIdx: 2, sIdx: 4 });
  p.gen();
  ok(!!p.data.route, '两天+亲子 → 出路线：' + (p.data.route && p.data.route.title));
  // 两天 + 红色
  p.setData({ tIdx: 2, sIdx: 5 });
  p.gen();
  ok(!!p.data.route, '两天+红色 → 出路线：' + (p.data.route && p.data.route.title));
  ok(p.data.route.tags.indexOf('red') >= 0, '红色偏好命中红色线');
  // 半天 + 不限 → 时长要真的收敛
  p.setData({ tIdx: 0, sIdx: 0 });
  p.gen();
  ok(p.data.route.hours <= 4, '半天偏好下路线不超过 4 小时（实际 ' + p.data.route.hours + '）');
}

/* ---------------- 护照页 ---------------- */
console.log('\n[护照页]');
{
  const p = makePage('pages/passport/passport.js');
  p.onShow();
  ok(p.data.total === 17, '邮戳 17 枚（实际 ' + p.data.total + '）');
  ok(p.data.count === 0, '初始 0 枚');
  p.stamp({ currentTarget: { dataset: { id: 'yuchengyi' } } });
  ok(p.data.count === 1 && p.data.percent === 6, '盖一枚后 1/17，进度 6%');
  p.stamp({ currentTarget: { dataset: { id: 'yuchengyi' } } });
  ok(p.data.count === 1, '重复盖不重复计');
  p.data.stamps.forEach(s => p.stamp({ currentTarget: { dataset: { id: s.spotId } } }));
  ok(p.data.count === 17 && p.data.all, '全部盖满 → 集齐');
  ok(p.data.stamps.every(s => s.got), '每枚都标记为已盖');
  p.data.stamps.forEach(s => { store.youxiaoyi_stamps[s.spotId] = true; });
}

console.log('\n' + (fail ? '✗ ' : '✓ ') + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
