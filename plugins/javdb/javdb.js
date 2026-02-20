// 1. 安全获取变量
const reqUrl = (typeof $request !== "undefined") ? $request.url : null;
const arg = (typeof $argument !== "undefined") ? $argument : "";

// 基础过滤
if (!reqUrl || !/029xxj\.com/i.test(reqUrl) || !/\.(m3u8|mp4|ts)(\?|$)/i.test(reqUrl)) {
  $done({});
  return;
}

// 2. 去重逻辑
const videoIdMatch = reqUrl.match(/\/videos\/([^\/]+\/[^\/]+)/i);
const videoId = videoIdMatch ? videoIdMatch[1] : reqUrl.split('?')[0].replace(/seg-\d+/i, "");
const cacheKey = "JAVDB_ACTIVE_ID";
const lastVideoId = $persistentStore.read(cacheKey);

if (lastVideoId === videoId) {
  $done({});
  return;
}
$persistentStore.write(videoId, cacheKey);

// 3. 【精准修复跳转】：解析 select 选中的播放器
let jumpUrl = reqUrl;
// 如果插件页选了 SenPlayer，arg 里通常会包含 player=SenPlayer 或者直接是 SenPlayer
if (arg.indexOf("SenPlayer") !== -1) {
    // 强制跳转 SenPlayer
    jumpUrl = "senplayer://" + encodeURIComponent(reqUrl);
} else if (arg.indexOf("iina") !== -1) {
    jumpUrl = "iina://weblink?url=" + encodeURIComponent(reqUrl);
} else if (arg.indexOf("infuse") !== -1) {
    jumpUrl = "infuse://x-callback-url/play?url=" + encodeURIComponent(reqUrl);
}

// 4. 发送通知
$notification.post(
  "🎬 JavDB 捕获成功",
  "已识别新视频，点击跳转播放器",
  reqUrl,
  {
    "openUrl": jumpUrl,
    "clipboard": reqUrl
  }
);

$done({});
