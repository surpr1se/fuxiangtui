        let currentPage = 'home';
        let pageHistory = ['home'];
        
        function goToPage(pageName) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById('page-' + pageName).classList.add('active');
            
            document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            
            const tabMap = {
                'home': 0,
                'upload': 1,
                'payment': 1,
                'info': 1,
                'result': 1,
                'history': 2,
                'profile': 2
            };
            if (tabMap[pageName] !== undefined) {
                document.querySelectorAll('.tab-item')[tabMap[pageName]].classList.add('active');
            }
            
            const titles = {
                'home': '福享退',
                'upload': 'PDF上传',
                'payment': '缴费明细',
                'info': '补充信息',
                'result': '测算结果',
                'history': '历史记录',
                'profile': '个人中心',
                'policy-1': '养老保险政策解读',
                'policy-2': '待遇计算公式说明',
                'policy-3': '福建省社保政策',
                'policy-4': '用户服务协议',
                'policy-5': '隐私政策',
                'policy-6': '退休手续办理指南',
                'scheme-compare': '多方案对比分析'
            };
            document.getElementById('pageTitle').textContent = titles[pageName];
            
            document.querySelector('.nav-back').style.display = pageName === 'home' ? 'none' : 'block';
            
            if (currentPage !== pageName) {
                pageHistory.push(pageName);
            }
            currentPage = pageName;
        }
        
        function goBack() {
            if (pageHistory.length > 1) {
                pageHistory.pop();
                const prevPage = pageHistory[pageHistory.length - 1];
                goPage(prevPage);
                pageHistory.pop();
            }
        }
        
        function mockUpload() {
            document.getElementById('loading').classList.add('show');
            setTimeout(() => {
                document.getElementById('loading').classList.remove('show');
                goPage('payment');
            }, 1500);
        }
        
        function toggleDetail(id) {
            const el = document.getElementById(id);
            el.style.display = el.style.display === 'none' ? 'block' : 'none';
        }
        
        document.querySelectorAll('.detail-content').forEach(el => {
            el.style.display = 'none';
        });
        
        // 编辑缴费明细弹窗功能
        let currentEditYear = 2024;
        const originalBase = {
            2024: 6000,
            2023: 5800,
            2022: 5500
        };
        
        function openEditModal(year) {
            currentEditYear = year;
            document.getElementById('editModalTitle').textContent = '编辑' + year + '年缴费明细';
            document.getElementById('editModal').classList.add('show');
            
            // 根据年份设置不同的初始数据（模拟部分月份已修改）
            const inputs = document.querySelectorAll('.month-input');
            const base = originalBase[year] || 6000;
            
            // 模拟：前6个月是原值，后6个月是新值，让用户一打开就能看到变更效果
            inputs.forEach((input, index) => {
                if (index < 6) {
                    input.value = base;  // 前6个月原值
                } else {
                    input.value = Math.round(base * 1.05);  // 后6个月增长5%，模拟变更
                }
            });
            
            calculateYearAvg();  // 自动计算并显示变更提示
        }
        
        function closeEditModal() {
            document.getElementById('editModal').classList.remove('show');
        }
        
        function calculateYearAvg() {
            const inputs = document.querySelectorAll('.month-input');
            let total = 0;
            let count = 0;
            
            inputs.forEach(input => {
                const value = parseFloat(input.value) || 0;
                total += value;
                count++;
            });
            
            const avg = Math.round(total / count);
            document.getElementById('yearAvgBase').textContent = '¥ ' + avg.toLocaleString();
            
            // 如果平均值与原基数不同，显示变更提示
            if (avg !== originalBase[currentEditYear]) {
                const notice = document.getElementById('changeNotice');
                notice.style.display = 'block';
                notice.querySelectorAll('.change-row')[0].querySelector('.change-old').textContent = '¥ ' + originalBase[currentEditYear];
                notice.querySelectorAll('.change-row')[1].querySelector('.change-new').textContent = '¥ ' + avg;
            } else {
                document.getElementById('changeNotice').style.display = 'none';
            }
        }
        
        function saveEditModal() {
            // 计算新的平均基数
            const inputs = document.querySelectorAll('.month-input');
            let total = 0;
            inputs.forEach(input => total += parseFloat(input.value) || 0);
            const newAvg = Math.round(total / 12);
            const original = originalBase[currentEditYear];
            
            // 更新列表页显示
            const tag = document.getElementById('tag-' + currentEditYear);
            const base = document.getElementById('base-' + currentEditYear);
            
            if (newAvg !== original) {
                // 有修改：显示变更标记和变更前后对比
                if (tag) tag.style.display = 'inline-block';
                if (base) base.innerHTML = '缴费基数：<span style="text-decoration:line-through;color:#999;">' + original + '</span> > <span style="color:#FF6B6B;font-weight:600;">' + newAvg + '</span> 元';
            } else {
                // 无修改：只显示缴费基数
                if (tag) tag.style.display = 'none';
                if (base) base.textContent = '缴费基数：' + original + '元';
            }
            
            alert('模拟：' + currentEditYear + '年缴费明细已保存');
            closeEditModal();
        }
        
        // 展开/收起未来缴费年度明细
        function toggleFutureDetail() {
            const detail = document.getElementById('futureYearDetail');
            const icon = document.getElementById('futureToggleIcon');
            if (detail.style.display === 'none') {
                detail.style.display = 'block';
                icon.textContent = '▲';
            } else {
                detail.style.display = 'none';
                icon.textContent = '▼';
            }
        }
        
        // 展开/收起多方案对比
        function toggleSchemeCompare() {
            const content = document.getElementById('scheme-compare-content');
            const arrow = document.getElementById('scheme-compare-arrow');
            if (content.style.display === 'none') {
                content.style.display = 'block';
                arrow.textContent = '▼';
            } else {
                content.style.display = 'none';
                arrow.textContent = '▶';
            }
        }
        
        // 选择当前方案（高亮显示）
        function selectCurrentScheme(scheme) {
            // 重置所有方案样式
            ['self', '60', '100', '300'].forEach(s => {
                const schemeBtn = document.getElementById('current-scheme-' + s);
                schemeBtn.style.background = '#F3F4F6';
                schemeBtn.style.border = '2px solid #E5E7EB';
                schemeBtn.querySelector('div').style.color = '#374151';
                schemeBtn.querySelector('div:last-child').style.color = '#6B7280';
                
                // 重置表格行
                for (let i = 0; i < 4; i++) {
                    const row = document.getElementById('row-' + s + (i === 0 ? '' : '-' + i));
                    if (row) {
                        row.style.background = 'transparent';
                        const cells = row.querySelectorAll('div');
                        cells.forEach(cell => {
                            cell.style.color = cell.style.color === 'rgb(6, 95, 70)' ? '#333' : cell.style.color;
                        });
                    }
                }
            });
            
            // 高亮选中方案
            const selectedBtn = document.getElementById('current-scheme-' + scheme);
            selectedBtn.style.background = '#ECFDF5';
            selectedBtn.style.border = '2px solid #10B981';
            selectedBtn.querySelector('div').style.color = '#065F46';
            selectedBtn.querySelector('div:last-child').style.color = '#047857';
            
            // 高亮表格行
            for (let i = 0; i < 4; i++) {
                const row = document.getElementById('row-' + scheme + (i === 0 ? '' : '-' + i));
                if (row) {
                    row.style.background = '#ECFDF5';
                    const cells = row.querySelectorAll('div');
                    cells.forEach(cell => {
                        cell.style.color = '#065F46';
                    });
                }
            }
        }
        
        // 未来缴费选项选择
        function selectFutureOption(el, mode) {
            document.querySelectorAll('.future-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            el.classList.add('selected');
            
            const baseAmount = 86400;
            const yearList = document.getElementById('futureYearList');
            const baseValues = [8925, 9371, 9840, 10332, 10849, 11391];
            const years = [2025, 2026, 2027, 2028, 2029, 2030];
            const realBase = 6150; // 本人最新缴费基数
            const growthRate = 1.05; // 年增长率5%
            
            let html = '';
            let totalAmount = 0;
            
            if (mode === 'real') {
                // 按本人最新缴费基数，逐年增长
                for (let i = 0; i < years.length; i++) {
                    const value = Math.round(realBase * Math.pow(growthRate, i));
                    html += '<div style="display:flex;justify-content:space-between;padding:3px 0;"><span>' + years[i] + '年</span><span>¥ ' + value.toLocaleString() + '（本人基数）</span></div>';
                    totalAmount += value * 8 * 12; // 8%计入个人账户
                }
            } else {
                // 按社平比例
                for (let i = 0; i < years.length; i++) {
                    const value = Math.round(baseValues[i] * mode / 100);
                    html += '<div style="display:flex;justify-content:space-between;padding:3px 0;"><span>' + years[i] + '年</span><span>¥ ' + value.toLocaleString() + ' × ' + mode + '%</span></div>';
                    totalAmount += value * 8 * 12; // 8%计入个人账户
                }
            }
            
            yearList.innerHTML = html;
            document.getElementById('futureTotalAmount').textContent = '¥ ' + Math.round(totalAmount / 100).toLocaleString();
        }
        
        // 方案选择切换
        function selectScheme(scheme) {
            // 重置所有方案样式
            document.querySelectorAll('[id^="scheme-"]').forEach(el => {
                el.style.background = '#F3F4F6';
                el.style.borderColor = '#E5E7EB';
                el.querySelectorAll('div')[0].style.color = '#374151';
                el.querySelectorAll('div')[1].style.color = '#6B7280';
                const badge = el.querySelector('div:nth-child(3)');
                if (badge) badge.style.visibility = 'hidden';
            });
            
            // 设置选中方案样式
            const selected = document.getElementById('scheme-' + scheme);
            selected.style.background = scheme === '60' ? '#ECFDF5' : '#ECFDF5';
            selected.style.borderColor = scheme === '60' ? '#10B981' : '#10B981';
            selected.querySelectorAll('div')[0].style.color = '#065F46';
            selected.querySelectorAll('div')[1].style.color = '#047857';
            
            // 给60%方案添加"推荐"标签
            if (scheme === '60') {
                const badge = selected.querySelector('div:nth-child(3)');
                if (badge) badge.style.visibility = 'visible';
            }
            
            // 如果是其他方案，也要显示选中状态标签
            if (scheme !== '60') {
                const badge = selected.querySelector('div:nth-child(3)');
                if (badge) {
                    badge.style.visibility = 'visible';
                    badge.textContent = '当前选择';
                }
            }
        }

// ==================== 业务数据 ====================
window.appData = {
    // 当前用户
    user: null,
    userId: null,
    
    // 缴费明细数据
    paymentDetails: [],
    
    // 个人信息
    personalInfo: {},
    
    // 测算参数
    calculateParams: {
        retirementIdentity: '工人',
        retirementAge: 60,
        retirementYear: new Date().getFullYear() + 1,
        visualYears: 0,
        personalAccountAmount: null
    },
    
    // 测算结果
    calculateResult: null,
    
    // 历史记录
    historyList: []
};

// ==================== 页面初始化 ====================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 福享退页面初始化...');
    
    try {
        // 1. 自动登录
        const loginResult = await UserApi.autoLogin();
        if (loginResult.code === 0) {
            appData.userId = localStorage.getItem('userId');
            console.log('✅ 用户已登录，userId:', appData.userId);
        }
        
        // 2. 加载历史记录
        await loadHistory();
        
    } catch (error) {
        console.error('❌ 初始化失败:', error);
    }
});

