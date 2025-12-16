// 中国联通签到脚本 for Loon
// 版本: 2.0.3 - 简化稳定版
// 作者: SXIE-ai

// ==================== 用户配置区 ====================
// 请在此处填写你的配置信息

var USER_CONFIG = {
    // 登录配置（可选）
    loginUrl: "https://act.10010.com/SigninApp/login",
    loginHeaders: {
        "Cookie": "在此处填入你的Cookie",
        "User-Agent": "ChinaUnicom/7.4.0",
        "Content-Type": "application/x-www-form-urlencoded"
    },
    
    // 签到配置（必需）
    signUrl: "https://act.10010.com/SigninApp/signin/daySign",
    signHeaders: {
        "Cookie": "在此处填入你的Cookie",
        "Referer": "https://act.10010.com/SigninApp/signin/index",
        "User-Agent": "ChinaUnicom/7.4.0"
    },
    
    // 抽奖配置（可选）
    lotteryLoginUrl: "https://m.client.10010.com/dailylottery/static/doubleball/firstpage",
    lotteryLoginHeaders: {
        "Cookie": "在此处填入你的Cookie",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)"
    },
    
    // 功能开关
    enableSign: true,
    enableLottery: false,  // 默认为false，需要时手动开启
    enableNotification: true
};
// ==================== 配置结束 ====================

// 主函数
function main() {
    console.log("🚀 中国联通签到脚本开始执行");
    
    try {
        var config = USER_CONFIG;
        
        // 验证配置
        if (!validateConfig(config)) {
            return;
        }
        
        // 执行任务
        executeTasks(config);
        
    } catch (error) {
        console.error("❌ 脚本执行失败: " + error);
        showError("脚本执行失败: " + error.message);
    }
}

// 验证配置
function validateConfig(config) {
    var errors = [];
    
    if (config.enableSign) {
        if (!config.signUrl) {
            errors.push("签到URL未配置");
        }
        if (!config.signHeaders || !config.signHeaders.Cookie) {
            errors.push("签到Cookie未配置");
        }
    }
    
    if (config.enableLottery && (!config.lotteryLoginUrl || !config.lotteryLoginHeaders)) {
        console.warn("⚠️ 抽奖配置不完整，将跳过抽奖");
        config.enableLottery = false;
    }
    
    if (errors.length > 0) {
        showError("配置错误:\n" + errors.join("\n"));
        return false;
    }
    
    return true;
}

// 执行所有任务
function executeTasks(config) {
    var results = {
        sign: null,
        lottery: null,
        userInfo: null,
        errors: []
    };
    
    // 1. 签到
    if (config.enableSign) {
        console.log("📝 执行签到任务");
        signTask(config, results);
    } else {
        // 只查询用户信息
        console.log("📱 查询用户信息");
        getUserInfo(config, results);
    }
}

// 签到任务
function signTask(config, results) {
    var signUrl = config.signUrl;
    if (signUrl.endsWith(".do")) {
        signUrl = signUrl.replace(".do", "");
    }
    
    var request = {
        url: signUrl,
        headers: config.signHeaders,
        timeout: 10
    };
    
    $httpClient.post(request, function(error, response, data) {
        if (error) {
            console.error("❌ 签到请求失败: " + error);
            results.errors.push("签到失败: " + error);
            // 继续尝试获取用户信息
            getUserInfo(config, results);
            return;
        }
        
        try {
            var result = JSON.parse(data);
            results.sign = result;
            console.log("✅ 签到响应: " + JSON.stringify(result));
            
            // 2. 如果需要抽奖
            if (config.enableLottery) {
                console.log("🎰 执行抽奖任务");
                lotteryTask(config, results);
            } else {
                // 3. 获取用户信息
                console.log("📱 查询用户信息");
                getUserInfo(config, results);
            }
        } catch (e) {
            console.error("❌ 解析签到结果失败: " + e);
            results.errors.push("解析签到结果失败");
            getUserInfo(config, results);
        }
    });
}

