/*
QQ音乐签到脚本 for Loon
支持多账号独立控制和持久化存储
*/

// 获取配置：优先从插件参数，其次从持久化存储
function getConfig() {
    const config = {};
    
    // 从插件参数获取
    if (typeof $argument !== 'undefined' && $argument) {
        $argument.split('&').forEach(item => {
            const [key, value] = item.split('=');
            if (key && value !== undefined) {
                config[key] = decodeURIComponent(value);
            }
        });
    }
    
    // 如果插件参数中Cookie为空，尝试从持久化存储读取
    for (let i = 1; i <= 4; i++) {
        const cookieKey = `qqmusic_cookie${i}`;
        const enableKey = `qqmusic_enable${i}`;
        
        if (!config[cookieKey] || !config[cookieKey].trim()) {
            const storedCookie = $persistentStore.read(cookieKey);
            const storedEnable = $persistentStore.read(enableKey);
            
            if (storedCookie) {
                config[cookieKey] = storedCookie;
                // 只有在插件参数中未设置时才使用存储的启用状态
                if (!config[enableKey]) {
                    config[enableKey] = storedEnable || 'false';
                }
            }
        }
    }
    
    return config;
}

// 主函数（保持不变，只修改配置获取方式）
(async () => {
    const config = getConfig();
    
    // 账号配置
    const accounts = [
        { 
            cookie: config.qqmusic_cookie1 || '', 
            enable: config.qqmusic_enable1 === 'true', 
            name: '账号1' 
        },
        { 
            cookie: config.qqmusic_cookie2 || '', 
            enable: config.qqmusic_enable2 === 'true', 
            name: '账号2' 
        },
        { 
            cookie: config.qqmusic_cookie3 || '', 
            enable: config.qqmusic_enable3 === 'true', 
            name: '账号3' 
        },
        { 
            cookie: config.qqmusic_cookie4 || '', 
            enable: config.qqmusic_enable4 === 'true', 
            name: '账号4' 
        }
    ];
    
    const notifyTitle = config.notify_title || 'QQ音乐签到';
    const testMode = config.test_mode === 'true';
    
    console.log(`QQ音乐签到开始，测试模式: ${testMode}`);
    console.log(`启用账号数: ${accounts.filter(a => a.enable && a.cookie.trim()).length}`);
    
    const results = [];
    let successCount = 0;
    
    for (const account of accounts) {
        if (!account.enable || !account.cookie.trim()) {
            console.log(`${account.name}: 未启用或Cookie为空`);
            continue;
        }
        
        console.log(`处理 ${account.name}...`);
        const result = await signIn(account.cookie, account.name, testMode);
        results.push(result);
        
        if (result.success) successCount++;
        
        // 请求间隔
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 发送通知
    if (results.length > 0) {
        let message = `✅ 成功: ${successCount}/${results.length}\n\n`;
        results.forEach((result, index) => {
            const icon = result.success ? '✅' : '❌';
            message += `${icon} ${result.account}: ${result.message}`;
            if (index < results.length - 1) message += '\n';
        });
        
        $notification.post(notifyTitle, '', message);
    } else {
        $notification.post(notifyTitle, '跳过', '没有启用的账号');
    }
    
    $done();
})();

// 签到函数（保持不变）
function signIn(cookie, accountName, testMode) {
    return new Promise(resolve => {
        if (testMode) {
            console.log(`[测试] ${accountName}: 模拟成功`);
            return resolve({
                account: accountName,
                success: true,
                message: '测试成功'
            });
        }
        
        // 计算 GTK
        const gtk = getGTK(cookie);
        const url = `https://c.y.qq.com/vip/task/sign?g_tk=${gtk}&_=${Date.now()}`;
        
        console.log(`${accountName}: 开始签到，GTK: ${gtk}`);
        
        $httpClient.get({
            url: url,
            headers: {
                'Cookie': cookie,
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
                'Referer': 'https://y.qq.com/',
                'Accept': 'application/json'
            }
        }, (error, response, data) => {
            if (error) {
                console.log(`${accountName}: 请求失败: ${error}`);
                resolve({
                    account: accountName,
                    success: false,
                    message: `请求失败`
                });
                return;
            }
            
            try {
                const result = JSON.parse(data);
                console.log(`${accountName}: 响应码: ${result.code}`);
                
                if (result.code === 0 || result.code === 200) {
                    const days = result.data?.signDays || result.data?.continuousDays || '未知';
                    const points = result.data?.awardPoints || 0;
                    
                    resolve({
                        account: accountName,
                        success: true,
                        message: `连续${days}天，+${points}积分`
                    });
                } else if (result.message?.includes('已签到') || result.msg?.includes('已签到')) {
                    const days = result.data?.signDays || result.data?.continuousDays || '未知';
                    resolve({
                        account: accountName,
                        success: true,
                        message: `已签到(连续${days}天)`
                    });
                } else {
                    resolve({
                        account: accountName,
                        success: false,
                        message: result.message || result.msg || `错误: ${result.code}`
                    });
                }
            } catch (e) {
                console.log(`${accountName}: 解析失败`);
                resolve({
                    account: accountName,
                    success: false,
                    message: '响应解析失败'
                });
            }
        });
    });
}

// 计算GTK（保持不变）
function getGTK(cookie) {
    const skeyMatch = cookie.match(/(?:p_)?skey=([^;]+)/);
    if (!skeyMatch) return '123456';
    
    const skey = skeyMatch[1];
    let hash = 5381;
    for (let i = 0; i < skey.length; i++) {
        hash += (hash << 5) + skey.charCodeAt(i);
    }
    return hash & 0x7fffffff;
}
