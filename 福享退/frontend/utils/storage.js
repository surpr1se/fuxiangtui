/**
 * 本地存储工具类
 */
const Storage = {
    // 用户ID键名
    USER_ID_KEY: 'fuxiangtui_user_id',
    
    // 历史记录键名
    HISTORY_KEY: 'fuxiangtui_history',

    /**
     * 获取用户ID
     */
    getUserId() {
        return localStorage.getItem(this.USER_ID_KEY);
    },

    /**
     * 设置用户ID
     */
    setUserId(userId) {
        localStorage.setItem(this.USER_ID_KEY, userId);
    },

    /**
     * 生成用户ID（游客模式）
     */
    generateUserId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10);
        return `guest_${timestamp}_${random}`;
    },

    /**
     * 获取历史记录列表
     */
    getHistoryList() {
        const history = localStorage.getItem(this.HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    },

    /**
     * 保存历史记录
     */
    saveHistory(item) {
        const history = this.getHistoryList();
        item.id = Date.now();
        item.createTime = new Date().toLocaleString();
        history.unshift(item);
        
        // 最多保存50条
        if (history.length > 50) {
            history.splice(50);
        }
        
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
        return item;
    },

    /**
     * 删除历史记录
     */
    deleteHistory(id) {
        const history = this.getHistoryList();
        const filtered = history.filter(item => item.id !== id);
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(filtered));
    },

    /**
     * 清空历史记录
     */
    clearHistory() {
        localStorage.removeItem(this.HISTORY_KEY);
    },

    /**
     * 存储测算参数
     */
    setCalculateParams(params) {
        localStorage.setItem('fuxiangtui_calculate_params', JSON.stringify(params));
    },

    /**
     * 获取测算参数
     */
    getCalculateParams() {
        const params = localStorage.getItem('fuxiangtui_calculate_params');
        return params ? JSON.parse(params) : null;
    },

    /**
     * 存储当前缴费明细
     */
    setPaymentDetails(details) {
        localStorage.setItem('fuxiangtui_payment_details', JSON.stringify(details));
    },

    /**
     * 获取当前缴费明细
     */
    getPaymentDetails() {
        const details = localStorage.getItem('fuxiangtui_payment_details');
        return details ? JSON.parse(details) : null;
    },

    /**
     * 存储用户信息
     */
    setUserInfo(info) {
        localStorage.setItem('fuxiangtui_user_info', JSON.stringify(info));
    },

    /**
     * 获取用户信息
     */
    getUserInfo() {
        const info = localStorage.getItem('fuxiangtui_user_info');
        return info ? JSON.parse(info) : null;
    }
};