// 抽奖任务
function lotteryTask(config, results) {
    // 先获取抽奖token
    var tokenRequest = {
        url: config.lotteryLoginUrl,
        headers: config.lotteryLoginHeaders,
        timeout: 10
    };
    
    $httpClient.get(tokenRequest, function(error, response, data) {
        if (error) {
            console.error("❌ 获取抽奖token失败: " + error);
            results.errors.push("抽奖token获取失败");
            getUserInfo(config, results);
            return;
        }
        
        // 提取encryptmobile
        var tokenMatch = data.match(/encryptmobile=([^('|")]*)/);
        if (!tokenMatch || !tokenMatch[1]) {
            console.warn("⚠️ 未找到抽奖token");
            results.errors.push("未找到抽奖token");
            getUserInfo(config, results);
            return;
        }
        
        var encryptmobile = tokenMatch[1];
        console.log("✅ 获取到抽奖token: " + encryptmobile);
        
        // 执行一次抽奖
        var lotteryUrl = "https://m.client.10010.com/dailylottery/static/doubleball/choujiang?usernumberofjsp=" + encryptmobile;
        var lotteryHeaders = Object.assign({}, config.lotteryLoginHeaders, {
            "Referer": "https://m.client.10010.com/dailylottery/static/doubleball/firstpage?encryptmobile=" + encryptmobile
        });
        
        var lotteryRequest = {
            url: lotteryUrl,
            method: "POST",
            headers: lotteryHeaders,
            timeout: 10
        };
        
        $httpClient.post(lotteryRequest, function(lotteryError, lotteryResponse, lotteryData) {
            if (lotteryError) {
                console.error("❌ 抽奖失败: " + lotteryError);
                results.errors.push("抽奖失败");
            } else {
                try {
                    var lotteryResult = JSON.parse(lotteryData);
                    results.lottery = lotteryResult;
                    console.log("🎯 抽奖结果: " + (lotteryResult.RspMsg || "未知"));
                } catch (e) {
                    console.error("❌ 解析抽奖结果失败: " + e);
                }
            }
            
            // 获取用户信息
            getUserInfo(config, results);
        });
    });
}

// 获取用户信息
function getUserInfo(config, results) {
    if (!config.signHeaders || !config.signHeaders.Cookie) {
        console.log("⚠️ 无Cookie信息，跳过查询用户信息");
        showFinalResults(config, results);
        return;
    }
    
    // 从Cookie提取手机号
    var cookie = config.signHeaders.Cookie;
    var mobile = "";
    
    if (cookie.indexOf("u_account=") >= 0) {
        var match = cookie.match(/u_account=([^;]+)/);
        if (match) mobile = match[1];
    }
    
    if (!mobile && config.signHeaders.Referer) {
        var referer = config.signHeaders.Referer;
        if (referer.indexOf("desmobile=") >= 0) {
            var refererMatch = referer.match(/desmobile=([^&]+)/);
            if (refererMatch) mobile = refererMatch[1];
        }
    }
    
    if (!mobile) {
        console.log("⚠️ 无法获取手机号，跳过查询用户信息");
        showFinalResults(config, results);
        return;
    }
    
    var infoUrl = "https://m.client.10010.com/mobileService/home/queryUserInfoSeven.htm?version=iphone_c@7.0403&desmobiel=" + mobile + "&showType=3";
    var infoRequest = {
        url: infoUrl,
        headers: { "Cookie": config.signHeaders.Cookie },
        timeout: 10
    };
    
    $httpClient.get(infoRequest, function(error, response, data) {
        if (error) {
            console.error("❌ 查询用户信息失败: " + error);
        } else {
            try {
                var infoResult = JSON.parse(data);
                if (infoResult.code === "Y") {
                    results.userInfo = infoResult;
                    console.log("✅ 查询用户信息成功");
                }
            } catch (e) {
                console.error("❌ 解析用户信息失败: " + e);
            }
        }
        
        showFinalResults(config, results);
    });
}

// 显示最终结果
function showFinalResults(config, results) {
    var title = "中国联通签到";
    var subtitle = "";
    var content = "";
    
    // 签到结果
    if (results.sign) {
        var signData = results.sign;
        if (signData.status === "0000") {
            subtitle = "签到成功";
            var data = signData.data || {};
            content += "✅ 签到成功\n";
            content += "积分: +" + (data.prizeCount || 0) + "\n";
            content += "成长值: +" + (data.growthV || 0) + "\n";
            content += "鲜花: +" + (data.flowerCount || 0) + "\n\n";
        } else if (signData.status === "0002") {
            subtitle = "今日已签到";
            content += "ℹ️ 今日已签到\n\n";
        } else {
            subtitle = "签到失败";
            content += "❌ 签到失败: " + (signData.msg || signData.status) + "\n\n";
        }
    }
    
    // 抽奖结果
    if (results.lottery) {
        var lotteryMsg = results.lottery.RspMsg || "未知";
        content += "🎰 抽奖结果: " + lotteryMsg + "\n\n";
    }
    
    // 用户信息
    if (results.userInfo && results.userInfo.data && results.userInfo.data.dataList) {
        content += "📱 账户信息:\n";
        var dataList = results.userInfo.data.dataList;
        for (var i = 0; i < dataList.length; i++) {
            var item = dataList[i];
            if (item && item.remainTitle && item.number !== undefined) {
                content += item.remainTitle + ": " + item.number + (item.unit || "") + "\n";
            }
        }
        content += "\n";
    }
    
    // 错误信息
    if (results.errors.length > 0) {
        content += "⚠️ 遇到的问题:\n";
        for (var j = 0; j < results.errors.length; j++) {
            content += (j + 1) + ". " + results.errors[j] + "\n";
        }
    }
    
    // 如果没有内容
    if (!content) {
        content = "无执行结果\n请检查配置是否正确";
    }
    
    // 发送通知
    if (config.enableNotification && typeof $notification !== 'undefined') {
        $notification.post(title, subtitle || "执行完成", content);
    }
    
    // 输出到面板
    if (typeof $done !== 'undefined') {
        $done({
            title: title + (subtitle ? " - " + subtitle : ""),
            content: content,
            icon: "antenna.radiowaves.left.and.right"
        });
    }
}

// 显示错误
function showError(message) {
    console.error("❌ " + message);
    
    if (typeof $notification !== 'undefined') {
        $notification.post("中国联通签到", "错误", message);
    }
    
    if (typeof $done !== 'undefined') {
        $done({
            title: "中国联通签到 - 错误",
            content: message,
            icon: "exclamationmark.triangle",
            style: "error"
        });
    }
}

// 执行主函数
main();
