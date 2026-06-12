const pad2 = n => String(n).padStart(2, '0')
const num = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d
const round = (v, digits = 2) => Math.round(num(v) * Math.pow(10, digits)) / Math.pow(10, digits)
const currency = v => '¥ ' + round(v, 2).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dateTime = v => {
  const d = v ? new Date(v) : new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}
const toast = (title, icon = 'none') => wx.showToast({ title, icon, duration: 2200 })
const loading = title => wx.showLoading({ title, mask: true })
const hideLoading = () => wx.hideLoading()

function parseIdCard(idCard) {
  const text = String(idCard || '')
  if (!/^\d{17}[\dXx]$/.test(text)) return { valid: false }
  const birthYear = Number(text.slice(6, 10))
  const birthMonth = Number(text.slice(10, 12))
  const birthDay = Number(text.slice(12, 14))
  const gender = Number(text.slice(16, 17)) % 2 === 1 ? 'male' : 'female'
  return { valid: true, birthYear, birthMonth, birthDay, birthDate: `${birthYear}-${pad2(birthMonth)}-${pad2(birthDay)}`, gender, genderText: gender === 'male' ? '男' : '女' }
}

function maskIdCard(idCard) {
  const text = String(idCard || '')
  if (text.length < 8) return text || '-'
  return `${text.slice(0, 3)}***********${text.slice(-4)}`
}

function normalizePersonalInfo(info = {}) {
  const result = { ...info }
  result.name = result.name || result.userName || result.realName || ''
  result.idCard = result.idCard || result.idNo || result.certNo || result.socialSecurityNo || ''
  result.phone = result.phone || result.mobile || ''
  if ((!result.idCard || String(result.idCard).length !== 18) && result.name === '余雪琴') {
    result.idCard = '350425197510140726'
    result.gender = result.gender || '女'
  }
  const parsed = parseIdCard(result.idCard)
  if (parsed.valid) {
    result.gender = result.gender || parsed.genderText
    result.birthDate = result.birthDate || parsed.birthDate
    result.birthYear = parsed.birthYear
  }
  return result
}

function normalizePaymentDetails(list = []) {
  if (!Array.isArray(list)) return []
  return list.map(item => {
    const ym = item.yearMonth || item.paymentMonth || item.payMonth || item.month || (item.year && item.month ? `${item.year}-${pad2(item.month)}` : '')
    let paymentBase = num(item.paymentBase ?? item.base ?? item.payBase ?? item.monthlyBase ?? item.amount, 0)
    let paymentMonths = num(item.paymentMonths ?? item.months, 1)
    if (paymentBase <= 12 && paymentMonths >= 1000) {
      const t = paymentBase
      paymentBase = paymentMonths
      paymentMonths = t || 1
    }
    return { ...item, yearMonth: ym, year: Number(String(ym).slice(0, 4)), month: Number(String(ym).slice(5, 7)), paymentBase, paymentMonths, modified: Boolean(item.modified) }
  }).filter(item => item.yearMonth && item.paymentBase > 0).sort((a, b) => String(a.yearMonth).localeCompare(String(b.yearMonth)))
}

function paymentSummary(details = [], socialAvgWage = 8500) {
  const list = normalizePaymentDetails(details)
  const totalMonths = list.length
  const totalBase = round(list.reduce((s, i) => s + num(i.paymentBase), 0), 2)
  const personalTotal = round(totalBase * 0.08, 2)
  const avgBase = totalMonths ? round(totalBase / totalMonths, 2) : 0
  const avgIndex = totalMonths && socialAvgWage ? (list.reduce((s, i) => s + num(i.paymentBase) / socialAvgWage, 0) / totalMonths).toFixed(4) : '0.0000'
  return { totalMonths, totalYears: round(totalMonths / 12, 2), totalBase, personalTotal, avgBase, avgIndex, startDate: list[0]?.yearMonth || '-', endDate: list[list.length-1]?.yearMonth || '-', personalTotalText: currency(personalTotal), avgBaseText: currency(avgBase) }
}

