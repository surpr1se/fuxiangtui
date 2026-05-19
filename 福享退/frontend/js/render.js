// ==================== 缴费明细渲染（完全动态，基于PDF返回的数据真实年份动态渲染） ====================
function renderPaymentDetails() {
    const totalMonths = appData.paymentDetails.length;
    const titleEl = document.querySelector('#page-payment .table-title');
    if (titleEl) {
        titleEl.textContent = '缴费明细（共 ' + totalMonths + ' 个月）';
    }
    
    const tableCard = document.querySelector('#page-payment .table-card');
    
    // 先移除所有旧内容，只保留必要的结构
    if (tableCard) {
        const existingRows = tableCard.querySelectorAll('.table-row');
        existingRows.forEach(row => row.remove());
        const existingDetails = tableCard.querySelectorAll('.detail-content');
        existingDetails.forEach(detail => detail.remove());
    }
    
    // 动态更新年份选择下拉框
    const yearSelect = document.querySelector('#page-payment .year-select');
    if (yearSelect) {
        const years = [...new Set(appData.paymentDetails.map(item => item.yearMonth.split('-')[0]))].sort().reverse();
        yearSelect.innerHTML = '<option>全部年份</option>';
        years.forEach(year => {
            yearSelect.innerHTML += '<option>' + year + '年</option>';
        });
    }
    
    // 添加PDF解析信息卡片
    if (appData.pdfInfo && tableCard) {
        let oldInfo = document.querySelector('.pdf-info-card');
        if (oldInfo) oldInfo.remove();
        
        const wrapper = document.createElement('div');
        wrapper.className = 'pdf-info-card';
        wrapper.innerHTML = '<div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">' +
            '<div style="width: 20px; height: 20px; background: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; flex-shrink: 0;">✓</div>' +
            '<div style="flex: 1;">' +
                '<div style="font-weight: 600; color: #166534; font-size: 14px;">PDF解析成功</div>' +
                '<div style="color: #666; font-size: 12px; margin-top: 2px;">提取到 ' + totalMonths + ' 条缴费记录</div>' +
            '</div>' +
        '</div>';
        tableCard.parentNode.insertBefore(wrapper, tableCard);
    }
    
    // 按年份分组
    const yearGroups = {};
    let totalAmount = 0;
    
    for (let i = 0; i < appData.paymentDetails.length; i++) {
        const item = appData.paymentDetails[i];
        const year = item.yearMonth.split('-')[0];
        if (!yearGroups[year]) yearGroups[year] = [];
        yearGroups[year].push(item);
        totalAmount += item.paymentBase;
    }
    
    const years = Object.keys(yearGroups).sort().reverse();
    
    // 动态初始化originalBase，确保PDF解析的年份（2025、2026等）都有原始基数
    years.forEach(year => {
        if (!window.originalBase) window.originalBase = {};
        if (!window.originalBase[year]) {
            const items = yearGroups[year];
            let yearTotal = 0;
            items.forEach(item => yearTotal += item.paymentBase);
            window.originalBase[year] = Math.round(yearTotal / items.length);
        }
    });
    
    // 动态生成每个年份的行
    if (tableCard) {
        years.forEach(year => {
            const items = yearGroups[year];
            let yearTotal = 0;
            for (let j = 0; j < items.length; j++) {
                yearTotal += items[j].paymentBase;
            }
            const avgBase = Math.round(yearTotal / items.length);
            const original = window.originalBase[year] || avgBase;
            const hasModified = avgBase !== original;
            
            const yearRow = document.createElement('div');
            yearRow.className = 'table-row';
            yearRow.id = 'row-' + year;
            yearRow.innerHTML = 
                '<div class="row-left">' +
                    '<div class="row-year" style="cursor:pointer;" onclick="toggleDetail(\'detail-' + year + '\')">' + year + '年' + (hasModified ? ' <span class="modified-tag" id="tag-' + year + '" style="display:inline-block;background:#FEF3C7;color:#D97706;font-size:11px;padding:2px 6px;border-radius:4px;margin-left:8px;">已修改</span>' : '') + '</div>' +
                    '<div class="row-base" id="base-' + year + '">' +
                        (hasModified ? '缴费基数：<span style="text-decoration:line-through;color:#999;">' + original + '</span> > <span style="color:#FF6B6B;font-weight:600;">' + avgBase + '</span> 元' : '缴费基数：' + avgBase + ' 元') +
                    '</div>' +
                '</div>' +
                '<div class="row-right">' +
                    '<div class="row-money">¥ ' + (yearTotal * 0.08).toLocaleString() + '</div>' +
                    '<div class="row-month">' + items.length + '个月</div>' +
                    '<button class="edit-btn" onclick="console.log(\'点击编辑按钮，年份:\', ' + year + ');window.openEditModal(' + year + ');event.stopPropagation();">编辑</button>' +
                '</div>';
            tableCard.appendChild(yearRow);
            
            // 展开每月明细
            const detailRow = document.createElement('div');
            detailRow.className = 'detail-content';
            detailRow.id = 'detail-' + year;
            detailRow.style.display = 'none';
            
            let detailHtml = '<div style="padding:0 16px 16px;background:#F9FAFB;">';
            detailHtml += '<div style="font-size:12px;color:#666;font-weight:600;margin-bottom:8px;">📋 ' + year + '年度每月缴费明细</div>';
            detailHtml += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">';
            
            // 按月份排序
            items.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
            
            items.forEach(item => {
                const month = item.yearMonth.split('-')[1];
                detailHtml += '<div style="background:white;padding:6px 8px;border-radius:4px;text-align:center;">' +
                    '<div style="font-size:11px;color:#999;">' + month + '月</div>' +
                    '<div style="font-size:13px;font-weight:600;color:#333;">¥' + item.paymentBase.toLocaleString() + '</div>' +
                '</div>';
            });
            
            detailHtml += '</div></div>';
            detailRow.innerHTML = detailHtml;
            tableCard.appendChild(detailRow);
        });
    }
    
    // 更新底部统计 - 完全替换硬编码内容
    const personalTotal = Math.round(totalAmount * 0.08);
    const avgBase = Math.round(totalAmount / totalMonths);
    const avgIndex = (avgBase / 6000).toFixed(2); // 简化计算，假设社平工资6000
    
    const summaryCard = document.querySelector('#page-payment .summary-card');
    if (summaryCard) {
        summaryCard.innerHTML = 
            '<div class="summary-title">累计缴费总额</div>' +
            '<div class="summary-number">¥ ' + personalTotal.toLocaleString() + '</div>' +
            '<div class="summary-unit">（个人缴费部分）</div>' +
            '<div class="summary-row">' +
                '<div class="summary-item">' +
                    '<div class="summary-label">缴费月数</div>' +
                    '<div class="summary-value">' + totalMonths + '个月</div>' +
                '</div>' +
                '<div class="summary-item">' +
                    '<div class="summary-label">平均基数</div>' +
                    '<div class="summary-value">¥ ' + avgBase.toLocaleString() + '</div>' +
                '</div>' +
                '<div class="summary-item">' +
                    '<div class="summary-label">平均指数</div>' +
                    '<div class="summary-value">' + avgIndex + '</div>' +
                '</div>' +
            '</div>';
    }
    
    console.log('✅ 缴费明细渲染完成，共 ' + years.length + ' 年 ' + totalMonths + ' 个月，平均基数：' + avgBase);
}

window.renderPaymentDetails = renderPaymentDetails;

/**
* 年份筛选
*/
function filterByYear(yearValue) {
    const targetYear = yearValue.replace('年', '');
    const allRows = document.querySelectorAll('.table-row');
    const allDetails = document.querySelectorAll('.detail-content');
    
    if (targetYear === '全部年份') {
        allRows.forEach(row => row.style.display = 'flex');
        allDetails.forEach(detail => detail.style.display = 'none');
    } else {
        allRows.forEach(row => {
            if (row.dataset.year === targetYear) {
                row.style.display = 'flex';
            } else {
                row.style.display = 'none';
            }
        });
        allDetails.forEach(detail => {
            if (detail.dataset.year === targetYear) {
                detail.style.display = 'block';
            } else {
                detail.style.display = 'none';
            }
        });
    }
}

window.filterByYear = filterByYear;
