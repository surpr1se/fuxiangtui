/**
 * 养老金测算相关API
 * 对接福享退后端 /api/v1 下的真实接口。
 */
window.PensionApi = {
    /**
     * 上传并解析PDF文件
     * POST /api/v1/pdf/upload
     */
    async uploadAndParse(file, onProgress) {
        return Request.uploadPdf(file, onProgress);
    },

    /**
     * 计算养老金
     * POST /api/v1/pension/calculate
     */
    async calculate(params = {}) {
        const result = await Request.post('/pension/calculate', {
            batchNo: params.batchNo || 'BATCH_' + Date.now(),
            paymentDetails: params.paymentDetails || [],
            personalInfo: params.personalInfo || {},
            retirementIdentity: params.retirementIdentity || '工人',
            retirementAge: params.retirementAge || 60,
            retirementYear: params.retirementYear || new Date().getFullYear() + 1,
            visualPaymentYears: params.visualPaymentYears ?? params.visualYears ?? 0,
            personalAccountAmount: params.personalAccountAmount || 0,
            socialAvgWage: params.socialAvgWage || undefined
        });

        if ((result.code === 0 || result.code === 200) && result.data) {
            // 兼容前端旧渲染结构：后端新接口直接返回 basicPension/monthlyPension 等扁平字段
            result.data.pensionDetail = result.data.pensionDetail || {
                basicPension: result.data.basicPension || 0,
                personalAccountPension: result.data.personalAccountPension || 0,
                transitionalPension: result.data.transitionalPension || 0,
                totalMonthlyPension: result.data.totalMonthlyPension || result.data.monthlyPension || 0
            };
            result.data.pensionDetails = result.data.pensionDetail;
            result.data.monthlyPension = result.data.monthlyPension || result.data.pensionDetail.totalMonthlyPension || 0;
        }
        return result;
    },

    /**
     * 待遇调整预测（每年4.5%增长）
     * POST /api/v1/pension/adjustment-forecast
     */
    async adjustmentForecast(params = {}) {
        return Request.post('/pension/adjustment-forecast', params);
    },

    /**
     * 多方案对比（缴费档次对比）
     * POST /api/v1/pension/scheme-comparison
     */
    async schemeComparison(params = {}) {
        return Request.post('/pension/scheme-comparison', params);
    },

    /**
     * 保存待遇测算结果
     * POST /api/v1/calculate-result/save
     */
    async saveResult(payload = {}) {
        return Request.post('/calculate-result/save', payload);
    },

    /**
     * 获取测算结果详情
     * GET /api/v1/calculate-result/{id}
     */
    async getResult(id) {
        return Request.get(`/calculate-result/${id}`);
    },

    /**
     * 查询待遇测算历史记录
     * GET /api/v1/calculate-result/history
     */
    async getHistoryList(params = {}) {
        const query = {
            page: params.page || 1,
            pageSize: params.pageSize || 20
        };
        if (params.userId) query.userId = params.userId;
        if (params.openid) query.openid = params.openid;
        return Request.get('/calculate-result/history', query);
    },

    /**
     * 导出测算结果
     * GET /api/v1/calculate-result/export/{id}
     */
    async exportResult(id) {
        return Request.get(`/calculate-result/export/${id}`);
    },

    /**
     * 获取缴费明细列表
     * GET /api/v1/payment/list
     */
    async getPaymentDetailList(userId) {
        const params = userId ? { userId } : {};
        return Request.get('/payment/list', params);
    },

    /**
     * 新增缴费明细
     * POST /api/v1/payment/add
     */
    async addPaymentDetail(detail) {
        return Request.post('/payment/add', detail);
    },

    /**
     * 批量导入缴费明细
     * POST /api/v1/payment/import
     */
    async importPaymentDetails(details = []) {
        return Request.post('/payment/import', details);
    },

    /**
     * 获取PDF解析记录列表
     * GET /api/v1/pdf/list
     */
    async getPdfList(userId) {
        const params = userId ? { userId } : {};
        return Request.get('/pdf/list', params);
    },

    /**
     * 获取PDF解析详情
     * GET /api/v1/pdf/{id}
     */
    async getPdfDetail(id) {
        return Request.get(`/pdf/${id}`);
    },

    /**
     * 获取系统参数
     * GET /api/v1/system-param/list
     */
    async getSystemParameters() {
        return Request.get('/system-param/list');
    },

    /**
     * 获取社平工资历史数据
     * GET /api/v1/system-param/social-wage
     */
    async getSocialWageHistory(params = {}) {
        return Request.get('/system-param/social-wage', params);
    },

    /**
     * 查询上年社平工资（月社平工资）
     * GET /api/v1/system-param/social-wage/latest-previous-year
     */
    async getPreviousYearSocialWage(baseYear = new Date().getFullYear(), province = '福建省') {
        const params = {};
        if (province) params.province = province;
        if (baseYear) params.baseYear = baseYear;
        return Request.get('/system-param/social-wage/latest-previous-year', params);
    },

    /**
     * 获取延迟退休对照表
     * GET /api/v1/retire-age/list
     */
    async getRetireAgeList() {
        return Request.get('/retire-age/list');
    },

    /**
     * 计算延迟退休年龄
     * GET /api/v1/retire-age/calculate
     * @param {string} birthDate - 出生日期，格式：YYYY-MM-DD
     * @param {string|number} personType - 人员类型：11=女工人，12=女干部，13=女性灵活就业，21=男性
     */
    async calculateDelayRetire(birthDate, personType) {
        try {
            return await Request.get('/retire-age/calculate', { birthDate, personType });
        } catch (error) {
            console.warn('⚠️ 调用延迟退休计算接口失败，使用本地计算：', error);
            return null;
        }
    }
};
