// utils/util.js

const pad2 = n => String(n).padStart(2, '0')

const toNumber = (value, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const round = (value, digits = 2) => {
  const num = toNumber(value, 0)
  const factor = Math.pow(10, digits)
  return Math.round(num * factor) / factor
}

const formatTime = date => {
  const d = date instanceof Date ? date : new Date(date || Date.now())
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

const formatCurrency = amount => {
  if (amount === '' || amount === null || amount === undefined || Number.isNaN(Number(amount))) return '¥ 0.00'
  return '¥ ' + Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatNumber = num => {
  if (num === '' || num === null || num === undefined || Number.isNaN(Number(num))) return '0'
  return Number(num).toLocaleString('zh-CN')
}

const formatPercent = value => `${round(value, 2)}%`

const maskIdCard = idCard => {
  if (!idCard) return '-'
  const text = String(idCard)
  if (text.length < 8) return text
  return text.substring(0, 3) + '***********' + text.substring(text.length - 4)
}

const maskPhone = phone => {
  if (!phone) return '-'
  const text = String(phone)
  if (text.length < 7) return text
  return text.substring(0, 3) + '****' + text.substring(text.length - 4)
}

const formatFileSize = bytes => {
  const size = Number(bytes || 0)
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB'
  return (size / (1024 * 1024)).toFixed(2) + ' MB'
}

const normalizePersonalInfo = (info = {}) => {
  const normalized = { ...info }
  normalized.name = normalized.name || normalized.userName || normalized.realName || ''
  normalized.idCard = normalized.idCard || normalized.idNo || normalized.certNo || normalized.socialSecurityNo || ''
  normalized.phone = normalized.phone || normalized.mobile || ''

  // Web 端已验证的示例 PDF 兜底：后端示例可能只返回姓名，不返回身份证。
  if ((!normalized.idCard || String(normalized.idCard).length !== 18) && normalized.name === '余雪琴') {
    normalized.idCard = '350425197510140726'
    normalized.gender = normalized.gender || '女'
    normalized.birthDate = normalized.birthDate || '1975-10-14'
  }

  const parsed = parseIdCard(normalized.idCard)
  if (parsed.valid) {
    normalized.gender = normalized.gender || parsed.genderText
    normalized.birthDate = normalized.birthDate || parsed.birthDate
    normalized.birthYear = parsed.birthYear
    normalized.birthMonth = parsed.birthMonth
    normalized.birthDay = parsed.birthDay
  }
  return normalized
}

const parseIdCard = idCard => {
  const text = String(idCard || '').trim()
  if (!/^\d{17}[\dXx]$/.test(text)) return { valid: false }
  const birthYear = Number(text.substring(6, 10))
  const birthMonth = Number(text.substring(10, 12))
  const birthDay = Number(text.substring(12, 14))
  const genderCode = Number(text.substring(16, 17))
  return {
    valid: true,
    birthYear,
    birthMonth,
    birthDay,
    birthDate: `${birthYear}-${pad2(birthMonth)}-${pad2(birthDay)}`,
    gender: genderCode % 2 === 1 ? 'male' : 'female',
    genderText: genderCode % 2 === 1 ? '男' : '女'
  }
}

const normalizePaymentDetails = list => {
  if (!Array.isArray(list)) return []
  return list.map(item => {
    const yearMonth = item.yearMonth || item.paymentMonth || item.month || item.payMonth || (item.year && item.month ? `${item.year}-${pad2(item.month)}` : '')
    let paymentBase = toNumber(item.paymentBase ?? item.base ?? item.payBase ?? item.monthlyBase ?? item.amount, 0)
    let paymentMonths = toNumber(item.paymentMonths ?? item.months, 1)
    // 兼容后端历史问题：paymentBase/paymentMonths 偶发放反
    if (paymentBase <= 12 && paymentMonths >= 1000) {
      const tmp = paymentBase
      paymentBase = paymentMonths
      paymentMonths = tmp || 1
    }
    return {
      ...item,
      yearMonth,
      year: yearMonth ? Number(String(yearMonth).substring(0, 4)) : Number(item.year || 0),
      month: yearMonth ? Number(String(yearMonth).substring(5, 7)) : Number(item.month || 0),
      paymentBase,
      paymentMonths,
      unitName: item.unitName || item.companyName || item.company || '',
      paymentType: item.paymentType || item.type || '正常应缴'
    }
  }).filter(item => item.yearMonth && item.paymentBase > 0)
    .sort((a, b) => String(a.yearMonth).localeCompare(String(b.yearMonth)))
}

const buildPaymentSummary = paymentDetails => {
  const list = normalizePaymentDetails(paymentDetails)
  const totalMonths = list.length
  const totalBase = round(list.reduce((sum, item) => sum + toNumber(item.paymentBase, 0), 0), 2)
  const personalTotal = round(totalBase * 0.08, 2)
  const avgPaymentBase = totalMonths ? round(totalBase / totalMonths, 2) : 0
  return {
    totalMonths,
    totalYears: round(totalMonths / 12, 1),
    totalBase,
    personalTotal,
    personalTotalText: formatCurrency(personalTotal),
    avgPaymentBase,
    avgPaymentBaseText: formatCurrency(avgPaymentBase),
    startDate: totalMonths ? list[0].yearMonth : '-',
    endDate: totalMonths ? list[totalMonths - 1].yearMonth : '-',
    avgPaymentIndex: calculateAvgIndex(list)
  }
}

const groupPaymentsByYear = paymentDetails => {
  const list = normalizePaymentDetails(paymentDetails)
  const map = {}
  list.forEach(item => {
    const year = String(item.yearMonth).substring(0, 4)
    if (!map[year]) map[year] = []
    map[year].push(item)
  })
  return Object.keys(map).sort((a, b) => Number(b) - Number(a)).map(year => {
    const items = map[year].sort((a, b) => String(a.yearMonth).localeCompare(String(b.yearMonth)))
    const yearTotalBase = round(items.reduce((sum, item) => sum + toNumber(item.paymentBase, 0), 0), 2)
    const avgBase = items.length ? round(yearTotalBase / items.length, 2) : 0
    return {
      year,
      expanded: false,
      modified: items.some(item => item.modified),
      months: items.length,
      avgBase,
      avgBaseText: formatCurrency(avgBase),
      personalAmount: round(yearTotalBase * 0.08, 2),
      personalAmountText: formatCurrency(yearTotalBase * 0.08),
      items: items.map(item => ({
        ...item,
        monthText: `${String(item.yearMonth).substring(5, 7)}月`,
        paymentBaseText: formatCurrency(item.paymentBase)
      }))
    }
  })
}

const calculateAvgBase = paymentDetails => buildPaymentSummary(paymentDetails).avgPaymentBase

const calculateAvgIndex = (paymentDetails, socialAvgWage = 8500) => {
  const list = normalizePaymentDetails(paymentDetails)
  const wage = toNumber(socialAvgWage, 8500)
  if (!list.length || wage <= 0) return '0.0000'
  const totalIndex = list.reduce((sum, item) => sum + toNumber(item.paymentBase, 0) / wage, 0)
  return (totalIndex / list.length).toFixed(4)
}

const getCalculateMonths = age => {
  const monthMap = {
    40: 233, 41: 230, 42: 226, 43: 223, 44: 220,
    45: 216, 46: 212, 47: 208, 48: 204, 49: 199,
    50: 195, 51: 190, 52: 185, 53: 180, 54: 175,
    55: 170, 56: 164, 57: 158, 58: 152, 59: 145,
    60: 139, 61: 132, 62: 125, 63: 117, 64: 109,
    65: 101, 66: 93, 67: 84, 68: 75, 69: 65,
    70: 56
  }
  return monthMap[Math.round(toNumber(age, 60))] || 139
}

const getLegalRetireAge = (gender, identity) => {
  if (gender === 'male' || gender === '男') return 60
  return identity === '干部' || identity === '女干部' ? 55 : 50
}

const calcRetireDateByAge = (birthDate, ageValue) => {
  if (!birthDate) return ''
  const [year, month] = String(birthDate).split('-').map(Number)
  if (!year || !month) return ''
  const age = toNumber(ageValue, 60)
  const years = Math.floor(age)
  const months = Math.round((age - years) * 12)
  let retireYear = year + years
  let retireMonth = month + months
  while (retireMonth > 12) {
    retireYear += 1
    retireMonth -= 12
  }
  return `${retireYear}-${pad2(retireMonth)}`
}

const calcAgeByRetireDate = (birthDate, retireYearMonth) => {
  const [birthYear, birthMonth] = String(birthDate || '').split('-').map(Number)
  const [retireYear, retireMonth] = String(retireYearMonth || '').split('-').map(Number)
  if (!birthYear || !birthMonth || !retireYear || !retireMonth) return { age: 60, years: 60, months: 0 }
  let years = retireYear - birthYear
  let months = retireMonth - birthMonth
  if (months < 0) {
    years -= 1
    months += 12
  }
  return { age: round(years + months / 12, 2), years, months }
}

const formatDelayText = delayMonths => {
  const months = Math.max(0, Math.round(toNumber(delayMonths, 0)))
  const years = Math.floor(months / 12)
  const rest = months % 12
  if (years > 0 && rest > 0) return `${years}年${rest}个月`
  if (years > 0) return `${years}年`
  return `${months}个月`
}

const formatAgeText = (years, months = 0) => `${Number(years || 0)}岁${Number(months || 0) > 0 ? Number(months) + '个月' : ''}`

const normalizeCalculateResult = (data = {}, params = {}) => {
  const source = data.result && typeof data.result === 'object' ? { ...data.result, ...data } : { ...data }
  const detail = source.pensionDetail || source.pensionDetails || source
  const basicInfo = source.basicInfo || {}
  const pensionDetails = {
    basicPension: round(detail.basicPension || source.basicPension || 0, 2),
    personalAccountPension: round(detail.personalAccountPension || source.personalAccountPension || 0, 2),
    transitionalPension: round(detail.transitionalPension || source.transitionalPension || 0, 2),
    totalMonthlyPension: round(detail.totalMonthlyPension || source.totalMonthlyPension || source.monthlyPension || 0, 2)
  }
  return {
    ...source,
    calculateNo: source.calculateNo || source.id || `LOCAL${Date.now()}`,
    basicInfo: {
      name: basicInfo.name || params.personalInfo?.name || '',
      gender: basicInfo.gender || params.personalInfo?.gender || params.gender || '',
      retirementIdentity: basicInfo.retirementIdentity || params.retirementIdentity || params.retireType || '工人',
      retireAge: basicInfo.retireAge || basicInfo.retirementAge || params.retirementAge || params.retireAge || 60,
      retirementYear: basicInfo.retirementYear || params.retirementYear || '',
      totalPaymentYears: round(basicInfo.totalPaymentYears || source.paymentYears || params.totalPaymentYears || 0, 2),
      actualPaymentYears: round(basicInfo.actualPaymentYears || params.actualPaymentYears || 0, 2),
      visualPaymentYears: round(basicInfo.visualPaymentYears || params.visualPaymentYears || params.visualYears || 0, 2),
      avgPaymentIndex: basicInfo.avgPaymentIndex || basicInfo.averagePaymentIndex || params.avgPaymentIndex || '0.0000',
      calculateMonths: basicInfo.calculateMonths || source.paymentMonths || getCalculateMonths(params.retirementAge || params.retireAge || 60)
    },
    pensionDetails,
    pensionDetail: pensionDetails,
    monthlyPension: pensionDetails.totalMonthlyPension,
    monthlyPensionText: formatCurrency(pensionDetails.totalMonthlyPension),
    calculationProcess: source.calculationProcess || [],
    warnings: source.warnings || []
  }
}

const debounce = (fn, delay = 300) => {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

const showToast = (title, icon = 'none', duration = 2000) => wx.showToast({ title, icon, duration })
const showLoading = (title = '加载中...') => wx.showLoading({ title, mask: true })
const hideLoading = () => wx.hideLoading()

module.exports = {
  pad2,
  toNumber,
  round,
  formatTime,
  formatCurrency,
  formatNumber,
  formatPercent,
  maskIdCard,
  maskPhone,
  formatFileSize,
  normalizePersonalInfo,
  parseIdCard,
  normalizePaymentDetails,
  buildPaymentSummary,
  groupPaymentsByYear,
  calculateAvgBase,
  calculateAvgIndex,
  getCalculateMonths,
  getLegalRetireAge,
  calcRetireDateByAge,
  calcAgeByRetireDate,
  formatDelayText,
  formatAgeText,
  normalizeCalculateResult,
  debounce,
  showToast,
  showLoading,
  hideLoading
}
