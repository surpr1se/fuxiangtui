// pages/index/index.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {

  },

  onLoad(options) {
    console.log('首页加载')
  },

  onShow() {
    // 页面显示时检查登录状态
    const token = wx.getStorageSync('token')
    if (!token) {
      this.autoLogin()
    }
  },

  // 自动登录（游客模式）
  autoLogin() {
    const userId = 'guest_' + Date.now()
    wx.setStorageSync('token', userId)
    app.globalData.openid = userId
    console.log('自动登录成功，用户ID:', userId)
  },

  // 跳转到PDF上传页
  goToUpload() {
    wx.navigateTo({
      url: '/pages/upload/upload'
    })
  },

  // 跳转到手动测算页（直接进入补充信息）
  goToInput() {
    // 先设置空的缴费明细（模拟）
    app.globalData.paymentDetails = require('../../utils/request.js').generateDemoData()
    wx.navigateTo({
      url: '/pages/input/input'
    })
  },

  // 跳转到历史记录
  goToHistory() {
    wx.navigateTo({
      url: '/pages/history/history'
    })
  },

  // 跳转到指南
  goToGuide() {
    wx.navigateTo({
      url: '/pages/guide/guide'
    })
  },

  // 即将开放提示
  showComingSoon() {
    util.showToast('功能开发中，敬请期待')
  },

  onShareAppMessage() {
    return {
      title: '福享退 - 福建养老保险智能测算平台',
      path: '/pages/index/index'
    }
  }
})
