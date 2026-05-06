/**
 * 测算相关逻辑
 */

/**
 * 开始测算
 */
async function startCalculate() {
    const retireAge = parseInt(document.getElementById('retireAge').value) || 60;
    const visualYears = parseFloat(document.getElementById('visualYears').value) || 0;
    const personalAccount = parseFloat(document.getElementById('personalAccount').value) || null;
    
    // 参数校验
    if (retireAge < 45 || retireAge > 70) {
        showToast('退休年龄请输入45-70之间的数字');
        return;
    }
    
    if (visualYears < 0 || visualYears > 40) {
        showToast('视同缴费年限请输入0-40之间的数字');
        return;
    }
    
    // 获取缴费明细
    const paymentDetails = Storage.getPaymentDetails() || appData.paymentDetails || [];
    
    if (paymentDetails.length === 0) {
        showToast('请先上传缴费明细');
        return;
    }
    
    // 显示加载
    showLoading('测算中，请稍候...');
    
    try {
        const result = await PensionApi.calculate({
            paymentDetails,
            retirementAge: retireAge,
            visualYears,
            personalAccountAmount: personalAccount,
            gender: appData.gender,
            personType: appData.personType
        });
        
        if (result.code === 0) {
            // 渲染结果
            renderCalculateResult(result.data);
            
            // 保存参数
            Storage.setCalculateParams({
                retireAge,
                visualYears,
                personalAccount,
                gender: appData.gender,
                personType: appData.personType
            });
            
            // 跳转到结果页
            setTimeout(() => {
                hideLoading();
                goToPage('result');
            }, 500);
        } else {
            hideLoading();
            showToast(result.message || '测算失败');
        }
    } catch (error) {
        hideLoading();
        showToast('测算失败，请重试');
        console.error(error);
    }
}

/**
 * 渲染测算结果
 */
function renderCalculateResult(data) {
    const { basicInfo, pensionDetails, calculationProcess, warnings } = data;
    
    // 主结果
    document.getElementById('monthlyPension').textContent = formatCurrency(pensionDetails.totalMonthlyPension);
    
    // 基本信息
    document.getElementById('resultAge').textContent = `${basicInfo.retirementAge}岁`;
    document.getElementById('resultYears').textContent = `${basicInfo.totalPaymentYears}年`;
    document.getElementById('resultIndex').textContent = basicInfo.avgPaymentIndex;
    document.getElementById('resultMonths').textContent = `${basicInfo.calculateMonths}个月`;
    
    // 明细分解
    document.getElementById('basicPension').textContent = formatCurrency(pensionDetails.basicPension);
    document.getElementById('personalPension').textContent = formatCurrency(pensionDetails.personalAccountPension);
    document.getElementById('transitionalPension').textContent = formatCurrency(pensionDetails.transitionalPension);
    document.getElementById('totalPension').textContent = formatCurrency(pensionDetails.totalMonthlyPension);
    
    // 计算过程
    const processEl = document.getElementById('processContent');
    processEl.innerHTML = calculationProcess.map(step => `
        <div class="process-step">
            <div class="process-step-title">${step.stepName}</div>
            <div class="process-formula">公式：${step.formula}</div>
            ${step.process.map(p => `<div>${p}</div>`).join('')}
            <div style="color: #FF6B6B; font-weight: 600; margin-top: 8px;">
                结果：${formatCurrency(step.result)}
            </div>
        </div>
    `).join('');
    
    // 警告提示
    if (warnings && warnings.length > 0) {
        setTimeout(() => {
            showToast(warnings[0], 3000);
        }, 800);
    }
    
    // 保存结果数据（用于历史记录）
    appData.lastResult = data;
}

/**
 * 保存测算结果到历史
 */
function saveResult() {
    if (!appData.lastResult) {
        showToast('没有可保存的测算结果');
        return;
    }
    
    const historyItem = {
        result: appData.lastResult,
        params: Storage.getCalculateParams(),
        userInfo: Storage.getUserInfo()
    };
    
    Storage.saveHistory(historyItem);
    showToast('保存成功');
}
