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
    profileCompleted: false
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
    var userId = app.globalData.userId || request.currentUserId()
    var openid = app.globalData.openid || request.currentOpenId()
    self.setData({
      userName: userName,
      avatarUrl: avatarUrl,
      hasLogged: !!app.globalData.token,
      profileCompleted: self.isProfileCompleted(userName, avatarUrl)
    })
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
  onChooseAvatar: function(e) {
    var self = this
    var avatarUrl = e.detail && e.detail.avatarUrl
    if (!avatarUrl) return
    if (avatarUrl.indexOf('http') === 0) {
      self.setData({ avatarUrl: avatarUrl })
      self.saveProfile({ avatarUrl: avatarUrl })
      return
    }
    wx.saveFile({
      tempFilePath: avatarUrl,
      success: function(res) {
        var savedPath = res.savedFilePath || avatarUrl
        self.setData({ avatarUrl: savedPath })
        self.saveProfile({ avatarUrl: savedPath })
      },
      fail: function() {
        self.setData({ avatarUrl: avatarUrl })
        self.saveProfile({ avatarUrl: avatarUrl })
      }
    })
  },
  onNicknameBlur: function(e) {
    this.updateNickname(e.detail && e.detail.value)
  },
  onNicknameConfirm: function(e) {
    this.updateNickname(e.detail && e.detail.value)
  },
  updateNickname: function(value) {
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
    wx.navigateTo({ url: '/pages/history/history' })
  },
  policy: function() {
    wx.navigateTo({ url: '/pages/policy/policy' })
  },
  calculate: function() {
    wx.switchTab({ url: '/pages/calculate/calculate' })
  }
})
