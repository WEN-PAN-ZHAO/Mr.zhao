// 全局数据初始化（合并定义，确保所有数据可被JSON序列化）
let periodRecords = [];
let currentDate = new Date();
let selectedDate = null;
let currentIdentity = 'self'; // 'self' 或 'partner'
let reminderSettings = {
    enabled: false,
    periodAdvance: 3,
    ovulation: true,
    anniversary: true
};
let coupleData = {
    loveValue: 20,
    loveLevel: 1,
    interactions: [],
    anniversary: [],
    partnerRecords: [],
    syncCode: '',
    users: {},
    checkinDays: 0, // 连续签到天数
    lastCheckin: null, // 最后签到日期
    tasks: { // 任务完成状态
        task1: false, // 同步记录
        task2: false, // 添加纪念日
        task3: false, // 连续签到7天
        task4: false, // 3篇日记
        task5: false  // 完整周期
    },
    achievements: { // 成就解锁状态
        初恋萌芽: false,
        亲密无间: false,
        爱情长跑: false,
        完美伴侣: false
    },
    diaries: [] // 爱情日记
};
let userData = {
    name: '',
    coupleCode: ''
};

// 生成6位字母数字同步码（确保无特殊字符）
function generateSyncCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// 初始化同步码
coupleData.syncCode = generateSyncCode();

// 恋爱等级配置（增强版）
const LOVE_LEVEL_CONFIG = [
    { 
        level: 1, 
        min: 0, 
        max: 100, 
        desc: "特权：基础互动、每日签到",
        icon: "❤️"
    },
    { 
        level: 2, 
        min: 100, 
        max: 300, 
        desc: "特权：解锁纪念日、经期关怀提示",
        icon: "💖"
    },
    { 
        level: 3, 
        min: 300, 
        max: 600, 
        desc: "特权：高级互动、爱情成就系统",
        icon: "💘"
    },
    { 
        level: 4, 
        min: 600, 
        max: 1000, 
        desc: "特权：专属互动特效、数据导出权限",
        icon: "💝"
    },
    { 
        level: 5, 
        min: 1000, 
        max: Infinity, 
        desc: "特权：爱情大师称号、全部功能解锁",
        icon: "💞"
    }
];

// 安全加载本地存储数据（兼容新增字段）
function loadLocalData() {
    try {
        // 加载经期记录
        const periods = localStorage.getItem('periodRecords');
        if (periods) {
            const parsed = JSON.parse(periods);
            if (Array.isArray(parsed)) periodRecords = parsed;
        }

        // 加载提醒设置
        const reminder = localStorage.getItem('reminderSettings');
        if (reminder) {
            const parsed = JSON.parse(reminder);
            if (typeof parsed === 'object') reminderSettings = { ...reminderSettings, ...parsed };
        }

        // 加载情侣数据（处理新增字段兼容）
        const couple = localStorage.getItem('coupleData');
        if (couple) {
            const parsed = JSON.parse(couple);
            if (typeof parsed === 'object') {
                // 合并旧数据与新字段，确保不丢失新增属性
                coupleData = {
                    ...coupleData,
                    ...parsed,
                    tasks: { ...coupleData.tasks, ...(parsed.tasks || {}) },
                    achievements: { ...coupleData.achievements, ...(parsed.achievements || {}) }
                };
            }
        }

        // 加载用户数据
        const user = localStorage.getItem('userData');
        if (user) {
            const parsed = JSON.parse(user);
            if (typeof parsed === 'object') userData = parsed;
        }
    } catch (e) {
        console.warn('本地数据损坏，使用默认值:', e);
        localStorage.clear(); // 清除损坏数据
    }
}

// 保存数据到本地存储
function saveAllData() {
    try {
        localStorage.setItem('periodRecords', JSON.stringify(periodRecords));
        localStorage.setItem('reminderSettings', JSON.stringify(reminderSettings));
        localStorage.setItem('coupleData', JSON.stringify(coupleData));
        localStorage.setItem('userData', JSON.stringify(userData));
    } catch (e) {
        console.error('保存数据失败:', e);
        showToast('数据保存失败，请重试');
    }
}

// 页面初始化（修复登录界面问题）
document.addEventListener('DOMContentLoaded', function() {
    loadLocalData();

    // 检查本地存储可用性
    if (!isLocalStorageAvailable()) {
        showToast('请开启浏览器本地存储功能');
        document.getElementById('enter-btn').disabled = true;
        document.getElementById('enter-btn').style.opacity = '0.6';
        hideLoader();
        return;
    }

    // 强制初始化所有页面样式（解决移动端初始样式错乱）
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById('auth-page').style.display = 'block';
    document.getElementById('auth-page').classList.add('active');

    // 已登录用户直接进入应用
    if (userData.name && userData.coupleCode) {
        document.getElementById('auth-page').style.display = 'none';
        document.getElementById('auth-page').classList.remove('active');
        document.getElementById('main-page').style.display = 'block';
        document.getElementById('main-page').classList.add('active');
        proceedToApp();
    } else {
        hideLoader();
    }

    // 绑定所有事件
    bindAllEvents();
});

