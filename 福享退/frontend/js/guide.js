/**
 * 退休办理指南相关逻辑
 */

// 福建省各地市社保经办机构数据
const OFFICE_DATA = [
    {
        name: '福建省社会劳动保险局',
        address: '福州市鼓楼区杨桥东路128号社保大厦',
        phone: '0591-87542143'
    },
    {
        name: '福州市社会劳动保险中心',
        address: '福州市鼓楼区古田路128号劳动大厦',
        phone: '0591-87305703'
    },
    {
        name: '厦门市社会保险中心',
        address: '厦门市思明区长青路191号劳动力市场大厦',
        phone: '0592-12333'
    },
    {
        name: '泉州市社会劳动保险管理中心',
        address: '泉州市丰泽区东海行政中心交通科研楼B栋',
        phone: '0595-22181390'
    },
    {
        name: '漳州市社会劳动保险管理中心',
        address: '漳州市芗城区胜利西路150号劳动大厦',
        phone: '0596-2023814'
    },
    {
        name: '莆田市社会劳动保险中心',
        address: '莆田市城厢区荔城中大道2169号市政府办公楼',
        phone: '0594-2381908'
    },
    {
        name: '三明市社会劳动保险管理中心',
        address: '三明市梅列区金鹏花园3号楼',
        phone: '0598-8223704'
    },
    {
        name: '南平市社会劳动保险管理中心',
        address: '南平市延平区解放路98号',
        phone: '0599-8852112'
    },
    {
        name: '龙岩市社会劳动保险管理中心',
        address: '龙岩市新罗区龙岩大道1号市行政办公中心',
        phone: '0597-3298266'
    },
    {
        name: '宁德市社会劳动保险管理中心',
        address: '宁德市蕉城区蕉城南路40号',
        phone: '0593-2822426'
    },
    {
        name: '平潭综合实验区社会事业局',
        address: '平潭县潭城镇翠园南路10号',
        phone: '0591-23163678'
    }
];

/**
 * 初始化指南数据
 */
function initGuideData() {
    renderOfficeList();
}

/**
 * 渲染社保机构列表
 */
function renderOfficeList() {
    const listEl = document.getElementById('officeList');
    if (!listEl) return;
    
    listEl.innerHTML = OFFICE_DATA.map(office => `
        <div class="office-item">
            <div class="office-name">${office.name}</div>
            <div class="office-address">📍 ${office.address}</div>
            <div class="office-phone">📞 ${office.phone}</div>
        </div>
    `).join('');
}

/**
 * 办理条件列表（在HTML中直接写了，这里预留扩展）
 */
const CONDITIONS = [
    '达到法定退休年龄（男60岁、女工人50岁、女干部55岁）',
    '累计缴费年限满15年及以上'
];

/**
 * 办理流程（步骤）
 */
const PROCESS_STEPS = [
    { title: '准备材料', desc: '身份证、户口簿、档案、一寸照片等' },
    { title: '提交申请', desc: '到参保地社保经办机构提交退休申请' },
    { title: '待遇核算', desc: '社保经办机构核算养老金待遇' },
    { title: '审核审批', desc: '相关部门审核审批' },
    { title: '领取待遇', desc: '从批准退休次月起领取养老金' }
];

/**
 * 常见问题解答
 */
const FAQ_DATA = [
    {
        question: '退休前断缴了怎么办？',
        answer: '如果累计缴费已满15年，不影响办理退休，只是待遇会相应降低。如果未满15年，可以选择补缴或继续缴费至满15年。'
    },
    {
        question: '提前退休会影响待遇吗？',
        answer: '提前退休会导致缴费年限减少，个人账户储存额减少，因此养老金待遇会相应降低。但特殊工种等政策规定的提前退休除外。'
    },
    {
        question: '多地缴费如何办理退休？',
        answer: '可以选择在户籍所在地或最后一个缴费满10年的参保地办理退休，其他地区的缴费记录可以转移合并。'
    },
    {
        question: '退休后医保怎么办？',
        answer: '职工医保累计缴费满25年（男）/20年（女），退休后可继续享受医保待遇。不足年限可一次性补缴或继续缴费。'
    },
    {
        question: '养老金每年都会涨吗？',
        answer: '根据国家政策，养老金会根据物价上涨、工资增长等情况适时调整。近年来已连续18年上涨，具体调整幅度以当年政策为准。'
    }
];
