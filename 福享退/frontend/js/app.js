/**
 * 应用主逻辑
 */

// 当前页面
let currentPage = 'home';

// 页面栈
let pageStack = ['home'];

// 用户选择的参数
let appData = {
    personType: 'enterprise', // 人员类型：enterprise企业，government机关
    gender: 'male',           // 性别：male男，female女
    retireType: 'worker',     // 退休类型：worker工人，cadre干部，special特殊工种
    paymentDetails: []        // 缴费明细
};

/**
 * 初始化应用
 */
async function initApp() {
    // 自动登录（创建游客用户）
    await UserApi.autoLogin();
    
    // 初始化指南数据
    initGuideData();
    
    // 加载历史记录
    loadHistory();
}

/**
 * 切换Tab
 */
function switchTab(tab) {
    document.querySelectorAll('.tab-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // 跳转到对应页面
    if (tab === 'home') {
        goToPage('home', false);
    } else if (tab === 'history') {
        goToPage('history', false);
    } else if (tab === 'mine') {
        showToast('个人中心功能开发中');
    }
}

/**
 * 页面跳转
 */
function goToPage(page, pushStack = true) {
    // 隐藏当前页面
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // 更新导航栏
    updateNavBar(page);
    
    // 更新页面栈
    if (pushStack && currentPage !== page) {
        pageStack.push(page);
    }
    
    currentPage = page;
    
    // 页面特定初始化
    if (page === 'history') {
        loadHistory();
    }
}

/**
 * 返回上一页
 */
function goBack() {
    if (pageStack.length > 1) {
        pageStack.pop();
        const prevPage = pageStack[pageStack.length - 1];
        goToPage(prevPage, false);
    }
}

/**
 * 更新导航栏
 */
function updateNavBar(page) {
    const navTitle = document.getElementById('navTitle');
    const navBack = document.getElementById('navBack');
    
    const titleMap = {
        'home': '福享退',
        'upload': '上传缴费明细',
        'detail': '缴费明细',
        'input': '补充信息',
        'result': '测算结果',
        'history': '历史记录',
        'guide': '退休办理指南',
        'manual': '手动测算'
    };
    
    navTitle.textContent = titleMap[page] || '福享退';
    
    // 首页不显示返回按钮
    if (page === 'home') {
        navBack.style.display = 'none';
    } else {
        navBack.style.display = 'block';
    }
}

/**
 * 处理文件选择
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 检查文件类型
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        showToast('请选择PDF格式的文件');
        return;
    }
    
    // 检查文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
        showToast('文件大小不能超过10MB');
        return;
    }
    
    // 显示文件信息
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('fileInfo').style.display = 'block';
    document.getElementById('uploadBtn').style.display = 'block';
    
    // 保存文件对象
    appData.selectedFile = file;
}

/**
 * 开始上传解析
 */
async function startUpload() {
    if (!appData.selectedFile) {
        showToast('请先选择文件');
        return;
    }
    
    // 显示进度
    const progressEl = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    progressEl.style.display = 'block';
    
    try {
        const result = await PensionApi.uploadAndParse(appData.selectedFile, (progress) => {
            progressFill.style.width = `${progress}%`;
        });
        
        if (result.code === 0) {
            // 保存数据
            appData.paymentDetails = result.data.paymentDetails;
            Storage.setPaymentDetails(result.data.paymentDetails);
            Storage.setUserInfo(result.data.personalInfo);
            
            showToast('解析成功');
            
            // 跳转到明细页
            setTimeout(() => {
                renderPaymentDetail(result.data);
                goToPage('detail');
            }, 500);
        } else {
            showToast(result.message || '解析失败');
        }
    } catch (error) {
        showToast('上传失败，请重试');
        console.error(error);
    } finally {
        progressEl.style.display = 'none';
        progressFill.style.width = '0%';
    }
}

/**
 * 使用示例数据
 */
function useDemoData() {
    showLoading('加载示例数据中...');
    
    setTimeout(() => {
        const mockData = {
            personalInfo: {
                name: '张三',
                idCard: '350121199001011234',
                gender: '男'
            },
            paymentDetails: Request.generateDemoPaymentData(),
            summary: {
                totalMonths: 240,
                avgPaymentBase: 5850,
                startDate: '2004-01',
                endDate: '2024-12',
                hasGap: false
            }
        };
        
        appData.paymentDetails = mockData.paymentDetails;
        Storage.setPaymentDetails(mockData.paymentDetails);
        Storage.setUserInfo(mockData.personalInfo);
        
        renderPaymentDetail(mockData);
        hideLoading();
        goToPage('detail');
    }, 1000);
}

/**
 * 渲染缴费明细
 */
function renderPaymentDetail(data) {
    const { personalInfo, paymentDetails, summary } = data;
    
    // 个人信息
    document.getElementById('userName').textContent = personalInfo.name;
    document.getElementById('userIdCard').textContent = maskIdCard(personalInfo.idCard);
    document.getElementById('totalMonths').textContent = `${summary.totalMonths}个月（${(summary.totalMonths / 12).toFixed(1)}年）`;
    document.getElementById('avgBase').textContent = '¥' + formatNumber(summary.avgPaymentBase);
    
    // 缴费明细列表（只显示最近24条）
    const listEl = document.getElementById('paymentListContent');
    const recentDetails = paymentDetails.slice(-24).reverse();
    
    listEl.innerHTML = recentDetails.map(item => `
        <div class="payment-item">
            <div class="month">${item.yearMonth}</div>
            <div class="base">¥${formatNumber(item.paymentBase)}</div>
            <div class="months">${item.paymentMonths}个月</div>
        </div>
    `).join('');
}

/**
 * 选择人员类型
 */
function selectPersonType(type, el) {
    appData.personType = type;
    
    document.querySelectorAll('.radio-item').forEach(item => {
        item.classList.remove('active');
    });
    el.classList.add('active');
}

/**
 * 选择性别
 */
function selectGender(gender, el) {
    appData.gender = gender;
    
    // 更新对应单选框的选中状态（需要找到性别单选框组）
    const group = el.closest('.form-radio-group');
    if (group) {
        group.querySelectorAll('.radio-item').forEach(item => {
            item.classList.remove('active');
        });
        el.classList.add('active');
    }
}

/**
 * 展开/收起详情
 */
function toggleDetail(id) {
    const content = document.getElementById(id);
    const arrow = content.previousElementSibling.querySelector('.arrow');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        arrow.textContent = '▼';
    } else {
        content.style.display = 'none';
        arrow.textContent = '▶';
    }
}

/**
 * 展开/收起多方案对比
 */
function toggleSchemeCompare() {
    const content = document.getElementById('schemeCompareContent');
    const arrow = document.getElementById('schemeArrow');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        arrow.textContent = '▼';
    } else {
        content.style.display = 'none';
        arrow.textContent = '▶';
    }
}

/**
 * 选择方案对比项
 */
function selectScheme(scheme) {
    // 更新按钮状态
    document.querySelectorAll('.scheme-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`scheme-${scheme}`).classList.add('active');
    
    // 更新表格高亮
    const rows = document.querySelectorAll('#page-result .compare-row:not(.header)');
    rows.forEach(row => {
        const cells = row.querySelectorAll('.compare-cell');
        cells.forEach(cell => {
            cell.classList.remove('highlight');
        });
        
        // 高亮对应方案列
        const schemeOrder = ['self', '60', '100', '300'];
        const index = schemeOrder.indexOf(scheme);
        if (cells[index]) {
            cells[index].classList.add('highlight');
        }
    });
}

/**
 * 切换FAQ
 */
function toggleFaq(el) {
    el.classList.toggle('open');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);
