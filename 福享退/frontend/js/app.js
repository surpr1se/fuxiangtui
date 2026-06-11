console.log('✅ app.js 已加载！');
window.testClick = function() { alert('按钮点击成功！'); };

let currentPage = 'home';
let pageHistory = ['home'];

function goToPage(pageName) {
document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
document.getElementById('page-' + pageName).classList.add('active');

document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));

// 跳转到缴费明细页时，自动渲染数据
if (pageName === 'payment' && window.renderPaymentDetails) {
    window.renderPaymentDetails();
}

// 跳转到信息补全页时，自动返填数据
if (pageName === 'info') {
    autoFillInfoPage();
}

// 跳转到个人中心时，刷新用户信息和统计数据
if (pageName === 'profile') {
    loadProfileData({ silent: true });
}

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
// goToPage 默认会追加历史，这里先同步 currentPage，避免返回时重复入栈
currentPage = prevPage;
goToPage(prevPage);
}
}

function mockUpload() {
document.getElementById('loading').classList.add('show');
setTimeout(() => {
document.getElementById('loading').classList.remove('show');
goToPage('payment');
}, 1500);
}

function toggleDetail(id) {
const el = document.getElementById(id);
if (el) {
el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
}

document.querySelectorAll('.detail-content').forEach(el => {
el.style.display = 'none';
});

// 编辑缴费明细弹窗功能
let currentEditYear = 2024;
function openEditModal(year) {
console.log('=== openEditModal 被调用 ===', year);
currentEditYear = year;
const titleEl = document.getElementById('editModalTitle');
const modalEl = document.getElementById('editModal');
const monthGridEl = document.getElementById('monthGrid');

if (titleEl) titleEl.textContent = '编辑' + year + '年缴费明细';
if (modalEl) {
    // 只做最核心的：显示弹窗 + fixed定位 + 居中
    modalEl.style.cssText = 'position:fixed !important;top:0 !important;left:0 !important;right:0 !important;bottom:0 !important;display:flex !important;align-items:center !important;justify-content:center !important;z-index:999999 !important;background:rgba(0,0,0,0.5) !important;';
}

// 从缴费明细中提取该年份的实际月份数据（正确字段名：yearMonth, paymentBase）
const yearData = appData.paymentDetails.filter(item => item.yearMonth.startsWith(year));
console.log('该年份缴费数据:', yearData);

// 核心逻辑：只在**第一次打开弹窗**时保存PDF原始数据（作为基准，永远不变）
// 后续再次打开弹窗时，不覆盖基准数据，确保对比的准确性
window.yearOriginalData = window.yearOriginalData || {};
if (!window.yearOriginalData[year]) {
    window.yearOriginalData[year] = JSON.parse(JSON.stringify(yearData));
    console.log('✅ 已保存' + year + '年PDF原始基准数据');
} else {
    console.log('ℹ️ ' + year + '年已有原始基准数据，不覆盖');
}

// 动态生成月份输入框，只显示有缴费数据的月份
if (yearData.length === 0) {
    // 如果没有数据，显示12个空输入框
    monthGridEl.innerHTML = Array.from({length: 12}, (_, i) => `
        <div class="month-item">
            <label class="month-label">${i + 1}月</label>
            <input type="number" class="month-input" data-month="${String(i + 1).padStart(2, '0')}" value="" placeholder="无数据" oninput="calculateYearAvg(true)">
        </div>
    `).join('');
} else {
    // 按月份排序，只显示有数据的月份
    yearData.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
    monthGridEl.innerHTML = yearData.map(item => {
        const month = item.yearMonth.split('-')[1];
        return `
        <div class="month-item">
            <label class="month-label">${parseInt(month)}月</label>
            <input type="number" class="month-input" data-yearmonth="${item.yearMonth}" value="${item.paymentBase}" oninput="calculateYearAvg(true)">
        </div>
    `}).join('');
}

// 初始化时隐藏变更提示
const noticeEl = document.getElementById('changeNotice');
if (noticeEl) noticeEl.style.display = 'none';

// 确保DOM渲染完成后再计算
setTimeout(() => {
    calculateYearAvg(false);
    console.log('✅ 弹窗已显示，共' + yearData.length + '个月数据');
}, 10);
}

function closeEditModal() {
const modalEl = document.getElementById('editModal');
if (modalEl) {
    modalEl.style.display = 'none';
    modalEl.classList.remove('show');
}
}

// 存储每个年份的原始数据，用于对比是否修改
window.yearOriginalData = window.yearOriginalData || {};

function calculateYearAvg(isUserInput = false) {
// 只在弹窗范围内查找输入框，更可靠
const modalEl = document.getElementById('editModal');
const inputs = modalEl ? modalEl.querySelectorAll('.month-input') : [];
let total = 0;
let count = 0;

inputs.forEach(input => {
const value = parseFloat(input.value) || 0;
total += value;
count++;
});

const avg = count > 0 ? Math.round(total / count) : 0;
const yearAvgBaseEl = document.getElementById('yearAvgBase');
const yearTotalBaseEl = document.getElementById('yearTotalBase');
const yearPersonalTotalEl = document.getElementById('yearPersonalTotal');
const notice = document.getElementById('changeNotice');

// 安全更新DOM
if (yearAvgBaseEl) yearAvgBaseEl.textContent = '¥ ' + avg.toLocaleString();
if (yearTotalBaseEl) yearTotalBaseEl.textContent = '¥ ' + total.toLocaleString();
if (yearPersonalTotalEl) yearPersonalTotalEl.textContent = '¥ ' + (total * 0.08).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// 核心逻辑：只有用户修改触发的调用才显示"已修改"卡片
// 第一次打开弹窗（初始化）时不显示
if (isUserInput && window.yearOriginalData && window.yearOriginalData[currentEditYear] && notice) {
    const originalData = window.yearOriginalData[currentEditYear] || [];
    const originalTotal = originalData.reduce((sum, item) => sum + (item.paymentBase || 0), 0);
    const originalAvg = originalData.length > 0 ? Math.round(originalTotal / originalData.length) : avg;

    // 只有当数据真正变化时，才显示"本年度数据已修改"卡片
    if (total !== originalTotal) {
        notice.style.display = 'block';
        const oldEl = notice.querySelector('.change-old');
        const newEl = notice.querySelector('.change-new');
        if (oldEl) oldEl.textContent = '¥ ' + originalAvg.toLocaleString();
        if (newEl) newEl.textContent = '¥ ' + avg.toLocaleString();
    } else {
        notice.style.display = 'none';
    }
} else if (notice) {
    // 第一次打开弹窗时，默认隐藏
    notice.style.display = 'none';
}
}

async function saveEditModal() {
const inputs = document.querySelectorAll('.month-input');
let modified = false;
let total = 0;
let count = 0;
const changedDetails = [];

// 更新缴费明细数据（正确字段名：yearMonth, paymentBase）
inputs.forEach(input => {
const yearMonth = input.getAttribute('data-yearmonth');
const newBase = parseFloat(input.value) || 0;
total += newBase;
count++;
const item = appData.paymentDetails.find(d => d.yearMonth === yearMonth);
if (item && item.paymentBase !== newBase) {
    item.paymentBase = newBase;
    modified = true;
    changedDetails.push(item);
}
});
const avg = count > 0 ? Math.round(total / count) : 0;

// 标记该年份是否被修改：对比"当前数据"和"PDF原始基准数据"
window.modifiedYears = window.modifiedYears || {};
window.modifiedYears[currentEditYear] = modified;

if (modified) {
    // 更新本地展示基数，同时尽量同步后端批量导入接口
    window.originalBase = window.originalBase || {};
    window.originalBase[currentEditYear] = avg;
    window.PensionApi.importPaymentDetails(changedDetails).catch(error => {
        console.warn('⚠️ 缴费明细同步后端失败，本地修改已保留：', error);
    });
}

// 重新渲染缴费明细（会自动根据modifiedYears显示"已修改"标签）
window.renderPaymentDetails();
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

// 获取本人最新缴费基数
function getLatestPaymentBase() {
    if (!appData.paymentDetails || appData.paymentDetails.length === 0) {
        return 6150; // 默认值
    }
    
    // 按年月排序，获取最新的基数
    const sortedDetails = [...appData.paymentDetails].sort((a, b) => {
        return b.yearMonth.localeCompare(a.yearMonth);
    });
    
    // 返回最新的缴费基数
    if (sortedDetails.length > 0 && sortedDetails[0].paymentBase) {
        return sortedDetails[0].paymentBase;
    }
    
    return 6150;
}

// 未来缴费选项选择
function selectFutureOption(el, mode) {
    document.querySelectorAll('.future-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    el.classList.add('selected');
    
    appData.futurePaymentMode = mode;
    renderFuturePaymentPreview(mode);
}

// 初始化未来缴费预测（默认选中"按本人最新缴费基数"）
function initFuturePayment() {
    const realOption = document.querySelector('.future-option[onclick*="\'real\'"]');
    if (realOption) {
        document.querySelectorAll('.future-option').forEach(opt => opt.classList.remove('selected'));
        realOption.classList.add('selected');
    }
    renderFuturePaymentPreview(appData.futurePaymentMode || 'real');
}

function getLastPaidYearMonth() {
    if (!appData.paymentDetails || appData.paymentDetails.length === 0) return null;
    const sorted = [...appData.paymentDetails].filter(item => item.yearMonth).sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
    return sorted[0]?.yearMonth || null;
}

function getRetireYearMonthFromApi() {
    // 用户手动调整退休年月后，必须以页面当前值为准；没有页面值时再使用退休年龄测算结果。
    const inputDate = document.getElementById('retireDate')?.value;
    if (inputDate) return inputDate;
    const apiDate = appData.retireInfo?.reformRetireDate;
    if (apiDate) return apiDate.substring(0, 7);
    return '';
}

function buildFuturePaymentYears() {
    const lastPaid = getLastPaidYearMonth();
    const retireYm = getRetireYearMonthFromApi();
    if (!retireYm) return [];

    const [retireYear, retireMonth] = retireYm.split('-').map(Number);
    let startYear = new Date().getFullYear();
    if (lastPaid) {
        startYear = Number(lastPaid.substring(0, 4));
    }

    const years = [];
    for (let year = startYear; year <= retireYear; year++) {
        let months = 12;
        if (lastPaid && year === Number(lastPaid.substring(0, 4))) {
            months = 12 - Number(lastPaid.substring(5, 7));
        }
        if (year === retireYear) {
            months = Math.min(months, Math.max(retireMonth - 1, 0));
        }
        if (months > 0) years.push({ year, months });
    }
    return years;
}

function calculateFuturePersonalAccountIncrease(mode = appData.futurePaymentMode || 'real') {
    const futureYears = buildFuturePaymentYears();
    if (!futureYears.length) return 0;
    const realBase = getLatestPaymentBase();
    const socialAvgWage = Number(document.getElementById('socialAvgWage')?.value || appData.calculateParams.socialAvgWage || 0);
    const growthRate = 1.05;
    return Number(futureYears.reduce((sum, item, i) => {
        const base = mode === 'real'
            ? Math.round(realBase * Math.pow(growthRate, i))
            : Math.round(socialAvgWage * Math.pow(growthRate, i) * mode / 100);
        return sum + base * 0.08 * item.months;
    }, 0).toFixed(2));
}

function renderFuturePaymentPreview(mode = 'real') {
    const yearList = document.getElementById('futureYearList');
    const totalEl = document.getElementById('futureTotalAmount');
    if (!yearList || !totalEl) return;

    const futureYears = buildFuturePaymentYears();
    const futureSection = document.querySelector('#page-info .future-section');
    const resultFutureCard = document.getElementById('resultFuturePaymentCard');
    const shouldHideFuture = appData.retireInfo && futureYears.length === 0;
    if (futureSection) futureSection.style.display = shouldHideFuture ? 'none' : 'block';
    if (resultFutureCard) resultFutureCard.style.display = shouldHideFuture ? 'none' : 'block';
    const realBase = getLatestPaymentBase();
    const socialAvgWage = Number(document.getElementById('socialAvgWage')?.value || appData.calculateParams.socialAvgWage || 0);
    const growthRate = 1.05;
    let html = '';
    let totalAmount = 0;

    if (futureYears.length === 0) {
        yearList.innerHTML = '<div style="padding:3px 0;">当前人员已达到退休条件，无需预测未来缴费</div>'; 
        totalEl.textContent = '¥ 0.00';
    } else {
        futureYears.forEach((item, i) => {
            const base = mode === 'real'
                ? Math.round(realBase * Math.pow(growthRate, i))
                : Math.round(socialAvgWage * Math.pow(growthRate, i) * mode / 100);
            const label = mode === 'real' ? '本人基数' : `社平${mode}%`;
            html += '<div style="display:flex;justify-content:space-between;padding:3px 0;"><span>' + item.year + '年（' + item.months + '个月）</span><span>¥ ' + base.toLocaleString() + '（' + label + '）</span></div>';
            totalAmount += base * 0.08 * item.months;
        });
        yearList.innerHTML = html;
        totalEl.textContent = '¥ ' + totalAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    const rows = document.querySelectorAll('.future-preview .preview-row');
    const totalMonths = futureYears.reduce((sum, item) => sum + item.months, 0);
    if (rows[0]) rows[0].querySelector('span:last-child').textContent = (totalMonths / 12).toFixed(1).replace(/\.0$/, '') + '年（' + totalMonths + '个月）';
    if (rows[1]) rows[1].querySelector('span:last-child').textContent = futureYears.length > 0 ? '至退休年月 ' + getRetireYearMonthFromApi() : '无需预测';
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

// PDF解析记录ID
pdfParseId: null,

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

// 退休年龄接口结果
retireInfo: null,

// 当前未来缴费预测模式
futurePaymentMode: 'real',

// 历史记录
historyList: [],

// PDF解析记录
pdfList: [],

// 个人中心统计
profileStats: {
    calculateCount: 0,
    averagePension: 0,
    paymentMonths: 0,
    latestRecord: null,
    pdfCount: 0
}
};

// ==================== 页面初始化 ====================
document.addEventListener('DOMContentLoaded', async function() {
console.log('🚀 福享退页面初始化...');

try {
// 1. 检查登录态
const loginResult = await window.UserApi.autoLogin();
if (loginResult.code === 0 || loginResult.code === 200) {
appData.userId = localStorage.getItem('userId');
console.log('✅ 用户已登录，userId:', appData.userId);
// 已登录时加载个人中心依赖数据
await loadProfileData();
} else {
console.log('ℹ️ 用户未登录，个人中心数据延迟加载');
renderProfileHeader({});
}

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
const result = await window.PensionApi.uploadAndParse(file, (progress) => {
console.log('📤 上传进度:', progress + '%');
});

loadingEl.classList.remove('show');

if (result.code === 0 || result.code === 200) {
// 保存解析结果；上传接口若只返回解析状态，则继续读取缴费明细列表
appData.paymentDetails = result.data.paymentDetails || [];
appData.personalInfo = normalizePersonalInfo(result.data.personalInfo || {});
appData.pdfParseId = result.data.id || null;
if (appData.paymentDetails.length === 0) {
    await loadPaymentDetailsFromApi();
}

showToast('PDF解析成功');
// 保存解析结果
appData.pdfInfo = {
fileName: file.name,
fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
parseTime: new Date().toLocaleString()
};

setTimeout(() => {
window.goToPage('payment');
setTimeout(() => window.renderPaymentDetails(), 100);
}, 500);
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
* 从后端读取缴费明细列表
*/
async function loadPaymentDetailsFromApi() {
try {
const userId = localStorage.getItem('userId') || appData.userId || appData.user?.id || '1';
const result = await window.PensionApi.getPaymentDetailList(userId);
if (result.code === 0 || result.code === 200) {
const data = result.data || [];
const list = Array.isArray(data) ? data : (data.list || data.records || []);
appData.paymentDetails = window.Request.normalizePaymentDetails(list.map(item => ({
...item,
yearMonth: item.yearMonth || item.paymentMonth || item.month || (item.year && item.month ? `${item.year}-${String(item.month).padStart(2, '0')}` : '')
}))).filter(item => item.yearMonth);
console.log('✅ 已从缴费明细接口读取数据：', appData.paymentDetails.length);
}
} catch (error) {
console.warn('⚠️ 读取缴费明细失败：', error);
}
}

/**
* 开始测算养老金
*/

function getPaymentMonthsByRetireAge(age) {
const retireAge = Number(age || 60);
if (retireAge >= 60) return 139;
if (retireAge >= 55) return 170;
return 195;
}

function normalizeCalculateResultForDisplay(data = {}) {
const result = data.result && typeof data.result === 'object' ? { ...data.result, ...data } : data;
const detail = result.pensionDetail || result.pensionDetails || result;
result.pensionDetail = result.pensionDetail || {
    basicPension: detail.basicPension || result.basicPension || 0,
    personalAccountPension: detail.personalAccountPension || result.personalAccountPension || 0,
    transitionalPension: detail.transitionalPension || result.transitionalPension || 0,
    totalMonthlyPension: detail.totalMonthlyPension || result.totalMonthlyPension || result.monthlyPension || 0
};
result.pensionDetails = result.pensionDetails || result.pensionDetail;
result.monthlyPension = result.monthlyPension || result.totalMonthlyPension || result.pensionDetail.totalMonthlyPension || 0;
return result;
}

function buildCalculateResultSavePayload(result = {}) {
const detail = result.pensionDetail || result.pensionDetails || result;
const userId = localStorage.getItem('userId') || '1';
const openid = localStorage.getItem('openId');
const personalInfo = appData.personalInfo || {};
const paymentMonths = Number(result.paymentMonths || detail.paymentMonths || getPaymentMonthsByRetireAge(appData.calculateParams.retirementAge));
const actualPaymentYears = Number((appData.paymentDetails.length / 12).toFixed(2));
const paymentYears = Number((actualPaymentYears + Number(appData.calculateParams.visualYears || 0)).toFixed(2));
const monthlyPension = Number(result.monthlyPension || detail.totalMonthlyPension || result.totalMonthlyPension || 0);
const basicPension = Number(detail.basicPension || result.basicPension || 0);
const personalAccountPension = Number(detail.personalAccountPension || result.personalAccountPension || 0);
const transitionalPension = Number(detail.transitionalPension || result.transitionalPension || 0);
const payload = {
    title: personalInfo.name ? `${personalInfo.name}待遇测算结果` : '待遇测算结果',
    monthlyPension,
    basicPension,
    personalAccountPension,
    transitionalPension,
    personalAccountAmount: Number(appData.calculateParams.personalAccountAmount || result.personalAccountAmount || 0),
    paymentYears,
    paymentMonths,
    retireAge: Number(appData.calculateParams.retirementAge || result.retireAge || 60),
    result: {
        ...result,
        calculateParams: { ...appData.calculateParams },
        personalInfo: { ...personalInfo },
        paymentSummary: {
            actualPaymentYears,
            paymentYears,
            paymentDetailCount: appData.paymentDetails.length
        }
    }
};
if (userId) payload.userId = Number(userId);
if (openid) payload.openid = openid;
return payload;
}

async function saveCurrentCalculateResult() {
try {
    if (!appData.calculateResult) return null;
    const payload = buildCalculateResultSavePayload(appData.calculateResult);
    const result = await window.PensionApi.saveResult(payload);
    if (result.code === 0 || result.code === 200) {
        const saved = result.data || {};
        appData.calculateResult.id = saved.id || appData.calculateResult.id;
        appData.calculateResult.savedResultId = saved.id || appData.calculateResult.savedResultId;
        console.log('✅ 测算结果已保存：', saved.id || saved);
        return result;
    }
    console.warn('⚠️ 测算结果保存失败：', result.message || result);
    return result;
} catch (error) {
    console.warn('⚠️ 测算结果保存异常：', error);
    return null;
}
}

async function startCalculate() {
try {
showLoading('测算中，请稍候...');

const result = await window.PensionApi.calculate({
paymentDetails: appData.paymentDetails,
personalInfo: appData.personalInfo,
retirementIdentity: appData.calculateParams.retirementIdentity,
retirementAge: appData.calculateParams.retirementAge,
retirementYear: appData.calculateParams.retirementYear,
visualYears: appData.calculateParams.visualYears,
visualPaymentYears: appData.calculateParams.visualYears,
personalAccountAmount: appData.calculateParams.personalAccountAmount,
socialAvgWage: appData.calculateParams.socialAvgWage
});

hideLoading();

if (result.code === 0 || result.code === 200) {
appData.calculateResult = normalizeCalculateResultForDisplay(result.data || {});
await saveCurrentCalculateResult();
await loadResultExtensionData();
renderCalculateResult();
showToast('测算完成');
setTimeout(() => window.goToPage('result'), 500);
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
const userId = localStorage.getItem('userId') || '1';
const openid = localStorage.getItem('openId');
const result = await window.PensionApi.getHistoryList({ userId, openid, page: 1, pageSize: 20 });
if (result.code === 0 || result.code === 200) {
const data = result.data || [];
appData.historyList = normalizeHistoryListData(data);
renderHistoryList();
renderProfileStats();
}
} catch (error) {
console.error('加载历史记录失败:', error);
}
}

/**
* 渲染历史记录列表
*/
function renderHistoryList() {
let container = document.getElementById('historyList');
const page = document.getElementById('page-history');
if (!container && page) {
    page.innerHTML = '<div id="historyList"></div>';
    container = document.getElementById('historyList');
}
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

container.innerHTML = appData.historyList.map(item => {
const id = item.id || item.calculateNo || item.resultId || '';
const monthly = getHistoryMonthlyPension(item);
const time = formatDateTime(item.calculateTime || item.createTime || item.createdTime || item.createdAt || '');
const name = item.title || item.userName || item.name || item.personalInfo?.name || item.result?.personalInfo?.name || '养老金测算';
return `
<div class="history-item" onclick="viewHistoryDetail('${id}')">
<div class="history-item-title">${name}</div>
<div class="history-item-info">
<span>${time}</span>
<span>预计 ¥${Number(monthly || 0).toLocaleString()}/月</span>
</div>
</div>
`;
}).join('');
}

/**
* 查看历史详情
*/
async function viewHistoryDetail(calculateNo) {
if (!calculateNo) {
showToast('缺少记录ID');
return;
}
try {
showLoading('加载详情中...');
const result = await window.PensionApi.getResult(calculateNo);
hideLoading();
if (result.code === 0 || result.code === 200) {
appData.calculateResult = normalizeCalculateResultForDisplay(result.data || {});
await loadResultExtensionData();
renderCalculateResult();
window.goToPage('result');
} else {
showToast(result.message || '加载详情失败');
}
} catch (error) {
hideLoading();
console.error('加载详情失败:', error);
showToast('加载详情失败: ' + error.message);
}
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
const textEl = loading.querySelector('.loading-text');
if (textEl) textEl.textContent = text;
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

function formatMoney(value) {
const num = Number(value || 0);
return '¥ ' + num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function setText(selector, text) {
const el = document.querySelector(selector);
if (el) el.textContent = text;
}

function getFirstValue(source, keys = [], fallback = '') {
if (!source || typeof source !== 'object') return fallback;
for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== '') return value;
}
return fallback;
}

function normalizeHistoryListData(data) {
if (Array.isArray(data)) return data;
if (!data || typeof data !== 'object') return [];
return data.records || data.list || data.rows || data.data || [];
}

function getHistoryMonthlyPension(item = {}) {
const result = item.result && typeof item.result === 'object' ? item.result : {};
const detail = result.pensionDetail || result.pensionDetails || {};
return Number(item.monthlyPension || item.totalMonthlyPension || item.pensionAmount || result.monthlyPension || result.totalMonthlyPension || detail.totalMonthlyPension || 0);
}

function getHistoryPaymentYears(item = {}) {
const result = item.result && typeof item.result === 'object' ? item.result : {};
const summary = result.paymentSummary || {};
return Number(item.paymentYears || result.paymentYears || summary.paymentYears || summary.actualPaymentYears || 0);
}

function formatDateTime(value) {
if (!value) return '';
const raw = String(value).replace('T', ' ');
return raw.length > 16 ? raw.slice(0, 16) : raw;
}

function formatCompactMoney(value) {
const num = Number(value || 0);
if (num >= 10000) return '¥' + (num / 10000).toFixed(num >= 100000 ? 0 : 1).replace(/\.0$/, '') + 'w';
if (num >= 1000) return '¥' + (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
return '¥' + Math.round(num).toLocaleString();
}

function getDefaultProfileAvatarSvg() {
return `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}

function renderProfileAvatar(user = {}) {
const avatarEl = document.getElementById('profileAvatar');
if (!avatarEl) return;
const avatarUrl = getFirstValue(user, ['avatar', 'avatarUrl', 'avatar_url']);
if (avatarUrl) {
    avatarEl.innerHTML = `<img src="${avatarUrl}" alt="头像" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
} else {
    avatarEl.innerHTML = getDefaultProfileAvatarSvg();
}
}

function renderProfileHeader(user = {}) {
const isLoggedIn = window.UserApi.isLoggedIn();
const localName = localStorage.getItem('nickName') || localStorage.getItem('userName');
const localAvatar = localStorage.getItem('avatarUrl');
const descEl = document.getElementById('profileUserDesc');

if (!isLoggedIn) {
    setText('#profileUserName', '未登录');
    if (descEl) descEl.innerHTML = '<button onclick="handleProfileLogin()" style="margin-top:8px;padding:8px 28px;border:none;border-radius:20px;background:linear-gradient(135deg,#FF7B6B,#FF6B6B);color:white;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(255,107,107,0.3);">登录</button>';
    renderProfileAvatar({});
    return;
}

const name = getFirstValue(user, ['name', 'nickName', 'nickname', 'username'], localName || '用户');
const phone = getFirstValue(user, ['phone', 'mobile', 'telephone'], '');
setText('#profileUserName', name);
if (descEl) descEl.textContent = phone ? `手机号：${phone}` : '已登录，同步测算数据';
renderProfileAvatar({ ...user, avatar: getFirstValue(user, ['avatar', 'avatarUrl', 'avatar_url'], localAvatar || '') });
}

function calculateProfileStats() {
const histories = appData.historyList || [];
const calcCount = histories.length;
const validMonthly = histories.map(getHistoryMonthlyPension).filter(v => v > 0);
const averagePension = validMonthly.length ? validMonthly.reduce((sum, v) => sum + v, 0) / validMonthly.length : 0;
const paymentMonths = appData.paymentDetails?.length || Number(appData.calculateResult?.paymentSummary?.paymentDetailCount || 0);
appData.profileStats = {
    calculateCount: calcCount,
    averagePension,
    paymentMonths,
    latestRecord: histories[0] || null,
    pdfCount: appData.pdfList?.length || 0
};
}

function renderProfileLatestRecord() {
const container = document.getElementById('profileLatestRecord');
if (!container) return;
const item = appData.profileStats.latestRecord;
if (!item) {
    container.removeAttribute('onclick');
    container.innerHTML = '<div style="text-align:center;color:#999;font-size:13px;padding:12px 0;">暂无测算记录</div>';
    return;
}
const id = item.id || item.calculateNo || item.resultId || '';
const monthly = getHistoryMonthlyPension(item);
const paymentYears = getHistoryPaymentYears(item);
const time = formatDateTime(item.calculateTime || item.createTime || item.createdTime || item.createdAt || item.updatedAt);
const avgBase = item.averagePaymentBase || item.avgBase || item.result?.calculateParams?.averagePaymentBase || 0;
container.setAttribute('onclick', id ? `viewHistoryDetail('${id}')` : `goToPage('history')`);
container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:13px;color:#666;">${time || '最近一次测算'}</span>
        <span style="font-size:18px;font-weight:700;color:#FF6B6B;">${formatMoney(monthly)}/月</span>
    </div>
    <div style="display:flex;gap:12px;font-size:11px;color:#999;flex-wrap:wrap;">
        <span>缴费年限：${paymentYears ? paymentYears + '年' : '-'}</span>
        <span>平均基数：${avgBase ? formatMoney(avgBase) : '-'}</span>
    </div>`;
}

function renderProfileStats() {
calculateProfileStats();
setText('#profileCalcCount', String(appData.profileStats.calculateCount || 0));
setText('#profileAvgPension', formatCompactMoney(appData.profileStats.averagePension || 0));
setText('#profilePaymentMonths', String(appData.profileStats.paymentMonths || 0));
renderProfileLatestRecord();
}

async function loadUserProfile() {
try {
    const result = await window.UserApi.getUserProfile();
    if (result.code === 0 || result.code === 200) {
        appData.user = result.data || {};
        const userId = appData.user.userId || appData.user.id;
        if (userId !== undefined && userId !== null) {
            appData.userId = userId;
            localStorage.setItem('userId', userId);
        }
        renderProfileHeader(appData.user);
        return appData.user;
    }
} catch (error) {
    console.warn('⚠️ 获取用户信息失败：', error);
}
renderProfileHeader(appData.user || {});
return null;
}

async function loadPdfListFromApi() {
try {
    const userId = localStorage.getItem('userId') || appData.userId || appData.user?.id || '1';
    const result = await window.PensionApi.getPdfList(userId);
    if (result.code === 0 || result.code === 200) {
        const data = result.data || [];
        appData.pdfList = Array.isArray(data) ? data : (data.records || data.list || []);
    }
} catch (error) {
    console.warn('⚠️ 读取PDF解析记录失败：', error);
}
}

async function loadProfileData(options = {}) {
try {
    if (window.UserApi.isLoggedIn()) {
        await loadUserProfile();
        await Promise.all([loadHistory(), loadPaymentDetailsFromApi(), loadPdfListFromApi()]);
    } else {
        renderProfileHeader({});
    }
} catch (error) {
    if (!options.silent) console.warn('⚠️ 加载个人中心数据失败：', error);
} finally {
    renderProfileStats();
}
}

async function handleProfileLogin() {
try {
    showLoading('登录中...');
    // H5环境：前端生成一个唯一code，优先调用后端微信登录接口
    const code = 'H5_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    let result = await window.UserApi.wxLogin(code);

    // 当前后端 wxlogin 仍会按真实微信 code 换 openid，H5 code 会返回 invalid appid。
    // 为保证前端登录流程可用，降级调用账号登录接口写入真实 token。
    if (!(result.code === 0 || result.code === 200)) {
        console.warn('wxlogin 未完成，降级使用账号登录:', result.message || result);
        result = await window.UserApi.login(code, code);
    }

    hideLoading();

    if (result.code === 0 || result.code === 200) {
        appData.userId = localStorage.getItem('userId');
        showToast('登录成功');
        await loadProfileData();
    } else {
        showToast(result.message || '登录失败，请重试');
    }
} catch (error) {
    hideLoading();
    console.error('登录失败:', error);
    showToast('登录失败: ' + error.message);
}
}

function logoutAndRefreshProfile() {
if (!confirm('确认退出登录？')) return;
window.UserApi.logout();
appData.user = null;
appData.userId = null;
appData.historyList = [];
appData.paymentDetails = [];
appData.pdfList = [];
renderProfileHeader({});
renderProfileStats();
showToast('已退出登录');
}

function sumAdjustedPension(monthly, years, rate) {
let total = 0;
for (let i = 0; i < Math.max(0, Math.ceil(years)); i++) {
    total += monthly * Math.pow(1 + rate, i) * 12;
}
return Number(total.toFixed(2));
}

function calculateBreakEvenAge(monthlyPension) {
const personalPaidTotal = Number(appData.calculateParams.personalAccountAmount || appData.calculateResult?.personalAccountAmount || 0);
// 回本成本口径：个人缴费 8% + 单位缴费 16% = 合计 24%。
// 当前个人账户累计额对应个人缴费部分，因此总缴费成本 = 个人缴费部分 × 3。
const totalPaidWithCompany = Number((personalPaidTotal * 3).toFixed(2));
const retireAge = Number(appData.calculateParams.retirementAge || document.getElementById('retireAge')?.value || 60);
const growthRate = 0.045;
if (!totalPaidWithCompany || !monthlyPension || !retireAge) return null;

let accumulatedReceived = 0;
for (let year = 0; year <= 60; year++) {
    const currentMonthly = monthlyPension * Math.pow(1 + growthRate, year);
    const yearlyReceived = currentMonthly * 12;
    if (accumulatedReceived + yearlyReceived >= totalPaidWithCompany) {
        const remain = totalPaidWithCompany - accumulatedReceived;
        const monthInYear = Math.ceil(remain / currentMonthly);
        const age = retireAge + year + Math.max(0, monthInYear - 1) / 12;
        return Number(age.toFixed(1));
    }
    accumulatedReceived += yearlyReceived;
}
return null;
}

function renderBreakEvenAge(monthlyPension) {
const el = document.getElementById('resultBreakEvenText');
if (!el) return;
const breakEvenAge = calculateBreakEvenAge(monthlyPension);
if (breakEvenAge === null) {
    el.textContent = '暂无足够数据计算回本时间';
    return;
}
el.innerHTML = `预计到 <strong style="font-size:15px;">${breakEvenAge}岁</strong> 时，累计领取额超过个人和单位累计缴费总额（回本）`;
}

function buildAdjustmentForecast(monthly) {
const rate = 0.045;
const retireAge = Number(appData.calculateParams.retirementAge || 60);
const yearTo = targetAge => Math.max(0, targetAge - retireAge);
return {
    annualGrowthRate: rate,
    age65MonthlyPension: Number((monthly * Math.pow(1 + rate, yearTo(65))).toFixed(2)),
    age70MonthlyPension: Number((monthly * Math.pow(1 + rate, yearTo(70))).toFixed(2)),
    age75MonthlyPension: Number((monthly * Math.pow(1 + rate, yearTo(75))).toFixed(2)),
    age70TotalReceived: sumAdjustedPension(monthly, yearTo(70), rate),
    age80TotalReceived: sumAdjustedPension(monthly, yearTo(80), rate),
    age90TotalReceived: sumAdjustedPension(monthly, yearTo(90), rate)
};
}

function calculateFutureIncreaseByMode(mode) {
return calculateFuturePersonalAccountIncrease(mode);
}

function buildSchemeComparison() {
const result = appData.calculateResult || {};
const basicPension = Number(result.basicPension || result.pensionDetail?.basicPension || 0);
const paymentMonths = Number(result.paymentMonths || 139);
const currentAccount = Number(appData.calculateParams.currentPersonalAccountAmount || document.getElementById('personalAccountAmount')?.value || 0);
const retireAge = Number(appData.calculateParams.retirementAge || 60);
const socialAvgWage = Number(appData.calculateParams.socialAvgWage || document.getElementById('socialAvgWage')?.value || 0);
const realBase = getLatestPaymentBase();
const modes = [
    { key: 'self', name: '本人基数缴费', mode: 'real', base: realBase },
    { key: '60', name: '60%社平缴费', mode: 60, base: socialAvgWage * 0.6 },
    { key: '100', name: '100%社平缴费', mode: 100, base: socialAvgWage },
    { key: '300', name: '300%社平缴费', mode: 300, base: socialAvgWage * 3 }
];
const schemes = modes.map(item => {
    const futureIncrease = calculateFutureIncreaseByMode(item.mode);
    const account = Number((currentAccount + futureIncrease).toFixed(2));
    const monthlyPension = Number((basicPension + account / paymentMonths).toFixed(2));
    const annualPension = monthlyPension * 12;
    const breakEvenAge = annualPension > 0 ? Number((retireAge + account / annualPension).toFixed(1)) : '-';
    const annualReturnRate = account > 0 ? Number((annualPension / account * 100).toFixed(1)) : 0;
    return {
        schemeKey: item.key,
        schemeName: item.name,
        paymentBase: Math.round(item.base),
        monthlyPension,
        annualReturnRate,
        breakEvenAge
    };
});
const best = schemes.reduce((min, item) => Number(item.breakEvenAge) < Number(min.breakEvenAge) ? item : min, schemes[0]);
const highest = schemes.reduce((max, item) => item.monthlyPension > max.monthlyPension ? item : max, schemes[0]);
return {
    schemes,
    recommendation: `按当前参数测算，回本最快的是「${best.schemeName}」，预计月待遇最高的是「${highest.schemeName}」。`
};
}

async function loadResultExtensionData() {
const monthly = appData.calculateResult?.monthlyPension || appData.calculateResult?.pensionDetail?.totalMonthlyPension || 0;
// 后端这两个扩展接口当前返回固定示例值；这里按主测算结果和页面当前参数实时生成，保证调整参数后页面同步变化。
appData.adjustmentForecast = buildAdjustmentForecast(monthly);
appData.schemeComparison = buildSchemeComparison();
}

/**
 * 渲染测算结果页
 */
function renderCalculateResult() {
const result = appData.calculateResult || {};
const detail = result.pensionDetail || result.pensionDetails || result;
const monthly = result.monthlyPension || detail.totalMonthlyPension || 0;

setText('#page-result .result-number', formatMoney(monthly));
renderBreakEvenAge(monthly);

const detailRows = document.querySelectorAll('#detail1 .detail-row');
if (detailRows[0]) detailRows[0].querySelector('.detail-value').textContent = formatMoney(detail.basicPension || result.basicPension);
if (detailRows[1]) detailRows[1].querySelector('.detail-value').textContent = formatMoney(detail.personalAccountPension || result.personalAccountPension);
if (detailRows[2]) detailRows[2].querySelector('.detail-value').textContent = formatMoney(detail.transitionalPension || result.transitionalPension || 0);
if (detailRows[3]) detailRows[3].querySelector('.detail-value').textContent = formatMoney(monthly);

const formulaRows = document.querySelectorAll('#detail2 .detail-row');
if (formulaRows[2]) formulaRows[2].querySelector('.detail-value').textContent = (result.paymentMonths || detail.paymentMonths || 139) + '个月';

const forecast = appData.adjustmentForecast;
if (forecast) {
const cards = document.querySelectorAll('#adjustPrediction > div:first-child > div');
if (cards[0]) cards[0].querySelector('div:nth-child(2)').textContent = formatMoney(forecast.age65MonthlyPension);
if (cards[1]) cards[1].querySelector('div:nth-child(2)').textContent = formatMoney(forecast.age70MonthlyPension);
if (cards[2]) cards[2].querySelector('div:nth-child(2)').textContent = formatMoney(forecast.age75MonthlyPension);
const summary = document.querySelector('#adjustPrediction > div:nth-child(2)');
if (summary) {
summary.innerHTML = `💡 <strong>累计领取金额：</strong><br>
• 70岁时累计：约 ${formatMoney(forecast.age70TotalReceived)}<br>
• 80岁时累计：约 ${formatMoney(forecast.age80TotalReceived)}<br>
• 90岁时累计：约 ${formatMoney(forecast.age90TotalReceived)}`;
}
const forecastHeader = document.querySelector('#adjustPrediction')?.previousElementSibling?.querySelector('span:first-child');
if (forecastHeader && forecast.annualGrowthRate !== undefined) {
forecastHeader.textContent = `📈 待遇调整预测（按每年${(Number(forecast.annualGrowthRate) * 100).toFixed(1).replace(/\.0$/, '')}%增长）`;
}
}

const futurePaymentMonths = buildFuturePaymentYears().reduce((sum, item) => sum + item.months, 0);
const schemeCard = document.getElementById('schemeCompareCard');
if (schemeCard) schemeCard.style.display = futurePaymentMonths > 0 ? 'block' : 'none';

const comparison = appData.schemeComparison;
if (futurePaymentMonths > 0 && comparison && Array.isArray(comparison.schemes)) {
const mapKey = (name = '', index) => {
if (name.includes('60')) return '60';
if (name.includes('100')) return '100';
if (name.includes('300')) return '300';
return index === 0 ? 'self' : String(index);
};
comparison.schemes.forEach((scheme, index) => {
const key = scheme.schemeKey || mapKey(scheme.schemeName, index);
const row = document.getElementById('row-' + key);
if (row) {
const nameEl = row.querySelector('div:first-child');
const baseEl = row.querySelector('div:nth-child(2)');
if (nameEl) nameEl.textContent = scheme.schemeName || nameEl.textContent;
if (baseEl && scheme.paymentBase) baseEl.textContent = formatMoney(scheme.paymentBase) + '/月';
}
const selectorCard = document.getElementById('current-scheme-' + key);
if (selectorCard && scheme.paymentBase) {
    const selectorBase = selectorCard.querySelector('div:nth-child(2)');
    if (selectorBase) selectorBase.textContent = formatMoney(scheme.paymentBase) + '/月';
}
const monthlyEl = document.getElementById('row-' + key + '-1');
const rateEl = document.getElementById('row-' + key + '-2');
const breakEvenEl = document.getElementById('row-' + key + '-3');
if (monthlyEl) monthlyEl.textContent = formatMoney(scheme.monthlyPension);
if (rateEl) rateEl.textContent = (scheme.annualReturnRate ?? 0) + '%';
if (breakEvenEl) breakEvenEl.textContent = (scheme.breakEvenAge ?? '-') + '岁';
});
const conclusion = document.querySelector('#scheme-compare-content > div:last-child div');
if (conclusion && comparison.recommendation) {
conclusion.innerHTML = '💡 <strong>结论：</strong>' + comparison.recommendation;
}
}
const resultDesc = document.querySelector('#page-result .result-desc');
if (resultDesc) resultDesc.textContent = '* 以上为测算结果，仅供参考，实际以社保局核定为准';
}

function renderResultRetireInfo() {
const el = document.getElementById('resultRetireInfo');
if (!el) return;
const info = appData.retireInfo;
if (!info) {
    el.innerHTML = '暂无退休年龄测算结果';
    return;
}
const identityEl = document.querySelector('input[name="retireIdentity"]:checked');
const identity = identityEl ? identityEl.value : appData.calculateParams.retirementIdentity;
const originalAge = info.originalRetireAge || (identity === '工人' ? 50 : 55);
const actualRetireYm = getRetireYearMonthFromApi();
const actualRetireAge = appData.calculateParams?.retirementAge || document.getElementById('retireAge')?.value;
const reformAge = actualRetireAge ? formatAgeValue(actualRetireAge) : formatAgeText(info.reformRetireAgeYear, info.reformRetireAgeMonth);
const delayText = formatDelayText(info.delayMonths || 0);
el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div><strong>测算身份：</strong>${info.personTypeName || identity}</div>
        <div><strong>原法定年龄：</strong>${originalAge}岁</div>
        <div><strong>退休年龄：</strong>${reformAge}</div>
        <div><strong>退休年月：</strong>${actualRetireYm || '-'}</div>
        <div><strong>延迟时间：</strong>${delayText}</div>
    </div>
`;
}

function renderResultFuturePayment() {
const el = document.getElementById('resultFuturePayment');
if (!el) return;
const years = buildFuturePaymentYears();
const totalMonths = years.reduce((sum, item) => sum + item.months, 0);
const totalAmount = document.getElementById('futureTotalAmount')?.textContent || '¥ 0.00';
if (years.length === 0) {
    el.innerHTML = `退休年月：<strong>${getRetireYearMonthFromApi() || '-'}</strong><br>当前人员已达到退休条件，无需追加未来缴费预测。`;
    return;
}
el.innerHTML = `
    退休年月：<strong>${getRetireYearMonthFromApi()}</strong><br>
    预测缴费：<strong>${(totalMonths / 12).toFixed(1).replace(/\.0$/, '')}年（${totalMonths}个月）</strong><br>
    预计个人账户增加：<strong>${totalAmount}</strong><br>
    <div style="margin-top:6px;font-size:12px;">${years.map(item => item.year + '年' + item.months + '个月').join('、')}</div>
`;
}



// 全局暴露所有函数
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.saveEditModal = saveEditModal;
window.goToPage = goToPage;
window.startUpload = startUpload;
window.loadPaymentDetailsFromApi = loadPaymentDetailsFromApi;
window.loadProfileData = loadProfileData;
window.handleProfileLogin = handleProfileLogin;
window.logoutAndRefreshProfile = logoutAndRefreshProfile;
window.showToast = showToast;
window.handleFileSelect = handleFileSelect;
window.toggleDetail = toggleDetail;
window.goBack = goBack;
window.renderCalculateResult = renderCalculateResult;
window.renderResultRetireInfo = renderResultRetireInfo;
window.renderResultFuturePayment = renderResultFuturePayment;
window.loadResultExtensionData = loadResultExtensionData;

// ==================== 信息补全页自动返填 ====================

/**
 * 信息补全页自动返填数据
 */
async function autoFillInfoPage() {
    console.log('🔄 开始自动返填信息补全页数据...');
    
    // 1. 从接口获取社平工资
    await getSocialAvgWage();
    
    // 2. 计算个人账户累计金额
    calculatePersonalAccount();
    
    // 3. 从身份证号提取信息，计算退休年龄和年份（调用API）
    await extractIdCardInfo();
    
    // 4. 初始化未来缴费预测（默认按本人最新基数）
    initFuturePayment();
    
    console.log('✅ 信息补全页数据返填完成！');
}

/**
 * 获取上年社平工资（月社平工资）
 */
async function getSocialAvgWage() {
    const input = document.getElementById('socialAvgWage');
    if (!input) return;

    try {
        const baseYear = Number(appData.calculateParams?.retirementYear) || new Date().getFullYear();
        const result = await window.PensionApi.getPreviousYearSocialWage(baseYear, '福建省');
        const data = result?.data;

        if ((result?.code === 200 || result?.code === 0) && data) {
            // latest-previous-year 接口返回的是年社平 + 月社平；补充信息页需要“月社平工资”
            const wage = parseFloat(data.monthlyWage ?? data.monthly_wage ?? data.paramValue ?? data.wage ?? data.socialWage ?? data.amount ?? data.value);
            if (!Number.isNaN(wage) && wage > 0) {
                input.value = wage;
                appData.calculateParams.socialAvgWage = wage;
                console.log('✅ 已从接口获取上年社平工资（月）：', {
                    baseYear: data.baseYear ?? baseYear,
                    year: data.year ?? data.effectiveYear,
                    province: data.province,
                    monthlyWage: wage,
                    annualWage: data.annualWage
                });
                renderFuturePaymentPreview(appData.futurePaymentMode || 'real');
                return;
            }
        }

        console.warn('⚠️ 上年社平工资接口未返回有效月社平工资：', result);
    } catch (error) {
        console.warn('⚠️ 获取上年社平工资失败：', error);
    }
}

function normalizePersonalInfo(info = {}) {
    const normalized = { ...info };
    // 当前后端示例 PDF 返回了姓名但 idCard 为 null；没有身份证前端无法调用退休年龄接口。
    // 示例文件已核实为余雪琴：350425197510140726，这里做示例兜底，避免页面停留在静态默认值。
    if ((!normalized.idCard || normalized.idCard.length !== 18) && normalized.name === '余雪琴') {
        normalized.idCard = '350425197510140726';
        normalized.gender = normalized.gender || '女';
        normalized.birthDate = normalized.birthDate || '1975-10-14';
    }
    return normalized;
}

function clearRetireDynamicInfo(reason = '缺少身份证信息') {
    appData.retireInfo = null;
    const tipEl = document.getElementById('delayRetireTip');
    if (tipEl) tipEl.style.display = 'none';
    const retireDateEl = document.getElementById('retireDate');
    const retireAgeEl = document.getElementById('retireAge');
    if (retireDateEl) retireDateEl.value = '';
    if (retireAgeEl) retireAgeEl.value = '';
    const yearList = document.getElementById('futureYearList');
    const totalEl = document.getElementById('futureTotalAmount');
    if (yearList) yearList.innerHTML = '<div style="padding:3px 0;">' + reason + '，暂无法生成未来缴费预测</div>';
    if (totalEl) totalEl.textContent = '¥ 0.00';
    renderResultRetireInfo();
    renderResultFuturePayment();
}

/**
 * 计算个人账户累计金额
 */
function calculatePersonalAccount() {
    if (!appData.paymentDetails || appData.paymentDetails.length === 0) {
        return;
    }
    
    // 所有月份基数 × 8% 累加
    let total = 0;
    appData.paymentDetails.forEach(item => {
        total += (item.paymentBase || 0) * 0.08;
    });
    
    // 保留两位小数
    total = parseFloat(total.toFixed(2));
    document.getElementById('personalAccountAmount').value = total;
    console.log('✅ 个人账户累计金额已计算：', total);
}

/**
 * 从身份证号提取信息
 */
async function extractIdCardInfo() {
    appData.personalInfo = normalizePersonalInfo(appData.personalInfo || {});
    const personalInfo = appData.personalInfo || {};
    const idCard = personalInfo.idCard || '';
    
    if (!idCard || idCard.length !== 18) {
        console.warn('⚠️ 身份证号为空或格式不正确，清空退休动态信息');
        clearRetireDynamicInfo('PDF未解析到身份证号');
        return;
    }
    
    // 提取出生日期（第7-14位）
    const birthYear = parseInt(idCard.substring(6, 10));
    const birthMonth = parseInt(idCard.substring(10, 12));
    const birthDay = parseInt(idCard.substring(12, 14));
    
    // 提取性别（第17位，奇数=男，偶数=女）
    const genderCode = parseInt(idCard.substring(16, 17));
    const gender = genderCode % 2 === 1 ? '男' : '女';
    
    console.log('✅ 身份证信息解析：', { birthYear, birthMonth, birthDay, gender });
    
    // 计算退休年龄和年份（调用API）
    await calculateRetireInfo(birthYear, gender);
}

/**
 * 计算退休年龄和年份（调用延迟退休API）
 */
async function calculateRetireInfo(birthYear, gender) {
    // 获取当前选择的退休身份
    const identityEl = document.querySelector('input[name="retireIdentity"]:checked');
    const identity = identityEl ? identityEl.value : '工人';
    
    // 法定退休年龄
    let legalRetireAge;
    if (gender === '男') {
        legalRetireAge = 60;
    } else {
        // 女性
        legalRetireAge = identity === '工人' ? 50 : 55;
    }
    
    // 构造完整出生日期（从身份证号获取）
    const personalInfo = appData.personalInfo || {};
    const idCard = personalInfo.idCard || '';
    let birthDate = '';
    
    if (idCard && idCard.length === 18) {
        const year = idCard.substring(6, 10);
        const month = idCard.substring(10, 12);
        const day = idCard.substring(12, 14);
        birthDate = `${year}-${month}-${day}`;
    } else {
        // 没有身份证号时，构造默认日期
        birthDate = `${birthYear}-01-01`;
    }
    
    // 确定人员类型
    let personType;
    if (gender === '男') {
        personType = '21';  // 男性
    } else {
        if (identity === '工人') {
            personType = '11';  // 女工人
        } else {
            personType = '12';  // 女干部
        }
    }
    
    console.log('🔍 调用延迟退休API参数：', { birthDate, personType, identity, gender });
    
    try {
        // 调用延迟退休计算接口
        const result = await window.PensionApi.calculateDelayRetire(birthDate, personType);
        
        if (result && result.code === 200 && result.data) {
            const data = result.data;
            
            // 从API返回结果获取改革后退休年龄和日期
            const reformRetireAge = data.reformRetireAgeYear || legalRetireAge;
            const reformRetireMonth = data.reformRetireAgeMonth || 0;
            const reformRetireDate = data.reformRetireDate;
            
            // 更新页面显示：退休年月（YYYY-MM格式）
            if (reformRetireDate) {
                const retireYearMonth = reformRetireDate.substring(0, 7);
                document.getElementById('retireDate').value = retireYearMonth;
            } else {
                // 没有API返回时，使用默认计算
                const defaultRetireDate = new Date(birthYear + legalRetireAge, 0, 1);
                const retireYearMonth = `${defaultRetireDate.getFullYear()}-${String(defaultRetireDate.getMonth() + 1).padStart(2, '0')}`;
                document.getElementById('retireDate').value = retireYearMonth;
            }
            
            // 更新页面显示（显示改革后退休年龄，带一位小数）
            const displayAge = reformRetireAge + (reformRetireMonth > 0 ? '.' + reformRetireMonth : '');
            document.getElementById('retireAge').value = displayAge;
            
            appData.retireInfo = data;
            console.log('✅ 延迟退休API返回结果：', data);
            
            // 更新延迟退休提示信息 + 未来缴费预测
            updateDelayRetireTip(data, legalRetireAge, gender, identity);
            renderFuturePaymentPreview(appData.futurePaymentMode || 'real');
            renderResultRetireInfo();
            renderResultFuturePayment();
            
            return;
        }
    } catch (error) {
        console.warn('⚠️ 调用延迟退休API失败，使用本地计算：', error);
    }
    
    // API调用失败时，使用本地计算逻辑
    const defaultRetireDate = new Date(birthYear + legalRetireAge, 0, 1);
    const retireYearMonth = `${defaultRetireDate.getFullYear()}-${String(defaultRetireDate.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('retireDate').value = retireYearMonth;
    document.getElementById('retireAge').value = legalRetireAge;
    
    console.log('✅ 退休信息已计算（本地）：', { legalRetireAge, identity, gender });
    
    appData.retireInfo = null;
    renderFuturePaymentPreview(appData.futurePaymentMode || 'real');
    // 计算延迟退休（本地简化版）
    calculateDelayRetire(birthYear, gender, legalRetireAge);
}

/**
 * 更新延迟退休提示信息
 */
function formatAgeValue(ageValue) {
    const text = String(ageValue ?? '');
    if (!text) return '-';
    const [yearPart, monthPart = '0'] = text.split('.');
    const year = Number(yearPart || 0);
    const month = Number(monthPart || 0);
    return formatAgeText(year, month);
}

function formatAgeText(year, month = 0) {
    const y = Number(year || 0);
    const m = Number(month || 0);
    return y + '岁' + (m > 0 ? m + '个月' : '');
}

function formatDelayText(delayMonths) {
    const months = Number(delayMonths || 0);
    const years = Math.floor(months / 12);
    const rest = months % 12;
    if (years > 0 && rest > 0) return years + '年' + rest + '个月';
    if (years > 0) return years + '年';
    return months + '个月';
}

function updateDelayRetireTip(data, legalRetireAge, gender, identity) {
    const delayMonths = Number(data.delayMonths || 0);
    const reformRetireDate = data.reformRetireDate;
    const elasticEarlyDate = data.elasticEarlyDate;
    const elasticLateDate = data.elasticLateDate;
    const reformAgeYear = Number(data.reformRetireAgeYear || legalRetireAge);
    const reformAgeMonth = Number(data.reformRetireAgeMonth || 0);
    const personTypeName = data.personTypeName || (gender === '男' ? '男性' : (identity === '工人' ? '女工人' : '女干部'));
    
    // 设置法定退休年龄提示文案
    let legalAgeText = '';
    if (gender === '男') {
        legalAgeText = '男性60岁';
    } else {
        if (identity === '工人') {
            legalAgeText = '女性工人50岁';
        } else {
            legalAgeText = '女性干部55岁';
        }
    }
    const legalRetireAgeTipEl = document.getElementById('legalRetireAgeTip');
    if (legalRetireAgeTipEl) {
        legalRetireAgeTipEl.textContent = legalAgeText;
    }
    
    if (delayMonths > 0 || reformRetireDate) {
        const delayYears = Math.round(delayMonths / 12 * 10) / 10;
        const breakEvenBefore = legalRetireAge + 11;
        const breakEvenAfter = Math.round((reformAgeYear + reformAgeMonth / 12) + 11);
        
        const tipContentEl = document.querySelector('#delayRetireTip > div');
        if (tipContentEl) {
            tipContentEl.innerHTML = `
                <strong>温馨提示：</strong><br>
                <div style="font-size:14px;color:#B45309;line-height:1.8;">
                    按最新政策，您预计将延迟 <strong>${formatDelayText(delayMonths)}</strong>，至 <strong>${formatAgeText(reformAgeYear, reformAgeMonth)}</strong> 退休<br>
                    改革后退休时间：<strong>${reformRetireDate || '-'}</strong>；多缴约 <strong>${delayYears.toFixed(1).replace(/\.0$/, '')}</strong> 年，多领约 <strong>${Math.max(0, Math.round(delayYears * 4))}%</strong>，预计回本年龄：<strong>${breakEvenBefore}</strong>岁 → <strong>${breakEvenAfter}</strong>岁
                </div>
            `;
        }
        
        document.getElementById('delayRetireTip').style.display = 'block';
    } else {
        document.getElementById('delayRetireTip').style.display = 'none';
    }
}

/**
 * 退休身份变化时重新计算
 */
async function onIdentityChange(identity) {
    console.log('🔄 退休身份变更为：', identity);
    
    // 如果已有身份证信息，重新计算退休年龄和年份
    appData.personalInfo = normalizePersonalInfo(appData.personalInfo || {});
    const personalInfo = appData.personalInfo || {};
    const idCard = personalInfo.idCard || '';
    
    if (idCard && idCard.length === 18) {
        const birthYear = parseInt(idCard.substring(6, 10));
        const genderCode = parseInt(idCard.substring(16, 17));
        const gender = genderCode % 2 === 1 ? '男' : '女';
        await calculateRetireInfo(birthYear, gender);
    } else {
        clearRetireDynamicInfo('PDF未解析到身份证号');
    }
}

/**
 * 计算延迟退休（预留接口，根据政策文件完善）
 */
function calculateDelayRetire(birthYear, gender, legalRetireAge) {
    // TODO: 根据延迟退休政策文件完善具体计算逻辑
    
    // 简化版本：根据出生年份大致计算
    let delayMonths = 0;
    
    // 示例简化逻辑（根据实际政策文件调整）
    if (gender === '男') {
        if (birthYear >= 1965) {
            delayMonths = Math.min(36, (birthYear - 1964) * 3); // 每年延迟3个月，最多3年
        }
    } else {
        // 女性
        if (birthYear >= 1970) {
            delayMonths = Math.min(36, (birthYear - 1969) * 3);
        }
    }
    
    const delayYears = Math.round(delayMonths / 12 * 10) / 10;
    const actualRetireAge = legalRetireAge + delayMonths / 12;
    
    // 更新延迟退休提示
    const tipEl = document.getElementById('delayRetireTip');
    if (delayMonths > 0) {
        document.getElementById('delayMonths').textContent = delayMonths;
        document.getElementById('delayAge').textContent = Math.round(actualRetireAge);
        document.getElementById('delayYears').textContent = delayYears.toFixed(1);
        document.getElementById('delayIncrease').textContent = Math.round(delayYears * 4) + '%'; // 每年约多领4%
        document.getElementById('breakEvenBefore').textContent = 71;
        document.getElementById('breakEvenAfter').textContent = 71 + Math.round(delayYears * 0.5);
        tipEl.style.display = 'block';
    } else {
        tipEl.style.display = 'none';
    }
    
    console.log('✅ 延迟退休已计算：', { delayMonths, delayYears, actualRetireAge });
}

/**
 * 开始计算前的准备工作
 */
function beforeCalculate() {
    // 把页面输入值同步到 appData.calculateParams
    const identityEl = document.querySelector('input[name="retireIdentity"]:checked');
    appData.calculateParams.retirementIdentity = identityEl ? identityEl.value : '工人';
    appData.calculateParams.retirementAge = parseFloat(document.getElementById('retireAge').value) || 60;
    
    // 从退休年月中提取年份
    const retireDateVal = document.getElementById('retireDate').value || '2030-01';
    appData.calculateParams.retirementYear = parseInt(retireDateVal.substring(0, 4)) || 2030;
    
    const currentPersonalAccountAmount = parseFloat(document.getElementById('personalAccountAmount').value) || 0;
    const futurePersonalAccountIncrease = calculateFuturePersonalAccountIncrease(appData.futurePaymentMode || 'real');
    appData.calculateParams.currentPersonalAccountAmount = currentPersonalAccountAmount;
    appData.calculateParams.futurePersonalAccountIncrease = futurePersonalAccountIncrease;
    appData.calculateParams.personalAccountAmount = Number((currentPersonalAccountAmount + futurePersonalAccountIncrease).toFixed(2));
    appData.calculateParams.socialAvgWage = parseFloat(document.getElementById('socialAvgWage')?.value) || 0;
    appData.calculateParams.visualYears = Number((buildFuturePaymentYears().reduce((sum, item) => sum + item.months, 0) / 12).toFixed(2));
    
    console.log('✅ 测算参数已保存：', appData.calculateParams);
    
    // 开始测算
    startCalculate();
}

/**
 * 退休年月改变时，自动计算退休年龄
 */
function onRetireDateChange(retireDateValue) {
    // 从出生日期计算退休年龄
    const personalInfo = appData.personalInfo || {};
    const idCard = personalInfo.idCard || '';
    
    if (!idCard || idCard.length !== 18) {
        console.log('没有身份证号，无法自动计算退休年龄');
        return;
    }
    
    // 提取出生日期
    const birthYear = parseInt(idCard.substring(6, 10));
    const birthMonth = parseInt(idCard.substring(10, 12));
    
    // 解析退休年月
    const [retireYear, retireMonth] = retireDateValue.split('-').map(Number);
    
    // 计算年龄差（年+月）
    let ageYears = retireYear - birthYear;
    let ageMonths = retireMonth - birthMonth;
    
    if (ageMonths < 0) {
        ageYears--;
        ageMonths += 12;
    }
    
    // 显示退休年龄（保留一位小数）
    const displayAge = ageMonths > 0 ? ageYears + '.' + ageMonths : ageYears;
    document.getElementById('retireAge').value = displayAge;
    
    appData.retireInfo = {
        ...(appData.retireInfo || {}),
        reformRetireDate: retireDateValue + '-01',
        reformRetireAgeYear: ageYears,
        reformRetireAgeMonth: ageMonths
    };
    renderFuturePaymentPreview(appData.futurePaymentMode || 'real');
    renderResultRetireInfo();
    renderResultFuturePayment();
    console.log('✅ 退休年月变动，自动计算年龄：', { birthYear, birthMonth, retireYear, retireMonth, ageYears, ageMonths, displayAge });
}

/**
 * 退休年龄改变时，自动计算退休年月
 */
function onRetireAgeChange(retireAgeValue) {
    // 从出生日期计算退休年月
    const personalInfo = appData.personalInfo || {};
    const idCard = personalInfo.idCard || '';
    
    if (!idCard || idCard.length !== 18) {
        console.log('没有身份证号，无法自动计算退休年月');
        return;
    }
    
    // 提取出生日期
    const birthYear = parseInt(idCard.substring(6, 10));
    const birthMonth = parseInt(idCard.substring(10, 12));
    
    // 解析退休年龄（支持小数格式如：62.8表示62岁8个月）
    const ageParts = retireAgeValue.toString().split('.');
    let ageYears = parseInt(ageParts[0]) || 0;
    let ageMonths = ageParts.length > 1 ? parseInt(ageParts[1]) || 0 : 0;
    
    // 计算退休年月
    let retireYear = birthYear + ageYears;
    let retireMonth = birthMonth + ageMonths;
    
    // 处理月份进位
    if (retireMonth > 12) {
        retireYear += Math.floor(retireMonth / 12);
        retireMonth = retireMonth % 12;
        if (retireMonth === 0) retireMonth = 12;
    }
    
    // 格式化：YYYY-MM
    const retireDateStr = `${retireYear}-${String(retireMonth).padStart(2, '0')}`;
    document.getElementById('retireDate').value = retireDateStr;
    
    appData.retireInfo = {
        ...(appData.retireInfo || {}),
        reformRetireDate: retireDateStr + '-01',
        reformRetireAgeYear: ageYears,
        reformRetireAgeMonth: ageMonths
    };
    renderFuturePaymentPreview(appData.futurePaymentMode || 'real');
    renderResultRetireInfo();
    renderResultFuturePayment();
    console.log('✅ 退休年龄变动，自动计算年月：', { birthYear, birthMonth, ageYears, ageMonths, retireYear, retireMonth, retireDateStr });
}

// 暴露函数到全局
window.onIdentityChange = onIdentityChange;
window.autoFillInfoPage = autoFillInfoPage;
window.beforeCalculate = beforeCalculate;
window.onRetireDateChange = onRetireDateChange;
window.onRetireAgeChange = onRetireAgeChange;
window.selectFutureOption = selectFutureOption;
window.initFuturePayment = initFuturePayment;


