/**
 * 用户相关API
 */
const UserApi = {
    /**
     * 创建/登录用户
     */
    async login() {
        let userId = Storage.getUserId();
        
        if (!userId) {
            userId = Storage.generateUserId();
            Storage.setUserId(userId);
        }
        
        return {
            code: 0,
            message: 'success',
            data: {
                userId,
                nickName: '用户' + userId.slice(-4),
                avatarUrl: ''
            }
        };
    },

    /**
     * 获取用户信息
     */
    async getUserInfo() {
        const userId = Storage.getUserId();
        return {
            code: 0,
            message: 'success',
            data: {
                userId,
                nickName: '用户' + (userId ? userId.slice(-4) : '****'),
                avatarUrl: '',
                totalCalculations: Storage.getHistoryList().length
            }
        };
    },

    /**
     * 更新用户信息
     */
    async updateUserInfo(data) {
        return {
            code: 0,
            message: 'success',
            data: null
        };
    }
};
