const request = require('./utils/request.js')

App({
  globalData: {
    baseUrl: request.config.baseUrl,
    token: '',
    openid: '',
    userInfo: null,
    personalInfo: null,
    paymentDetails: [],
    paymentSummary: null,
    pdfInfo: null,
    retireInfo: null,
    calculateParams: null,
    calculateResult: null,
    socialAvgWage: 8500
  },

  onLaunch() {
    this.globalData.token = wx.getStorageSync('token') || ''
    this.globalData.openid = wx.getStorageSync('openId') || ''
    wx.login({
      success: res => {
        if (res.code) this.login(res.code)
      },
      fail: err => console.warn('wx.login失败', err)
    })
  },

  async login(code, userInfo = {}) {
    try {
      const result = await request.post('/user/wxlogin', {
        code,
        nickName: userInfo.nickName || '微信用户',
        avatarUrl: userInfo.avatarUrl || ''
      })
      if (!request.isSuccess(result)) return
      const data = result.data || {}
      this.globalData.token = data.token || data.accessToken || ''
      this.globalData.openid = data.openId || data.openid || data.open_id || ''
      this.globalData.userInfo = data.userInfo || data
      if (this.globalData.token) wx.setStorageSync('token', this.globalData.token)
      if (this.globalData.openid) wx.setStorageSync('openId', this.globalData.openid)
      if (data.userId || data.id) wx.setStorageSync('userId', data.userId || data.id)
    } catch (error) {
      console.warn('登录失败', error)
    }
  }
})
