const db = require('../../utils/db.js');
const ui = require('../../utils/ui.js');

const ALL_SPOTS = ui.decorate(db.spots || []);

Page({
  data: {
    cats: [],
    cat: 'all',
    spots: [],
    total: ALL_SPOTS.length
  },

  onLoad() {
    // 分类数量现算，不再手写「全部 17」这种会过期的字符串
    const cats = (db.cats || []).map(function (c) {
      const n = c.k === 'all'
        ? ALL_SPOTS.length
        : ALL_SPOTS.filter(function (s) { return s.cat === c.k; }).length;
      return { k: c.k, t: c.t + ' ' + n };
    });
    this.setData({ cats: cats });
    this.filter('all');
  },

  onCat(e) { this.filter(e.currentTarget.dataset.k); },

  filter(k) {
    const spots = ALL_SPOTS.filter(function (s) {
      return k === 'all' || s.cat === k;
    });
    this.setData({ cat: k, spots: spots });
  },

  onGuide(e) {
    const idx = Number(e.currentTarget.dataset.persona);
    wx.setStorageSync('youxiaoyi_persona', idx);
    wx.setStorageSync('youxiaoyi_persona_new', 1);
    wx.switchTab({ url: '/pages/guide/guide' });
  },

  // 点卡片标题：把景点名带去问答页，直接问「XX 值得去吗」
  onSpot(e) {
    wx.setStorageSync('youxiaoyi_prefill', e.currentTarget.dataset.name);
    wx.switchTab({ url: '/pages/faq/faq' });
  },

  goTab(e) {
    wx.switchTab({ url: e.currentTarget.dataset.url });
  }
});
