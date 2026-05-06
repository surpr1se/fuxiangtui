/**
 * 通用工具函数
 */

/**
 * 显示Toast提示
 */
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

/**
 * 显示加载遮罩
 */
function showLoading(text = '加载中，请稍候...') {
    const mask = document.getElementById('loadingMask');
    const textEl = mask.querySelector('.loading-text');
    textEl.textContent = text;
    mask.style.display = 'flex';
}

/**
 * 隐藏加载遮罩
 */
function hideLoading() {
    const mask = document.getElementById('loadingMask');
    mask.style.display = 'none';
}

/**
 * 格式化金额
 */
function formatCurrency(amount) {
    if (!amount && amount !== 0) return '-';
    return '¥' + Number(amount).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * 格式化数字（无货币符号）
 */
function formatNumber(num) {
    if (!num && num !== 0) return '-';
    return Number(num).toLocaleString('zh-CN');
}

/**
 * 脱敏身份证号
 */
function maskIdCard(idCard) {
    if (!idCard) return '';
    if (idCard.length < 8) return idCard;
    return idCard.substring(0, 3) + '***********' + idCard.substring(idCard.length - 4);
}

/**
 * 脱敏手机号
 */
function maskPhone(phone) {
    if (!phone) return '';
    if (phone.length < 7) return phone;
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * 计算平均缴费基数
 */
function calculateAvgBase(paymentDetails) {
    if (!paymentDetails || paymentDetails.length === 0) return 0;
    const total = paymentDetails.reduce((sum, item) => sum + (item.paymentBase || 0), 0);
    return Math.round(total / paymentDetails.length);
}

/**
 * 计算平均缴费指数
 */
function calculateAvgIndex(paymentDetails, socialAvgWage = 7500) {
    if (!paymentDetails || paymentDetails.length === 0) return 0;
    const totalIndex = paymentDetails.reduce((sum, item) => {
        return sum + ((item.paymentBase || 0) / socialAvgWage);
    }, 0);
    return (totalIndex / paymentDetails.length).toFixed(4);
}

/**
 * 获取计发月数
 */
function getCalculateMonths(age) {
    const monthMap = {
        40: 233, 41: 230, 42: 226, 43: 223, 44: 220,
        45: 216, 46: 212, 47: 208, 48: 204, 49: 199,
        50: 195, 51: 190, 52: 185, 53: 180, 54: 175,
        55: 170, 56: 164, 57: 158, 58: 152, 59: 145,
        60: 139, 61: 132, 62: 125, 63: 117, 64: 109,
        65: 101, 66: 93,  67: 84,  68: 75,  69: 65,
        70: 56
    };
    return monthMap[age] || 139;
}

/**
 * 深拷贝
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (obj instanceof Object) {
        const copy = {};
        Object.keys(obj).forEach(key => {
            copy[key] = deepClone(obj[key]);
        });
        return copy;
    }
    return obj;
}

/**
 * 防抖函数
 */
function debounce(fn, delay = 300) {
    let timer = null;
    return function(...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    };
}

/**
 * 节流函数
 */
function throttle(fn, delay = 300) {
    let lastTime = 0;
    return function(...args) {
        const now = Date.now();
        if (now - lastTime >= delay) {
            fn.apply(this, args);
            lastTime = now;
        }
    };
}