// 检查本地存储是否可用
function isLocalStorageAvailable() {
    try {
        const testKey = 'test_' + Date.now();
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

// 绑定所有事件
function bindAllEvents() {
    // 基础导航事件
    bindNavigationEvents();
    // 登录事件
    bindAuthEvents();
    // 记录管理事件
    bindRecordEvents();
    // 情侣互动事件
    bindCoupleEvents();
    // 提醒设置事件
    bindReminderEvents();
    // 数据管理事件
    bindDataEvents();
    // 弹窗关闭事件
    bindModalCloseEvents();
}

// 导航事件
function bindNavigationEvents() {
    // 底部导航切换
    document.getElementById('btn-main').addEventListener('click', () => {
        switchPage('main-page', 'btn-main');
    });
    document.getElementById('btn-couple').addEventListener('click', () => {
        switchPage('couple-page', 'btn-couple');
    });
    document.getElementById('btn-me').addEventListener('click', () => {
        switchPage('me-page', 'btn-me');
    });

    // 身份切换（自己/伴侣）
    document.getElementById('identity-self').addEventListener('click', () => {
        currentIdentity = 'self';
        document.getElementById('identity-self').classList.add('active');
        document.getElementById('identity-partner').classList.remove('active');
        renderCalendar();
    });
    document.getElementById('identity-partner').addEventListener('click', () => {
        currentIdentity = 'partner';
        document.getElementById('identity-partner').classList.add('active');
        document.getElementById('identity-self').classList.remove('active');
        renderCalendar();
    });
}

// 切换页面通用函数
function switchPage(pageId, btnId) {
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });
    document.getElementById(pageId).style.display = 'block';
    document.getElementById(pageId).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(btnId).classList.add('active');
}

// 登录相关事件
function bindAuthEvents() {
    document.getElementById('enter-btn').addEventListener('click', enterApp);
}

// 进入应用
function enterApp() {
    const userName = document.getElementById('user-name').value.trim();
    const coupleCode = document.getElementById('couple-code').value.trim().toUpperCase();
    
    if (!userName) {
        showToast('请输入昵称');
        return;
    }

    showLoader();
    userData.name = userName;

    try {
        // 处理情侣码
        if (coupleCode && /^[A-Z0-9]{6}$/.test(coupleCode)) {
            userData.coupleCode = coupleCode;
            coupleData.syncCode = coupleCode;
        } else {
            const newCode = generateSyncCode();
            userData.coupleCode = newCode;
            coupleData.syncCode = newCode;
        }

        // 记录用户加入时间
        coupleData.users[userName] = new Date().toISOString();

        // 保存数据
        saveAllData();
        proceedToApp();
    } catch (e) {
        console.error('进入应用失败:', e);
        showToast('操作失败，请重试');
        hideLoader();
    }
}

// 进入应用主界面
function proceedToApp() {
    try {
        // 更新用户信息显示
        document.getElementById('user-name-display').textContent = userData.name;
        document.getElementById('my-couple-code').textContent = coupleData.syncCode;
        document.getElementById('couple-code-display').textContent = coupleData.syncCode;

        // 初始化核心功能
        renderCalendar();
        renderHistory();
        renderAnalysis();
        updateLoveLevel();
        renderInteractions();
        renderPartnerRecords();
        checkDailyCheckinStatus();
        updateTasks();
        updateAchievements();
        initReminderSettings();

        hideLoader();
    } catch (e) {
        console.error('初始化失败:', e);
        showToast('加载失败，请重试');
        hideLoader();
    }
}

// 记录管理事件
function bindRecordEvents() {
    // 保存记录
    document.getElementById('save-record').addEventListener('click', savePeriodRecord);
    // 编辑记录确认
    document.getElementById('save-edit').addEventListener('click', saveEditedRecord);
    // 历史记录区域事件委托（编辑/删除）
    document.getElementById('history-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const index = e.target.dataset.index;
            openEditModal(index);
        } else if (e.target.classList.contains('delete-btn')) {
            const index = e.target.dataset.index;
            deleteRecord(index);
        }
    });
    // 日历月份切换
    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
}

// 保存经期记录
function savePeriodRecord() {
    const start = document.getElementById('start-date').value;
    const end = document.getElementById('end-date').value;
    const symptoms = document.getElementById('symptoms').value.trim();
    const msgEl = document.getElementById('record-message');

    if (!start || !end) {
        msgEl.textContent = '请选择日期';
        msgEl.style.color = 'red';
        vibrate(200);
        return;
    }

    if (new Date(start) > new Date(end)) {
        msgEl.textContent = '开始日期不能晚于结束日期';
        msgEl.style.color = 'red';
        vibrate(200);
        return;
    }

    // 保存记录
    periodRecords.push({ start, end, symptoms });
    saveAllData();

    // 更新UI
    msgEl.textContent = '保存成功';
    msgEl.style.color = 'green';
    renderHistory();
    renderAnalysis();
    renderCalendar();

    // 清空表单
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    document.getElementById('symptoms').value = '';
    showToast('记录已保存');
}

