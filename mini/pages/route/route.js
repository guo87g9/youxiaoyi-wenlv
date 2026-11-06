const db = require('../../utils/db.js');
const ui = require('../../utils/ui.js');

const SPOT_MAP = {};
ui.decorate(db.spots || []).forEach(function (s) { SPOT_MAP[s.id] = s; });

// 偏好 → 路线标签。选"文化历史型"就给带 culture 标签的线，
// 选"亲子休闲型"就给 family —— 不再靠下标硬对。
const STYLE_TAGS = [
  { label: '不限偏好', tags: [] },
  { label: '文化历史型', tags: ['culture', 'history'] },
  { label: '美食烟火型', tags: ['food'] },
  { label: '湖景生态型', tags: ['nature'] },
  { label: '亲子休闲型', tags: ['family', 'museum'] },
  { label: '红色研学型', tags: ['red'] }
];

// 时长筛选：min 是下限（"一天"不该只给半天线），max 是硬上限
const TIMES = [
  { label: '半天（3—4 小时）', min: 0, max: 4.5 },
  { label: '一天（5—8 小时）', min: 4.5, max: 9 },
  { label: '两天（过夜）', min: 9, max: 99 }
];

function expand(r) {
  const stops = (r.stops || []).map(function (st) {
    const s = SPOT_MAP[st.spotId] || {};
    return {
      name: s.name || st.spotId,
      icon: s.icon || '📍',
      desc: s.desc || '',
      dur: st.dur || '',
      time: st.time || '',
      tip: st.tip || ''
    };
  });
  return {
    id: r.id,
    title: r.title,
    hours: r.hours,
    intro: r.intro || '',
    tags: r.tags || [],
    stops: stops
  };
}

Page({
  data: {
    times: TIMES.map(function (t) { return t.label; }),
    styles: STYLE_TAGS.map(function (s) { return s.label; }),
    tIdx: 1,
    sIdx: 0,
    route: null,
    alt: []
  },

  onTime(e) { this.setData({ tIdx: Number(e.detail.value) }); },
  onStyle(e) { this.setData({ sIdx: Number(e.detail.value) }); },

  gen() {
    const t = TIMES[this.data.tIdx] || TIMES[1];
    const st = STYLE_TAGS[this.data.sIdx] || STYLE_TAGS[0];
    const all = db.routes || [];

    let pool = all.filter(function (r) {
      const h = r.hours || 0;
      return h > t.min - 0.01 && h <= t.max;
    });
    // 时长段内没有线就先不管时长：偏好是用户的强意图，
    // 「两天+红色」宁可给一条 4 小时的红色线，也别塞给它一条通用线。
    if (!pool.length) pool = all.slice();

    let picked = pool;
    if (st.tags.length) {
      // 先在"时长段内"找，找不到就把范围放到全部线里找。
      // 不能只按命中数排——「两天+红色」时段里那条通用线也带 culture，
      // 会以同样的命中数把红色线按在下面。
      function rank(src) {
        const sc = src.map(function (r) {
          const hit = (r.tags || []).filter(function (g) { return st.tags.indexOf(g) >= 0; }).length;
          return { r: r, hit: hit };
        }).filter(function (x) { return x.hit > 0; });
        sc.sort(function (a, b) {
          return (b.hit - a.hit) || ((b.r.hours || 0) - (a.r.hours || 0));
        });
        return sc.map(function (x) { return x.r; });
      }
      let ranked = rank(pool);
      if (!ranked.length) ranked = rank(all);
      if (ranked.length) picked = ranked;
    }

    if (!picked.length) {
      wx.showToast({ title: '没有匹配的路线，换个偏好试试', icon: 'none' });
      return;
    }

    const alt = picked.slice(1, 4).map(function (r) {
      return { id: r.id, title: r.title, hours: r.hours };
    });
    this.setData({ route: expand(picked[0]), alt: alt });
    wx.showToast({ title: '已按你的偏好排好', icon: 'none' });
  },

  onAlt(e) {
    const id = e.currentTarget.dataset.id;
    const r = (db.routes || []).filter(function (x) { return x.id === id; })[0];
    if (r) this.setData({ route: expand(r) });
  },

  // 点某一站：去问答页问这个点
  onStop(e) {
    wx.setStorageSync('youxiaoyi_prefill', e.currentTarget.dataset.name);
    wx.switchTab({ url: '/pages/faq/faq' });
  }
});
