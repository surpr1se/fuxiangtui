// pages/detail/detail.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    personalInfo: {},
    summary: {},
    paymentDetails: [],
    displayList: [],
    showDetail: true,
    hasMore: true,
    pageSize: 24,
    currentPage: 1,
    idCardMasked: ''
  },

  onLoad(options) {
    this.initData()
  },

  // 初始化数据
  initData() {
    const personalInfo = app.globalData.personalInfo || { name: '张三', idCard: '350100xxxxxxxx0000', gender: '男' }
    const paymentDetails = app.globalData.paymentDetails || []
    const summary = app.globalData.paymentSummary || {
      totalMonths: paymentDetails.length,
      avgPaymentBase: util.calculateAvgBase(paymentDetails),
      startDate: paymentDetails[0]?.yearMonth || '-',
      endDate: paymentDetails[paymentDetails.length - 1]?.yearMonth || '-'
    }

    // 身份证脱敏
    const idCardMasked = util.maskIdCard(personalInfo.idCard)

    // 初始化显示列表（最新的在前）
    const reversedList = [...paymentDetails].reverse()
    const displayList = reversedList.slice(0, this.data.pageSize)

    this.setData({
      personalInfo,
      summary,
      paymentDetails,
      displayList,
      idCardMasked,
      hasMore: paymentDetails.length > this.data.pageSize
    })
  },

  // 展开/收起明细
  toggleDetail() {
    this.setData({
      showDetail: !this.data.showDetail
    })
  },

  // 加载更多
  loadMore() {
    const { paymentDetails, displayList, currentPage, pageSize } = this.data
    const reversedList = [...paymentDetails].reverse()
    const nextPage = currentPage + 1
    const start = (nextPage - 1) * pageSize
    const end = start + pageSize
    const newItems = reversedList.slice(start, end)

    this.setData({
      displayList: [...displayList, ...newItems],
      currentPage: nextPage,
      hasMore: end < reversedList.length
    })
  },

  // 重新上传
  reUpload() {
    wx.navigateBack()
  },

  // 下一步
  goNext() {
    wx.navigateTo({
      url: '/pages/input/input'
    })
  }
})