// 打开编辑模态框
function openEditModal(index) {
    const record = periodRecords[index];
    document.getElementById('edit-index').value = index;
    document.getElementById('edit-start').value = record.start;
    document.getElementById('edit-end').value = record.end;
    document.getElementById('edit-symptoms').value = record.symptoms || '';
    document.getElementById('edit-modal').style.display = 'flex';
}

// 保存编辑后的记录
function saveEditedRecord() {
    const index = document.getElementById('edit-index').value;
    const start = document.getElementById('edit-start').value;
    const end = document.getElementById('edit-end').value;
    const symptoms = document.getElementById('edit-symptoms').value.trim();

    if (!start || !end) {
        showToast('请填写完整日期');
        return;
    }

    if (new Date(start) > new Date(end)) {
        showToast('日期错误');
        return;
    }

    // 更新记录
    periodRecords[index] = { start, end, symptoms };
    saveAllData();
    
    // 关闭模态框并更新UI
    document.getElementById('edit-modal').style.display = 'none';
    renderHistory();
    renderAnalysis();
    renderCalendar();
    showToast('更新成功');
}

// 删除记录
function deleteRecord(index) {
    if (confirm('确定删除这条记录吗？')) {
        periodRecords.splice(index, 1);
        saveAllData();
        renderHistory();
        renderAnalysis();
        renderCalendar();
        showToast('已删除');
    }
}

// 渲染日历
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    document.getElementById('current-month').textContent = `${year}年${month + 1}月`;

    const daysContainer = document.getElementById('calendar-days');
    daysContainer.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // 添加上月空白
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'day empty';
        daysContainer.appendChild(empty);
    }

    // 生成日期
    const today = new Date();
    const targetRecords = currentIdentity === 'self' ? periodRecords : coupleData.partnerRecords;

    for (let day = 1; day <= totalDays; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'day';
        dayEl.textContent = day;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dayEl.dataset.date = dateStr;

        // 标记今天
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayEl.classList.add('today');
        }

        // 标记选中
        if (selectedDate === dateStr) {
            dayEl.classList.add('selected');
        }

        // 标记经期
        if (isDateInRecords(dateStr, targetRecords, 'period')) {
            dayEl.classList.add('period');
        }

        // 标记排卵期
        if (isDateInRecords(dateStr, targetRecords, 'ovulation')) {
            dayEl.classList.add('ovulation');
        }

        // 点击事件
        dayEl.addEventListener('click', () => {
            selectedDate = dateStr;
            document.getElementById('selected-date').textContent = `选中日期：${selectedDate}`;
            
            // 自动填充表单
            const startInput = document.getElementById('start-date');
            const endInput = document.getElementById('end-date');
            if (!startInput.value || new Date(startInput.value) > new Date(dateStr)) {
                startInput.value = dateStr;
            } else if (!endInput.value || new Date(endInput.value) < new Date(dateStr)) {
                endInput.value = dateStr;
            }
            renderCalendar(); // 重新渲染更新样式
        });

        daysContainer.appendChild(dayEl);
    }
}

// 判断日期是否在记录中（经期或排卵期）
function isDateInRecords(dateStr, records, type) {
    const targetDate = new Date(dateStr);
    
    // 检查是否为经期
    if (type === 'period') {
        for (const record of records) {
            const start = new Date(record.start);
            const end = new Date(record.end);
            if (targetDate >= start && targetDate <= end) {
                return true;
            }
        }
        return false;
    }

    // 检查是否为排卵期（下次月经前14天左右）
    if (type === 'ovulation' && records.length > 0) {
        const lastRecord = records[records.length - 1];
        const lastEnd = new Date(lastRecord.end);
        const avgCycle = calculateAvgCycle() || 28;
        
        // 预测下次月经开始
        const nextStart = new Date(lastEnd);
        nextStart.setDate(lastEnd.getDate() + (avgCycle - (lastEnd - new Date(lastRecord.start)) / (1000 * 60 * 60 * 24)));
        
        // 排卵期为下次月经前14天
        const ovulationDate = new Date(nextStart);
        ovulationDate.setDate(nextStart.getDate() - 14);
        
        // 前后3天均视为排卵期
        const startOvulation = new Date(ovulationDate);
        startOvulation.setDate(ovulationDate.getDate() - 3);
        const endOvulation = new Date(ovulationDate);
        endOvulation.setDate(ovulationDate.getDate() + 3);
        
        return targetDate >= startOvulation && targetDate <= endOvulation;
    }

    return false;
}