// ==================== 核心业务函数 ====================

/**
 * 处理文件选择
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 检查文件类型
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        showToast('请选择PDF格式的文件');
        event.target.value = '';
        return;
    }
    
    // 检查文件大小（20MB）
    if (file.size > 20 * 1024 * 1024) {
        showToast('文件大小不能超过20MB');
        event.target.value = '';
        return;
    }
    
    console.log('📄 已选择文件:', file.name, (file.size / 1024 / 1024).toFixed(2) + 'MB');
    
    // 开始上传解析
    startUpload(file);
    
    // 清空input，允许重复选择同一文件
    event.target.value = '';
}

/**
 * 开始PDF上传解析
 */
async function startUpload(file) {
    try {
        const loadingEl = document.getElementById('loading');
        loadingEl.classList.add('show');
        
        // 上传解析
        const result = await PensionApi.uploadAndParse(file, (progress) => {
            console.log('📤 上传进度:', progress + '%');
        });
        
        loadingEl.classList.remove('show');
        
        if (result.code === 0) {
            // 保存解析结果
            appData.paymentDetails = result.data.paymentDetails || [];
            appData.personalInfo = result.data.personalInfo || {};
            
            showToast('PDF解析成功');
            setTimeout(() => goToPage('payment'), 500);
        } else {
            showToast(result.message || '解析失败');
        }
    } catch (error) {
        console.error('上传失败:', error);
        showToast('上传失败: ' + error.message);
        document.getElementById('loading').classList.remove('show');
    }
}

