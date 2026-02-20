const reqUrl = $request.url;

// 1. 基础过滤：匹配任何包含 029xxj.com 的 URL，不管它是 u1、u2 还是没前缀
if (!reqUrl || !/029xxj\.com/i.test(reqUrl) || !/\.(m3u8|mp4|ts)(\?|$)/i.test(reqUrl)) {
  $done({});
  return;
}

// 2. 提取视频身份证 (videoId)
// 我们取 /videos/ 后面那段哈希值，这才是视频的唯一标识
const videoIdMatch = reqUrl.match(/\/videos\/([^\/]+\/[^\/]+)/i);
const videoId = videoIdMatch ? videoIdMatch[1] : reqUrl.split('?')[0];

const cacheKey = "JAVDB_ACTIVE_ID";
const lastVideoId = $persistentStore.read(cacheKey);

// 3. 换片检测
if (lastVideoId === videoId) {
  $done({});
  return;
}

// 4. 更新缓存
$persistentStore.write(videoId, cacheKey);

// 5. Scheme 处理 (SenPlayer)
const scheme = ($argument.sch || "").trim();
const jumpUrl = scheme ? scheme + encodeURIComponent(reqUrl) : reqUrl;

// 6. 弹窗通知
$notification.post(
  "🎬 JavDB 捕获成功",
  "识别到新视频，点击跳转 SenPlayer",
  reqUrl,
  {
    "open-url": jumpUrl, // 兼容某些版本的 key
    "openUrl": jumpUrl,
    "clipboard": reqUrl
  }
);

$done({});
