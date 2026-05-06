// request.js
const app = getApp()

const baseUrl = '' // 后端API地址

// 通用请求方法
const request = (options) => {
  const { url, method = 'GET', data, header = {} } = options
  
  const token = wx.getStorageSync('token')
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: baseUrl + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const { code, message, data } = res.data
          
          if (code === 0) {
            resolve(data)
          } else if (code === 401) {
            // Token失效，重新登录
            wx.showToast({ title: '登录已过期', icon: 'none' })
            wx.removeStorageSync('token')
            setTimeout(() => {
              wx.reLaunch({ url: '/pages/index/index' })
            }, 1500)
            reject(new Error('Unauthorized'))
          } else {
            wx.showToast({ title: message || '请求失败', icon: 'none' })
            reject(new Error(message || '请求失败'))
          }
        } else {
          wx.showToast({ title: '网络错误', icon: 'none' })
          reject(new Error('Network Error'))
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络连接失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

// GET请求
const get = (url, params = {}) => {
  return request({
    url,
    method: 'GET',
    data: params
  })
}

// POST请求
const post = (url, data = {}) => {
  return request({
    url,
    method: 'POST',
    data
  })
}

// PUT请求
const put = (url, data = {}) => {
  return request({
    url,
    method: 'PUT',
    data
  })
}

// DELETE请求
const del = (url, data = {}) => {
  return request({
    url,
    method: 'DELETE',
    data
  })
}

// 文件上传
const uploadFile = (url, filePath, formData = {}) => {
  const token = wx.getStorageSync('token')
  
  return new Promise((resolve, reject) => {
    const uploadTask = wx.uploadFile({
      url: baseUrl + url,
      filePath,
      name: 'file',
      formData,
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        const data = JSON.parse(res.data)
        if (data.code === 0) {
          resolve(data.data)
        } else {
          wx.showToast({ title: data.message || '上传失败', icon: 'none' })
          reject(new Error(data.message))
        }
      },
      fail: reject
    })
    
    // 上传进度
    uploadTask.onProgressUpdate((res) => {
      console.log('上传进度:', res.progress)
    })
  })
}

// 生成模拟缴费数据
const generateDemoData = () => {
  const data = []
  const baseAmounts = [3500, 3800, 4200, 4500, 4800, 5200, 5600, 6000, 6500, 7000]
  
  for (let year = 2015; year <= 2024; year++) {
    for (let month = 1; month <= 12; month++) {
      const baseIndex = Math.min(Math.floor((year - 2015) / 2), baseAmounts.length - 1)
      const base = baseAmounts[baseIndex] + Math.floor(Math.random() * 500)
      data.push({
        yearMonth: `${year}-${String(month).padStart(2, '0')}`,
        paymentBase: base,
        paymentMonths: 1,
        unitName: `福建${year % 2 === 0 ? 'XX科技' : 'XX贸易'}有限公司`,
        paymentType: '正常应缴'
      })
    }
  }
  
  return data
}

module.exports = {
  get,
  post,
  put,
  del,
  uploadFile,
  generateDemoData
}
