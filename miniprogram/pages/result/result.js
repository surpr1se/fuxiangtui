var util = require('../../utils/util.js')
var app = getApp()

Page({
  data: { result: {}, basicInfo: {}, processArrow: '▼', pension: {}, forecast: [], schemes: [], showProcess: false, calculationProcess: [] },
  onLoad: function() { this.load() },
  load: function() {
    var r = util.normalizeResult(app.globalData.calculateResult || {}, app.globalData.calculateParams || {})
    var p = r.pensionDetails || {}
    var base = Number(p.totalMonthlyPension || 0)
    var forecast = [1, 2, 3, 4, 5].map(function(i) { return { year: new Date().getFullYear() + i, amount: util.currency(base * Math.pow(1.045, i)) } })
    this.setData({
      result: r,
      basicInfo: r.basicInfo || {},
      calculationProcess: r.calculationProcess || [],
      pension: { total: util.currency(p.totalMonthlyPension), basic: util.currency(p.basicPension), personal: util.currency(p.personalAccountPension), transitional: util.currency(p.transitionalPension) },
      forecast: forecast,
      schemes: [{ name: '本人基数', amount: util.currency(base), active: true }, { name: '社平60%', amount: util.currency(base * 0.88) }, { name: '社平100%', amount: util.currency(base * 1.08) }, { name: '社平300%', amount: util.currency(base * 1.72) }]
    })
  },
  toggleProcess: function() { var next = !this.data.showProcess; this.setData({ showProcess: next, processArrow: next ? '▲' : '▼' }) },
  home: function() { wx.switchTab({ url: '/pages/index/index' }) },
  profile: function() { wx.switchTab({ url: '/pages/profile/profile' }) }
})
