/**
 * 养老金测算相关API
 */
const PensionApi = {
    /**
     * 上传并解析PDF文件
     */
    async uploadAndParse(file, onProgress) {
        return Request.upload('/api/pension/pdf-upload', file, onProgress);
    },

    /**
     * 计算养老金
     */
    async calculate(params) {
        // 模拟计算延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { 
            paymentDetails, 
            retirementAge, 
            visualYears = 0, 
            personalAccountAmount,
            gender = 'male',
            personType = 'enterprise'
        } = params;

        // 2024年福建省社平工资（模拟数据）
        const SOCIAL_AVG_WAGE = 7500;
        
        // 计算实际缴费年限
        const actualYears = paymentDetails ? (paymentDetails.length / 12).toFixed(1) : 20;
        const totalYears = parseFloat(actualYears) + parseFloat(visualYears);
        
        // 计算平均缴费指数
        const avgIndex = calculateAvgIndex(paymentDetails, SOCIAL_AVG_WAGE);
        
        // 本人指数化月平均缴费工资
        const indexedWage = SOCIAL_AVG_WAGE * avgIndex;
        
        // 基础养老金 = (社平工资 + 指数化工资) / 2 * 缴费年限 * 1%
        const basicPension = ((SOCIAL_AVG_WAGE + indexedWage) / 2) * totalYears * 0.01;
        
        // 个人账户养老金
        const personalAccount = personalAccountAmount || (totalYears * 12 * SOCIAL_AVG_WAGE * avgIndex * 0.08);
        const calculateMonths = getCalculateMonths(retirementAge);
        const personalPension = personalAccount / calculateMonths;
        
        // 过渡性养老金（中人：建立个人账户前参加工作）
        const transitionalPension = visualYears > 0 ? (indexedWage * visualYears * 0.013) : 0;
        
        // 合计
        const totalPension = basicPension + personalPension + transitionalPension;

        return {
            code: 0,
            message: 'success',
            data: {
                basicInfo: {
                    retirementAge,
                    totalPaymentYears: totalYears.toFixed(1),
                    actualPaymentYears: actualYears,
                    visualPaymentYears: visualYears,
                    avgPaymentIndex: avgIndex,
                    calculateMonths
                },
                pensionDetails: {
                    basicPension: Math.round(basicPension),
                    personalAccountPension: Math.round(personalPension),
                    transitionalPension: Math.round(transitionalPension),
                    totalMonthlyPension: Math.round(totalPension)
                },
                calculationProcess: [
                    {
                        stepName: '基础养老金计算',
                        formula: `(退休时上年度在岗职工月平均工资 + 本人指数化月平均缴费工资) ÷ 2 × 累计缴费年限 × 1%`,
                        parameters: {
                            socialAvgWage: SOCIAL_AVG_WAGE,
                            indexedWage: Math.round(indexedWage),
                            totalYears: totalYears.toFixed(1)
                        },
                        process: [
                            `本人指数化月平均缴费工资 = ${SOCIAL_AVG_WAGE} × ${avgIndex} = ${Math.round(indexedWage)}元`,
                            `基础养老金 = (${SOCIAL_AVG_WAGE} + ${Math.round(indexedWage)}) ÷ 2 × ${totalYears.toFixed(1)} × 1% = ${Math.round(basicPension)}元`
                        ],
                        result: Math.round(basicPension)
                    },
                    {
                        stepName: '个人账户养老金计算',
                        formula: `个人账户累计储存额 ÷ 计发月数`,
                        parameters: {
                            personalAccount: Math.round(personalAccount),
                            calculateMonths
                        },
                        process: [
                            `个人账户累计储存额 ≈ ${Math.round(personalAccount)}元`,
                            `${retirementAge}岁退休计发月数 = ${calculateMonths}个月`,
                            `个人账户养老金 = ${Math.round(personalAccount)} ÷ ${calculateMonths} = ${Math.round(personalPension)}元`
                        ],
                        result: Math.round(personalPension)
                    },
                    {
                        stepName: '过渡性养老金计算',
                        formula: `本人指数化月平均缴费工资 × 视同缴费年限 × 1.3%`,
                        parameters: {
                            indexedWage: Math.round(indexedWage),
                            visualYears
                        },
                        process: visualYears > 0 ? [
                            `本人指数化月平均缴费工资 = ${Math.round(indexedWage)}元`,
                            `视同缴费年限 = ${visualYears}年`,
                            `过渡性养老金 = ${Math.round(indexedWage)} × ${visualYears} × 1.3% = ${Math.round(transitionalPension)}元`
                        ] : ['无视同缴费年限，过渡性养老金为0元'],
                        result: Math.round(transitionalPension)
                    }
                ],
                warnings: totalYears < 15 ? ['累计缴费不足15年，无法按月领取养老金，建议补缴或继续缴费'] : []
            }
        };
    },

    /**
     * 获取测算结果
     */
    async getResult(id) {
        const historyList = Storage.getHistoryList();
        const result = historyList.find(item => item.id === id);
        return {
            code: 0,
            message: 'success',
            data: result
        };
    },

    /**
     * 获取历史测算列表
     */
    async getHistoryList() {
        const list = Storage.getHistoryList();
        return {
            code: 0,
            message: 'success',
            data: {
                list,
                total: list.length
            }
        };
    },

    /**
     * 删除测算记录
     */
    async deleteHistory(id) {
        Storage.deleteHistory(id);
        return {
            code: 0,
            message: 'success',
            data: null
        };
    }
};
