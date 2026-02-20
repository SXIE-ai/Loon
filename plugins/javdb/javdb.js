// 1. 安全获取变量
const reqUrl = (typeof $request !== "undefined") ? $request.url : null;
// 2. 这里的兼容性修改确保能读到你插件页设置的 SenPlayer
const arg = (typeof $argument !== "undefined") ? $argument : "";

// 基础过滤
if (!reqUrl || !/029xxj\.com/i.test(reqUrl) || !/\.(m3u8|mp4|ts)(\?|$)/i.test(reqUrl)) {
  $done({});
  return;
}

// 3. 【解决通知多】：提取视频 ID 进行去重
// 只要路径中的视频哈希值没变，就不再重复弹窗
const videoIdMatch = reqUrl.match(/\/videos\/([^\/]+\/[^\/]+)/i);
const videoId = videoIdMatch ? videoIdMatch[1] : reqUrl.split('?')[0].replace(/seg-\d+/i, "");

const cacheKey = "JAVDB_ACTIVE_ID";
const lastVideoId = $persistentStore.read(cacheKey);

if (lastVideoId === videoId) {
  $done({});
  return;
}
$persistentStore.write(videoId, cacheKey);

// 4. 【解决跳转问题】：手动匹配播放器 Scheme
let jumpUrl = reqUrl;
// 如果你在插件页选了 SenPlayer，Loon 会传入包含 SenPlayer 字样的参数
if (arg.indexOf("SenPlayer") !== -1 || arg.indexOf("senplayer://") !== -1) {
    jumpUrl = "senplayer://" + encodeURIComponent(reqUrl);
}

// 5. 发送通知
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
