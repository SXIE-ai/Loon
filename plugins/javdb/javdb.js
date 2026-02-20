const reqUrl = $request.url;
if (!reqUrl) {
  $done({});
  return;
}

// 1. 基础过滤
if (!/u1\.029xxj\.com/i.test(reqUrl) || !/\.(m3u8|mp4|ts)(\?|$)/i.test(reqUrl)) {
  $done({});
  return;
}

/**
 * 2. 提取视频唯一核心特征 (去重关键)
 * 从 URL 中提取类似 /videos/e9/e95dae1bd.../ 这部分，忽略具体的 seg-5.ts 和 sign 参数
 */
const videoIdMatch = reqUrl.match(/\/videos\/.*?\//i);
const videoId = videoIdMatch ? videoIdMatch[0] : reqUrl.split('?')[0];

const cacheKey = "JAVDB_ACTIVE_ID";
const lastVideoId = $persistentStore.read(cacheKey);

// 3. 换片逻辑判断
if (lastVideoId === videoId) {
  // 如果还是同一个视频的切片，直接静默退出，不发通知
  $done({});
  return;
}

// 4. 发现是新视频（或切回了旧视频），更新持久化数据并通知
$persistentStore.write(videoId, cacheKey);

// Scheme 处理
const scheme = ($argument.sch || "").trim();
const jumpUrl = scheme
  ? scheme + encodeURIComponent(reqUrl)
  : reqUrl;

// 5. 发送通知
$notification.post(
  "🎬 JavDB 捕获到视频",
  "点击跳转播放器 (已识别换片)",
  reqUrl,
  {
    openUrl: jumpUrl,
    clipboard: reqUrl
  }
);

$done({});
