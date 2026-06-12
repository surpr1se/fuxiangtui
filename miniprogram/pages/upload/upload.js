// pages/upload/upload.js
const util = require('../../utils/util.js')
const request = require('../../utils/request.js')
const app = getApp()

Page({
  data: {
    fileInfo: {},
    filePath: '',
    showProgress: false,
    progress: 0,
    isParsing: false
  },

  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: res => {
        const file = res.tempFiles[0]
        if (!file) return
        if (!String(file.name || '').toLowerCase().endsWith('.pdf')) {
          util.showToast('请选择PDF格式文件')
          return
        }
        if (file.size > 20 * 1024 * 1024) {
          util.showToast('文件大小不能超过20MB')
          return
        }
        this.setData({
          fileInfo: { name: file.name, size: util.formatFileSize(file.size) },
          filePath: file.path
        })
      },
      fail: err => {
        console.log('选择文件失败:', err)
        util.showToast('选择文件失败')
      }
    })
  },

  async startParse() {
    if (!this.data.filePath) {
      util.showToast('请先选择文件')
      return
    }
    this.setData({ showProgress: true, isParsing: true, progress: 0 })
    try {
      const result = await request.uploadPdf(this.data.filePath, progress => {
        this.setData({ progress: Math.max(0, Math.min(progress, 95)) })
      })
      if (!request.isSuccess(result)) throw new Error(result.message || '解析失败')

      const parsed = request.normalizeUploadData(result)
      let paymentDetails = parsed.paymentDetails || []
      if (!paymentDetails.length) {
        const detailResult = await request.getPaymentDetailList(wx.getStorageSync('userId'))
        if (request.isSuccess(detailResult)) paymentDetails = detailResult.data || []
      }
      if (!paymentDetails.length) throw new Error('未提取到缴费明细')

      const summary = util.buildPaymentSummary(paymentDetails)
      app.globalData.paymentDetails = paymentDetails
      app.globalData.personalInfo = parsed.personalInfo
      app.globalData.paymentSummary = summary
      app.globalData.pdfInfo = {
        id: parsed.id,
        fileName: this.data.fileInfo.name,
        fileSize: this.data.fileInfo.size,
        parseTime: util.formatTime(new Date())
      }

      this.setData({ progress: 100 })
      util.showToast('PDF解析成功', 'success')
      setTimeout(() => wx.navigateTo({ url: '/pages/detail/detail' }), 500)
    } catch (error) {
      console.error('PDF解析失败:', error)
      util.showToast(error.message || '上传解析失败')
    } finally {
      this.setData({ showProgress: false, isParsing: false })
    }
  },

  useDemoData() {
    util.showLoading('加载示例数据中...')
    const paymentDetails = request.generateDemoData()
    const personalInfo = util.normalizePersonalInfo({ name: '余雪琴', idCard: '350425197510140726', gender: '女' })
    app.globalData.paymentDetails = paymentDetails
    app.globalData.personalInfo = personalInfo
    app.globalData.paymentSummary = util.buildPaymentSummary(paymentDetails)
    app.globalData.pdfInfo = { fileName: '缴费明细_示例.pdf', fileSize: '-', parseTime: util.formatTime(new Date()) }
    util.hideLoading()
    util.showToast('加载成功', 'success')
    wx.navigateTo({ url: '/pages/detail/detail' })
  }
})
