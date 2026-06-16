var util = require('../../utils/util.js')
var request = require('../../utils/request.js')
var app = getApp()

Page({
  data: {
    userName: '微信用户',
    avatarUrl: '',
    calcCount: 0,
    avgPension: '¥ 0.00',
    paymentMonths: 0,
    latest: null,
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
    var remoteAvatar = user.avatarUrl || user.avatar_url || ''
    var userName = remoteNick && remoteNick !== '微信用户' ? remoteNick : (storedNick || '微信用户')
    var avatarUrl = remoteAvatar || storedAvatar || ''
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
      self.setData({ calcCount: 0, avgPension: util.currency(0), paymentMonths: 0, latest: null, pdfCount: 0 })
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
        self.setData({
          calcCount: list.length,
          avgPension: util.currency(avg),
          paymentMonths: (app.globalData.paymentSummary && app.globalData.paymentSummary.totalMonths) || 0,
          latest: list[0] || null,
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
  onChooseAvatar: function(e) {
    var self = this
    if (!app.globalData.token) {
      self.login()
      return
    }
    var avatarUrl = e.detail && e.detail.avatarUrl
    if (!avatarUrl) return
    self.avatarToPersistValue(avatarUrl, function(value) {
      self.setData({ avatarUrl: value })
      self.saveProfile({ avatarUrl: value })
    })
  },
  onDialogChooseAvatar: function(e) {
    var self = this
    var avatarUrl = e.detail && e.detail.avatarUrl
    if (!avatarUrl) return
    self.avatarToPersistValue(avatarUrl, function(value) {
      self.setData({ profileDraftAvatar: value })
    })
  },
  onDialogNicknameBlur: function(e) {
    this.setData({ profileDraftName: (e.detail && e.detail.value) || '' })
  },
  avatarToPersistValue: function(path, cb) {
    if (!path) return cb('')
    if (path.indexOf('data:image') === 0 || path.indexOf('http') === 0) return cb(path)
    var ext = (path.split('.').pop() || 'png').toLowerCase()
    var mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png'
    wx.getFileSystemManager().readFile({
      filePath: path,
      encoding: 'base64',
      success: function(res) { cb('data:' + mime + ';base64,' + res.data) },
      fail: function() { cb(path) }
    })
  },
  saveProfileDialog: function() {
    var nickName = (this.data.profileDraftName || '').replace(/^\s+|\s+$/g, '')
    var avatarUrl = this.data.profileDraftAvatar || ''
    if (!nickName) return util.toast('请填写昵称')
    if (!avatarUrl) return util.toast('请选择头像')
    wx.removeStorageSync('profilePromptSkipped')
    this.setData({ userName: nickName, avatarUrl: avatarUrl, profileDialogVisible: false })
    this.saveProfile({ nickName: nickName, avatarUrl: avatarUrl })
  },
  onNicknameBlur: function(e) {
    this.updateNickname(e.detail && e.detail.value)
  },
  onNicknameConfirm: function(e) {
    this.updateNickname(e.detail && e.detail.value)
  },
  updateNickname: function(value) {
    if (!app.globalData.token) {
      this.login()
      return
    }
    var nickName = (value || '').replace(/^\s+|\s+$/g, '')
    if (!nickName || nickName === this.data.userName) return
    this.setData({ userName: nickName })
    this.saveProfile({ nickName: nickName })
  },
  saveProfile: function(payload) {
    var self = this
    var nickName = payload.nickName || self.data.userName || wx.getStorageSync('nickName') || '微信用户'
    var avatarUrl = payload.avatarUrl || self.data.avatarUrl || wx.getStorageSync('avatarUrl') || ''
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
        app.globalData.userInfo = r.data
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
