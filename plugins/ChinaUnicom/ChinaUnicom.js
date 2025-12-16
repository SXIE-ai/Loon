// 中国联通签到脚本 for Loon
// 版本: 2.0.2 - 修复语法兼容性
// 作者: SXIE-ai

// === 用户配置区（手动修改这里）===
// 注意：使用 var 而不是 const 以确保兼容性

// 登录配置
var USER_CONFIG_loginUrl = "https://act.10010.com/SigninApp/login";
var USER_CONFIG_loginHeaders = {
    "Cookie": "ecs_token=eyJkYXRhIjoiYzhkYjRiOGNjYWJlNDYyYjg2MjkxYWJkZmZjZjFiZTQ0N2EwYmYzODc3YWUzYzJjYmU5ZjUyOWFhMmQxNjY2NDQzYTg1MmY5N2NmZDUyODQwOGVkYmJlYWQ1MjQ4YTEyYmRlMTlkMWI4Y2UyNGQzNmY5OGY0YTkzNDFlYWY1MDZiNGM2NzU3ZDRjOWE2Mzk1YjdmOWJjNmI3YWJkZDBkMjE4MmViZTg5NGZmODQ0NmQ4M2RmMWJjNjliZWZlNDk4YzcyNjFkZjE4OWZlMTNmMzliNDBjMGY4NDRlMmRiMGY4MDU1M2U4ZTViYTI2OTVjYTc3ZmU0MjY2OGE3MWU0NDUyYThlZWE0N2ZhMjVlZjU0ZDZjM2Y2YjczNjE2M2ZiMTE4MDI3MDFlNTkzZTRjZWJlNGE1MjJmYTA0NmMxNWM3MTkzYTRkN2E3YmY3MjJkOTE5NmEyMWQ3OTdlOWI5Zjc5NDY1MjMzNGM2NzgzNmQyOThkM2EwZjAxOTFiMzNkMzBkYzk1MjA0ZjY0N2EzNjQ3YjAxNzc2ODMzZjk3YTExMGEyMDE0ZmY4YTdhMjliZmNhYTEwMWJhMjFjYWM4NyIsInZlcnNpb24iOiIwMCJ9;t3_token=079161d6ccdbf793da6d26d4e62bff38;PvSessionId=20251216235313367BA4A3-D15D-4449-B7F8-DB209A9997E5;devicedId=367BA4A3-D15D-4449-B7F8-DB209A9997E5;cw_mutual=7064d003eb3c8934e769e430ecf3d64aa2eab2e201564032ff2e99be6d9dc5915cea2e60447b0cd01a4be5936f36624092f2ee1860f197effea41662eada20a5;login_type=06;c_mobile=18556734898;c_id=c8d5b5eb5a56fccebc49892cf6bf899d9ed00ff3314cacf1665d609fb0b8b36d;u_areaCode=;c_version=iphone_c@12.0801;channel=GGPD;wo_family=0;u_account=18556734898;city=034|450|90063345|-99;invalid_at=c22860e5e664936b33c57cc4ee0ec62a17a24e65040286d1a63989e9c9f1c1a4;ecs_acc=RDwx9SCYg/abxn1GmlfW6Xmr/Z5rrFY/bqzym1KTt3beNhfEHHZfORhwwYDSTYVa9K3WScJnglUAXR1tyvvjLALIvU1C29e9VUyt+n5CgVt4GJpmDmkOHzalVQ0RS/fb5jeLMJMw6ARSOQzgOgsHG8tBtvFZygwBLASZvxdioe8=;random_login=0;enc_acc=RDwx9SCYg/abxn1GmlfW6Xmr/Z5rrFY/bqzym1KTt3beNhfEHHZfORhwwYDSTYVa9K3WScJnglUAXR1tyvvjLALIvU1C29e9VUyt+n5CgVt4GJpmDmkOHzalVQ0RS/fb5jeLMJMw6ARSOQzgOgsHG8tBtvFZygwBLASZvxdioe8=;third_token=eyJkYXRhIjoiMzVmMTllNmYxMDJkZWM5OTcxM2JiZDJmMTYxOTIzZWNjZTFlMTg4NzA0ODE5ODU4MjE3YzdhZjM2OTZiOGNlM2U4NTYxYTE4YWJiYjJkODJlYWYzZWNiOTQxYzM2ZDVlNGM3MDU2YTFhZDlhMTgwNGZlYTU0NGI5MTdmNDBlZGY4YTgwMTI1NmNlZTk5MTU0OGY3NjZkNzlhNzJkMDMwOCIsInZlcnNpb24iOiIwMCJ9;",
    "User-Agent": "ChinaUnicom/7.4.0",
    "Content-Type": "application/x-www-form-urlencoded"
};

