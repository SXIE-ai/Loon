if ($request.url.indexOf(pingme_url) >= 0) {
  const LogName = '【PingMe】';
  
  // 1. 提取请求头
  const headers = $request.headers;
  const cookie = headers['Cookie'] || headers['cookie'];
  const token = headers['Authorization'] || headers['authorization'] || headers['token'];

  // 2. 准备存入的数据
  if (cookie || token) {
    let isCookieSuccess = false;
    let isTokenSuccess = false;

    // 如果有 Cookie，写入本地 chavy_cookie_pingme
    if (cookie) {
      isCookieSuccess = $prefs.setValueForKey(cookie, pingme_key);
    }
    // 如果有 Token (Authorization)，写入本地 chavy_token_pingme
    if (token) {
      isTokenSuccess = $prefs.setValueForKey(token, pingme_token_key);
    }

    // 3. 触发系统通知
    if (isCookieSuccess || isTokenSuccess) {
      $notify(LogName, '🎉 成功获取 PingMe 凭证', '数据已成功锁定到本地，请前往定时任务运行签到！');
      console.log(`${LogName} 抓取成功!\nCookie: ${cookie}\nToken: ${token}`);
    } else {
      console.log(`${LogName} 抓取到了数据，但通过 $prefs 写入本地失败`);
    }
  } else {
    console.log(`${LogName} 触发了重写，但 Headers 里面没有发现有效的 Cookie 或 Token`);
  }
}
