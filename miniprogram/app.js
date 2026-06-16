var request = require('./utils/request.js')

App({
  globalData: {
    userInfo: null,
    personalInfo: null,
    openid: null,
    token: null,
    userId: null,
    logining: true,
    baseUrl: request.config.baseUrl,
    paymentDetails: [],
    paymentSummary: null,
    pdfInfo: null,
    calculateParams: null,
    calculateResult: null,
    lastResult: null,
    socialAvgWage: 8500,
    retireInfo: null
  },
  onLaunch: function() {
    var self = this
    var hasToken = wx.getStorageSync('token')
    if (hasToken) {
      self.globalData.token = hasToken
      self.globalData.openid = wx.getStorageSync('openId') || ''
      self.globalData.userId = wx.getStorageSync('userId') || null
      self.globalData.logining = false
      self.syncUserInfo()
    }
    self.doLogin()
  },
  doLogin: function() {
    var self = this
    wx.login({
      success: function(res) {
        if (res.code) {
          request.post('/user/wx-login', {
            code: res.code,
            nickName: '微信用户',
            avatarUrl: ''
          }).then(function(r) {
            if (!request.isSuccess(r)) {
              console.warn('wx-login 失败', r.message || r)
              self.globalData.logining = false
              return
            }
            var d = r.data || {}
            self.globalData.token = d.token || d.accessToken || ''
            self.globalData.openid = d.openId || d.openid || d.open_id || ''
            self.globalData.userId = d.userId || d.id || null
            self.globalData.logining = false
            if (self.globalData.token) wx.setStorageSync('token', self.globalData.token)
            if (self.globalData.openid) wx.setStorageSync('openId', self.globalData.openid)
            if (self.globalData.userId) wx.setStorageSync('userId', self.globalData.userId)
            self.syncUserInfo()
          }).catch(function(err) {
            console.warn('wx-login 请求异常', err)
            self.globalData.logining = false
          })
        } else {
          self.globalData.logining = false
        }
      },
      fail: function() {
        self.globalData.logining = false
      }
    })
  },
  syncUserInfo: function() {
    var self = this
    request.get('/user/profile').then(function(r) {
      if (request.isSuccess(r) && r.data) {
        var storedNick = wx.getStorageSync('nickName') || ''
        var storedAvatar = wx.getStorageSync('avatarUrl') || ''
        var remoteNick = r.data.nickName || r.data.nick_name || ''
        var remoteAvatar = r.data.avatarUrl || r.data.avatar_url || ''
        var nick = remoteNick && remoteNick !== '微信用户' ? remoteNick : (storedNick || '微信用户')
        var avatar = remoteAvatar || storedAvatar
        self.globalData.userInfo = Object.assign({}, r.data, { nickName: nick, avatarUrl: avatar })
        if (nick && nick !== '微信用户') wx.setStorageSync('nickName', nick)
        if (avatar) wx.setStorageSync('avatarUrl', avatar)
      }
    }).catch(function() {})
  },
  waitLogin: function(cb) {
    var self = this
    if (!self.globalData.logining) {
      cb && cb()
      return
    }
    var times = 0
    var iv = setInterval(function() {
      times++
      if (!self.globalData.logining || times > 60) {
        clearInterval(iv)
        cb && cb()
      }
    }, 100)
  }
})
