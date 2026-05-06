// pages/history/history.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    historyList: []
  },

  onLoad(options) {
    this.loadHistory()
  },

  onShow() {
    this.loadHistory()
  },

  // 加载历史记录
  loadHistory() {
    const history = wx.getStorageSync('calculateHistory') || []
    this.setData({ historyList: history })
  },

  // 查看详情
  viewDetail(e) {
    const index = e.currentTarget.dataset.index
    const record = this.data.historyList[index]
    
    if (record) {
      app.globalData.lastResult = record.result
      app.globalData.calculateParams = record.params
      
      wx.navigateTo({
        url: '/pages/result/result'
      })
    }
  },

  // 去测算
  goCalculate() {
    wx.navigateTo({
      url: '/pages/upload/upload'
    })
  }
})