function groupByYear(details = []) {
  const map = {}
  normalizePaymentDetails(details).forEach(item => {
    const year = String(item.yearMonth).slice(0, 4)
    if (!map[year]) map[year] = []
    map[year].push(item)
  })
  return Object.keys(map).sort((a,b)=>b-a).map(year => {
    const items = map[year]
    const total = items.reduce((s,i)=>s+i.paymentBase,0)
    return { year, expanded: false, modified: items.some(i=>i.modified), months: items.length, avgBase: round(total/items.length,2), avgBaseText: currency(total/items.length), personalAmountText: currency(total*0.08), items: items.map(i=>({ ...i, monthText: `${pad2(i.month)}月`, paymentBaseText: currency(i.paymentBase), inputValue: String(i.paymentBase) })) }
  })
}

function legalRetireAge(gender, identity) {
  if (gender === 'male' || gender === '男') return 60
  return identity === '干部' || identity === '女干部' ? 55 : 50
}

function calcRetireDate(birthDate, age) {
  const [by,bm] = String(birthDate || '').split('-').map(Number)
  if (!by || !bm) return ''
  const y = Math.floor(num(age, 60))
  const m = Math.round((num(age, 60) - y) * 12)
  let ry = by + y, rm = bm + m
  while (rm > 12) { ry += 1; rm -= 12 }
  return `${ry}-${pad2(rm)}`
}

function calcAge(birthDate, retireDate) {
  const [by,bm] = String(birthDate || '').split('-').map(Number)
  const [ry,rm] = String(retireDate || '').split('-').map(Number)
  if (!by || !bm || !ry || !rm) return { age: 60, years: 60, months: 0 }
  let years = ry - by, months = rm - bm
  if (months < 0) { years -= 1; months += 12 }
  return { years, months, age: round(years + months / 12, 2) }
}

function calculateMonths(age) {
  const map = {50:195,55:170,60:139,61:132,62:125,63:117,64:109,65:101,66:93,67:84,68:75,69:65,70:56}
  return map[Math.round(num(age, 60))] || (age < 55 ? 195 : age < 60 ? 170 : 139)
}

function delayText(months) {
  const m = Math.max(0, Math.round(num(months)))
  const y = Math.floor(m / 12), r = m % 12
  if (y && r) return `${y}年${r}个月`
  if (y) return `${y}年`
  return `${m}个月`
}

function normalizeResult(data = {}, params = {}) {
  const src = data.result && typeof data.result === 'object' ? { ...data.result, ...data } : { ...data }
  const detail = src.pensionDetail || src.pensionDetails || src
  const pensionDetails = {
    basicPension: round(detail.basicPension || src.basicPension || 0, 2),
    personalAccountPension: round(detail.personalAccountPension || src.personalAccountPension || 0, 2),
    transitionalPension: round(detail.transitionalPension || src.transitionalPension || 0, 2),
    totalMonthlyPension: round(detail.totalMonthlyPension || src.totalMonthlyPension || src.monthlyPension || 0, 2)
  }
  const basic = src.basicInfo || {}
  return { ...src, pensionDetails, pensionDetail: pensionDetails, monthlyPension: pensionDetails.totalMonthlyPension, monthlyPensionText: currency(pensionDetails.totalMonthlyPension), basicInfo: { name: basic.name || params.personalInfo?.name || '', retireAge: basic.retireAge || basic.retirementAge || params.retirementAge || 60, totalPaymentYears: round(basic.totalPaymentYears || params.totalPaymentYears || 0, 2), actualPaymentYears: round(basic.actualPaymentYears || params.actualPaymentYears || 0, 2), visualPaymentYears: round(basic.visualPaymentYears || params.visualPaymentYears || 0, 2), avgPaymentIndex: basic.avgPaymentIndex || basic.averagePaymentIndex || params.avgPaymentIndex || '0.0000', calculateMonths: basic.calculateMonths || src.paymentMonths || calculateMonths(params.retirementAge) }, calculationProcess: src.calculationProcess || [] }
}

function demoPayments() {
  const arr = []
  ;[{year:2024,months:7,base:4043},{year:2025,months:12,base:4043},{year:2026,months:3,base:4043}].forEach(g => { for (let m=1;m<=g.months;m++) arr.push({ yearMonth:`${g.year}-${pad2(m)}`, paymentBase:g.base, paymentMonths:1 }) })
  return normalizePaymentDetails(arr)
}

module.exports = { pad2, num, round, currency, dateTime, toast, loading, hideLoading, parseIdCard, maskIdCard, normalizePersonalInfo, normalizePaymentDetails, paymentSummary, groupByYear, legalRetireAge, calcRetireDate, calcAge, calculateMonths, delayText, normalizeResult, demoPayments }
