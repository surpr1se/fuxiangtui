var util = require('../../utils/util.js')
var request = require('../../utils/request.js')
var app = getApp()

Page({
  data: {
    fileInfo: null,
    filePath: '',
    uploading: false,
    progress: 0
  },
  chooseFile: function() {
    var self = this
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: function(res) {
        var f = res.tempFiles && res.tempFiles[0]
        if (!f) return
        if (String(f.name || '').toLowerCase().indexOf('.pdf') === -1) return util.toast('请选择PDF文件')
        if (f.size > 20 * 1024 * 1024) return util.toast('文件不能超过20MB')
        self.setData({
          fileInfo: { name: f.name, size: (f.size / 1024 / 1024).toFixed(2) + ' MB' },
          filePath: f.path
        })
      }
    })
  },
  startUpload: function() {
    var self = this
    if (!this.data.filePath) return util.toast('请先选择PDF')
    this.setData({ uploading: true, progress: 0 })
    util.loading('正在解析PDF')
    request.uploadPdf(this.data.filePath, function(p) {
      self.setData({ progress: p })
    }).then(function(r) {
      if (!request.isSuccess(r)) throw new Error(r.message || '解析失败')
      var parsed = request.normalizeUploadData(r)
      var details = parsed.paymentDetails || []
      if (!details.length) {
        return request.getPaymentDetailList(wx.getStorageSync('userId')).then(function(lr) {
          if (request.isSuccess(lr)) details = lr.data || []
          return { parsed: parsed, details: details }
        })
      }
      return { parsed: parsed, details: details }
    }).then(function(ctx) {
      if (!ctx.details.length) throw new Error('未提取到缴费明细')
      app.globalData.personalInfo = ctx.parsed.personalInfo
      app.globalData.paymentDetails = ctx.details
      app.globalData.paymentSummary = util.paymentSummary(ctx.details)
      app.globalData.pdfInfo = {
        id: ctx.parsed.id,
        fileName: self.data.fileInfo ? self.data.fileInfo.name : '缴费明细.pdf',
        fileSize: self.data.fileInfo ? self.data.fileInfo.size : '-',
        parseTime: util.dateTime()
      }
      util.toast('解析成功', 'success')
      wx.navigateTo({ url: '/pages/payment/payment' })
    }).catch(function(e) {
      util.toast(e.message || '解析失败')
    }).then(function() {
      util.hideLoading()
      self.setData({ uploading: false })
    })
  },
  useDemo: function() {
    var details = util.demoPayments()
    app.globalData.paymentDetails = details
    app.globalData.personalInfo = util.normalizePersonalInfo({ name: '余雪琴', idCard: '350425197510140726', gender: '女' })
    app.globalData.paymentSummary = util.paymentSummary(details)
    app.globalData.pdfInfo = { fileName: '缴费明细_示例.pdf', fileSize: '-', parseTime: util.dateTime() }
    wx.navigateTo({ url: '/pages/payment/payment' })
  }
})
