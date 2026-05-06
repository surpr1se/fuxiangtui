// pages/input/input.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    personType: 'enterprise', // enterprise / government
    gender: 'male',
    retireTypeIndex: 0,
    retireTypeOptions: ['工人（男60/女50）', '干部（男60/女55）', '特殊工种（提前退休）'],
    retireAge: 60,
    visualYears: 0,
    personalAccount: '',
    isCalculating: false
  },

  onLoad(options) {
    // 根据性别和身份设置默认退休年龄
    this.updateRetireAge()
  },

  // 选择人员类型
  selectPersonType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ personType: type })
  },

  // 选择性别
  selectGender(e) {
    const gender = e.currentTarget.dataset.gender
    this.setData({ gender })
    this.updateRetireAge()
  },

  // 选择退休身份
  onRetireTypeChange(e) {
    this.setData({ retireTypeIndex: parseInt(e.detail.value) })
    this.updateRetireAge()
  },

  // 根据性别和身份更新默认退休年龄
  updateRetireAge() {
    const { gender, retireTypeIndex } = this.data
    let age = 60
    
    if (gender === 'female') {
      if (retireTypeIndex === 0) { // 女工人
        age = 50
      } else if (retireTypeIndex === 1) { // 女干部
        age = 55
      }
    }
    
    this.setData({ retireAge: age })
  },

  // 输入退休年龄
  onRetireAgeInput(e) {
    let age = parseInt(e.detail.value) || 60
    // 限制范围
    if (age < 45) age = 45
    if (age > 70) age = 70
    this.setData({ retireAge: age })
  },

  // 输入视同缴费年限
  onVisualYearsInput(e) {
    let years = parseFloat(e.detail.value) || 0
    if (years < 0) years = 0
    if (years > 40) years = 40
    this.setData({ visualYears: years })
  },

  // 输入个人账户储存额
  onPersonalAccountInput(e) {
    this.setData({ personalAccount: e.detail.value })
  },

  // 返回
  goBack() {
    wx.navigateBack()
  },

  // 开始测算
  startCalculate() {
    const { retireAge, visualYears } = this.data
    
    // 参数校验
    if (retireAge < 45 || retireAge > 70) {
      util.showToast('退休年龄请输入45-70之间')
      return
    }
    
    if (visualYears < 0 || visualYears > 40) {
      util.showToast('视同缴费年限请输入0-40之间')
      return
    }

    this.setData({ isCalculating: true })
    util.showLoading('测算中...')

    // 保存参数
    const params = {
      personType: this.data.personType,
      gender: this.data.gender,
      retireType: this.data.retireTypeOptions[this.data.retireTypeIndex],
      retireAge: this.data.retireAge,
      visualYears: this.data.visualYears,
      personalAccount: this.data.personalAccount ? parseFloat(this.data.personalAccount) : null
    }
    app.globalData.calculateParams = params

    // 模拟计算
    setTimeout(() => {
      const result = this.doCalculate(params)
      app.globalData.lastResult = result
      
      util.hideLoading()
      this.setData({ isCalculating: false })
      
      wx.navigateTo({
        url: '/pages/result/result'
      })
    }, 1500)
  },

  // 执行计算（简化版算法）
  doCalculate(params) {
    const { retireAge, visualYears, personalAccount, gender } = params
    const paymentDetails = app.globalData.paymentDetails || []
    const SOCIAL_AVG_WAGE = app.globalData.socialAvgWage || 7500
    
    // 实际缴费年限
    const actualYears = (paymentDetails.length / 12).toFixed(1)
    const totalYears = parseFloat(actualYears) + parseFloat(visualYears)
    
    // 平均缴费指数
    const avgIndex = util.calculateAvgIndex(paymentDetails, SOCIAL_AVG_WAGE)
    
    // 本人指数化月平均缴费工资
    const indexedWage = SOCIAL_AVG_WAGE * avgIndex
    
    // 基础养老金 = (社平工资 + 指数化工资) / 2 * 缴费年限 * 1%
    const basicPension = Math.round(((SOCIAL_AVG_WAGE + indexedWage) / 2) * totalYears * 0.01)
    
    // 个人账户养老金
    const calculateMonths = util.getCalculateMonths(retireAge)
    const accountAmount = personalAccount || Math.round(totalYears * 12 * SOCIAL_AVG_WAGE * avgIndex * 0.08)
    const personalPension = Math.round(accountAmount / calculateMonths)
    
    // 过渡性养老金
    const transitionalPension = visualYears > 0 ? Math.round(indexedWage * visualYears * 0.013) : 0
    
    // 合计
    const totalPension = basicPension + personalPension + transitionalPension

    return {
      basicInfo: {
        retireAge,
        totalPaymentYears: totalYears.toFixed(1),
        actualPaymentYears: actualYears,
        visualPaymentYears: visualYears,
        avgPaymentIndex: avgIndex,
        calculateMonths
      },
      pensionDetails: {
        basicPension,
        personalAccountPension: personalPension,
        transitionalPension,
        totalMonthlyPension: totalPension
      },
      calculationProcess: [
        {
          stepName: '基础养老金计算',
          formula: `(退休时上年度在岗职工月平均工资 + 本人指数化月平均缴费工资) ÷ 2 × 累计缴费年限 × 1%`,
          result: basicPension
        },
        {
          stepName: '个人账户养老金计算',
          formula: `个人账户累计储存额 ÷ 计发月数`,
          result: personalPension
        },
        {
          stepName: '过渡性养老金计算',
          formula: `本人指数化月平均缴费工资 × 视同缴费年限 × 1.3%`,
          result: transitionalPension
        }
      ]
    }
  }
})
