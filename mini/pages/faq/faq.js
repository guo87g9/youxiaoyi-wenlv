const db = require('../../utils/db.js');
const qa = require('../../utils/qa.js');

// 整个小程序只建一次引擎：建索引要遍历 200 多条语料，
// 每次进页面重建会明显卡顿。
let eng = null;
function engine() {
  if (!eng) eng = qa.createEngine(db);
  return eng;
}

// 首屏热门问法：用户点一下就问，降低冷启动成本
const HOT = [
  '盂城驿值得去吗',
  '盂城驿门票多少钱',
  '有什么特产可以带',
  '带老人小孩玩什么',
  '停车方便吗',
  '从南京怎么去高邮',
  '高邮咸鸭蛋为什么好',
  '下雨天能去哪'
];

Page({
  data: {
    cats: db.faqCats,
    cat: 'all',
    list: [],
    open: -1,
    input: '',
    asking: false,
    hot: HOT,
    ans: null,
    hist: []
  },

  onLoad() {
    engine();
    this.filter('all');
  },

  // 从首页/路线页点景点跳过来时，带一个问句
  onShow() {
    const q = wx.getStorageSync('youxiaoyi_prefill');
    if (!q) return;
    wx.removeStorageSync('youxiaoyi_prefill');
    this.setData({ input: q + '值得去吗' });
    this.ask(this.data.input);
  },

  /* ---------- 分类浏览（直接读知识库，与网页版同一批 201 条） ---------- */
  onCat(e) { this.filter(e.currentTarget.dataset.k); },

  filter(k) {
    const all = [].concat(db.kb || [], db.kb2 || [], db.kb3 || []);
    const list = all.filter(function (it) {
      if (k === 'all') return true;
      return (it.tags || []).indexOf(k) >= 0 || it.intent === k;
    }).map(function (it) {
      return {
        id: it.id,
        q: (it.q && it.q[0]) || '',
        a: it.a || '',
        src: it.src || ''
      };
    });
    this.setData({ cat: k, list: list, open: -1 });
  },

  toggle(e) {
    const i = Number(e.currentTarget.dataset.i);
    this.setData({ open: this.data.open === i ? -1 : i });
  },

  /* ---------- 检索问答：四层引擎，本地跑，不走网络 ---------- */
  onInput(e) { this.setData({ input: e.detail.value }); },

  onHot(e) { this.ask(e.currentTarget.dataset.q); },

  onSend() {
    const q = (this.data.input || '').trim();
    if (!q) return;
    this.setData({ input: '' });
    this.ask(q);
  },

  ask(q) {
    // 检索是同步的纯计算（本地索引，几十毫秒），不需要防抖锁；
    // 加个 asking 标记反而会在快速连问时吞掉后一句。
    const r = engine().search(q);
    let ans;
    if (r.hit) {
      // 命中就给原文 + 出处。知识库答案都是核对过的，
      // 这里不二次生成，避免把确定的事实说糊。
      ans = { q: q, a: r.a || '', src: r.src || '', ok: true, id: r.id };
    } else {
      // 未命中不编答案，直接给可以问什么。
      ans = {
        q: q,
        a: '这个问题知识库还没收录。换个说法试试，或者先看这几个：',
        src: '',
        ok: false,
        more: engine().suggest(4)
      };
    }
    const hist = [{ q: ans.q, a: ans.a }].concat(this.data.hist).slice(0, 3);
    this.setData({ ans: ans, hist: hist, asking: false });
  },

  onMore(e) { this.ask(e.currentTarget.dataset.q); },

  backToList() { this.setData({ ans: null }); },

  copySrc(e) {
    const s = e.currentTarget.dataset.src;
    if (!s) return;
    wx.setClipboardData({ data: s });
  }
});