// 签到配置
var USER_CONFIG_signUrl = "https://act.10010.com/SigninApp/signin/daySign";
var USER_CONFIG_signHeaders = {
    "Cookie": "ecs_token=eyJkYXRhIjoiYzhkYjRiOGNjYWJlNDYyYjg2MjkxYWJkZmZjZjFiZTQ0N2EwYmYzODc3YWUzYzJjYmU5ZjUyOWFhMmQxNjY2NDQzYTg1MmY5N2NmZDUyODQwOGVkYmJlYWQ1MjQ4YTEyNGIwNDRmNTdhZTBkMjUzYmY0ZmE2MmUxYzNiZjk5NDZhYWY5NDRiNDZkMDMxOWNjY2RkYzNhM2EyNzVmYzliMzc5ZGVmZmM0M2M3Njc0YTE5OGVjMGRlNDU2ODEyYjA4YWU3ZmQ0OTM0NjM0OTdiNWZlOGE5OTUzOTAyZTg3YWE3YThiMWEyMTUyYjFiYWU4YTFkODZhNzI1Yzg5ZWRjMDUwODI4MDZiMGM2NGM2MmY5NjFiMTJkNjUzMzgyN2M5MDQ3MDdmMWEyMjQyZDFlMmYwMjgzZDVhOGEzZDIzYWQyNzY4M2Q0NTdkZmFjZGUxNDBhZTUxYTcyOTRjMWFkMWYxNzYxMmY2ZGMyMTVjZTUzYjhmOWRkYjQ5NzBkNzI3OWRhOWY1ZGRiODVmZDliNGRhMjI1MzZkNTFlZDc2MmVmMzAzYmM4YWEwMWRhMThkOTYwM2M0YmVhMTAzNTlhMiIsInZlcnNpb24iOiIwMCJ9",
    "Referer": "https://act.10010.com/SigninApp/signin/index",
    "User-Agent": "ChinaUnicom/7.4.0"
};

// 功能开关
var USER_CONFIG_enableSign = true;
var USER_CONFIG_enableLottery = true;
var USER_CONFIG_enableNotification = true;

// 将配置合并到主流程中使用的对象
var USER_CONFIG = {
    loginUrl: USER_CONFIG_loginUrl,
    loginHeaders: USER_CONFIG_loginHeaders,
    signUrl: USER_CONFIG_signUrl,
    signHeaders: USER_CONFIG_signHeaders,
    lotteryLoginUrl: USER_CONFIG_lotteryLoginUrl,
    lotteryLoginHeaders: USER_CONFIG_lotteryLoginHeaders,
    enableSign: USER_CONFIG_enableSign,
    enableLottery: USER_CONFIG_enableLottery,
    enableNotification: USER_CONFIG_enableNotification
};
// === 配置结束 ===

// 主配置对象
var CONFIG = {
    name: '中国联通签到',
    version: '2.0.2',
    author: 'SXIE-ai',
    defaults: {
        enableSign: true,
        enableLottery: true,
        enableNotification: true
    }
};

// 全局状态
var state = {
    signResult: null,
    lotteryResult: null,
    userInfo: null,
    lotteryToken: null,
    lotteryTimes: 0,
    lotteryList: [],
    errors: []
};

// 主函数
function main() {
    console.log('🚀 ' + CONFIG.name + ' v' + CONFIG.version + ' 开始执行');
    
    try {
        // 使用预定义的USER_CONFIG
        var config = USER_CONFIG;
        
        if (!validateConfig(config)) {
            return;
        }
        
        // 执行签到相关任务
        if (config.enableSign) {
            console.log('📝 开始签到任务');
            executeSignTasks(config).then(function() {
                // 执行抽奖任务
                if (config.enableLottery && config.lotteryLoginUrl) {
                    console.log('🎰 开始抽奖任务');
                    executeLotteryTasks(config).then(function() {
                        // 查询用户信息
                        console.log('📱 查询用户信息');
                        queryUserInfo(config).then(function() {
                            // 显示结果
                            showResults(config);
                        });
                    });
                } else {
                    // 查询用户信息
                    console.log('📱 查询用户信息');
                    queryUserInfo(config).then(function() {
                        // 显示结果
                        showResults(config);
                    });
                }
            });
        } else {
            // 直接显示结果
            showResults(config);
        }
        
    } catch (error) {
        console.error('❌ 主函数执行失败: ' + error);
        state.errors.push('主函数错误: ' + error.message);
        showErrorResults();
    }
}

