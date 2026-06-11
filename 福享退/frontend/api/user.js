/**
 * 用户相关API
 */
window.UserApi = {
    /**
     * 账号密码登录
     * POST /api/v1/user/login
     */
    async login(username, password) {
        const result = await Request.post('/user/login', { username, password });
        this.saveLoginResult(result);
        return result;
    },

    /**
     * 微信登录
     * POST /api/v1/user/wxlogin
     * Swagger 定义 requestBody 为 Map<String,String>，当前后端至少需要 code。
     */
    async wxLogin(code, userInfo = {}) {
        const payload = {
            code: String(code || ''),
            nickName: userInfo.nickName || userInfo.nickname || '微信用户',
            avatarUrl: userInfo.avatarUrl || userInfo.avatar || ''
        };

        const result = await Request.post('/user/wxlogin', payload);
        this.saveLoginResult(result);
        return result;
    },

    /**
     * 保存登录态，兼容 userId/id、openId/open_id 等字段
     */
    saveLoginResult(result) {
        if (!result || (result.code !== 0 && result.code !== 200) || !result.data) return false;
        const data = result.data;
        const userId = data.userId ?? data.id;
        const token = data.token || data.accessToken;
        const openId = data.openId || data.open_id || data.openid;
        const nickName = data.nickName || data.nickname || data.userInfo?.nickName;
        const avatarUrl = data.avatarUrl || data.avatar || data.userInfo?.avatarUrl;
        if (userId !== undefined && userId !== null) localStorage.setItem('userId', userId);
        if (token) localStorage.setItem('token', token);
        if (openId) localStorage.setItem('openId', openId);
        if (nickName) localStorage.setItem('nickName', nickName);
        if (avatarUrl) localStorage.setItem('avatarUrl', avatarUrl);
        return true;
    },

    /**
     * 获取用户信息
     * GET /api/v1/user/info
     */
    async getUserProfile() {
        return Request.get('/user/info');
    },

    /**
     * 更新用户信息：本轮接口清单未提供更新接口，保留安全降级
     */
    async updateUserProfile(userInfo) {
        console.warn('当前后端接口清单未提供用户信息更新接口，已跳过提交', userInfo);
        return { code: 0, message: '当前版本暂不支持更新用户信息', data: userInfo };
    },

    /**
     * 自动登录（游客模式，兼容旧代码）
     */
    async autoLogin() {
        const token = localStorage.getItem('token');
        if (token) {
            return { code: 0, message: '已登录', data: { isLoggedIn: true } };
        }

        if (typeof wx !== 'undefined' && wx.login) {
            return new Promise((resolve) => {
                wx.login({
                    success: async (res) => resolve(await this.wxLogin(res.code)),
                    fail: () => resolve({ code: -1, message: '微信登录失败', data: null })
                });
            });
        }

        // H5 预览环境没有 wx.login，只返回未登录态，不再伪造 mock token。
        return { code: -1, message: '当前环境无法获取微信登录 code', data: null };
    },

    /**
     * 退出登录
     */
    logout() {
        localStorage.removeItem('userId');
        localStorage.removeItem('token');
        localStorage.removeItem('openId');
    },

    /**
     * 检查是否已登录
     */
    isLoggedIn() {
        return !!localStorage.getItem('token');
    }
};
