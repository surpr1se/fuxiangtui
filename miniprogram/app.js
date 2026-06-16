var request = require('./utils/request.js')

App({
  globalData: {
    userInfo: null,
    personalInfo: null,
    openid: null,
    token: null,
    userId: null,
    logining: false,
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
      self.syncUserInfo()
    }
  },
  doLogin: function(options) {
    options = options || {}
    var self = this
    if (self.globalData.token) {
      options.success && options.success(self.globalData)
      return
    }
    self.globalData.logining = true
    wx.login({
      success: function(res) {
        if (res.code) {
          request.post('/user/wx-login', {
            code: res.code,
            nickName: wx.getStorageSync('nickName') || '微信用户',
            avatarUrl: wx.getStorageSync('avatarUrl') || ''
          }).then(function(r) {
            if (!request.isSuccess(r)) {
              console.warn('wx-login 失败', r.message || r)
              self.globalData.logining = false
              options.fail && options.fail(r)
              return
            }
            var d = r.data || {}
            self.globalData.token = d.token || d.accessToken || ''
            self.globalData.openid = d.openId || d.openid || d.open_id || ''
            self.globalData.userId = d.userId || d.id || null
            self.globalData.logining = false
            wx.removeStorageSync('profilePromptSkipped')
            if (self.globalData.token) wx.setStorageSync('token', self.globalData.token)
            if (self.globalData.openid) wx.setStorageSync('openId', self.globalData.openid)
            if (self.globalData.userId) wx.setStorageSync('userId', self.globalData.userId)
            self.syncUserInfo()
            options.success && options.success(d)
          }).catch(function(err) {
            console.warn('wx-login 请求异常', err)
            self.globalData.logining = false
            options.fail && options.fail(err)
          })
        } else {
          self.globalData.logining = false
          options.fail && options.fail({ message: '微信登录失败' })
        }
      },
      fail: function(err) {
        self.globalData.logining = false
        options.fail && options.fail(err)
      }
    })
  },
  ensureLogin: function(options) {
    options = options || {}
    var self = this
    if (self.globalData.token) {
      options.success && options.success(self.globalData)
      return
    }
    wx.showModal({
      title: options.title || '微信登录',
      content: options.content || '登录后可保存测算记录和个人资料，是否现在登录？',
      confirmText: options.confirmText || '登录',
      confirmColor: '#FF6B6B',
      success: function(res) {
        if (!res.confirm) {
          options.cancel && options.cancel()
          return
        }
        wx.showLoading({ title: '登录中' })
        self.doLogin({
          success: function(data) {
            wx.hideLoading()
            wx.showToast({ title: '登录成功', icon: 'success' })
            options.success && options.success(data)
          },
          fail: function(err) {
            wx.hideLoading()
            wx.showToast({ title: (err && err.message) || '登录失败', icon: 'none' })
            options.fail && options.fail(err)
          }
        })
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
