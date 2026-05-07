/**
 * 请求工具类
 */
const Request = {
    // API基础地址
    BASE_URL: 'http://14.103.38.180:8080/api/v1',

    // 是否使用Mock数据（true=使用mock，false=对接真实后端）
    // 待后端接口完全就绪后切换为 false
    USE_MOCK: true,

    /**
     * GET请求快捷方法
     */
    async get(url, params = {}) {
        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },

    /**
     * POST请求快捷方法
     */
    async post(url, data = {}) {
        return this.request(url, { method: 'POST', data });
    },

    /**
     * PUT请求快捷方法
     */
    async put(url, data = {}) {
        return this.request(url, { method: 'PUT', data });
    },

    /**
     * DELETE请求快捷方法
     */
    async delete(url, data = {}) {
        return this.request(url, { method: 'DELETE', data });
    },

    /**
     * 通用请求方法
     */
    async request(url, options = {}) {
        const { method = 'GET', data, headers = {} } = options;

        // 如果使用Mock模式，直接返回模拟数据
        if (this.USE_MOCK) {
            return this.mockRequest(url, method, data);
        }

        const fullUrl = this.BASE_URL + url;
        const token = localStorage.getItem('token');

        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        // 添加token
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(fullUrl, config);
            const result = await response.json();
            
            // 处理token过期等情况
            if (result.code === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
            }
            
            return result;
        } catch (error) {
            console.error('请求失败:', error);
            return {
                code: -1,
                message: error.message || '网络请求失败',
                data: null
            };
        }
    },

    /**
     * Mock请求（兼容旧模式）
     */
    async mockRequest(url, method, data) {
        await new Promise(resolve => setTimeout(resolve, 500));

        // 模拟登录
        if (url.includes('/user/wx-login')) {
            const userId = Date.now();
            localStorage.setItem('userId', userId);
            localStorage.setItem('token', `mock_token_${userId}`);
            return {
                code: 0,
                message: 'success',
                data: {
                    userId,
                    openId: `mock_openid_${userId}`,
                    nickName: '游客用户',
                    token: `mock_token_${userId}`
                }
            };
        }

        // 模拟PDF上传解析
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
                    paymentDetails: this.generateDemoPaymentData(),
                    summary: {
                        totalMonths: 240,
                        averagePaymentBase: 5850,
                        dateRange: '2004-01 至 2024-12',
                        totalRecords: 240
                    },
                    warnings: []
                }
            };
        }

        // 模拟测算
        if (url.includes('/pension/calculate')) {
            const totalYears = (data.visualPaymentYears || 0) + (data.paymentDetails?.length || 240) / 12;
            const avgIndex = 0.85;
            const socialAvgWage = 7500;
            
            const basicPension = Math.round(((socialAvgWage + socialAvgWage * avgIndex) / 2) * totalYears * 0.01);
            const personalAccount = data.personalAccountAmount || 120000;
            const personalPension = Math.round(personalAccount / 139);
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
                        actualPaymentYears: (data.paymentDetails?.length || 240) / 12,
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
                        {
                            stepName: '基础养老金计算',
                            formula: `(退休时上年度在岗职工月平均工资 + 本人指数化月平均缴费工资) ÷ 2 × 累计缴费年限 × 1%`,
                            result: `${basicPension}元`,
                            description: '社平工资按2024年福建省标准计算'
                        },
                        {
                            stepName: '个人账户养老金计算',
                            formula: `个人账户累计储存额 ÷ 计发月数`,
                            result: `${personalPension}元`,
                            description: `计发月数${data.retirementAge === 60 ? 139 : data.retirementAge === 55 ? 170 : 195}个月`
                        },
                        {
                            stepName: '过渡性养老金计算',
                            formula: `本人指数化月平均缴费工资 × 视同缴费年限 × 1.3%`,
                            result: `${transitionalPension}元`,
                            description: data.visualPaymentYears > 0 ? '包含视同缴费年限' : '无视同缴费年限'
                        }
                    ],
                    warnings: [],
                    calculateTime: new Date().toISOString(),
                    calculateVersion: '1.0.0'
                }
            };
        }

        // 模拟历史记录
        if (url.includes('/pension/result/list')) {
            const history = JSON.parse(localStorage.getItem('calculateHistory') || '[]');
            return {
                code: 0,
                message: 'success',
                data: history.map(h => ({
                    id: h.id,
                    calculateNo: h.id,
                    name: '张三',
                    totalMonthlyPension: h.result.pensionDetail.totalMonthlyPension,
                    calculateTime: h.createTime
                }))
            };
        }

        return {
            code: 0,
            message: 'success',
            data: null
        };
    },

    /**
     * GET请求
     */
    get(url, params = {}) {
        const queryString = Object.keys(params)
            .map(key => `${key}=${encodeURIComponent(params[key])}`)
            .join('&');
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return this.request(fullUrl, { method: 'GET' });
    },

    /**
     * POST请求
     */
    post(url, data = {}) {
        return this.request(url, { method: 'POST', data });
    },

    /**
     * PUT请求
     */
    put(url, data = {}) {
        return this.request(url, { method: 'PUT', data });
    },

    /**
     * DELETE请求
     */
    delete(url, data = {}) {
        return this.request(url, { method: 'DELETE', data });
    },

    /**
     * 文件上传（PDF）
     */
    async uploadPdf(file, onProgress) {
        // 如果使用Mock模式
        if (this.USE_MOCK) {
            for (let i = 0; i <= 100; i += 10) {
                await new Promise(resolve => setTimeout(resolve, 200));
                if (onProgress) onProgress(i);
            }
            return this.mockRequest('/pdf/upload-and-parse', 'POST', {});
        }

        // 真实上传
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(this.BASE_URL + '/pdf/upload-and-parse', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('PDF上传失败:', error);
            return {
                code: -1,
                message: '上传失败: ' + error.message,
                data: null
            };
        }
    },

    /**
     * 生成示例缴费数据（兼容旧代码）
     */
    generateDemoPaymentData() {
        const data = [];
        const baseAmounts = [3500, 3800, 4200, 4500, 4800, 5200, 5600, 6000, 6500, 7000];
        
        for (let year = 2015; year <= 2024; year++) {
            for (let month = 1; month <= 12; month++) {
                const baseIndex = Math.min(Math.floor((year - 2015) / 2), baseAmounts.length - 1);
                const base = baseAmounts[baseIndex] + Math.floor(Math.random() * 500);
                data.push({
                    yearMonth: `${year}-${String(month).padStart(2, '0')}`,
                    paymentBase: base,
                    paymentMonths: 1,
                    unitName: `福建${year % 2 === 0 ? 'XX科技' : 'XX贸易'}有限公司`,
                    paymentType: '正常应缴'
                });
            }
        }
        
        return data;
    }
};
