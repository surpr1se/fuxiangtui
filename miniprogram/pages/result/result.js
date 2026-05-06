// pages/result/result.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    result: {},
    showBreakdown: true,
    showProcess: false,
    showCompare: false,
    selectedScheme: 'self'
  },

  onLoad(options) {
    const result = app.globalData.lastResult
    if (result) {
      this.setData({ result })
    } else {
      // 如果没有数据，返回首页
      util.showToast('数据异常，请重新测算')
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/index/index' })
      }, 1500)
    }
  },

  // 展开/收起待遇明细
  toggleBreakdown() {
    this.setData({
      showBreakdown: !this.data.showBreakdown
    })
  },

  // 展开/收起计算过程
  toggleProcess() {
    this.setData({
      showProcess: !this.data.showProcess
    })
  },

  // 展开/收起多方案对比
  toggleCompare() {
    this.setData({
      showCompare: !this.data.showCompare
    })
  },

  // 选择对比方案
  selectScheme(e) {
    const scheme = e.currentTarget.dataset.scheme
    this.setData({ selectedScheme: scheme })
  },

  // 保存结果
  saveResult() {
    const result = this.data.result
    const history = wx.getStorageSync('calculateHistory') || []
    
    const record = {
      id: Date.now(),
      result,
      params: app.globalData.calculateParams,
      createTime: new Date().toLocaleString()
    }
    
    // 最多保存50条
    history.unshift(record)
    if (history.length > 50) {
      history.splice(50)
    }
    
    wx.setStorageSync('calculateHistory', history)
    util.showToast('保存成功', 'success')
  },

  // 返回首页
  goHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    })
  },

  onShareAppMessage() {
    return {
      title: `我的养老金预计每月${this.data.result.pensionDetails.totalMonthlyPension}元，快来测测你的！`,
      path: '/pages/index/index'
    }
  }
})
