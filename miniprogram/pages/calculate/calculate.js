var util = require('../../utils/util.js')
var request = require('../../utils/request.js')
var app = getApp()

Page({
  data: {
    fileInfo: null,
    filePath: '',
    uploading: false,
    progress: 0,
    hasLogged: false
  },
  onShow: function() {
    this.setData({ hasLogged: !!app.globalData.token })
    if (!this.data.uploading) this.resetFile()
  },
  resetFile: function() {
    this.setData({ fileInfo: null, filePath: '', progress: 0 })
  },
  clearFile: function() {
    if (this.data.uploading) return util.toast('正在解析中，请稍后')
    this.resetFile()
  },
  login: function() {
    var self = this
    app.ensureLogin({
      content: '登录后才能使用养老金测算功能，是否现在登录？',
      success: function() {
        self.setData({ hasLogged: true })
        self.promptProfileAfterLogin()
      }
    })
  },
  promptProfileAfterLogin: function() {
    var user = app.globalData.userInfo || {}
    var nick = user.nickName || user.nick_name || wx.getStorageSync('nickName') || ''
    var avatar = user.avatarUrl || user.avatar_url || wx.getStorageSync('avatarUrl') || ''
    if (nick && nick !== '微信用户' && avatar) return
    wx.showModal({
      title: '完善资料',
      content: '登录成功，是否去个人中心补充微信头像和昵称？',
      confirmText: '去完善',
      confirmColor: '#FF6B6B',
      success: function(res) {
        if (res.confirm) {
          wx.setStorageSync('profilePromptFromLogin', '1')
          wx.switchTab({ url: '/pages/profile/profile' })
        }
      }
    })
  },
  requireLogin: function(next) {
    var self = this
    if (app.globalData.token) {
      next && next()
      return
    }
    app.ensureLogin({
      content: '登录后才能使用养老金测算功能，是否现在登录？',
      success: function() {
        self.setData({ hasLogged: true })
        self.promptProfileAfterLogin()
        next && next()
      }
    })
  },
  chooseFile: function() {
    var self = this
    if (!app.globalData.token) {
      self.login()
      return
    }
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
    if (!app.globalData.token) {
      self.login()
      return
    }
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
        return request.getPaymentDetailList(request.currentUserId()).then(function(lr) {
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
    if (!app.globalData.token) {
      this.login()
      return
    }
    var details = util.demoPayments()
    app.globalData.paymentDetails = details
    app.globalData.personalInfo = util.normalizePersonalInfo({ name: '张三', idCard: '350425197510140726', gender: '女' })
    app.globalData.paymentSummary = util.paymentSummary(details)
    app.globalData.pdfInfo = { fileName: '缴费明细_示例.pdf', fileSize: '-', parseTime: util.dateTime(), isDemo: true }
    wx.navigateTo({ url: '/pages/payment/payment' })
  }
})
