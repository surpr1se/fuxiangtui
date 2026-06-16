Page({
  data: {
    features: [
      { title: '智能PDF解析', desc: '上传社保缴费记录，自动提取缴费明细' },
      { title: '延迟退休测算', desc: '结合出生日期、性别和身份计算退休时间' },
      { title: '养老金测算', desc: '按缴费基数、个人账户和社平工资估算待遇' }
    ]
  },
  start: function() {
    this.goCalculate()
  },
  policy: function() {
    this.goPolicy()
  },
  goCalculate: function() {
    wx.switchTab({ url: '/pages/calculate/calculate' })
  },
  goHistory: function() {
    wx.navigateTo({ url: '/pages/history/history' })
  },
  goProfile: function() {
    wx.switchTab({ url: '/pages/profile/profile' })
  },
  goPolicy: function() {
    wx.navigateTo({ url: '/pages/policy/policy' })
  }
})
