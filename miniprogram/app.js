// app.js
App({
  globalData: {
    userInfo: null,
    openid: null,
    token: null,
    baseUrl: 'http://14.103.38.180:8080/api/v1',
    paymentDetails: [],
    calculateParams: null,
    lastResult: null,
    // 社平工资
    socialAvgWage: 7500
  },

  onLaunch() {
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    wx.login({
      success: res => {
        console.log('微信登录code:', res.code)
        this.login(res.code)
      },
      fail: err => {
        console.error('wx.login失败:', err)
      }
    })
  },

  // 微信登录接口：POST /api/v1/user/wxlogin
  login(code, userInfo = {}) {
    wx.request({
      url: this.globalData.baseUrl + '/user/wxlogin',
      method: 'POST',
      data: {
        code,
        nickName: userInfo.nickName || '微信用户',
        avatarUrl: userInfo.avatarUrl || ''
      },
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        const body = res.data || {}
        if (body.code === 0 || body.code === 200) {
          const data = body.data || {}
          this.globalData.openid = data.openId || data.openid || data.open_id
          this.globalData.token = data.token || data.accessToken
          this.globalData.userInfo = data.userInfo || data
          if (data.userId || data.id) wx.setStorageSync('userId', data.userId || data.id)
          if (this.globalData.openid) wx.setStorageSync('openId', this.globalData.openid)
          if (this.globalData.token) wx.setStorageSync('token', this.globalData.token)
          console.log('登录成功')
        } else {
          console.error('微信登录接口失败:', body.message || body)
        }
      },
      fail: (err) => {
        console.error('微信登录请求失败:', err)
      }
    })
  }
})
