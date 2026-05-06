// app.js
App({
  globalData: {
    userInfo: null,
    openid: null,
    token: null,
    paymentDetails: [],
    calculateParams: null,
    lastResult: null
  },

  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log('微信登录code:', res.code)
        this.login(res.code)
      }
    })
  },

  // 登录接口
  login(code) {
    wx.request({
      url: this.globalData.baseUrl + '/api/user/wx-login',
      method: 'POST',
      data: { code },
      success: (res) => {
        if (res.data.code === 0) {
          this.globalData.openid = res.data.data.openid
          this.globalData.token = res.data.data.token
          this.globalData.userInfo = res.data.data.userInfo
          wx.setStorageSync('token', res.data.data.token)
          console.log('登录成功')
        }
      },
      fail: () => {
        // 开发模式下使用模拟用户ID
        const userId = 'guest_' + Date.now()
        this.globalData.openid = userId
        wx.setStorageSync('token', userId)
        console.log('使用模拟用户:', userId)
      }
    })
  },

  globalData: {
    userInfo: null,
    openid: null,
    token: null,
    baseUrl: '', // 后端API地址
    paymentDetails: [],
    calculateParams: null,
    lastResult: null,
    // 社平工资
    socialAvgWage: 7500
  }
})
