/**
 * 用户相关API
 */
const UserApi = window.UserApi = {
    /**
     * 微信登录
     */
    async wxLogin(code, userInfo = {}) {
        // Web端游客模式：先用真实后端，失败则降级到mock
        if (!code || code === 'web-anonymous') {
            try {
                const result = await Request.post('/user/wx-login', {
                    code: 'web-anonymous',
                    nickName: userInfo.nickName || '游客用户',
                    ...userInfo
                });

                if (result.code === 0 && result.data) {
                    localStorage.setItem('userId', result.data.userId);
                    localStorage.setItem('token', result.data.token);
                    localStorage.setItem('openId', result.data.openId);
                    return result;
                }
            } catch (e) {
                console.log('后端登录失败，降级到Mock模式');
            }

            // 降级：Mock模式
            const mockResult = {
                code: 0,
                message: 'success',
                data: {
                    userId: Date.now(),
                    openId: `mock_openid_${Date.now()}`,
                    nickName: '游客用户',
                    token: `mock_token_${Date.now()}`
                }
            };
            localStorage.setItem('userId', mockResult.data.userId);
            localStorage.setItem('token', mockResult.data.token);
            localStorage.setItem('openId', mockResult.data.openId);
            return mockResult;
        }

        // 小程序正常微信登录
        const result = await Request.post('/user/wx-login', {
            code,
            ...userInfo
        });

        if (result.code === 0 && result.data) {
            localStorage.setItem('userId', result.data.userId);
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('openId', result.data.openId);
        }
        return result;
    },

    /**
     * 获取用户信息
     */
    async getUserProfile() {
        return Request.get('/user/profile');
    },

    /**
     * 更新用户信息
     */
    async updateUserProfile(userInfo) {
        return Request.put('/user/profile', userInfo);
    },

    /**
     * 自动登录（游客模式，兼容旧代码）
     */
    async autoLogin() {
        const token = localStorage.getItem('token');
        if (token) {
            return { code: 0, message: '已登录', data: { isLoggedIn: true } };
        }

        // Web端自动创建游客用户
        return this.wxLogin('web-anonymous');
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
