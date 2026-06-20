// 核心提取：PingMe 提取 Cookie 逻辑
if ($request && $request.url.indexOf("pingmeapp.net") != -1) {
    // 1. 检查请求头里是否存在 Authorization 或者 token、Cookie
    const LogName = "【PingMe 获取 Cookie】";
    const auth = $request.headers["Authorization"] || $request.headers["authorization"] || $request.headers["token"];
    const cookie = $request.headers["Cookie"] || $request.headers["cookie"];
    
    let targetCookie = "";
    
    if (auth) {
        targetCookie = auth;
    } else if (cookie) {
        targetCookie = cookie;
    }

    if (targetCookie) {
        // 2. 将提取到的凭证持久化写入 Quantumult X / Loon 的本地存储
        // 风木之源通常会定义一个统一的写入 key，比如 "fmz_pingme_cookie"
        const saveKey = "fmz_pingme_cookie"; 
        const isSuccess = $prefs.setValueForKey(targetCookie, saveKey); // 圈X底层写入
        
        if (isSuccess) {
            $notify(LogName, "🎉成功获取 PingMe 凭证", "数据已成功锁定到本地，可以去运行签到脚本了！");
            console.log(`${LogName} 成功抓取到数据: ${targetCookie}`);
        } else {
            console.log(`${LogName} 抓取到了数据但写入本地失败`);
        }
    } else {
        console.log(`${LogName} 触发了重写，但请求头里没有找到有效的 Token 或 Cookie`);
    }
}