// 验证配置
function validateConfig(config) {
    var errors = [];
    
    if (config.enableSign) {
        if (!config.loginUrl || !config.signUrl) {
            errors.push('签到需要配置loginUrl和signUrl');
        }
        if (!config.signHeaders || Object.keys(config.signHeaders).length === 0) {
            errors.push('需要配置签到Headers（包含Cookie）');
        }
    }
    
    if (errors.length > 0) {
        state.errors = errors;
        console.error('❌ 配置验证失败: ' + errors.join(', '));
        $notification.post(CONFIG.name, '配置错误', errors.join('\n'));
        return false;
    }
    
    return true;
}

// 执行签到任务（返回Promise）
function executeSignTasks(config) {
    return new Promise(function(resolve, reject) {
        try {
            // 1. 登录（如果需要）
            if (config.loginUrl && config.loginHeaders) {
                login(config.loginUrl, config.loginHeaders).then(function() {
                    // 2. 签到
                    sign(config.signUrl || 'https://act.10010.com/SigninApp/signin/daySign', config.signHeaders).then(function() {
                        resolve();
                    }).catch(function(error) {
                        console.error('❌ 签到失败: ' + error);
                        state.errors.push('签到失败: ' + error.message);
                        resolve(); // 继续执行其他任务
                    });
                }).catch(function(error) {
                    console.error('❌ 登录失败: ' + error);
                    state.errors.push('登录失败: ' + error.message);
                    // 尝试继续签到
                    sign(config.signUrl || 'https://act.10010.com/SigninApp/signin/daySign', config.signHeaders).then(function() {
                        resolve();
                    }).catch(function(signError) {
                        console.error('❌ 签到也失败: ' + signError);
                        resolve(); // 继续执行其他任务
                    });
                });
            } else {
                // 直接签到
                sign(config.signUrl || 'https://act.10010.com/SigninApp/signin/daySign', config.signHeaders).then(function() {
                    resolve();
                }).catch(function(error) {
                    console.error('❌ 签到失败: ' + error);
                    state.errors.push('签到失败: ' + error.message);
                    resolve(); // 继续执行其他任务
                });
            }
        } catch (error) {
            console.error('❌ 签到任务执行出错: ' + error);
            resolve(); // 继续执行其他任务
        }
    });
}

// 登录函数（返回Promise）
function login(url, headers) {
    return new Promise(function(resolve, reject) {
        var request = {
            url: url,
            headers: headers,
            timeout: 10
        };
        
        $httpClient.post(request, function(error, response, data) {
            if (error) {
                console.error('❌ 登录失败: ' + error);
                reject(error);
            } else {
                console.log('✅ 登录成功');
                resolve(data);
            }
        });
    });
}

// 签到函数（返回Promise）
function sign(url, headers) {
    return new Promise(function(resolve, reject) {
        // 处理URL
        var signUrl = url;
        if (signUrl.endsWith('.do')) {
            signUrl = signUrl.replace('.do', '');
        }
        
        var request = {
            url: signUrl,
            headers: headers,
            timeout: 10
        };
        
        $httpClient.post(request, function(error, response, data) {
            if (error) {
                console.error('❌ 签到请求失败: ' + error);
                reject(error);
            } else {
                try {
                    var result = JSON.parse(data);
                    console.log('✅ 签到响应: ' + JSON.stringify(result));
                    
                    state.signResult = result;
                    
                    if (result.status === '0000') {
                        console.log('✅ 签到成功，获得积分: ' + (result.data && result.data.prizeCount ? result.data.prizeCount : 0));
                    } else if (result.status === '0002') {
                        console.log('ℹ️ 今日已签到');
                    } else {
                        console.warn('⚠️ 签到失败: ' + (result.msg || result.status));
                    }
                    
                    resolve(result);
                } catch (e) {
                    console.error('❌ 解析签到结果失败: ' + e + ' 原始数据: ' + data);
                    reject(e);
                }
            }
        });
    });
}

