// util.js

// 格式化时间
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// 格式化金额
const formatCurrency = amount => {
  if (!amount && amount !== 0) return '-'
  return '¥' + Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 格式化数字
const formatNumber2 = num => {
  if (!num && num !== 0) return '-'
  return Number(num).toLocaleString('zh-CN')
}

// 脱敏身份证号
const maskIdCard = idCard => {
  if (!idCard) return ''
  if (idCard.length < 8) return idCard
  return idCard.substring(0, 3) + '***********' + idCard.substring(idCard.length - 4)
}

// 脱敏手机号
const maskPhone = phone => {
  if (!phone) return ''
  if (phone.length < 7) return phone
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4)
}

// 格式化文件大小
const formatFileSize = bytes => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 计算平均缴费基数
const calculateAvgBase = paymentDetails => {
  if (!paymentDetails || paymentDetails.length === 0) return 0
  const total = paymentDetails.reduce((sum, item) => sum + (item.paymentBase || 0), 0)
  return Math.round(total / paymentDetails.length)
}

// 计算平均缴费指数
const calculateAvgIndex = (paymentDetails, socialAvgWage = 7500) => {
  if (!paymentDetails || paymentDetails.length === 0) return 0
  const totalIndex = paymentDetails.reduce((sum, item) => {
    return sum + ((item.paymentBase || 0) / socialAvgWage)
  }, 0)
  return (totalIndex / paymentDetails.length).toFixed(4)
}

// 获取计发月数
const getCalculateMonths = age => {
  const monthMap = {
    40: 233, 41: 230, 42: 226, 43: 223, 44: 220,
    45: 216, 46: 212, 47: 208, 48: 204, 49: 199,
    50: 195, 51: 190, 52: 185, 53: 180, 54: 175,
    55: 170, 56: 164, 57: 158, 58: 152, 59: 145,
    60: 139, 61: 132, 62: 125, 63: 117, 64: 109,
    65: 101, 66: 93,  67: 84,  68: 75,  69: 65,
    70: 56
  }
  return monthMap[age] || 139
}

// 防抖
const debounce = (fn, delay = 300) => {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 节流
const throttle = (fn, delay = 300) => {
  let lastTime = 0
  return function(...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

// 显示Toast
const showToast = (title, icon = 'none', duration = 2000) => {
  wx.showToast({
    title,
    icon,
    duration
  })
}

// 显示加载
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title,
    mask: true
  })
}

// 隐藏加载
const hideLoading = () => {
  wx.hideLoading()
}

module.exports = {
  formatTime,
  formatCurrency,
  formatNumber: formatNumber2,
  maskIdCard,
  maskPhone,
  formatFileSize,
  calculateAvgBase,
  calculateAvgIndex,
  getCalculateMonths,
  debounce,
  throttle,
  showToast,
  showLoading,
  hideLoading
}