// 计算平均周期
function calculateAvgCycle() {
    if (periodRecords.length < 2) return null;
    let total = 0;
    for (let i = 1; i < periodRecords.length; i++) {
        total += (new Date(periodRecords[i].start) - new Date(periodRecords[i-1].start)) / (1000 * 60 * 60 * 24);
    }
    return Math.round(total / (periodRecords.length - 1));
}

// 渲染历史记录
function renderHistory() {
    const listEl = document.getElementById('history-list');
    if (periodRecords.length === 0) {
        listEl.innerHTML = '暂无记录';
        return;
    }

    // 按日期倒序
    const sorted = [...periodRecords].sort((a, b) => 
        new Date(b.start) - new Date(a.start)
    );

    let html = '';
    sorted.forEach((item, i) => {
        html += `
            <div class="history-item">
                <span>经期：${item.start} 至 ${item.end} ${item.symptoms ? '（' + item.symptoms + '）' : ''}</span>
                <div>
                    <button class="edit-btn" data-index="${i}">编辑</button>
                    <button class="delete-btn" data-index="${i}">删除</button>
                </div>
            </div>
        `;
    });
    listEl.innerHTML = html;
}

// 渲染周期分析
function renderAnalysis() {
    const resultEl = document.getElementById('analysis-result');
    if (periodRecords.length < 2) {
        resultEl.innerHTML = '请添加至少2条记录查看分析';
        return;
    }

    // 计算平均周期
    let totalCycle = 0;
    for (let i = 1; i < periodRecords.length; i++) {
        const prev = new Date(periodRecords[i-1].start);
        const curr = new Date(periodRecords[i].start);
        totalCycle += (curr - prev) / (1000 * 60 * 60 * 24);
    }
    const avgCycle = (totalCycle / (periodRecords.length - 1)).toFixed(1);

    // 计算平均经期
    let totalDays = 0;
    periodRecords.forEach(r => {
        totalDays += (new Date(r.end) - new Date(r.start)) / (1000 * 60 * 60 * 24) + 1;
    });
    const avgDuration = (totalDays / periodRecords.length).toFixed(1);

    // 预测下次经期
    const nextPeriod = predictNextPeriod();

    resultEl.innerHTML = `
        <div>平均周期：${avgCycle} 天</div>
        <div>平均经期：${avgDuration} 天</div>
        <div>下次预测：${nextPeriod}</div>
    `;
}

// 预测下次经期
function predictNextPeriod() {
    const lastStart = new Date(periodRecords[periodRecords.length - 1].start);
    const avg = calculateAvgCycle() || 28;
    lastStart.setDate(lastStart.getDate() + avg);
    return `${lastStart.getFullYear()}-${String(lastStart.getMonth() + 1).padStart(2, '0')}-${String(lastStart.getDate()).padStart(2, '0')}`;
}

// 情侣互动事件
function bindCoupleEvents() {
    // 每日签到
    document.getElementById('daily-checkin').addEventListener('click', handleCheckin);
    
    // 发送关心
    document.getElementById('send-care').addEventListener('click', () => {
        if (checkLevel(1)) {
            document.getElementById('care-modal').style.display = 'flex';
            document.getElementById('care-content').value = '';
        }
    });
    document.getElementById('send-care-confirm').addEventListener('click', sendCareMessage);
    
    // 同步数据
    document.getElementById('sync-data').addEventListener('click', syncData);
    
    // 添加纪念日
    document.getElementById('add-anniversary').addEventListener('click', () => {
        if (checkLevel(2)) {
            document.getElementById('anniversary-modal').style.display = 'flex';
            document.getElementById('anniversary-date').value = '';
            document.getElementById('anniversary-name').value = '';
        }
    });
    document.getElementById('save-anniversary').addEventListener('click', saveAnniversary);
    
    // 经期关怀
    document.getElementById('period-tips').addEventListener('click', showPeriodTips);
    
    // 赠送礼物
    document.getElementById('send-gift').addEventListener('click', () => {
        if (checkLevel(3)) {
            document.getElementById('gift-modal').style.display = 'flex';
            document.getElementById('gift-name').value = '';
            document.getElementById('gift-message').value = '';
        }
    });
    document.getElementById('send-gift-confirm').addEventListener('click', sendGift);
    
    // 爱情日记
    document.getElementById('write-diary').addEventListener('click', () => {
        if (checkLevel(3)) {
            document.getElementById('diary-modal').style.display = 'flex';
            document.getElementById('diary-title').value = '';
            document.getElementById('diary-content').value = '';
        }
    });
    document.getElementById('save-diary').addEventListener('click', saveDiary);
    
    // 复制情侣码
    document.getElementById('copy-code').addEventListener('click', copyCoupleCode);
}

