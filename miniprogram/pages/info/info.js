var util = require('../../utils/util.js')
var request = require('../../utils/request.js')
var app = getApp()

Page({
  data: {
    personalInfo: {},
    summary: {},
    gender: 'female',
    genderText: '女',
    identity: '工人',
    workerActive: true,
    cadreActive: false,
    hideIdentity: false,
    retireDate: '',
    retirementAge: 50,
    visualYears: 0,
    personalAccountAmount: 0,
    socialAvgWage: 8500,
    delayTip: null,
    futureMode: 'real',
    modeActive: { real: true, base60: false, base100: false, base300: false },
    futureYears: [],
    futureTotal: 0,
    futureText: '¥ 0.00',
    calculating: false
  },
  onLoad: function() { this.init() },
  init: function() {
    var self = this
    var pi = util.normalizePersonalInfo(app.globalData.personalInfo || {})
    var parsed = util.parseIdCard(pi.idCard)
    var gender = parsed.valid ? parsed.gender : (pi.gender === '男' ? 'male' : 'female')
    var hideIdentity = gender === 'male'
    var identity = hideIdentity ? '干部' : this.data.identity
    var summary = util.paymentSummary(app.globalData.paymentDetails || [], this.data.socialAvgWage)
    this.setData({ personalInfo: pi, summary: summary, gender: gender, genderText: gender === 'male' ? '男' : '女', hideIdentity: hideIdentity, identity: identity, workerActive: identity === '工人', cadreActive: identity === '干部', personalAccountAmount: summary.personalTotal })
    this.loadWage().then(function() { self.calcRetire() })
  },
  loadWage: function() {
    var self = this
    return request.getPreviousYearSocialWage(new Date().getFullYear(), '福建省').then(function(r) {
      var d = r.data || {}
      var wage = Number(d.monthlyWage || d.monthly_wage || d.paramValue || d.wage || d.socialWage || d.amount || d.value)
      if (request.isSuccess(r) && wage > 0) {
        app.globalData.socialAvgWage = wage
        self.setData({ socialAvgWage: wage })
      }
    }).catch(function() {})
  },
  personType: function() { return this.data.gender === 'male' ? '21' : (this.data.identity === '干部' ? '12' : '11') },
  calcRetire: function() {
    var self = this
    var p = util.parseIdCard(this.data.personalInfo.idCard)
    if (!p.valid) return
    var legal = util.legalRetireAge(p.gender, this.data.identity)
    request.calculateDelayRetire(p.birthDate, this.personType()).then(function(r) {
      if (request.isSuccess(r) && r.data) {
        var d = r.data
        var ay = Number(d.reformRetireAgeYear || legal)
        var am = Number(d.reformRetireAgeMonth || 0)
        var age = util.round(ay + am / 12, 2)
        var date = d.reformRetireDate ? String(d.reformRetireDate).slice(0, 7) : util.calcRetireDate(p.birthDate, age)
        var dm = Number(d.delayMonths || 0)
        self.setData({ retirementAge: age, retireDate: date, delayTip: '预计延迟' + util.delayText(dm) + '，改革后退休时间 ' + (d.reformRetireDate || date) + '，回本年龄约 ' + Math.round(age + 11) + '岁' })
        self.future()
        return
      }
      self.setData({ retirementAge: legal, retireDate: util.calcRetireDate(p.birthDate, legal), delayTip: null })
      self.future()
    }).catch(function() {
      self.setData({ retirementAge: legal, retireDate: util.calcRetireDate(p.birthDate, legal), delayTip: null })
      self.future()
    })
  },
  setIdentity: function(e) {
    var identity = e.currentTarget.dataset.v
    this.setData({ identity: identity, workerActive: identity === '工人', cadreActive: identity === '干部' })
    this.calcRetire()
  },
  inputAge: function(e) {
    var age = Number(e.detail.value) || 60
    var p = util.parseIdCard(this.data.personalInfo.idCard)
    this.setData({ retirementAge: age, retireDate: p.valid ? util.calcRetireDate(p.birthDate, age) : this.data.retireDate })
    this.future()
  },
  inputDate: function(e) {
    var date = e.detail.value
    var p = util.parseIdCard(this.data.personalInfo.idCard)
    this.setData({ retireDate: date, retirementAge: p.valid ? util.calcAge(p.birthDate, date).age : this.data.retirementAge })
    this.future()
  },
  inputVisual: function(e) { this.setData({ visualYears: Number(e.detail.value) || 0 }) },
  inputAccount: function(e) { this.setData({ personalAccountAmount: util.round(e.detail.value, 2) }) },
  inputWage: function(e) { this.setData({ socialAvgWage: util.round(e.detail.value, 2) }); this.future() },
  mode: function(e) {
    var m = e.currentTarget.dataset.v
    this.setData({ futureMode: m, modeActive: { real: m === 'real', base60: m === 'base60', base100: m === 'base100', base300: m === 'base300' } })
    this.future()
  },
  future: function() {
    var list = util.normalizePaymentDetails(app.globalData.paymentDetails || [])
    var latest = list[list.length - 1]
    if (!latest || !this.data.retireDate) return
    var wage = Number(this.data.socialAvgWage || 8500)
    var baseMap = { real: latest.paymentBase, base60: wage * 0.6, base100: wage, base300: wage * 3 }
    var base = util.round(baseMap[this.data.futureMode] || latest.paymentBase, 2)
    var parts = String(latest.yearMonth).split('-')
    var y = Number(parts[0])
    var m = Number(parts[1]) + 1
    if (m > 12) { y++; m = 1 }
    var end = String(this.data.retireDate).split('-')
    var ey = Number(end[0])
    var em = Number(end[1])
    var map = {}
    var guard = 0
    while (y < ey || (y === ey && m < em)) {
      if (!map[y]) map[y] = { year: y, months: 0, amount: 0 }
      map[y].months++
      map[y].amount = util.round(map[y].amount + base * 0.08, 2)
      m++
      if (m > 12) { y++; m = 1 }
      guard++
      if (guard > 600) break
    }
    var arr = Object.keys(map).map(function(k) { var i = map[k]; i.amountText = util.currency(i.amount); return i })
    var total = util.round(arr.reduce(function(s, i) { return s + i.amount }, 0), 2)
    this.setData({ futureYears: arr, futureTotal: total, futureText: util.currency(total) })
  },
  params: function() {
    var summary = util.paymentSummary(app.globalData.paymentDetails || [], this.data.socialAvgWage)
    return { paymentDetails: app.globalData.paymentDetails || [], personalInfo: this.data.personalInfo, retirementIdentity: this.data.identity, retirementAge: Number(this.data.retirementAge), retirementYear: Number(String(this.data.retireDate).slice(0, 4)) || new Date().getFullYear() + 1, visualYears: Number(this.data.visualYears || 0), visualPaymentYears: Number(this.data.visualYears || 0), personalAccountAmount: util.round(Number(this.data.personalAccountAmount || 0) + Number(this.data.futureTotal || 0), 2), socialAvgWage: Number(this.data.socialAvgWage || 0), actualPaymentYears: summary.totalYears, totalPaymentYears: util.round(summary.totalYears + Number(this.data.visualYears || 0), 2), avgPaymentIndex: summary.avgIndex }
  },
  calculate: function() {
    var self = this
    var params = this.params()
    app.globalData.calculateParams = params
    this.setData({ calculating: true })
    util.loading('测算中')
    request.calculatePension(params).then(function(r) {
      if (!request.isSuccess(r)) throw new Error(r.message || '测算失败')
      var result = util.normalizeResult(r.data, params)
      app.globalData.calculateResult = result
      return request.saveResult({ title: (params.personalInfo.name || '') + '待遇测算结果', monthlyPension: result.pensionDetails.totalMonthlyPension, basicPension: result.pensionDetails.basicPension, personalAccountPension: result.pensionDetails.personalAccountPension, transitionalPension: result.pensionDetails.transitionalPension, personalAccountAmount: params.personalAccountAmount, paymentYears: params.totalPaymentYears, paymentMonths: util.calculateMonths(params.retirementAge), retireAge: params.retirementAge, result: result, userId: wx.getStorageSync('userId'), openid: wx.getStorageSync('openId') }).then(function() { return result })
    }).then(function() {
      wx.navigateTo({ url: '/pages/result/result' })
    }).catch(function(e) {
      util.toast(e.message || '测算失败')
    }).then(function() {
      util.hideLoading()
      self.setData({ calculating: false })
    })
  },
  back: function() { wx.navigateBack() }
})
