// QQ音乐自动签到插件
// 单文件版本，避免require问题
// 作者: SXIE-ai
// 版本: 1.0.0

// ============================================
// 工具函数
// ============================================

// 从Cookie提取uin
function extractUin(cookie) {
    const match = cookie.match(/uin=o?(\d+)/i);
    return match ? match[1] : '0';
}

// 延迟函数
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// HTTP请求函数
function httpRequest(options) {
    return new Promise((resolve, reject) => {
        $httpClient.post(options, (error, response, data) => {
            if (error) {
                reject(error);
                return;
            }
            
            try {
                const result = JSON.parse(data);
                resolve(result);
            } catch (e) {
                reject(new Error('响应解析失败'));
            }
        });
    });
}

// ============================================
// Cookie获取处理
// ============================================

function handleCookieRequest() {
    const url = $request.url;
    
    // 只处理QQ音乐相关请求
    if (!url.includes('qq.com')) {
        $done({});
        return;
    }
    
    const cookie = $request.headers['Cookie'] || $request.headers['cookie'];
    if (!cookie) {
        $done({});
        return;
    }
    
    // 保存Cookie
    $persistentStore.write(cookie, 'QQMusic_Cookie');
    
    // 显示通知
    const uin = extractUin(cookie);
    $notification.post('QQ音乐', 'Cookie获取成功', `账号: ${uin}`);
    
    $done({});
}

// ============================================
// 签到功能
// ============================================

async function doCheckin(cookie) {
    const uin = extractUin(cookie);
    
    const requestData = {
        "comm": {
            "ct": "6",
            "cv": "1000", 
            "uin": uin
        },
        "req": {
            "module": "music.task.TaskCenterServer",
            "method": "CheckIn",
            "param": {}
        }
    };
    
    const options = {
        url: 'https://u.y.qq.com/cgi-bin/musicu.fcg',
        headers: {
            'Cookie': cookie,
            'User-Agent': 'QQMusic/12.0.5',
            'Content-Type': 'application/json',
            'Referer': 'https://y.qq.com/'
        },
        body: JSON.stringify(requestData),
        timeout: 10000
    };
    
    return await httpRequest(options);
}

async function doVipCheckin(cookie) {
    const uin = extractUin(cookie);
    
    const requestData = {
        "comm": {
            "ct": "6",
            "cv": "1000",
            "uin": uin
        },
        "req": {
            "module": "music.vip.VipCenterServer", 
            "method": "CheckIn",
            "param": {}
        }
    };
    
    const options = {
        url: 'https://u.y.qq.com/cgi-bin/musicu.fcg',
        headers: {
            'Cookie': cookie,
            'User-Agent': 'QQMusic/12.0.5',
            'Content-Type': 'application/json',
            'Referer': 'https://y.qq.com/'
        },
        body: JSON.stringify(requestData)
    };
    
    return await httpRequest(options);
}

// ============================================
// 主签到流程
// ============================================

async function mainCheckin() {
    try {
        // 获取Cookie
        const cookie = $persistentStore.read('QQMusic_Cookie');
        if (!cookie) {
            $notification.post('QQ音乐签到', '失败', '请先打开QQ音乐获取Cookie');
            return;
        }
        
        console.log('开始QQ音乐签到...');
        
        // 1. 执行普通签到
        const checkinResult = await doCheckin(cookie);
        
        if (checkinResult.code === 0) {
            console.log('普通签到成功');
            
            // 解析奖励
            const reward = checkinResult.req?.data?.reward || {};
            let message = '签到成功！';
            const rewards = [];
            
            if (reward.exp) rewards.push(`经验+${reward.exp}`);
            if (reward.point) rewards.push(`积分+${reward.point}`);
            if (reward.vip_point) rewards.push(`成长值+${reward.vip_point}`);
            
            if (rewards.length > 0) {
                message += ' ' + rewards.join(' ');
            }
            
            // 保存签到状态
            const today = new Date().toLocaleDateString('zh-CN');
            $persistentStore.write(today, 'QQMusic_LastCheckin');
            
            $notification.post('QQ音乐签到', '成功', message);
            
            // 2. 执行VIP签到
            await delay(1000);
            const vipResult = await doVipCheckin(cookie);
            
            if (vipResult.code === 0) {
                console.log('VIP签到成功');
                const vipReward = vipResult.req?.data?.reward || {};
                if (vipReward.vip_point) {
                    $notification.post('QQ音乐VIP签到', '成功', `成长值+${vipReward.vip_point}`);
                }
            }
            
        } else if (checkinResult.code === 1001) {
            $notification.post('QQ音乐签到', '提示', '今日已签到');
        } else {
            $notification.post('QQ音乐签到', '失败', `错误码: ${checkinResult.code}`);
        }
        
    } catch (error) {
        console.log(`签到失败: ${error}`);
        $notification.post('QQ音乐签到', '失败', error.message || '网络错误');
    }
}

// ============================================
// 面板生成
// ============================================

function generatePanel() {
    const lastCheckin = $persistentStore.read('QQMusic_LastCheckin');
    const cookie = $persistentStore.read('QQMusic_Cookie');
    const today = new Date().toLocaleDateString('zh-CN');
    
    let content = '';
    let subtitle = '';
    let icon = 'music.note';
    let iconColor = '#007AFF';
    
    if (!cookie) {
        content = '❌ 未配置账号\n请先打开QQ音乐获取Cookie';
        subtitle = '未登录';
        icon = 'exclamationmark.triangle';
        iconColor = '#FF9500';
    } else if (lastCheckin === today) {
        content = '✅ 今日已签到\n下次签到: 明天 09:10';
        subtitle = '已签到';
        icon = 'checkmark.circle.fill';
        iconColor = '#34C759';
    } else {
        content = '⏰ 待签到\n自动签到时间: 09:10';
        subtitle = '待签到';
    }
    
    return {
        title: 'QQ音乐签到',
        content: content,
        subtitle: subtitle,
        icon: icon,
        'icon-color': iconColor
    };
}

// ============================================
// 路由分发
// ============================================

(function() {
    // 获取执行模式
    const hasRequest = typeof $request !== 'undefined';
    const argument = typeof $argument !== 'undefined' ? $argument : '';
    
    console.log(`QQ音乐插件启动 | 模式: ${hasRequest ? '请求' : '脚本'} | 参数: ${argument}`);
    
    if (hasRequest) {
        // Cookie获取模式
        handleCookieRequest();
    } else if (argument === 'panel') {
        // 面板模式
        $done(generatePanel());
    } else {
        // 签到模式（定时任务或手动触发）
        mainCheckin();
        $done();
    }
})();