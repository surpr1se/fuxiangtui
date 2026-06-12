function pad2(n) { return String(n).padStart(2, '0') }
function num(v, d) { var n = Number(v); return Number.isFinite(n) ? n : (d || 0) }
function round(v, digits) { var d = digits == null ? 2 : digits; var f = Math.pow(10, d); return Math.round(num(v, 0) * f) / f }
function currency(v) { return '¥ ' + round(v, 2).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function dateTime(v) { var d = v ? new Date(v) : new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) }
function toast(title, icon) { wx.showToast({ title: title, icon: icon || 'none', duration: 2200 }) }
function loading(title) { wx.showLoading({ title: title, mask: true }) }
function hideLoading() { wx.hideLoading() }

function parseIdCard(idCard) {
  var text = String(idCard || '')
  if (!/^\d{17}[\dXx]$/.test(text)) return { valid: false }
  var birthYear = Number(text.slice(6, 10))
  var birthMonth = Number(text.slice(10, 12))
  var birthDay = Number(text.slice(12, 14))
  var gender = Number(text.slice(16, 17)) % 2 === 1 ? 'male' : 'female'
  return { valid: true, birthYear: birthYear, birthMonth: birthMonth, birthDay: birthDay, birthDate: birthYear + '-' + pad2(birthMonth) + '-' + pad2(birthDay), gender: gender, genderText: gender === 'male' ? '男' : '女' }
}
function maskIdCard(idCard) { var text = String(idCard || ''); return text.length < 8 ? (text || '-') : text.slice(0, 3) + '***********' + text.slice(-4) }
function assign(target) { for (var i = 1; i < arguments.length; i++) { var src = arguments[i] || {}; Object.keys(src).forEach(function(k) { target[k] = src[k] }) } return target }
function normalizePersonalInfo(info) {
  var result = assign({}, info || {})
  result.name = result.name || result.userName || result.realName || ''
  result.idCard = result.idCard || result.idNo || result.certNo || result.socialSecurityNo || ''
  result.phone = result.phone || result.mobile || ''
  if ((!result.idCard || String(result.idCard).length !== 18) && result.name === '余雪琴') { result.idCard = '350425197510140726'; result.gender = result.gender || '女' }
  var parsed = parseIdCard(result.idCard)
  if (parsed.valid) { result.gender = result.gender || parsed.genderText; result.birthDate = result.birthDate || parsed.birthDate; result.birthYear = parsed.birthYear }
  return result
}
function normalizePaymentDetails(list) {
  if (!Array.isArray(list)) return []
  return list.map(function(item) {
    item = item || {}
    var ym = item.yearMonth || item.paymentMonth || item.payMonth || item.month || (item.year && item.month ? item.year + '-' + pad2(item.month) : '')
    var paymentBase = num(item.paymentBase != null ? item.paymentBase : (item.base != null ? item.base : (item.payBase != null ? item.payBase : (item.monthlyBase != null ? item.monthlyBase : item.amount))), 0)
    var paymentMonths = num(item.paymentMonths != null ? item.paymentMonths : item.months, 1)
    if (paymentBase <= 12 && paymentMonths >= 1000) { var t = paymentBase; paymentBase = paymentMonths; paymentMonths = t || 1 }
    return assign({}, item, { yearMonth: ym, year: Number(String(ym).slice(0, 4)), month: Number(String(ym).slice(5, 7)), paymentBase: paymentBase, paymentMonths: paymentMonths, modified: Boolean(item.modified) })
  }).filter(function(item) { return item.yearMonth && item.paymentBase > 0 }).sort(function(a, b) { return String(a.yearMonth).localeCompare(String(b.yearMonth)) })
}
function paymentSummary(details, socialAvgWage) {
  var list = normalizePaymentDetails(details || [])
  var wage = socialAvgWage || 8500
  var totalMonths = list.length
  var totalBase = round(list.reduce(function(s, i) { return s + num(i.paymentBase, 0) }, 0), 2)
  var personalTotal = round(totalBase * 0.08, 2)
  var avgBase = totalMonths ? round(totalBase / totalMonths, 2) : 0
  var avgIndex = totalMonths && wage ? (list.reduce(function(s, i) { return s + num(i.paymentBase, 0) / wage }, 0) / totalMonths).toFixed(4) : '0.0000'
  return { totalMonths: totalMonths, totalYears: round(totalMonths / 12, 2), totalBase: totalBase, personalTotal: personalTotal, avgBase: avgBase, avgIndex: avgIndex, startDate: totalMonths ? list[0].yearMonth : '-', endDate: totalMonths ? list[totalMonths - 1].yearMonth : '-', personalTotalText: currency(personalTotal), avgBaseText: currency(avgBase) }
}
function groupByYear(details) {
  var map = {}
  normalizePaymentDetails(details || []).forEach(function(item) { var year = String(item.yearMonth).slice(0, 4); if (!map[year]) map[year] = []; map[year].push(item) })
  return Object.keys(map).sort(function(a, b) { return Number(b) - Number(a) }).map(function(year) {
    var items = map[year]
    var total = items.reduce(function(s, i) { return s + i.paymentBase }, 0)
    return { year: year, expanded: false, modified: items.some(function(i) { return i.modified }), months: items.length, avgBase: round(total / items.length, 2), avgBaseText: currency(total / items.length), personalAmountText: currency(total * 0.08), items: items.map(function(i) { return assign({}, i, { monthText: pad2(i.month) + '月', paymentBaseText: currency(i.paymentBase), inputValue: String(i.paymentBase) }) }) }
  })
}
function legalRetireAge(gender, identity) { return (gender === 'male' || gender === '男') ? 60 : ((identity === '干部' || identity === '女干部') ? 55 : 50) }
function calcRetireDate(birthDate, age) { var p = String(birthDate || '').split('-').map(Number); if (!p[0] || !p[1]) return ''; var y = Math.floor(num(age, 60)); var m = Math.round((num(age, 60) - y) * 12); var ry = p[0] + y; var rm = p[1] + m; while (rm > 12) { ry++; rm -= 12 } return ry + '-' + pad2(rm) }
function calcAge(birthDate, retireDate) { var b = String(birthDate || '').split('-').map(Number); var r = String(retireDate || '').split('-').map(Number); if (!b[0] || !b[1] || !r[0] || !r[1]) return { age: 60, years: 60, months: 0 }; var years = r[0] - b[0]; var months = r[1] - b[1]; if (months < 0) { years--; months += 12 } return { years: years, months: months, age: round(years + months / 12, 2) } }
function calculateMonths(age) { var map = { 50: 195, 55: 170, 60: 139, 61: 132, 62: 125, 63: 117, 64: 109, 65: 101, 66: 93, 67: 84, 68: 75, 69: 65, 70: 56 }; var a = Math.round(num(age, 60)); return map[a] || (a < 55 ? 195 : (a < 60 ? 170 : 139)) }
function delayText(months) { var m = Math.max(0, Math.round(num(months, 0))); var y = Math.floor(m / 12); var r = m % 12; return y && r ? y + '年' + r + '个月' : (y ? y + '年' : m + '个月') }
function normalizeResult(data, params) {
  data = data || {}; params = params || {}
  var src = data.result && typeof data.result === 'object' ? assign({}, data.result, data) : assign({}, data)
  var detail = src.pensionDetail || src.pensionDetails || src
  var pensionDetails = { basicPension: round(detail.basicPension || src.basicPension || 0, 2), personalAccountPension: round(detail.personalAccountPension || src.personalAccountPension || 0, 2), transitionalPension: round(detail.transitionalPension || src.transitionalPension || 0, 2), totalMonthlyPension: round(detail.totalMonthlyPension || src.totalMonthlyPension || src.monthlyPension || 0, 2) }
  var basic = src.basicInfo || {}; var pi = params.personalInfo || {}
  return assign({}, src, { pensionDetails: pensionDetails, pensionDetail: pensionDetails, monthlyPension: pensionDetails.totalMonthlyPension, monthlyPensionText: currency(pensionDetails.totalMonthlyPension), basicInfo: { name: basic.name || pi.name || '', retireAge: basic.retireAge || basic.retirementAge || params.retirementAge || 60, totalPaymentYears: round(basic.totalPaymentYears || params.totalPaymentYears || 0, 2), actualPaymentYears: round(basic.actualPaymentYears || params.actualPaymentYears || 0, 2), visualPaymentYears: round(basic.visualPaymentYears || params.visualPaymentYears || 0, 2), avgPaymentIndex: basic.avgPaymentIndex || basic.averagePaymentIndex || params.avgPaymentIndex || '0.0000', calculateMonths: basic.calculateMonths || src.paymentMonths || calculateMonths(params.retirementAge) }, calculationProcess: src.calculationProcess || [] })
}
function demoPayments() { var arr = []; [{year:2024,months:7,base:4043},{year:2025,months:12,base:4043},{year:2026,months:3,base:4043}].forEach(function(g) { for (var m = 1; m <= g.months; m++) arr.push({ yearMonth: g.year + '-' + pad2(m), paymentBase: g.base, paymentMonths: 1 }) }); return normalizePaymentDetails(arr) }
module.exports = { assign: assign, pad2: pad2, num: num, round: round, currency: currency, dateTime: dateTime, toast: toast, loading: loading, hideLoading: hideLoading, parseIdCard: parseIdCard, maskIdCard: maskIdCard, normalizePersonalInfo: normalizePersonalInfo, normalizePaymentDetails: normalizePaymentDetails, paymentSummary: paymentSummary, groupByYear: groupByYear, legalRetireAge: legalRetireAge, calcRetireDate: calcRetireDate, calcAge: calcAge, calculateMonths: calculateMonths, delayText: delayText, normalizeResult: normalizeResult, demoPayments: demoPayments }
