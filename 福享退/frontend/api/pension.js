/**
 * 养老金测算相关API
 */
const PensionApi = window.PensionApi = {
    /**
     * 上传并解析PDF文件
     */
    async uploadAndParse(file, onProgress) {
        return Request.uploadPdf(file, onProgress);
    },

    /**
     * 计算养老金
     */
    async calculate(params) {
        // 调用后端接口
        const result = await Request.post('/pension/calculate', {
            batchNo: params.batchNo || 'BATCH_' + Date.now(),
            paymentDetails: params.paymentDetails || [],
            personalInfo: params.personalInfo || {},
            retirementIdentity: params.retirementIdentity || '工人',
            retirementAge: params.retirementAge || 60,
            retirementYear: params.retirementYear || new Date().getFullYear() + 1,
            visualPaymentYears: params.visualYears || 0,
            personalAccountAmount: params.personalAccountAmount || null
        });

        // 兼容旧数据结构，把后端返回的字段名对齐前端
        if (result.code === 0 && result.data) {
            result.data.pensionDetails = result.data.pensionDetail;
        }
        return result;
    },

    /**
     * 获取测算结果详情
     */
    async getResult(calculateNo) {
        return Request.get(`/pension/result/${calculateNo}`);
    },

    /**
     * 获取历史测算列表
     */
    async getHistoryList() {
        return Request.get('/pension/result/list');
    },

    /**
     * 删除测算记录
     */
    async deleteHistory(id) {
        return Request.delete(`/pension/result/${id}`);
    },

    /**
     * 获取缴费明细列表
     */
    async getPaymentDetailList(batchNo) {
        return Request.get('/payment/detail/list', { batchNo });
    },

    /**
     * 获取系统参数
     */
    async getSystemParameters(paramType) {
        return Request.get('/system/parameter/list', { paramType });
    }
};
window.PensionApi = PensionApi;
