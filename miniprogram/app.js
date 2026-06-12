// app.js
const request = require('./utils/request.js')

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
    lastResult: null,
    socialAvgWage: 8500,
    retireInfo: null,
    futurePaymentMode: 'real'
  },

  onLaunch() {
    const token = wx.getStorageSync('token')
    const openId = wx.getStorageSync('openId')
    if (token) this.globalData.token = token
    if (openId) this.globalData.openid = openId

    wx.login({
      success: res => {
        if (res.code) this.login(res.code)
      },
      fail: err => console.error('wx.login失败:', err)
    })
  },

  login(code, userInfo = {}) {
    request.post('/user/wxlogin', {
      code,
      nickName: userInfo.nickName || '微信用户',
      avatarUrl: userInfo.avatarUrl || ''
    }).then(body => {
      if (request.isSuccess(body)) {
        const data = body.data || {}
        this.globalData.openid = data.openId || data.openid || data.open_id
        this.globalData.token = data.token || data.accessToken
        this.globalData.userInfo = data.userInfo || data
        if (data.userId || data.id) wx.setStorageSync('userId', data.userId || data.id)
        if (this.globalData.openid) wx.setStorageSync('openId', this.globalData.openid)
        if (this.globalData.token) wx.setStorageSync('token', this.globalData.token)
      } else {
        console.warn('微信登录接口失败:', body.message || body)
      }
    }).catch(err => console.error('微信登录请求失败:', err))
  }
})
