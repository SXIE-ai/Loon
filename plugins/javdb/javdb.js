// 1. 安全获取变量
const reqUrl = (typeof $request !== "undefined") ? $request.url : null;
const arg = (typeof $argument !== "undefined") ? $argument : "";

// 基础过滤
if (!reqUrl || !/029xxj\.com/i.test(reqUrl) || !/\.(m3u8|mp4|ts)(\?|$)/i.test(reqUrl)) {
  $done({});
  return;
}

// 2. 去重逻辑 (防止 ts 切片刷屏)
const videoIdMatch = reqUrl.match(/\/videos\/([^\/]+\/[^\/]+)/i);
const videoId = videoIdMatch ? videoIdMatch[1] : reqUrl.split('?')[0].replace(/seg-\d+/i, "");
const cacheKey = "JAVDB_ACTIVE_ID";
const lastVideoId = $persistentStore.read(cacheKey);

if (lastVideoId === videoId) {
  $done({});
  return;
}
$persistentStore.write(videoId, cacheKey);

// 3. 【核心修复】：参考墨鱼架构解析 Loon 插件参数
let playerCode = "SenPlayer"; // 默认代码
let customScheme = "";

if (typeof arg === 'string' && arg.startsWith('[') && arg.endsWith(']')) {
    // 自动剥离 [SenPlayer, , auto] 这种格式
    const inner = arg.slice(1, -1);
    const parts = inner.split(',').map(s => s.trim());
    if (parts[0]) playerCode = parts[0];     // 获取选中的播放器名
    if (parts[1]) customScheme = parts[1];   // 获取自定义 Scheme
}

// 4. 构建跳转 URL
let jumpUrl = reqUrl;

// 如果有自定义 Scheme 优先使用
if (customScheme && customScheme !== "") {
    jumpUrl = customScheme + encodeURIComponent(reqUrl);
} else {
    // 根据选择的播放器生成 Scheme
    const lowCode = playerCode.toLowerCase();
    if (lowCode.includes("senplayer")) {
        // SenPlayer 专用播放接口
        jumpUrl = "SenPlayer://x-callback-url/play?url=" + encodeURIComponent(reqUrl);
    } else if (lowCode.includes("iina")) {
        jumpUrl = "iina://weblink?url=" + encodeURIComponent(reqUrl);
    } else if (lowCode.includes("infuse")) {
        jumpUrl = "infuse://x-callback-url/play?url=" + encodeURIComponent(reqUrl);
    } else if (lowCode.includes("fileball")) {
        jumpUrl = "filebox://play?url=" + encodeURIComponent(reqUrl);
    }
}

// 5. 发送通知
$notification.post(
  "🎬 JavDB 捕获成功",
  "已识别播放器: " + playerCode,
  reqUrl,
  {
    "openUrl": jumpUrl,
    "clipboard": reqUrl
  }
);

$done({});
