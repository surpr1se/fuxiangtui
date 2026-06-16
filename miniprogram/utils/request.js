var util = require('./util.js')
var config = { baseUrl: 'http://14.103.38.180:8080/api/v1', timeout: 20000, useMock: false }
function isSuccess(r) { return r && (r.code === 0 || r.code === 200) }
function request(url, options) {
  options = options || {}
  var method = options.method || 'GET'
  var data = options.data || {}
  var header = options.header || {}
  if (config.useMock) return mock(url, method, data)
  var token = currentToken()
  var headers = util.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}, header)
  return new Promise(function(resolve) { wx.request({ url: config.baseUrl + url, method: method, data: data, timeout: config.timeout, header: headers, success: function(res) { resolve(res.data || {}) }, fail: function(err) { resolve({ code: -1, message: err.errMsg || '网络请求失败', data: null }) } }) })
}
function get(url, data) { return request(url, { method: 'GET', data: data || {} }) }
function post(url, data) { return request(url, { method: 'POST', data: data || {} }) }
function put(url, data) { return request(url, { method: 'PUT', data: data || {} }) }
function uploadPdf(filePath, onProgress) {
  if (config.useMock) return mock('/pdf/upload', 'POST', {})
  var token = currentToken()
  return new Promise(function(resolve) {
    var task = wx.uploadFile({ url: config.baseUrl + '/pdf/upload', filePath: filePath, name: 'file', header: token ? { Authorization: 'Bearer ' + token } : {}, success: function(res) { try { resolve(JSON.parse(res.data)) } catch (e) { resolve({ code: -1, message: '上传响应解析失败', data: res.data }) } }, fail: function(err) { resolve({ code: -1, message: err.errMsg || '上传失败', data: null }) } })
    if (task && task.onProgressUpdate && onProgress) task.onProgressUpdate(function(res) { onProgress(res.progress || 0) })
  })
}
function getAppSafe() {
  try {
    return typeof getApp === 'function' ? getApp() : null
  } catch (e) {
    return null
  }
}
function currentUserId() { var app = getAppSafe(); return (app && app.globalData && app.globalData.userId) || wx.getStorageSync('userId') || '' }
function currentOpenId() { var app = getAppSafe(); return (app && app.globalData && app.globalData.openid) || wx.getStorageSync('openId') || '' }
function currentToken() { var app = getAppSafe(); return (app && app.globalData && app.globalData.token) || wx.getStorageSync('token') || '' }
function withUser(params) { params = params || {}; if (!params.userId && currentUserId()) params.userId = currentUserId(); if (!params.openid && currentOpenId()) params.openid = currentOpenId(); return params }
function getPaymentDetailList(userId) { return get('/payment/list', withUser(userId ? { userId: userId } : {})).then(function(r) { if (isSuccess(r)) { var d = r.data; r.data = util.normalizePaymentDetails(Array.isArray(d) ? d : ((d && (d.list || d.records)) || [])) } return r }) }
function calculatePension(params) { params = params || {}; return post('/pension/calculate', { batchNo: 'BATCH_' + Date.now(), paymentDetails: params.paymentDetails || [], personalInfo: params.personalInfo || {}, retirementIdentity: params.retirementIdentity || '工人', retirementAge: params.retirementAge || 60, retirementYear: params.retirementYear || new Date().getFullYear() + 1, visualPaymentYears: params.visualPaymentYears || params.visualYears || 0, personalAccountAmount: params.personalAccountAmount || 0, socialAvgWage: params.socialAvgWage || undefined }).then(function(r) { if (isSuccess(r) && r.data) r.data = util.normalizeResult(r.data, params); return r }) }
function saveResult(payload) { return post('/calculate-result/save', withUser(payload || {})) }
function getHistoryList(params) { params = params || {}; var q = withUser({ page: params.page || 1, pageSize: params.pageSize || 20 }); if (params.userId) q.userId = params.userId; if (params.openid) q.openid = params.openid; return get('/calculate-result/history', q) }
function getResult(id) { return get('/calculate-result/' + id) }
function importPaymentDetails(details) { return post('/payment/import', { userId: currentUserId(), openid: currentOpenId(), details: details || [] }) }
function calculateDelayRetire(birthDate, personType) { return get('/retire-age/calculate', { birthDate: birthDate, personType: personType }) }
function getPreviousYearSocialWage(baseYear, province) { return get('/system-param/social-wage/latest-previous-year', { baseYear: baseYear || new Date().getFullYear(), province: province || '福建省' }) }
function getPdfList(userId) { return get('/pdf/list', withUser(userId ? { userId: userId } : {})) }
function normalizeUploadData(raw) { var d = (raw && raw.data) || raw || {}; var details = util.normalizePaymentDetails(d.paymentDetails || d.details || d.list || []); return util.assign({}, d, { personalInfo: util.normalizePersonalInfo(d.personalInfo || d.userInfo || {}), paymentDetails: details, summary: d.summary || util.paymentSummary(details), id: d.id || d.pdfId || d.parseId || null }) }
function mock(url) { return new Promise(function(resolve) { setTimeout(function() { if (url.indexOf('/pdf/upload') >= 0) { var p = util.demoPayments(); resolve({ code: 200, data: { personalInfo: { name: '余雪琴', idCard: '350425197510140726', gender: '女' }, paymentDetails: p, summary: util.paymentSummary(p) } }); return } resolve({ code: 200, data: null }) }, 200) }) }
module.exports = { config: config, isSuccess: isSuccess, currentUserId: currentUserId, currentOpenId: currentOpenId, currentToken: currentToken, withUser: withUser, request: request, get: get, post: post, put: put, uploadPdf: uploadPdf, getPaymentDetailList: getPaymentDetailList, calculatePension: calculatePension, saveResult: saveResult, getHistoryList: getHistoryList, getResult: getResult, importPaymentDetails: importPaymentDetails, calculateDelayRetire: calculateDelayRetire, getPreviousYearSocialWage: getPreviousYearSocialWage, getPdfList: getPdfList, normalizeUploadData: normalizeUploadData }