/**
 * 开始测算养老金
 */
async function startCalculate() {
    try {
        showLoading('测算中，请稍候...');
        
        const result = await PensionApi.calculate({
            paymentDetails: appData.paymentDetails,
            personalInfo: appData.personalInfo,
            retirementIdentity: appData.calculateParams.retirementIdentity,
            retirementAge: appData.calculateParams.retirementAge,
            retirementYear: appData.calculateParams.retirementYear,
            visualYears: appData.calculateParams.visualYears,
            personalAccountAmount: appData.calculateParams.personalAccountAmount
        });
        
        hideLoading();
        
        if (result.code === 0) {
            appData.calculateResult = result.data;
            showToast('测算完成');
            setTimeout(() => goToPage('result'), 500);
        } else {
            showToast(result.message || '测算失败');
        }
    } catch (error) {
        hideLoading();
        console.error('测算失败:', error);
        showToast('测算失败: ' + error.message);
    }
}

/**
 * 加载历史记录
 */
async function loadHistory() {
    try {
        const result = await PensionApi.getHistoryList();
        if (result.code === 0) {
            appData.historyList = result.data.list || [];
            renderHistoryList();
        }
    } catch (error) {
        console.error('加载历史记录失败:', error);
    }
}

/**
 * 渲染历史记录列表
 */
