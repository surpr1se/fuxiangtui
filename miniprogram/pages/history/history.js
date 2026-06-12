var util = require('../../utils/util.js')
var request = require('../../utils/request.js')
var app = getApp()

Page({
  data: { list: [], loading: false },
  onLoad: function() { this.load() },
  load: function() {
    var self = this
    this.setData({ loading: true })
    request.getHistoryList({ userId: wx.getStorageSync('userId'), openid: wx.getStorageSync('openId'), pageSize: 50 }).then(function(r) {
      var raw = []
      if (request.isSuccess(r)) {
        if (Array.isArray(r.data)) raw = r.data
        else if (r.data) raw = r.data.records || r.data.list || r.data.rows || []
      }
      var list = raw.map(function(i) {
        var res = i.result || {}
        var d = res.pensionDetails || res.pensionDetail || i
        var name = (res.personalInfo && res.personalInfo.name) || '养老金测算'
        return util.assign({}, i, {
          title: i.title || name,
          time: util.dateTime(i.calculateTime || i.createTime || i.createdTime),
          money: util.currency(i.monthlyPension || d.totalMonthlyPension || res.monthlyPension || 0),
          id: i.id || i.calculateNo || i.resultId
        })
      })
      self.setData({ list: list, loading: false })
    }).catch(function() { self.setData({ loading: false }) })
  },
  detail: function(e) {
    var item = this.data.list[e.currentTarget.dataset.i]
    if (!item) return
    util.loading('加载中')
    var p = item.id ? request.getResult(item.id) : Promise.resolve({ code: 200, data: item })
    p.then(function(r) {
      util.hideLoading()
      if (request.isSuccess(r)) {
        var data = r.data || item
        app.globalData.calculateResult = util.normalizeResult(data.result || data, app.globalData.calculateParams || {})
        wx.navigateTo({ url: '/pages/result/result' })
      }
    }).catch(function() { util.hideLoading() })
  }
})