// 检查等级权限
function checkLevel(required) {
    if (coupleData.loveLevel >= required) return true;
    showToast(`需要恋爱等级 Lv${required} 解锁`);
    return false;
}

// 每日签到处理
function handleCheckin() {
    const today = new Date().toDateString();
    const lastCheckinDate = coupleData.lastCheckin ? new Date(coupleData.lastCheckin).toDateString() : null;
    
    // 检查是否已签到
    if (lastCheckinDate === today) {
        showToast('今天已经签过到啦～');
        return;
    }
    
    // 连续签到逻辑
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (lastCheckinDate === yesterdayStr) {
        coupleData.checkinDays += 1;
    } else {
        coupleData.checkinDays = 1;
    }
    
    // 签到奖励（连续天数越多奖励越高）
    let reward = 5;
    if (coupleData.checkinDays >= 7) reward = 15;
    else if (coupleData.checkinDays >= 3) reward = 10;
    
    // 记录签到
    coupleData.lastCheckin = new Date().toISOString();
    addInteraction(`每日签到（连续${coupleData.checkinDays}天）`, reward, 'checkin');
    
    // 更新按钮状态
    const checkinBtn = document.getElementById('daily-checkin');
    checkinBtn.textContent = `已签到（+${reward}）`;
    checkinBtn.disabled = true;
    checkinBtn.style.background = '#9e9e9e';
}

// 检查签到状态
function checkDailyCheckinStatus() {
    const checkinBtn = document.getElementById('daily-checkin');
    const today = new Date().toDateString();
    const lastCheckinDate = coupleData.lastCheckin ? new Date(coupleData.lastCheckin).toDateString() : null;
    
    if (lastCheckinDate === today) {
        checkinBtn.textContent = `已签到`;
        checkinBtn.disabled = true;
        checkinBtn.style.background = '#9e9e9e';
    } else {
        checkinBtn.textContent = `每日签到 +${coupleData.checkinDays >=3 ? 10 : 5}`;
        checkinBtn.disabled = false;
        checkinBtn.style.background = '';
    }
}

// 发送关心消息
function sendCareMessage() {
    const content = document.getElementById('care-content').value.trim();
    if (!content) {
        showToast('请输入关心的内容');
        return;
    }

    // 根据内容长度给予不同奖励
    const reward = content.length > 10 ? 8 : 5;
    addInteraction(`发送关心：${content}`, reward, 'care');
    document.getElementById('care-modal').style.display = 'none';
}

// 同步数据
function syncData() {
    // 模拟数据同步（实际项目可对接后端）
    coupleData.partnerRecords = periodRecords; // 简化处理：将自己的记录同步为伴侣记录
    addInteraction(`同步经期记录`, 15, 'sync');
    renderPartnerRecords();
    showToast('数据同步成功');
}

// 保存纪念日
function saveAnniversary() {
    const date = document.getElementById('anniversary-date').value;
    const name = document.getElementById('anniversary-name').value.trim();
    if (!date || !name) {
        showToast('请填写完整信息');
        return;
    }

    coupleData.anniversary.push({ date, name });
    addInteraction(`添加纪念日：${name}`, 15, 'anniversary');
    document.getElementById('anniversary-modal').style.display = 'none';
}

// 显示经期关怀提示
function showPeriodTips() {
    let tips = '经期建议：多喝温水，注意休息，避免生冷食物~';
    
    if (coupleData.partnerRecords.length > 0) {
        const last = coupleData.partnerRecords[coupleData.partnerRecords.length - 1];
        if (last.symptoms && last.symptoms.includes('腹痛')) {
            tips += ' 可准备红糖姜茶缓解腹痛。';
        }
        if (last.symptoms && last.symptoms.includes('疲劳')) {
            tips += ' 帮助分担家务，让她多休息。';
        }
    }
    
    showToast(tips);
    addInteraction('查看经期关怀提示', 3, 'tip');
}

// 赠送礼物
function sendGift() {
    const name = document.getElementById('gift-name').value.trim();
    const message = document.getElementById('gift-message').value.trim();
    if (!name) {
        showToast('请填写礼物名称');
        return;
    }

    addInteraction(`赠送礼物：${name}${message ? '（附言：' + message + '）' : ''}`, 20, 'gift');
    document.getElementById('gift-modal').style.display = 'none';
}

// 保存爱情日记
function saveDiary() {
    const title = document.getElementById('diary-title').value.trim();
    const content = document.getElementById('diary-content').value.trim();
    if (!title) {
        showToast('请填写日记标题');
        return;
    }

    coupleData.diaries.push({
        title,
        content,
        date: new Date().toISOString()
    });
    addInteraction(`记录爱情日记：${title}`, 12, 'diary');
    
    // 检查任务4（3篇日记）
    if (coupleData.diaries.length >= 3) {
        coupleData.tasks.task4 = true;
    }
    
    document.getElementById('diary-modal').style.display = 'none';
}

