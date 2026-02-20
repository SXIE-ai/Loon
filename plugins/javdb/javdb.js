// 1. 安全获取变量
const reqUrl = (typeof $request !== "undefined") ? $request.url : null;
const arg = (typeof $argument !== "undefined") ? $argument : "";

// 2. 核心逻辑：我们只要 m3u8，不要 ts 碎片
if (!reqUrl || !/029xxj\.com/i.test(reqUrl) || !/\.m3u8(\?|$)/i.test(reqUrl)) {
    // 如果是 .ts 请求，静默放行，不弹通知，不干扰播放器
    $done({});
    return;
}

// 3. 去重逻辑 (防止同一个 m3u8 反复弹窗)
const videoId = reqUrl.split('?')[0]; 
const cacheKey = "JAVDB_ACTIVE_M3U8";
const lastUrl = $persistentStore.read(cacheKey);

if (lastUrl === videoId) {
    $done({});
    return;
}
$persistentStore.write(videoId, cacheKey);

// 4. 解析参数并构建 SenPlayer 跳转链接
let playerCode = "SenPlayer";
let customScheme = "";

if (typeof arg === 'string' && arg.startsWith('[') && arg.endsWith(']')) {
    const inner = arg.slice(1, -1);
    const parts = inner.split(',').map(s => s.trim());
    if (parts[0]) playerCode = parts[0];
    if (parts[1]) customScheme = parts[1];
}

let jumpUrl = reqUrl;
if (customScheme) {
    jumpUrl = customScheme + encodeURIComponent(reqUrl);
} else if (playerCode.toLowerCase().includes("senplayer")) {
    // 使用标准的 SenPlayer 播放协议
    jumpUrl = "SenPlayer://x-callback-url/play?url=" + encodeURIComponent(reqUrl);
}

// 5. 发送通知
$notification.post(
  "🎬 JavDB 完整资源捕获",
  "已锁定 m3u8 索引，点击开始播放",
  reqUrl,
  {
    "openUrl": jumpUrl,
    "clipboard": reqUrl
  }
);

$done({});
