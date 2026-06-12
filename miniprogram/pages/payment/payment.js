var util = require('../../utils/util.js')
var request = require('../../utils/request.js')
var app = getApp()

Page({
  data: {
    personalInfo: {},
    heroDesc: '',
    summary: {},
    groups: [],
    editVisible: false,
    editYear: '',
    editItems: []
  },
  onLoad: function() { this.load() },
  onShow: function() { this.load() },
  load: function() {
    var details = util.normalizePaymentDetails(app.globalData.paymentDetails || [])
    var summary = util.paymentSummary(details, app.globalData.socialAvgWage)
    var info = util.normalizePersonalInfo(app.globalData.personalInfo || {})
    app.globalData.paymentDetails = details
    app.globalData.paymentSummary = summary
    this.setData({
      personalInfo: info,
      heroDesc: (info.name || '用户') + ' · ' + summary.totalMonths + '个月 · ' + summary.startDate + ' 至 ' + summary.endDate,
      summary: summary,
      groups: util.groupByYear(details)
    })
  },
  toggle: function(e) {
    var y = String(e.currentTarget.dataset.year)
    var groups = this.data.groups.map(function(g) {
      var next = util.assign({}, g)
      if (next.year === y) next.expanded = !next.expanded
      return next
    })
    this.setData({ groups: groups })
  },
  edit: function(e) {
    var y = String(e.currentTarget.dataset.year)
    var g = null
    this.data.groups.forEach(function(item) { if (item.year === y) g = item })
    if (g) this.setData({ editVisible: true, editYear: y, editItems: g.items })
  },
  input: function(e) {
    var i = Number(e.currentTarget.dataset.index)
    var arr = this.data.editItems.slice()
    if (arr[i]) arr[i].inputValue = e.detail.value
    this.setData({ editItems: arr })
  },
  close: function() { this.setData({ editVisible: false, editYear: '', editItems: [] }) },
  noop: function() {},
  save: function() {
    var map = {}
    this.data.editItems.forEach(function(i) {
      var nb = util.round(i.inputValue, 2)
      map[i.yearMonth] = util.assign({}, i, { paymentBase: nb, modified: i.modified || nb !== util.round(i.paymentBase, 2) })
    })
    var details = util.normalizePaymentDetails(app.globalData.paymentDetails || []).map(function(i) {
      return map[i.yearMonth] ? util.assign({}, i, map[i.yearMonth]) : i
    })
    app.globalData.paymentDetails = details
    app.globalData.paymentSummary = util.paymentSummary(details)
    this.close()
    this.load()
    util.toast('已保存', 'success')
    request.importPaymentDetails(details).catch(function() {})
  },
  next: function() { wx.navigateTo({ url: '/pages/info/info' }) },
  back: function() { wx.switchTab({ url: '/pages/calculate/calculate' }) }
})
