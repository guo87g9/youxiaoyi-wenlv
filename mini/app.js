App({
  globalData: {
    version: '1.0.0',
    name: '邮小驿'
  },
  onLaunch() {
    // 首次进入初始化集邮数据
    if (!wx.getStorageSync('youxiaoyi_stamps')) {
      wx.setStorageSync('youxiaoyi_stamps', {});
    }
  }
})