// 执行抽奖任务（返回Promise）
function executeLotteryTasks(config) {
    return new Promise(function(resolve, reject) {
        try {
            // 1. 获取抽奖token
            getLotteryToken(config.lotteryLoginUrl, config.lotteryLoginHeaders).then(function(token) {
                state.lotteryToken = token;
                if (!token) {
                    console.log('⚠️ 未获取到抽奖token，跳过抽奖');
                    resolve();
                    return;
                }
                
                // 2. 获取抽奖次数
                getLotteryTimes(token, config.lotteryLoginHeaders).then(function(times) {
                    state.lotteryTimes = times;
                    console.log('🎰 可抽奖次数: ' + times);
                    
                    // 3. 执行抽奖
                    if (times > 0) {
                        var lotteryPromises = [];
                        for (var i = 0; i < times; i++) {
                            (function(index) {
                                lotteryPromises.push(
                                    doLottery(token, config.lotteryLoginHeaders).then(function(lotteryResult) {
                                        state.lotteryList.push(lotteryResult);
                                        return sleep(500); // 避免请求过快
                                    })
                                );
                            })(i);
                        }
                        
                        // 等待所有抽奖完成
                        Promise.all(lotteryPromises).then(function() {
                            console.log('✅ 完成 ' + times + ' 次抽奖');
                            resolve();
                        }).catch(function(error) {
                            console.error('❌ 部分抽奖失败: ' + error);
                            resolve(); // 继续执行
                        });
                    } else {
                        resolve();
                    }
                }).catch(function(error) {
                    console.error('❌ 获取抽奖次数失败: ' + error);
                    resolve(); // 继续执行
                });
            }).catch(function(error) {
                console.error('❌ 获取抽奖token失败: ' + error);
                resolve(); // 继续执行
            });
        } catch (error) {
            console.error('❌ 抽奖任务失败: ' + error);
            resolve(); // 继续执行
        }
    });
}

