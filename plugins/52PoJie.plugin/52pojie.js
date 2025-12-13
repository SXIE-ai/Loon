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
        if (testMode) {
            console.log(`[测试] ${accountName}: 模拟成功`);
            return resolve({
                account: accountName,
                success: true,
                message: '测试成功'
            });
        }
        
        const formUrl = 'https://www.52pojie.cn/plugin.php?id=dsu_paulsign:sign&operation=qiandao&infloat=1';
        const signUrl = 'https://www.52pojie.cn/plugin.php?id=dsu_paulsign:sign&operation=qiandao&infloat=1&sign_as=1&inajax=1';
        
        console.log(`${accountName}: 开始签到流程`);
        
        // 直接获取formhash并提交（简化流程）
        $httpClient.get({
            url: formUrl,
            headers: {
                'Cookie': cookie,
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
                'Referer': 'https://www.52pojie.cn/'
            }
        }, (error, response, data) => {
            if (error) {
                resolve({
                    account: accountName,
                    success: false,
                    message: '网络请求失败'
                });
                return;
            }
            
            // 直接搜索formhash（不依赖编码）
            let formhash = '';
            const hashMatch = data.match(/name="formhash" value="([^"]+)"/);
            if (hashMatch) {
                formhash = hashMatch[1];
            } else if (data.includes('今日已签到')) {
                // 已经签到
                resolve({
                    account: accountName,
                    success: true,
                    message: '今日已签到'
                });
                return;
            } else if (data.includes('请先登录')) {
                // Cookie失效
                resolve({
                    account: accountName,
                    success: false,
                    message: 'Cookie失效'
                });
                return;
            }
            
            if (!formhash) {
                resolve({
                    account: accountName,
                    success: false,
                    message: '获取formhash失败'
                });
                return;
            }
            
            console.log(`${accountName}: 获取formhash: ${formhash}`);
            
            // 提交签到
            $httpClient.post({
                url: signUrl,
                headers: {
                    'Cookie': cookie,
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
                    'Referer': formUrl,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `formhash=${formhash}&qdxq=kx&qdmode=1&todaysay=&fastreply=0`
            }, (error, response, signData) => {
                if (error) {
                    resolve({
                        account: accountName,
                        success: false,
                        message: '提交失败'
                    });
                    return;
                }
                
                // 简单判断响应
                console.log(`${accountName}: 签到响应长度: ${signData.length}`);
                
                // 即使乱码，也可以通过一些特征判断
                const successKeywords = ['签到成功', '恭喜', '成功', 'qiandao'];
                const alreadyKeywords = ['已签到', '已经签到', '重复'];
                const failKeywords = ['未登录', '请登录', 'formhash'];
                
                let resultMsg = '未知状态';
                let success = false;
                
                // 检查响应内容（即使乱码也可能包含某些关键词）
                const checkData = signData.toLowerCase();
                
                if (alreadyKeywords.some(keyword => checkData.includes(keyword.toLowerCase()))) {
                    resultMsg = '今日已签到';
                    success = true;
                } 
                else if (successKeywords.some(keyword => signData.includes(keyword))) {
                    resultMsg = '签到成功';
                    success = true;
                }
                else if (failKeywords.some(keyword => checkData.includes(keyword.toLowerCase()))) {
                    resultMsg = '签到失败，请检查Cookie';
                    success = false;
                }
                else {
                    // 默认情况：如果响应有内容且不是错误信息，假设成功
                    if (signData.length > 50 && !signData.includes('error')) {
                        resultMsg = '签到成功（疑似）';
                        success = true;
                    } else {
                        resultMsg = '签到失败，响应异常';
                        success = false;
                    }
                }
                
                resolve({
                    account: accountName,
                    success: success,
                    message: resultMsg
                });
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
