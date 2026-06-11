/**
 * 小程序请求工具类
 */
const config = {
  baseUrl: 'http://14.103.38.180:8080/api/v1',
  useMock: false, // 是否使用Mock数据
  timeout: 15000
};

const Request = {
  /**
   * 通用请求方法
   */
  async request(url, options = {}) {
    const { method = 'GET', data, header = {}, showLoading = false } = options;

    // Mock模式
    if (config.useMock) {
      return this.mockRequest(url, method, data);
    }

    if (showLoading) {
      wx.showLoading({ title: '加载中...', mask: true });
    }

    const token = wx.getStorageSync('token');
    const headerConfig = {
      'Content-Type': 'application/json',
      ...header
    };

    if (token) {
      headerConfig['Authorization'] = `Bearer ${token}`;
    }

    try {
      const result = await new Promise((resolve, reject) => {
        wx.request({
          url: config.baseUrl + url,
          method,
          data,
          header: headerConfig,
          timeout: config.timeout,
          success: (res) => resolve(res.data),
          fail: (err) => reject(err)
        });
      });

      if (showLoading) {
        wx.hideLoading();
      }

      // token过期处理
      if (result.code === 401) {
        wx.removeStorageSync('token');
        wx.removeStorageSync('userId');
      }

      return result;
    } catch (error) {
      if (showLoading) {
        wx.hideLoading();
      }
      console.error('请求失败:', error);
      return {
        code: -1,
        message: error.errMsg || '网络请求失败',
        data: null
      };
    }
  },

  /**
   * Mock请求
   */
  async mockRequest(url, method, data) {
    await new Promise(resolve => setTimeout(resolve, 500));

    // 登录
    if (url.includes('/user/wxlogin')) {
      const userId = Date.now();
      wx.setStorageSync('userId', userId);
      wx.setStorageSync('token', `mock_token_${userId}`);
      return {
        code: 0,
        message: 'success',
        data: {
          userId,
          openId: `mock_openid_${userId}`,
          nickName: '微信用户',
          token: `mock_token_${userId}`
        }
      };
    }

    // PDF解析
    if (url.includes('/pdf/upload-and-parse')) {
      return {
        code: 0,
        message: 'success',
        data: {
          personalInfo: {
            name: '张三',
            idCard: '350121199001011234',
            gender: '男'
          },
          paymentDetails: this.generateDemoData(),
          summary: {
            totalMonths: 120,
            averagePaymentBase: 5850,
            dateRange: '2015-01 至 2024-12',
            totalRecords: 120
          },
          warnings: []
        }
      };
    }

    // 测算
    if (url.includes('/pension/calculate')) {
      const totalYears = (data.visualPaymentYears || 0) + 10;
      const avgIndex = 0.85;
      const socialAvgWage = 8250;
      
      const basicPension = Math.round(((socialAvgWage + socialAvgWage * avgIndex) / 2) * totalYears * 0.01);
      const personalAccount = data.personalAccountAmount || 100000;
      const calculateMonths = data.retirementAge === 60 ? 139 : data.retirementAge === 55 ? 170 : 195;
      const personalPension = Math.round(personalAccount / calculateMonths);
      const transitionalPension = data.visualPaymentYears > 0 ? Math.round(socialAvgWage * avgIndex * data.visualPaymentYears * 0.013) : 0;

      return {
        code: 0,
        message: 'success',
        data: {
          calculateNo: 'CAL' + Date.now(),
          basicInfo: {
            name: data.personalInfo?.name || '张三',
            gender: data.personalInfo?.gender || '男',
            retirementIdentity: data.retirementIdentity || '工人',
            retirementAge: data.retirementAge || 60,
            retirementYear: data.retirementYear || 2025,
            actualPaymentYears: 10,
            visualPaymentYears: data.visualPaymentYears || 0,
            totalPaymentYears: totalYears,
            averagePaymentIndex: avgIndex,
            socialAvgWageYear: 2024
          },
          pensionDetail: {
            basicPension,
            personalAccountPension: personalPension,
            transitionalPension,
            paymentYearsPension: 0,
            totalMonthlyPension: basicPension + personalPension + transitionalPension
          },
          calculationProcess: [
            { stepName: '基础养老金计算', formula: `(${socialAvgWage} + ${Math.round(socialAvgWage * avgIndex)}) / 2 × ${totalYears} × 1%`, result: basicPension },
            { stepName: '个人账户养老金计算', formula: `${personalAccount} ÷ ${calculateMonths}`, result: personalPension },
            { stepName: '过渡性养老金计算', formula: data.visualPaymentYears > 0 ? `${Math.round(socialAvgWage * avgIndex)} × ${data.visualPaymentYears} × 1.3%` : '无视同缴费年限', result: transitionalPension }
          ],
          warnings: totalYears < 15 ? ['累计缴费不足15年，建议补缴'] : []
        }
      };
    }

    return { code: 0, message: 'success', data: null };
  },

  get(url, params = {}) {
    return this.request(url, { method: 'GET', data: params });
  },

  post(url, data = {}) {
    return this.request(url, { method: 'POST', data });
  },

  put(url, data = {}) {
    return this.request(url, { method: 'PUT', data });
  },

  delete(url, data = {}) {
    return this.request(url, { method: 'DELETE', data });
  },

  /**
   * 上传PDF文件
   */
  async uploadPdf(filePath, onProgress) {
    if (config.useMock) {
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        if (onProgress) onProgress(i);
      }
      return this.mockRequest('/pdf/upload-and-parse', 'POST', {});
    }

    const token = wx.getStorageSync('token');
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: config.baseUrl + '/pdf/upload-and-parse',
        filePath,
        name: 'file',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => {
          try {
            resolve(JSON.parse(res.data));
          } catch (e) {
            resolve(res.data);
          }
        },
        fail: reject
      });
    });
  },

  /**
   * 生成示例数据
   */
  generateDemoData() {
    const data = [];
    for (let year = 2015; year <= 2024; year++) {
      for (let month = 1; month <= 12; month++) {
        data.push({
          yearMonth: `${year}-${String(month).padStart(2, '0')}`,
          paymentBase: 3500 + (year - 2015) * 250 + Math.floor(Math.random() * 500),
          paymentMonths: 1,
          unitName: `福建${year % 2 === 0 ? 'XX科技' : 'XX贸易'}有限公司`,
          paymentType: '正常应缴'
        });
      }
    }
    return data;
  }
};

module.exports = Request;
