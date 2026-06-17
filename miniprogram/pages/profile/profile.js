var util = require('../../utils/util.js')
var request = require('../../utils/request.js')
var app = getApp()

function buildLatestRecord(item) {
  if (!item) return null
  var res = item.result || {}
  var detail = res.pensionDetails || res.pensionDetail || item
  var basic = res.basicInfo || {}
  var personalInfo = res.personalInfo || {}
  var monthlyPension = Number(item.monthlyPension || detail.totalMonthlyPension || res.monthlyPension || 0)
  var paymentYears = item.paymentYears || basic.totalPaymentYears || res.paymentYears || ''
  var paymentMonths = item.paymentMonths || basic.calculateMonths || res.paymentMonths || ''
  var retireAge = item.retireAge || basic.retireAge || basic.retirementAge || res.retireAge || ''
  var title = item.title || ((personalInfo.name || basic.name) ? ((personalInfo.name || basic.name) + '待遇测算结果') : '最近一次测算结果')
  var recordTime = item.calculateTime || item.createTime || item.createdTime || item.updateTime
  return {
    title: title,
    money: util.currency(monthlyPension),
    time: recordTime ? util.dateTime(recordTime) : '-',
    paymentYearsText: paymentYears ? (util.round(paymentYears, 2) + '年') : '-',
    paymentMonthsText: paymentMonths ? (paymentMonths + '个月') : '-',
    retireAgeText: retireAge ? (retireAge + '岁') : '-'
  }
}