// 复制情侣码
function copyCoupleCode() {
    navigator.clipboard.writeText(coupleData.syncCode).then(() => {
        showToast('情侣码已复制');
    }).catch(() => {
        showToast('复制失败，请手动复制');
    });
}

// 添加互动记录并更新恋爱值
function addInteraction(content, value = 5, type = 'normal') {
    // 记录互动
    coupleData.interactions.unshift({
        user: userData.name,
        content: content,
        value: value,
        type: type,
        time: new Date().toLocaleString()
    });

    // 限制互动记录数量
    if (coupleData.interactions.length > 30) {
        coupleData.interactions = coupleData.interactions.slice(0, 30);
    }

    // 增加恋爱值
    const oldLevel = coupleData.loveLevel;
    coupleData.loveValue += value;

    // 保存数据并更新UI
    saveAllData();
    updateLoveLevel();
    updateActionButtons();
    renderInteractions();
    updateTasks();
    updateAchievements();
    
    // 等级提升动画
    if (oldLevel < coupleData.loveLevel) {
        showLevelUpAnimation();
    }
    
    showToast(`${content} +${value}恋爱值`);
}

// 更新恋爱等级UI
function updateLoveLevel() {
    let levelInfo = LOVE_LEVEL_CONFIG[0];
    LOVE_LEVEL_CONFIG.forEach(info => {
        if (coupleData.loveValue >= info.min) {
            levelInfo = info;
        }
    });
    coupleData.loveLevel = levelInfo.level;

    // 更新UI
    document.getElementById('love-level').textContent = `Lv${coupleData.loveLevel}`;
    document.getElementById('level-icon').textContent = levelInfo.icon;
    document.getElementById('level-privilege').textContent = levelInfo.desc;
    document.getElementById('current-love').textContent = coupleData.loveValue;
    document.getElementById('next-level-love').textContent = levelInfo.max === Infinity ? 'MAX' : levelInfo.max;

    // 进度条
    let progress = 0;
    if (levelInfo.max !== Infinity) {
        progress = Math.min(100, ((coupleData.loveValue - levelInfo.min) / (levelInfo.max - levelInfo.min)) * 100);
    } else {
        progress = 100;
    }
    document.getElementById('love-progress').style.width = `${progress}%`;
}

// 更新功能按钮状态（根据等级）
function updateActionButtons() {
    document.querySelectorAll('.interaction-btn[data-level]').forEach(btn => {
        const required = parseInt(btn.dataset.level);
        btn.disabled = coupleData.loveLevel < required;
        if (coupleData.loveLevel < required) {
            btn.title = `需要 Lv${required} 解锁`;
        } else {
            btn.title = '';
        }
    });
}

// 等级提升动画
function showLevelUpAnimation() {
    const levelUpEl = document.getElementById('level-up');
    levelUpEl.textContent = `升级啦！Lv${coupleData.loveLevel}`;
    levelUpEl.style.display = 'block';
    
    setTimeout(() => {
        levelUpEl.style.display = 'none';
    }, 1500);
}

// 渲染互动记录
function renderInteractions() {
    const listEl = document.getElementById('interaction-list');
    if (coupleData.interactions.length === 0) {
        listEl.innerHTML = '暂无互动，开始你们的甜蜜互动吧~';
        return;
    }

    let html = '';
    coupleData.interactions.slice(0, 8).forEach(item => {
        // 按类型添加样式
        let typeClass = '';
        if (item.type === 'checkin') typeClass = 'positive';
        else if (item.type === 'task' || item.type === 'achievement') typeClass = 'task';
        
        html += `<div class="interaction-item ${typeClass}">
            <strong>${item.user}</strong> ${item.time}：${item.content}（+${item.value}）
        </div>`;
    });
    listEl.innerHTML = html;
}

// 渲染伴侣记录
function renderPartnerRecords() {
    const listEl = document.getElementById('partner-list');
    if (coupleData.partnerRecords.length === 0) {
        listEl.innerHTML = '请先同步伴侣数据';
        return;
    }

    let html = '';
    coupleData.partnerRecords.forEach(item => {
        html += `<div>经期：${item.start} 至 ${item.end} ${item.symptoms ? '（' + item.symptoms + '）' : ''}</div>`;
    });
    listEl.innerHTML = html;
}