// 获取抽奖token（返回Promise）
function getLotteryToken(url, headers) {
    return new Promise(function(resolve, reject) {
        var request = {
            url: url,
            headers: headers,
            timeout: 10
        };
        
        $httpClient.get(request, function(error, response, data) {
            if (error) {
                console.error('❌ 获取抽奖token失败: ' + error);
                reject(error);
            } else {
                try {
                    // 从响应中提取encryptmobile
                    var tokenMatch = data.match(/encryptmobile=([^('|")]*)/);
                    if (tokenMatch && tokenMatch[1]) {
                        console.log('✅ 获取抽奖token成功');
                        resolve(tokenMatch[1]);
                    } else {
                        console.warn('⚠️ 未找到抽奖token');
                        resolve(null);
                    }
                } catch (e) {
                    console.error('❌ 解析抽奖token失败: ' + e);
                    reject(e);
                }
            }
        });
    });
}

// 获取抽奖次数（返回Promise）
function getLotteryTimes(token, headers) {
    return new Promise(function(resolve, reject) {
        var url = 'https://m.client.10010.com/dailylottery/static/findActivityInfo?encryptmobile=' + token;
        
        var request = {
            url: url,
            headers: headers,
            timeout: 10
        };
        
        $httpClient.get(request, function(error, response, data) {
            if (error) {
                console.error('❌ 获取抽奖次数失败: ' + error);
                reject(error);
            } else {
                try {
                    var result = JSON.parse(data);
                    if (result.acFrequency && result.acFrequency.usableAcFreq !== undefined) {
                        resolve(result.acFrequency.usableAcFreq);
                    } else {
                        console.warn('⚠️ 未找到抽奖次数信息: ' + JSON.stringify(result));
                        resolve(0);
                    }
                } catch (e) {
                    console.error('❌ 解析抽奖次数失败: ' + e);
                    reject(e);
                }
            }
        });
    });
}

// 执行抽奖（返回Promise）
function doLottery(token, headers) {
    return new Promise(function(resolve, reject) {
        var url = 'https://m.client.10010.com/dailylottery/static/doubleball/choujiang?usernumberofjsp=' + token;
        
        var request = {
            url: url,
            method: 'POST',
            headers: Object.assign({}, headers, {
                'Referer': 'https://m.client.10010.com/dailylottery/static/doubleball/firstpage?encryptmobile=' + token
            }),
            timeout: 10
        };
        
        $httpClient.post(request, function(error, response, data) {
            if (error) {
                console.error('❌ 抽奖请求失败: ' + error);
                reject(error);
            } else {
                try {
                    var result = JSON.parse(data);
                    console.log('🎯 抽奖结果: ' + (result.RspMsg || '未知'));
                    resolve(result);
                } catch (e) {
                    console.error('❌ 解析抽奖结果失败: ' + e);
                    reject(e);
                }
            }
        });
    });
}

// 查询用户信息（返回Promise）
function queryUserInfo(config) {
    return new Promise(function(resolve, reject) {
        try {
            if (!config.signHeaders || !config.signHeaders.Cookie) {
                console.log('⚠️ 无Cookie信息，跳过查询用户信息');
                resolve();
                return;
            }
            
            // 从Cookie中提取手机号
            var cookie = config.signHeaders.Cookie;
            var mobile = '';
            
            // 尝试多种方式获取手机号
            if (cookie.indexOf('u_account=') >= 0) {
                var match = cookie.match(/u_account=([^;]+)/);
                if (match) mobile = match[1];
            }
            
            if (!mobile && config.signHeaders.Referer) {
                var referer = config.signHeaders.Referer;
                if (referer.indexOf('desmobile=') >= 0) {
                    var refererMatch = referer.match(/desmobile=([^&]+)/);
                    if (refererMatch) mobile = refererMatch[1];
                }
            }
            
            if (!mobile) {
                console.log('⚠️ 无法获取手机号，跳过查询用户信息');
                resolve();
                return;
            }
            
            var url = 'https://m.client.10010.com/mobileService/home/queryUserInfoSeven.htm?version=iphone_c@7.0403&desmobiel=' + mobile + '&showType=3';
            
            var request = {
                url: url,
                headers: { "Cookie": config.signHeaders.Cookie },
                timeout: 10
            };
            
            $httpClient.get(request, function(error, response, data) {
                if (error) {
                    console.error('❌ 查询用户信息失败: ' + error);
                    resolve(); // 不阻止流程
                } else {
                    try {
                        var result = JSON.parse(data);
                        if (result.code === 'Y') {
                            state.userInfo = result;
                            console.log('✅ 查询用户信息成功');
                        } else {
                            console.warn('⚠️ 用户信息查询失败: ' + result.msg);
                        }
                        resolve();
                    } catch (e) {
                        console.error('❌ 解析用户信息失败: ' + e);
                        resolve(); // 不阻止流程
                    }
                }
            });
            
        } catch (error) {
            console.error('❌ 查询用户信息过程出错: ' + error);
            resolve(); // 不阻止流程
        }
    });
}

// 显示结果
function showResults(config) {
    var title = CONFIG.name;
    var subtitle = '';
    var body = '';
    
    // 签到结果
    if (state.signResult) {
        if (state.signResult.status === '0000') {
            subtitle = '签到成功';
            var data = state.signResult.data || {};
            body += '✅ 签到成功\n';
            body += '积分: +' + (data.prizeCount || 0) + '\n';
            body += '成长值: +' + (data.growthV || 0) + '\n';
            body += '鲜花: +' + (data.flowerCount || 0) + '\n';
        } else if (state.signResult.status === '0002') {
            subtitle = '今日已签到';
            body += 'ℹ️ 今日已签到\n';
        } else {
            subtitle = '签到失败';
            body += '❌ 签到失败: ' + (state.signResult.msg || state.signResult.status) + '\n';
        }
        body += '\n';
    }
    
    // 抽奖结果
    if (state.lotteryList.length > 0) {
        subtitle = subtitle ? subtitle + ' | 抽奖' : '抽奖完成';
        body += '🎰 抽奖完成 (' + state.lotteryList.length + '次):\n';
        for (var i = 0; i < state.lotteryList.length; i++) {
            body += (i + 1) + '. ' + (state.lotteryList[i].RspMsg || '未知') + '\n';
        }
        body += '\n';
    }
    
    // 用户信息
    if (state.userInfo && state.userInfo.data && state.userInfo.data.dataList) {
        body += '📱 账户信息:\n';
        for (var j = 0; j < state.userInfo.data.dataList.length; j++) {
            var item = state.userInfo.data.dataList[j];
            if (item && item.remainTitle && item.number !== undefined) {
                body += item.remainTitle + ': ' + item.number + (item.unit || '') + '\n';
            }
        }
    }
    
    // 错误信息
    if (state.errors.length > 0) {
        body += '\n⚠️ 错误信息:\n';
        for (var k = 0; k < state.errors.length; k++) {
            body += (k + 1) + '. ' + state.errors[k] + '\n';
        }
    }
    
    // 如果没有内容
    if (!body) {
        body = '无任务执行结果\n请检查配置是否正确';
    }
    
    // 发送通知
    if (config.enableNotification && typeof $notification !== 'undefined') {
        var finalSubtitle = subtitle || '执行完成';
        $notification.post(title, finalSubtitle, body);
    }
    
    // 输出到面板
    if (typeof $done !== 'undefined') {
        var panelTitle = subtitle ? title + ' - ' + subtitle : title;
        $done({
            title: panelTitle,
            content: body,
            icon: 'antenna.radiowaves.left.and.right'
        });
    }
}

// 显示错误结果
function showErrorResults() {
    var title = CONFIG.name;
    var subtitle = '执行失败';
    var body = '脚本执行过程中发生错误:\n\n';
    
    if (state.errors.length > 0) {
        for (var i = 0; i < state.errors.length; i++) {
            body += (i + 1) + '. ' + state.errors[i] + '\n';
        }
    } else {
        body += '未知错误，请查看日志\n';
    }
    
    body += '\n请检查:\n1. 网络连接\n2. Cookie是否有效\n3. 配置是否正确';
    
    if (typeof $notification !== 'undefined') {
        $notification.post(title, subtitle, body);
    }
    
    if (typeof $done !== 'undefined') {
        $done({
            title: title + ' - 错误',
            content: body,
            icon: 'exclamationmark.triangle',
            style: 'error'
        });
    }
}

// 工具函数
function sleep(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

// 兼容性处理：确保 Promise 存在
if (typeof Promise === 'undefined') {
    // 简单的 Promise polyfill
    function Promise(executor) {
        var self = this;
        self.status = 'pending';
        self.value = undefined;
        self.reason = undefined;
        self.onFulfilledCallbacks = [];
        self.onRejectedCallbacks = [];
        
        function resolve(value) {
            if (self.status === 'pending') {
                self.status = 'fulfilled';
                self.value = value;
                self.onFulfilledCallbacks.forEach(function(callback) {
                    callback(value);
                });
            }
        }
        
        function reject(reason) {
            if (self.status === 'pending') {
                self.status = 'rejected';
                self.reason = reason;
                self.onRejectedCallbacks.forEach(function(callback) {
                    callback(reason);
                });
            }
        }
        
        try {
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    }
    
    Promise.prototype.then = function(onFulfilled, onRejected) {
        var self = this;
        return new Promise(function(resolve, reject) {
            if (self.status === 'fulfilled') {
                try {
                    var result = onFulfilled ? onFulfilled(self.value) : self.value;
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            } else if (self.status === 'rejected') {
                if (onRejected) {
                    try {
                        var result = onRejected(self.reason);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(self.reason);
                }
            } else {
                self.onFulfilledCallbacks.push(function(value) {
                    try {
                        var result = onFulfilled ? onFulfilled(value) : value;
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                });
                
                if (onRejected) {
                    self.onRejectedCallbacks.push(function(reason) {
                        try {
                            var result = onRejected(reason);
                            resolve(result);
                        } catch (error) {
                            reject(error);
                        }
                    });
                } else {
                    self.onRejectedCallbacks.push(function(reason) {
                        reject(reason);
                    });
                }
            }
        });
    };
    
    Promise.all = function(promises) {
        return new Promise(function(resolve, reject) {
            var results = [];
            var completed = 0;
            
            if (promises.length === 0) {
                resolve(results);
                return;
            }
            
            for (var i = 0; i < promises.length; i++) {
                (function(index) {
                    promises[index].then(function(value) {
                        results[index] = value;
                        completed++;
                        
                        if (completed === promises.length) {
                            resolve(results);
                        }
                    }).catch(function(error) {
                        reject(error);
                    });
                })(i);
            }
        });
    };
}

// 执行主函数
main();
