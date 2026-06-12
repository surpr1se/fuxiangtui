// pages/input/input.js
const util = require('../../utils/util.js')
const request = require('../../utils/request.js')
const app = getApp()

Page({
  data: {
    personalInfo: {},
    paymentSummary: {},
    personType: 'enterprise',
    gender: 'female',
    identity: '工人',
    hideIdentity: false,
    retireDate: '',
    retireAge: 50,
    visualYears: 0,
    personalAccount: 0,
    socialAvgWage: 8500,
    delayTip: null,
    futurePaymentMode: 'real',
    futureModes: [
      { key: 'real', name: '本人基数' },
      { key: 'base60', name: '社平60%' },
      { key: 'base100', name: '社平100%' },
      { key: 'base300', name: '社平300%' }
    ],
    futureYears: [],
    futureTotalAmount: 0,
    futureTotalText: '¥ 0.00',
    isCalculating: false
  },

  async onLoad() {
    await this.autoFill()
  },

  async autoFill() {
    const paymentDetails = util.normalizePaymentDetails(app.globalData.paymentDetails || [])
    const paymentSummary = util.buildPaymentSummary(paymentDetails)
    const personalInfo = util.normalizePersonalInfo(app.globalData.personalInfo || {})
    const parsed = util.parseIdCard(personalInfo.idCard)
    const gender = parsed.valid ? parsed.gender : (personalInfo.gender === '男' ? 'male' : 'female')
    const hideIdentity = gender === 'male'
    const identity = hideIdentity ? '干部' : (this.data.identity || '工人')
    const legalAge = util.getLegalRetireAge(gender, identity)
    const personalAccount = paymentSummary.personalTotal

    this.setData({ personalInfo, paymentSummary, gender, hideIdentity, identity, retireAge: legalAge, personalAccount })
    await this.loadSocialAvgWage()
    await this.calculateRetireInfo()
    this.refreshFuturePayment()
  },

  async loadSocialAvgWage() {
    const baseYear = new Date().getFullYear()
    try {
      const result = await request.getPreviousYearSocialWage(baseYear, '福建省')
      const data = result.data || {}
      const wage = Number(data.monthlyWage ?? data.monthly_wage ?? data.paramValue ?? data.wage ?? data.socialWage ?? data.amount ?? data.value)
      if (request.isSuccess(result) && wage > 0) {
        app.globalData.socialAvgWage = wage
        this.setData({ socialAvgWage: wage })
      }
    } catch (error) {
      console.warn('获取社平工资失败:', error)
    }
  },

  getPersonTypeCode(gender = this.data.gender, identity = this.data.identity) {
    if (gender === 'male') return '21'
    return identity === '干部' ? '12' : '11'
  },

  async calculateRetireInfo() {
    const personalInfo = util.normalizePersonalInfo(this.data.personalInfo)
    const parsed = util.parseIdCard(personalInfo.idCard)
    if (!parsed.valid) {
      const age = util.getLegalRetireAge(this.data.gender, this.data.identity)
      this.setData({ retireAge: age, retireDate: '', delayTip: null })
      return
    }

    const legalAge = util.getLegalRetireAge(parsed.gender, this.data.identity)
    try {
      const result = await request.calculateDelayRetire(parsed.birthDate, this.getPersonTypeCode(parsed.gender, this.data.identity))
      if (request.isSuccess(result) && result.data) {
        const data = result.data
        const ageYear = Number(data.reformRetireAgeYear || legalAge)
        const ageMonth = Number(data.reformRetireAgeMonth || 0)
        const retireAge = util.round(ageYear + ageMonth / 12, 2)
        const retireDate = data.reformRetireDate ? String(data.reformRetireDate).substring(0, 7) : util.calcRetireDateByAge(parsed.birthDate, retireAge)
        const delayMonths = Number(data.delayMonths || 0)
        const delayYears = util.round(delayMonths / 12, 1)
        const delayTip = {
          text: `按最新政策，预计延迟 ${util.formatDelayText(delayMonths)}，至 ${util.formatAgeText(ageYear, ageMonth)} 退休`,
          dateText: `改革后退休时间：${data.reformRetireDate || retireDate}`,
          benefitText: `多缴约 ${String(delayYears).replace(/\.0$/, '')} 年，多领约 ${Math.max(0, Math.round(delayYears * 4))}%`,
          breakEvenText: `预计回本年龄：${legalAge + 11}岁 → ${Math.round(retireAge + 11)}岁`
        }
        app.globalData.retireInfo = data
        this.setData({ retireAge, retireDate, delayTip })
        this.refreshFuturePayment()
        return
      }
    } catch (error) {
      console.warn('延迟退休接口失败，使用本地兜底:', error)
    }

    const retireDate = util.calcRetireDateByAge(parsed.birthDate, legalAge)
    this.setData({ retireAge: legalAge, retireDate, delayTip: null })
  },

  selectPersonType(e) { this.setData({ personType: e.currentTarget.dataset.type }) },
  selectGender(e) {
    const gender = e.currentTarget.dataset.gender
    this.setData({ gender, hideIdentity: gender === 'male', identity: gender === 'male' ? '干部' : this.data.identity })
    this.calculateRetireInfo()
  },
  selectIdentity(e) {
    this.setData({ identity: e.currentTarget.dataset.identity })
    this.calculateRetireInfo()
  },
  onVisualYearsInput(e) { this.setData({ visualYears: Math.max(0, Math.min(40, Number(e.detail.value) || 0)) }) },
  onPersonalAccountInput(e) { this.setData({ personalAccount: util.round(e.detail.value, 2) }) },
  onSocialAvgWageInput(e) { this.setData({ socialAvgWage: util.round(e.detail.value, 2) }); this.refreshFuturePayment() },
  onRetireDateInput(e) {
    const retireDate = e.detail.value
    const parsed = util.parseIdCard(this.data.personalInfo.idCard)
    const ageInfo = util.calcAgeByRetireDate(parsed.birthDate, retireDate)
    this.setData({ retireDate, retireAge: ageInfo.age })
    this.refreshFuturePayment()
  },
  onRetireAgeInput(e) {
    const retireAge = Math.max(45, Math.min(70, Number(e.detail.value) || 60))
    const parsed = util.parseIdCard(this.data.personalInfo.idCard)
    const retireDate = parsed.valid ? util.calcRetireDateByAge(parsed.birthDate, retireAge) : this.data.retireDate
    this.setData({ retireAge, retireDate })
    this.refreshFuturePayment()
  },
  selectFutureMode(e) {
    this.setData({ futurePaymentMode: e.currentTarget.dataset.mode })
    this.refreshFuturePayment()
  },

  getFutureBase() {
    const paymentDetails = util.normalizePaymentDetails(app.globalData.paymentDetails || [])
    const latestBase = paymentDetails.length ? paymentDetails[paymentDetails.length - 1].paymentBase : 0
    const wage = Number(this.data.socialAvgWage || 8500)
    const map = { real: latestBase || wage, base60: wage * 0.6, base100: wage, base300: wage * 3 }
    return util.round(map[this.data.futurePaymentMode] || latestBase || wage, 2)
  },

  refreshFuturePayment() {
    const paymentDetails = util.normalizePaymentDetails(app.globalData.paymentDetails || [])
    const latest = paymentDetails[paymentDetails.length - 1]
    const retireDate = this.data.retireDate
    if (!latest || !retireDate) {
      this.setData({ futureYears: [], futureTotalAmount: 0, futureTotalText: '¥ 0.00' })
      return
    }
    let [year, month] = String(latest.yearMonth).split('-').map(Number)
    const [endYear, endMonth] = String(retireDate).split('-').map(Number)
    const base = this.getFutureBase()
    const groups = {}
    month += 1
    if (month > 12) { year += 1; month = 1 }
    while (year < endYear || (year === endYear && month < endMonth)) {
      if (!groups[year]) groups[year] = { year, months: 0, base, amount: 0 }
      groups[year].months += 1
      groups[year].amount = util.round(groups[year].amount + base * 0.08, 2)
      month += 1
      if (month > 12) { year += 1; month = 1 }
      if (Object.values(groups).reduce((sum, item) => sum + item.months, 0) > 600) break
    }
    const futureYears = Object.values(groups).map(item => ({ ...item, baseText: util.formatCurrency(item.base), amountText: util.formatCurrency(item.amount) }))
    const futureTotalAmount = util.round(futureYears.reduce((sum, item) => sum + item.amount, 0), 2)
    this.setData({ futureYears, futureTotalAmount, futureTotalText: util.formatCurrency(futureTotalAmount) })
  },

  buildCalculateParams() {
    const retirementYear = this.data.retireDate ? Number(String(this.data.retireDate).substring(0, 4)) : new Date().getFullYear() + 1
    const paymentSummary = util.buildPaymentSummary(app.globalData.paymentDetails || [])
    return {
      paymentDetails: app.globalData.paymentDetails || [],
      personalInfo: this.data.personalInfo,
      personType: this.data.personType,
      gender: this.data.gender,
      retirementIdentity: this.data.identity,
      retirementAge: Number(this.data.retireAge || 60),
      retirementYear,
      retireDate: this.data.retireDate,
      visualYears: Number(this.data.visualYears || 0),
      visualPaymentYears: Number(this.data.visualYears || 0),
      currentPersonalAccountAmount: Number(this.data.personalAccount || 0),
      futurePersonalAccountIncrease: Number(this.data.futureTotalAmount || 0),
      personalAccountAmount: util.round(Number(this.data.personalAccount || 0) + Number(this.data.futureTotalAmount || 0), 2),
      socialAvgWage: Number(this.data.socialAvgWage || 0),
      actualPaymentYears: paymentSummary.totalYears,
      totalPaymentYears: util.round(paymentSummary.totalYears + Number(this.data.visualYears || 0), 2),
      avgPaymentIndex: util.calculateAvgIndex(app.globalData.paymentDetails || [], this.data.socialAvgWage)
    }
  },

  async startCalculate() {
    if (!app.globalData.paymentDetails || !app.globalData.paymentDetails.length) {
      util.showToast('请先上传或录入缴费明细')
      return
    }
    const params = this.buildCalculateParams()
    app.globalData.calculateParams = params
    this.setData({ isCalculating: true })
    util.showLoading('测算中...')
    try {
      const result = await request.calculatePension(params)
      if (!request.isSuccess(result)) throw new Error(result.message || '测算失败')
      const normalized = util.normalizeCalculateResult(result.data || {}, params)
      app.globalData.lastResult = normalized
      await this.saveResult(normalized, params)
      wx.navigateTo({ url: '/pages/result/result' })
    } catch (error) {
      console.error('测算失败:', error)
      util.showToast(error.message || '测算失败')
    } finally {
      util.hideLoading()
      this.setData({ isCalculating: false })
    }
  },

  async saveResult(result, params) {
    const detail = result.pensionDetails || {}
    const payload = {
      title: params.personalInfo?.name ? `${params.personalInfo.name}待遇测算结果` : '待遇测算结果',
      monthlyPension: detail.totalMonthlyPension || 0,
      basicPension: detail.basicPension || 0,
      personalAccountPension: detail.personalAccountPension || 0,
      transitionalPension: detail.transitionalPension || 0,
      personalAccountAmount: params.personalAccountAmount || 0,
      paymentYears: params.totalPaymentYears || 0,
      paymentMonths: util.getCalculateMonths(params.retirementAge),
      retireAge: params.retirementAge,
      result: { ...result, calculateParams: params, futurePayment: this.data.futureYears }
    }
    const userId = wx.getStorageSync('userId')
    const openid = wx.getStorageSync('openId') || app.globalData.openid
    if (userId) payload.userId = Number(userId)
    if (openid) payload.openid = openid
    const saveResult = await request.saveResult(payload)
    if (request.isSuccess(saveResult) && saveResult.data) {
      app.globalData.lastResult = { ...result, id: saveResult.data.id || result.id, savedResultId: saveResult.data.id || result.savedResultId }
    }
  },

  goBack() { wx.navigateBack() }
})
