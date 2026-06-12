// utils/request.js
const util = require('./util.js')

const config = {
  baseUrl: 'http://14.103.38.180:8080/api/v1',
  useMock: false,
  timeout: 20000
}

const isSuccess = body => body && (body.code === 0 || body.code === 200)

const Request = {
  config,
  isSuccess,

  async request(url, options = {}) {
    const { method = 'GET', data = {}, header = {}, showLoading = false } = options
    if (config.useMock) return this.mockRequest(url, method, data)
    if (showLoading) wx.showLoading({ title: '加载中...', mask: true })

    const token = wx.getStorageSync('token')
    const headerConfig = {
      'Content-Type': 'application/json',
      ...header
    }
    if (token) headerConfig.Authorization = `Bearer ${token}`

    try {
      const result = await new Promise((resolve, reject) => {
        wx.request({
          url: config.baseUrl + url,
          method,
          data,
          header: headerConfig,
          timeout: config.timeout,
          success: res => resolve(res.data || {}),
          fail: reject
        })
      })
      if (showLoading) wx.hideLoading()
      if (result.code === 401) {
        wx.removeStorageSync('token')
        wx.removeStorageSync('userId')
      }
      return result
    } catch (error) {
      if (showLoading) wx.hideLoading()
      console.error('请求失败:', method, url, error)
      return { code: -1, message: error.errMsg || '网络请求失败', data: null }
    }
  },

  get(url, params = {}) { return this.request(url, { method: 'GET', data: params }) },
  post(url, data = {}) { return this.request(url, { method: 'POST', data }) },
  put(url, data = {}) { return this.request(url, { method: 'PUT', data }) },
  delete(url, data = {}) { return this.request(url, { method: 'DELETE', data }) },

  async uploadPdf(filePath, onProgress) {
    if (config.useMock) {
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 120))
        if (onProgress) onProgress(i)
      }
      return this.mockRequest('/pdf/upload', 'POST', {})
    }

    const token = wx.getStorageSync('token')
    return new Promise((resolve, reject) => {
      const task = wx.uploadFile({
        url: config.baseUrl + '/pdf/upload',
        filePath,
        name: 'file',
        header: token ? { Authorization: `Bearer ${token}` } : {},
        success: res => {
          try { resolve(JSON.parse(res.data)) } catch (e) { resolve({ code: -1, message: '解析上传响应失败', data: res.data }) }
        },
        fail: reject
      })
      if (task && task.onProgressUpdate && onProgress) {
        task.onProgressUpdate(res => onProgress(res.progress || 0))
      }
    })
  },

  async getPaymentDetailList(userId) {
    const params = userId ? { userId } : {}
    const result = await this.get('/payment/list', params)
    const data = result.data || []
    const list = Array.isArray(data) ? data : (data.list || data.records || [])
    if (isSuccess(result)) result.data = util.normalizePaymentDetails(list)
    return result
  },

  async importPaymentDetails(details = []) { return this.post('/payment/import', details) },

  async calculateDelayRetire(birthDate, personType) {
    return this.get('/retire-age/calculate', { birthDate, personType })
  },

  async getPreviousYearSocialWage(baseYear, province = '福建省') {
    return this.get('/system-param/social-wage/latest-previous-year', { baseYear, province })
  },

  async calculatePension(params = {}) {
    const result = await this.post('/pension/calculate', {
      batchNo: params.batchNo || 'BATCH_' + Date.now(),
      paymentDetails: params.paymentDetails || [],
      personalInfo: params.personalInfo || {},
      retirementIdentity: params.retirementIdentity || '工人',
      retirementAge: params.retirementAge || 60,
      retirementYear: params.retirementYear || new Date().getFullYear() + 1,
      visualPaymentYears: params.visualPaymentYears ?? params.visualYears ?? 0,
      personalAccountAmount: params.personalAccountAmount || 0,
      socialAvgWage: params.socialAvgWage || undefined
    })
    if (isSuccess(result) && result.data) {
      result.data = util.normalizeCalculateResult(result.data, params)
    }
    return result
  },

  async saveResult(payload = {}) { return this.post('/calculate-result/save', payload) },

  async getHistoryList(params = {}) {
    const query = { page: params.page || 1, pageSize: params.pageSize || 20 }
    if (params.userId) query.userId = params.userId
    if (params.openid) query.openid = params.openid
    return this.get('/calculate-result/history', query)
  },

  async getResult(id) { return this.get(`/calculate-result/${id}`) },

  normalizeUploadData(raw = {}) {
    const data = raw.data || raw || {}
    const personalInfo = util.normalizePersonalInfo(data.personalInfo || data.userInfo || data.personInfo || {})
    const paymentDetails = util.normalizePaymentDetails(data.paymentDetails || data.details || data.list || [])
    return {
      ...data,
      personalInfo,
      paymentDetails,
      summary: data.summary || util.buildPaymentSummary(paymentDetails),
      id: data.id || data.pdfId || data.parseId || null
    }
  },

  generateDemoData() {
    const data = []
    ;[
      { year: 2024, months: 7, base: 4043 },
      { year: 2025, months: 12, base: 4043 },
      { year: 2026, months: 3, base: 4043 }
    ].forEach(group => {
      for (let month = 1; month <= group.months; month++) {
        data.push({
          yearMonth: `${group.year}-${util.pad2(month)}`,
          paymentBase: group.base,
          paymentMonths: 1,
          unitName: '福建示例单位',
          paymentType: '正常应缴'
        })
      }
    })
    return util.normalizePaymentDetails(data)
  },

  async mockRequest(url, method, data) {
    await new Promise(resolve => setTimeout(resolve, 300))
    if (url.includes('/user/wxlogin')) {
      const userId = Date.now()
      wx.setStorageSync('userId', userId)
      wx.setStorageSync('token', `mock_token_${userId}`)
      return { code: 200, message: 'success', data: { userId, openId: `mock_openid_${userId}`, token: `mock_token_${userId}` } }
    }
    if (url.includes('/pdf/upload')) {
      const paymentDetails = this.generateDemoData()
      return { code: 200, message: 'success', data: { personalInfo: { name: '余雪琴', idCard: '350425197510140726', gender: '女' }, paymentDetails, summary: util.buildPaymentSummary(paymentDetails) } }
    }
    if (url.includes('/retire-age/calculate')) {
      return { code: 200, message: 'success', data: { delayMonths: 18, reformRetireAgeYear: 51, reformRetireAgeMonth: 6, reformRetireDate: '2027-04-01', personTypeName: '女工人' } }
    }
    if (url.includes('/system-param/social-wage')) {
      return { code: 200, message: 'success', data: { monthlyWage: 8500, annualWage: 102000, province: '福建省' } }
    }
    if (url.includes('/pension/calculate')) {
      const paymentDetails = data.paymentDetails || []
      const summary = util.buildPaymentSummary(paymentDetails)
      const totalYears = util.round(summary.totalYears + Number(data.visualPaymentYears || 0), 2)
      const avgIndex = util.calculateAvgIndex(paymentDetails, data.socialAvgWage || 8500)
      const calculateMonths = util.getCalculateMonths(data.retirementAge || 60)
      const basicPension = util.round(((data.socialAvgWage || 8500) * (1 + Number(avgIndex)) / 2) * totalYears * 0.01, 2)
      const accountAmount = Number(data.personalAccountAmount || summary.personalTotal)
      const personalAccountPension = util.round(accountAmount / calculateMonths, 2)
      const transitionalPension = Number(data.visualPaymentYears || 0) > 0 ? util.round((data.socialAvgWage || 8500) * Number(avgIndex) * Number(data.visualPaymentYears || 0) * 0.013, 2) : 0
      return { code: 200, message: 'success', data: util.normalizeCalculateResult({
        basicInfo: { totalPaymentYears: totalYears, actualPaymentYears: summary.totalYears, visualPaymentYears: data.visualPaymentYears || 0, avgPaymentIndex: avgIndex, calculateMonths, retireAge: data.retirementAge },
        pensionDetail: { basicPension, personalAccountPension, transitionalPension, totalMonthlyPension: basicPension + personalAccountPension + transitionalPension },
        calculationProcess: [
          { stepName: '基础养老金', formula: '（社平工资 + 本人指数化工资）÷2×缴费年限×1%', result: basicPension },
          { stepName: '个人账户养老金', formula: '个人账户累计金额÷计发月数', result: personalAccountPension },
          { stepName: '过渡性养老金', formula: '指数化工资×视同缴费年限×1.3%', result: transitionalPension }
        ]
      }, data) }
    }
    return { code: 200, message: 'success', data: null }
  }
}

module.exports = Request
