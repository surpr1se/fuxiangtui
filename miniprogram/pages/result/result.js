// pages/result/result.js
const util = require('../../utils/util.js')
const request = require('../../utils/request.js')
const app = getApp()

Page({
  data: {
    result: {},
    pension: {},
    basicInfo: {},
    adjustmentForecast: [],
    schemeCompare: [],
    showBreakdown: true,
    showProcess: false,
    showCompare: true,
    showForecast: true
  },

  onLoad() { this.initResult() },
  onShow() { this.initResult() },

  initResult() {
    const result = util.normalizeCalculateResult(app.globalData.lastResult || {}, app.globalData.calculateParams || {})
    if (!result || !result.pensionDetails) {
      util.showToast('数据异常，请重新测算')
      setTimeout(() => wx.reLaunch({ url: '/pages/index/index' }), 1200)
      return
    }
    const pension = {
      basicPensionText: util.formatCurrency(result.pensionDetails.basicPension),
      personalAccountPensionText: util.formatCurrency(result.pensionDetails.personalAccountPension),
      transitionalPensionText: util.formatCurrency(result.pensionDetails.transitionalPension),
      totalMonthlyPensionText: util.formatCurrency(result.pensionDetails.totalMonthlyPension)
    }
    this.setData({
      result,
      pension,
      basicInfo: result.basicInfo || {},
      adjustmentForecast: this.buildForecast(result),
      schemeCompare: this.buildSchemeCompare(result)
    })
  },

  buildForecast(result) {
    const base = Number(result.pensionDetails?.totalMonthlyPension || 0)
    const startYear = new Date().getFullYear() + 1
    return [1, 2, 3, 4, 5].map(i => {
      const amount = util.round(base * Math.pow(1.045, i), 2)
      return { year: startYear + i - 1, amount, amountText: util.formatCurrency(amount), rate: '4.5%' }
    })
  },

  buildSchemeCompare(result) {
    const base = Number(result.pensionDetails?.totalMonthlyPension || 0)
    return [
      { name: '本人基数', amount: base, rate: '5.2%', breakEven: `${Math.round(Number(result.basicInfo?.retireAge || 60) + 11)}岁`, active: true },
      { name: '社平60%', amount: base * 0.88, rate: '4.8%', breakEven: '72岁' },
      { name: '社平100%', amount: base * 1.08, rate: '5.0%', breakEven: '72岁' },
      { name: '社平300%', amount: base * 1.72, rate: '4.2%', breakEven: '75岁' }
    ].map(item => ({ ...item, amount: util.round(item.amount, 2), amountText: util.formatCurrency(item.amount) }))
  },

  toggleBreakdown() { this.setData({ showBreakdown: !this.data.showBreakdown }) },
  toggleProcess() { this.setData({ showProcess: !this.data.showProcess }) },
  toggleCompare() { this.setData({ showCompare: !this.data.showCompare }) },
  toggleForecast() { this.setData({ showForecast: !this.data.showForecast }) },

  async saveResult() {
    if (this.data.result.savedResultId || this.data.result.id) {
      util.showToast('已保存到历史记录', 'success')
      return
    }
    try {
      const detail = this.data.result.pensionDetails || {}
      const params = app.globalData.calculateParams || {}
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
        result: this.data.result
      }
      const userId = wx.getStorageSync('userId')
      const openid = wx.getStorageSync('openId') || app.globalData.openid
      if (userId) payload.userId = Number(userId)
      if (openid) payload.openid = openid
      const res = await request.saveResult(payload)
      if (!request.isSuccess(res)) throw new Error(res.message || '保存失败')
      util.showToast('保存成功', 'success')
    } catch (error) {
      util.showToast(error.message || '保存失败')
    }
  },

  goHome() { wx.reLaunch({ url: '/pages/index/index' }) },
  onShareAppMessage() { return { title: `我的养老金预计每月${this.data.pension.totalMonthlyPensionText}，快来测测你的！`, path: '/pages/index/index' } }
})
