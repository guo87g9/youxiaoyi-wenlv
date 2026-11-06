const ui = require('../../utils/ui.js');

// 邮戳表跟景点表一一对应：加一个景点，护照自动多一枚戳，
// 不会再出现「total 写死 12、实际 17」这种对不上的情况。
const STAMPS = ui.stamps;

Page({
  data: {
    stamps: [],
    count: 0,
    total: STAMPS.length,
    percent: 0,
    all: false
  },

  onShow() { this.load(); },

  load() {
    const got = wx.getStorageSync('youxiaoyi_stamps') || {};
    const stamps = STAMPS.map(function (s) {
      return { n: s.n, i: s.i, spotId: s.spotId, got: !!got[s.spotId] };
    });
    const count = stamps.filter(function (s) { return s.got; }).length;
    this.setData({
      stamps: stamps,
      count: count,
      total: stamps.length,
      percent: Math.round(count / stamps.length * 100),
      all: count === stamps.length
    });
  },

  stamp(e) {
    const spotId = e.currentTarget.dataset.id;
    const got = wx.getStorageSync('youxiaoyi_stamps') || {};
    if (got[spotId]) {
      wx.showToast({ title: '这枚邮戳已经盖过啦', icon: 'none' });
      return;
    }
    got[spotId] = true;
    wx.setStorageSync('youxiaoyi_stamps', got);
    this.load();
    const done = this.data.count === this.data.total;
    wx.showToast({
      title: done ? '🎉 集齐！可到盂城驿游客中心兑礼包' : '📮 盖戳成功',
      icon: 'none'
    });
  },

  reset() {
    wx.showModal({
      title: '重置护照？',
      content: '所有已盖的邮戳会清空，这个操作不能撤销。',
      success: (res) => {
        if (!res.confirm) return;
        wx.removeStorageSync('youxiaoyi_stamps');
        this.load();
        wx.showToast({ title: '护照已重置', icon: 'none' });
      }
    });
  }
});
