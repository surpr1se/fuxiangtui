/**
 * 请求工具类
 */
const Request = {
    // API基础地址（后端还没开发，先用mock模式）
    BASE_URL: '',

    /**
     * 通用请求方法
     */
    async request(url, options = {}) {
        const { method = 'GET', data, headers = {} } = options;

        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

        try {
            // 模拟网络延迟
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 目前都是mock数据，直接返回成功
            return {
                code: 0,
                message: 'success',
                data: null
            };
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
     * 文件上传
     */
    async upload(url, file, onProgress) {
        // 模拟上传进度
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 200));
            if (onProgress) {
                onProgress(i);
            }
        }

        // 模拟解析PDF，返回示例数据
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
                    avgPaymentBase: 5850,
                    startDate: '2004-01',
                    endDate: '2024-12',
                    hasGap: false
                }
            }
        };
    },

    /**
     * 生成示例缴费数据
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
