// pages/upload/upload.js
const util = require('../../utils/util.js')
const request = require('../../utils/request.js')
const app = getApp()

Page({
  data: {
    fileInfo: {},
    filePath: '',
    showProgress: false,
    progress: 0,
    isParsing: false
  },

  onLoad(options) {

  },

  // 选择文件
  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: (res) => {
        const file = res.tempFiles[0]
        console.log('选择的文件:', file)
        
        // 检查文件大小
        if (file.size > 10 * 1024 * 1024) {
          util.showToast('文件大小不能超过10MB')
          return
        }
        
        this.setData({
          fileInfo: {
            name: file.name,
            size: util.formatFileSize(file.size)
          },
          filePath: file.path
        })
      },
      fail: (err) => {
        console.log('选择文件失败:', err)
        util.showToast('选择文件失败')
      }
    })
  },

  // 开始解析
  startParse() {
    if (!this.data.filePath) {
      util.showToast('请先选择文件')
      return
    }

    this.setData({
      showProgress: true,
      isParsing: true,
      progress: 0
    })

    // 模拟解析进度
    const timer = setInterval(() => {
      const newProgress = Math.min(this.data.progress + 10, 90)
      this.setData({ progress: newProgress })
      
      if (newProgress >= 90) {
        clearInterval(timer)
      }
    }, 200)

    // 模拟解析成功，使用示例数据
    setTimeout(() => {
      clearInterval(timer)
      this.setData({ progress: 100 })
      
      // 生成示例数据
      const mockData = {
        personalInfo: {
          name: '张三',
          idCard: '350100xxxxxxxx0000',
          gender: '男'
        },
        paymentDetails: request.generateDemoData(),
        summary: {
          totalMonths: 120,
          avgPaymentBase: 5850,
          startDate: '2015-01',
          endDate: '2024-12',
          hasGap: false
        }
      }

      // 保存到全局
      app.globalData.paymentDetails = mockData.paymentDetails
      app.globalData.personalInfo = mockData.personalInfo
      app.globalData.paymentSummary = mockData.summary

      setTimeout(() => {
        this.setData({ showProgress: false, isParsing: false })
        util.showToast('解析成功', 'success')
        
        // 跳转到明细页
        wx.navigateTo({
          url: '/pages/detail/detail'
        })
      }, 500)
    }, 2000)
  },

  // 使用示例数据
  useDemoData() {
    util.showLoading('加载示例数据中...')
    
    setTimeout(() => {
      const mockData = {
        personalInfo: {
          name: '张三',
          idCard: '350100xxxxxxxx0000',
          gender: '男'
        },
        paymentDetails: request.generateDemoData(),
        summary: {
          totalMonths: 120,
          avgPaymentBase: 5850,
          startDate: '2015-01',
          endDate: '2024-12',
          hasGap: false
        }
      }

      // 保存到全局
      app.globalData.paymentDetails = mockData.paymentDetails
      app.globalData.personalInfo = mockData.personalInfo
      app.globalData.paymentSummary = mockData.summary

      util.hideLoading()
      util.showToast('加载成功', 'success')
      
      // 跳转到明细页
      wx.navigateTo({
        url: '/pages/detail/detail'
      })
    }, 1000)
  }
})
