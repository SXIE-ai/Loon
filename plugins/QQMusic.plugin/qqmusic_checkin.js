/*
QQ音乐签到脚本 - Loon兼容版本
支持多账号，每个账号独立控制开关
使用方法：在插件参数中填写Cookie并开启对应开关
*/

// 工具函数：从插件参数读取配置
function getArg(key, defaultValue = "") {
    if (typeof $argument !== "undefined" && $argument) {
        const args = {};
        $argument.split('&').forEach(arg => {
            const [k, v] = arg.split('=');
            if (k && v !== undefined) {
                args[k] = decodeURIComponent(v);
            }
        });
        return args[key] !== undefined ? args[key] : defaultValue;
    }
    return defaultValue;
}

// 工具函数：读取持久化存储
function readStore(key) {
    return $persistentStore.read(key);
}

// 工具函数：写入持久化存储
function writeStore(key, value) {
    return $persistentStore.write(key, value);
}

// 主函数
(async () => {
    // 从插件参数获取配置
    const notifyTitle = getArg("notify_title", "QQ音乐签到通知");
    const testMode = getArg("test_mode") === "true";
    
    // 账号配置
    const accounts = [
        { 
            cookie: getArg("qqmusic_cookie1"), 
            enable: getArg("qqmusic_enable1") === "true", 
            name: "账号1" 
        },
        { 
            cookie: getArg("qqmusic_cookie2"), 
            enable: getArg("qqmusic_enable2") === "true", 
            name: "账号2" 
        },
        { 
            cookie: getArg("qqmusic_cookie3"), 
            enable: getArg("qqmusic_enable3") === "true", 
            name: "账号3" 
        },
        { 
            cookie: getArg("qqmusic_cookie4"), 
            enable: getArg("qqmusic_enable4") === "true", 
            name: "账号4" 
        }
    ];
    
    console.log(`开始执行QQ音乐签到，启用账号数: ${accounts.filter(a => a.enable && a.cookie).length}`);
    
    let allResults = [];
    let successCount = 0;
    
    for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i];
        
        if (!account.enable || !account.cookie || account.cookie.trim() === "") {
            console.log(`${account.name}: 未启用或Cookie为空，跳过`);
            continue;
        }
        
        console.log(`开始处理 ${account.name}...`);
        const result = await checkin(account.cookie, account.name, i + 1, testMode);
        allResults.push(result);
        
        if (result.success) {
            successCount++;
        }
        
        // 避免请求过快
        if (i < accounts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // 发送汇总通知
    if (allResults.length > 0) {
        sendSummaryNotification(allResults, successCount, notifyTitle);
    } else {
        console.log("没有启用的账号");
        $notification.post("QQ音乐签到", "跳过", "没有启用的账号");
    }
    
    $done();
})();

