var request = require('./utils/request.js')

App({
  globalData: {
    userInfo: null,
    personalInfo: null,
    openid: null,
    token: null,
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
    this.globalData.token = wx.getStorageSync('token') || ''
    this.globalData.openid = wx.getStorageSync('openId') || ''
    var self = this
    wx.login({
      success: function(res) {
        if (res.code) self.login(res.code)
      },
      fail: function(err) {
        console.warn('wx.login失败', err)
      }
    })
  },
  login: function(code) {
    var self = this
    var userInfo = wx.getStorageSync('userInfo') || {}
    return request.post('/user/wxlogin', {
      code: code,
      nickName: userInfo.nickName || '微信用户',
      avatarUrl: userInfo.avatarUrl || ''
    }).then(function(result) {
      if (!request.isSuccess(result)) return
      var data = result.data || {}
      self.globalData.token = data.token || data.accessToken || ''
      self.globalData.openid = data.openId || data.openid || data.open_id || ''
      self.globalData.userInfo = data.userInfo || data
      if (self.globalData.token) wx.setStorageSync('token', self.globalData.token)
      if (self.globalData.openid) wx.setStorageSync('openId', self.globalData.openid)
      if (data.userId || data.id) wx.setStorageSync('userId', data.userId || data.id)
    }).catch(function(error) {
      console.warn('登录失败', error)
    })
  }
})
