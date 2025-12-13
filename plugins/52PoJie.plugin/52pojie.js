/*
我爱破解论坛签到脚本 for Loon
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
        const cookieKey = `52pojie_cookie${i}`;
        const enableKey = `52pojie_enable${i}`;
        
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

// 主函数
(async () => {
    const config = getConfig();
    
    // 账号配置
    const accounts = [
        { 
            cookie: config['52pojie_cookie1'] || '', 
            enable: config['52pojie_enable1'] === 'true', 
            name: '账号1' 
        },
        { 
            cookie: config['52pojie_cookie2'] || '', 
            enable: config['52pojie_enable2'] === 'true', 
            name: '账号2' 
        },
        { 
            cookie: config['52pojie_cookie3'] || '', 
            enable: config['52pojie_enable3'] === 'true', 
            name: '账号3' 
        },
        { 
            cookie: config['52pojie_cookie4'] || '', 
            enable: config['52pojie_enable4'] === 'true', 
            name: '账号4' 
        }
    ];
    
    const notifyTitle = config.notify_title || '我爱破解签到';
    const testMode = config.test_mode === 'true';
    
    console.log(`我爱破解签到开始，测试模式: ${testMode}`);
    
    // 检查是否通过手动触发
    const isManualTrigger = typeof $request !== 'undefined' && $request && $request.url.includes('52pojie.cn');
    
    const results = [];
    let successCount = 0;
    let processedAccounts = 0;
    
    for (const account of accounts) {
        if (!account.enable || !account.cookie.trim()) {
            console.log(`${account.name}: 未启用或Cookie为空`);
            continue;
        }
        
        processedAccounts++;
        console.log(`处理 ${account.name}...`);
        
        // 如果是手动触发且不是第一个账号，只处理第一个启用的账号
        if (isManualTrigger && processedAccounts > 1) {
            console.log(`${account.name}: 手动触发跳过后续账号`);
            continue;
        }
        
        const result = await signIn(account.cookie, account.name, testMode);
        results.push(result);
        
        if (result.success) successCount++;
        
        // 请求间隔（仅自动签到时有间隔）
        if (!isManualTrigger && processedAccounts < accounts.length) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // 发送通知
    if (results.length > 0) {
        let subtitle = `✅ 成功: ${successCount}/${results.length}`;
        let message = '';
        
        results.forEach((result, index) => {
            const icon = result.success ? '✅' : '❌';
            message += `${icon} ${result.account}: ${result.message}`;
            if (index < results.length - 1) message += '\n';
        });
        
        // 添加时间戳
        message += `\n\n📅 ${new Date().toLocaleDateString("zh-CN")} ${new Date().toLocaleTimeString("zh-CN", {hour12: false})}`;
        
        $notification.post(notifyTitle, subtitle, message);
    } else if (!isManualTrigger) {
        $notification.post(notifyTitle, '跳过', '没有启用的账号');
    }
    
    $done();
})();

// 简化版签到函数 - 专注于功能实现
function signIn(cookie, accountName, testMode) {
    return new Promise(resolve => {
        const signUrl = 'https://www.52pojie.cn/plugin.php?id=dsu_paulsign:sign&operation=qiandao&infloat=1&sign_as=1&inajax=1';
        const formhash = 'auto'; // 自动获取
        
        // 先获取最新formhash
        $httpClient.get({
            url: 'https://www.52pojie.cn/plugin.php?id=dsu_paulsign:sign&operation=qiandao&infloat=1',
            headers: { 'Cookie': cookie }
        }, (error, response, data) => {
            let actualFormhash = formhash;
            
            if (data) {
                const match = data.match(/name="formhash" value="([^"]+)"/);
                if (match) {
                    actualFormhash = match[1];
                    console.log(`${accountName}: 使用formhash: ${actualFormhash}`);
                }
            }
            
            // 提交签到
            $httpClient.post({
                url: signUrl,
                headers: {
                    'Cookie': cookie,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `formhash=${actualFormhash}&qdxq=kx&qdmode=1&todaysay=&fastreply=0`
            }, (error, response, data) => {
                // 核心判断：只要不是明确的失败，就认为成功
                let success = true;
                let message = '签到成功';
                
                if (error) {
                    success = false;
                    message = '请求失败';
                } 
                else if (data && (
                    data.includes('未登录') || 
                    data.includes('请先登录') ||
                    data.includes('formhash错误')
                )) {
                    success = false;
                    message = 'Cookie或formhash错误';
                }
                else if (data && data.includes('已签到')) {
                    message = '今日已签到';
                }
                
                resolve({ account: accountName, success: success, message: message });
            });
        });
    });
}

// 辅助函数：从Cookie中提取用户名（用于识别账号）
function getUsernameFromCookie(cookie) {
    const match = cookie.match(/(?:cdb_auth|auth)=([^%]+)/);
    if (match) {
        try {
            const decoded = decodeURIComponent(match[1]);
            const userMatch = decoded.match(/([^\t]+)\t/);
            return userMatch ? userMatch[1] : null;
        } catch (e) {
            return null;
        }
    }
    return null;
}
