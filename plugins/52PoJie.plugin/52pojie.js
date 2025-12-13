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

// 签到函数
function signIn(cookie, accountName, testMode) {
    return new Promise(resolve => {
        if (testMode) {
            console.log(`[测试] ${account.name}: 模拟成功`);
            return resolve({
                account: accountName,
                success: true,
                message: '测试成功'
            });
        }
        
        // 我爱破解签到URL
        const url = 'https://www.52pojie.cn/plugin.php?id=dsu_paulsign:sign&operation=qiandao&infloat=1&sign_as=1&inajax=1';
        const formUrl = 'https://www.52pojie.cn/plugin.php?id=dsu_paulsign:sign&operation=qiandao&infloat=1';
        
        console.log(`${accountName}: 开始签到`);
        
        // 第一步：获取formhash
        $httpClient.get({
            url: formUrl,
            headers: {
                'Cookie': cookie,
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
                'Referer': 'https://www.52pojie.cn/',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        }, (error, response, data) => {
            if (error) {
                console.log(`${accountName}: 获取formhash失败: ${error}`);
                resolve({
                    account: accountName,
                    success: false,
                    message: '获取formhash失败'
                });
                return;
            }
            
            // 提取formhash
            const formhashMatch = data.match(/name="formhash" value="([^"]+)"/);
            if (!formhashMatch) {
                // 可能已经签到过了，检查签到状态
                if (data.includes('今日已签到') || data.includes('已经签到')) {
                    // 提取连续签到天数
                    const daysMatch = data.match(/已累计签到.*?(\d+).*?天/);
                    const days = daysMatch ? daysMatch[1] : '未知';
                    
                    console.log(`${accountName}: 今日已签到`);
                    resolve({
                        account: accountName,
                        success: true,
                        message: `已签到(连续${days}天)`
                    });
                    return;
                }
                
                console.log(`${accountName}: 未找到formhash，可能Cookie失效`);
                resolve({
                    account: accountName,
                    success: false,
                    message: 'Cookie可能失效，请重新获取'
                });
                return;
            }
            
            const formhash = formhashMatch[1];
            console.log(`${accountName}: 获取到formhash: ${formhash}`);
            
            // 第二步：提交签到
            const postData = `formhash=${formhash}&qdxq=kx&qdmode=1&todaysay=&fastreply=0`;
            
            $httpClient.post({
                url: url,
                headers: {
                    'Cookie': cookie,
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
                    'Referer': formUrl,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': '*/*',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: postData
            }, (error, response, data) => {
                if (error) {
                    console.log(`${accountName}: 签到提交失败: ${error}`);
                    resolve({
                        account: accountName,
                        success: false,
                        message: '提交签到失败'
                    });
                    return;
                }
                
                // 解析签到结果
                try {
                    console.log(`${accountName}: 签到响应: ${data.substring(0, 200)}...`);
                    
                    // 我爱破解的响应是HTML片段
                    if (data.includes('签到成功') || data.includes('恭喜你')) {
                        // 提取连续签到天数
                        const daysMatch = data.match(/(\d+)天/);
                        const days = daysMatch ? daysMatch[1] : '未知';
                        
                        // 提取奖励信息
                        let reward = '';
                        const rewardMatches = data.match(/获得奖励.*?(\d+).*?金钱/);
                        if (rewardMatches) {
                            reward = `+${rewardMatches[1]}金钱`;
                        }
                        
                        console.log(`${accountName}: 签到成功，连续${days}天`);
                        resolve({
                            account: accountName,
                            success: true,
                            message: `成功(连续${days}天${reward ? `, ${reward}` : ''})`
                        });
                    } else if (data.includes('今日已签到') || data.includes('已经签到')) {
                        const daysMatch = data.match(/(\d+)天/);
                        const days = daysMatch ? daysMatch[1] : '未知';
                        
                        console.log(`${accountName}: 今日已签到`);
                        resolve({
                            account: accountName,
                            success: true,
                            message: `已签到(连续${days}天)`
                        });
                    } else if (data.includes('未登录')) {
                        console.log(`${accountName}: Cookie失效`);
                        resolve({
                            account: accountName,
                            success: false,
                            message: 'Cookie失效，请重新获取'
                        });
                    } else {
                        console.log(`${accountName}: 签到失败，响应: ${data.substring(0, 100)}`);
                        resolve({
                            account: accountName,
                            success: false,
                            message: '签到失败，未知错误'
                        });
                    }
                } catch (e) {
                    console.log(`${accountName}: 解析响应失败: ${e}`);
                    resolve({
                        account: accountName,
                        success: false,
                        message: '响应解析失败'
                    });
                }
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