function renderHistoryList() {
    const container = document.getElementById('historyList');
    if (!container) return;
    
    if (appData.historyList.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px 20px;color:#999;">
                <div style="font-size:48px;margin-bottom:16px;">📋</div>
                <div>暂无测算记录</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = appData.historyList.map(item => `
        <div class="history-item" onclick="viewHistoryDetail('${item.calculateNo}')">
            <div class="history-item-title">${item.userName || '养老金测算'}</div>
            <div class="history-item-info">
                <span>${item.calculateTime}</span>
                <span>预计 ¥${item.monthlyPension?.toLocaleString() || 0}/月</span>
            </div>
        </div>
    `).join('');
}

/**
 * 查看历史详情
 */
function viewHistoryDetail(calculateNo) {
    showToast('功能开发中');
}

// ==================== 工具函数 ====================

/**
 * 显示Toast提示
 */
function showToast(message, duration = 2000) {
    // 先移除旧的
    const oldToast = document.querySelector('.toast-message');
    if (oldToast) oldToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.75);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        animation: fadeIn 0.2s ease;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.2s';
        setTimeout(() => toast.remove(), 200);
    }, duration);
}

/**
 * 显示加载中
 */
function showLoading(text = '加载中...') {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.querySelector('div').textContent = text;
        loading.classList.add('show');
    }
}

/**
 * 隐藏加载中
 */
function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.remove('show');
    }
}