Page({
  data: {
    userName: '微信用户',
    avatarUrl: '',
    calcCount: 0,
    avgPension: '¥ 0.00',
    paymentMonths: 0,
    latest: null,
    latestRecord: null,
    pdfCount: 0,
    hasLogged: false,
    profileCompleted: false,
    profileDialogVisible: false,
    profileDraftName: '',
    profileDraftAvatar: ''
  },
  onShow: function() {
    var self = this
    app.waitLogin(function() {
      self.load()
    })
  },
  load: function() {
    var self = this
    var user = app.globalData.userInfo || {}
    var storedNick = wx.getStorageSync('nickName') || ''
    var storedAvatar = wx.getStorageSync('avatarUrl') || ''
    var remoteNick = user.nickName || user.nick_name || ''
    var remoteAvatar = request.absoluteAssetUrl(user.avatarUrl || user.avatar_url || '')
    var userName = remoteNick && remoteNick !== '微信用户' ? remoteNick : (storedNick || '微信用户')
    var avatarUrl = remoteAvatar || request.absoluteAssetUrl(storedAvatar) || ''
    var hasLogged = !!app.globalData.token
    var userId = app.globalData.userId || request.currentUserId()
    var openid = app.globalData.openid || request.currentOpenId()
    self.setData({
      userName: userName,
      avatarUrl: avatarUrl,
      hasLogged: hasLogged,
      profileCompleted: self.isProfileCompleted(userName, avatarUrl),
      profileDraftName: userName === '微信用户' ? '' : userName,
      profileDraftAvatar: avatarUrl
    })
    if (hasLogged && wx.getStorageSync('profilePromptFromLogin') === '1') {
      wx.removeStorageSync('profilePromptFromLogin')
      self.promptProfileDialog()
    }
    if (!hasLogged) {
      self.setData({ calcCount: 0, avgPension: util.currency(0), paymentMonths: 0, latest: null, latestRecord: null, pdfCount: 0 })
      return
    }
    request.getHistoryList({ userId: userId, openid: openid, pageSize: 20 }).then(function(h) {
      var list = []
      if (request.isSuccess(h)) {
        if (Array.isArray(h.data)) list = h.data
        else if (h.data) list = h.data.records || h.data.list || []
      }
      var amounts = list.map(function(i) {
        var res = i.result || {}
        var pd = res.pensionDetails || {}
        return Number(i.monthlyPension || pd.totalMonthlyPension || 0)
      }).filter(function(v) { return !!v })
      var avg = amounts.length ? amounts.reduce(function(s, i) { return s + i }, 0) / amounts.length : 0
      return request.getPdfList(userId).then(function(pdf) {
        var pdfCount = 0
        if (request.isSuccess(pdf)) {
          var d = pdf.data
          pdfCount = Array.isArray(d) ? d.length : ((d && (d.records || d.list)) || []).length
        }
        var latest = list[0] || null
        self.setData({
          calcCount: list.length,
          avgPension: util.currency(avg),
          paymentMonths: (app.globalData.paymentSummary && app.globalData.paymentSummary.totalMonths) || 0,
          latest: latest,
          latestRecord: buildLatestRecord(latest),
          pdfCount: pdfCount
        })
      })
    }).catch(function() {})
  },
  login: function() {
    var self = this
    app.ensureLogin({
      content: '登录后可保存测算记录和个人资料，是否现在登录？',
      success: function() {
        self.load()
        self.promptProfileDialog()
      }
    })
  },
  promptProfileDialog: function() {
    var nickName = this.data.userName || wx.getStorageSync('nickName') || ''
    var avatarUrl = this.data.avatarUrl || wx.getStorageSync('avatarUrl') || ''
    if (nickName && nickName !== '微信用户' && avatarUrl) return
    if (wx.getStorageSync('profilePromptSkipped') === '1') return
    this.openProfileDialog()
  },
  openProfileDialog: function() {
    if (!app.globalData.token) {
      this.login()
      return
    }
    var nickName = this.data.userName || wx.getStorageSync('nickName') || ''
    var avatarUrl = this.data.avatarUrl || wx.getStorageSync('avatarUrl') || ''
    this.setData({
      profileDialogVisible: true,
      profileDraftName: nickName === '微信用户' ? '' : nickName,
      profileDraftAvatar: avatarUrl || ''
    })
  },
  closeProfileDialog: function() {
    wx.setStorageSync('profilePromptSkipped', '1')
    this.setData({ profileDialogVisible: false })
  },
  noop: function() {},
  requireLogin: function(next) {
    if (app.globalData.token) {
      next && next()
      return
    }
    app.ensureLogin({
      content: '登录后可保存测算记录和个人资料，是否现在登录？',
      success: next
    })
  },
  onDialogChooseAvatar: function(e) {
    var self = this
    var avatarPath = e.detail && e.detail.avatarUrl
    if (!avatarPath) return
    if (!app.globalData.token) {
      util.toast('请先登录后再上传头像')
      return
    }
    self.setData({ profileDraftAvatar: avatarPath })
    util.loading('上传头像')
    request.uploadAvatar(avatarPath).then(function(r) {
      util.hideLoading()
      if (!request.isSuccess(r)) {
        self.setData({ profileDraftAvatar: '' })
        util.toast(r.message || '头像上传失败')
        return
      }
      var data = r.data || {}
      var avatarUrl = data.avatarUrl || data.avatar_url || data.url || ''
      if (!avatarUrl) {
        self.setData({ profileDraftAvatar: '' })
        util.toast('头像上传失败')
        return
      }
      self.setData({ profileDraftAvatar: avatarUrl })
    }).catch(function() {
      util.hideLoading()
      self.setData({ profileDraftAvatar: '' })
      util.toast('头像上传失败')
    })
  },
  onDialogNicknameInput: function(e) {
    this.setData({ profileDraftName: (e.detail && e.detail.value) || '' })
  },
  saveProfileDialog: function() {
    var nickName = (this.data.profileDraftName || '').replace(/^\s+|\s+$/g, '')
    var avatarUrl = this.data.profileDraftAvatar || ''
    if (!nickName) return util.toast('请填写昵称')
    if (!avatarUrl) return util.toast('请选择头像')
    if (avatarUrl.indexOf('http') !== 0 && avatarUrl.indexOf('/uploads/') !== 0) return util.toast('头像还在上传，请稍后保存')
    wx.removeStorageSync('profilePromptSkipped')
    this.setData({ userName: nickName, avatarUrl: avatarUrl, profileDialogVisible: false })
    this.saveProfile({ nickName: nickName, avatarUrl: avatarUrl })
  },
  saveProfile: function(payload) {
    var self = this
    var nickName = payload.nickName || self.data.userName || wx.getStorageSync('nickName') || '微信用户'
    var avatarUrl = request.absoluteAssetUrl(payload.avatarUrl || self.data.avatarUrl || wx.getStorageSync('avatarUrl') || '')
    wx.setStorageSync('nickName', nickName)
    if (avatarUrl) wx.setStorageSync('avatarUrl', avatarUrl)
    self.setData({ profileCompleted: self.isProfileCompleted(nickName, avatarUrl) })
    app.globalData.userInfo = app.globalData.userInfo || {}
    app.globalData.userInfo.nickName = nickName
    app.globalData.userInfo.avatarUrl = avatarUrl
    if (!app.globalData.token) return
    request.put('/user/profile', {
      nickName: nickName,
      avatarUrl: avatarUrl
    }).then(function(r) {
      if (request.isSuccess(r) && r.data) {
        var remoteAvatar = request.absoluteAssetUrl(r.data.avatarUrl || r.data.avatar_url || avatarUrl)
        app.globalData.userInfo = util.assign({}, r.data, { nickName: r.data.nickName || r.data.nick_name || nickName, avatarUrl: remoteAvatar })
        if (remoteAvatar) {
          wx.setStorageSync('avatarUrl', remoteAvatar)
          self.setData({ avatarUrl: remoteAvatar, profileDraftAvatar: remoteAvatar })
        }
      }
    })
  },
  isProfileCompleted: function(nickName, avatarUrl) {
    return !!(avatarUrl && nickName && nickName !== '微信用户')
  },
  history: function() {
    this.requireLogin(function() {
      wx.navigateTo({ url: '/pages/history/history' })
    })
  },
  policy: function() {
    wx.navigateTo({ url: '/pages/policy/policy' })
  },
  policyDetail: function(e) {
    var type = e.currentTarget.dataset.policy || ''
    wx.navigateTo({ url: '/pages/policy/policy?type=' + type })
  },
  logout: function() {
    var self = this
    wx.showModal({
      title: '退出登录',
      content: '确定退出当前账号吗？',
      confirmText: '退出',
      confirmColor: '#E53E3E',
      success: function(res) {
        if (!res.confirm) return
        ;['token', 'openId', 'userId', 'nickName', 'avatarUrl', 'profilePromptSkipped', 'profilePromptFromLogin'].forEach(function(k) { wx.removeStorageSync(k) })
        app.globalData.token = ''
        app.globalData.openid = ''
        app.globalData.userId = null
        app.globalData.userInfo = null
        self.setData({ userName: '微信用户', avatarUrl: '', hasLogged: false, profileCompleted: false })
        wx.showToast({ title: '已退出', icon: 'success' })
      }
    })
  },
  calculate: function() {
    wx.switchTab({ url: '/pages/calculate/calculate' })
  }
})