// 更新任务状态
function updateTasks() {
    // 任务1：同步记录
    if (coupleData.partnerRecords.length > 0 && !coupleData.tasks.task1) {
        coupleData.tasks.task1 = true;
        addInteraction('完成任务：同步经期记录', 15, 'task');
    }
    
    // 任务2：添加纪念日
    if (coupleData.anniversary.length > 0 && !coupleData.tasks.task2) {
        coupleData.tasks.task2 = true;
        addInteraction('完成任务：添加纪念日', 20, 'task');
    }
    
    // 任务3：连续签到7天
    if (coupleData.checkinDays >= 7 && !coupleData.tasks.task3) {
        coupleData.tasks.task3 = true;
        addInteraction('完成任务：连续签到7天', 30, 'task');
    }
    
    // 任务4：3篇日记
    if (coupleData.diaries.length >= 3 && !coupleData.tasks.task4) {
        coupleData.tasks.task4 = true;
        addInteraction('完成任务：记录3篇爱情日记', 40, 'task');
    }
    
    // 任务5：双方记录完整周期
    if (periodRecords.length >= 2 && coupleData.partnerRecords.length >= 2 && !coupleData.tasks.task5) {
        coupleData.tasks.task5 = true;
        addInteraction('完成任务：双方记录完整周期', 50, 'task');
    }
    
    // 更新任务UI
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`task${i}`).checked = coupleData.tasks[`task${i}`];
    }
    
    saveAllData();
}

// 更新成就状态
function updateAchievements() {
    // 成就1：初恋萌芽（等级1解锁）
    if (coupleData.loveLevel >= 1 && !coupleData.achievements.初恋萌芽) {
        coupleData.achievements.初恋萌芽 = true;
        addInteraction('解锁成就：初恋萌芽', 25, 'achievement');
    }
    
    // 成就2：亲密无间（等级3解锁）
    if (coupleData.loveLevel >= 3 && !coupleData.achievements.亲密无间) {
        coupleData.achievements.亲密无间 = true;
        addInteraction('解锁成就：亲密无间', 50, 'achievement');
    }
    
    // 成就3：爱情长跑（连续互动30天）
    if (coupleData.interactions.length >= 30 && !coupleData.achievements.爱情长跑) {
        coupleData.achievements.爱情长跑 = true;
        addInteraction('解锁成就：爱情长跑', 100, 'achievement');
    }
    
    // 成就4：完美伴侣（完成所有任务）
    const allTasksDone = Object.values(coupleData.tasks).every(v => v);
    if (allTasksDone && !coupleData.achievements.完美伴侣) {
        coupleData.achievements.完美伴侣 = true;
        addInteraction('解锁成就：完美伴侣', 150, 'achievement');
    }
    
    // 更新成就UI
    const achievements = document.querySelectorAll('.achievement-item');
    achievements[0].className = coupleData.achievements.初恋萌芽 ? 'achievement-item unlocked' : 'achievement-item locked';
    achievements[1].className = coupleData.achievements.亲密无间 ? 'achievement-item unlocked' : 'achievement-item locked';
    achievements[2].className = coupleData.achievements.爱情长跑 ? 'achievement-item unlocked' : 'achievement-item locked';
    achievements[3].className = coupleData.achievements.完美伴侣 ? 'achievement-item unlocked' : 'achievement-item locked';
    
    // 替换锁图标为成就图标
    if (coupleData.achievements.初恋萌芽) achievements[0].querySelector('i').className = 'fas fa-seedling';
    if (coupleData.achievements.亲密无间) achievements[1].querySelector('i').className = 'fas fa-heart';
    if (coupleData.achievements.爱情长跑) achievements[2].querySelector('i').className = 'fas fa-route';
    if (coupleData.achievements.完美伴侣) achievements[3].querySelector('i').className = 'fas fa-trophy';
    
    saveAllData();
}

// 提醒设置事件
function bindReminderEvents() {
    const enable = document.getElementById('enable-reminder');
    const options = document.getElementById('reminder-options');

    enable.addEventListener('change', () => {
        options.style.display = enable.checked ? 'block' : 'none';
    });

    document.getElementById('save-reminder').addEventListener('click', saveReminderSettings);
}

// 初始化提醒设置
function initReminderSettings() {
    const enable = document.getElementById('enable-reminder');
    const options = document.getElementById('reminder-options');

    enable.checked = reminderSettings.enabled;
    options.style.display = reminderSettings.enabled ? 'block' : 'none';
    document.getElementById('period-advance').value = reminderSettings.periodAdvance;
    document.getElementById('ovulation-reminder').checked = reminderSettings.ovulation;
    document.getElementById('anniversary-reminder').checked = reminderSettings.anniversary;
}

// 保存提醒设置
function saveReminderSettings() {
    reminderSettings = {
        enabled: document.getElementById('enable-reminder').checked,
        periodAdvance: parseInt(document.getElementById('period-advance').value),
        ovulation: document.getElementById('ovulation-reminder').checked,
        anniversary: document.getElementById('anniversary-reminder').checked
    };
    saveAllData();
    showToast('提醒设置已保存');
}

