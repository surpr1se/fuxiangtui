var util = require('../../utils/util.js')
var request = require('../../utils/request.js')
var app = getApp()

Page({
  data: { userName: '未登录', calcCount: 0, avgPension: '¥ 0.00', paymentMonths: 0, latest: null, pdfCount: 0 },
  onShow: function() { this.load() },
  load: function() {
    var self = this
    var user = app.globalData.userInfo || {}
    var userName = user.nickName || user.name || '微信用户'
    request.getHistoryList({ userId: wx.getStorageSync('userId'), openid: wx.getStorageSync('openId'), pageSize: 20 }).then(function(h) {
      var list = []
      if (request.isSuccess(h)) {
        if (Array.isArray(h.data)) list = h.data
        else if (h.data) list = h.data.records || h.data.list || []
      }
      var amounts = list.map(function(i) {
        var res = i.result || {}
        var pd = res.pensionDetails || {}
        return Number(i.monthlyPension || pd.totalMonthlyPension || 0)
      }).filter(function(v) { return !!v })
      var avg = amounts.length ? amounts.reduce(function(s, i) { return s + i }, 0) / amounts.length : 0
      return request.getPdfList(wx.getStorageSync('userId')).then(function(pdf) {
        var pdfCount = 0
        if (request.isSuccess(pdf)) {
          var d = pdf.data
          pdfCount = Array.isArray(d) ? d.length : ((d && (d.records || d.list)) || []).length
        }
        self.setData({ userName: userName, calcCount: list.length, avgPension: util.currency(avg), paymentMonths: (app.globalData.paymentSummary && app.globalData.paymentSummary.totalMonths) || 0, latest: list[0] || null, pdfCount: pdfCount })
      })
    }).catch(function() {
      self.setData({ userName: userName })
    })
  },
  history: function() { wx.navigateTo({ url: '/pages/history/history' }) },
  policy: function() { wx.navigateTo({ url: '/pages/policy/policy' }) },
  calculate: function() { wx.switchTab({ url: '/pages/calculate/calculate' }) }
})
