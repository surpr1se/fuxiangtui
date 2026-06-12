// pages/history/history.js
const util = require('../../utils/util.js')
const request = require('../../utils/request.js')
const app = getApp()

Page({
  data: {
    historyList: [],
    loading: false
  },

  onLoad() { this.loadHistory() },
  onShow() { this.loadHistory() },

  normalizeHistory(data) {
    const list = Array.isArray(data) ? data : (data?.records || data?.list || data?.rows || [])
    return list.map(item => {
      const result = item.result || item.calculateResult || {}
      const detail = result.pensionDetails || result.pensionDetail || result || item
      const basicInfo = result.basicInfo || item.basicInfo || {}
      return {
        ...item,
        title: item.title || item.userName || result.personalInfo?.name || result.basicInfo?.name || '养老金测算',
        timeText: util.formatTime(item.calculateTime || item.createTime || item.createdTime || item.createdAt || Date.now()),
        monthlyText: util.formatCurrency(item.monthlyPension || detail.totalMonthlyPension || result.monthlyPension || 0),
        retireAge: item.retireAge || basicInfo.retireAge || basicInfo.retirementAge || '-',
        totalPaymentYears: item.paymentYears || basicInfo.totalPaymentYears || '-',
        avgPaymentIndex: basicInfo.avgPaymentIndex || basicInfo.averagePaymentIndex || '-',
        resultId: item.id || item.calculateNo || item.resultId || item.savedResultId
      }
    })
  },

  async loadHistory() {
    this.setData({ loading: true })
    try {
      const userId = wx.getStorageSync('userId')
      const openid = wx.getStorageSync('openId') || app.globalData.openid
      const result = await request.getHistoryList({ userId, openid, page: 1, pageSize: 50 })
      if (request.isSuccess(result)) {
        this.setData({ historyList: this.normalizeHistory(result.data) })
      } else {
        const local = wx.getStorageSync('calculateHistory') || []
        this.setData({ historyList: this.normalizeHistory(local) })
      }
    } catch (error) {
      console.error('加载历史失败:', error)
      const local = wx.getStorageSync('calculateHistory') || []
      this.setData({ historyList: this.normalizeHistory(local) })
    } finally {
      this.setData({ loading: false })
    }
  },

  async viewDetail(e) {
    const index = Number(e.currentTarget.dataset.index)
    const record = this.data.historyList[index]
    if (!record) return
    util.showLoading('加载详情...')
    try {
      let resultData = record.result
      if (record.resultId) {
        const detail = await request.getResult(record.resultId)
        if (request.isSuccess(detail)) resultData = detail.data?.result || detail.data || resultData
      }
      app.globalData.lastResult = util.normalizeCalculateResult(resultData || record.result || record, app.globalData.calculateParams || {})
      wx.navigateTo({ url: '/pages/result/result' })
    } catch (error) {
      util.showToast(error.message || '加载详情失败')
    } finally {
      util.hideLoading()
    }
  },

  goCalculate() { wx.navigateTo({ url: '/pages/upload/upload' }) }
})