// 数据管理事件（导入导出等）
function bindDataEvents() {
    // 导出经期记录
    document.getElementById('export-data').addEventListener('click', exportRecords);
    // 导入经期记录
    document.getElementById('import-data-btn').addEventListener('click', () => {
        document.getElementById('import-data').click();
    });
    document.getElementById('import-data').addEventListener('change', importRecords);
    // 清除经期记录
    document.getElementById('clear-data').addEventListener('click', clearPeriodRecords);
    
    // 导出所有数据
    document.getElementById('export-all').addEventListener('click', exportAllData);
    // 导入所有数据
    document.getElementById('import-all').addEventListener('click', () => {
        document.getElementById('import-all-data').click();
    });
    document.getElementById('import-all-data').addEventListener('change', importAllData);
    // 清除所有数据
    document.getElementById('clear-all').addEventListener('click', clearAllData);
    
    // 退出登录
    document.getElementById('logout-btn').addEventListener('click', logout);
}

// 导出经期记录
function exportRecords() {
    if (periodRecords.length === 0) {
        showToast('暂无记录可导出');
        return;
    }

    let csv = '开始日期,结束日期,症状\n';
    periodRecords.forEach(r => {
        csv += `${r.start},${r.end},${r.symptoms || ''}\n`;
    });

    downloadFile(csv, `经期记录_${new Date().toLocaleDateString()}.csv`, 'text/csv');
}

// 导入经期记录
function importRecords(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const content = event.target.result;
            const lines = content.split('\n');
            const newRecords = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const [start, end, symptoms] = line.split(',');
                newRecords.push({ start, end, symptoms: symptoms || '' });
            }

            if (newRecords.length > 0) {
                periodRecords = [...periodRecords, ...newRecords];
                saveAllData();
                renderHistory();
                renderAnalysis();
                renderCalendar();
                showToast(`导入成功，共${newRecords.length}条`);
            } else {
                showToast('未找到有效记录');
            }
        } catch (e) {
            showToast('导入失败，文件格式错误');
        }
        // 清空输入，允许重复选择同一文件
        e.target.value = '';
    };
    reader.readAsText(file);
}

// 清除经期记录
function clearPeriodRecords() {
    if (confirm('确定清除所有经期记录吗？')) {
        periodRecords = [];
        saveAllData();
        renderHistory();
        renderAnalysis();
        renderCalendar();
        showToast('已清除所有经期记录');
    }
}

// 导出所有数据
function exportAllData() {
    const allData = {
        periodRecords,
        coupleData,
        userData,
        reminderSettings
    };
    const jsonStr = JSON.stringify(allData, null, 2);
    downloadFile(jsonStr, `所有数据_${new Date().toLocaleDateString()}.json`, 'application/json');
}

// 导入所有数据
function importAllData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const allData = JSON.parse(event.target.result);
            if (allData.periodRecords) periodRecords = allData.periodRecords;
            if (allData.coupleData) coupleData = allData.coupleData;
            if (allData.userData) userData = allData.userData;
            if (allData.reminderSettings) reminderSettings = allData.reminderSettings;

            saveAllData();
            proceedToApp();
            showToast('所有数据导入成功');
        } catch (e) {
            showToast('导入失败，文件格式错误');
        }
        e.target.value = '';
    };
    reader.readAsText(file);
}

// 清除所有数据
function clearAllData() {
    if (confirm('确定清除所有数据吗？这将删除所有记录和设置！')) {
        periodRecords = [];
        coupleData = {
            ...coupleData,
            loveValue: 20,
            loveLevel: 1,
            interactions: [],
            anniversary: [],
            partnerRecords: [],
            checkinDays: 0,
            lastCheckin: null,
            tasks: { task1: false, task2: false, task3: false, task4: false, task5: false },
            achievements: { 初恋萌芽: false, 亲密无间: false, 爱情长跑: false, 完美伴侣: false },
            diaries: []
        };
        reminderSettings = { enabled: false, periodAdvance: 3, ovulation: true, anniversary: true };
        
        saveAllData();
        proceedToApp();
        showToast('已清除所有数据');
    }
}

// 退出登录
function logout() {
    if (confirm('确定退出登录吗？')) {
        // 保留情侣码，清除用户名（允许重新登录同一情侣关系）
        userData.name = '';
        saveAllData();
        
        // 重置页面
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
            page.classList.remove('active');
        });
        document.getElementById('auth-page').style.display = 'block';
        document.getElementById('auth-page').classList.add('active');
        document.getElementById('user-name').value = '';
        document.getElementById('couple-code').value = '';
        
        showToast('已退出登录');
    }
}

// 弹窗关闭事件
function bindModalCloseEvents() {
    // 关闭按钮
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });

    // 点击外部关闭
    window.addEventListener('click', (e) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) modal.style.display = 'none';
        });
    });
}

// 下载文件通用函数
function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 震动提示（移动端）
function vibrate(duration) {
    if ('vibrate' in navigator) {
        navigator.vibrate(duration);
    }
}

// 显示提示框
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2000);
}

// 显示加载动画
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// 隐藏加载动画
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}
