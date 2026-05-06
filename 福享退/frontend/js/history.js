/**
 * 历史记录相关逻辑
 */

/**
 * 加载历史记录
 */
function loadHistory() {
    const historyList = Storage.getHistoryList();
    const emptyState = document.getElementById('emptyState');
    const listContainer = document.getElementById('page-history');
    
    if (!historyList || historyList.length === 0) {
        // 显示空状态
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        // 清除其他历史卡片
        const cards = listContainer.querySelectorAll('.history-card');
        cards.forEach(card => card.remove());
        return;
    }
    
    // 隐藏空状态
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // 渲染历史记录列表
    renderHistoryList(historyList);
}

/**
 * 渲染历史记录列表
 */
function renderHistoryList(list) {
    const listContainer = document.getElementById('page-history');
    
    // 清除现有卡片（保留空状态元素）
    const existingCards = listContainer.querySelectorAll('.history-card');
    existingCards.forEach(card => card.remove());
    
    list.forEach(item => {
        const card = createHistoryCard(item);
        listContainer.appendChild(card);
    });
}

/**
 * 创建历史记录卡片
 */
function createHistoryCard(item) {
    const card = document.createElement('div');
    card.className = 'history-card';
    
    const pensionDetails = item.result?.pensionDetails || {};
    const basicInfo = item.result?.basicInfo || {};
    
    card.innerHTML = `
        <div class="history-header">
            <span class="history-date">${item.createTime || ''}</span>
            <span class="history-amount">${formatCurrency(pensionDetails.totalMonthlyPension || 0)}</span>
        </div>
        <div class="history-info">
            <div class="history-info-item">
                退休年龄
                <span>${basicInfo.retirementAge || '-'}岁</span>
            </div>
            <div class="history-info-item">
                累计缴费
                <span>${basicInfo.totalPaymentYears || '-'}年</span>
            </div>
            <div class="history-info-item">
                平均指数
                <span>${basicInfo.avgPaymentIndex || '-'}</span>
            </div>
        </div>
    `;
    
    // 点击查看详情
    card.addEventListener('click', () => {
        showHistoryDetail(item);
    });
    
    return card;
}

/**
 * 显示历史记录详情
 */
function showHistoryDetail(item) {
    // 渲染结果
    renderCalculateResult(item.result);
    
    // 跳转到结果页
    goToPage('result');
}
