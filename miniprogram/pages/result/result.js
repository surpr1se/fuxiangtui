var util = require('../../utils/util.js')
var app = getApp()

function formatNumber(v, digits) {
  var n = Number(v || 0)
  return util.round(n, digits == null ? 2 : digits).toLocaleString('zh-CN', { minimumFractionDigits: digits == null ? 2 : digits, maximumFractionDigits: digits == null ? 2 : digits })
}

function normalizeProcessItem(item, index) {
  item = item || {}
  return {
    stepName: item.stepName || item.name || item.title || ('计算步骤' + (index + 1)),
    formula: item.formula || item.expression || item.desc || item.description || '',
    result: item.result || item.value || item.amount || ''
  }
}

function buildCalculationProcess(r, params) {
  var p = r.pensionDetails || {}
  var b = r.basicInfo || {}
  var socialAvgWage = Number(params.socialAvgWage || b.socialAvgWage || 0)
  var avgIndex = Number(b.avgPaymentIndex || params.avgPaymentIndex || 0)
  var totalYears = Number(b.totalPaymentYears || params.totalPaymentYears || 0)
  var personalAccountAmount = Number(params.personalAccountAmount || r.personalAccountAmount || 0)
  var calculateMonths = Number(b.calculateMonths || params.paymentMonths || util.calculateMonths(b.retireAge || params.retirementAge))
  var indexedWage = socialAvgWage && avgIndex ? util.round(socialAvgWage * avgIndex, 2) : 0
  var list = []

  list.push({
    stepName: '基础养老金',
    formula: '公式：(退休时上年度社平工资 + 本人指数化月平均缴费工资) ÷ 2 × 累计缴费年限 × 1%',
    result: socialAvgWage ? '过程：(' + formatNumber(socialAvgWage) + ' + ' + formatNumber(indexedWage) + ') ÷ 2 × ' + formatNumber(totalYears, 2) + ' × 1% = ' + util.currency(p.basicPension) : '结果：' + util.currency(p.basicPension)
  })

  list.push({
    stepName: '个人账户养老金',
    formula: '公式：个人账户累计储存额 ÷ 退休年龄对应计发月数',
    result: '过程：' + util.currency(personalAccountAmount) + ' ÷ ' + calculateMonths + '个月 = ' + util.currency(p.personalAccountPension)
  })

  if (Number(p.transitionalPension || 0) > 0) {
    list.push({
      stepName: '过渡性养老金',
      formula: '公式：按视同缴费年限、平均缴费指数和当地过渡系数计算',
      result: '本次接口测算结果：' + util.currency(p.transitionalPension) + '，最终以社保经办机构核定口径为准'
    })
  }

  list.push({
    stepName: '月养老金合计',
    formula: '公式：基础养老金 + 个人账户养老金 + 过渡性养老金',
    result: '过程：' + util.currency(p.basicPension) + ' + ' + util.currency(p.personalAccountPension) + ' + ' + util.currency(p.transitionalPension) + ' = ' + util.currency(p.totalMonthlyPension)
  })

  return list
}

Page({
  data: { result: {}, basicInfo: {}, processArrow: '▼', pension: {}, forecast: [], schemes: [], showProcess: false, calculationProcess: [] },
  onLoad: function() { this.load() },
  load: function() {
    var params = app.globalData.calculateParams || {}
    var r = util.normalizeResult(app.globalData.calculateResult || {}, params)
    var p = r.pensionDetails || {}
    var base = Number(p.totalMonthlyPension || 0)
    var forecast = [1, 2, 3, 4, 5].map(function(i) { return { year: new Date().getFullYear() + i, amount: util.currency(base * Math.pow(1.045, i)) } })
    var process = Array.isArray(r.calculationProcess) && r.calculationProcess.length ? r.calculationProcess.map(normalizeProcessItem) : buildCalculationProcess(r, params)
    this.setData({
      result: r,
      basicInfo: r.basicInfo || {},
      calculationProcess: process,
      pension: { total: util.currency(p.totalMonthlyPension), basic: util.currency(p.basicPension), personal: util.currency(p.personalAccountPension), transitional: util.currency(p.transitionalPension) },
      forecast: forecast,
      schemes: [{ name: '本人基数', amount: util.currency(base), active: true }, { name: '社平60%', amount: util.currency(base * 0.88) }, { name: '社平100%', amount: util.currency(base * 1.08) }, { name: '社平300%', amount: util.currency(base * 1.72) }]
    })
  },
  toggleProcess: function() { var next = !this.data.showProcess; this.setData({ showProcess: next, processArrow: next ? '▲' : '▼' }) },
  home: function() { wx.switchTab({ url: '/pages/index/index' }) },
  profile: function() { wx.switchTab({ url: '/pages/profile/profile' }) }
})
