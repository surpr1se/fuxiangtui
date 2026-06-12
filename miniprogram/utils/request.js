const util = require('./util.js')
const config = { baseUrl: 'http://14.103.38.180:8080/api/v1', timeout: 20000, useMock: false }
const isSuccess = r => r && (r.code === 0 || r.code === 200)
async function request(url, options = {}) {
  const { method = 'GET', data = {}, header = {} } = options
  if (config.useMock) return mock(url, method, data)
  const token = wx.getStorageSync('token')
  return new Promise(resolve => {
    wx.request({ url: config.baseUrl + url, method, data, timeout: config.timeout, header: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...header }, success: res => resolve(res.data || {}), fail: err => resolve({ code: -1, message: err.errMsg || '网络请求失败', data: null }) })
  })
}
function get(url, data = {}) { return request(url, { method: 'GET', data }) }
function post(url, data = {}) { return request(url, { method: 'POST', data }) }
async function uploadPdf(filePath, onProgress) {
  if (config.useMock) return mock('/pdf/upload', 'POST', {})
  const token = wx.getStorageSync('token')
  return new Promise(resolve => {
    const task = wx.uploadFile({ url: config.baseUrl + '/pdf/upload', filePath, name: 'file', header: token ? { Authorization: `Bearer ${token}` } : {}, success: res => { try { resolve(JSON.parse(res.data)) } catch(e) { resolve({ code: -1, message: '上传响应解析失败', data: res.data }) } }, fail: err => resolve({ code: -1, message: err.errMsg || '上传失败', data: null }) })
    if (task && task.onProgressUpdate && onProgress) task.onProgressUpdate(res => onProgress(res.progress || 0))
  })
}
async function getPaymentDetailList(userId) { const r = await get('/payment/list', userId ? { userId } : {}); if (isSuccess(r)) r.data = util.normalizePaymentDetails(Array.isArray(r.data) ? r.data : (r.data?.list || r.data?.records || [])); return r }
async function calculatePension(params) { const r = await post('/pension/calculate', { batchNo: 'BATCH_' + Date.now(), paymentDetails: params.paymentDetails || [], personalInfo: params.personalInfo || {}, retirementIdentity: params.retirementIdentity || '工人', retirementAge: params.retirementAge || 60, retirementYear: params.retirementYear || new Date().getFullYear() + 1, visualPaymentYears: params.visualPaymentYears || params.visualYears || 0, personalAccountAmount: params.personalAccountAmount || 0, socialAvgWage: params.socialAvgWage || undefined }); if (isSuccess(r) && r.data) r.data = util.normalizeResult(r.data, params); return r }
function saveResult(payload) { return post('/calculate-result/save', payload) }
function getHistoryList(params = {}) { return get('/calculate-result/history', { page: params.page || 1, pageSize: params.pageSize || 20, ...(params.userId ? { userId: params.userId } : {}), ...(params.openid ? { openid: params.openid } : {}) }) }
function getResult(id) { return get(`/calculate-result/${id}`) }
function importPaymentDetails(details) { return post('/payment/import', details) }
function calculateDelayRetire(birthDate, personType) { return get('/retire-age/calculate', { birthDate, personType }) }
function getPreviousYearSocialWage(baseYear = new Date().getFullYear(), province = '福建省') { return get('/system-param/social-wage/latest-previous-year', { baseYear, province }) }
function getPdfList(userId) { return get('/pdf/list', userId ? { userId } : {}) }
function normalizeUploadData(raw = {}) { const d = raw.data || raw || {}; const details = util.normalizePaymentDetails(d.paymentDetails || d.details || d.list || []); return { ...d, personalInfo: util.normalizePersonalInfo(d.personalInfo || d.userInfo || {}), paymentDetails: details, summary: d.summary || util.paymentSummary(details), id: d.id || d.pdfId || d.parseId || null } }
async function mock(url, method, data) { await new Promise(r=>setTimeout(r,200)); if(url.includes('/pdf/upload')) { const p=util.demoPayments(); return { code:200, data:{ personalInfo:{name:'余雪琴',idCard:'350425197510140726',gender:'女'}, paymentDetails:p, summary:util.paymentSummary(p) } } } return { code:200, data:null } }
module.exports = { config, isSuccess, request, get, post, uploadPdf, getPaymentDetailList, calculatePension, saveResult, getHistoryList, getResult, importPaymentDetails, calculateDelayRetire, getPreviousYearSocialWage, getPdfList, normalizeUploadData }