// 签到函数
async function checkin(cookie, accountName, accountIndex, testMode) {
    const timestamp = Date.now();
    const gtk = calculateGTK(cookie);
    const url = `https://c.y.qq.com/vip/task/sign?g_tk=${gtk}&_=${timestamp}`;
    
    console.log(`${accountName}: 开始签到，GTK: ${gtk}`);
    
    try {
        if (testMode) {
            console.log(`[测试模式] ${accountName}: 模拟请求，不实际签到`);
            return {
                account: accountName,
                success: true,
                message: "测试模式 - 模拟成功",
                days: "测试",
                points: "测试"
            };
        }
        
        const headers = {
            "Cookie": cookie,
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
            "Referer": "https://y.qq.com/",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "zh-CN,zh-Hans;q=0.9"
        };
        
        const requestOptions = {
            url: url,
            headers: headers
        };
        
        return new Promise((resolve) => {
            $httpClient.get(requestOptions, function(error, response, data) {
                if (error) {
                    console.log(`${accountName}: 请求失败: ${error}`);
                    resolve({
                        account: accountName,
                        success: false,
                        message: `请求失败: ${error}`
                    });
                    return;
                }
                
                if (response.status === 200) {
                    try {
                        const jsonData = JSON.parse(data);
                        console.log(`${accountName}: 响应数据: ${JSON.stringify(jsonData)}`);
                        
                        if (jsonData.code === 0 || jsonData.code === 200) {
                            const days = jsonData.data?.signDays || jsonData.data?.continuousDays || "未知";
                            const points = jsonData.data?.awardPoints || jsonData.data?.point || 0;
                            
                            console.log(`${accountName}: 签到成功！连续签到 ${days} 天，获得 ${points} 积分`);
                            
                            resolve({
                                account: accountName,
                                success: true,
                                message: "签到成功",
                                days: days,
                                points: points
                            });
                        } else {
                            console.log(`${accountName}: 签到失败，错误码: ${jsonData.code}, 信息: ${jsonData.message || jsonData.msg}`);
                            
                            // 判断是否已签到
                            const msg = jsonData.message || jsonData.msg || "";
                            if (msg.includes("已签到") || msg.includes("重复") || jsonData.code === -3001) {
                                const days = jsonData.data?.signDays || jsonData.data?.continuousDays || "未知";
                                resolve({
                                    account: accountName,
                                    success: true,
                                    message: "今日已签到",
                                    days: days,
                                    points: 0
                                });
                            } else {
                                resolve({
                                    account: accountName,
                                    success: false,
                                    message: `失败: ${msg || `错误码 ${jsonData.code}`}`
                                });
                            }
                        }
                    } catch (e) {
                        console.log(`${accountName}: JSON解析失败: ${e}, 原始数据: ${data.substring(0, 200)}`);
                        resolve({
                            account: accountName,
                            success: false,
                            message: `数据解析失败`
                        });
                    }
                } else {
                    console.log(`${accountName}: 请求失败，状态码: ${response.status}`);
                    resolve({
                        account: accountName,
                        success: false,
                        message: `HTTP错误: ${response.status}`
                    });
                }
            });
        });
        
    } catch (error) {
        console.log(`${accountName}: 发生异常: ${error}`);
        return {
            account: accountName,
            success: false,
            message: `异常: ${error.message}`
        };
    }
}

// 计算g_tk（从Cookie中提取）
function calculateGTK(cookie) {
    // 尝试从cookie中获取p_skey或skey
    const pskeyMatch = cookie.match(/p_skey=([^;]+)/);
    const skeyMatch = cookie.match(/skey=([^;]+)/);
    const qmKeystrMatch = cookie.match(/qm_keystr=([^;]+)/);
    
    let key = "";
    if (pskeyMatch && pskeyMatch[1]) {
        key = pskeyMatch[1];
    } else if (skeyMatch && skeyMatch[1]) {
        key = skeyMatch[1];
    } else if (qmKeystrMatch && qmKeystrMatch[1]) {
        key = qmKeystrMatch[1];
    }
    
    if (!key) {
        console.log("未找到有效的key，使用默认值");
        return "123456";
    }
    
    // QQ的GTK算法
    let hash = 5381;
    for (let i = 0; i < key.length; i++) {
        hash += (hash << 5) + key.charCodeAt(i);
    }
    const result = hash & 0x7fffffff;
    console.log(`计算GTK: key=${key.substring(0, 5)}..., hash=${result}`);
    return result;
}

// 发送汇总通知
function sendSummaryNotification(results, successCount, notifyTitle) {
    let subtitle = `成功: ${successCount}/${results.length}`;
    let message = "";
    
    results.forEach((result, index) => {
        const status = result.success ? "✅" : "❌";
        let detail = `${status} ${result.account}: `;
        
        if (result.success) {
            if (result.message === "今日已签到") {
                detail += `今日已签到 (连续${result.days}天)`;
            } else if (result.message.includes("测试模式")) {
                detail += `测试成功`;
            } else {
                detail += `成功 (连续${result.days}天, +${result.points}积分)`;
            }
        } else {
            detail += result.message;
        }
        
        message += (index > 0 ? "\n" : "") + detail;
    });
    
    message += `\n\n📅 ${new Date().toLocaleDateString("zh-CN")} ${new Date().toLocaleTimeString("zh-CN", {hour12: false})}`;
    
    console.log(`发送通知: ${subtitle}`);
    $notification.post(notifyTitle, subtitle, message);
}
