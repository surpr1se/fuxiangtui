// pages/detail/detail.js
const util = require('../../utils/util.js')
const request = require('../../utils/request.js')
const app = getApp()

Page({
  data: {
    personalInfo: {},
    summary: {},
    yearGroups: [],
    editVisible: false,
    editYear: '',
    editItems: [],
    idCardMasked: '',
    pdfInfo: null
  },

  onLoad() { this.initData() },
  onShow() { this.initData() },

  initData() {
    const personalInfo = util.normalizePersonalInfo(app.globalData.personalInfo || {})
    const paymentDetails = util.normalizePaymentDetails(app.globalData.paymentDetails || [])
    const summary = util.buildPaymentSummary(paymentDetails)
    const yearGroups = util.groupPaymentsByYear(paymentDetails)
    app.globalData.paymentDetails = paymentDetails
    app.globalData.paymentSummary = summary
    app.globalData.personalInfo = personalInfo
    this.setData({
      personalInfo,
      summary,
      yearGroups,
      idCardMasked: util.maskIdCard(personalInfo.idCard),
      pdfInfo: app.globalData.pdfInfo || null
    })
  },

  toggleYear(e) {
    const year = String(e.currentTarget.dataset.year)
    const yearGroups = this.data.yearGroups.map(group => group.year === year ? { ...group, expanded: !group.expanded } : group)
    this.setData({ yearGroups })
  },

  openEdit(e) {
    const year = String(e.currentTarget.dataset.year)
    const group = this.data.yearGroups.find(item => item.year === year)
    if (!group) return
    this.setData({
      editVisible: true,
      editYear: year,
      editItems: group.items.map(item => ({ ...item, inputValue: String(item.paymentBase) }))
    })
  },

  onMonthBaseInput(e) {
    const index = Number(e.currentTarget.dataset.index)
    const editItems = [...this.data.editItems]
    editItems[index].inputValue = e.detail.value
    this.setData({ editItems })
  },

  noop() {},
  closeEdit() { this.setData({ editVisible: false, editYear: '', editItems: [] }) },

  saveEdit() {
    const changed = this.data.editItems.map(item => ({
      ...item,
      paymentBase: util.round(item.inputValue, 2),
      modified: util.round(item.inputValue, 2) !== util.round(item.paymentBase, 2)
    }))
    const changedMap = {}
    changed.forEach(item => { changedMap[item.yearMonth] = item })
    const paymentDetails = util.normalizePaymentDetails(app.globalData.paymentDetails || []).map(item => changedMap[item.yearMonth] ? { ...item, ...changedMap[item.yearMonth], modified: Boolean(item.modified || changedMap[item.yearMonth].modified) } : item)
    app.globalData.paymentDetails = paymentDetails
    app.globalData.paymentSummary = util.buildPaymentSummary(paymentDetails)
    this.closeEdit()
    this.initData()
    util.showToast('已更新缴费数据', 'success')
    request.importPaymentDetails(paymentDetails).catch(err => console.warn('同步缴费明细失败:', err))
  },

  reUpload() { wx.navigateBack() },
  goNext() { wx.navigateTo({ url: '/pages/input/input' }) }
})
